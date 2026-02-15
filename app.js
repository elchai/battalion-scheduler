// ==================== SETTINGS ====================
const DEFAULT_SETTINGS = {
    adminName: 'אלחי פיין',
    password: '1875',
    shiftPresets: {
        morning:   { name: 'בוקר',    start: '06:00', end: '14:00' },
        afternoon: { name: 'צהריים',  start: '14:00', end: '22:00' },
        night:     { name: 'לילה',    start: '22:00', end: '06:00' },
        fullday:   { name: 'יום שלם', start: '00:00', end: '23:59' }
    },
    rotationDaysIn: 10,
    rotationDaysOut: 4,
    sheetId: '1JedoEvaQyHtNVYF7lwJwNSV0lu8e97k2kwCJuSRaGTE'
};

let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

function loadSettings() {
    const saved = localStorage.getItem('battalionSettings');
    if (saved) {
        const parsed = JSON.parse(saved);
        settings = { ...JSON.parse(JSON.stringify(DEFAULT_SETTINGS)), ...parsed };
        if (parsed.shiftPresets) settings.shiftPresets = { ...DEFAULT_SETTINGS.shiftPresets, ...parsed.shiftPresets };
    }
}

function saveSettings() {
    localStorage.setItem('battalionSettings', JSON.stringify(settings));
    if (typeof firebaseSaveSettings === 'function') firebaseSaveSettings();
}

function isAdmin() {
    return currentUser && currentUser.name === settings.adminName;
}

function canEdit(compKey) {
    if (!currentUser) return false;
    if (isAdmin()) return true;
    if (currentUser.unit === 'gdudi') return true;
    return currentUser.unit === compKey;
}

function canView(compKey) {
    if (!currentUser) return false;
    if (currentUser.unit === 'gdudi') return true;
    return currentUser.unit === compKey;
}

// ==================== LOGIN ====================
let currentUser = null;

function doLogin() {
    const name = document.getElementById('loginName').value.trim();
    const unit = document.getElementById('loginUnit').value;
    const password = document.getElementById('loginPassword').value;

    if (!name) {
        document.getElementById('loginError').textContent = 'יש להזין שם';
        document.getElementById('loginError').classList.add('show');
        return;
    }
    if (!unit) {
        document.getElementById('loginError').textContent = 'יש לבחור מסגרת';
        document.getElementById('loginError').classList.add('show');
        return;
    }
    if (password !== settings.password) {
        document.getElementById('loginError').textContent = 'סיסמה שגויה, נסה שוב';
        document.getElementById('loginError').classList.add('show');
        return;
    }

    currentUser = { name, unit };
    sessionStorage.setItem('battalionUser', JSON.stringify(currentUser));
    document.getElementById('loginError').classList.remove('show');
    activateApp();
}

function doLogout() {
    sessionStorage.removeItem('battalionUser');
    currentUser = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').style.display = 'none';
    document.getElementById('loginName').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginUnit').value = '';
}

function activateApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').style.display = '';

    const unitMap = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם', gdudi:'גדודי'};
    document.getElementById('userBadge').textContent = currentUser.name + ' | ' + unitMap[currentUser.unit];
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) sidebarUser.textContent = currentUser.name;

    applyUnitFilter();

    // Set calendar filter to user's company
    const calFilter = document.getElementById('calCompanyFilter');
    if (calFilter && currentUser.unit !== 'gdudi') {
        calFilter.value = currentUser.unit;
    }

    // Auto-switch to the relevant tab
    if (currentUser.unit !== 'gdudi') {
        switchTab(currentUser.unit);
    } else {
        switchTab('all');
    }

    // Close sidebar on mobile after login
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    }
}

function applyUnitFilter() {
    const unit = currentUser.unit;
    const isGdudi = unit === 'gdudi';

    // Show/hide sidebar items based on access level
    document.querySelectorAll('.sidebar-item.tab-all').forEach(el => el.style.display = isGdudi ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-a').forEach(el => el.style.display = (isGdudi || unit === 'a') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-b').forEach(el => el.style.display = (isGdudi || unit === 'b') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-c').forEach(el => el.style.display = (isGdudi || unit === 'c') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-d').forEach(el => el.style.display = (isGdudi || unit === 'd') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-hq').forEach(el => el.style.display = (isGdudi || unit === 'hq') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-palsam').forEach(el => el.style.display = (isGdudi || unit === 'palsam') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-calendar').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-reports').forEach(el => el.style.display = isGdudi ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-rotation').forEach(el => el.style.display = isGdudi ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-weapons').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = isAdmin() ? '' : 'none');
    const isCompanyCommander = ['a','b','c','d'].includes(unit);
    document.querySelectorAll('.sidebar-item.tab-commander').forEach(el => el.style.display = (isGdudi || isCompanyCommander) ? '' : 'none');

    // Hide section labels if all items in section are hidden
    document.querySelectorAll('.sidebar-section-label').forEach(label => {
        let next = label.nextElementSibling;
        let hasVisible = false;
        while (next && !next.classList.contains('sidebar-section-label')) {
            if (next.classList.contains('sidebar-item') && next.style.display !== 'none') hasVisible = true;
            next = next.nextElementSibling;
        }
        label.style.display = hasVisible ? '' : 'none';
    });
}

// Sidebar toggle
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    if (window.innerWidth <= 768) {
        const isOpen = sidebar.classList.contains('open');
        if (isOpen) {
            closeSidebarMobile();
        } else {
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.classList.add('sidebar-open');
        }
    } else {
        sidebar.classList.toggle('collapsed');
        document.getElementById('topbar').classList.toggle('expanded');
        document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('expanded'));
        const footer = document.querySelector('.app-footer');
        if (footer) footer.style.marginRight = sidebar.classList.contains('collapsed') ? '0' : '260px';
    }
}

function closeSidebarMobile() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.remove('open');
    overlay.classList.remove('active');
    document.body.classList.remove('sidebar-open');
}

// Swipe-to-close sidebar on mobile
(function() {
    let touchStartX = 0;
    let touchStartY = 0;
    let swiping = false;

    document.addEventListener('touchstart', function(e) {
        const sidebar = document.getElementById('sidebar');
        if (!sidebar || !sidebar.classList.contains('open')) return;
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        swiping = true;
    }, { passive: true });

    document.addEventListener('touchend', function(e) {
        if (!swiping) return;
        swiping = false;
        const sidebar = document.getElementById('sidebar');
        if (!sidebar || !sidebar.classList.contains('open')) return;
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const deltaX = touchEndX - touchStartX;
        const deltaY = Math.abs(touchEndY - touchStartY);
        // Swipe right to close (RTL layout)
        if (deltaX > 60 && deltaY < 100) {
            closeSidebarMobile();
        }
    }, { passive: true });
})();

// Check for existing session
function checkSession() {
    const saved = sessionStorage.getItem('battalionUser');
    if (saved) {
        currentUser = JSON.parse(saved);
        activateApp();
        return true;
    }
    return false;
}

// Enter key support on login
document.getElementById('loginPassword').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
});
document.getElementById('loginName').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('loginUnit').focus();
});

// ==================== DATA ====================
const companyData = {
    a: {
        name: 'פלוגה א', location: 'מבוא חורון', color: 'var(--pluga-a)', colorClass: 'company-a',
        tasks: [
            { name: 'חפ"ק (מ"פ+נהג+קשר)', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 2 } },
            { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'הגנת מחנה', soldiers: 9, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
            { name: 'חמ"ל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 0, commanders: 0, officers: 0, shifts: 0, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 10, commanders: 1, officers: 1, shifts: 1, perShift: { soldiers: 10, commanders: 1, officers: 1 } },
            { name: 'ש"ג', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
        ],
        totals: { soldiers: 35, commanders: 4, officers: 2 }
    },
    b: {
        name: 'פלוגה ב', location: '443', color: 'var(--pluga-b)', colorClass: 'company-b',
        tasks: [
            { name: 'חפ"ק (מ"פ+נהג+קשר)', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 2 } },
            { name: 'מחסום בל', soldiers: 12, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'מחסום מכבים', soldiers: 13, commanders: 2, officers: 2, shifts: 2, perShift: { soldiers: 6, commanders: 1, officers: 1 } },
            { name: 'חמ"ל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 0, commanders: 0, officers: 0, shifts: 0, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 10, commanders: 1, officers: 1, shifts: 1, perShift: { soldiers: 10, commanders: 1, officers: 1 } }
        ],
        totals: { soldiers: 42, commanders: 6, officers: 4 }
    },
    c: {
        name: 'פלוגה ג', location: 'חשמונאים', color: 'var(--pluga-c)', colorClass: 'company-c',
        tasks: [
            { name: 'חפ"ק (מ"פ+נהג+קשר)', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 2 } },
            { name: 'סיור דרום', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'סיור צפון', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'הגנת מחנה', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
            { name: 'של"ז', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'חמ"ל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 0, commanders: 0, officers: 0, shifts: 0, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 10, commanders: 1, officers: 1, shifts: 1, perShift: { soldiers: 10, commanders: 1, officers: 1 } },
            { name: 'ש"ג', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'פטרול רגלי 24:00-06:00', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } }
        ],
        totals: { soldiers: 41, commanders: 7, officers: 2 }
    },
    d: {
        name: 'פלוגה ד', location: 'עתודה', color: 'var(--pluga-d)', colorClass: 'company-d',
        tasks: [
            { name: 'חפ"ק (מ"פ+נהג+קשר)', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 2 } },
            { name: 'מחסום מכבים', soldiers: 7, commanders: 1, officers: 1, shifts: 1, perShift: { soldiers: 6, commanders: 1, officers: 1 } },
            { name: 'של"ז', soldiers: 2, commanders: 0, officers: 0, shifts: 2, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'חמ"ל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 0, commanders: 0, officers: 0, shifts: 0, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'בונקר', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'הגנת מחנה', soldiers: 9, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 20, commanders: 2, officers: 2, shifts: 1, perShift: { soldiers: 20, commanders: 2, officers: 2 } }
        ],
        totals: { soldiers: 48, commanders: 3, officers: 4 }
    },
    hq: {
        name: 'חפ"ק מג"ד/סמג"ד', location: 'מפקדה', color: '#607D8B', colorClass: 'company-hq',
        tasks: [],
        totals: { soldiers: 0, commanders: 0, officers: 0 }
    },
    palsam: {
        name: 'פלס"ם', location: 'פלוגת סיוע מנהלתי', color: '#795548', colorClass: 'company-palsam',
        tasks: [
            { name: 'מטבח', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'שמירה', soldiers: 5, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'ארמו"ן', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'נהיגה', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'חפ"ק רפואי', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'תורנות', soldiers: 5, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'ניידת טנ"א', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'ניידת לוגיסטית', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
            { name: 'משימת ת"ש', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } }
        ],
        totals: { soldiers: 45, commanders: 0, officers: 0 }
    }
};

// State
let state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [] };

// Calendar state
let calendarWeekOffset = 0;

// Search & filter state per company
let searchState = {};
let equipmentFilter = 'all';
let weaponsFilter = 'all';

function getSearchState(compKey) {
    if (!searchState[compKey]) searchState[compKey] = { query: '', filter: 'all' };
    return searchState[compKey];
}

function loadState() {
    const saved = localStorage.getItem('battalionState_v2');
    if (saved) state = JSON.parse(saved);
    if (!state.rotationGroups) state.rotationGroups = [];
    if (!state.equipment) state.equipment = [];
    if (!state.signatureLog) state.signatureLog = [];
    if (!state.weaponsData) state.weaponsData = [];

    // One-time migration: clear shifts and equipment assignments
    if (!localStorage.getItem('migration_clear_v1')) {
        state.shifts = [];
        state.signatureLog = [];
        state.equipment.forEach(e => {
            delete e.holderId;
            delete e.holderName;
            delete e.holderPhone;
            delete e.signatureData;
        });
        localStorage.setItem('migration_clear_v1', '1');
        saveState();
    }

    seedTestSoldier();
}

function seedTestSoldier() {
    const TEST_ID = 'sol_test_israel';
    if (state.soldiers.find(s => s.id === TEST_ID)) return;
    // Add ישראל ישראלי as a test soldier in חפ"ק
    state.soldiers.push({
        id: TEST_ID,
        name: 'ישראל ישראלי',
        personalId: '1234567',
        phone: '0501234567',
        company: 'hq',
        unit: 'חפ"ק מג"ד',
        role: 'לוחם',
        rank: 'טוראי'
    });
    // Pre-fill weapons form data with all details from the example form
    state.weaponsData.push({
        soldierId: TEST_ID,
        firstName: 'ישראל',
        lastName: 'ישראלי',
        idNumber: '123456789',
        personalNum: '1234567',
        birthYear: '1975',
        fatherName: 'יעקב',
        phone: '0501234567',
        phone2: '0521234567',
        address: 'הרצל 10',
        city: 'חיפה',
        rank: 'טוראי',
        role: 'לוחם',
        healthAnswers: {
            q1: 'no', q2: 'no', q3: 'no', q4: 'no', q5: 'no',
            q6: 'no', q7: 'no', q8: 'no', q9: 'no', q10: 'no',
            q11: 'no', q12: 'no', q13: 'no', q14: 'no', q15: 'no',
            q16: 'no', q17: 'no', q18: 'no', q19: 'no', q20: 'no'
        },
        healthSig: null,
        waiverSig: null,
        requestSig: null,
        cmdSig: null,
        cmdName: '',
        cmdRank: '',
        cmdId: '',
        cmdRole: '',
        weaponType: 'M-16',
        weaponSerial: '',
        idPhoto: null,
        date: new Date().toISOString().split('T')[0]
    });
    saveState();
}

function saveState() {
    localStorage.setItem('battalionState_v2', JSON.stringify(state));
    if (typeof firebaseSaveState === 'function') firebaseSaveState();
}

// ==================== INIT ====================
// Google Sheets config
function getSheetUrls() {
    const base = `https://docs.google.com/spreadsheets/d/${settings.sheetId}/gviz/tq?tqx=out:csv`;
    return {
        support: base,
        a: base + '&sheet=' + encodeURIComponent('פלוגה א'),
        b: base + '&sheet=' + encodeURIComponent('פלוגה ב'),
        c: base + '&sheet=' + encodeURIComponent('פלוגה ג'),
        d: base + '&sheet=' + encodeURIComponent('פלוגה ד')
    };
}
const ALL_COMPANIES = ['a','b','c','d','hq','palsam'];

const deptToCompany = {
    'חפ"ק מג"ד': 'hq',
    'לשכה': 'hq',
    'מחלקת משא"ן': 'palsam',
    'מפקדת הפלס"ם': 'palsam',
    'פלגת הספקה': 'palsam',
    'פלגת הפינוי': 'palsam',
    'פלגת טנ"א': 'palsam',
    'פלגת רפואה': 'palsam'
};

async function init() {
    loadSettings();
    loadState();
    loadTasksFromStorage();
    loadTheme();

    // Load from Firebase if available (async, then re-render)
    if (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && typeof firebaseLoadState === 'function') {
        try {
            const loaded = await firebaseLoadState();
            if (loaded) {
                await firebaseLoadSettings();
                await firebaseLoadTasks();
                setupRealtimeListeners();
            }
        } catch (err) {
            console.warn('Firebase init load failed:', err);
        }
    }

    // Force re-sync if data version changed (multi-sheet support)
    const dataVersion = 'v4_allsheets_fix';
    if (localStorage.getItem('battalionDataVersion') !== dataVersion) {
        state.soldiers = state.soldiers.filter(s => !s.fromSheets);
        localStorage.setItem('battalionDataVersion', dataVersion);
        syncFromGoogleSheets(true);
    } else if (state.soldiers.length === 0) {
        syncFromGoogleSheets(true);
    }
    renderAll();
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('shiftDate').value = today;
    document.getElementById('leaveStart').value = today;
    document.getElementById('rotGroupStartDate').value = today;
    const d4 = new Date(); d4.setDate(d4.getDate() + 4);
    document.getElementById('leaveEnd').value = d4.toISOString().split('T')[0];
    updateShiftOptions();
    checkSession();

    // Register Service Worker for PWA
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}

function renderAll() {
    renderOverview();
    renderDashboard();
    ALL_COMPANIES.forEach(renderCompanyTab);
    renderRotationTab();
    updateGlobalStats();
    updateNotifications();
}

// ==================== GOOGLE SHEETS SYNC ====================
function syncFromGoogleSheets(silent) {
    if (!silent) showToast('מסנכרן מגוגל שיטס...', 'success');

    const fetches = Object.entries(getSheetUrls()).map(([key, url]) =>
        fetch(url).then(r => r.text()).then(csv => ({ key, csv }))
    );

    Promise.all(fetches).then(results => {
        const manualSoldiers = state.soldiers.filter(s => !s.fromSheets);
        let sheetSoldiers = [];

        results.forEach(({ key, csv }) => {
            if (key === 'support') {
                const parsed = parseSupportSheet(csv);
                console.log(`Sheet support: ${parsed.length} soldiers`);
                sheetSoldiers.push(...parsed);
            } else {
                const parsed = parseCombatSheet(csv, key);
                console.log(`Sheet ${key}: ${parsed.length} soldiers`);
                sheetSoldiers.push(...parsed);
            }
        });

        state.soldiers = [...manualSoldiers, ...sheetSoldiers];
        // Log per-company counts
        const counts = {};
        ALL_COMPANIES.forEach(k => { counts[k] = state.soldiers.filter(s => s.company === k).length; });
        console.log('Soldiers per company:', counts);
        updateCompanyTotals();
        saveState();
        renderAll();
        if (!silent) showToast(`סונכרנו ${sheetSoldiers.length} חיילים מגוגל שיטס`, 'success');
    }).catch(err => {
        console.error('Sync error:', err);
        if (!silent) showToast('שגיאה בסנכרון - בדוק חיבור אינטרנט', 'error');
    });
}

// Parse support sheet (פלס"ם + חפ"ק) - columns: מספר אישי, שם, טלפון, מחלקה, תפקיד, ארוחה, וידוא הגעה
function parseSupportSheet(csv) {
    const lines = csv.split('\n');
    const soldiers = [];
    for (let i = 1; i < lines.length; i++) {
        const f = parseCSVLine(lines[i]);
        if (f.length < 5) continue;
        const id = f[0].trim();
        const name = f[1].trim();
        if (!name || !id) continue;
        const dept = f[3].trim();
        if (!dept) continue;
        const company = deptToCompany[dept] || 'palsam';
        const existing = state.soldiers.find(s => s.personalId === id && s.fromSheets);
        soldiers.push({
            id: existing ? existing.id : 'sol_' + id + '_' + Math.random().toString(36).substr(2,4),
            name, personalId: id,
            phone: f[2] ? '0' + f[2].trim() : '',
            company, unit: dept,
            role: f[4].trim() || 'לוחם',
            rank: '', fromSheets: true,
            arrival: (f[6] || '').trim()
        });
    }
    return soldiers;
}

// Parse combat company sheet - columns: מספר אישי, שם, טלפון, ארוחה, צו, מחלקה, סגל/מתאמן, תפקיד, הסמכה, וידוא הגעה
function parseCombatSheet(csv, companyKey) {
    const lines = csv.split('\n');
    const soldiers = [];
    const compNames = { a: 'פלוגה א', b: 'פלוגה ב', c: 'פלוגה ג', d: 'פלוגה ד' };
    for (let i = 1; i < lines.length; i++) {
        const f = parseCSVLine(lines[i]);
        if (f.length < 8) continue;
        const id = f[0].trim();
        const name = f[1].trim();
        if (!name || !id) continue;
        if (/^\d+$/.test(name)) continue;

        const order = f[4].trim();
        const arrival = (f[9] || '').trim();
        if (order !== 'יצא' && arrival !== 'מגיע') continue;

        const section = f[5].trim();
        const staffType = f[6].trim();
        const role = f[7].trim();
        const cert = f[8].trim();

        const unitLabel = section ? `מחלקה ${section}` : (staffType === 'סגל' ? 'סגל' : compNames[companyKey]);
        const existing = state.soldiers.find(s => s.personalId === id && s.fromSheets);
        soldiers.push({
            id: existing ? existing.id : 'sol_' + id + '_' + Math.random().toString(36).substr(2,4),
            name, personalId: id,
            phone: f[2] ? '0' + f[2].trim() : '',
            company: companyKey, unit: unitLabel,
            role: role || (staffType === 'סגל' ? 'מפקד' : 'לוחם'),
            rank: staffType || '', fromSheets: true,
            arrival, certification: cert || ''
        });
    }
    return soldiers;
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
            if (ch === '"') {
                if (i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = false;
                }
            } else {
                current += ch;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
            } else if (ch === ',') {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
    }
    result.push(current);
    return result;
}

function updateCompanyTotals() {
    ALL_COMPANIES.forEach(key => {
        const soldiers = state.soldiers.filter(s => s.company === key);
        if (key === 'hq' || key === 'palsam') {
            companyData[key].totals = { soldiers: soldiers.length, commanders: 0, officers: 0 };
        } else {
            const officerRoles = ['מ"פ', 'סמ"פ', 'סרס"פ', 'רס"פ'];
            const cmdRoles = ['מ"כ', 'מ"מ', 'סמל', 'סמב"צ'];
            const officers = soldiers.filter(s => officerRoles.some(r => s.role.includes(r))).length;
            const commanders = soldiers.filter(s => cmdRoles.some(r => s.role.includes(r))).length;
            companyData[key].totals = { soldiers: soldiers.length - officers - commanders, commanders, officers };
        }
    });
}

// ==================== OVERVIEW ====================
function renderOverview() {
    const grid = document.getElementById('companiesGrid');
    grid.innerHTML = '';
    Object.entries(companyData).forEach(([key, comp]) => {
        const regCount = state.soldiers.filter(s => s.company === key).length;
        const total = (key === 'hq' || key === 'palsam') ? regCount : comp.totals.soldiers + comp.totals.commanders + comp.totals.officers;
        const onLeave = state.leaves.filter(l => l.company === key && isCurrentlyOnLeave(l)).length;
        const card = document.createElement('div');
        card.className = `company-card ${comp.colorClass}`;
        card.onclick = () => switchTab(key);
        card.innerHTML = `
            <div class="company-card-header">
                <h3>${comp.name}</h3>
                <span class="location">${comp.location}</span>
            </div>
            <div class="company-card-body">
                <div class="force-summary">
                    <div class="force-item"><div class="num">${comp.totals.soldiers}</div><div class="label">חיילים</div></div>
                    <div class="force-item"><div class="num">${comp.totals.commanders}</div><div class="label">מפקדים</div></div>
                    <div class="force-item"><div class="num">${comp.totals.officers}</div><div class="label">קצינים</div></div>
                </div>
                <div style="margin-bottom:8px;">
                    <div style="display:flex;justify-content:space-between;font-size:0.83em;margin-bottom:3px;">
                        <span>רישום כוח אדם</span><span>${regCount} / ${total}</span>
                    </div>
                    <div class="timeline-bar"><div class="timeline-fill" style="width:${total>0?(regCount/total*100):0}%"></div></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:0.82em;color:var(--text-light);">
                    <span>${comp.tasks.length} משימות</span>
                    <span>${onLeave > 0 ? onLeave + ' בבית' : 'כולם בבסיס'}</span>
                </div>
            </div>`;
        grid.appendChild(card);
    });
}

// ==================== DASHBOARD ====================
function renderDashboard() {
    const grid = document.getElementById('dashboardGrid');
    const alertsEl = document.getElementById('dashboardAlerts');
    if (!grid) return;

    // Calculate stats per company
    const compStats = {};
    let totalPersonnel = 0, totalAssigned = 0, totalHome = 0, totalAvailable = 0;

    ALL_COMPANIES.forEach(k => {
        const c = companyData[k];
        const regCount = state.soldiers.filter(s => s.company === k).length;
        const total = c.totals.soldiers + c.totals.commanders + c.totals.officers;
        const onLeave = state.leaves.filter(l => l.company === k && isCurrentlyOnLeave(l)).length;

        // Rotation leaves
        let rotLeave = 0;
        state.rotationGroups.forEach(g => {
            const status = getRotationStatus(g, new Date());
            if (!status.inBase) {
                rotLeave += g.soldiers.filter(sid => {
                    const sol = state.soldiers.find(s => s.id === sid);
                    return sol && sol.company === k;
                }).length;
            }
        });

        const assignedIds = new Set();
        state.shifts.filter(sh => sh.company === k).forEach(sh => sh.soldiers.forEach(sid => assignedIds.add(sid)));

        const home = onLeave + rotLeave;
        const assigned = assignedIds.size;
        const available = Math.max(0, regCount - assigned - home);

        compStats[k] = { name: c.name, color: c.color, regCount, total, assigned, home, available };
        totalPersonnel += regCount;
        totalAssigned += assigned;
        totalHome += home;
        totalAvailable += available;
    });

    // === DONUT CHART - Personnel Status ===
    const donutData = [
        { label: 'משובצים', value: totalAssigned, color: '#27ae60' },
        { label: 'בבית', value: totalHome, color: '#e74c3c' },
        { label: 'זמינים', value: totalAvailable, color: '#3498db' }
    ];
    const donutTotal = donutData.reduce((s, d) => s + d.value, 0) || 1;
    let donutAngle = 0;
    const gradStops = donutData.map(d => {
        const start = donutAngle;
        const size = (d.value / donutTotal) * 360;
        donutAngle += size;
        return `${d.color} ${start}deg ${start + size}deg`;
    }).join(', ');

    // === BAR CHART - Company manning ===
    const mainCompanies = ['a', 'b', 'c', 'd'];
    const maxReg = Math.max(...mainCompanies.map(k => compStats[k].regCount), 1);
    const barsHtml = mainCompanies.map(k => {
        const cs = compStats[k];
        const pct = (cs.regCount / maxReg) * 100;
        return `<div class="bar-row">
            <div class="bar-label">${cs.name}</div>
            <div class="bar-track">
                <div class="bar-fill" style="width:${pct}%;background:${cs.color};">${cs.regCount}</div>
            </div>
        </div>`;
    }).join('');

    // === Task Readiness ===
    let taskAlerts = [];
    mainCompanies.forEach(k => {
        const comp = companyData[k];
        comp.tasks.forEach(task => {
            const needed = task.perShift ? (task.perShift.soldiers + task.perShift.commanders + task.perShift.officers) * task.shifts : 0;
            if (needed <= 0) return;
            const assigned = state.shifts.filter(sh => sh.company === k && sh.task === task.name)
                .reduce((sum, sh) => sum + sh.soldiers.length, 0);
            const pct = Math.round((assigned / needed) * 100);
            if (pct < 50) {
                taskAlerts.push({ company: comp.name, task: task.name, pct, needed, assigned });
            }
        });
    });

    // === Render ===
    grid.innerHTML = `
        <div class="dash-card">
            <div class="dash-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.21 15.89A10 10 0 118 2.83"/><path d="M22 12A10 10 0 0012 2v10z"/></svg>
                פיזור כוח אדם
            </div>
            <div class="donut-wrap">
                <div class="donut-chart" style="background: conic-gradient(${gradStops});">
                    <div class="donut-center">
                        <div class="num">${totalPersonnel}</div>
                        <div class="lbl">סה"כ</div>
                    </div>
                </div>
                <div class="donut-legend">
                    ${donutData.map(d => `
                        <div class="donut-legend-item">
                            <span class="donut-legend-dot" style="background:${d.color}"></span>
                            <span>${d.label}</span>
                            <span class="val">${d.value}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
        <div class="dash-card">
            <div class="dash-card-title">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></svg>
                איוש לפי פלוגה
            </div>
            <div class="bar-chart">${barsHtml}</div>
        </div>
    `;

    // === Alerts ===
    let alertsHtml = '';
    if (taskAlerts.length > 0) {
        const topAlerts = taskAlerts.sort((a, b) => a.pct - b.pct).slice(0, 4);
        topAlerts.forEach(a => {
            const cls = a.pct === 0 ? 'dash-alert-danger' : 'dash-alert-warn';
            const icon = a.pct === 0
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            alertsHtml += `<div class="dash-alert ${cls}">
                ${icon}
                <span><strong>${a.company}</strong> - ${a.task}: ${a.assigned}/${a.needed} משובצים (${a.pct}%)</span>
            </div>`;
        });
    }

    // Check for companies with many soldiers at home
    mainCompanies.forEach(k => {
        const cs = compStats[k];
        if (cs.regCount > 0 && cs.home > cs.regCount * 0.4) {
            alertsHtml += `<div class="dash-alert dash-alert-info">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                <span><strong>${cs.name}</strong>: ${cs.home} חיילים בבית (${Math.round(cs.home/cs.regCount*100)}% מהכוח)</span>
            </div>`;
        }
    });

    if (alertsEl) alertsEl.innerHTML = alertsHtml;
}

// ==================== DARK MODE ====================
function toggleDarkMode() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const newTheme = isDark ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('battalionTheme', newTheme);

    // Update icon
    const icon = document.getElementById('darkModeIcon');
    if (icon) {
        icon.innerHTML = newTheme === 'dark'
            ? '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>'
            : '<path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>';
    }

    // Update theme-color meta tag
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) metaTheme.content = newTheme === 'dark' ? '#0d1b2a' : '#1a237e';
}

function loadTheme() {
    const saved = localStorage.getItem('battalionTheme');
    if (saved === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        const icon = document.getElementById('darkModeIcon');
        if (icon) {
            icon.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
        }
    }
}

// ==================== NOTIFICATIONS ====================
function toggleNotifications() {
    const panel = document.getElementById('notifPanel');
    panel.classList.toggle('active');
    if (panel.classList.contains('active')) {
        updateNotifications();
    }
}

// Close notifications on outside click
document.addEventListener('click', function(e) {
    const panel = document.getElementById('notifPanel');
    const wrapper = e.target.closest('.notif-wrapper');
    if (panel && panel.classList.contains('active') && !wrapper) {
        panel.classList.remove('active');
    }
});

function updateNotifications() {
    const notifications = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Rotation changes happening today/tomorrow
    state.rotationGroups.forEach(g => {
        const statusToday = getRotationStatus(g, today);
        const statusTomorrow = getRotationStatus(g, tomorrow);
        if (statusToday.inBase && !statusTomorrow.inBase) {
            notifications.push({
                type: 'warn',
                title: `${g.name} - יוצאת מחר`,
                desc: `קבוצת ${g.name} (${g.soldiers.length} חיילים) יוצאת מחר מהבסיס`,
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>'
            });
        }
        if (!statusToday.inBase && statusTomorrow.inBase) {
            notifications.push({
                type: 'success',
                title: `${g.name} - חוזרת מחר`,
                desc: `קבוצת ${g.name} (${g.soldiers.length} חיילים) חוזרת מחר לבסיס`,
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg>'
            });
        }
    });

    // 2. Leaves ending today/tomorrow
    const returningToday = state.leaves.filter(l => l.endDate === todayStr);
    const returningTomorrow = state.leaves.filter(l => l.endDate === tomorrowStr);
    if (returningToday.length > 0) {
        notifications.push({
            type: 'info',
            title: `${returningToday.length} חיילים חוזרים היום`,
            desc: returningToday.map(l => {
                const sol = state.soldiers.find(s => s.id === l.soldierId);
                return sol ? sol.name : '?';
            }).slice(0, 5).join(', ') + (returningToday.length > 5 ? '...' : ''),
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg>'
        });
    }
    if (returningTomorrow.length > 0) {
        notifications.push({
            type: 'info',
            title: `${returningTomorrow.length} חיילים חוזרים מחר`,
            desc: returningTomorrow.map(l => {
                const sol = state.soldiers.find(s => s.id === l.soldierId);
                return sol ? sol.name : '?';
            }).slice(0, 5).join(', ') + (returningTomorrow.length > 5 ? '...' : ''),
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg>'
        });
    }

    // 3. Understaffed tasks (shifts needed today with low coverage)
    const mainCompanies = ['a', 'b', 'c', 'd'];
    mainCompanies.forEach(k => {
        const comp = companyData[k];
        comp.tasks.forEach(task => {
            const needed = task.perShift ? (task.perShift.soldiers + task.perShift.commanders + task.perShift.officers) * task.shifts : 0;
            if (needed <= 0) return;
            const assigned = state.shifts.filter(sh => sh.company === k && sh.task === task.name && sh.date === todayStr)
                .reduce((sum, sh) => sum + sh.soldiers.length, 0);
            if (assigned === 0 && needed > 0) {
                notifications.push({
                    type: 'danger',
                    title: `${comp.name} - ${task.name} ללא שיבוץ`,
                    desc: `נדרשים ${needed} משובצים להיום, 0 שובצו`,
                    icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
                });
            }
        });
    });

    // 4. Many soldiers on leave from a single company
    mainCompanies.forEach(k => {
        const comp = companyData[k];
        const regCount = state.soldiers.filter(s => s.company === k).length;
        const onLeave = state.leaves.filter(l => l.company === k && l.startDate <= todayStr && l.endDate >= todayStr).length;
        if (regCount > 0 && onLeave > regCount * 0.3) {
            notifications.push({
                type: 'warn',
                title: `${comp.name} - כוח אדם נמוך`,
                desc: `${onLeave} מתוך ${regCount} ביציאה (${Math.round(onLeave/regCount*100)}%)`,
                icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
            });
        }
    });

    // Render
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');

    if (badge) {
        badge.textContent = notifications.length;
        badge.style.display = notifications.length > 0 ? 'flex' : 'none';
    }

    if (list) {
        if (notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:8px;opacity:0.4;"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><br>אין התראות חדשות</div>';
        } else {
            list.innerHTML = notifications.map(n => `
                <div class="notif-item">
                    <div class="notif-icon ${n.type}">${n.icon}</div>
                    <div class="notif-body">
                        <div class="notif-title">${n.title}</div>
                        <div class="notif-desc">${n.desc}</div>
                    </div>
                </div>
            `).join('');
        }
    }
}

// ==================== SEARCH & FILTER ====================
function onSearchInput(compKey) {
    const ss = getSearchState(compKey);
    const input = document.getElementById(`search-${compKey}`);
    if (input) ss.query = input.value.trim();
    renderSoldiersGrid(compKey);
}

function setFilter(compKey, filter, btn) {
    const ss = getSearchState(compKey);
    ss.filter = filter;
    // Update active button
    const container = btn.parentElement;
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderSoldiersGrid(compKey);
}

function getFilteredSoldiers(compKey) {
    const ss = getSearchState(compKey);
    let soldiers = state.soldiers.filter(s => s.company === compKey);
    const shifts = state.shifts.filter(s => s.company === compKey);
    const leaves = state.leaves.filter(l => l.company === compKey);

    // Text search
    if (ss.query) {
        const q = ss.query.toLowerCase();
        soldiers = soldiers.filter(s =>
            s.name.toLowerCase().includes(q) ||
            (s.role && s.role.toLowerCase().includes(q)) ||
            (s.personalId && s.personalId.includes(q)) ||
            (s.phone && s.phone.includes(q)) ||
            (s.unit && s.unit.toLowerCase().includes(q))
        );
    }

    // Status filter
    if (ss.filter !== 'all') {
        soldiers = soldiers.filter(s => {
            const onLeave = leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
            const rotGroup = getRotationGroupForSoldier(s.id);
            const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
            const isHome = onLeave || (rotStatus && !rotStatus.inBase);
            const isAssigned = shifts.some(sh => sh.soldiers.includes(s.id));

            if (ss.filter === 'home') return isHome;
            if (ss.filter === 'assigned') return isAssigned && !isHome;
            if (ss.filter === 'available') return !isHome && !isAssigned;
            return true;
        });
    }

    return soldiers;
}

function renderSoldiersGrid(compKey) {
    const gridEl = document.getElementById(`soldiers-grid-${compKey}`);
    if (!gridEl) return;

    const soldiers = getFilteredSoldiers(compKey);
    const shifts = state.shifts.filter(s => s.company === compKey);
    const leaves = state.leaves.filter(l => l.company === compKey);

    if (soldiers.length === 0) {
        const ss = getSearchState(compKey);
        if (ss.query || ss.filter !== 'all') {
            gridEl.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div><p>לא נמצאו תוצאות</p></div>';
        } else {
            gridEl.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg></div><p>טרם נרשמו חיילים</p><p style="font-size:0.83em">לחץ "הוספת חייל" להתחיל</p></div>';
        }
        return;
    }

    gridEl.innerHTML = '<div class="personnel-grid">' + soldiers.map(s => {
        const onLeave = leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
        const rotGroup = getRotationGroupForSoldier(s.id);
        const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
        const isHome = onLeave || (rotStatus && !rotStatus.inBase);
        const isAssigned = shifts.some(sh => sh.soldiers.includes(s.id));
        const cls = isHome ? 'on-leave' : isAssigned ? 'on-duty' : 'unassigned';
        const txt = isHome ? 'בבית' : isAssigned ? 'בשיבוץ' : 'זמין';
        const badge = isHome ? 'status-on-leave' : isAssigned ? 'status-on-duty' : 'status-available';
        let rotInfo = '';
        if (rotGroup && rotStatus) {
            rotInfo = `<div class="meta">רוטציה: ${rotGroup.name} | ${rotStatus.inBase ? 'יום ' + rotStatus.dayInCycle + '/10 בבסיס' : 'יום ' + (rotStatus.dayInCycle - rotGroup.daysIn) + '/4 בבית'}</div>`;
        }
        return `<div class="person-card ${cls}">
            <div class="person-info">
                <h4>${s.name}</h4>
                <div class="meta">${s.role}${s.unit ? ' | '+s.unit : ''}${s.personalId ? ' | '+s.personalId : ''}</div>
                ${s.phone ? `<div class="meta">${s.phone}</div>` : ''}
                ${rotInfo}
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="person-status ${badge}">${txt}</span>
                ${canEdit(compKey) ? `<button class="btn btn-edit btn-icon btn-sm" onclick="openEditSoldier('${s.id}')" title="עריכה">&#9998;</button>
                <button class="btn btn-icon btn-sm" style="background:#9C27B0;color:white;" onclick="openTransferSoldier('${s.id}')" title="העבר פלוגה">&#8644;</button>
                <button class="btn btn-danger btn-icon btn-sm" onclick="deleteSoldier('${s.id}')" title="מחק">&#10005;</button>` : ''}
            </div>
        </div>`;
    }).join('') + '</div>';
}

// ==================== COMPANY TAB ====================
function renderCompanyTab(compKey) {
    const comp = companyData[compKey];
    const container = document.getElementById(`content-${compKey}`);
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const shifts = state.shifts.filter(s => s.company === compKey);
    const leaves = state.leaves.filter(l => l.company === compKey);

    const ss = getSearchState(compKey);

    const editable = canEdit(compKey);
    container.innerHTML = `
        <div class="action-bar">
            ${editable ? `<button class="btn btn-primary" onclick="openAddSoldier('${compKey}')">+ הוספת חייל</button>
            <button class="btn btn-success" onclick="openAddShift('${compKey}')">+ שיבוץ למשמרת</button>
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')">+ יציאה הביתה</button>` : ''}
            <button class="btn" style="background:var(--bg)" onclick="exportCompanyData('${compKey}')">&#128196; ייצוא CSV</button>
        </div>

        <!-- Force Table -->
        <div class="sub-section">
            <div class="section-title">
                <div class="icon" style="background:#e8f5e9;color:var(--success);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg></div>
                טבלת כוחות ומשימות - ${comp.name} (${comp.location})
            </div>
            <div class="task-table-wrapper"><div class="table-scroll">
                <table>
                    <thead><tr>
                        <th>משימה / פעילות</th>
                        <th>חיילים למשמרת</th>
                        <th>מפקדים למשמרת</th>
                        <th>קצינים למשמרת</th>
                        <th>כמות משמרות</th>
                        <th>סה"כ חיילים</th>
                        <th>סה"כ מפקדים</th>
                        <th>סה"כ קצינים</th>
                        <th>משובצים</th>
                    </tr></thead>
                    <tbody>
                        ${comp.tasks.map(t => {
                            const assigned = shifts.filter(s => s.task === t.name).reduce((sum, s) => sum + s.soldiers.length, 0);
                            const needed = t.soldiers + t.commanders + t.officers;
                            const pct = needed > 0 ? Math.min(100, Math.round(assigned/needed*100)) : 0;
                            return `<tr>
                                <td class="task-name">${t.name}</td>
                                <td>${t.perShift.soldiers}</td>
                                <td>${t.perShift.commanders}</td>
                                <td>${t.perShift.officers}</td>
                                <td>${t.shifts || '-'}</td>
                                <td><strong>${t.soldiers}</strong></td>
                                <td><strong>${t.commanders}</strong></td>
                                <td><strong>${t.officers}</strong></td>
                                <td><div style="display:flex;align-items:center;justify-content:center;gap:5px;">
                                    <span>${assigned}/${needed}</span>
                                    <div style="width:35px;height:5px;background:var(--border);border-radius:3px;">
                                        <div style="width:${pct}%;height:100%;background:${pct>=100?'var(--success)':pct>=50?'var(--warning)':'var(--danger)'};border-radius:3px;"></div>
                                    </div>
                                </div></td>
                            </tr>`;
                        }).join('')}
                        <tr class="total-row">
                            <td class="task-name">סה"כ</td><td>-</td><td>-</td><td>-</td><td>-</td>
                            <td><strong>${comp.totals.soldiers}</strong></td>
                            <td><strong>${comp.totals.commanders}</strong></td>
                            <td><strong>${comp.totals.officers}</strong></td>
                            <td>-</td>
                        </tr>
                    </tbody>
                </table>
            </div></div>
        </div>

        <!-- Shifts -->
        <div class="sub-section">
            <div class="section-title">
                <div class="icon" style="background:#fff3e0;color:var(--warning);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>
                משמרות ושיבוצים (${shifts.length})
            </div>
            ${shifts.length === 0 ? `
                <div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg></div><p>טרם נוצרו משמרות</p></div>
            ` : `
                <div class="shifts-grid">
                    ${shifts.sort((a,b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)).map(sh => {
                        const names = sh.soldiers.map(sid => {
                            const sol = state.soldiers.find(s => s.id === sid);
                            return sol ? sol.name : '?';
                        });
                        const taskData = comp.tasks.find(t => t.name === sh.task);
                        const needed = taskData ? taskData.perShift.soldiers + taskData.perShift.commanders + taskData.perShift.officers : 0;
                        return `<div class="shift-card">
                            <div class="shift-card-header">
                                <h4>${sh.task}${sh.shiftName ? ' - '+sh.shiftName : ''}</h4>
                                <span class="shift-time">${sh.startTime} - ${sh.endTime}</span>
                            </div>
                            <div class="shift-card-body">
                                <div style="font-size:0.83em;color:var(--text-light);margin-bottom:6px;">
                                    &#128197; ${formatDate(sh.date)} | ${names.length}/${needed} משובצים
                                </div>
                                ${names.length > 0 ? `<ul class="shift-soldiers">${names.map(n => `<li class="shift-soldier"><span>${n}</span></li>`).join('')}</ul>` : '<div style="text-align:center;padding:8px;color:var(--danger);font-size:0.83em;">לא שובצו חיילים</div>'}
                                ${editable ? `<div style="margin-top:6px;text-align:left;display:flex;gap:4px;">
                                    <button class="btn btn-edit btn-sm" onclick="openEditShift('${sh.id}')">&#9998; עריכה</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteShift('${sh.id}')">&#10005; מחק</button>
                                </div>` : ''}
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            `}
        </div>

        <!-- Leaves -->
        <div class="sub-section">
            <div class="section-title">
                <div class="icon" style="background:#fce4ec;color:var(--danger);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg></div>
                יציאות הביתה (${leaves.length})
            </div>
            ${leaves.length === 0 ? `
                <div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/></svg></div><p>אין יציאות מתוכננות</p></div>
            ` : `
                <div class="leave-table-wrapper"><div class="table-scroll">
                    <table>
                        <thead><tr>
                            <th>חייל</th><th>דרגה</th><th>תאריך יציאה</th><th>שעת יציאה</th>
                            <th>תאריך חזרה</th><th>שעת חזרה</th><th>סטטוס</th><th>הערות</th><th>פעולות</th>
                        </tr></thead>
                        <tbody>
                            ${leaves.sort((a,b) => a.startDate.localeCompare(b.startDate)).map(l => {
                                const sol = state.soldiers.find(s => s.id === l.soldierId);
                                const active = isCurrentlyOnLeave(l);
                                return `<tr class="${active?'leave-row-home':''}">
                                    <td><strong>${sol ? sol.name : '?'}</strong></td>
                                    <td>${sol ? sol.rank : ''}</td>
                                    <td>${formatDate(l.startDate)}</td><td>${l.startTime}</td>
                                    <td>${formatDate(l.endDate)}</td><td>${l.endTime}</td>
                                    <td><span class="person-status ${active?'status-on-leave':'status-on-duty'}">${active?'בבית':'חזר'}</span></td>
                                    <td style="font-size:0.83em">${l.notes||'-'}</td>
                                    <td style="display:flex;gap:4px;">
                                        ${editable ? `<button class="btn btn-edit btn-sm" onclick="openEditLeave('${l.id}')">&#9998;</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteLeave('${l.id}')">&#10005;</button>` : '-'}
                                    </td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div></div>
            `}
        </div>

        <!-- Soldiers with Search -->
        <div class="sub-section">
            <div class="section-title">
                <div class="icon" style="background:#e3f2fd;color:var(--info);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4-4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                כוח אדם (${soldiers.length} רשומים)
            </div>
            <div class="search-bar">
                <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
                <input type="text" id="search-${compKey}" placeholder="חיפוש לפי שם, תפקיד, מספר אישי..." value="${ss.query}" oninput="onSearchInput('${compKey}')">
            </div>
            <div class="filter-buttons">
                <button class="filter-btn ${ss.filter==='all'?'active':''}" onclick="setFilter('${compKey}','all',this)">הכל</button>
                <button class="filter-btn ${ss.filter==='available'?'active':''}" onclick="setFilter('${compKey}','available',this)">זמינים</button>
                <button class="filter-btn ${ss.filter==='assigned'?'active':''}" onclick="setFilter('${compKey}','assigned',this)">בשיבוץ</button>
                <button class="filter-btn ${ss.filter==='home'?'active':''}" onclick="setFilter('${compKey}','home',this)">בבית</button>
            </div>
            <div id="soldiers-grid-${compKey}"></div>
        </div>
    `;

    // Render filtered soldiers grid
    renderSoldiersGrid(compKey);
}

// ==================== ROTATION TAB ====================
function renderRotationTab() {
    renderRotationCalendar();
    renderRotationGroups();
}

function renderRotationCalendar() {
    const container = document.getElementById('rotationCalendar');
    if (state.rotationGroups.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg></div><p>צור קבוצות רוטציה כדי לראות את לוח הזמנים</p></div>';
        return;
    }

    const today = new Date();
    today.setHours(0,0,0,0);
    const days = [];
    const dayNames = ['א','ב','ג','ד','ה','ו','ש'];

    for (let i = 0; i < 21; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        days.push(d);
    }

    let html = '';
    // Header row with dates
    html += '<div class="rotation-row">';
    html += '<div class="rotation-label" style="font-weight:700;">קבוצה / תאריך</div>';
    html += '<div class="rotation-days">';
    days.forEach((d, i) => {
        const isToday = i === 0;
        html += `<div class="rotation-day ${isToday ? 'today' : ''}" style="background:#f5f5f5;">
            <div class="day-name">${dayNames[d.getDay()]}'</div>
            <div class="day-num">${d.getDate()}</div>
            <div style="font-size:0.7em;opacity:0.5;">${d.getMonth()+1}</div>
        </div>`;
    });
    html += '</div></div>';

    // One row per rotation group
    state.rotationGroups.forEach(group => {
        html += '<div class="rotation-row">';
        html += `<div class="rotation-label">${group.name}<br><small style="color:var(--text-light)">${group.soldiers.length} חיילים</small></div>`;
        html += '<div class="rotation-days">';
        days.forEach((d, i) => {
            const status = getRotationStatus(group, d);
            const isToday = i === 0;
            const cls = status.inBase ? 'in-base' : 'at-home';
            html += `<div class="rotation-day ${cls} ${isToday ? 'today' : ''}" title="${status.inBase ? 'בבסיס - יום '+status.dayInCycle : 'בבית - יום '+(status.dayInCycle - group.daysIn)}">
                <div style="font-size:1em;">${status.inBase ? '&#9989;' : '&#127968;'}</div>
                <div style="font-size:0.75em;">${status.inBase ? 'יום ' + status.dayInCycle : 'בבית'}</div>
            </div>`;
        });
        html += '</div></div>';
    });

    container.innerHTML = html;
}

function renderRotationGroups() {
    const container = document.getElementById('rotationGroupsContainer');
    if (state.rotationGroups.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div><p>לחץ "קבוצת רוטציה חדשה" ליצור קבוצה</p></div>';
        return;
    }

    const now = new Date();
    container.innerHTML = state.rotationGroups.map(group => {
        const status = getRotationStatus(group, now);
        const headerClass = status.inBase ? 'in-base' : 'at-home';
        const statusText = status.inBase ?
            `בבסיס - יום ${status.dayInCycle}/${group.daysIn}` :
            `בבית - יום ${status.dayInCycle - group.daysIn}/${group.daysOut}`;

        const nextChange = getNextRotationChange(group, now);

        const soldierNames = group.soldiers.map(sid => {
            const sol = state.soldiers.find(s => s.id === sid);
            return sol ? sol.name : '?';
        });

        return `<div class="rotation-group-card">
            <div class="rotation-group-header ${headerClass}">
                <div>
                    <h4>${group.name}</h4>
                    <div style="font-size:0.8em;opacity:0.9;">${statusText}</div>
                </div>
                <div style="text-align:left;">
                    <div style="font-size:0.75em;">שינוי הבא:</div>
                    <div style="font-size:0.85em;font-weight:700;">${formatDate(nextChange.toISOString().split('T')[0])}</div>
                </div>
            </div>
            <div class="rotation-group-body">
                <div style="font-size:0.83em;color:var(--text-light);margin-bottom:6px;">
                    מחזור: ${group.daysIn} בבסיס / ${group.daysOut} בבית | ${soldierNames.length} חיילים
                </div>
                <ul>${soldierNames.map(n => `<li>${n}</li>`).join('')}</ul>
                <div style="margin-top:8px;text-align:left;">
                    <button class="btn btn-danger btn-sm" onclick="deleteRotGroup('${group.id}')">&#10005; מחק קבוצה</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function getRotationStatus(group, date) {
    const start = new Date(group.startDate);
    start.setHours(0,0,0,0);
    const check = new Date(date);
    check.setHours(0,0,0,0);
    const diffDays = Math.floor((check - start) / (1000*60*60*24));
    const cycleLength = group.daysIn + group.daysOut;
    let dayInCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
    const inBase = dayInCycle <= group.daysIn;
    return { inBase, dayInCycle };
}

function getNextRotationChange(group, date) {
    const status = getRotationStatus(group, date);
    const daysLeft = status.inBase ?
        (group.daysIn - status.dayInCycle + 1) :
        (group.daysIn + group.daysOut - status.dayInCycle + 1);
    const next = new Date(date);
    next.setDate(next.getDate() + daysLeft);
    return next;
}

function getRotationGroupForSoldier(soldierId) {
    return state.rotationGroups.find(g => g.soldiers.includes(soldierId));
}

// ==================== CALENDAR ====================
function calendarNav(dir) {
    if (dir === 0) {
        calendarWeekOffset = 0;
    } else {
        calendarWeekOffset += dir;
    }
    renderCalendar();
}

function renderCalendar() {
    const grid = document.getElementById('calGrid');
    const titleEl = document.getElementById('calTitle');
    if (!grid || !titleEl) return;

    const filterCompany = document.getElementById('calCompanyFilter').value;

    // Calculate the week's start (Sunday) based on offset
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dayOfWeek = today.getDay(); // 0=Sunday
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - dayOfWeek + (calendarWeekOffset * 7));

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Title
    const fmt = d => d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
    titleEl.textContent = fmt(weekStart) + ' — ' + fmt(weekEnd);

    // Day names (Hebrew, Sunday first)
    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

    let html = dayNames.map(d => `<div class="cal-day-header">${d}</div>`).join('');

    // Build 7 days
    for (let i = 0; i < 7; i++) {
        const day = new Date(weekStart);
        day.setDate(weekStart.getDate() + i);
        const dateStr = day.toISOString().split('T')[0];
        const isToday = dateStr === today.toISOString().split('T')[0];

        // Get shifts for this day
        const dayShifts = state.shifts.filter(sh => {
            if (sh.date !== dateStr) return false;
            if (filterCompany !== 'all' && sh.company !== filterCompany) return false;
            return true;
        });

        // Get leaves active on this day
        const dayLeaves = state.leaves.filter(l => {
            if (filterCompany !== 'all' && l.company !== filterCompany) return false;
            return l.startDate <= dateStr && l.endDate >= dateStr;
        });

        // Get rotation groups that are out on this day
        let rotationEvents = [];
        if (filterCompany === 'all' || ['a', 'b', 'c', 'd'].includes(filterCompany)) {
            state.rotationGroups.forEach(g => {
                const status = getRotationStatus(g, day);
                if (!status.inBase) {
                    const count = filterCompany === 'all'
                        ? g.soldiers.length
                        : g.soldiers.filter(sid => {
                            const sol = state.soldiers.find(s => s.id === sid);
                            return sol && sol.company === filterCompany;
                        }).length;
                    if (count > 0) {
                        rotationEvents.push({ name: g.name, count, dayInCycle: status.dayInCycle });
                    }
                }
            });
        }

        // Render events
        let eventsHtml = '';

        // Shifts
        dayShifts.forEach(sh => {
            const compName = companyData[sh.company] ? companyData[sh.company].name : sh.company;
            const label = filterCompany === 'all' ? `${compName} - ${sh.task}` : sh.task;
            eventsHtml += `<div class="cal-event cal-event-shift" title="${label} (${sh.startTime}-${sh.endTime}) - ${sh.soldiers.length} חיילים">
                <span class="cal-event-time">${sh.startTime}</span>
                <span class="cal-event-label">${label}</span>
                <span class="cal-event-count">${sh.soldiers.length}</span>
            </div>`;
        });

        // Leaves (group by company)
        if (dayLeaves.length > 0) {
            if (filterCompany !== 'all') {
                eventsHtml += `<div class="cal-event cal-event-leave" title="${dayLeaves.length} ביציאה">
                    <span class="cal-event-label">יציאות</span>
                    <span class="cal-event-count">${dayLeaves.length}</span>
                </div>`;
            } else {
                // Group leaves by company
                const leavesByComp = {};
                dayLeaves.forEach(l => {
                    if (!leavesByComp[l.company]) leavesByComp[l.company] = 0;
                    leavesByComp[l.company]++;
                });
                Object.entries(leavesByComp).forEach(([comp, count]) => {
                    const compName = companyData[comp] ? companyData[comp].name : comp;
                    eventsHtml += `<div class="cal-event cal-event-leave" title="${compName} - ${count} ביציאה">
                        <span class="cal-event-label">${compName}</span>
                        <span class="cal-event-count">${count}</span>
                    </div>`;
                });
            }
        }

        // Rotation out
        rotationEvents.forEach(r => {
            eventsHtml += `<div class="cal-event cal-event-rotation" title="${r.name} - ${r.count} בבית (יום ${r.dayInCycle} במחזור)">
                <span class="cal-event-label">${r.name}</span>
                <span class="cal-event-count">${r.count}</span>
            </div>`;
        });

        const dateLabel = day.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

        html += `<div class="cal-day${isToday ? ' today' : ''}">
            <div class="cal-date">${dateLabel}</div>
            <div class="cal-events">${eventsHtml || '<div class="cal-empty">—</div>'}</div>
        </div>`;
    }

    grid.innerHTML = html;
}

// ==================== COMMANDER DASHBOARD ====================
function renderCommanderDashboard() {
    const container = document.getElementById('content-commander');
    if (!container) return;

    // Determine which company to show
    let compKey = commanderViewCompany || currentUser.unit;
    if (compKey === 'gdudi') compKey = 'a';
    const comp = companyData[compKey];
    if (!comp) return;

    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const todayStr = new Date().toISOString().split('T')[0];
    const shifts = state.shifts.filter(sh => sh.company === compKey);
    const todayShifts = shifts.filter(sh => sh.date === todayStr);
    const leaves = state.leaves.filter(l => l.company === compKey);

    // Categorize soldiers
    const inBase = [], atHome = [], returningToday = [], unassigned = [];
    const assignedIds = new Set();
    todayShifts.forEach(sh => sh.soldiers.forEach(sid => assignedIds.add(sid)));

    soldiers.forEach(s => {
        const onLeave = leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
        const rotGroup = getRotationGroupForSoldier(s.id);
        const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
        const isHome = onLeave || (rotStatus && !rotStatus.inBase);
        const returning = leaves.some(l => l.soldierId === s.id && l.endDate === todayStr);

        if (isHome) {
            atHome.push(s);
            if (returning) returningToday.push(s);
        } else {
            inBase.push(s);
            if (!assignedIds.has(s.id)) unassigned.push(s);
        }
    });

    // Task manning
    const taskManning = (comp.tasks || []).map(task => {
        const totalNeeded = (task.soldiers || 0) + (task.commanders || 0) + (task.officers || 0);
        const assigned = todayShifts.filter(sh => sh.task === task.name)
            .reduce((sum, sh) => sum + sh.soldiers.length, 0);
        const pct = totalNeeded > 0 ? Math.round(assigned / totalNeeded * 100) : 0;
        return { name: task.name, assigned, needed: totalNeeded, pct };
    });

    // Company selector for gdudi users
    const compSelector = currentUser.unit === 'gdudi' ? `
        <select id="cmdCompanySelect" onchange="switchCommanderCompany(this.value)" style="padding:6px 12px;border-radius:8px;border:1px solid var(--border);font-size:0.9em;">
            ${['a','b','c','d','hq','palsam'].map(k => `<option value="${k}" ${k===compKey?'selected':''}>${companyData[k].name}</option>`).join('')}
        </select>` : '';

    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <h2 style="margin:0;font-size:1.3em;">לוח מ"פ - ${comp.name}</h2>
            <div style="display:flex;align-items:center;gap:10px;">
                ${compSelector}
                <span style="font-size:0.85em;color:var(--text-light);">${getReportDateStr()}</span>
            </div>
        </div>

        <div class="quick-stats" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:10px;margin-bottom:20px;">
            <div style="background:var(--card);border-radius:var(--radius);padding:14px;text-align:center;box-shadow:var(--shadow);border-top:3px solid var(--success);">
                <div style="font-size:1.6em;font-weight:700;color:var(--success);">${inBase.length}</div>
                <div style="font-size:0.82em;color:var(--text-light);">בבסיס</div>
            </div>
            <div style="background:var(--card);border-radius:var(--radius);padding:14px;text-align:center;box-shadow:var(--shadow);border-top:3px solid var(--danger);">
                <div style="font-size:1.6em;font-weight:700;color:var(--danger);">${atHome.length}</div>
                <div style="font-size:0.82em;color:var(--text-light);">בבית</div>
            </div>
            <div style="background:var(--card);border-radius:var(--radius);padding:14px;text-align:center;box-shadow:var(--shadow);border-top:3px solid #2196F3;">
                <div style="font-size:1.6em;font-weight:700;color:#2196F3;">${returningToday.length}</div>
                <div style="font-size:0.82em;color:var(--text-light);">חוזרים היום</div>
            </div>
            <div style="background:var(--card);border-radius:var(--radius);padding:14px;text-align:center;box-shadow:var(--shadow);border-top:3px solid var(--warning);">
                <div style="font-size:1.6em;font-weight:700;color:var(--warning);">${unassigned.length}</div>
                <div style="font-size:0.82em;color:var(--text-light);">ללא שיבוץ</div>
            </div>
        </div>

        ${returningToday.length > 0 ? `
        <div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title">
                <div class="icon" style="background:#e8f5e9;color:var(--success);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
                </div>
                חוזרים היום (${returningToday.length})
            </div>
            <div class="personnel-grid">${returningToday.map(s => cmdSoldierCard(s, 'returning')).join('')}</div>
        </div>` : ''}

        <div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title">
                <div class="icon" style="background:#fff3e0;color:var(--warning);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                </div>
                חיילים ללא שיבוץ (${unassigned.length})
            </div>
            ${unassigned.length > 0 ? `<div class="personnel-grid">${unassigned.map(s => cmdSoldierCard(s, 'unassigned')).join('')}</div>` :
            '<div style="text-align:center;padding:16px;color:var(--text-light);">כל החיילים משובצים</div>'}
        </div>

        ${taskManning.length > 0 ? `
        <div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title">
                <div class="icon" style="background:#e3f2fd;color:var(--primary);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>
                </div>
                מצב אכלוס משימות
            </div>
            <div class="table-scroll"><table>
                <thead><tr><th>משימה</th><th>משובצים</th><th>נדרשים</th><th>מילוי</th></tr></thead>
                <tbody>${taskManning.map(t => `<tr>
                    <td style="text-align:right;font-weight:600;">${t.name}</td>
                    <td style="text-align:center;">${t.assigned}</td>
                    <td style="text-align:center;">${t.needed}</td>
                    <td><div style="display:flex;align-items:center;gap:6px;justify-content:center;">
                        <div style="width:60px;height:6px;background:var(--border);border-radius:3px;">
                            <div style="width:${Math.min(100,t.pct)}%;height:100%;background:${t.pct>=100?'var(--success)':t.pct>=50?'var(--warning)':'var(--danger)'};border-radius:3px;"></div>
                        </div>
                        <span style="font-size:0.82em;">${t.pct}%</span>
                    </div></td>
                </tr>`).join('')}</tbody>
            </table></div>
        </div>` : ''}

        <div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title">
                <div class="icon" style="background:#fce4ec;color:var(--danger);width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                </div>
                בבית כרגע (${atHome.length})
            </div>
            ${atHome.length > 0 ? `<div class="personnel-grid">${atHome.map(s => cmdSoldierCard(s, 'home')).join('')}</div>` :
            '<div style="text-align:center;padding:16px;color:var(--text-light);">כל החיילים בבסיס</div>'}
        </div>

        <div class="action-bar" style="margin-top:20px;">
            <button class="btn btn-success" onclick="openAddShift('${compKey}')">+ שיבוץ חדש</button>
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')">+ יציאה</button>
            <button class="btn btn-primary" onclick="openAddSoldier('${compKey}')">+ הוספת חייל</button>
            <button class="btn" style="background:var(--bg)" onclick="exportCompanyData('${compKey}')">ייצוא CSV</button>
        </div>
    `;
}

function cmdSoldierCard(s, status) {
    const cls = status === 'home' ? 'on-leave' : status === 'returning' ? 'on-duty' : '';
    const badge = status === 'home' ? 'status-on-leave' : status === 'returning' ? 'status-on-duty' : 'status-available';
    const txt = status === 'home' ? 'בבית' : status === 'returning' ? 'חוזר היום' : 'ללא שיבוץ';
    return `<div class="person-card ${cls}">
        <div class="person-info">
            <h4>${s.name}</h4>
            <div class="meta">${s.role || ''}${s.rank ? ' | '+s.rank : ''}${s.phone ? ' | '+s.phone : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
            <span class="person-status ${badge}">${txt}</span>
            ${s.phone ? `<a href="https://wa.me/972${s.phone.replace(/^0/,'')}" target="_blank" class="btn btn-icon btn-sm" style="background:#25D366;color:white;" title="WhatsApp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </a>` : ''}
        </div>
    </div>`;
}

let commanderViewCompany = null;

function switchCommanderCompany(compKey) {
    commanderViewCompany = compKey;
    renderCommanderDashboard();
}

// ==================== WHATSAPP NOTIFICATION CENTER ====================
let whatsappFilterType = 'all';

function renderWhatsAppCenter() {
    const container = document.getElementById('content-whatsapp');
    if (!container) return;

    const notifications = generateWhatsAppNotifications();
    const filtered = whatsappFilterType === 'all' ? notifications : notifications.filter(n => n.type === whatsappFilterType);
    const counts = { all: notifications.length, shift: 0, leave: 0, rotation: 0 };
    notifications.forEach(n => counts[n.type] = (counts[n.type]||0) + 1);

    container.innerHTML = `
        <div class="section-title">
            <div class="icon" style="background:#e8f5e9;color:#25D366;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </div>
            מרכז התראות WhatsApp
        </div>
        <div class="info-box">
            <span class="info-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
            <div>לחיצה על "שלח" תפתח את WhatsApp עם הודעה מוכנה. ניתן לערוך לפני שליחה.</div>
        </div>
        <div class="filter-buttons" style="margin:14px 0;">
            <button class="filter-btn ${whatsappFilterType==='all'?'active':''}" onclick="filterWhatsApp('all')">הכל (${counts.all})</button>
            <button class="filter-btn ${whatsappFilterType==='shift'?'active':''}" onclick="filterWhatsApp('shift')">משמרות (${counts.shift})</button>
            <button class="filter-btn ${whatsappFilterType==='leave'?'active':''}" onclick="filterWhatsApp('leave')">יציאות (${counts.leave})</button>
            <button class="filter-btn ${whatsappFilterType==='rotation'?'active':''}" onclick="filterWhatsApp('rotation')">רוטציה (${counts.rotation})</button>
        </div>
        <div id="whatsappNotifList">
            ${filtered.length === 0 ? '<div style="text-align:center;padding:30px;color:var(--text-light);">אין התראות כרגע</div>' :
              filtered.map(n => renderWhatsAppCard(n)).join('')}
        </div>
    `;
}

function filterWhatsApp(type) {
    whatsappFilterType = type;
    renderWhatsAppCenter();
}

function generateWhatsAppNotifications() {
    const notifications = [];
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    // 1. Shift reminders (tomorrow's shifts)
    state.shifts.filter(sh => sh.date === tomorrowStr).forEach(sh => {
        sh.soldiers.forEach(sid => {
            const sol = state.soldiers.find(s => s.id === sid);
            if (!sol || !sol.phone) return;
            const compName = companyData[sh.company] ? companyData[sh.company].name : '';
            const msg = `שלום ${sol.name},\nתזכורת: אתה משובץ מחר (${formatDate(sh.date)}) ל${sh.task} בשעות ${sh.startTime}-${sh.endTime}.\n${compName}`;
            notifications.push({ type: 'shift', soldier: sol, title: `תזכורת משמרת - ${sol.name}`, desc: `${sh.task} מחר ${sh.startTime}-${sh.endTime}`, phone: sol.phone, message: msg, priority: 'medium' });
        });
    });

    // 2. Today's shifts (same-day reminder)
    state.shifts.filter(sh => sh.date === todayStr).forEach(sh => {
        sh.soldiers.forEach(sid => {
            const sol = state.soldiers.find(s => s.id === sid);
            if (!sol || !sol.phone) return;
            const msg = `שלום ${sol.name},\nתזכורת: אתה משובץ היום ל${sh.task} בשעות ${sh.startTime}-${sh.endTime}.`;
            notifications.push({ type: 'shift', soldier: sol, title: `משמרת היום - ${sol.name}`, desc: `${sh.task} היום ${sh.startTime}-${sh.endTime}`, phone: sol.phone, message: msg, priority: 'high' });
        });
    });

    // 3. Leave ending today
    state.leaves.filter(l => l.endDate === todayStr).forEach(l => {
        const sol = state.soldiers.find(s => s.id === l.soldierId);
        if (!sol || !sol.phone) return;
        const msg = `שלום ${sol.name},\nתזכורת: היציאה שלך מסתיימת היום (${formatDate(l.endDate)})${l.endTime ? ' בשעה '+l.endTime : ''}.\nנא לחזור לבסיס בזמן.`;
        notifications.push({ type: 'leave', soldier: sol, title: `חזרה מיציאה - ${sol.name}`, desc: `יציאה מסתיימת היום`, phone: sol.phone, message: msg, priority: 'high' });
    });

    // 4. Leave ending tomorrow
    state.leaves.filter(l => l.endDate === tomorrowStr).forEach(l => {
        const sol = state.soldiers.find(s => s.id === l.soldierId);
        if (!sol || !sol.phone) return;
        const msg = `שלום ${sol.name},\nתזכורת: היציאה שלך מסתיימת מחר (${formatDate(l.endDate)})${l.endTime ? ' בשעה '+l.endTime : ''}.\nנא לחזור לבסיס בזמן.`;
        notifications.push({ type: 'leave', soldier: sol, title: `חזרה מחר - ${sol.name}`, desc: `יציאה מסתיימת מחר`, phone: sol.phone, message: msg, priority: 'medium' });
    });

    // 5. Rotation changes tomorrow
    state.rotationGroups.forEach(g => {
        const statusToday = getRotationStatus(g, today);
        const statusTomorrow = getRotationStatus(g, tomorrow);
        if (statusToday.inBase !== statusTomorrow.inBase) {
            g.soldiers.forEach(sid => {
                const sol = state.soldiers.find(s => s.id === sid);
                if (!sol || !sol.phone) return;
                const action = statusTomorrow.inBase ? 'חוזרת לבסיס' : 'יוצאת הביתה';
                const msg = `שלום ${sol.name},\nקבוצת רוטציה "${g.name}" ${action} מחר.\nנא להתעדכן ולהגיע/להתארגן בהתאם.`;
                notifications.push({ type: 'rotation', soldier: sol, title: `רוטציה - ${sol.name}`, desc: `${g.name} ${action} מחר`, phone: sol.phone, message: msg, priority: statusTomorrow.inBase ? 'high' : 'medium' });
            });
        }
    });

    return notifications.sort((a, b) => {
        const p = { high: 0, medium: 1, low: 2 };
        return (p[a.priority]||1) - (p[b.priority]||1);
    });
}

function renderWhatsAppCard(n) {
    const phone = n.phone.replace(/[^0-9]/g, '');
    const intlPhone = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
    const waLink = `https://wa.me/${intlPhone}?text=${encodeURIComponent(n.message)}`;
    const borderColor = n.priority === 'high' ? 'var(--danger)' : 'var(--warning)';
    const typeLabels = { shift: 'משמרת', leave: 'יציאה', rotation: 'רוטציה' };

    return `<div style="display:flex;justify-content:space-between;align-items:center;padding:12px 16px;background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);margin-bottom:8px;border-right:4px solid ${borderColor};">
        <div style="flex:1;">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                <h4 style="margin:0;font-size:0.92em;">${n.title}</h4>
                <span style="font-size:0.7em;background:var(--bg);padding:2px 8px;border-radius:10px;color:var(--text-light);">${typeLabels[n.type]||n.type}</span>
            </div>
            <div style="font-size:0.82em;color:var(--text-light);">${n.desc}</div>
            <div style="font-size:0.78em;color:var(--text-light);margin-top:2px;">${n.phone}</div>
        </div>
        <a href="${waLink}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-size:0.85em;font-weight:600;white-space:nowrap;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            שלח
        </a>
    </div>`;
}

// ==================== TAB NAVIGATION ====================
function switchTab(tab) {
    // Update sidebar active state
    document.querySelectorAll('.sidebar-item').forEach(t => t.classList.remove('active'));
    const sidebarBtn = document.querySelector(`.sidebar-item.tab-${tab}`);
    if (sidebarBtn) sidebarBtn.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        // Preserve expanded class for sidebar state
    });
    const tabContent = document.getElementById(`tab-${tab}`);
    if (tabContent) tabContent.classList.add('active');
    if (['a','b','c','d','hq','palsam'].includes(tab)) renderCompanyTab(tab);
    if (tab === 'calendar') renderCalendar();
    if (tab === 'reports') { /* Static tab, no render needed */ }
    if (tab === 'rotation') renderRotationTab();
    if (tab === 'equipment') renderEquipmentTab();
    if (tab === 'weapons') renderWeaponsTab();
    if (tab === 'settings') renderSettingsTab();
    if (tab === 'commander') renderCommanderDashboard();
    if (tab === 'whatsapp') renderWhatsAppCenter();

    // Close sidebar on mobile after tab switch
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
}

// ==================== SOLDIER ====================
function openAddSoldier(company) {
    document.getElementById('soldierModalTitle').textContent = 'הוספת חייל';
    document.getElementById('soldierEditId').value = '';
    document.getElementById('soldierCompany').value = company || 'a';
    document.getElementById('soldierName').value = '';
    document.getElementById('soldierId').value = '';
    document.getElementById('soldierPhone').value = '';
    document.getElementById('soldierRank').value = 'טוראי';
    document.getElementById('soldierRole').value = 'לוחם';
    openModal('addSoldierModal');
    setTimeout(() => document.getElementById('soldierName').focus(), 100);
}

function openEditSoldier(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (!sol) return;
    document.getElementById('soldierModalTitle').textContent = 'עריכת חייל';
    document.getElementById('soldierEditId').value = id;
    document.getElementById('soldierName').value = sol.name;
    document.getElementById('soldierId').value = sol.personalId || '';
    document.getElementById('soldierRank').value = sol.rank || 'טוראי';
    document.getElementById('soldierCompany').value = sol.company;
    document.getElementById('soldierRole').value = sol.role || 'לוחם';
    document.getElementById('soldierPhone').value = sol.phone || '';
    openModal('addSoldierModal');
}

function saveSoldier() {
    const name = document.getElementById('soldierName').value.trim();
    if (!name) { showToast('יש להזין שם', 'error'); return; }

    const editId = document.getElementById('soldierEditId').value;
    const company = document.getElementById('soldierCompany').value;
    if (!canEdit(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }

    if (editId) {
        // Edit existing soldier
        const sol = state.soldiers.find(s => s.id === editId);
        if (sol) {
            sol.name = name;
            sol.personalId = document.getElementById('soldierId').value.trim();
            sol.rank = document.getElementById('soldierRank').value;
            sol.company = company;
            sol.role = document.getElementById('soldierRole').value;
            sol.phone = document.getElementById('soldierPhone').value.trim();
            saveState();
            closeModal('addSoldierModal');
            renderCompanyTab(company);
            renderOverview();
            updateGlobalStats();
            showToast(`${name} עודכן בהצלחה`);
        }
    } else {
        // Add new soldier
        const soldier = {
            id: 'sol_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
            name,
            personalId: document.getElementById('soldierId').value.trim(),
            rank: document.getElementById('soldierRank').value,
            company,
            role: document.getElementById('soldierRole').value,
            phone: document.getElementById('soldierPhone').value.trim()
        };
        state.soldiers.push(soldier);
        saveState();
        closeModal('addSoldierModal');
        renderCompanyTab(company);
        renderOverview();
        updateGlobalStats();
        showToast(`${name} נוסף בהצלחה`);
    }
}

function deleteSoldier(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (sol && !canEdit(sol.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!confirm('למחוק חייל זה?')) return;
    state.soldiers = state.soldiers.filter(s => s.id !== id);
    state.shifts.forEach(sh => { sh.soldiers = sh.soldiers.filter(sid => sid !== id); });
    state.leaves = state.leaves.filter(l => l.soldierId !== id);
    state.rotationGroups.forEach(g => { g.soldiers = g.soldiers.filter(sid => sid !== id); });
    saveState();
    if (sol) renderCompanyTab(sol.company);
    renderOverview();
    updateGlobalStats();
    showToast('חייל נמחק');
}

// ==================== SOLDIER TRANSFER ====================
function canTransfer(fromComp, toComp) {
    if (!currentUser) return false;
    if (isAdmin()) return true;
    if (currentUser.unit === 'gdudi') return true;
    return currentUser.unit === fromComp || currentUser.unit === toComp;
}

function openTransferSoldier(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    if (!canEdit(sol.company) && !isAdmin()) {
        showToast('אין הרשאה להעביר חייל זה', 'error');
        return;
    }

    document.getElementById('transferSoldierId').value = soldierId;
    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};
    document.getElementById('transferFromCompany').value = compNames[sol.company] || sol.company;
    document.getElementById('transferSoldierInfo').innerHTML = `
        <h4 style="margin:0 0 4px;">${sol.name}</h4>
        <div style="font-size:0.85em;color:var(--text-light);">${sol.rank || ''} | ${sol.role || ''} ${sol.personalId ? '| מ.א. ' + sol.personalId : ''}</div>`;

    const toSelect = document.getElementById('transferToCompany');
    toSelect.value = sol.company === 'a' ? 'd' : sol.company === 'd' ? 'a' : '';
    document.getElementById('transferNotes').value = '';

    updateTransferWarnings(soldierId);
    openModal('transferSoldierModal');
}

function updateTransferWarnings(soldierId) {
    const el = document.getElementById('transferWarnings');
    const warnings = [];
    const affectedShifts = state.shifts.filter(sh => sh.soldiers.includes(soldierId));
    if (affectedShifts.length > 0) warnings.push(`${affectedShifts.length} שיבוצים יוסרו מהפלוגה הנוכחית`);
    const affectedLeaves = state.leaves.filter(l => l.soldierId === soldierId);
    if (affectedLeaves.length > 0) warnings.push(`${affectedLeaves.length} יציאות יועברו לפלוגה החדשה`);
    const rotGroup = getRotationGroupForSoldier(soldierId);
    if (rotGroup) warnings.push(`החייל יוסר מקבוצת רוטציה "${rotGroup.name}"`);

    if (warnings.length > 0) {
        el.style.display = '';
        el.innerHTML = '<strong>שים לב:</strong><ul style="margin:6px 0 0;padding-right:18px;">' + warnings.map(w => `<li>${w}</li>`).join('') + '</ul>';
    } else {
        el.style.display = 'none';
    }
}

function confirmTransferSoldier() {
    const soldierId = document.getElementById('transferSoldierId').value;
    const toCompany = document.getElementById('transferToCompany').value;
    const notes = document.getElementById('transferNotes').value.trim();

    if (!toCompany) { showToast('יש לבחור פלוגת יעד', 'error'); return; }

    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    const fromCompany = sol.company;
    if (fromCompany === toCompany) { showToast('החייל כבר בפלוגה זו', 'error'); return; }

    if (!canTransfer(fromCompany, toCompany)) {
        showToast('אין הרשאה להעביר לפלוגה זו', 'error');
        return;
    }

    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};
    if (!confirm(`להעביר את ${sol.name} מ${compNames[fromCompany]} ל${compNames[toCompany]}?`)) return;

    // Cascade: remove from shifts in old company
    state.shifts.forEach(sh => {
        if (sh.company === fromCompany) {
            sh.soldiers = sh.soldiers.filter(sid => sid !== soldierId);
        }
    });

    // Cascade: update leave company references
    state.leaves.forEach(l => {
        if (l.soldierId === soldierId && l.company === fromCompany) {
            l.company = toCompany;
        }
    });

    // Cascade: remove from rotation groups
    state.rotationGroups.forEach(g => {
        g.soldiers = g.soldiers.filter(sid => sid !== soldierId);
    });

    // Update soldier company
    sol.company = toCompany;

    saveState();
    closeModal('transferSoldierModal');
    renderCompanyTab(fromCompany);
    renderCompanyTab(toCompany);
    renderOverview();
    renderDashboard();
    updateGlobalStats();
    showToast(`${sol.name} הועבר ל${compNames[toCompany]} בהצלחה`);
}

// ==================== SHIFT ====================
function openAddShift(company) {
    document.getElementById('shiftModalTitle').textContent = 'שיבוץ למשמרת';
    document.getElementById('shiftEditId').value = '';
    document.getElementById('shiftCompany').value = company || 'a';
    document.getElementById('shiftName').value = '';
    // Reset preset buttons
    document.querySelectorAll('.shift-preset-btn').forEach(b => b.classList.remove('active'));
    updateShiftOptions();
    openModal('addShiftModal');
}

function openEditShift(id) {
    const sh = state.shifts.find(s => s.id === id);
    if (!sh) return;
    document.getElementById('shiftModalTitle').textContent = 'עריכת משמרת';
    document.getElementById('shiftEditId').value = id;
    document.getElementById('shiftCompany').value = sh.company;
    document.getElementById('shiftDate').value = sh.date;
    document.getElementById('shiftName').value = sh.shiftName || '';
    document.getElementById('shiftStart').value = sh.startTime;
    document.getElementById('shiftEnd').value = sh.endTime;
    document.querySelectorAll('.shift-preset-btn').forEach(b => b.classList.remove('active'));
    updateShiftOptions();
    // Select task
    document.getElementById('shiftTask').value = sh.task;
    // Select soldiers
    const solSel = document.getElementById('shiftSoldiers');
    Array.from(solSel.options).forEach(opt => {
        opt.selected = sh.soldiers.includes(opt.value);
    });
    openModal('addShiftModal');
}

function applyShiftPreset(preset, btn) {
    const p = settings.shiftPresets[preset];
    if (!p) return;
    document.getElementById('shiftName').value = p.name;
    document.getElementById('shiftStart').value = p.start;
    document.getElementById('shiftEnd').value = p.end;
    document.querySelectorAll('.shift-preset-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    updateShiftOptions();
}

function updateShiftOptions() {
    const company = document.getElementById('shiftCompany').value;
    const date = document.getElementById('shiftDate').value;
    const startTime = document.getElementById('shiftStart').value;
    const endTime = document.getElementById('shiftEnd').value;

    // Tasks dropdown with capacity info
    const taskSel = document.getElementById('shiftTask');
    taskSel.innerHTML = '';
    const tasks = companyData[company].tasks;
    if (tasks.length === 0) {
        const opt = document.createElement('option');
        opt.value = 'כללי'; opt.textContent = 'כללי';
        taskSel.appendChild(opt);
    } else {
        tasks.forEach(t => {
            const needed = t.perShift.soldiers + t.perShift.commanders + t.perShift.officers;
            const assigned = state.shifts.filter(sh => sh.company === company && sh.task === t.name && sh.date === date &&
                sh.startTime < endTime && sh.endTime > startTime).reduce((sum, sh) => sum + sh.soldiers.length, 0);
            const opt = document.createElement('option');
            opt.value = t.name;
            opt.textContent = needed > 0 ? `${t.name} (${assigned}/${needed})` : t.name;
            if (needed > 0 && assigned >= needed) opt.style.color = '#C62828';
            taskSel.appendChild(opt);
        });
    }

    // Soldiers: only from selected company, with status indicators
    const solSel = document.getElementById('shiftSoldiers');
    solSel.innerHTML = '';

    const companySoldiers = state.soldiers.filter(s => s.company === company);
    if (companySoldiers.length > 0) {
        const groups = {};
        companySoldiers.forEach(s => {
            const unit = s.unit || 'כללי';
            if (!groups[unit]) groups[unit] = [];
            groups[unit].push(s);
        });
        Object.entries(groups).forEach(([unit, soldiers]) => {
            const grp = document.createElement('optgroup');
            grp.label = unit;
            soldiers.sort((a,b) => {
                const aStatus = getSoldierShiftStatus(a.id, date, startTime, endTime);
                const bStatus = getSoldierShiftStatus(b.id, date, startTime, endTime);
                if (aStatus.available !== bStatus.available) return aStatus.available ? -1 : 1;
                return a.name.localeCompare(b.name, 'he');
            });
            soldiers.forEach(s => {
                const status = getSoldierShiftStatus(s.id, date, startTime, endTime);
                const opt = document.createElement('option');
                opt.value = s.id;
                if (status.onLeave) {
                    opt.textContent = `${s.name} - (בבית)`;
                    opt.className = 'option-on-leave';
                } else if (status.assignedTo) {
                    opt.textContent = `${s.name} - (${status.assignedTo})`;
                    opt.className = 'option-assigned';
                } else {
                    opt.textContent = `${s.name} (${s.role})`;
                }
                grp.appendChild(opt);
            });
            solSel.appendChild(grp);
        });
    } else {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.textContent = 'אין חיילים רשומים - הוסף חיילים ידנית';
        solSel.appendChild(opt);
    }
}

// Check soldier status for a specific date/time
function getSoldierShiftStatus(soldierId, date, startTime, endTime) {
    // Check if on leave
    const onLeave = state.leaves.some(l => l.soldierId === soldierId && isOnLeaveForDate(l, date));
    if (onLeave) return { available: false, onLeave: true, assignedTo: null };

    // Check rotation
    const rotGroup = getRotationGroupForSoldier(soldierId);
    if (rotGroup) {
        const checkDate = date ? new Date(date + 'T12:00:00') : new Date();
        const rotStatus = getRotationStatus(rotGroup, checkDate);
        if (!rotStatus.inBase) return { available: false, onLeave: true, assignedTo: null };
    }

    // Check overlapping shifts
    const overlap = state.shifts.find(sh =>
        sh.date === date && sh.soldiers.includes(soldierId) &&
        sh.startTime < endTime && sh.endTime > startTime
    );
    if (overlap) {
        const taskName = overlap.task + (overlap.shiftName ? ' ' + overlap.shiftName : '');
        return { available: false, onLeave: false, assignedTo: `${taskName} ${overlap.startTime}-${overlap.endTime}` };
    }

    return { available: true, onLeave: false, assignedTo: null };
}

function isOnLeaveForDate(leave, date) {
    if (!date) return false;
    const checkDate = new Date(date + 'T12:00:00');
    const start = new Date(`${leave.startDate}T${leave.startTime || '00:00'}`);
    const end = new Date(`${leave.endDate}T${leave.endTime || '23:59'}`);
    return checkDate >= start && checkDate <= end;
}

function hasTimeOverlap(soldierId, date, startTime, endTime, excludeShiftId) {
    return state.shifts.find(sh =>
        sh.id !== excludeShiftId &&
        sh.date === date && sh.soldiers.includes(soldierId) &&
        sh.startTime < endTime && sh.endTime > startTime
    );
}

function saveShift() {
    const company = document.getElementById('shiftCompany').value;
    if (!canEdit(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }
    const taskRaw = document.getElementById('shiftTask').value;
    const task = taskRaw.replace(/\s*\(\d+\/\d+\)$/, ''); // strip capacity indicator
    const date = document.getElementById('shiftDate').value;
    const shiftName = document.getElementById('shiftName').value.trim();
    const startTime = document.getElementById('shiftStart').value;
    const endTime = document.getElementById('shiftEnd').value;
    const soldiers = Array.from(document.getElementById('shiftSoldiers').selectedOptions).map(o => o.value);
    const editId = document.getElementById('shiftEditId').value;

    if (!task || !date || !startTime || !endTime) { showToast('יש למלא את כל השדות', 'error'); return; }
    if (soldiers.length === 0) { showToast('יש לבחור חיילים לשיבוץ', 'error'); return; }

    // Validate: check for double-booking
    const conflicts = [];
    soldiers.forEach(sid => {
        const overlap = hasTimeOverlap(sid, date, startTime, endTime, editId || null);
        if (overlap) {
            const sol = state.soldiers.find(s => s.id === sid);
            conflicts.push(`${sol ? sol.name : '?'} כבר משובץ ל${overlap.task} (${overlap.startTime}-${overlap.endTime})`);
        }
    });
    if (conflicts.length > 0) {
        showToast('שיבוץ כפול: ' + conflicts.join(', '), 'error');
        return;
    }

    // Validate: check shift capacity
    const taskData = companyData[company].tasks.find(t => t.name === task);
    if (taskData) {
        const needed = taskData.perShift.soldiers + taskData.perShift.commanders + taskData.perShift.officers;
        const alreadyAssigned = state.shifts.filter(sh =>
            sh.id !== editId &&
            sh.company === company && sh.task === task && sh.date === date &&
            sh.startTime < endTime && sh.endTime > startTime
        ).reduce((sum, sh) => sum + sh.soldiers.length, 0);
        if (needed > 0 && alreadyAssigned + soldiers.length > needed) {
            showToast(`המשמרת מלאה! (${alreadyAssigned}/${needed} משובצים, ניסיון להוסיף ${soldiers.length})`, 'error');
            return;
        }
    }

    // Validate: warn if multiple commanders in same shift
    const cmdRoles = ['מ"כ', 'מ"מ', 'סמל'];
    const selectedCmds = soldiers.filter(sid => {
        const sol = state.soldiers.find(s => s.id === sid);
        return sol && cmdRoles.some(r => sol.role.includes(r));
    });
    if (selectedCmds.length > 1) {
        const cmdNames = selectedCmds.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : '?'; }).join(', ');
        if (!confirm(`שים לב! שיבצת ${selectedCmds.length} מפקדים למשמרת:\n${cmdNames}\n\nהאם אתה בטוח?`)) return;
    }

    if (editId) {
        // Update existing shift
        const sh = state.shifts.find(s => s.id === editId);
        if (sh) {
            sh.company = company;
            sh.task = task;
            sh.date = date;
            sh.shiftName = shiftName;
            sh.startTime = startTime;
            sh.endTime = endTime;
            sh.soldiers = soldiers;
            saveState();
            closeModal('addShiftModal');
            renderCompanyTab(company);
            updateGlobalStats();
            showToast(`משמרת ${task} עודכנה`);
        }
    } else {
        // Create new shift
        state.shifts.push({
            id: 'shift_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
            company, task, date, shiftName, startTime, endTime, soldiers
        });
        saveState();
        closeModal('addShiftModal');
        renderCompanyTab(company);
        updateGlobalStats();
        showToast(`משמרת ${task} נוצרה עם ${soldiers.length} חיילים`);
    }
}

function deleteShift(id) {
    const sh = state.shifts.find(s => s.id === id);
    if (sh && !canEdit(sh.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!confirm('למחוק משמרת?')) return;
    state.shifts = state.shifts.filter(s => s.id !== id);
    saveState();
    if (sh) renderCompanyTab(sh.company);
    updateGlobalStats();
    showToast('משמרת נמחקה');
}

// ==================== LEAVE ====================
function openAddLeave(company) {
    document.getElementById('leaveModalTitle').textContent = 'יציאה הביתה';
    document.getElementById('leaveEditId').value = '';
    document.getElementById('leaveCompany').value = company || 'a';
    document.getElementById('leaveNotes').value = '';
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('leaveStart').value = today;
    document.getElementById('leaveStartTime').value = '17:00';
    const d4 = new Date(); d4.setDate(d4.getDate() + 4);
    document.getElementById('leaveEnd').value = d4.toISOString().split('T')[0];
    document.getElementById('leaveEndTime').value = '08:00';
    // Show multi-select, hide single display
    document.getElementById('leaveSoldierGroup').style.display = '';
    document.getElementById('leaveSoldierDisplay').style.display = 'none';
    updateLeaveSoldiers();
    openModal('addLeaveModal');
}

function openEditLeave(id) {
    const l = state.leaves.find(x => x.id === id);
    if (!l) return;
    const sol = state.soldiers.find(s => s.id === l.soldierId);
    document.getElementById('leaveModalTitle').textContent = 'עריכת יציאה';
    document.getElementById('leaveEditId').value = id;
    document.getElementById('leaveCompany').value = l.company;
    document.getElementById('leaveStart').value = l.startDate;
    document.getElementById('leaveStartTime').value = l.startTime;
    document.getElementById('leaveEnd').value = l.endDate;
    document.getElementById('leaveEndTime').value = l.endTime;
    document.getElementById('leaveNotes').value = l.notes || '';
    // Hide multi-select, show soldier name
    document.getElementById('leaveSoldierGroup').style.display = 'none';
    document.getElementById('leaveSoldierDisplay').style.display = '';
    document.getElementById('leaveSoldierName').textContent = sol ? sol.name : '?';
    openModal('addLeaveModal');
}

function updateLeaveSoldiers() {
    const company = document.getElementById('leaveCompany').value;
    const sel = document.getElementById('leaveSoldier');
    sel.innerHTML = '';
    state.soldiers.filter(s => s.company === company).forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id; opt.textContent = `${s.name} (${s.rank})`;
        sel.appendChild(opt);
    });
}

function saveLeave() {
    const editId = document.getElementById('leaveEditId').value;
    const company = document.getElementById('leaveCompany').value;
    if (!canEdit(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }
    const startDate = document.getElementById('leaveStart').value;
    const startTime = document.getElementById('leaveStartTime').value;
    const endDate = document.getElementById('leaveEnd').value;
    const endTime = document.getElementById('leaveEndTime').value;
    const notes = document.getElementById('leaveNotes').value.trim();

    if (!startDate || !endDate) { showToast('יש למלא את כל השדות', 'error'); return; }

    if (editId) {
        // Update existing leave
        const l = state.leaves.find(x => x.id === editId);
        if (l) {
            l.startDate = startDate;
            l.startTime = startTime;
            l.endDate = endDate;
            l.endTime = endTime;
            l.notes = notes;
            saveState();
            closeModal('addLeaveModal');
            renderCompanyTab(company);
            updateGlobalStats();
            showToast('יציאה עודכנה');
        }
    } else {
        // New leaves
        const selectedSoldiers = Array.from(document.getElementById('leaveSoldier').selectedOptions).map(o => o.value);
        if (selectedSoldiers.length === 0) { showToast('יש לבחור חיילים', 'error'); return; }

        selectedSoldiers.forEach(soldierId => {
            state.leaves.push({
                id: 'leave_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
                company, soldierId, startDate, startTime, endDate, endTime, notes
            });
        });
        saveState();
        closeModal('addLeaveModal');
        renderCompanyTab(company);
        updateGlobalStats();
        showToast(`${selectedSoldiers.length} יציאות נרשמו`);
    }
}

function deleteLeave(id) {
    const l = state.leaves.find(x => x.id === id);
    if (l && !canEdit(l.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!confirm('למחוק יציאה?')) return;
    state.leaves = state.leaves.filter(x => x.id !== id);
    saveState();
    if (l) renderCompanyTab(l.company);
    updateGlobalStats();
    showToast('יציאה נמחקה');
}

// ==================== ROTATION GROUPS ====================
function updateRotGroupSoldiers() {
    const company = document.getElementById('rotGroupCompany').value;
    const sel = document.getElementById('rotGroupSoldiers');
    sel.innerHTML = '';
    const soldiers = company === 'all' ? state.soldiers : state.soldiers.filter(s => s.company === company);
    soldiers.forEach(s => {
        const compName = companyData[s.company] ? companyData[s.company].name : '';
        const opt = document.createElement('option');
        opt.value = s.id;
        opt.textContent = company === 'all' ? `[${compName}] ${s.name} (${s.rank})` : `${s.name} (${s.rank} - ${s.role})`;
        sel.appendChild(opt);
    });
}

function saveRotationGroup() {
    const name = document.getElementById('rotGroupName').value.trim();
    const startDate = document.getElementById('rotGroupStartDate').value;
    const daysIn = parseInt(document.getElementById('rotGroupDaysIn').value) || 10;
    const daysOut = parseInt(document.getElementById('rotGroupDaysOut').value) || 4;
    const soldiers = Array.from(document.getElementById('rotGroupSoldiers').selectedOptions).map(o => o.value);
    if (!name || !startDate) { showToast('יש למלא שם ותאריך', 'error'); return; }
    if (soldiers.length === 0) { showToast('יש לבחור חיילים', 'error'); return; }

    state.rotationGroups.push({
        id: 'rot_' + Date.now(),
        name, startDate, daysIn, daysOut, soldiers
    });
    saveState();
    closeModal('addRotationGroupModal');
    renderRotationTab();
    ['a','b','c','d'].forEach(renderCompanyTab);
    updateGlobalStats();
    showToast(`קבוצת רוטציה "${name}" נוצרה`);
}

function deleteRotGroup(id) {
    if (!confirm('למחוק קבוצת רוטציה?')) return;
    state.rotationGroups = state.rotationGroups.filter(g => g.id !== id);
    saveState();
    renderRotationTab();
    showToast('קבוצה נמחקה');
}

// ==================== HELPERS ====================
function isCurrentlyOnLeave(leave) {
    const now = new Date();
    const start = new Date(`${leave.startDate}T${leave.startTime}`);
    const end = new Date(`${leave.endDate}T${leave.endTime}`);
    return now >= start && now <= end;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.classList.add('modal-open');
}
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
    // Only remove if no other modals are open
    if (!document.querySelector('.modal-overlay.active')) {
        document.body.classList.remove('modal-open');
    }
}

function showToast(msg, type='success') {
    const c = document.getElementById('toastContainer');
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `${type==='success'?'&#10003;':'&#10007;'} ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

function updateGlobalStats() {
    const unit = currentUser ? currentUser.unit : 'gdudi';
    const isGdudi = unit === 'gdudi';

    // Filter data by user's unit
    const filterCompanies = isGdudi ? ALL_COMPANIES : [unit];

    let totalSol = 0, totalCmd = 0, totalOff = 0;
    filterCompanies.forEach(k => {
        const c = companyData[k];
        totalSol += c.totals.soldiers;
        totalCmd += c.totals.commanders;
        totalOff += c.totals.officers;
    });

    document.getElementById('totalSoldiers').textContent = totalSol;
    document.getElementById('totalCommanders').textContent = totalCmd;
    document.getElementById('totalOfficers').textContent = totalOff;
    const totalEl = document.getElementById('statTotalPersonnel');
    if (totalEl) totalEl.textContent = totalSol + totalCmd + totalOff;

    const relevantShifts = state.shifts.filter(sh => filterCompanies.includes(sh.company));
    const assignedIds = new Set();
    relevantShifts.forEach(sh => sh.soldiers.forEach(sid => assignedIds.add(sid)));

    const relevantLeaves = state.leaves.filter(l => filterCompanies.includes(l.company));
    const manualLeaveCount = relevantLeaves.filter(l => isCurrentlyOnLeave(l)).length;

    let rotLeaveCount = 0;
    state.rotationGroups.forEach(g => {
        const status = getRotationStatus(g, new Date());
        if (!status.inBase) {
            const groupInUnit = g.soldiers.filter(sid => {
                const sol = state.soldiers.find(s => s.id === sid);
                return sol && filterCompanies.includes(sol.company);
            });
            rotLeaveCount += groupInUnit.length;
        }
    });

    const totalLeave = manualLeaveCount + rotLeaveCount;

    document.getElementById('totalOnDuty').textContent = assignedIds.size;
    document.getElementById('totalOnLeave').textContent = totalLeave;

    const statAssigned = document.getElementById('statAssigned');
    const statHome = document.getElementById('statHome');
    const statAvailable = document.getElementById('statAvailable');
    if (statAssigned) statAssigned.textContent = assignedIds.size;
    if (statHome) statHome.textContent = totalLeave;
    if (statAvailable) {
        const regSoldiers = state.soldiers.filter(s => filterCompanies.includes(s.company)).length;
        statAvailable.textContent = Math.max(0, regSoldiers - assignedIds.size - totalLeave);
    }
}

// ==================== SETTINGS PAGE ====================
function renderSettingsTab() {
    const container = document.getElementById('settingsContent');
    if (!container) return;
    const companyNames = { a: 'פלוגה א', b: 'פלוגה ב', c: 'פלוגה ג', d: 'פלוגה ד', hq: 'חפ"ק מג"ד', palsam: 'פלס"ם' };

    container.innerHTML = `
    <!-- Shift Presets -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> שעות משמרות</h3>
        <p style="font-size:0.83em;color:var(--text-light);margin-bottom:12px;">הגדר שעות ברירת מחדל לכפתורי בוקר/צהריים/לילה</p>
        ${['morning','afternoon','night','fullday'].map(key => {
            const p = settings.shiftPresets[key];
            if (!p) return '';
            const labels = { morning: 'בוקר', afternoon: 'צהריים', night: 'לילה', fullday: 'יום שלם' };
            return `<div class="settings-row" style="margin-bottom:8px;">
                <div class="settings-field"><label>${labels[key]}</label></div>
                <div class="settings-field"><label>התחלה</label><input type="time" value="${p.start}" onchange="updatePreset('${key}','start',this.value)"></div>
                <div class="settings-field"><label>סיום</label><input type="time" value="${p.end}" onchange="updatePreset('${key}','end',this.value)"></div>
            </div>`;
        }).join('')}
    </div>

    <!-- Rotation -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg> רוטציה</h3>
        <div class="settings-row">
            <div class="settings-field">
                <label>ימים בבסיס</label>
                <input type="number" min="1" max="30" value="${settings.rotationDaysIn}" onchange="settings.rotationDaysIn=parseInt(this.value);saveSettings();">
            </div>
            <div class="settings-field">
                <label>ימים בבית</label>
                <input type="number" min="1" max="14" value="${settings.rotationDaysOut}" onchange="settings.rotationDaysOut=parseInt(this.value);saveSettings();">
            </div>
        </div>
    </div>

    <!-- Security -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> אבטחה</h3>
        <div class="settings-field">
            <label>סיסמת כניסה</label>
            <input type="password" value="${settings.password}" onchange="settings.password=this.value.trim();saveSettings();showToast('סיסמה עודכנה');">
        </div>
        <div class="settings-field">
            <label>שם מנהל מערכת (אדמין)</label>
            <input type="text" value="${settings.adminName}" onchange="settings.adminName=this.value.trim();saveSettings();showToast('שם אדמין עודכן');">
        </div>
    </div>

    <!-- Google Sheets -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> קישור גוגל שיטס</h3>
        <div class="settings-field">
            <label>מזהה הגיליון (Sheet ID)</label>
            <input type="text" value="${settings.sheetId}" style="direction:ltr;font-family:monospace;font-size:0.8em;" onchange="settings.sheetId=this.value.trim();saveSettings();showToast('מזהה גיליון עודכן');">
        </div>
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="syncFromGoogleSheets(false)">&#128260; סנכרון מחדש</button>
        </div>
    </div>

    <!-- Firebase Sync -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> סנכרון Firebase</h3>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && typeof firestoreReady !== 'undefined' && firestoreReady ? '#27ae60' : '#e74c3c'};"></div>
            <span style="font-size:0.85em;">${typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED ? (typeof firestoreReady !== 'undefined' && firestoreReady ? 'מחובר ומסנכרן' : 'מנסה להתחבר...') : 'לא מוגדר'}</span>
        </div>
        <p style="font-size:0.78em;color:var(--text-light);">
            ${typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED ? 'הנתונים מסונכרנים בזמן אמת בין כל המשתמשים.' : 'להפעלה: ערוך את firebase-config.js והגדר FIREBASE_ENABLED = true עם פרטי הפרויקט שלך.'}
        </p>
    </div>

    <!-- Data Management -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> ניהול נתונים</h3>
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="exportAllData()">&#128190; ייצוא נתונים (JSON)</button>
            <button class="btn btn-warning" onclick="document.getElementById('importFile').click();">&#128194; ייבוא נתונים (JSON)</button>
            <input type="file" id="importFile" accept=".json" style="display:none" onchange="importAllData(this)">
            <button class="btn btn-danger" onclick="resetAllData()">&#9888; איפוס כל הנתונים</button>
        </div>
        <div style="margin-top:12px;font-size:0.83em;color:var(--text-light);">
            סה"כ: ${state.soldiers.length} חיילים | ${state.shifts.length} משמרות | ${state.leaves.length} יציאות | ${state.rotationGroups.length} קבוצות רוטציה
        </div>
    </div>

    <!-- Task Management -->
    <div class="settings-card" style="grid-column: 1 / -1;">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><line x1="9" y1="12" x2="15" y2="12"/><line x1="9" y1="16" x2="15" y2="16"/></svg> ניהול משימות לפי פלוגה</h3>
        <div class="form-group" style="margin-bottom:14px;">
            <select id="settingsTaskCompany" onchange="renderTaskEditor()" style="padding:8px 12px;border-radius:8px;border:1px solid var(--border);font-family:inherit;">
                ${ALL_COMPANIES.filter(k => companyData[k].tasks.length > 0 || ['a','b','c','d'].includes(k)).map(k =>
                    `<option value="${k}">${companyNames[k]}</option>`
                ).join('')}
            </select>
        </div>
        <div id="taskEditorContainer"></div>
    </div>`;

    renderTaskEditor();
}

function renderTaskEditor() {
    const compKey = document.getElementById('settingsTaskCompany')?.value || 'a';
    const container = document.getElementById('taskEditorContainer');
    if (!container) return;
    const tasks = companyData[compKey].tasks;

    container.innerHTML = `
        <div class="task-edit-row task-edit-header">
            <span>שם משימה</span><span>חיילים</span><span>מפקדים</span><span>קצינים</span><span>משמרות</span><span></span>
        </div>
        ${tasks.map((t, i) => `
            <div class="task-edit-row">
                <input value="${t.name}" onchange="updateTask('${compKey}',${i},'name',this.value)">
                <input type="number" min="0" value="${t.perShift.soldiers}" onchange="updateTask('${compKey}',${i},'soldiers',parseInt(this.value))">
                <input type="number" min="0" value="${t.perShift.commanders}" onchange="updateTask('${compKey}',${i},'commanders',parseInt(this.value))">
                <input type="number" min="0" value="${t.perShift.officers}" onchange="updateTask('${compKey}',${i},'officers',parseInt(this.value))">
                <input type="number" min="1" value="${t.shifts}" onchange="updateTask('${compKey}',${i},'shifts',parseInt(this.value))">
                <button class="btn btn-danger btn-sm" onclick="deleteTask('${compKey}',${i})">&#10005;</button>
            </div>
        `).join('')}
        <div style="margin-top:10px;">
            <button class="btn btn-success btn-sm" onclick="addTask('${compKey}')">+ הוסף משימה</button>
        </div>`;
}

function updateTask(compKey, index, field, value) {
    const t = companyData[compKey].tasks[index];
    if (field === 'name') t.name = value;
    else if (field === 'shifts') t.shifts = value;
    else {
        t.perShift[field] = value;
        t[field] = value * t.shifts;
    }
    saveTasksToStorage();
    showToast('משימה עודכנה');
}

function addTask(compKey) {
    companyData[compKey].tasks.push({
        name: 'משימה חדשה', soldiers: 3, commanders: 0, officers: 0, shifts: 3,
        perShift: { soldiers: 1, commanders: 0, officers: 0 }
    });
    saveTasksToStorage();
    renderTaskEditor();
}

function deleteTask(compKey, index) {
    if (!confirm('למחוק משימה?')) return;
    companyData[compKey].tasks.splice(index, 1);
    saveTasksToStorage();
    renderTaskEditor();
}

function saveTasksToStorage() {
    const tasksData = {};
    ALL_COMPANIES.forEach(k => { tasksData[k] = companyData[k].tasks; });
    localStorage.setItem('battalionTasks', JSON.stringify(tasksData));
    if (typeof firebaseSaveTasks === 'function') firebaseSaveTasks();
}

function loadTasksFromStorage() {
    const saved = localStorage.getItem('battalionTasks');
    if (saved) {
        const tasksData = JSON.parse(saved);
        ALL_COMPANIES.forEach(k => {
            if (tasksData[k]) companyData[k].tasks = tasksData[k];
        });
    }
}

function updatePreset(key, field, value) {
    settings.shiftPresets[key][field] = value;
    saveSettings();
    showToast('שעות עודכנו');
}

function exportAllData() {
    const data = { state, settings, tasks: {} };
    ALL_COMPANIES.forEach(k => { data.tasks[k] = companyData[k].tasks; });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `battalion_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    showToast('נתונים יוצאו בהצלחה');
}

function importAllData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.state) { state = data.state; saveState(); }
            if (data.settings) { settings = { ...settings, ...data.settings }; saveSettings(); }
            if (data.tasks) {
                ALL_COMPANIES.forEach(k => { if (data.tasks[k]) companyData[k].tasks = data.tasks[k]; });
                saveTasksToStorage();
            }
            renderAll();
            renderSettingsTab();
            showToast('נתונים יובאו בהצלחה');
        } catch (err) {
            showToast('שגיאה בקריאת הקובץ', 'error');
        }
    };
    reader.readAsText(file);
    input.value = '';
}

function resetAllData() {
    if (!confirm('האם אתה בטוח? כל הנתונים יימחקו!')) return;
    if (!confirm('אישור סופי - למחוק הכל?')) return;
    state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [] };
    saveState();
    localStorage.removeItem('battalionTasks');
    localStorage.removeItem('battalionDataVersion');
    syncFromGoogleSheets(false);
    renderAll();
    renderSettingsTab();
    showToast('כל הנתונים אופסו');
}

function exportCompanyData(compKey) {
    const comp = companyData[compKey];
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const shifts = state.shifts.filter(s => s.company === compKey);
    const leaves = state.leaves.filter(l => l.company === compKey);
    let csv = '\uFEFF' + `${comp.name} (${comp.location})\n\n`;
    csv += 'שם,דרגה,תפקיד,מספר אישי,טלפון\n';
    soldiers.forEach(s => csv += `${s.name},${s.rank},${s.role},${s.personalId},${s.phone}\n`);
    csv += '\nמשמרות\nמשימה,תאריך,התחלה,סיום,חיילים\n';
    shifts.forEach(sh => {
        const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : ''; }).join(' | ');
        csv += `${sh.task},${sh.date},${sh.startTime},${sh.endTime},${names}\n`;
    });
    csv += '\nיציאות\nחייל,יציאה,שעה,חזרה,שעה,הערות\n';
    leaves.forEach(l => {
        const s = state.soldiers.find(x => x.id === l.soldierId);
        csv += `${s?s.name:''},${l.startDate},${l.startTime},${l.endDate},${l.endTime},${l.notes}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${comp.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
}

// ==================== REPORTS ====================
function getReportDateStr() {
    return new Date().toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function reportHeader(title) {
    return `<div class="report-header">
        <div>
            <h2>${title}</h2>
            <div class="report-date">${getReportDateStr()}</div>
        </div>
        <div class="report-actions">
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;" onclick="window.print()">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                הדפסה
            </button>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.2);color:white;" onclick="document.getElementById('reportOutput').innerHTML=''">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><path d="M18 6L6 18M6 6l12 12"/></svg>
                סגור
            </button>
        </div>
    </div>`;
}

function generateDailyReport() {
    const todayStr = new Date().toISOString().split('T')[0];
    let html = reportHeader('דו"ח מצב יומי');
    html += '<div class="report-body">';

    // Summary stats
    html += '<h3>סיכום כללי</h3>';
    const totalSoldiers = state.soldiers.length;
    const activeLeaves = state.leaves.filter(l => l.startDate <= todayStr && l.endDate >= todayStr);
    const todayShifts = state.shifts.filter(sh => sh.date === todayStr);
    const assignedToday = new Set();
    todayShifts.forEach(sh => sh.soldiers.forEach(sid => assignedToday.add(sid)));

    html += `<div class="stat-row"><span>סה"כ חיילים רשומים</span><strong>${totalSoldiers}</strong></div>`;
    html += `<div class="stat-row"><span>ביציאה היום</span><strong>${activeLeaves.length}</strong></div>`;
    html += `<div class="stat-row"><span>משובצים היום</span><strong>${assignedToday.size}</strong></div>`;
    html += `<div class="stat-row"><span>משמרות פעילות</span><strong>${todayShifts.length}</strong></div>`;

    // Rotation status
    if (state.rotationGroups.length > 0) {
        html += '<h3>מצב רוטציה</h3>';
        html += '<table><tr><th>קבוצה</th><th>מצב</th><th>יום במחזור</th><th>חיילים</th></tr>';
        state.rotationGroups.forEach(g => {
            const status = getRotationStatus(g, new Date());
            const statusText = status.inBase ? 'בבסיס' : 'בבית';
            const statusColor = status.inBase ? '#27ae60' : '#e74c3c';
            html += `<tr><td>${g.name}</td><td style="color:${statusColor};font-weight:600;">${statusText}</td><td>${status.dayInCycle}/${g.daysIn + g.daysOut}</td><td>${g.soldiers.length}</td></tr>`;
        });
        html += '</table>';
    }

    // Per company summary
    html += '<h3>מצב לפי פלוגה</h3>';
    html += '<table><tr><th>פלוגה</th><th>רשומים</th><th>ביציאה</th><th>משובצים</th><th>זמינים</th></tr>';
    ALL_COMPANIES.forEach(k => {
        const comp = companyData[k];
        const reg = state.soldiers.filter(s => s.company === k).length;
        const leave = activeLeaves.filter(l => l.company === k).length;
        const assigned = todayShifts.filter(sh => sh.company === k).reduce((sum, sh) => sum + sh.soldiers.length, 0);
        const available = Math.max(0, reg - leave - assigned);
        html += `<tr><td>${comp.name}</td><td>${reg}</td><td>${leave}</td><td>${assigned}</td><td>${available}</td></tr>`;
    });
    html += '</table>';

    // Today's shifts
    if (todayShifts.length > 0) {
        html += '<h3>שיבוצים להיום</h3>';
        html += '<table><tr><th>פלוגה</th><th>משימה</th><th>שעות</th><th>חיילים</th></tr>';
        todayShifts.forEach(sh => {
            const compName = companyData[sh.company] ? companyData[sh.company].name : sh.company;
            const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : '?'; }).join(', ');
            html += `<tr><td>${compName}</td><td>${sh.task}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
        });
        html += '</table>';
    }

    html += '</div>';
    document.getElementById('reportOutput').innerHTML = html;
    document.getElementById('reportOutput').scrollIntoView({ behavior: 'smooth' });
}

function generateCompanyReport() {
    let html = reportHeader('דו"ח פלוגות - כוח אדם');
    html += '<div class="report-body">';

    ALL_COMPANIES.forEach(k => {
        const comp = companyData[k];
        const soldiers = state.soldiers.filter(s => s.company === k);
        html += `<h3>${comp.name} (${comp.location || ''}) - ${soldiers.length} חיילים</h3>`;
        if (soldiers.length > 0) {
            html += '<table><tr><th>שם</th><th>דרגה</th><th>תפקיד</th><th>מ.א.</th><th>טלפון</th></tr>';
            soldiers.forEach(s => {
                html += `<tr><td>${s.name}</td><td>${s.rank}</td><td>${s.role}</td><td>${s.personalId || '-'}</td><td>${s.phone || '-'}</td></tr>`;
            });
            html += '</table>';
        } else {
            html += '<p style="color:var(--text-light);font-size:0.85em;">אין חיילים רשומים</p>';
        }
    });

    html += '</div>';
    document.getElementById('reportOutput').innerHTML = html;
    document.getElementById('reportOutput').scrollIntoView({ behavior: 'smooth' });
}

function generateShiftsReport() {
    const todayStr = new Date().toISOString().split('T')[0];
    let html = reportHeader('דו"ח שיבוצים');
    html += '<div class="report-body">';

    // Group shifts by company
    ALL_COMPANIES.forEach(k => {
        const comp = companyData[k];
        const shifts = state.shifts.filter(sh => sh.company === k && sh.date >= todayStr).sort((a, b) => a.date.localeCompare(b.date));
        if (shifts.length === 0) return;

        html += `<h3>${comp.name} - ${shifts.length} שיבוצים</h3>`;
        html += '<table><tr><th>תאריך</th><th>משימה</th><th>משמרת</th><th>שעות</th><th>חיילים</th></tr>';
        shifts.forEach(sh => {
            const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : '?'; }).join(', ');
            html += `<tr><td>${formatDate(sh.date)}</td><td>${sh.task}</td><td>${sh.shiftName || '-'}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
        });
        html += '</table>';
    });

    if (state.shifts.filter(sh => sh.date >= todayStr).length === 0) {
        html += '<p style="text-align:center;color:var(--text-light);padding:20px;">אין שיבוצים פעילים</p>';
    }

    html += '</div>';
    document.getElementById('reportOutput').innerHTML = html;
    document.getElementById('reportOutput').scrollIntoView({ behavior: 'smooth' });
}

function generateLeavesReport() {
    const todayStr = new Date().toISOString().split('T')[0];
    let html = reportHeader('דו"ח יציאות');
    html += '<div class="report-body">';

    // Active leaves
    const activeLeaves = state.leaves.filter(l => l.endDate >= todayStr).sort((a, b) => a.startDate.localeCompare(b.startDate));

    ALL_COMPANIES.forEach(k => {
        const comp = companyData[k];
        const leaves = activeLeaves.filter(l => l.company === k);
        if (leaves.length === 0) return;

        html += `<h3>${comp.name} - ${leaves.length} יציאות</h3>`;
        html += '<table><tr><th>חייל</th><th>יציאה</th><th>חזרה</th><th>הערות</th></tr>';
        leaves.forEach(l => {
            const sol = state.soldiers.find(s => s.id === l.soldierId);
            const isActive = l.startDate <= todayStr && l.endDate >= todayStr;
            const rowStyle = isActive ? 'background:#fff8e1;' : '';
            html += `<tr style="${rowStyle}"><td>${sol ? sol.name : '?'}</td><td>${formatDate(l.startDate)} ${l.startTime}</td><td>${formatDate(l.endDate)} ${l.endTime}</td><td>${l.notes || '-'}</td></tr>`;
        });
        html += '</table>';
    });

    if (activeLeaves.length === 0) {
        html += '<p style="text-align:center;color:var(--text-light);padding:20px;">אין יציאות פעילות</p>';
    }

    html += '</div>';
    document.getElementById('reportOutput').innerHTML = html;
    document.getElementById('reportOutput').scrollIntoView({ behavior: 'smooth' });
}

// ==================== PDF / EXCEL EXPORT ====================
function exportReportPDF(type) {
    if (typeof jspdf === 'undefined') { showToast('ספריית PDF לא נטענה', 'error'); return; }
    const todayStr = new Date().toISOString().split('T')[0];
    let html = buildReportHTML(type);
    if (!html) return;

    // Create a temporary hidden div for rendering
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;top:-9999px;right:0;width:210mm;direction:rtl;font-family:Arial,sans-serif;font-size:12px;padding:15mm;';
    tmp.innerHTML = html;
    document.body.appendChild(tmp);

    const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.html(tmp, {
        callback: function(doc) {
            const titles = { daily: 'דוח_יומי', company: 'דוח_פלוגות', shifts: 'דוח_שיבוצים', leaves: 'דוח_יציאות' };
            doc.save(`${titles[type] || 'דוח'}_${todayStr}.pdf`);
            document.body.removeChild(tmp);
            showToast('PDF נוצר בהצלחה');
        },
        x: 10, y: 10, width: 190, windowWidth: 800
    });
}

function buildReportHTML(type) {
    const todayStr = new Date().toISOString().split('T')[0];
    const dateStr = getReportDateStr();
    let html = '';

    if (type === 'daily') {
        const activeLeaves = state.leaves.filter(l => l.startDate <= todayStr && l.endDate >= todayStr);
        const todayShifts = state.shifts.filter(sh => sh.date === todayStr);
        const assignedToday = new Set();
        todayShifts.forEach(sh => sh.soldiers.forEach(sid => assignedToday.add(sid)));

        html = `<h2 style="text-align:center;margin-bottom:4px;">דו"ח מצב יומי</h2><p style="text-align:center;color:#666;margin-bottom:16px;">${dateStr}</p>`;
        html += `<table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:12px;">
            <tr><td><strong>סה"כ חיילים</strong></td><td>${state.soldiers.length}</td></tr>
            <tr><td><strong>ביציאה היום</strong></td><td>${activeLeaves.length}</td></tr>
            <tr><td><strong>משובצים היום</strong></td><td>${assignedToday.size}</td></tr>
            <tr><td><strong>משמרות פעילות</strong></td><td>${todayShifts.length}</td></tr></table>`;
        html += `<h3>מצב לפי פלוגה</h3><table border="1" cellpadding="6" cellspacing="0" style="width:100%;border-collapse:collapse;">
            <tr style="background:#1a3a5c;color:white;"><th>פלוגה</th><th>רשומים</th><th>ביציאה</th><th>משובצים</th><th>זמינים</th></tr>`;
        ALL_COMPANIES.forEach(k => {
            const comp = companyData[k];
            const reg = state.soldiers.filter(s => s.company === k).length;
            const lv = activeLeaves.filter(l => l.company === k).length;
            const asg = todayShifts.filter(sh => sh.company === k).reduce((sum, sh) => sum + sh.soldiers.length, 0);
            html += `<tr><td>${comp.name}</td><td>${reg}</td><td>${lv}</td><td>${asg}</td><td>${Math.max(0,reg-lv-asg)}</td></tr>`;
        });
        html += '</table>';
    } else if (type === 'company') {
        html = `<h2 style="text-align:center;margin-bottom:4px;">דו"ח פלוגות - כוח אדם</h2><p style="text-align:center;color:#666;margin-bottom:16px;">${dateStr}</p>`;
        ALL_COMPANIES.forEach(k => {
            const soldiers = state.soldiers.filter(s => s.company === k);
            html += `<h3>${companyData[k].name} - ${soldiers.length} חיילים</h3>`;
            if (soldiers.length > 0) {
                html += `<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
                <tr style="background:#1a3a5c;color:white;"><th>שם</th><th>דרגה</th><th>תפקיד</th><th>מ.א.</th><th>טלפון</th></tr>`;
                soldiers.forEach(s => html += `<tr><td>${s.name}</td><td>${s.rank}</td><td>${s.role}</td><td>${s.personalId||'-'}</td><td>${s.phone||'-'}</td></tr>`);
                html += '</table>';
            }
        });
    } else if (type === 'shifts') {
        html = `<h2 style="text-align:center;margin-bottom:4px;">דו"ח שיבוצים</h2><p style="text-align:center;color:#666;margin-bottom:16px;">${dateStr}</p>`;
        ALL_COMPANIES.forEach(k => {
            const shifts = state.shifts.filter(sh => sh.company === k && sh.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date));
            if (!shifts.length) return;
            html += `<h3>${companyData[k].name} - ${shifts.length} שיבוצים</h3>`;
            html += `<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            <tr style="background:#1a3a5c;color:white;"><th>תאריך</th><th>משימה</th><th>שעות</th><th>חיילים</th></tr>`;
            shifts.forEach(sh => {
                const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : '?'; }).join(', ');
                html += `<tr><td>${formatDate(sh.date)}</td><td>${sh.task}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
            });
            html += '</table>';
        });
    } else if (type === 'leaves') {
        const activeLeaves = state.leaves.filter(l => l.endDate >= todayStr).sort((a,b) => a.startDate.localeCompare(b.startDate));
        html = `<h2 style="text-align:center;margin-bottom:4px;">דו"ח יציאות</h2><p style="text-align:center;color:#666;margin-bottom:16px;">${dateStr}</p>`;
        ALL_COMPANIES.forEach(k => {
            const leaves = activeLeaves.filter(l => l.company === k);
            if (!leaves.length) return;
            html += `<h3>${companyData[k].name} - ${leaves.length} יציאות</h3>`;
            html += `<table border="1" cellpadding="5" cellspacing="0" style="width:100%;border-collapse:collapse;margin-bottom:10px;">
            <tr style="background:#1a3a5c;color:white;"><th>חייל</th><th>יציאה</th><th>חזרה</th><th>הערות</th></tr>`;
            leaves.forEach(l => {
                const sol = state.soldiers.find(s => s.id === l.soldierId);
                html += `<tr><td>${sol?sol.name:'?'}</td><td>${formatDate(l.startDate)} ${l.startTime}</td><td>${formatDate(l.endDate)} ${l.endTime}</td><td>${l.notes||'-'}</td></tr>`;
            });
            html += '</table>';
        });
    }
    return html;
}

function exportReportExcel(type) {
    if (typeof XLSX === 'undefined') { showToast('ספריית Excel לא נטענה', 'error'); return; }
    const todayStr = new Date().toISOString().split('T')[0];
    const wb = XLSX.utils.book_new();
    const titles = { daily: 'דוח_יומי', company: 'דוח_פלוגות', shifts: 'דוח_שיבוצים', leaves: 'דוח_יציאות' };

    if (type === 'daily') {
        const activeLeaves = state.leaves.filter(l => l.startDate <= todayStr && l.endDate >= todayStr);
        const todayShifts = state.shifts.filter(sh => sh.date === todayStr);
        const assignedToday = new Set();
        todayShifts.forEach(sh => sh.soldiers.forEach(sid => assignedToday.add(sid)));

        // Summary sheet
        const summary = [
            ['דו"ח מצב יומי', getReportDateStr()], [],
            ['סה"כ חיילים', state.soldiers.length],
            ['ביציאה היום', activeLeaves.length],
            ['משובצים היום', assignedToday.size],
            ['משמרות פעילות', todayShifts.length],
            [], ['פלוגה', 'רשומים', 'ביציאה', 'משובצים', 'זמינים']
        ];
        ALL_COMPANIES.forEach(k => {
            const reg = state.soldiers.filter(s => s.company === k).length;
            const lv = activeLeaves.filter(l => l.company === k).length;
            const asg = todayShifts.filter(sh => sh.company === k).reduce((sum, sh) => sum + sh.soldiers.length, 0);
            summary.push([companyData[k].name, reg, lv, asg, Math.max(0,reg-lv-asg)]);
        });
        const ws = XLSX.utils.aoa_to_sheet(summary);
        ws['!cols'] = [{wch:20},{wch:12},{wch:12},{wch:12},{wch:12}];
        XLSX.utils.book_append_sheet(wb, ws, 'סיכום');
    } else if (type === 'company') {
        ALL_COMPANIES.forEach(k => {
            const soldiers = state.soldiers.filter(s => s.company === k);
            const data = [['שם', 'דרגה', 'תפקיד', 'מ.א.', 'טלפון']];
            soldiers.forEach(s => data.push([s.name, s.rank, s.role, s.personalId||'', s.phone||'']));
            const ws = XLSX.utils.aoa_to_sheet(data);
            ws['!cols'] = [{wch:20},{wch:12},{wch:18},{wch:14},{wch:14}];
            XLSX.utils.book_append_sheet(wb, ws, companyData[k].name);
        });
    } else if (type === 'shifts') {
        const data = [['פלוגה', 'תאריך', 'משימה', 'משמרת', 'שעות', 'חיילים']];
        ALL_COMPANIES.forEach(k => {
            state.shifts.filter(sh => sh.company === k && sh.date >= todayStr).sort((a,b) => a.date.localeCompare(b.date)).forEach(sh => {
                const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? s.name : '?'; }).join(', ');
                data.push([companyData[k].name, formatDate(sh.date), sh.task, sh.shiftName||'', `${sh.startTime}-${sh.endTime}`, names]);
            });
        });
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{wch:14},{wch:12},{wch:16},{wch:10},{wch:12},{wch:40}];
        XLSX.utils.book_append_sheet(wb, ws, 'שיבוצים');
    } else if (type === 'leaves') {
        const data = [['פלוגה', 'חייל', 'יציאה', 'שעה', 'חזרה', 'שעה', 'הערות']];
        const activeLeaves = state.leaves.filter(l => l.endDate >= todayStr).sort((a,b) => a.startDate.localeCompare(b.startDate));
        activeLeaves.forEach(l => {
            const sol = state.soldiers.find(s => s.id === l.soldierId);
            const compName = companyData[l.company] ? companyData[l.company].name : l.company;
            data.push([compName, sol?sol.name:'?', formatDate(l.startDate), l.startTime, formatDate(l.endDate), l.endTime, l.notes||'']);
        });
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{wch:14},{wch:18},{wch:12},{wch:8},{wch:12},{wch:8},{wch:20}];
        XLSX.utils.book_append_sheet(wb, ws, 'יציאות');
    }

    XLSX.writeFile(wb, `${titles[type]||'דוח'}_${todayStr}.xlsx`);
    showToast('Excel נוצר בהצלחה');
}

// ==================== EQUIPMENT (צל"מ) MODULE ====================

// --- Signature Canvas Setup ---
let signCtx = null, signDrawing = false;
let returnCtx = null, returnDrawing = false;

function setupSignatureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');

    // Set actual pixel dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a3a5c';

    let drawing = false;

    function getPos(e) {
        const r = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        return { x: touch.clientX - r.left, y: touch.clientY - r.top };
    }

    function start(e) {
        e.preventDefault();
        drawing = true;
        const p = getPos(e);
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
    }
    function move(e) {
        if (!drawing) return;
        e.preventDefault();
        const p = getPos(e);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
    }
    function stop(e) {
        if (drawing) {
            drawing = false;
            ctx.closePath();
        }
    }

    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);

    return ctx;
}

function clearCanvasById(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

function clearSignatureCanvas() { clearCanvasById('signatureCanvas'); }
function clearReturnSignatureCanvas() { clearCanvasById('returnSignatureCanvas'); }

function isCanvasEmpty(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 3; i < data.length; i += 4) {
        if (data[i] > 0) return false;
    }
    return true;
}

function getCanvasDataURL(canvasId) {
    const canvas = document.getElementById(canvasId);
    return canvas ? canvas.toDataURL('image/png') : '';
}

// --- Show/hide custom type field ---
document.addEventListener('change', function(e) {
    if (e.target.id === 'equipType') {
        document.getElementById('equipCustomTypeGroup').style.display = e.target.value === 'אחר' ? '' : 'none';
    }
});

// --- Equipment CRUD ---
function openAddEquipment() {
    document.getElementById('equipmentModalTitle').textContent = 'הוספת פריט ציוד';
    document.getElementById('equipEditId').value = '';
    document.getElementById('equipType').value = 'נשק';
    document.getElementById('equipCustomTypeGroup').style.display = 'none';
    document.getElementById('equipSerial').value = '';
    document.getElementById('equipCompany').value = 'gdudi';
    document.getElementById('equipCondition').value = 'תקין';
    document.getElementById('equipNotes').value = '';
    openModal('addEquipmentModal');
}

function openEditEquipment(id) {
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    document.getElementById('equipmentModalTitle').textContent = 'עריכת פריט ציוד';
    document.getElementById('equipEditId').value = id;
    const knownTypes = ['נשק','משקפת','אמר"ל','מצפן','מכ"מ','קשר','מגן בליסטי','קסדה','אפוד'];
    if (knownTypes.includes(eq.type)) {
        document.getElementById('equipType').value = eq.type;
        document.getElementById('equipCustomTypeGroup').style.display = 'none';
    } else {
        document.getElementById('equipType').value = 'אחר';
        document.getElementById('equipCustomTypeGroup').style.display = '';
        document.getElementById('equipCustomType').value = eq.type;
    }
    document.getElementById('equipSerial').value = eq.serial;
    document.getElementById('equipCompany').value = eq.company;
    document.getElementById('equipCondition').value = eq.condition;
    document.getElementById('equipNotes').value = eq.notes || '';
    openModal('addEquipmentModal');
}

function saveEquipment() {
    let type = document.getElementById('equipType').value;
    if (type === 'אחר') {
        type = document.getElementById('equipCustomType').value.trim();
        if (!type) { showToast('יש להזין שם ציוד', 'error'); return; }
    }
    const serial = document.getElementById('equipSerial').value.trim();
    if (!serial) { showToast('יש להזין מספר סידורי', 'error'); return; }

    const editId = document.getElementById('equipEditId').value;
    const company = document.getElementById('equipCompany').value;
    const condition = document.getElementById('equipCondition').value;
    const notes = document.getElementById('equipNotes').value.trim();

    if (editId) {
        const eq = state.equipment.find(e => e.id === editId);
        if (eq) {
            eq.type = type;
            eq.serial = serial;
            eq.company = company;
            eq.condition = condition;
            eq.notes = notes;
        }
        showToast('פריט עודכן');
    } else {
        // Check duplicate serial
        if (state.equipment.some(e => e.serial === serial)) {
            showToast('מספר סידורי כבר קיים במערכת!', 'error');
            return;
        }
        state.equipment.push({
            id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
            type, serial, company, condition, notes,
            holderId: null, holderName: '', holderPhone: '',
            assignedDate: null, signatureImg: null
        });
        showToast(`${type} (${serial}) נוסף`);
    }
    saveState();
    closeModal('addEquipmentModal');
    renderEquipmentTab();
}

function deleteEquipment(id) {
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    if (eq.holderId) {
        if (!confirm(`הציוד מוחזק ע"י ${eq.holderName}. למחוק בכל זאת?`)) return;
    } else {
        if (!confirm('למחוק פריט ציוד?')) return;
    }
    state.equipment = state.equipment.filter(e => e.id !== id);
    saveState();
    renderEquipmentTab();
    showToast('פריט נמחק');
}

// --- Sign Equipment ---
function openSignEquipment() {
    // Populate available equipment
    const sel = document.getElementById('signEquipSelect');
    sel.innerHTML = '<option value="">-- בחר פריט --</option>';
    state.equipment.filter(e => !e.holderId && e.condition !== 'תקול').forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.type} | ${e.serial}`;
        sel.appendChild(opt);
    });
    document.getElementById('signEquipInfo').style.display = 'none';
    document.getElementById('signSoldierInfo').style.display = 'none';
    // Equipment is battalion-wide, default to all companies
    document.getElementById('signCompany').value = 'all';
    updateSignSoldiers();
    openModal('signEquipmentModal');
    setTimeout(() => {
        setupSignatureCanvas('signatureCanvas');
        clearSignatureCanvas();
    }, 100);
}

function onSignEquipSelect() {
    const id = document.getElementById('signEquipSelect').value;
    const info = document.getElementById('signEquipInfo');
    if (!id) { info.style.display = 'none'; return; }
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    info.style.display = '';
    info.innerHTML = `<strong>${eq.type}</strong> | מס' סידורי: <strong>${eq.serial}</strong> | מצב: ${eq.condition} | ${eq.notes || ''}`;
}

function updateSignSoldiers() {
    const company = document.getElementById('signCompany').value;
    const sel = document.getElementById('signSoldier');
    sel.innerHTML = '<option value="">-- בחר חייל --</option>';

    const soldiers = company === 'all'
        ? [...state.soldiers]
        : state.soldiers.filter(s => s.company === company);

    if (soldiers.length > 0) {
        if (company === 'all') {
            // Group by company
            const compGroups = {};
            soldiers.forEach(s => {
                const compName = companyData[s.company] ? companyData[s.company].name : s.company;
                if (!compGroups[compName]) compGroups[compName] = [];
                compGroups[compName].push(s);
            });
            Object.entries(compGroups).forEach(([compName, sols]) => {
                const grp = document.createElement('optgroup');
                grp.label = compName;
                sols.sort((a, b) => a.name.localeCompare(b.name, 'he'));
                sols.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = `${s.name} (${s.role})`;
                    grp.appendChild(opt);
                });
                sel.appendChild(grp);
            });
        } else {
            // Group by unit within company
            const groups = {};
            soldiers.forEach(s => {
                const unit = s.unit || 'כללי';
                if (!groups[unit]) groups[unit] = [];
                groups[unit].push(s);
            });
            const sortedEntries = Object.entries(groups).sort(([a], [b]) => {
                if (a === 'סגל') return -1;
                if (b === 'סגל') return 1;
                return a.localeCompare(b, 'he');
            });
            sortedEntries.forEach(([unit, sols]) => {
                const grp = document.createElement('optgroup');
                grp.label = unit;
                sols.sort((a, b) => a.name.localeCompare(b.name, 'he'));
                sols.forEach(s => {
                    const opt = document.createElement('option');
                    opt.value = s.id;
                    opt.textContent = `${s.name} (${s.role})`;
                    grp.appendChild(opt);
                });
                sel.appendChild(grp);
            });
        }
    } else {
        const opt = document.createElement('option');
        opt.disabled = true;
        opt.textContent = 'אין חיילים רשומים - נסה לסנכרן מגוגל שיטס';
        sel.appendChild(opt);
    }
    document.getElementById('signSoldierInfo').style.display = 'none';
}

function onSignSoldierSelect() {
    const id = document.getElementById('signSoldier').value;
    const info = document.getElementById('signSoldierInfo');
    if (!id) { info.style.display = 'none'; return; }
    const sol = state.soldiers.find(s => s.id === id);
    if (!sol) return;
    info.style.display = '';
    info.innerHTML = `<strong>${sol.name}</strong> | ${sol.role} | ${sol.personalId || ''} | ${sol.phone || 'אין טלפון'}`;
}

function confirmSignEquipment() {
    const equipId = document.getElementById('signEquipSelect').value;
    const soldierId = document.getElementById('signSoldier').value;

    if (!equipId) { showToast('יש לבחור פריט ציוד', 'error'); return; }
    if (!soldierId) { showToast('יש לבחור חייל', 'error'); return; }
    if (isCanvasEmpty('signatureCanvas')) { showToast('יש לחתום על המסך', 'error'); return; }

    const eq = state.equipment.find(e => e.id === equipId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!eq || !sol) return;

    const signatureImg = getCanvasDataURL('signatureCanvas');
    const now = new Date();
    const dateStr = now.toISOString();

    // Update equipment
    eq.holderId = sol.id;
    eq.holderName = sol.name;
    eq.holderPhone = sol.phone || '';
    eq.assignedDate = dateStr;
    eq.signatureImg = signatureImg;

    // Add to signature log
    const logEntry = {
        id: 'sig_' + Date.now(),
        type: 'assign',
        equipId: eq.id,
        equipType: eq.type,
        equipSerial: eq.serial,
        soldierId: sol.id,
        soldierName: sol.name,
        soldierPhone: sol.phone || '',
        soldierPersonalId: sol.personalId || '',
        date: dateStr,
        signatureImg
    };
    state.signatureLog.push(logEntry);
    saveState();

    // Generate PDF
    generateSignaturePDF(logEntry, eq, sol);

    closeModal('signEquipmentModal');
    renderEquipmentTab();
    showToast(`${sol.name} חתם על ${eq.type} (${eq.serial})`);
}

// --- Return Equipment ---
function openReturnEquipment() {
    const sel = document.getElementById('returnEquipSelect');
    sel.innerHTML = '<option value="">-- בחר פריט --</option>';
    state.equipment.filter(e => e.holderId).forEach(e => {
        const opt = document.createElement('option');
        opt.value = e.id;
        opt.textContent = `${e.type} | ${e.serial} | מחזיק: ${e.holderName}`;
        sel.appendChild(opt);
    });
    document.getElementById('returnEquipInfo').style.display = 'none';
    document.getElementById('returnNotes').value = '';
    openModal('returnEquipmentModal');
    setTimeout(() => {
        setupSignatureCanvas('returnSignatureCanvas');
        clearReturnSignatureCanvas();
    }, 100);
}

function onReturnEquipSelect() {
    const id = document.getElementById('returnEquipSelect').value;
    const info = document.getElementById('returnEquipInfo');
    if (!id) { info.style.display = 'none'; return; }
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    info.style.display = '';
    const sol = state.soldiers.find(s => s.id === eq.holderId);
    info.innerHTML = `
        <strong>${eq.type}</strong> | מס': <strong>${eq.serial}</strong><br>
        מחזיק: <strong>${eq.holderName}</strong> | ${eq.holderPhone || ''}<br>
        תאריך חתימה: ${eq.assignedDate ? formatDate(eq.assignedDate.split('T')[0]) : '-'}
    `;
}

function confirmReturnEquipment() {
    const equipId = document.getElementById('returnEquipSelect').value;
    if (!equipId) { showToast('יש לבחור פריט', 'error'); return; }
    if (isCanvasEmpty('returnSignatureCanvas')) { showToast('יש לחתום על המסך', 'error'); return; }

    const eq = state.equipment.find(e => e.id === equipId);
    if (!eq) return;

    const signatureImg = getCanvasDataURL('returnSignatureCanvas');
    const returnNotes = document.getElementById('returnNotes').value.trim();
    const now = new Date();
    const sol = state.soldiers.find(s => s.id === eq.holderId);

    // Log entry
    const logEntry = {
        id: 'sig_' + Date.now(),
        type: 'return',
        equipId: eq.id,
        equipType: eq.type,
        equipSerial: eq.serial,
        soldierId: eq.holderId,
        soldierName: eq.holderName,
        soldierPhone: eq.holderPhone || '',
        soldierPersonalId: sol ? sol.personalId || '' : '',
        date: now.toISOString(),
        signatureImg,
        notes: returnNotes
    };
    state.signatureLog.push(logEntry);

    // Clear equipment holder
    eq.holderId = null;
    eq.holderName = '';
    eq.holderPhone = '';
    eq.assignedDate = null;
    eq.signatureImg = null;
    if (returnNotes) eq.notes = returnNotes;

    saveState();

    // Generate PDF
    generateReturnPDF(logEntry, eq);

    closeModal('returnEquipmentModal');
    renderEquipmentTab();
    showToast(`ציוד ${eq.type} (${eq.serial}) זוכה בהצלחה`);
}

// --- Render Equipment Tab ---
function setEquipmentFilter(filter, btn) {
    equipmentFilter = filter;
    const container = btn.parentElement;
    container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderEquipmentTab();
}

function renderEquipmentTab() {
    const searchInput = document.getElementById('equipmentSearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let items = [...state.equipment];

    // Search
    if (query) {
        items = items.filter(e =>
            e.type.toLowerCase().includes(query) ||
            e.serial.toLowerCase().includes(query) ||
            (e.holderName && e.holderName.toLowerCase().includes(query)) ||
            (e.notes && e.notes.toLowerCase().includes(query))
        );
    }

    // Filter
    if (equipmentFilter === 'assigned') items = items.filter(e => e.holderId);
    else if (equipmentFilter === 'available') items = items.filter(e => !e.holderId && e.condition !== 'תקול');
    else if (equipmentFilter === 'faulty') items = items.filter(e => e.condition === 'תקול');

    // Stats
    const statsEl = document.getElementById('equipmentStats');
    if (statsEl) {
        const total = state.equipment.length;
        const assigned = state.equipment.filter(e => e.holderId).length;
        const available = state.equipment.filter(e => !e.holderId && e.condition !== 'תקול').length;
        const faulty = state.equipment.filter(e => e.condition === 'תקול').length;
        statsEl.innerHTML = `
            <div class="quick-stat"><div class="value">${total}</div><div class="label">סה"כ פריטים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success);"><div class="value">${assigned}</div><div class="label">מוחזקים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--info);"><div class="value">${available}</div><div class="label">פנויים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger);"><div class="value">${faulty}</div><div class="label">תקולים</div></div>
        `;
    }

    // Count
    const countEl = document.getElementById('equipmentCount');
    if (countEl) countEl.textContent = items.length;

    // Table
    const tableContainer = document.getElementById('equipmentTableContainer');
    if (!tableContainer) return;

    const companyNames = { a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק', palsam:'פלס"ם', gdudi:'גדודי' };

    if (items.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div><p>אין פריטי ציוד</p></div>';
    } else {
        tableContainer.innerHTML = `
            <div class="task-table-wrapper"><div class="table-scroll">
                <table class="equip-table">
                    <thead><tr>
                        <th>סוג ציוד</th><th>מספר סידורי</th><th>מסגרת</th><th>מצב</th>
                        <th>סטטוס</th><th>מחזיק</th><th>טלפון</th><th>תאריך חתימה</th><th>פעולות</th>
                    </tr></thead>
                    <tbody>
                        ${items.map(e => {
                            const statusClass = e.condition === 'תקול' ? 'faulty' : e.holderId ? 'assigned' : 'available';
                            const statusText = e.condition === 'תקול' ? 'תקול' : e.holderId ? 'מוחזק' : 'פנוי';
                            return `<tr>
                                <td style="font-weight:600;">${e.type}</td>
                                <td style="direction:ltr;font-family:monospace;">${e.serial}</td>
                                <td>${companyNames[e.company] || e.company}</td>
                                <td>${e.condition}</td>
                                <td><span class="equip-status ${statusClass}">${statusText}</span></td>
                                <td class="equip-holder-name">${e.holderName || '-'}</td>
                                <td style="direction:ltr;">${e.holderPhone || '-'}</td>
                                <td>${e.assignedDate ? formatDate(e.assignedDate.split('T')[0]) : '-'}</td>
                                <td style="display:flex;gap:4px;justify-content:center;">
                                    <button class="btn btn-edit btn-sm" onclick="openEditEquipment('${e.id}')" title="עריכה">&#9998;</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteEquipment('${e.id}')" title="מחק">&#10005;</button>
                                </td>
                            </tr>`;
                        }).join('')}
                    </tbody>
                </table>
            </div></div>
        `;
    }

    // Signature History
    renderSignatureHistory();
}

function renderSignatureHistory() {
    const container = document.getElementById('signatureHistoryContainer');
    const countEl = document.getElementById('signatureHistoryCount');
    if (!container) return;

    const logs = [...state.signatureLog].reverse().slice(0, 50); // Last 50
    if (countEl) countEl.textContent = state.signatureLog.length;

    if (logs.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg></div><p>אין היסטוריית חתימות</p></div>';
        return;
    }

    container.innerHTML = logs.map(log => {
        const isReturn = log.type === 'return';
        const d = new Date(log.date);
        const dateFormatted = d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        return `<div class="sig-history-card ${isReturn ? 'return' : ''}">
            <div class="sig-info">
                <h4>${isReturn ? '&#8634; זיכוי' : '&#9998; חתימה'} - ${log.equipType} (${log.equipSerial})</h4>
                <div class="meta">${log.soldierName} | ${log.soldierPersonalId || ''} | ${log.soldierPhone || ''}</div>
                <div class="meta">${dateFormatted}${log.notes ? ' | ' + log.notes : ''}</div>
            </div>
            <div class="sig-actions">
                <img class="sig-preview" src="${log.signatureImg}" alt="חתימה">
                <button class="btn btn-primary btn-sm" onclick="redownloadPDF('${log.id}')">&#128196; PDF</button>
            </div>
        </div>`;
    }).join('');
}

function redownloadPDF(logId) {
    const log = state.signatureLog.find(l => l.id === logId);
    if (!log) return;
    const eq = state.equipment.find(e => e.id === log.equipId);
    const sol = state.soldiers.find(s => s.id === log.soldierId);
    if (log.type === 'return') {
        generateReturnPDF(log, eq || { type: log.equipType, serial: log.equipSerial });
    } else {
        generateSignaturePDF(log, eq || { type: log.equipType, serial: log.equipSerial }, sol || { name: log.soldierName, personalId: log.soldierPersonalId, phone: log.soldierPhone });
    }
}

// --- PDF Generation ---
function generateSignaturePDF(logEntry, eq, sol) {
    const now = new Date(logEntry.date);
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:auto;padding:30px;">
        <div style="text-align:center;margin-bottom:20px;">
            <h1 style="color:#1a3a5c;margin:0;">טופס חתימה על ציוד מבוקר</h1>
            <p style="color:#7f8c8d;margin:4px 0;">מערכת שיבוץ גדודית - צל"מ</p>
            <hr style="border:1px solid #1a3a5c;margin:12px 0;">
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px;font-weight:700;width:140px;background:#f0f2f5;">תאריך:</td><td style="padding:8px;">${dateStr}</td>
                <td style="padding:8px;font-weight:700;width:140px;background:#f0f2f5;">שעה:</td><td style="padding:8px;">${timeStr}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#f0f2f5;">סוג ציוד:</td><td style="padding:8px;">${eq.type}</td>
                <td style="padding:8px;font-weight:700;background:#f0f2f5;">מספר סידורי:</td><td style="padding:8px;direction:ltr;font-family:monospace;">${eq.serial}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#f0f2f5;">שם מלא:</td><td style="padding:8px;">${sol.name}</td>
                <td style="padding:8px;font-weight:700;background:#f0f2f5;">מספר אישי:</td><td style="padding:8px;">${sol.personalId || '-'}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#f0f2f5;">טלפון:</td><td style="padding:8px;direction:ltr;">${sol.phone || '-'}</td>
                <td style="padding:8px;font-weight:700;background:#f0f2f5;">סוג פעולה:</td><td style="padding:8px;color:#2E7D32;font-weight:700;">חתימה / קבלת ציוד</td></tr>
        </table>
        <div style="margin-bottom:10px;font-weight:700;">הצהרה:</div>
        <div style="background:#f0f2f5;padding:12px;border-radius:8px;font-size:0.9em;margin-bottom:20px;">
            אני הח"מ מאשר/ת שקיבלתי לידי את הציוד המפורט לעיל במצב תקין, ואני מתחייב/ת לשמור עליו
            ולהחזירו במצבו כפי שקיבלתי אותו.
        </div>
        <div style="text-align:center;margin-bottom:10px;font-weight:700;">חתימה:</div>
        <div style="text-align:center;">
            <img src="${logEntry.signatureImg}" style="max-width:400px;height:120px;border:1px solid #dfe6e9;border-radius:8px;">
        </div>
        <hr style="border:1px solid #dfe6e9;margin:20px 0;">
        <div style="text-align:center;font-size:0.75em;color:#7f8c8d;">
            מסמך זה הופק אוטומטית ממערכת שיבוץ גדודית | ${dateStr} ${timeStr}
        </div>
    </div>`;

    downloadPDF(html, `חתימה_${eq.type}_${eq.serial}_${sol.name}_${dateStr.replace(/\./g,'-')}`);
}

function generateReturnPDF(logEntry, eq) {
    const now = new Date(logEntry.date);
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:auto;padding:30px;">
        <div style="text-align:center;margin-bottom:20px;">
            <h1 style="color:#E65100;margin:0;">טופס זיכוי / החזרת ציוד</h1>
            <p style="color:#7f8c8d;margin:4px 0;">מערכת שיבוץ גדודית - צל"מ</p>
            <hr style="border:1px solid #E65100;margin:12px 0;">
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
            <tr><td style="padding:8px;font-weight:700;width:140px;background:#FFF3E0;">תאריך:</td><td style="padding:8px;">${dateStr}</td>
                <td style="padding:8px;font-weight:700;width:140px;background:#FFF3E0;">שעה:</td><td style="padding:8px;">${timeStr}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#FFF3E0;">סוג ציוד:</td><td style="padding:8px;">${eq.type}</td>
                <td style="padding:8px;font-weight:700;background:#FFF3E0;">מספר סידורי:</td><td style="padding:8px;direction:ltr;font-family:monospace;">${eq.serial}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#FFF3E0;">שם מחזיר:</td><td style="padding:8px;">${logEntry.soldierName}</td>
                <td style="padding:8px;font-weight:700;background:#FFF3E0;">מספר אישי:</td><td style="padding:8px;">${logEntry.soldierPersonalId || '-'}</td></tr>
            <tr><td style="padding:8px;font-weight:700;background:#FFF3E0;">טלפון:</td><td style="padding:8px;direction:ltr;">${logEntry.soldierPhone || '-'}</td>
                <td style="padding:8px;font-weight:700;background:#FFF3E0;">סוג פעולה:</td><td style="padding:8px;color:#E65100;font-weight:700;">זיכוי / החזרת ציוד</td></tr>
            ${logEntry.notes ? `<tr><td style="padding:8px;font-weight:700;background:#FFF3E0;">הערות:</td><td colspan="3" style="padding:8px;">${logEntry.notes}</td></tr>` : ''}
        </table>
        <div style="text-align:center;margin-bottom:10px;font-weight:700;">חתימת מחזיר:</div>
        <div style="text-align:center;">
            <img src="${logEntry.signatureImg}" style="max-width:400px;height:120px;border:1px solid #dfe6e9;border-radius:8px;">
        </div>
        <hr style="border:1px solid #dfe6e9;margin:20px 0;">
        <div style="text-align:center;font-size:0.75em;color:#7f8c8d;">
            מסמך זה הופק אוטומטית ממערכת שיבוץ גדודית | ${dateStr} ${timeStr}
        </div>
    </div>`;

    downloadPDF(html, `זיכוי_${eq.type}_${eq.serial}_${logEntry.soldierName}_${dateStr.replace(/\./g,'-')}`);
}

function downloadPDF(htmlContent, filename) {
    // Use browser print-to-PDF via hidden iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.left = '-9999px';
    iframe.style.top = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '600px';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; }
            table { border-collapse: collapse; }
            td { border: 1px solid #dfe6e9; }
        </style>
    </head><body>${htmlContent}</body></html>`);
    doc.close();

    setTimeout(() => {
        iframe.contentWindow.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
}

// --- Equipment CSV Export ---
function exportEquipmentCSV() {
    let csv = '\uFEFF' + 'ציוד לחימה מבוקר - צל"מ\n\n';
    csv += 'סוג ציוד,מספר סידורי,מסגרת,מצב,סטטוס,מחזיק,טלפון,תאריך חתימה,הערות\n';
    const companyNames = { a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק', palsam:'פלס"ם', gdudi:'גדודי' };
    state.equipment.forEach(e => {
        const status = e.condition === 'תקול' ? 'תקול' : e.holderId ? 'מוחזק' : 'פנוי';
        csv += `${e.type},${e.serial},${companyNames[e.company] || e.company},${e.condition},${status},${e.holderName || '-'},${e.holderPhone || '-'},${e.assignedDate ? formatDate(e.assignedDate.split('T')[0]) : '-'},${e.notes || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `צלמ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    showToast('צל"מ יוצא ל-CSV');
}

// ==================== WEAPONS PROJECT ====================

const HEALTH_QUESTIONS = [
    { id: 'q1', text: 'האם עברת אירוע של איבוד הכרה ב-5 שנים האחרונות?' },
    { id: 'q2', text: 'האם הזדקקת לטיפול נפשי/פסיכיאטרי/פסיכולוגי?' },
    { id: 'q3', text: 'האם אתה סובל מהפרעות שינה?' },
    { id: 'q4', text: 'האם הזדקקת חלקית לאשפוז?' },
    { id: 'q5', text: 'האם אתה סובל מאפילפסיה או התקפים?' },
    { id: 'q6', text: 'האם אתה סובל ממחלת לב?' },
    { id: 'q7', text: 'האם אתה סובל מסוכרת?' },
    { id: 'q8', text: 'האם את/ה נוטל/ת תרופות באופן קבוע?' },
    { id: 'q9', text: 'האם יש לך בעיות ראייה משמעותיות?' },
    { id: 'q10', text: 'האם אתה סובל מבעיות שמיעה?' },
    { id: 'q11', text: 'האם אתה סובל ממחלה כרונית כלשהי?' },
    { id: 'q12', text: 'האם עברת ניתוח ב-5 שנים האחרונות?' },
    { id: 'q13', text: 'האם אתה סובל מדיכאון, חרדה או מתח נפשי?' },
    { id: 'q14', text: 'האם יש לך היסטוריה של שימוש בסמים/אלכוהול?' },
    { id: 'q15', text: 'האם קיבלת אי-פעם צו הרחקה או הגבלה?' },
    { id: 'q16', text: 'האם יש לך הרשעות פליליות?' },
    { id: 'q17', text: 'האם עברת אירוע טראומטי (תאונה, פציעה, אלימות)?' },
    { id: 'q18', text: 'האם אתה סובל מבעיות תפקוד מוטוריות?' },
    { id: 'q19', text: 'האם יש לך מחשבות אובדניות או ניסיונות בעבר?' },
    { id: 'q20', text: 'האם יש ברשותך נשק חוקי נוסף?' }
];

const WEAPON_DECLARATIONS = [
    'אני מבקש שיימסר לי נשק צבאי ממסטור אחד.',
    'אני מתחייב שאחזיר בזאת כי לא קיים ברשותי נשק צבאי ממסטור אחר. אם החתימה מעודכנת בארכנת, מהו מספר הרישיון?',
    'אני מתחייב מעודכנת בזאת כי ידוע לי שעל"מ יפנה לצבור"ט ולמשטרת הבריאות לשם בדיקת המקבק שנפי התשובה מצד ופרטים מן הפלילי ואני מסכים לכך.',
    'בתאריך עבדתי אימונון בהפעלה בנק"ד ומשמורת בנשק מסוג',
    'תקופת שירות בצה"ל / משטרה מתאריך עד תאריך',
    'דרגה, לוח פלוגי, בכירא',
    'מצ"ב אישור לכך, החתום על ידי מפקדת המפקדת המסתפיית / מקביל היחידה.',
    'מצ"ב המלצה של לכתו הביטחוני / או של מפקדי השירותי במילואים.',
    'מצ"ב כתב ויתור סדיויות רפואית מצב בריאותי.',
    'מצ"ב אישור רפואי לקבלת נשק צבאי.',
    'מצ"ב הצהרת התנאים לקבלת נשק צבאי.',
    'אני מצהיר בזאת כי הפרטים שמסרתי לעיל נכונים, שלמים ומדויקים.'
];

let currentWizardStep = 1;
let wpSignatureCanvases = {};

function setWeaponsFilter(filter, btn) {
    weaponsFilter = filter;
    document.querySelectorAll('#tab-weapons .filter-btn').forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
    renderWeaponsTab();
}

function getWeaponsStatus(soldierId) {
    const rec = state.weaponsData.find(r => r.soldierId === soldierId);
    if (!rec) return 'none';
    let filled = 0;
    if (rec.firstName && rec.lastName && rec.idNumber) filled++;
    if (rec.healthAnswers && Object.keys(rec.healthAnswers).length >= 15) filled++;
    if (rec.waiverSig) filled++;
    if (rec.requestSig) filled++;
    if (rec.idPhoto) filled++;
    if (filled >= 5) return 'complete';
    if (filled > 0) return 'partial';
    return 'none';
}

function renderWeaponsTab() {
    const searchInput = document.getElementById('weaponsSearch');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    let soldiers = [...state.soldiers];
    if (query) soldiers = soldiers.filter(s => s.name.toLowerCase().includes(query));

    // Apply filter
    if (weaponsFilter !== 'all') {
        soldiers = soldiers.filter(s => getWeaponsStatus(s.id) === weaponsFilter);
    }

    // Stats
    const statsEl = document.getElementById('weaponsStats');
    if (statsEl) {
        const total = state.soldiers.length;
        const complete = state.soldiers.filter(s => getWeaponsStatus(s.id) === 'complete').length;
        const partial = state.soldiers.filter(s => getWeaponsStatus(s.id) === 'partial').length;
        const none = total - complete - partial;
        statsEl.innerHTML = `
            <div class="quick-stat"><div class="value">${total}</div><div class="label">סה"כ חיילים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success);"><div class="value">${complete}</div><div class="label">הושלם</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--warning);"><div class="value">${partial}</div><div class="label">בתהליך</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger);"><div class="value">${none}</div><div class="label">לא התחיל</div></div>
        `;
    }

    document.getElementById('weaponsSoldiersCount').textContent = soldiers.length;

    const companyNames = { a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק', palsam:'פלס"ם' };
    const container = document.getElementById('weaponsTableContainer');

    if (!soldiers.length) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-light);">לא נמצאו חיילים</div>';
        return;
    }

    const statusLabel = { complete: 'הושלם', partial: 'בתהליך', none: 'לא התחיל' };
    const statusClass = { complete: 'wp-status-complete', partial: 'wp-status-partial', none: 'wp-status-none' };

    let html = '<div class="task-table-wrapper"><div class="table-scroll"><table><thead><tr><th>שם</th><th>מסגרת</th><th>מ.א.</th><th>סטטוס</th><th>פעולות</th></tr></thead><tbody>';
    soldiers.forEach(s => {
        const status = getWeaponsStatus(s.id);
        html += `<tr>
            <td style="font-weight:600;">${s.name}</td>
            <td>${companyNames[s.company] || s.company}</td>
            <td>${s.personalId || '-'}</td>
            <td><span class="wp-status-badge ${statusClass[status]}">${statusLabel[status]}</span></td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openWeaponsForm('${s.id}')">מלא טפסים</button>
                ${status !== 'none' ? `<button class="btn btn-sm" style="background:#5C6BC0;color:white;" onclick="generateWeaponsPDF('${s.id}')">הורד תמונות</button>` : ''}
            </td>
        </tr>`;
    });
    html += '</tbody></table></div></div>';
    container.innerHTML = html;
}

function openWeaponsForm(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    document.getElementById('weaponsSoldierId').value = soldierId;
    document.getElementById('weaponsModalTitle').textContent = `מילוי טפסי נשק - ${sol.name}`;

    // Load existing data or create new
    let rec = state.weaponsData.find(r => r.soldierId === soldierId);
    if (!rec) {
        // Auto-fill from soldier data
        const nameParts = sol.name.split(' ');
        rec = {
            soldierId,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            idNumber: '',
            personalNum: sol.personalId || '',
            birthYear: '',
            fatherName: '',
            phone: sol.phone || '',
            phone2: '',
            address: '',
            city: '',
            rank: sol.rank || '',
            role: sol.role || '',
            healthAnswers: {},
            healthSig: null,
            waiverSig: null,
            requestSig: null,
            cmdSig: null,
            cmdName: '',
            cmdRank: '',
            cmdId: '',
            cmdRole: '',
            weaponType: 'M-16',
            weaponSerial: '',
            idPhoto: null,
            date: new Date().toISOString().split('T')[0]
        };
    }

    // Fill form fields
    document.getElementById('wpFirstName').value = rec.firstName;
    document.getElementById('wpLastName').value = rec.lastName;
    document.getElementById('wpIdNumber').value = rec.idNumber;
    document.getElementById('wpPersonalNum').value = rec.personalNum;
    document.getElementById('wpBirthYear').value = rec.birthYear;
    document.getElementById('wpFatherName').value = rec.fatherName;
    document.getElementById('wpPhone').value = rec.phone;
    document.getElementById('wpPhone2').value = rec.phone2;
    document.getElementById('wpAddress').value = rec.address;
    document.getElementById('wpCity').value = rec.city;
    document.getElementById('wpRank').value = rec.rank;
    document.getElementById('wpRole').value = rec.role;
    document.getElementById('wpWeaponType').value = rec.weaponType || 'M-16';
    document.getElementById('wpWeaponSerial').value = rec.weaponSerial;
    document.getElementById('wpCmdName').value = rec.cmdName;
    document.getElementById('wpCmdRank').value = rec.cmdRank;
    document.getElementById('wpCmdId').value = rec.cmdId;
    document.getElementById('wpCmdRole').value = rec.cmdRole;

    // Render health questions
    renderHealthQuestions(rec.healthAnswers);

    // Render weapon declarations
    renderWeaponDeclarations();

    // Update waiver name display
    document.getElementById('waiverNameDisplay').textContent = rec.firstName + ' ' + rec.lastName;

    // ID photo
    if (rec.idPhoto) {
        document.getElementById('idPhotoImg').src = rec.idPhoto;
        document.getElementById('idPhotoPreview').style.display = '';
        document.getElementById('idUploadArea').style.display = 'none';
    } else {
        document.getElementById('idPhotoPreview').style.display = 'none';
        document.getElementById('idUploadArea').style.display = '';
    }

    // Go to step 1
    currentWizardStep = 1;
    updateWizardUI();

    openModal('weaponsFormModal');

    // Init signature canvases after modal is visible
    setTimeout(() => {
        ['healthSigCanvas', 'waiverSigCanvas', 'requestSigCanvas', 'cmdSigCanvas'].forEach(cId => {
            initWpSignatureCanvas(cId);
            // Restore saved signature
            const key = cId.replace('Canvas', '').replace('Sig', 'Sig');
            const sigKey = cId === 'healthSigCanvas' ? 'healthSig' : cId === 'waiverSigCanvas' ? 'waiverSig' : cId === 'requestSigCanvas' ? 'requestSig' : 'cmdSig';
            if (rec[sigKey]) restoreCanvasImage(cId, rec[sigKey]);
        });
    }, 200);
}

function renderHealthQuestions(answers) {
    const container = document.getElementById('healthQuestions');
    container.innerHTML = HEALTH_QUESTIONS.map(q => `
        <div class="health-q-row">
            <span class="health-q-text">${q.text}</span>
            <div class="health-q-options">
                <label class="health-radio"><input type="radio" name="${q.id}" value="yes" ${answers[q.id] === 'yes' ? 'checked' : ''}> כן</label>
                <label class="health-radio"><input type="radio" name="${q.id}" value="no" ${answers[q.id] === 'no' ? 'checked' : ''}> לא</label>
            </div>
        </div>
    `).join('');
}

function renderWeaponDeclarations() {
    const container = document.getElementById('weaponDeclarations');
    container.innerHTML = WEAPON_DECLARATIONS.map((d, i) => `
        <div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
            <span style="font-weight:700;color:var(--primary);min-width:24px;">${i + 1}.</span>
            <span>${d}</span>
        </div>
    `).join('');
}

function updateWizardUI() {
    // Update step indicators
    document.querySelectorAll('.wizard-step').forEach(s => {
        const step = parseInt(s.dataset.step);
        s.classList.toggle('active', step === currentWizardStep);
        s.classList.toggle('done', step < currentWizardStep);
    });

    // Show/hide pages
    document.querySelectorAll('.wizard-page').forEach((p, i) => {
        p.classList.toggle('active', i + 1 === currentWizardStep);
    });

    // Button states
    document.getElementById('wpBtnPrev').disabled = currentWizardStep <= 1;
    document.getElementById('wpBtnNext').style.display = currentWizardStep >= 5 ? 'none' : '';
}

function weaponsWizardNext() {
    if (currentWizardStep < 5) {
        // Update waiver name on step 3
        if (currentWizardStep === 1) {
            document.getElementById('waiverNameDisplay').textContent =
                document.getElementById('wpFirstName').value + ' ' + document.getElementById('wpLastName').value;
        }
        currentWizardStep++;
        updateWizardUI();
    }
}

function weaponsWizardPrev() {
    if (currentWizardStep > 1) {
        currentWizardStep--;
        updateWizardUI();
    }
}

function initWpSignatureCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Resize canvas to fit container
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = Math.min(600, rect.width - 20);

    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let drawing = false;
    const getPos = (e) => {
        const r = canvas.getBoundingClientRect();
        const touch = e.touches ? e.touches[0] : e;
        const scaleX = canvas.width / r.width;
        const scaleY = canvas.height / r.height;
        return { x: (touch.clientX - r.left) * scaleX, y: (touch.clientY - r.top) * scaleY };
    };

    const start = (e) => { e.preventDefault(); drawing = true; ctx.beginPath(); const p = getPos(e); ctx.moveTo(p.x, p.y); };
    const move = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#000'; ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { drawing = false; };

    canvas.onmousedown = start;
    canvas.onmousemove = move;
    canvas.onmouseup = end;
    canvas.onmouseleave = end;
    canvas.ontouchstart = start;
    canvas.ontouchmove = move;
    canvas.ontouchend = end;

    wpSignatureCanvases[canvasId] = true;
}

function clearWpCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function restoreCanvasImage(canvasId, dataUrl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !dataUrl) return;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
    img.src = dataUrl;
}

function isWpCanvasEmpty(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return true;
    const ctx = canvas.getContext('2d');
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i] < 250 || data[i + 1] < 250 || data[i + 2] < 250) return false;
    }
    return true;
}

function getWpCanvasDataURL(canvasId) {
    const canvas = document.getElementById(canvasId);
    return canvas ? canvas.toDataURL('image/png') : null;
}

function handleIdPhotoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('idPhotoImg').src = e.target.result;
        document.getElementById('idPhotoPreview').style.display = '';
        document.getElementById('idUploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeIdPhoto() {
    document.getElementById('idPhotoPreview').style.display = 'none';
    document.getElementById('idUploadArea').style.display = '';
    document.getElementById('idPhotoInput').value = '';
    document.getElementById('idPhotoImg').src = '';
}

function collectWeaponsFormData() {
    const soldierId = document.getElementById('weaponsSoldierId').value;
    const healthAnswers = {};
    HEALTH_QUESTIONS.forEach(q => {
        const checked = document.querySelector(`input[name="${q.id}"]:checked`);
        if (checked) healthAnswers[q.id] = checked.value;
    });

    return {
        soldierId,
        firstName: document.getElementById('wpFirstName').value.trim(),
        lastName: document.getElementById('wpLastName').value.trim(),
        idNumber: document.getElementById('wpIdNumber').value.trim(),
        personalNum: document.getElementById('wpPersonalNum').value.trim(),
        birthYear: document.getElementById('wpBirthYear').value.trim(),
        fatherName: document.getElementById('wpFatherName').value.trim(),
        phone: document.getElementById('wpPhone').value.trim(),
        phone2: document.getElementById('wpPhone2').value.trim(),
        address: document.getElementById('wpAddress').value.trim(),
        city: document.getElementById('wpCity').value.trim(),
        rank: document.getElementById('wpRank').value.trim(),
        role: document.getElementById('wpRole').value.trim(),
        healthAnswers,
        healthSig: isWpCanvasEmpty('healthSigCanvas') ? null : getWpCanvasDataURL('healthSigCanvas'),
        waiverSig: isWpCanvasEmpty('waiverSigCanvas') ? null : getWpCanvasDataURL('waiverSigCanvas'),
        requestSig: isWpCanvasEmpty('requestSigCanvas') ? null : getWpCanvasDataURL('requestSigCanvas'),
        cmdSig: isWpCanvasEmpty('cmdSigCanvas') ? null : getWpCanvasDataURL('cmdSigCanvas'),
        cmdName: document.getElementById('wpCmdName').value.trim(),
        cmdRank: document.getElementById('wpCmdRank').value.trim(),
        cmdId: document.getElementById('wpCmdId').value.trim(),
        cmdRole: document.getElementById('wpCmdRole').value.trim(),
        weaponType: document.getElementById('wpWeaponType').value,
        weaponSerial: document.getElementById('wpWeaponSerial').value.trim(),
        idPhoto: document.getElementById('idPhotoImg').src || null,
        date: new Date().toISOString().split('T')[0]
    };
}

function saveWeaponsForm() {
    const data = collectWeaponsFormData();
    if (!data.firstName) { showToast('יש למלא שם פרטי', 'error'); return; }

    const idx = state.weaponsData.findIndex(r => r.soldierId === data.soldierId);
    if (idx >= 0) state.weaponsData[idx] = data;
    else state.weaponsData.push(data);

    saveState();
    showToast('טופס נשמר בהצלחה');
    renderWeaponsTab();
}

// --- PDF Generation with exact coordinate mapping ---

// Helper: reverse Hebrew string for pdf-lib text drawing
function reverseHebrew(str) {
    if (!str) return '';
    // Split into segments of Hebrew and non-Hebrew
    const parts = str.match(/[\u0590-\u05FF\uFB1D-\uFB4F]+|[^\u0590-\u05FF\uFB1D-\uFB4F]+/g) || [str];
    return parts.map(part => {
        if (/[\u0590-\u05FF]/.test(part)) return part.split('').reverse().join('');
        return part;
    }).reverse().join('');
}

async function generateWeaponsPDF(soldierId) {
    if (!soldierId) soldierId = document.getElementById('weaponsSoldierId').value;
    let rec = state.weaponsData.find(r => r.soldierId === soldierId);
    if (document.getElementById('weaponsFormModal').classList.contains('active')) {
        rec = collectWeaponsFormData();
    }
    if (!rec || !rec.firstName) { showToast('יש למלא את הטופס לפני הפקת תמונות', 'error'); return; }

    showToast('מפיק תמונות... אנא המתן', 'success');

    try {
        const pdfjsLib = window['pdfjs-dist/build/pdf'];
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        const pdf = await pdfjsLib.getDocument('weapons-form.pdf').promise;
        const scale = 2;
        const dateStr = formatDate(rec.date);
        const blue = '#0d1a80';
        const font = 'bold 22px Rubik, Arial, sans-serif';
        const fontSm = 'bold 20px Rubik, Arial, sans-serif';

        // Helper: draw text at PDF-coordinate percentages (origin bottom-left) onto canvas (origin top-left)
        function dt(ctx, w, h, text, xPct, yPdfPct, sz, color) {
            if (!text) return;
            ctx.fillStyle = color || blue;
            ctx.font = sz || font;
            ctx.textAlign = 'start';
            ctx.direction = 'rtl';
            ctx.fillText(text, w * xPct, h * (1 - yPdfPct));
        }

        // Helper: draw signature/image from dataURL
        async function drawSig(ctx, w, h, dataUrl, xPct, yPdfPct, imgW, imgH) {
            if (!dataUrl) return;
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => { ctx.drawImage(img, w * xPct, h * (1 - yPdfPct) - imgH, imgW, imgH); resolve(); };
                img.onerror = resolve;
                img.src = dataUrl;
            });
        }

        const pageNames = ['בקשת_נשק', 'המלצת_מפקד', 'ויתור_סודיות', 'הצהרת_בריאות', 'צילום_תז'];

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            await page.render({ canvasContext: ctx, viewport }).promise;

            const w = canvas.width, h = canvas.height;
            const row2Off = 30 * scale / (841.92); // ~row offset as fraction of height

            // PAGE 1: Weapon Request
            if (i === 1) {
                const ty = 0.715, r2 = ty - 0.035;
                // Row 1: שם פרטי, שם משפחה, ת.ז, מ.א, שנת לידה, שם האב
                dt(ctx, w, h, rec.firstName, 0.78, ty);
                dt(ctx, w, h, rec.lastName, 0.62, ty);
                dt(ctx, w, h, rec.idNumber, 0.44, ty);
                dt(ctx, w, h, rec.personalNum, 0.31, ty);
                dt(ctx, w, h, rec.birthYear, 0.2, ty);
                dt(ctx, w, h, rec.fatherName, 0.08, ty);
                // Row 2: טלפון, טלפון נוסף, כתובת, יישוב, דרגה, תפקיד
                dt(ctx, w, h, rec.phone, 0.78, r2);
                dt(ctx, w, h, rec.phone2, 0.62, r2);
                dt(ctx, w, h, rec.address, 0.44, r2);
                dt(ctx, w, h, rec.city, 0.31, r2);
                dt(ctx, w, h, rec.rank, 0.2, r2);
                dt(ctx, w, h, rec.role, 0.08, r2);
                // Weapon info
                dt(ctx, w, h, rec.weaponType, 0.32, 0.265);
                dt(ctx, w, h, rec.weaponSerial, 0.08, 0.265);
                // Bottom: name, date, signature
                dt(ctx, w, h, rec.firstName + ' ' + rec.lastName, 0.65, 0.09);
                dt(ctx, w, h, dateStr, 0.38, 0.09);
                await drawSig(ctx, w, h, rec.requestSig, 0.04, 0.07, 200, 80);
            }

            // PAGE 2: Commander Recommendation
            if (i === 2) {
                const ty = 0.75, r2 = ty - 0.035;
                dt(ctx, w, h, rec.firstName, 0.78, ty);
                dt(ctx, w, h, rec.lastName, 0.62, ty);
                dt(ctx, w, h, rec.idNumber, 0.44, ty);
                dt(ctx, w, h, rec.personalNum, 0.31, ty);
                dt(ctx, w, h, rec.birthYear, 0.2, ty);
                dt(ctx, w, h, rec.fatherName, 0.08, ty);
                dt(ctx, w, h, rec.phone, 0.78, r2);
                dt(ctx, w, h, rec.phone2, 0.62, r2);
                dt(ctx, w, h, rec.address, 0.44, r2);
                dt(ctx, w, h, rec.city, 0.31, r2);
                dt(ctx, w, h, rec.rank, 0.2, r2);
                dt(ctx, w, h, rec.role, 0.08, r2);
                const cmdY = 0.34;
                dt(ctx, w, h, rec.cmdName ? rec.cmdName.split(' ')[0] : '', 0.78, cmdY);
                dt(ctx, w, h, rec.cmdName ? rec.cmdName.split(' ').slice(1).join(' ') : '', 0.62, cmdY);
                dt(ctx, w, h, rec.cmdRank, 0.44, cmdY);
                dt(ctx, w, h, rec.cmdId, 0.31, cmdY);
                dt(ctx, w, h, rec.cmdRole, 0.12, cmdY);
                dt(ctx, w, h, dateStr, 0.38, 0.17);
                await drawSig(ctx, w, h, rec.cmdSig, 0.04, 0.14, 200, 80);
            }

            // PAGE 3: Medical Waiver
            if (i === 3) {
                const ty = 0.80, r2 = ty - 0.035;
                dt(ctx, w, h, rec.firstName, 0.78, ty);
                dt(ctx, w, h, rec.lastName, 0.62, ty);
                dt(ctx, w, h, rec.idNumber, 0.44, ty);
                dt(ctx, w, h, rec.personalNum, 0.31, ty);
                dt(ctx, w, h, rec.birthYear, 0.2, ty);
                dt(ctx, w, h, rec.fatherName, 0.08, ty);
                dt(ctx, w, h, rec.phone, 0.78, r2);
                dt(ctx, w, h, rec.phone2, 0.62, r2);
                dt(ctx, w, h, rec.address, 0.44, r2);
                dt(ctx, w, h, rec.city, 0.31, r2);
                dt(ctx, w, h, rec.rank, 0.2, r2);
                dt(ctx, w, h, rec.role, 0.08, r2);
                dt(ctx, w, h, rec.firstName + ' ' + rec.lastName, 0.65, 0.1);
                dt(ctx, w, h, dateStr, 0.38, 0.1);
                await drawSig(ctx, w, h, rec.waiverSig, 0.04, 0.08, 200, 80);
            }

            // PAGE 4: Health Declaration
            if (i === 4) {
                const startY = 0.82, rowH = 0.033;
                HEALTH_QUESTIONS.forEach((q, idx) => {
                    const answer = rec.healthAnswers[q.id];
                    if (!answer) return;
                    const y = startY - (idx * rowH);
                    const isLeft = idx < 10;
                    const xYes = isLeft ? 0.95 : 0.52;
                    const xNo = isLeft ? 0.9 : 0.47;
                    dt(ctx, w, h, 'X', answer === 'yes' ? xYes : xNo, y, 'bold 24px Arial');
                });
                dt(ctx, w, h, dateStr, 0.38, 0.15, fontSm);
                await drawSig(ctx, w, h, rec.healthSig, 0.04, 0.12, 200, 80);
            }

            // PAGE 5: ID Photo
            if (i === 5 && rec.idPhoto && rec.idPhoto.startsWith('data:image')) {
                const imgW = w * 0.7, imgH = imgW * 0.63;
                await drawSig(ctx, w, h, rec.idPhoto, 0.15, 0.65, imgW, imgH);
            }

            // Download as PNG
            canvas.toBlob(blob => {
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = `${pageNames[i-1]}_${rec.firstName}_${rec.lastName}.png`;
                link.click();
                URL.revokeObjectURL(link.href);
            }, 'image/png');

            // Small delay between downloads
            await new Promise(r => setTimeout(r, 500));
        }

        showToast('5 תמונות הורדו בהצלחה!');
    } catch (err) {
        console.error('Image generation error:', err);
        showToast('שגיאה בהפקת תמונות: ' + err.message, 'error');
    }
}

// Close modals
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) { o.classList.remove('active'); document.body.classList.remove('modal-open'); } });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); document.body.classList.remove('modal-open'); }
});

init();
