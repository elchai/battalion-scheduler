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
    sheetId: '1JedoEvaQyHtNVYF7lwJwNSV0lu8e97k2kwCJuSRaGTE',
    equipmentSets: {
        baseSet: {
            name: 'סט ציוד ללוחם',
            items: [
                { name: 'אפוד קרב', quantity: 1, category: 'מגן', requiresSerial: false },
                { name: 'מחסנית m16', quantity: 5, category: 'תחמושת', requiresSerial: false },
                { name: 'מדי ב\'', quantity: 2, category: 'אחר', requiresSerial: false },
                { name: 'קסדה', quantity: 1, category: 'מגן', requiresSerial: false },
                { name: 'כיסוי קסדה', quantity: 1, category: 'מגן', requiresSerial: false },
                { name: 'מצנפת קסדה', quantity: 1, category: 'מגן', requiresSerial: false },
                { name: 'בירכיות', quantity: 2, category: 'מגן', requiresSerial: false },
                { name: 'תחבושת אישית', quantity: 1, category: 'רפואי', requiresSerial: false },
                { name: 'חוסם עורקים CAT', quantity: 1, category: 'רפואי', requiresSerial: false }
            ]
        },
        roleSets: [],
        defaultSigningUnit: 'פלוגת פלס"ם',
        savedSignatures: {} // לחתימות קבועות של מחתימים
    }
};

let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

function loadSettings() {
    const saved = localStorage.getItem('battalionSettings');
    if (saved) {
        const parsed = JSON.parse(saved);
        const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        settings = { ...defaults, ...parsed };
        if (parsed.shiftPresets) settings.shiftPresets = { ...defaults.shiftPresets, ...parsed.shiftPresets };
        if (defaults.equipmentSets) {
            settings.equipmentSets = settings.equipmentSets || {};
            settings.equipmentSets.baseSet = settings.equipmentSets.baseSet || defaults.equipmentSets.baseSet;
            if (!settings.equipmentSets.baseSet.items) settings.equipmentSets.baseSet.items = defaults.equipmentSets.baseSet.items;
            settings.equipmentSets.roleSets = settings.equipmentSets.roleSets || defaults.equipmentSets.roleSets;
            settings.equipmentSets.savedSignatures = settings.equipmentSets.savedSignatures || defaults.equipmentSets.savedSignatures || {};
        }
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
    document.getElementById('loginPassword').value = '';
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
    document.querySelectorAll('.sidebar-item.tab-all').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-a').forEach(el => el.style.display = (isGdudi || unit === 'a') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-b').forEach(el => el.style.display = (isGdudi || unit === 'b') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-c').forEach(el => el.style.display = (isGdudi || unit === 'c') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-d').forEach(el => el.style.display = (isGdudi || unit === 'd') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-hq').forEach(el => el.style.display = (isGdudi || unit === 'hq') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-palsam').forEach(el => el.style.display = (isGdudi || unit === 'palsam') ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-calendar').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-reports').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-rotation').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-weapons').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = isAdmin() ? '' : 'none');
    const isCompanyCommander = ['a','b','c','d'].includes(unit);
    document.querySelectorAll('.sidebar-item.tab-commander').forEach(el => el.style.display = (isGdudi || isCompanyCommander) ? '' : 'none');
    const addRotBtn = document.getElementById('addRotGroupBtn');
    if (addRotBtn) addRotBtn.style.display = (isGdudi || isAdmin()) ? '' : 'none';

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
        try {
            currentUser = JSON.parse(saved);
            activateApp();
            return true;
        } catch {
            sessionStorage.removeItem('battalionUser');
        }
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
        name: 'פלוגה א', location: 'עתודה', color: 'var(--pluga-a)', colorClass: 'company-a',
        forecast: 51,
        tasks: [
            { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
            { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
            { name: 'צוותי יזומות', soldiers: 22, commanders: 2, officers: 0, shifts: 1, perShift: { soldiers: 22, commanders: 2, officers: 0 } },
            { name: 'של"ז', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
            { name: 'תגבור', soldiers: 12, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 12, commanders: 0, officers: 0 } },
            { name: 'ליווי גשש', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
        ],
        totals: { soldiers: 41, commanders: 2, officers: 2 }
    },
    b: {
        name: 'פלוגה ב', location: 'מבוא חורון', color: 'var(--pluga-b)', colorClass: 'company-b',
        forecast: 66,
        tasks: [
            { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
            { name: 'סיור קל', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'בונקר', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
            { name: 'ש.ג', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'פטרול לילה', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
            { name: 'חמל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 4, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
        ],
        totals: { soldiers: 36, commanders: 5, officers: 2 }
    },
    c: {
        name: 'פלוגה ג', location: 'חשמונאים', color: 'var(--pluga-c)', colorClass: 'company-c',
        forecast: 65,
        tasks: [
            { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
            { name: 'סיור קל דרום', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'סיור קל צפון', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'חמל פלוגתי', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'הגנת מחנה', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'כ"כ', soldiers: 5, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 1, officers: 0 } },
            { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
            { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
        ],
        totals: { soldiers: 41, commanders: 8, officers: 2 }
    },
    d: {
        name: 'פלוגה ד', location: '443', color: 'var(--pluga-d)', colorClass: 'company-d',
        forecast: 71,
        tasks: [
            { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
            { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
            { name: 'מחסום בל', soldiers: 12, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
            { name: 'חמל פלוגתי', soldiers: 3, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
            { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
            { name: 'מעבר מכבים (בוקר 06-09)', soldiers: 11, commanders: 3, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 3, officers: 0 } },
            { name: 'מעבר מכבים (יום 09-15)', soldiers: 9, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 9, commanders: 0, officers: 0 } },
            { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
            { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
        ],
        totals: { soldiers: 56, commanders: 10, officers: 2 }
    },
    hq: {
        name: 'חפ"ק מג"ד/סמג"ד', location: 'מפקדה', color: 'var(--pluga-hq)', colorClass: 'company-hq',
        tasks: [],
        totals: { soldiers: 0, commanders: 0, officers: 0 }
    },
    palsam: {
        name: 'פלס"ם', location: 'פלוגת סיוע מנהלתי', color: 'var(--pluga-palsam)', colorClass: 'company-palsam',
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
let state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [], personalEquipment: [] };

// Calendar state
let calendarWeekOffset = 0;

// Search & filter state per company
let searchState = {};
let equipmentFilter = 'all';
let weaponsFilter = 'all';
let pakalFilter = 'all';
let equipmentSubTab = 'items';

function getSearchState(compKey) {
    if (!searchState[compKey]) searchState[compKey] = { query: '', filter: 'all' };
    return searchState[compKey];
}

function loadState() {
    const saved = localStorage.getItem('battalionState_v2');
    if (saved) {
        try { state = JSON.parse(saved); } catch { localStorage.removeItem('battalionState_v2'); }
    }
    if (!state.rotationGroups) state.rotationGroups = [];
    if (!state.equipment) state.equipment = [];
    if (!state.signatureLog) state.signatureLog = [];
    if (!state.weaponsData) state.weaponsData = [];
    if (!state.personalEquipment) state.personalEquipment = [];
    if (!state.rollCalls) state.rollCalls = [];
    if (!state.announcements) state.announcements = [];

    // Migration v1 already completed — just ensure flag is set for new devices
    if (!localStorage.getItem('migration_clear_v1')) {
        localStorage.setItem('migration_clear_v1', '1');
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
    try {
        localStorage.setItem('battalionState_v2', JSON.stringify(state));
    } catch (e) {
        console.error('localStorage quota exceeded:', e);
        showToast('אזהרה: הזיכרון המקומי מלא - ייתכן אובדן נתונים', 'error');
    }
    if (typeof firebaseSaveState === 'function') firebaseSaveState();
}

function cleanupOldData() {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 30);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const oldShifts = state.shifts.filter(sh => sh.date < cutoffStr).length;
    const oldLeaves = state.leaves.filter(l => l.endDate < cutoffStr).length;
    const oldRollCalls = state.rollCalls ? state.rollCalls.filter(rc => rc.date < cutoffStr).length : 0;
    if (oldShifts > 0 || oldLeaves > 0 || oldRollCalls > 0) {
        state.shifts = state.shifts.filter(sh => sh.date >= cutoffStr);
        state.leaves = state.leaves.filter(l => l.endDate >= cutoffStr);
        if (state.rollCalls) state.rollCalls = state.rollCalls.filter(rc => rc.date >= cutoffStr);
        saveState();
        console.log(`Cleanup: removed ${oldShifts} old shifts, ${oldLeaves} old leaves, ${oldRollCalls} old roll calls (>30 days)`);
    }
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
    // Auto-cleanup: remove shifts/leaves older than 30 days
    cleanupOldData();
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
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showToast('גרסה חדשה זמינה - רענן את הדף', 'info');
            }
        });
    }
}

let activeTab = 'all';
function renderAll() {
    updateGlobalStats();
    updateNotifications();
    // Only render the active tab + overview/dashboard which are always needed
    renderOverview();
    renderDashboard();
    if (['a','b','c','d','hq','palsam'].includes(activeTab)) {
        renderCompanyTab(activeTab);
    } else if (activeTab === 'rotation') {
        renderRotationTab();
    } else if (activeTab === 'equipment') {
        renderEquipmentTab();
    } else if (activeTab === 'weapons') {
        renderWeaponsTab();
    } else if (activeTab === 'commander') {
        renderCommanderDashboard();
    } else if (activeTab === 'morningreport') {
        generateMorningReport();
    } else if (activeTab === 'rollcall') {
        renderRollCall();
    } else if (activeTab === 'announcements') {
        renderAnnouncements();
    }
}

// ==================== GOOGLE SHEETS SYNC ====================
let syncInProgress = false;
function syncFromGoogleSheets(silent) {
    if (syncInProgress) { if (!silent) showToast('סנכרון כבר פעיל, אנא המתן...', 'info'); return; }
    syncInProgress = true;

    // Show spinner on sync button
    const syncBtns = document.querySelectorAll('[onclick*="syncFromGoogleSheets"]');
    syncBtns.forEach(btn => { btn._origHTML = btn.innerHTML; btn.innerHTML = '<span class="sync-spinner"></span> מסנכרן...'; btn.disabled = true; });

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
    }).finally(() => {
        syncInProgress = false;
        syncBtns.forEach(btn => { btn.innerHTML = btn._origHTML || btn.innerHTML; btn.disabled = true; });
        // Cooldown: disable for 15 seconds
        setTimeout(() => syncBtns.forEach(btn => { btn.disabled = false; }), 15000);
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
        if (canView(key)) {
            card.onclick = () => switchTab(key);
        } else {
            card.style.cursor = 'default';
            card.style.opacity = '0.55';
        }
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
                ${comp.forecast ? `<div style="display:flex;justify-content:space-between;font-size:0.82em;margin-bottom:4px;">
                    <span>צפי כוח</span><span><strong>${comp.forecast}</strong></span>
                </div>` : ''}
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
    const maxVal = Math.max(...mainCompanies.map(k => Math.max(compStats[k].regCount, companyData[k].forecast || 0)), 1);
    const barsHtml = mainCompanies.map(k => {
        const cs = compStats[k];
        const forecast = companyData[k].forecast || 0;
        const pct = (cs.regCount / maxVal) * 100;
        const forecastPct = forecast > 0 ? (forecast / maxVal) * 100 : 0;
        return `<div class="bar-row">
            <div class="bar-label">${cs.name}</div>
            <div class="bar-track" style="position:relative;">
                <div class="bar-fill" style="width:${pct}%;background:${cs.color};">${cs.regCount}</div>
                ${forecast > 0 ? `<div style="position:absolute;right:${100-forecastPct}%;top:0;bottom:0;border-left:2px dashed rgba(0,0,0,0.3);" title="צפי: ${forecast}"></div>` : ''}
            </div>
            ${forecast > 0 ? `<div style="font-size:0.7em;color:var(--text-light);min-width:30px;text-align:center;">${forecast}</div>` : ''}
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
                        <div class="notif-title">${esc(n.title)}</div>
                        <div class="notif-desc">${esc(n.desc)}</div>
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
            rotInfo = `<div class="meta">רוטציה: ${rotGroup.name} | ${rotStatus.inBase ? 'יום ' + rotStatus.dayInCycle + '/' + rotGroup.daysIn + ' בבסיס' : 'יום ' + (rotStatus.dayInCycle - rotGroup.daysIn) + '/' + rotGroup.daysOut + ' בבית'}</div>`;
        }
        return `<div class="person-card ${cls}" data-soldier-id="${s.id}">
            <div class="person-info">
                <h4><a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a></h4>
                <div class="meta">${esc(s.role)}${s.unit ? ' | '+esc(s.unit) : ''}${s.personalId ? ' | '+esc(s.personalId) : ''}</div>
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
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> יציאה הביתה</button>` : ''}
            <button class="btn" style="background:var(--bg)" onclick="exportCompanyData('${compKey}')">&#128196; ייצוא CSV</button>
        </div>

        <!-- Force Table -->
        <div class="sub-section">
            <div class="section-title">
                <div class="icon" style="background:#e8f5e9;color:var(--success);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg></div>
                טבלת כוחות ומשימות - ${comp.name} (${comp.location})${comp.forecast ? ` | צפי: ${comp.forecast}` : ''}
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
                                <td class="task-name">${esc(t.name)}</td>
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
                            return sol ? `<a href="#" onclick="event.preventDefault();openSoldierProfile('${sid}')" class="soldier-link">${esc(sol.name)}</a>` : '?';
                        });
                        const taskData = comp.tasks.find(t => t.name === sh.task);
                        const needed = taskData ? taskData.perShift.soldiers + taskData.perShift.commanders + taskData.perShift.officers : 0;
                        const cmdSol = sh.taskCommander && state.soldiers.find(s => s.id === sh.taskCommander);
                        const needsCommander = taskData && taskData.perShift.soldiers >= 4;
                        return `<div class="shift-card">
                            <div class="shift-card-header">
                                <h4>${esc(sh.task)}${sh.shiftName ? ' - '+esc(sh.shiftName) : ''}</h4>
                                <span class="shift-time">${sh.startTime} - ${sh.endTime}</span>
                            </div>
                            <div class="shift-card-body">
                                <div style="font-size:0.83em;color:var(--text-light);margin-bottom:6px;">
                                    &#128197; ${formatDate(sh.date)} | ${names.length}/${needed} משובצים
                                </div>
                                ${needsCommander ? `<div class="task-commander-badge">${cmdSol ? '<strong>מפקד המשימה:</strong> <a href="#" onclick="event.preventDefault();openSoldierProfile(\'' + sh.taskCommander + '\')" class="soldier-link">' + esc(cmdSol.name) + '</a>' : '<span style="color:var(--danger)">לא נבחר מפקד משימה</span>'}</div>` : ''}
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
                                    <td><strong>${sol ? `<a href="#" onclick="event.preventDefault();openSoldierProfile('${l.soldierId}')" class="soldier-link">${esc(sol.name)}</a>` : '?'}</strong></td>
                                    <td>${sol ? sol.rank : ''}</td>
                                    <td>${formatDate(l.startDate)}</td><td>${l.startTime}</td>
                                    <td>${formatDate(l.endDate)}</td><td>${l.endTime}</td>
                                    <td><span class="person-status ${active?'status-on-leave':'status-on-duty'}">${active?'בבית':'חזר'}</span></td>
                                    <td style="font-size:0.83em">${esc(l.notes)||'-'}</td>
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
                <input type="text" id="search-${compKey}" placeholder="חיפוש לפי שם, תפקיד, מספר אישי..." value="${esc(ss.query)}" oninput="onSearchInput('${compKey}')">
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

function getVisibleRotGroups() {
    if (!currentUser || currentUser.unit === 'gdudi' || isAdmin()) return state.rotationGroups;
    return state.rotationGroups.filter(g =>
        g.soldiers.some(sid => {
            const sol = state.soldiers.find(s => s.id === sid);
            return sol && sol.company === currentUser.unit;
        })
    );
}

function renderRotationCalendar() {
    const container = document.getElementById('rotationCalendar');
    const visibleGroups = getVisibleRotGroups();
    if (visibleGroups.length === 0) {
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
        html += `<div class="rotation-day ${isToday ? 'today' : ''}" style="background:var(--bg-secondary,#f5f5f5);">
            <div class="day-name">${dayNames[d.getDay()]}'</div>
            <div class="day-num">${d.getDate()}</div>
            <div style="font-size:0.7em;opacity:0.5;">${d.getMonth()+1}</div>
        </div>`;
    });
    html += '</div></div>';

    // One row per rotation group
    visibleGroups.forEach(group => {
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
    const visibleGroups = getVisibleRotGroups();
    const canManage = !currentUser || currentUser.unit === 'gdudi' || isAdmin();
    if (visibleGroups.length === 0) {
        container.innerHTML = `<div class="empty-state">
            <div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg></div>
            <p>טרם נוצרו קבוצות רוטציה</p>
            ${canManage ? '<button class="btn btn-primary" style="margin-top:10px;" onclick="openModal(\'addRotationGroupModal\')">+ צור קבוצה ראשונה</button>' : '<p style="font-size:0.83em;color:var(--text-light);">הקבוצות ייצרו ע"י הגדודי</p>'}
        </div>`;
        return;
    }

    const now = new Date();
    container.innerHTML = visibleGroups.map(group => {
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
                    <h4>${esc(group.name)}</h4>
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
                <ul>${soldierNames.map(n => `<li>${esc(n)}</li>`).join('')}</ul>
                ${canManage ? `<div style="margin-top:8px;text-align:left;">
                    <button class="btn btn-danger btn-sm" onclick="deleteRotGroup('${group.id}')">&#10005; מחק קבוצה</button>
                </div>` : ''}
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

function exportCalendarToPDF() {
    const titleEl = document.getElementById('calTitle');
    const filterCompany = document.getElementById('calCompanyFilter').value;
    const grid = document.getElementById('calGrid');

    if (!titleEl || !grid) {
        showToast('שגיאה בייצוא הלוח השבועי', 'error');
        return;
    }

    const companyName = filterCompany === 'all' ? 'כל הפלוגות' :
                      companyData[filterCompany] ? companyData[filterCompany].name : filterCompany;

    const dateStr = new Date().toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    // Create HTML for PDF
    const htmlContent = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;background:#fff;padding:20px;width:100%;">
        <div style="text-align:center;margin-bottom:30px;border-bottom:2px solid #1a237e;padding-bottom:20px;">
            <h1 style="color:#1a237e;margin:0;font-size:28px;font-weight:bold;">גדוד יהודה - לוח שיבוצים שבועי</h1>
            <h2 style="color:#555;margin:10px 0 0 0;font-size:20px;">${titleEl.textContent}</h2>
            <p style="color:#777;margin:5px 0;font-size:16px;">${companyName} | נוצר: ${dateStr}</p>
        </div>

        <div class="cal-pdf-grid" style="display:grid;grid-template-columns:repeat(7,1fr);gap:1px;background:#ddd;border:1px solid #ddd;">
            ${grid.innerHTML}
        </div>

        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #ddd;font-size:12px;color:#777;text-align:center;">
            מערכת ניהול גדודי | תעסוקה מבצעית | ${new Date().toLocaleString('he-IL')}
        </div>
    </div>

    <style>
        .cal-day-header {
            background: #1a237e;
            color: white;
            font-weight: bold;
            padding: 12px 8px;
            text-align: center;
            font-size: 14px;
        }

        .cal-day {
            background: white;
            min-height: 120px;
            padding: 8px;
            position: relative;
        }

        .cal-day.today {
            background: #e3f2fd;
        }

        .cal-date {
            font-weight: bold;
            font-size: 14px;
            color: #1a237e;
            margin-bottom: 6px;
            text-align: right;
        }

        .cal-events {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .cal-event {
            font-size: 11px;
            padding: 3px 6px;
            border-radius: 3px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1px;
        }

        .cal-event-shift {
            background: #e8f5e9;
            border-right: 3px solid #4caf50;
        }

        .cal-event-leave {
            background: #fff3e0;
            border-right: 3px solid #ff9800;
        }

        .cal-event-rotation {
            background: #f3e5f5;
            border-right: 3px solid #9c27b0;
        }

        .cal-event-time {
            font-weight: bold;
            font-size: 10px;
        }

        .cal-event-label {
            flex: 1;
            margin: 0 4px;
            text-align: right;
        }

        .cal-event-count {
            background: rgba(0,0,0,0.1);
            color: #333;
            padding: 1px 4px;
            border-radius: 2px;
            font-size: 10px;
            font-weight: bold;
        }

        .cal-empty {
            color: #bbb;
            font-size: 12px;
            text-align: center;
            padding: 20px;
        }
    </style>`;

    const filename = `לוח_שבועי_${companyName.replace(/[^\w\u0590-\u05FF]/g, '_')}_${titleEl.textContent.replace(/[^\w\u0590-\u05FF]/g, '_')}`;
    downloadPDF(htmlContent, filename);
}

// ==================== COMMANDER DASHBOARD ====================
function renderCommanderDashboard() {
    const container = document.getElementById('content-commander');
    if (!container) return;

    // Determine which company to show
    let compKey = commanderViewCompany || (currentUser && currentUser.unit) || 'a';
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
    const compSelector = (currentUser && currentUser.unit) === 'gdudi' ? `
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
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> יציאה</button>
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
            <h4>${esc(s.name)}</h4>
            <div class="meta">${esc(s.role) || ''}${s.rank ? ' | '+esc(s.rank) : ''}${s.phone ? ' | '+esc(s.phone) : ''}</div>
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
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
            </div>
            מרכז התראות WhatsApp
        </div>
        <div class="info-box">
            <span class="info-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></span>
            <div>לחיצה על "שלח" תפתח את WhatsApp עם הודעה מוכנה. ניתן לערוך לפני שליחה.</div>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;margin:14px 0 10px;">
            <div class="filter-buttons" style="margin:0;">
                <button class="filter-btn ${whatsappFilterType==='all'?'active':''}" onclick="filterWhatsApp('all')">הכל (${counts.all})</button>
                <button class="filter-btn ${whatsappFilterType==='shift'?'active':''}" onclick="filterWhatsApp('shift')">משמרות (${counts.shift})</button>
                <button class="filter-btn ${whatsappFilterType==='leave'?'active':''}" onclick="filterWhatsApp('leave')">יציאות (${counts.leave})</button>
                <button class="filter-btn ${whatsappFilterType==='rotation'?'active':''}" onclick="filterWhatsApp('rotation')">רוטציה (${counts.rotation})</button>
            </div>
            <button class="btn btn-primary btn-sm" onclick="toggleWhatsAppCompose()" id="waComposeBtn" style="background:#25D366;border-color:#25D366;display:flex;align-items:center;gap:6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                כתיבת הודעה
            </button>
        </div>
        <div id="waComposeBox" style="display:none;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px 16px;margin-bottom:14px;">
            <div style="font-weight:600;margin-bottom:10px;font-size:0.9em;">הודעה חדשה</div>
            <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px;">
                <select id="waComposeSoldier" style="flex:1;min-width:180px;padding:7px 10px;border-radius:7px;border:1px solid var(--border);font-family:inherit;font-size:0.85em;" onchange="waFillPhone()" dir="rtl">
                    <option value="">בחר חייל...</option>
                    ${state.soldiers.filter(s => canView(s.company) && s.phone).map(s =>
                        `<option value="${s.phone}">${s.name} | ${s.phone}</option>`
                    ).join('')}
                </select>
                <input type="tel" id="waComposePhone" placeholder="מספר טלפון" dir="ltr"
                    style="width:160px;padding:7px 10px;border-radius:7px;border:1px solid var(--border);font-family:inherit;font-size:0.85em;">
            </div>
            <textarea id="waComposeMsg" rows="3" dir="rtl" placeholder="כתוב את ההודעה..."
                style="width:100%;padding:8px 10px;border-radius:7px;border:1px solid var(--border);font-family:inherit;font-size:0.85em;resize:vertical;box-sizing:border-box;"></textarea>
            <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:10px;">
                <button class="btn btn-sm" onclick="toggleWhatsAppCompose()" style="background:var(--bg);">ביטול</button>
                <button class="btn btn-sm" onclick="sendWhatsAppCompose()" style="background:#25D366;color:white;border-color:#25D366;display:flex;align-items:center;gap:6px;">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z"/></svg>
                    שלח ב-WhatsApp
                </button>
            </div>
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

function toggleWhatsAppCompose() {
    const box = document.getElementById('waComposeBox');
    if (!box) return;
    const visible = box.style.display !== 'none';
    box.style.display = visible ? 'none' : 'block';
    if (!visible) document.getElementById('waComposeMsg').focus();
}

function waFillPhone() {
    const sel = document.getElementById('waComposeSoldier');
    const phoneInput = document.getElementById('waComposePhone');
    if (sel && phoneInput && sel.value) phoneInput.value = sel.value;
}

function sendWhatsAppCompose() {
    const phone = document.getElementById('waComposePhone').value.trim().replace(/[^0-9]/g, '');
    const msg = document.getElementById('waComposeMsg').value.trim();
    if (!phone) { showToast('יש להזין מספר טלפון', 'error'); return; }
    if (!msg) { showToast('יש לכתוב הודעה', 'error'); return; }
    const intl = phone.startsWith('0') ? '972' + phone.substring(1) : phone;
    window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, '_blank');
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
                <h4 style="margin:0;font-size:0.92em;">${esc(n.title)}</h4>
                <span style="font-size:0.7em;background:var(--bg);padding:2px 8px;border-radius:10px;color:var(--text-light);">${esc(typeLabels[n.type]||n.type)}</span>
            </div>
            <div style="font-size:0.82em;color:var(--text-light);">${esc(n.desc)}</div>
            <div style="font-size:0.78em;color:var(--text-light);margin-top:2px;">${esc(n.phone)}</div>
        </div>
        <a href="${waLink}" target="_blank" style="display:inline-flex;align-items:center;gap:6px;padding:8px 16px;background:#25D366;color:white;border-radius:8px;text-decoration:none;font-size:0.85em;font-weight:600;white-space:nowrap;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            שלח
        </a>
    </div>`;
}

// ==================== TAB NAVIGATION ====================
function switchTab(tab) {
    activeTab = tab;
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
    if (tab === 'morningreport') generateMorningReport();
    if (tab === 'rollcall') renderRollCall();
    if (tab === 'announcements') renderAnnouncements();
    if (tab === 'rotation') renderRotationTab();
    if (tab === 'equipment') { renderEquipmentTab(); switchEquipmentSubTab(equipmentSubTab); }
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
    document.getElementById('soldierPakal').value = '';
    document.getElementById('soldierNotes').value = '';
    openModal('addSoldierModal');
    setTimeout(() => document.getElementById('soldierName').focus(), 100);
}

function openSoldierProfile(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (!sol) return;
    const container = document.getElementById('soldierProfileContent');
    if (!container) return;
    document.getElementById('profileTitle').textContent = `כרטיס חייל - ${sol.name}`;

    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};
    const todayStr = new Date().toISOString().split('T')[0];

    // Shifts (recent + upcoming)
    const solShifts = state.shifts.filter(sh => sh.soldiers.includes(id)).sort((a,b) => b.date.localeCompare(a.date));
    const recentShifts = solShifts.filter(sh => sh.date <= todayStr).slice(0, 5);
    const upcomingShifts = solShifts.filter(sh => sh.date > todayStr).slice(0, 5);

    // Leaves
    const solLeaves = state.leaves.filter(l => l.soldierId === id).sort((a,b) => b.startDate.localeCompare(a.startDate));
    const activeLeave = solLeaves.find(l => isCurrentlyOnLeave(l));

    // Equipment held
    const heldEquip = state.equipment.filter(e => e.holderId === id);

    // Weapons data
    const weaponRec = state.weaponsData.find(w => w.soldierId === id);

    // Personal equipment (pakal)
    const pakalData = state.personalEquipment.find(pe => pe.soldierId === id);

    // Total shifts count
    const totalShifts = solShifts.length;
    const totalLeaves = solLeaves.length;

    let html = `<div class="sp-card">`;

    // Basic info
    html += `<div class="sp-section sp-info">
        <div class="sp-info-grid">
            <div class="sp-info-item"><span class="sp-label">שם</span><span class="sp-value">${esc(sol.name)}</span></div>
            <div class="sp-info-item"><span class="sp-label">דרגה</span><span class="sp-value">${esc(sol.rank) || '-'}</span></div>
            <div class="sp-info-item"><span class="sp-label">תפקיד</span><span class="sp-value">${esc(sol.role) || '-'}</span></div>
            <div class="sp-info-item"><span class="sp-label">מסגרת</span><span class="sp-value">${compNames[sol.company] || '-'}</span></div>
            <div class="sp-info-item"><span class="sp-label">מ.א.</span><span class="sp-value">${esc(sol.personalId) || '-'}</span></div>
            <div class="sp-info-item"><span class="sp-label">טלפון</span><span class="sp-value">${sol.phone ? `<a href="tel:${sol.phone}">${esc(sol.phone)}</a>` : '-'}</span></div>
            ${sol.pakal ? `<div class="sp-info-item"><span class="sp-label">פק"ל</span><span class="sp-value">${esc(sol.pakal)}</span></div>` : ''}
            ${sol.notes ? `<div class="sp-info-item" style="grid-column:1/-1;"><span class="sp-label">הערות</span><span class="sp-value">${esc(sol.notes)}</span></div>` : ''}
        </div>
    </div>`;

    // Status badges
    html += `<div class="sp-badges">
        <span class="sp-badge ${activeLeave ? 'danger' : 'success'}">${activeLeave ? 'ביציאה' : 'נוכח'}</span>
        <span class="sp-badge info">${totalShifts} משמרות</span>
        <span class="sp-badge">${totalLeaves} יציאות</span>
        <span class="sp-badge">${heldEquip.length} פריטי ציוד</span>
        ${weaponRec ? '<span class="sp-badge warning">טופס נשק</span>' : ''}
    </div>`;

    // Upcoming shifts
    if (upcomingShifts.length > 0) {
        html += `<div class="sp-section"><h4>משמרות קרובות</h4><div class="sp-list">`;
        upcomingShifts.forEach(sh => {
            html += `<div class="sp-list-item"><span>${formatDate(sh.date)}</span><span>${esc(sh.task)}</span><span>${sh.startTime}-${sh.endTime}</span></div>`;
        });
        html += `</div></div>`;
    }

    // Active leave
    if (activeLeave) {
        html += `<div class="sp-section sp-active-leave"><h4>יציאה פעילה</h4>
            <div class="sp-list-item"><span>${esc(activeLeave.type || 'יציאה')}</span><span>${formatDate(activeLeave.startDate)} - ${formatDate(activeLeave.endDate)}</span></div>
        </div>`;
    }

    // Recent leaves
    if (solLeaves.length > 0) {
        html += `<details class="sp-section"><summary><h4 style="display:inline;">היסטוריית יציאות (${solLeaves.length})</h4></summary><div class="sp-list">`;
        solLeaves.slice(0, 10).forEach(l => {
            const status = isCurrentlyOnLeave(l) ? '<span style="color:var(--danger);">פעיל</span>' : '';
            html += `<div class="sp-list-item"><span>${esc(l.type || 'יציאה')}</span><span>${formatDate(l.startDate)} - ${formatDate(l.endDate)}</span>${status}</div>`;
        });
        html += `</div></details>`;
    }

    // Equipment held
    if (heldEquip.length > 0) {
        html += `<details class="sp-section"><summary><h4 style="display:inline;">ציוד מוחזק (${heldEquip.length})</h4></summary><div class="sp-list">`;
        heldEquip.forEach(eq => {
            html += `<div class="sp-list-item"><span>${esc(eq.type)}</span><span>${esc(eq.serial)}</span></div>`;
        });
        html += `</div></details>`;
    }

    // Recent shifts
    if (recentShifts.length > 0) {
        html += `<details class="sp-section"><summary><h4 style="display:inline;">משמרות אחרונות (${totalShifts})</h4></summary><div class="sp-list">`;
        recentShifts.forEach(sh => {
            html += `<div class="sp-list-item"><span>${formatDate(sh.date)}</span><span>${esc(sh.task)}</span><span>${sh.startTime}-${sh.endTime}</span></div>`;
        });
        html += `</div></details>`;
    }

    html += `<div style="margin-top:16px;display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" onclick="closeModal('soldierProfileModal');openEditSoldier('${id}')">&#9998; ערוך</button>
        ${sol.phone ? `<a class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;" href="https://wa.me/${sol.phone.replace(/[^0-9]/g,'').replace(/^0/,'972')}" target="_blank">&#128172; וואטסאפ</a>` : ''}
    </div>`;

    html += `</div>`;
    container.innerHTML = html;
    openModal('soldierProfileModal');
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
    document.getElementById('soldierPakal').value = sol.pakal || '';
    document.getElementById('soldierNotes').value = sol.notes || '';
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
            sol.pakal = document.getElementById('soldierPakal').value;
            sol.notes = document.getElementById('soldierNotes').value.trim();
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
            phone: document.getElementById('soldierPhone').value.trim(),
            pakal: document.getElementById('soldierPakal').value,
            notes: document.getElementById('soldierNotes').value.trim()
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

async function deleteSoldier(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (sol && !canEdit(sol.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!await customConfirm('למחוק חייל זה?')) return;
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
        <h4 style="margin:0 0 4px;">${esc(sol.name)}</h4>
        <div style="font-size:0.85em;color:var(--text-light);">${esc(sol.rank)} | ${esc(sol.role)} ${sol.personalId ? '| מ.א. ' + esc(sol.personalId) : ''}</div>`;

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

async function confirmTransferSoldier() {
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
    if (!await customConfirm(`להעביר את ${sol.name} מ${compNames[fromCompany]} ל${compNames[toCompany]}?`)) return;

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
    // Check soldiers in checkbox list, then set task commander
    setTimeout(() => {
        setCheckboxListValues('shiftSoldiers', sh.soldiers);
        updateTaskCommanderSelect();
        if (sh.taskCommander) document.getElementById('taskCommanderSelect').value = sh.taskCommander;
    }, 50);
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
    taskSel.onchange = updateTaskCommanderSelect;
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

    // Soldiers: checkbox list from selected company, with status indicators
    const solList = document.getElementById('shiftSoldiers');
    const prevSelected = getCheckboxListValues('shiftSoldiers');
    solList.innerHTML = '';

    const companySoldiers = state.soldiers.filter(s => s.company === company);
    if (companySoldiers.length > 0) {
        const groups = {};
        companySoldiers.forEach(s => {
            const unit = s.unit || 'כללי';
            if (!groups[unit]) groups[unit] = [];
            groups[unit].push(s);
        });
        Object.entries(groups).forEach(([unit, soldiers]) => {
            const header = document.createElement('div');
            header.className = 'checkbox-list-group';
            header.style.cssText = 'padding:4px 12px;font-size:0.75em;font-weight:700;color:var(--text-light);background:var(--bg);';
            header.textContent = unit;
            solList.appendChild(header);
            soldiers.sort((a,b) => {
                const aStatus = getSoldierShiftStatus(a.id, date, startTime, endTime);
                const bStatus = getSoldierShiftStatus(b.id, date, startTime, endTime);
                if (aStatus.available !== bStatus.available) return aStatus.available ? -1 : 1;
                return a.name.localeCompare(b.name, 'he');
            });
            soldiers.forEach(s => {
                const status = getSoldierShiftStatus(s.id, date, startTime, endTime);
                const checked = prevSelected.includes(s.id);
                let label = s.name;
                let badge = '';
                if (status.onLeave) {
                    badge = '<span class="badge-sm" style="background:#fce4ec;color:#c62828;">בבית</span>';
                } else if (status.assignedTo) {
                    badge = `<span class="badge-sm" style="background:#fff3e0;color:#e65100;">${status.assignedTo}</span>`;
                } else {
                    badge = `<span class="badge-sm">${s.role}</span>`;
                }
                const item = document.createElement('div');
                item.className = 'checkbox-list-item' + (checked ? ' checked' : '');
                item.setAttribute('data-name', s.name);
                item.innerHTML = `<input type="checkbox" value="${s.id}" ${checked ? 'checked' : ''} onchange="this.parentElement.classList.toggle('checked',this.checked);updateTaskCommanderSelect()"><label>${label}</label>${badge}`;
                item.onclick = function(e) { if (e.target.tagName !== 'INPUT') { const cb = this.querySelector('input'); cb.checked = !cb.checked; this.classList.toggle('checked', cb.checked); updateTaskCommanderSelect(); } };
                solList.appendChild(item);
            });
        });
    } else {
        solList.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-light);font-size:0.85em;">אין חיילים רשומים</div>';
    }
    updateTaskCommanderSelect();
}

function updateTaskCommanderSelect() {
    const company = document.getElementById('shiftCompany').value;
    const taskName = document.getElementById('shiftTask').value.replace(/\s*\(\d+\/\d+\)$/, '');
    const taskData = companyData[company] && companyData[company].tasks.find(t => t.name === taskName);
    const group = document.getElementById('taskCommanderGroup');
    const select = document.getElementById('taskCommanderSelect');
    if (taskData && taskData.perShift.soldiers >= 4) {
        group.style.display = '';
        const selectedSoldiers = getCheckboxListValues('shiftSoldiers');
        const prev = select.value;
        select.innerHTML = '<option value="">-- בחר מפקד משימה --</option>';
        selectedSoldiers.forEach(sid => {
            const sol = state.soldiers.find(s => s.id === sid);
            if (sol) {
                const opt = document.createElement('option');
                opt.value = sid;
                opt.textContent = sol.name + (sol.role ? ' (' + sol.role + ')' : '');
                select.appendChild(opt);
            }
        });
        if (prev && selectedSoldiers.includes(prev)) select.value = prev;
    } else {
        group.style.display = 'none';
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

async function saveShift() {
    const company = document.getElementById('shiftCompany').value;
    if (!canEdit(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }
    const taskRaw = document.getElementById('shiftTask').value;
    const task = taskRaw.replace(/\s*\(\d+\/\d+\)$/, ''); // strip capacity indicator
    const date = document.getElementById('shiftDate').value;
    const shiftName = document.getElementById('shiftName').value.trim();
    const startTime = document.getElementById('shiftStart').value;
    const endTime = document.getElementById('shiftEnd').value;
    const soldiers = getCheckboxListValues('shiftSoldiers');
    const taskCommander = document.getElementById('taskCommanderSelect').value || '';
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

    // Validate: warn if task commander not selected for 4+ soldiers tasks
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
        if (!await customConfirm(`שים לב! שיבצת ${selectedCmds.length} מפקדים למשמרת:\n${cmdNames}\n\nהאם אתה בטוח?`)) return;
    }

    // Warn if task needs commander but none selected
    if (taskData && taskData.perShift.soldiers >= 4 && !taskCommander) {
        if (!await customConfirm('לא נבחר מפקד משימה.\nהאם להמשיך בלי?')) return;
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
            sh.taskCommander = taskCommander;
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
            company, task, date, shiftName, startTime, endTime, soldiers, taskCommander
        });
        saveState();
        closeModal('addShiftModal');
        renderCompanyTab(company);
        updateGlobalStats();
        showToast(`משמרת ${task} נוצרה עם ${soldiers.length} חיילים`);
    }
}

async function deleteShift(id) {
    const sh = state.shifts.find(s => s.id === id);
    if (sh && !canEdit(sh.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!await customConfirm('למחוק משמרת?')) return;
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
    const list = document.getElementById('leaveSoldier');
    list.innerHTML = '';
    state.soldiers.filter(s => s.company === company).sort((a,b) => a.name.localeCompare(b.name,'he')).forEach(s => {
        const item = document.createElement('div');
        item.className = 'checkbox-list-item';
        item.setAttribute('data-name', s.name);
        item.innerHTML = `<input type="checkbox" value="${s.id}" onchange="this.parentElement.classList.toggle('checked',this.checked)"><label>${esc(s.name)}</label><span class="badge-sm">${esc(s.role || s.rank || '')}</span>`;
        item.onclick = function(e) { if (e.target.tagName !== 'INPUT') { const cb = this.querySelector('input'); cb.checked = !cb.checked; this.classList.toggle('checked', cb.checked); } };
        list.appendChild(item);
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
    if (endDate < startDate) { showToast('תאריך סיום חייב להיות אחרי תאריך התחלה', 'error'); return; }
    if (endDate === startDate && endTime && startTime && endTime <= startTime) { showToast('שעת סיום חייבת להיות אחרי שעת התחלה', 'error'); return; }

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
        const selectedSoldiers = getCheckboxListValues('leaveSoldier');
        if (selectedSoldiers.length === 0) { showToast('יש לבחור חיילים', 'error'); return; }

        selectedSoldiers.forEach((soldierId, idx) => {
            state.leaves.push({
                id: 'leave_' + Date.now() + '_' + idx + '_' + Math.random().toString(36).substr(2,5),
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

async function deleteLeave(id) {
    const l = state.leaves.find(x => x.id === id);
    if (l && !canEdit(l.company)) { showToast('אין הרשאה', 'error'); return; }
    if (!await customConfirm('למחוק יציאה?')) return;
    state.leaves = state.leaves.filter(x => x.id !== id);
    saveState();
    if (l) renderCompanyTab(l.company);
    updateGlobalStats();
    showToast('יציאה נמחקה');
}

// ==================== ROTATION GROUPS ====================
function updateRotGroupSoldiers() {
    const company = document.getElementById('rotGroupCompany').value;
    const list = document.getElementById('rotGroupSoldiers');
    list.innerHTML = '';
    const soldiers = company === 'all' ? state.soldiers : state.soldiers.filter(s => s.company === company);
    soldiers.sort((a,b) => a.name.localeCompare(b.name,'he')).forEach(s => {
        const compName = companyData[s.company] ? companyData[s.company].name : '';
        const label = company === 'all' ? `[${compName}] ${s.name}` : s.name;
        const badge = s.role || s.rank || '';
        const item = document.createElement('div');
        item.className = 'checkbox-list-item';
        item.setAttribute('data-name', s.name);
        item.innerHTML = `<input type="checkbox" value="${s.id}" onchange="this.parentElement.classList.toggle('checked',this.checked)"><label>${esc(label)}</label><span class="badge-sm">${esc(badge)}</span>`;
        item.onclick = function(e) { if (e.target.tagName !== 'INPUT') { const cb = this.querySelector('input'); cb.checked = !cb.checked; this.classList.toggle('checked', cb.checked); } };
        list.appendChild(item);
    });
}

function saveRotationGroup() {
    const name = document.getElementById('rotGroupName').value.trim();
    const startDate = document.getElementById('rotGroupStartDate').value;
    const daysIn = parseInt(document.getElementById('rotGroupDaysIn').value) || 10;
    const daysOut = parseInt(document.getElementById('rotGroupDaysOut').value) || 4;
    const soldiers = getCheckboxListValues('rotGroupSoldiers');
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

async function deleteRotGroup(id) {
    if (!await customConfirm('למחוק קבוצת רוטציה?')) return;
    state.rotationGroups = state.rotationGroups.filter(g => g.id !== id);
    saveState();
    renderRotationTab();
    showToast('קבוצה נמחקה');
}

// ==================== CHECKBOX LIST HELPERS ====================
function getCheckboxListValues(listId) {
    return Array.from(document.querySelectorAll(`#${listId} input[type="checkbox"]:checked`)).map(cb => cb.value);
}

function setCheckboxListValues(listId, values) {
    document.querySelectorAll(`#${listId} input[type="checkbox"]`).forEach(cb => {
        const checked = values.includes(cb.value);
        cb.checked = checked;
        cb.parentElement.classList.toggle('checked', checked);
    });
}

function filterCheckboxList(listId, query) {
    const q = query.trim().toLowerCase();
    document.querySelectorAll(`#${listId} .checkbox-list-item`).forEach(item => {
        const name = (item.getAttribute('data-name') || '').toLowerCase();
        item.style.display = !q || name.includes(q) ? '' : 'none';
    });
    // Also hide empty group headers
    document.querySelectorAll(`#${listId} .checkbox-list-group`).forEach(header => {
        const next = [];
        let sib = header.nextElementSibling;
        while (sib && !sib.classList.contains('checkbox-list-group')) {
            if (sib.classList.contains('checkbox-list-item')) next.push(sib);
            sib = sib.nextElementSibling;
        }
        header.style.display = next.some(i => i.style.display !== 'none') ? '' : 'none';
    });
}

// ==================== HELPERS ====================
function isCurrentlyOnLeave(leave) {
    const now = new Date();
    const start = new Date(`${leave.startDate}T${leave.startTime || '00:00'}`);
    const end = new Date(`${leave.endDate}T${leave.endTime || '23:59'}`);
    if (isNaN(start) || isNaN(end)) return false;
    return now >= start && now <= end;
}

function formatDate(dateStr) {
    if (!dateStr) return '-';
    // Use T12:00 to avoid UTC midnight off-by-one in Israel timezone
    const d = new Date(dateStr + 'T12:00:00');
    if (isNaN(d)) return dateStr;
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
    const icon = type === 'success' ? '&#10003;' : type === 'error' ? '&#10007;' : 'ℹ';
    t.innerHTML = `${icon} ${msg}`;
    c.appendChild(t);
    setTimeout(() => t.remove(), 3000);
}

let _confirmCleanup = null;
function customConfirm(msg) {
    return new Promise(resolve => {
        // Dismiss any previous open dialog and clean up its listeners
        if (_confirmCleanup) _confirmCleanup(false);
        const overlay = document.getElementById('confirmDialog');
        document.getElementById('confirmMsg').textContent = msg;
        overlay.classList.add('active');
        document.body.classList.add('modal-open');
        const yesBtn = document.getElementById('confirmYes');
        const noBtn = document.getElementById('confirmNo');
        function cleanup(result) {
            _confirmCleanup = null;
            overlay.classList.remove('active');
            if (!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open');
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            overlay.removeEventListener('click', onOverlay);
            resolve(result);
        }
        _confirmCleanup = cleanup;
        function onYes() { cleanup(true); }
        function onNo() { cleanup(false); }
        function onOverlay(e) { if (e.target === overlay) cleanup(false); }
        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
        overlay.addEventListener('click', onOverlay);
    });
}

// Online/offline indicator
window.addEventListener('offline', () => showToast('אין חיבור לאינטרנט - עובד במצב לא מקוון', 'error'));
window.addEventListener('online', () => showToast('חיבור לאינטרנט חזר'));

function esc(text) {
    if (!text) return '';
    const map = {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'};
    return String(text).replace(/[&<>"']/g, m => map[m]);
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

    const todayStr = new Date().toISOString().split('T')[0];
    const relevantShifts = state.shifts.filter(sh => filterCompanies.includes(sh.company) && sh.date === todayStr);
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
        // Don't double-count soldiers who are both assigned and on leave
        const leaveIds = new Set();
        state.leaves.filter(l => isCurrentlyOnLeave(l)).forEach(l => leaveIds.add(l.soldierId));
        state.rotationGroups.forEach(g => {
            const status = getRotationStatus(g, new Date());
            if (!status.inBase) g.soldiers?.forEach(sid => leaveIds.add(sid));
        });
        const effectiveAssigned = [...assignedIds].filter(id => !leaveIds.has(id)).length;
        statAvailable.textContent = Math.max(0, regSoldiers - effectiveAssigned - totalLeave);
    }

    // Update sidebar company counts
    ['a','b','c','d'].forEach(k => {
        const el = document.getElementById('sidebarCount-' + k);
        if (el) el.textContent = state.soldiers.filter(s => s.company === k).length;
    });

    // Update announcement badge
    if (typeof updateAnnouncementBadge === 'function') updateAnnouncementBadge();
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
    </div>

    `;

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
                <input value="${esc(t.name)}" onchange="updateTask('${compKey}',${i},'name',this.value)">
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

async function deleteTask(compKey, index) {
    if (!await customConfirm('למחוק משימה?')) return;
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
    // Add מפל"ג to combat companies only if no saved tasks exist yet
    if (!saved) {
        ['a','b','c','d'].forEach(k => {
            if (!companyData[k].tasks.find(t => t.name === 'מפל"ג')) {
                companyData[k].tasks.unshift({ name: 'מפל"ג', soldiers: 5, commanders: 1, officers: 1, shifts: 1, perShift: { soldiers: 5, commanders: 1, officers: 1 } });
            }
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
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast('נתונים יוצאו בהצלחה');
}

function importAllData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (data.state) {
                state = data.state;
                // Apply field guards (same as loadState) for older backups
                if (!state.soldiers) state.soldiers = [];
                if (!state.shifts) state.shifts = [];
                if (!state.leaves) state.leaves = [];
                if (!state.rotationGroups) state.rotationGroups = [];
                if (!state.equipment) state.equipment = [];
                if (!state.signatureLog) state.signatureLog = [];
                if (!state.weaponsData) state.weaponsData = [];
                if (!state.personalEquipment) state.personalEquipment = [];
                if (!state.rollCalls) state.rollCalls = [];
                if (!state.announcements) state.announcements = [];
                seedTestSoldier();
                saveState();
            }
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

async function resetAllData() {
    if (!await customConfirm('האם אתה בטוח? כל הנתונים יימחקו!')) return;
    if (!await customConfirm('אישור סופי - למחוק הכל?')) return;
    state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [], personalEquipment: [], rollCalls: [], announcements: [] };
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
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ==================== ANNOUNCEMENTS ====================
function renderAnnouncements() {
    const container = document.getElementById('announcementsContent');
    if (!container) return;
    if (!state.announcements || state.announcements.length === 0) {
        container.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/></svg></div><p>אין הודעות עדיין</p></div>';
        return;
    }

    const sorted = [...state.announcements].sort((a, b) => {
        if (a.priority === 'pinned' && b.priority !== 'pinned') return -1;
        if (b.priority === 'pinned' && a.priority !== 'pinned') return 1;
        return b.timestamp - a.timestamp;
    });

    container.innerHTML = sorted.map(ann => {
        const date = new Date(ann.timestamp);
        const dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });
        const timeStr = date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
        const priorityClass = ann.priority === 'urgent' ? 'ann-urgent' : ann.priority === 'pinned' ? 'ann-pinned' : '';
        const priorityIcon = ann.priority === 'urgent' ? '&#9888; ' : ann.priority === 'pinned' ? '&#128204; ' : '';
        const isAuthor = currentUser && currentUser.name === ann.author;

        return `<div class="ann-card ${priorityClass}">
            <div class="ann-header">
                <h4>${priorityIcon}${esc(ann.title)}</h4>
                ${isAuthor || isAdmin() ? `<div class="ann-actions">
                    <button class="btn btn-edit btn-sm" onclick="editAnnouncement('${ann.id}')" title="ערוך">&#9998;</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement('${ann.id}')" title="מחק">&#10005;</button>
                </div>` : ''}
            </div>
            <div class="ann-body">${esc(ann.body).replace(/\n/g, '<br>')}</div>
            <div class="ann-footer">${esc(ann.author)} | ${dateStr} ${timeStr}</div>
        </div>`;
    }).join('');

    updateAnnouncementBadge();
}

function openNewAnnouncement() {
    document.getElementById('announcementEditId').value = '';
    document.getElementById('announcementTitle').value = '';
    document.getElementById('announcementBody').value = '';
    document.getElementById('announcementPriority').value = 'normal';
    document.getElementById('announcementModalTitle').textContent = 'הודעה חדשה';
    openModal('newAnnouncementModal');
}

function editAnnouncement(id) {
    const ann = state.announcements.find(a => a.id === id);
    if (!ann) return;
    document.getElementById('announcementEditId').value = id;
    document.getElementById('announcementTitle').value = ann.title;
    document.getElementById('announcementBody').value = ann.body;
    document.getElementById('announcementPriority').value = ann.priority;
    document.getElementById('announcementModalTitle').textContent = 'עריכת הודעה';
    openModal('newAnnouncementModal');
}

function saveAnnouncement() {
    const title = document.getElementById('announcementTitle').value.trim();
    const body = document.getElementById('announcementBody').value.trim();
    const priority = document.getElementById('announcementPriority').value;
    const editId = document.getElementById('announcementEditId').value;

    if (!title) { showToast('יש להזין כותרת', 'error'); return; }
    if (!body) { showToast('יש להזין תוכן', 'error'); return; }

    if (!state.announcements) state.announcements = [];

    if (editId) {
        const ann = state.announcements.find(a => a.id === editId);
        if (ann) {
            ann.title = title;
            ann.body = body;
            ann.priority = priority;
            ann.editedAt = Date.now();
        }
    } else {
        state.announcements.push({
            id: 'ann_' + Date.now(),
            title,
            body,
            priority,
            author: currentUser ? currentUser.name : 'מערכת',
            timestamp: Date.now()
        });
    }

    saveState();
    closeModal('newAnnouncementModal');
    renderAnnouncements();
    showToast(editId ? 'הודעה עודכנה' : 'הודעה פורסמה');
}

async function deleteAnnouncement(id) {
    if (!await customConfirm('למחוק הודעה זו?')) return;
    state.announcements = state.announcements.filter(a => a.id !== id);
    saveState();
    renderAnnouncements();
    showToast('הודעה נמחקה');
}

function updateAnnouncementBadge() {
    const badge = document.getElementById('announcementBadge');
    if (!badge) return;
    const count = state.announcements ? state.announcements.filter(a => a.priority === 'urgent').length : 0;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = '';
    } else {
        badge.style.display = 'none';
    }
}

// ==================== ROLL CALL (MIFKAD) ====================
let rollCallStatus = {};

function renderRollCall() {
    const compKey = document.getElementById('rollcallCompany').value;
    const container = document.getElementById('rollcallContent');
    if (!container) return;

    const soldiers = state.soldiers.filter(s => s.company === compKey);
    if (soldiers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין חיילים בפלוגה זו</p></div>';
        return;
    }

    // Clear statuses from other companies
    const soldierIds = new Set(soldiers.map(s => s.id));
    Object.keys(rollCallStatus).forEach(id => { if (!soldierIds.has(id)) delete rollCallStatus[id]; });

    // Initialize status for all soldiers if not set
    soldiers.forEach(s => {
        if (!rollCallStatus[s.id]) {
            const onLeave = state.leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
            rollCallStatus[s.id] = onLeave ? 'leave' : 'unknown';
        }
    });

    const counts = { present: 0, absent: 0, leave: 0, unknown: 0 };
    soldiers.forEach(s => counts[rollCallStatus[s.id] || 'unknown']++);

    container.innerHTML = `
        <div class="rc-summary">
            <div class="rc-stat present"><span>${counts.present}</span><span>נוכח</span></div>
            <div class="rc-stat absent"><span>${counts.absent}</span><span>חסר</span></div>
            <div class="rc-stat leave"><span>${counts.leave}</span><span>ביציאה</span></div>
            <div class="rc-stat unknown"><span>${counts.unknown}</span><span>לא נבדק</span></div>
        </div>
        <div class="rc-grid">
            ${soldiers.map(s => {
                const st = rollCallStatus[s.id] || 'unknown';
                return `<div class="rc-soldier rc-${st}" data-id="${s.id}">
                    <div class="rc-soldier-info">
                        <strong><a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a></strong>
                        <span class="rc-role">${esc(s.role)}</span>
                    </div>
                    <div class="rc-buttons">
                        <button class="rc-btn ${st==='present'?'active':''}" data-status="present" onclick="setRollCallStatus('${s.id}','present')" title="נוכח">&#10003;</button>
                        <button class="rc-btn rc-absent ${st==='absent'?'active':''}" data-status="absent" onclick="setRollCallStatus('${s.id}','absent')" title="חסר">&#10007;</button>
                        <button class="rc-btn rc-leave ${st==='leave'?'active':''}" data-status="leave" onclick="setRollCallStatus('${s.id}','leave')" title="ביציאה">&#127968;</button>
                    </div>
                </div>`;
            }).join('')}
        </div>`;

    renderRollCallHistory(compKey);
}

function setRollCallStatus(soldierId, status) {
    rollCallStatus[soldierId] = status;
    // Update only the specific row + summary instead of full re-render
    const row = document.querySelector(`.rc-soldier[data-id="${soldierId}"]`);
    if (row) {
        row.querySelectorAll('.rc-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.status === status);
        });
        updateRollCallSummary();
    } else {
        renderRollCall();
    }
}

function updateRollCallSummary() {
    const compKey = document.getElementById('rollcallCompany').value;
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const counts = { present: 0, absent: 0, leave: 0, unknown: 0 };
    soldiers.forEach(s => counts[rollCallStatus[s.id] || 'unknown']++);
    const els = document.querySelectorAll('.rc-stat span:first-child');
    if (els.length >= 4) {
        els[0].textContent = counts.present;
        els[1].textContent = counts.absent;
        els[2].textContent = counts.leave;
        els[3].textContent = counts.unknown;
    }
}

function markAllPresent() {
    const compKey = document.getElementById('rollcallCompany').value;
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    soldiers.forEach(s => {
        const onLeave = state.leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
        rollCallStatus[s.id] = onLeave ? 'leave' : 'present';
    });
    renderRollCall();
}

function saveRollCall() {
    const compKey = document.getElementById('rollcallCompany').value;
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const now = new Date();
    const record = {
        id: 'rc_' + Date.now(),
        company: compKey,
        date: now.toISOString().split('T')[0],
        time: now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        author: currentUser ? currentUser.name : 'מערכת',
        entries: {}
    };
    soldiers.forEach(s => {
        record.entries[s.id] = rollCallStatus[s.id] || 'unknown';
    });

    if (!state.rollCalls) state.rollCalls = [];
    state.rollCalls.push(record);
    saveState();
    // Clear only the saved company's soldiers from rollCallStatus
    state.soldiers.filter(s => s.company === compKey).forEach(s => delete rollCallStatus[s.id]);
    renderRollCall();
    showToast('מפקד נשמר בהצלחה');
}

function renderRollCallHistory(compKey) {
    const container = document.getElementById('rollcallHistory');
    if (!container) return;
    if (!state.rollCalls || state.rollCalls.length === 0) {
        container.innerHTML = '';
        return;
    }

    const history = state.rollCalls.filter(rc => rc.company === compKey).sort((a, b) => b.id.localeCompare(a.id)).slice(0, 5);
    if (history.length === 0) { container.innerHTML = ''; return; }

    container.innerHTML = `
        <details class="sp-section">
            <summary><h4 style="display:inline;">היסטוריית מפקדים (${history.length})</h4></summary>
            <div class="rc-history-list">
                ${history.map(rc => {
                    const entries = Object.values(rc.entries);
                    const present = entries.filter(e => e === 'present').length;
                    const absent = entries.filter(e => e === 'absent').length;
                    const leave = entries.filter(e => e === 'leave').length;
                    return `<div class="rc-history-item">
                        <div><strong>${formatDate(rc.date)}</strong> ${rc.time} | ${esc(rc.author)}</div>
                        <div class="rc-history-counts">
                            <span style="color:var(--success);">&#10003; ${present}</span>
                            <span style="color:var(--danger);">&#10007; ${absent}</span>
                            <span style="color:var(--warning);">&#127968; ${leave}</span>
                            <span>סה"כ: ${entries.length}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </details>`;
}

function copyRollCallText() {
    const compKey = document.getElementById('rollcallCompany').value;
    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const now = new Date();

    let text = `*מפקד ${compNames[compKey]}*\n`;
    text += `${now.toLocaleDateString('he-IL')} ${now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}\n\n`;

    const statusLabels = { present: 'נוכח', absent: 'חסר', leave: 'ביציאה', unknown: 'לא נבדק' };
    const groups = { present: [], absent: [], leave: [], unknown: [] };
    soldiers.forEach(s => {
        const st = rollCallStatus[s.id] || 'unknown';
        groups[st].push(s.name);
    });

    if (groups.present.length > 0) text += `*נוכחים (${groups.present.length}):*\n${groups.present.join(', ')}\n\n`;
    if (groups.absent.length > 0) text += `*חסרים (${groups.absent.length}):*\n${groups.absent.join(', ')}\n\n`;
    if (groups.leave.length > 0) text += `*ביציאה (${groups.leave.length}):*\n${groups.leave.join(', ')}\n\n`;

    text += `*סה"כ:* ${groups.present.length}/${soldiers.length} נוכחים`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('מפקד הועתק ללוח');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('מפקד הועתק ללוח');
    });
}

// ==================== MORNING REPORT ====================
function generateMorningReport() {
    const container = document.getElementById('morningReportContent');
    if (!container) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dateDisplay = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeDisplay = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const companies = ['a','b','c','d','hq','palsam'];
    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};
    let rows = '';
    let totalAll = 0, totalPresent = 0, totalLeave = 0, totalShift = 0;

    companies.forEach(k => {
        const soldiers = state.soldiers.filter(s => s.company === k);
        const total = soldiers.length;
        const onLeave = soldiers.filter(s => state.leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l)));
        // Include rotation-absent soldiers
        const rotationAbsent = soldiers.filter(s => {
            if (onLeave.find(x => x.id === s.id)) return false; // already counted
            const group = state.rotationGroups?.find(g => g.soldiers?.includes(s.id));
            if (!group) return false;
            const status = getRotationStatus(group, now);
            return !status.inBase;
        });
        const onShift = soldiers.filter(s => state.shifts.some(sh => sh.company === k && sh.date === todayStr && sh.soldiers.includes(s.id)));
        const leaveCount = onLeave.length + rotationAbsent.length;
        const shiftCount = onShift.length;
        const present = total - leaveCount;

        totalAll += total;
        totalPresent += present;
        totalLeave += leaveCount;
        totalShift += shiftCount;

        const leaveNames = onLeave.map(s => esc(s.name)).join(', ');
        const shiftNames = onShift.map(s => esc(s.name)).join(', ');

        rows += `<tr>
            <td style="font-weight:600;">${compNames[k]}</td>
            <td>${total}</td>
            <td style="color:var(--success);font-weight:600;">${present}</td>
            <td style="color:var(--danger);">${leaveCount}${leaveCount > 0 ? `<div class="mr-names">${leaveNames}</div>` : ''}</td>
            <td>${shiftCount}${shiftCount > 0 ? `<div class="mr-names">${shiftNames}</div>` : ''}</td>
        </tr>`;
    });

    // Upcoming leaves (next 3 days)
    const upcoming = [];
    for (let d = 1; d <= 3; d++) {
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + d);
        const fStr = futureDate.toISOString().split('T')[0];
        const leaving = state.leaves.filter(l => l.startDate === fStr);
        const returning = state.leaves.filter(l => l.endDate === fStr);
        if (leaving.length > 0 || returning.length > 0) {
            const dayName = futureDate.toLocaleDateString('he-IL', { weekday: 'short', day: 'numeric', month: 'numeric' });
            upcoming.push({ dayName, leaving, returning });
        }
    }

    let upcomingHtml = '';
    if (upcoming.length > 0) {
        upcomingHtml = `<div class="mr-upcoming">
            <h4>תנועת חיילים - 3 ימים קרובים</h4>
            ${upcoming.map(u => {
                const lNames = u.leaving.map(l => { const s = state.soldiers.find(x => x.id === l.soldierId); return s ? esc(s.name) : '?'; }).join(', ');
                const rNames = u.returning.map(l => { const s = state.soldiers.find(x => x.id === l.soldierId); return s ? esc(s.name) : '?'; }).join(', ');
                return `<div class="mr-upcoming-day">
                    <strong>${u.dayName}:</strong>
                    ${u.leaving.length > 0 ? `<span style="color:var(--danger);">&#8592; יוצאים (${u.leaving.length}): ${lNames}</span>` : ''}
                    ${u.returning.length > 0 ? `<span style="color:var(--success);">&#8594; חוזרים (${u.returning.length}): ${rNames}</span>` : ''}
                </div>`;
            }).join('')}
        </div>`;
    }

    container.innerHTML = `
        <div class="mr-report" id="morningReportPrint">
            <div class="mr-header">
                <h3>דו"ח בוקר - גדוד יהודה</h3>
                <div class="mr-date">${dateDisplay} | שעה ${timeDisplay}</div>
                <div class="mr-author">הופק ע"י: ${esc(currentUser ? currentUser.name : 'מערכת')}</div>
            </div>
            <div class="mr-summary">
                <div class="mr-stat"><span class="mr-stat-value">${totalAll}</span><span class="mr-stat-label">כוח סה"כ</span></div>
                <div class="mr-stat present"><span class="mr-stat-value">${totalPresent}</span><span class="mr-stat-label">נוכחים</span></div>
                <div class="mr-stat leave"><span class="mr-stat-value">${totalLeave}</span><span class="mr-stat-label">ביציאות</span></div>
                <div class="mr-stat shift"><span class="mr-stat-value">${totalShift}</span><span class="mr-stat-label">במשמרות היום</span></div>
            </div>
            <div class="table-scroll">
                <table class="mr-table">
                    <thead><tr><th>מסגרת</th><th>סה"כ</th><th>נוכחים</th><th>ביציאה</th><th>במשמרת</th></tr></thead>
                    <tbody>${rows}</tbody>
                    <tfoot><tr style="font-weight:700;background:var(--bg);">
                        <td>סה"כ גדוד</td><td>${totalAll}</td><td>${totalPresent}</td><td>${totalLeave}</td><td>${totalShift}</td>
                    </tr></tfoot>
                </table>
            </div>
            ${upcomingHtml}
        </div>`;
}

function getMorningReportText() {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dateDisplay = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeDisplay = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
    const companies = ['a','b','c','d','hq','palsam'];
    const compNames = {a:'פלוגה א', b:'פלוגה ב', c:'פלוגה ג', d:'פלוגה ד', hq:'חפ"ק מג"ד', palsam:'פלס"ם'};

    let text = `*דו"ח בוקר - גדוד יהודה*\n${dateDisplay} | ${timeDisplay}\n\n`;
    let totalAll = 0, totalPresent = 0;

    companies.forEach(k => {
        const soldiers = state.soldiers.filter(s => s.company === k);
        const total = soldiers.length;
        const onLeave = soldiers.filter(s => state.leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l)));
        // Include rotation-absent soldiers (same as generateMorningReport)
        const rotationAbsent = soldiers.filter(s => {
            if (onLeave.find(x => x.id === s.id)) return false;
            const group = state.rotationGroups?.find(g => g.soldiers?.includes(s.id));
            if (!group) return false;
            const status = getRotationStatus(group, now);
            return !status.inBase;
        });
        const absentCount = onLeave.length + rotationAbsent.length;
        const present = total - absentCount;
        totalAll += total;
        totalPresent += present;

        text += `*${compNames[k]}:* ${present}/${total}`;
        if (onLeave.length > 0) {
            text += ` (ביציאה: ${onLeave.map(s => s.name).join(', ')})`;
        }
        if (rotationAbsent.length > 0) {
            text += ` (רוטציה: ${rotationAbsent.length})`;
        }
        text += '\n';
    });

    text += `\n*סה"כ גדוד:* ${totalPresent}/${totalAll} נוכחים`;
    return text;
}

function copyMorningReportText() {
    const text = getMorningReportText();
    navigator.clipboard.writeText(text).then(() => {
        showToast('דו"ח הועתק ללוח - הדבק בוואטסאפ');
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('דו"ח הועתק ללוח');
    });
}

function exportMorningReportPDF() {
    const el = document.getElementById('morningReportPrint');
    if (!el) { showToast('יש להפיק דו"ח קודם', 'error'); return; }
    if (typeof html2pdf === 'undefined') { showToast('ספריית PDF לא נטענה', 'error'); return; }
    html2pdf().set({
        margin: 10,
        filename: `דוח_בוקר_${new Date().toISOString().split('T')[0]}.pdf`,
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(el).save();
    showToast('PDF נוצר בהצלחה');
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
            html += `<tr><td>${esc(g.name)}</td><td style="color:${statusColor};font-weight:600;">${statusText}</td><td>${status.dayInCycle}/${g.daysIn + g.daysOut}</td><td>${g.soldiers.length}</td></tr>`;
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
            const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? esc(s.name) : '?'; }).join(', ');
            html += `<tr><td>${esc(compName)}</td><td>${esc(sh.task)}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
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
                html += `<tr><td>${esc(s.name)}</td><td>${esc(s.rank)}</td><td>${esc(s.role)}</td><td>${esc(s.personalId) || '-'}</td><td>${esc(s.phone) || '-'}</td></tr>`;
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
            const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? esc(s.name) : '?'; }).join(', ');
            html += `<tr><td>${formatDate(sh.date)}</td><td>${esc(sh.task)}</td><td>${esc(sh.shiftName) || '-'}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
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
            html += `<tr style="${rowStyle}"><td>${sol ? esc(sol.name) : '?'}</td><td>${formatDate(l.startDate)} ${l.startTime}</td><td>${formatDate(l.endDate)} ${l.endTime}</td><td>${esc(l.notes) || '-'}</td></tr>`;
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
    const todayStr = new Date().toISOString().split('T')[0];
    let html = buildReportHTML(type);
    if (!html) return;

    const titles = { daily: 'דוח_יומי', company: 'דוח_פלוגות', shifts: 'דוח_שיבוצים', leaves: 'דוח_יציאות' };
    const filename = `${titles[type] || 'דוח'}_${todayStr}`;

    // html2pdf.js - pixel-perfect rendering with RTL support
    const tmp = document.createElement('div');
    tmp.style.cssText = 'position:fixed;left:-9999px;top:0;z-index:-1;width:210mm;direction:rtl;font-family:Segoe UI,Arial,sans-serif;font-size:12px;padding:15mm;background:#fff;';
    tmp.innerHTML = html;
    document.body.appendChild(tmp);

    if (typeof html2pdf !== 'undefined') {
        html2pdf().set({
            margin: [10, 10, 10, 10],
            filename: filename + '.pdf',
            image: { type: 'jpeg', quality: 0.95 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['css', 'legacy'] }
        }).from(tmp).save().then(() => {
            tmp.remove();
            showToast('PDF נוצר בהצלחה');
        }).catch(err => {
            console.error('PDF export error:', err);
            tmp.remove();
            showToast('שגיאה ביצירת PDF', 'error');
        });
    } else if (typeof jspdf !== 'undefined') {
        // Fallback to jsPDF.html
        const doc = new jspdf.jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        doc.html(tmp, {
            callback: function(doc) {
                doc.save(filename + '.pdf');
                tmp.remove();
                showToast('PDF נוצר בהצלחה');
            },
            x: 10, y: 10, width: 190, windowWidth: 800
        });
    } else {
        tmp.remove();
        showToast('ספריית PDF לא נטענה', 'error');
    }
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
                soldiers.forEach(s => html += `<tr><td>${esc(s.name)}</td><td>${esc(s.rank)}</td><td>${esc(s.role)}</td><td>${esc(s.personalId)||'-'}</td><td>${esc(s.phone)||'-'}</td></tr>`);
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
                const names = sh.soldiers.map(sid => { const s = state.soldiers.find(x => x.id === sid); return s ? esc(s.name) : '?'; }).join(', ');
                html += `<tr><td>${formatDate(sh.date)}</td><td>${esc(sh.task)}</td><td>${sh.startTime}-${sh.endTime}</td><td>${names}</td></tr>`;
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
                html += `<tr><td>${sol?esc(sol.name):'?'}</td><td>${formatDate(l.startDate)} ${l.startTime}</td><td>${formatDate(l.endDate)} ${l.endTime}</td><td>${esc(l.notes)||'-'}</td></tr>`;
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

// --- Document Logo Loader ---
let DOC_LOGO_BASE64 = '';
(function loadDocLogo() {
    const img = new Image();
    img.onload = function() {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        DOC_LOGO_BASE64 = c.toDataURL('image/png');
    };
    img.src = 'doc-logo.png';
    img.onerror = function() {
        const fallback = new Image();
        fallback.onload = function() {
            const c = document.createElement('canvas');
            c.width = fallback.width; c.height = fallback.height;
            c.getContext('2d').drawImage(fallback, 0, 0);
            DOC_LOGO_BASE64 = c.toDataURL('image/png');
        };
        fallback.src = 'logo.png';
    };
})();

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

    // Remove old listeners to prevent stacking
    if (canvas._sigCleanup) canvas._sigCleanup();
    canvas.addEventListener('mousedown', start);
    canvas.addEventListener('mousemove', move);
    canvas.addEventListener('mouseup', stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', stop);
    canvas._sigCleanup = () => {
        canvas.removeEventListener('mousedown', start);
        canvas.removeEventListener('mousemove', move);
        canvas.removeEventListener('mouseup', stop);
        canvas.removeEventListener('mouseleave', stop);
        canvas.removeEventListener('touchstart', start);
        canvas.removeEventListener('touchmove', move);
        canvas.removeEventListener('touchend', stop);
    };

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
    document.getElementById('equipDefaultQty').value = '1';
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
    document.getElementById('equipDefaultQty').value = eq.defaultQty || 1;
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
    const defaultQty = parseInt(document.getElementById('equipDefaultQty').value) || 1;
    const notes = document.getElementById('equipNotes').value.trim();

    if (editId) {
        const eq = state.equipment.find(e => e.id === editId);
        if (eq) {
            eq.type = type;
            eq.serial = serial;
            eq.company = company;
            eq.condition = condition;
            eq.defaultQty = defaultQty;
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
            type, serial, company, condition, defaultQty, notes,
            holderId: null, holderName: '', holderPhone: '',
            assignedDate: null, signatureImg: null
        });
        showToast(`${type} (${serial}) נוסף`);
    }
    saveState();
    closeModal('addEquipmentModal');
    renderEquipmentTab();
}

async function deleteEquipment(id) {
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    if (eq.holderId) {
        if (!await customConfirm(`הציוד מוחזק ע"י ${eq.holderName}. למחוק בכל זאת?`)) return;
    } else {
        if (!await customConfirm('למחוק פריט ציוד?')) return;
    }
    state.equipment = state.equipment.filter(e => e.id !== id);
    saveState();
    renderEquipmentTab();
    showToast('פריט נמחק');
}

// --- Sign Equipment ---
function openSignEquipment() {
    const container = document.getElementById('signEquipCheckboxList');
    const availableEquip = state.equipment.filter(e => !e.holderId && e.condition !== 'תקול');

    container.innerHTML = availableEquip.length === 0
        ? '<div style="padding:8px;color:var(--text-light);">אין פריטי ציוד פנויים</div>'
        : availableEquip.map(e => `
            <label class="sign-equip-checkbox-item" data-search="${e.type} ${e.serial} ${e.notes || ''}" style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);cursor:pointer;">
                <input type="checkbox" value="${e.id}" onchange="updateSignEquipSelection()">
                <span style="font-weight:600;flex:1;">${e.type}</span>
                <span style="color:var(--text-light);font-size:0.85em;direction:ltr;font-family:monospace;">צ' ${e.serial}</span>
                <span style="color:var(--text-light);font-size:0.8em;">x${e.defaultQty || 1}</span>
            </label>
        `).join('');

    document.getElementById('signEquipSelectedCount').textContent = '';
    document.getElementById('signEquipInfo').style.display = 'none';
    document.getElementById('signEquipInfo').innerHTML = '';
    document.getElementById('signEquipSearch').value = '';
    document.getElementById('signSoldierInfo').style.display = 'none';
    document.getElementById('signCompany').value = 'all';
    updateSignSoldiers();
    // Clear edit context
    delete document.getElementById('signEquipmentModal').dataset.editLogId;
    openModal('signEquipmentModal');
    setTimeout(() => {
        setupSignatureCanvas('signatureCanvas');
        clearSignatureCanvas();
    }, 100);
}

function filterSignEquipCheckboxes() {
    const query = document.getElementById('signEquipSearch').value.trim().toLowerCase();
    document.querySelectorAll('#signEquipCheckboxList .sign-equip-checkbox-item').forEach(item => {
        item.style.display = item.getAttribute('data-search').toLowerCase().includes(query) ? '' : 'none';
    });
}

function updateSignEquipSelection() {
    const checkboxes = document.querySelectorAll('#signEquipCheckboxList input[type="checkbox"]:checked');
    const count = checkboxes.length;
    document.getElementById('signEquipSelectedCount').textContent = count > 0 ? `(${count} נבחרו)` : '';

    const info = document.getElementById('signEquipInfo');
    if (count === 0) { info.style.display = 'none'; info.innerHTML = ''; return; }

    const selectedIds = Array.from(checkboxes).map(cb => cb.value);
    const selectedEquip = selectedIds.map(id => state.equipment.find(e => e.id === id)).filter(Boolean);

    info.style.display = '';
    info.innerHTML = `
        <table style="width:100%;font-size:0.85em;border-collapse:collapse;">
            <thead><tr style="background:var(--primary);color:white;">
                <th style="padding:4px 8px;text-align:right;">#</th>
                <th style="padding:4px 8px;text-align:right;">שם פריט</th>
                <th style="padding:4px 8px;text-align:right;">מספר צ'</th>
                <th style="padding:4px 8px;text-align:right;">כמות</th>
            </tr></thead>
            <tbody>${selectedEquip.map((e, i) => `
                <tr style="border-bottom:1px solid var(--border);">
                    <td style="padding:4px 8px;">${i + 1}</td>
                    <td style="padding:4px 8px;font-weight:600;">${e.type}</td>
                    <td style="padding:4px 8px;direction:ltr;font-family:monospace;">${e.serial}</td>
                    <td style="padding:4px 8px;">${e.defaultQty || 1}</td>
                </tr>`).join('')}
            </tbody>
        </table>`;
}

function getSelectedSignEquipIds() {
    return Array.from(document.querySelectorAll('#signEquipCheckboxList input[type="checkbox"]:checked')).map(cb => cb.value);
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
    info.innerHTML = `<strong>${esc(sol.name)}</strong> | ${esc(sol.role)} | ${esc(sol.personalId)} | ${esc(sol.phone) || 'אין טלפון'}`;
}

function confirmSignEquipment() {
    const selectedIds = getSelectedSignEquipIds();
    const soldierId = document.getElementById('signSoldier').value;
    const editLogId = document.getElementById('signEquipmentModal').dataset.editLogId || '';

    if (selectedIds.length === 0) { showToast('יש לבחור לפחות פריט ציוד אחד', 'error'); return; }
    if (!soldierId) { showToast('יש לבחור חייל', 'error'); return; }
    if (isCanvasEmpty('signatureCanvas')) { showToast('יש לחתום על המסך', 'error'); return; }

    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    const signatureImg = getCanvasDataURL('signatureCanvas');
    const now = new Date();
    const dateStr = now.toISOString();

    // If editing - release old items first
    if (editLogId) {
        const oldLog = state.signatureLog.find(l => l.id === editLogId);
        if (oldLog) {
            const oldItems = oldLog.equipItems || [{ equipId: oldLog.equipId }];
            oldItems.forEach(item => {
                const eq = state.equipment.find(e => e.id === item.equipId);
                if (eq && eq.holderId === oldLog.soldierId) {
                    eq.holderId = null;
                    eq.holderName = '';
                    eq.holderPhone = '';
                    eq.assignedDate = null;
                    eq.signatureImg = null;
                }
            });
            // Remove old log entry
            state.signatureLog = state.signatureLog.filter(l => l.id !== editLogId);
        }
    }

    // Collect all selected equipment
    const selectedEquip = selectedIds.map(id => state.equipment.find(e => e.id === id)).filter(Boolean);

    // Update each equipment item
    selectedEquip.forEach(eq => {
        eq.holderId = sol.id;
        eq.holderName = sol.name;
        eq.holderPhone = sol.phone || '';
        eq.assignedDate = dateStr;
        eq.signatureImg = signatureImg;
    });

    // Create ONE batch log entry
    const logEntry = {
        id: 'sig_' + Date.now(),
        type: 'assign',
        // Legacy fields (first item) for backward compat
        equipId: selectedEquip[0].id,
        equipType: selectedEquip[0].type,
        equipSerial: selectedEquip[0].serial,
        // Batch: all items
        equipItems: selectedEquip.map(eq => ({
            equipId: eq.id,
            equipType: eq.type,
            equipSerial: eq.serial,
            equipQty: eq.defaultQty || 1
        })),
        soldierId: sol.id,
        soldierName: sol.name,
        soldierPhone: sol.phone || '',
        soldierPersonalId: sol.personalId || '',
        date: dateStr,
        signatureImg
    };
    state.signatureLog.push(logEntry);
    saveState();

    // Clear edit context
    delete document.getElementById('signEquipmentModal').dataset.editLogId;

    // No auto-download - user downloads from signature history
    closeModal('signEquipmentModal');
    renderEquipmentTab();

    const itemNames = selectedEquip.map(e => e.type).join(', ');
    showToast(`${sol.name} חתם על ${selectedEquip.length} פריטים: ${itemNames}`);
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
                        <th>סוג ציוד</th><th>מספר סידורי</th><th>כמות</th><th>מסגרת</th><th>מצב</th>
                        <th>סטטוס</th><th>מחזיק</th><th>טלפון</th><th>תאריך חתימה</th><th>פעולות</th>
                    </tr></thead>
                    <tbody>
                        ${items.map(e => {
                            const statusClass = e.condition === 'תקול' ? 'faulty' : e.holderId ? 'assigned' : 'available';
                            const statusText = e.condition === 'תקול' ? 'תקול' : e.holderId ? 'מוחזק' : 'פנוי';
                            return `<tr>
                                <td style="font-weight:600;">${e.type}</td>
                                <td style="direction:ltr;font-family:monospace;">${e.serial}</td>
                                <td>${e.defaultQty || 1}</td>
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
    // Equipment Sets (סט ציוד ללוחם)
    renderEquipmentSetsSettings();
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

        // Handle batch display
        let equipDisplay;
        if (log.equipItems && log.equipItems.length > 1) {
            equipDisplay = `${log.equipItems.length} פריטים: ${log.equipItems.map(i => i.equipType).join(', ')}`;
        } else {
            equipDisplay = `${log.equipType} (${log.equipSerial})`;
        }

        return `<div class="sig-history-card ${isReturn ? 'return' : ''}">
            <div class="sig-info">
                <h4>${isReturn ? '&#8634; זיכוי' : '&#9998; חתימה'} - ${equipDisplay}</h4>
                <div class="meta">${log.soldierName} | ${log.soldierPersonalId || ''} | ${log.soldierPhone || ''}</div>
                <div class="meta">${dateFormatted}${log.notes ? ' | ' + log.notes : ''}</div>
            </div>
            <div class="sig-actions">
                <img class="sig-preview" src="${log.signatureImg}" alt="חתימה">
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    <button class="btn btn-primary btn-sm" onclick="redownloadPDF('${log.id}')">&#128196; PDF</button>
                    ${!isReturn ? `<button class="btn btn-sm" style="background:var(--card);" onclick="editSignatureLog('${log.id}')" title="ערוך / הוסף פריטים">&#9998;</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteSignatureLog('${log.id}')" title="מחק חתימה">&#10005;</button>
                </div>
            </div>
        </div>`;
    }).join('');
}

function redownloadPDF(logId) {
    const log = state.signatureLog.find(l => l.id === logId);
    if (!log) { showToast('רשומה לא נמצאה', 'error'); return; }
    const sol = state.soldiers.find(s => s.id === log.soldierId)
        || { name: log.soldierName, personalId: log.soldierPersonalId, phone: log.soldierPhone };
    if (log.type === 'return') {
        const eq = state.equipment.find(e => e.id === log.equipId)
            || { type: log.equipType, serial: log.equipSerial };
        generateReturnPDF(log, eq);
    } else {
        generateSignaturePDF(log, null, sol);
    }
}

async function deleteSignatureLog(logId) {
    if (!await customConfirm('למחוק חתימה זו?')) return;
    const log = state.signatureLog.find(l => l.id === logId);
    if (!log) return;

    // Release equipment back if it was an assign
    if (log.type === 'assign') {
        const items = log.equipItems || [{ equipId: log.equipId }];
        items.forEach(item => {
            const eq = state.equipment.find(e => e.id === item.equipId);
            if (eq && eq.holderId === log.soldierId) {
                eq.holderId = null;
                eq.holderName = '';
                eq.holderPhone = '';
                eq.assignedDate = null;
                eq.signatureImg = null;
            }
        });
    }

    state.signatureLog = state.signatureLog.filter(l => l.id !== logId);
    saveState();
    renderEquipmentTab();
    showToast('חתימה נמחקה');
}

function editSignatureLog(logId) {
    const log = state.signatureLog.find(l => l.id === logId);
    if (!log || log.type === 'return') return;

    // Open sign modal pre-populated with the soldier and existing items
    const container = document.getElementById('signEquipCheckboxList');
    const availableEquip = state.equipment.filter(e => !e.holderId && e.condition !== 'תקול');

    // Include items already in this signature (they are currently held by the soldier)
    const existingItems = log.equipItems || [{ equipId: log.equipId }];
    const existingIds = existingItems.map(i => i.equipId);
    const heldEquip = existingIds.map(id => state.equipment.find(e => e.id === id)).filter(Boolean);
    const allEquip = [...heldEquip, ...availableEquip];

    container.innerHTML = allEquip.length === 0
        ? '<div style="padding:8px;color:var(--text-light);">אין פריטי ציוד</div>'
        : allEquip.map(e => {
            const isExisting = existingIds.includes(e.id);
            return `
            <label class="sign-equip-checkbox-item" data-search="${e.type} ${e.serial} ${e.notes || ''}" style="display:flex;align-items:center;gap:8px;padding:6px 4px;border-bottom:1px solid var(--border);cursor:pointer;${isExisting ? 'background:rgba(76,175,80,0.1);' : ''}">
                <input type="checkbox" value="${e.id}" ${isExisting ? 'checked' : ''} onchange="updateSignEquipSelection()">
                <span style="font-weight:600;flex:1;">${e.type}</span>
                <span style="color:var(--text-light);font-size:0.85em;direction:ltr;font-family:monospace;">צ' ${e.serial}</span>
                <span style="color:var(--text-light);font-size:0.8em;">x${e.defaultQty || 1}</span>
            </label>`;
        }).join('');

    document.getElementById('signEquipSelectedCount').textContent = `(${existingIds.length} נבחרו)`;
    updateSignEquipSelection();
    document.getElementById('signEquipSearch').value = '';
    document.getElementById('signSoldierInfo').style.display = 'none';

    // Pre-select the soldier
    document.getElementById('signCompany').value = 'all';
    updateSignSoldiers();
    setTimeout(() => {
        document.getElementById('signSoldier').value = log.soldierId;
        onSignSoldierSelect();
    }, 50);

    // Store edit context
    document.getElementById('signEquipmentModal').dataset.editLogId = logId;

    openModal('signEquipmentModal');
    setTimeout(() => {
        setupSignatureCanvas('signatureCanvas');
        clearSignatureCanvas();
    }, 100);
}

// --- PDF Generation ---
function generateSignaturePDF(logEntry, eqUnused, sol) {
    const now = new Date(logEntry.date);
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    // Build items array: batch (equipItems) or legacy single item
    const items = logEntry.equipItems
        ? logEntry.equipItems
        : [{ equipType: logEntry.equipType, equipSerial: logEntry.equipSerial, equipQty: 1 }];

    const logoHtml = DOC_LOGO_BASE64
        ? `<img src="${DOC_LOGO_BASE64}" style="max-height:80px;margin-bottom:8px;">`
        : '';

    const itemRows = items.map((item, i) => `
        <tr>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;">${i + 1}</td>
            <td style="padding:8px;text-align:right;border:1px solid #dfe6e9;font-weight:600;">${item.equipType}</td>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;direction:ltr;font-family:monospace;">${item.equipSerial}</td>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;">${item.equipQty || 1}</td>
        </tr>
    `).join('');

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:auto;padding:32px 36px;color:#1a1a1a;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:22px;">
            ${logoHtml}
            <h1 style="color:#1a3a5c;margin:6px 0 2px;font-size:1.45em;letter-spacing:0.3px;">טופס קבלת ציוד מבוקר</h1>
            <p style="color:#7f8c8d;margin:0;font-size:0.85em;">מערכת ניהול גדודי — צל"מ</p>
        </div>
        <hr style="border:none;border-top:2px solid #1a3a5c;margin:0 0 20px;">

        <!-- Soldier details - centered 2-column grid -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #d0d7de;border-radius:8px;overflow:hidden;margin-bottom:20px;">
            <div style="padding:9px 14px;background:#f6f8fa;font-weight:700;border-bottom:1px solid #d0d7de;">שם מלא</div>
            <div style="padding:9px 14px;border-bottom:1px solid #d0d7de;border-right:1px solid #d0d7de;">${sol.name}</div>
            <div style="padding:9px 14px;background:#f6f8fa;font-weight:700;border-bottom:1px solid #d0d7de;">מספר אישי</div>
            <div style="padding:9px 14px;border-bottom:1px solid #d0d7de;border-right:1px solid #d0d7de;">${sol.personalId || '-'}</div>
            <div style="padding:9px 14px;background:#f6f8fa;font-weight:700;border-bottom:1px solid #d0d7de;">טלפון</div>
            <div style="padding:9px 14px;direction:ltr;border-bottom:1px solid #d0d7de;border-right:1px solid #d0d7de;">${sol.phone || '-'}</div>
            <div style="padding:9px 14px;background:#f6f8fa;font-weight:700;">תאריך ושעה</div>
            <div style="padding:9px 14px;border-right:1px solid #d0d7de;">${dateStr} | ${timeStr}</div>
        </div>

        <!-- Equipment items -->
        <div style="font-weight:700;margin-bottom:8px;font-size:1em;">פריטי ציוד (${items.length}):</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.93em;">
            <thead>
                <tr style="background:#1a3a5c;color:white;text-align:center;">
                    <th style="padding:9px 6px;border:1px solid #1a3a5c;width:36px;">#</th>
                    <th style="padding:9px 12px;border:1px solid #1a3a5c;text-align:right;">שם פריט</th>
                    <th style="padding:9px 12px;border:1px solid #1a3a5c;">מספר צ'</th>
                    <th style="padding:9px 6px;border:1px solid #1a3a5c;width:56px;">כמות</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <!-- Declaration -->
        <div style="background:#f6f8fa;border-right:4px solid #1a3a5c;padding:12px 16px;border-radius:0 6px 6px 0;font-size:0.88em;margin-bottom:24px;line-height:1.6;">
            אני הח"מ מאשר/ת שקיבלתי לידי את הציוד המפורט לעיל במצב תקין, ואני מתחייב/ת לשמור עליו ולהחזירו במצבו כפי שקיבלתי אותו.
        </div>

        <!-- Signature -->
        <div style="text-align:center;">
            <div style="font-weight:700;margin-bottom:10px;font-size:0.95em;">חתימת המקבל/ת:</div>
            <img src="${logEntry.signatureImg}" style="max-width:380px;height:110px;border:1px solid #d0d7de;border-radius:8px;background:#fff;">
            <div style="margin-top:6px;font-size:0.8em;color:#7f8c8d;">${sol.name} | ${dateStr}</div>
        </div>

        <hr style="border:none;border-top:1px solid #e0e0e0;margin:22px 0 10px;">
        <div style="text-align:center;font-size:0.72em;color:#aaa;">
            מסמך זה הופק אוטומטית ממערכת ניהול גדודי &nbsp;|&nbsp; ${dateStr} ${timeStr}
        </div>
    </div>`;

    downloadPDF(html, `חתימה_${sol.name}_${items.length}פריטים_${dateStr.replace(/\./g,'-')}`);
}

function generateReturnPDF(logEntry, eq) {
    const now = new Date(logEntry.date);
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const logoHtml = DOC_LOGO_BASE64
        ? `<img src="${DOC_LOGO_BASE64}" style="max-height:80px;margin-bottom:8px;">`
        : '';

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:700px;margin:auto;padding:30px;">
        <div style="text-align:center;margin-bottom:20px;">
            ${logoHtml}
            <h1 style="color:#E65100;margin:0;">טופס זיכוי / החזרת ציוד</h1>
            <p style="color:#7f8c8d;margin:4px 0;">מערכת ניהול גדודי - צל"מ</p>
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
            מסמך זה הופק אוטומטית ממערכת ניהול גדודי | ${dateStr} ${timeStr}
        </div>
    </div>`;

    downloadPDF(html, `זיכוי_${eq.type}_${eq.serial}_${logEntry.soldierName}_${dateStr.replace(/\./g,'-')}`);
}

function downloadPDF(htmlContent, filename) {
    // html2pdf.js - pixel-perfect DOM-to-PDF with RTL/Hebrew support
    const container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:0;left:0;z-index:-1;width:210mm;background:#fff;direction:rtl;font-family:Segoe UI,Arial,sans-serif;opacity:0;pointer-events:none;';
    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    // Wait for all images (logo, signature) to load before rendering
    const images = container.querySelectorAll('img');
    const imagePromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });
    });

    Promise.all(imagePromises).then(() => {
        if (typeof html2pdf !== 'undefined') {
            html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: (filename || 'document') + '.pdf',
                image: { type: 'jpeg', quality: 0.95 },
                html2canvas: { scale: 2, useCORS: true, logging: false, scrollX: 0, scrollY: 0 },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['css', 'legacy'] }
            }).from(container).save().then(() => {
                container.remove();
                showToast('PDF הורד בהצלחה');
            }).catch(err => {
                console.error('PDF error:', err);
                container.remove();
                _downloadPdfPrintFallback(htmlContent, filename);
            });
        } else {
            container.remove();
            _downloadPdfPrintFallback(htmlContent, filename);
        }
    });
}

function _downloadPdfPrintFallback(htmlContent, filename) {
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'position:fixed;left:-9999px;top:-9999px;width:800px;height:600px;';
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${filename}</title>
        <style>@page{size:A4;margin:15mm;}body{margin:0;}table{border-collapse:collapse;}td{border:1px solid #dfe6e9;}</style>
    </head><body>${htmlContent}</body></html>`);
    doc.close();
    setTimeout(() => { iframe.contentWindow.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 300);
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
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
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
            <td style="font-weight:600;">${esc(s.name)}</td>
            <td>${esc(companyNames[s.company] || s.company)}</td>
            <td>${esc(s.personalId) || '-'}</td>
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
        idPhoto: (document.getElementById('idPhotoImg').src && document.getElementById('idPhotoImg').src.startsWith('data:')) ? document.getElementById('idPhotoImg').src : null,
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

// ==================== PAKAL (PERSONAL EQUIPMENT) SYSTEM ====================

// --- Equipment Sets Settings ---
function renderEquipmentSetsSettings() {
    const container = document.getElementById('equipmentSetsEditor');
    if (!container) return;
    if (!settings.equipmentSets) settings.equipmentSets = { baseSet: { name: 'סט בסיס', items: [] }, roleSets: [] };
    const es = settings.equipmentSets;

    let html = `<div class="sub-section">
        <h4 style="margin:0 0 10px;">סט ציוד ללוחם</h4>
        <p style="font-size:0.82em;color:var(--text-light);margin-bottom:10px;">רשימת הציוד שכל לוחם מקבל בעת ההצטיידות</p>
        <div class="table-scroll"><table style="width:100%;font-size:0.85em;">
            <thead><tr><th>שם פריט</th><th>כמות</th><th>קטגוריה</th><th>סריאלי</th><th></th></tr></thead>
            <tbody>
                ${es.baseSet.items.map((item, i) => `<tr>
                    <td><input type="text" value="${item.name}" onchange="updateBaseSetItem(${i},'name',this.value)" style="width:100%;"></td>
                    <td><input type="number" min="1" value="${item.quantity}" onchange="updateBaseSetItem(${i},'quantity',parseInt(this.value))" style="width:60px;"></td>
                    <td><select onchange="updateBaseSetItem(${i},'category',this.value)">
                        ${['מגן','נשק','קשר','רפואי','שטח','תחמושת','תצפית','טנ"א','אחר'].map(c => `<option value="${c}" ${item.category===c?'selected':''}>${c}</option>`).join('')}
                    </select></td>
                    <td><input type="checkbox" ${item.requiresSerial?'checked':''} onchange="updateBaseSetItem(${i},'requiresSerial',this.checked)"></td>
                    <td><button class="btn btn-danger btn-sm" onclick="removeBaseSetItem(${i})">&#10005;</button></td>
                </tr>`).join('')}
            </tbody>
        </table></div>
        <button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="addBaseSetItem()">+ הוסף פריט</button>
    </div>`;
    container.innerHTML = html;
}

function addBaseSetItem() {
    if (!settings.equipmentSets) settings.equipmentSets = { baseSet: { name: 'סט בסיס', items: [] }, roleSets: [] };
    settings.equipmentSets.baseSet.items.push({ name: '', quantity: 1, category: 'אחר', requiresSerial: false });
    saveSettings(); renderEquipmentSetsSettings();
}
function removeBaseSetItem(i) {
    settings.equipmentSets.baseSet.items.splice(i, 1);
    saveSettings(); renderEquipmentSetsSettings();
}
function updateBaseSetItem(i, field, val) {
    settings.equipmentSets.baseSet.items[i][field] = val;
    saveSettings();
}
function addRoleSet() {
    const id = 'rs_' + Date.now();
    settings.equipmentSets.roleSets.push({ id, name: 'סט חדש', roles: [], items: [] });
    saveSettings(); renderEquipmentSetsSettings();
}
async function deleteRoleSet(ri) {
    if (!await customConfirm('למחוק את הסט?')) return;
    settings.equipmentSets.roleSets.splice(ri, 1);
    saveSettings(); renderEquipmentSetsSettings();
}
function addRoleSetItem(ri) {
    settings.equipmentSets.roleSets[ri].items.push({ name: '', quantity: 1, category: 'אחר', requiresSerial: false });
    saveSettings(); renderEquipmentSetsSettings();
}
function removeRoleSetItem(ri, ii) {
    settings.equipmentSets.roleSets[ri].items.splice(ii, 1);
    saveSettings(); renderEquipmentSetsSettings();
}
function updateRoleSetItem(ri, ii, field, val) {
    settings.equipmentSets.roleSets[ri].items[ii][field] = val;
    saveSettings();
}
function updateRoleSet(ri, field, val) {
    settings.equipmentSets.roleSets[ri][field] = val;
    saveSettings();
}
function updateRoleSetRoles(ri, val) {
    settings.equipmentSets.roleSets[ri].roles = val.split(',').map(r => r.trim()).filter(r => r);
    saveSettings();
}

function getRoleSetForSoldier(soldier) {
    if (!settings.equipmentSets || !settings.equipmentSets.roleSets) return null;
    return settings.equipmentSets.roleSets.find(rs =>
        rs.roles.some(role => soldier.role && soldier.role.includes(role))
    ) || null;
}

// --- Sub-tab switching ---
function switchEquipmentSubTab(tab) {
    equipmentSubTab = tab;
    document.querySelectorAll('.equip-subtab').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.subtab-btn').forEach(btn => btn.classList.remove('active'));
    const target = document.getElementById('subtab-' + tab);
    if (target) target.style.display = '';
    const btns = document.querySelectorAll('#equipmentSubTabs .subtab-btn');
    const idx = { items: 0, pakal: 1, dashboard: 2 }[tab] || 0;
    if (btns[idx]) btns[idx].classList.add('active');

    if (tab === 'pakal') renderPakalSubTab();
    if (tab === 'dashboard') renderPalsamDashboard();
}

// --- Generate Personal Equipment ---
function openGeneratePakalModal() {
    openModal('generatePakalModal');
    updatePakalGenSoldiers();
    document.getElementById('pakalGenPreview').style.display = 'none';
}

function updatePakalGenSoldiers() {
    const compFilter = document.getElementById('pakalGenCompany').value;
    const select = document.getElementById('pakalGenSoldier');
    let soldiers = state.soldiers;
    if (compFilter !== 'all') soldiers = soldiers.filter(s => s.company === compFilter);
    // Exclude soldiers who already have a pakal
    const existingIds = new Set(state.personalEquipment.map(pe => pe.soldierId));
    soldiers = soldiers.filter(s => !existingIds.has(s.id));
    select.innerHTML = '<option value="">-- בחר חייל --</option>' +
        soldiers.map(s => `<option value="${s.id}">${s.name} (${s.role || 'לוחם'} - ${companyData[s.company]?.name || s.company})</option>`).join('');
    document.getElementById('pakalGenPreview').style.display = 'none';
}

function previewPakalForSoldier() {
    const soldierId = document.getElementById('pakalGenSoldier').value;
    const preview = document.getElementById('pakalGenPreview');
    if (!soldierId) { preview.style.display = 'none'; return; }
    const soldier = state.soldiers.find(s => s.id === soldierId);
    if (!soldier) return;

    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const roleSet = getRoleSetForSoldier(soldier);
    const baseItems = es.baseSet.items || [];
    const roleItems = roleSet ? roleSet.items : [];

    preview.style.display = '';
    preview.innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;">
            <strong>${esc(soldier.name)}</strong> - ${esc(soldier.role) || 'לוחם'}
            <div style="margin-top:8px;">
                <div style="font-weight:600;font-size:0.85em;margin-bottom:4px;">סט בסיס (${baseItems.length} פריטים):</div>
                ${baseItems.length ? `<ul style="font-size:0.83em;margin:0;padding-right:20px;">${baseItems.map(i => `<li>${i.name} x${i.quantity}</li>`).join('')}</ul>` : '<span style="font-size:0.83em;color:var(--text-light);">ריק - הגדר בהגדרות</span>'}
            </div>
            ${roleSet ? `<div style="margin-top:8px;">
                <div style="font-weight:600;font-size:0.85em;margin-bottom:4px;">${roleSet.name} (${roleItems.length} פריטים):</div>
                <ul style="font-size:0.83em;margin:0;padding-right:20px;">${roleItems.map(i => `<li>${i.name} x${i.quantity}</li>`).join('')}</ul>
            </div>` : '<div style="margin-top:8px;font-size:0.83em;color:var(--text-light);">אין סט תפקידי מתאים</div>'}
            <div style="margin-top:8px;font-size:0.85em;font-weight:700;">סה"כ: ${baseItems.length + roleItems.length} פריטים</div>
        </div>`;
}

function confirmGeneratePakal() {
    const soldierId = document.getElementById('pakalGenSoldier').value;
    if (!soldierId) { showToast('בחר חייל', 'error'); return; }
    if (state.personalEquipment.find(pe => pe.soldierId === soldierId)) {
        showToast('לחייל זה כבר יש פק"ל', 'error'); return;
    }
    generatePersonalEquipment(soldierId);
    closeModal('generatePakalModal');
    showToast('פק"ל נוצר בהצלחה');
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
}

function generatePersonalEquipment(soldierId) {
    const soldier = state.soldiers.find(s => s.id === soldierId);
    if (!soldier) return;
    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const roleSet = getRoleSetForSoldier(soldier);

    const items = [];
    let counter = 1;
    (es.baseSet.items || []).forEach(item => {
        items.push({
            itemId: 'pi_' + (counter++),
            name: item.name, quantity: item.quantity, category: item.category,
            requiresSerial: item.requiresSerial, source: 'base',
            status: 'pending', issuedQuantity: 0, linkedEquipmentIds: [],
            issuedDate: null, returnedDate: null, notes: ''
        });
    });
    if (roleSet) {
        roleSet.items.forEach(item => {
            items.push({
                itemId: 'pi_' + (counter++),
                name: item.name, quantity: item.quantity, category: item.category,
                requiresSerial: item.requiresSerial, source: 'role',
                status: 'pending', issuedQuantity: 0, linkedEquipmentIds: [],
                issuedDate: null, returnedDate: null, notes: ''
            });
        });
    }

    const pe = {
        id: 'pe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        soldierId,
        generatedDate: new Date().toISOString(),
        roleSetId: roleSet ? roleSet.id : null,
        items,
        bulkSignature: { signed: false, signatureImg: null, signedDate: null, issuedBy: '', issuerSignatureImg: null },
        history: [{ date: new Date().toISOString(), action: 'created', details: 'פק"ל נוצר' }]
    };
    state.personalEquipment.push(pe);
    saveState();
    return pe;
}

function openBulkGeneratePakalModal() {
    openModal('bulkGeneratePakalModal');
}

function confirmBulkGeneratePakal() {
    const compKey = document.getElementById('bulkPakalCompany').value;
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const existingIds = new Set(state.personalEquipment.map(pe => pe.soldierId));
    let count = 0;
    soldiers.forEach(s => {
        if (!existingIds.has(s.id)) {
            generatePersonalEquipment(s.id);
            count++;
        }
    });
    closeModal('bulkGeneratePakalModal');
    showToast(`נוצרו ${count} פק"לים חדשים`);
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
}

// --- Render Pakal Sub-tab ---
function setPakalFilter(filter, btn) {
    pakalFilter = filter;
    if (btn) {
        btn.closest('.filter-buttons').querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }
    renderPakalSubTab();
}

function renderPakalSubTab() {
    const container = document.getElementById('pakalSubTabContent');
    if (!container) return;

    const search = (document.getElementById('pakalSearch')?.value || '').trim().toLowerCase();
    let pelist = state.personalEquipment.map(pe => {
        const sol = state.soldiers.find(s => s.id === pe.soldierId);
        return { ...pe, soldier: sol };
    }).filter(pe => pe.soldier);

    // Filter
    if (pakalFilter === 'signed') pelist = pelist.filter(pe => pe.bulkSignature.signed);
    else if (pakalFilter === 'unsigned') pelist = pelist.filter(pe => !pe.bulkSignature.signed && pe.items.every(i => i.status === 'pending'));
    else if (pakalFilter === 'partial') pelist = pelist.filter(pe => !pe.bulkSignature.signed && pe.items.some(i => i.status !== 'pending'));

    // Search
    if (search) {
        pelist = pelist.filter(pe =>
            pe.soldier.name.toLowerCase().includes(search) ||
            pe.items.some(i => i.name.toLowerCase().includes(search))
        );
    }

    const stats = getPakalStats();

    container.innerHTML = `
        <div class="action-bar">
            <button class="btn btn-primary" onclick="openGeneratePakalModal()">+ יצירת פק"ל לחייל</button>
            <button class="btn btn-success" onclick="openBulkGeneratePakalModal()">יצירת פק"ל לפלוגה</button>
            <button class="btn" style="background:var(--bg)" onclick="exportPakalCSV()">&#128196; ייצוא CSV</button>
        </div>
        <div class="quick-stats" style="margin-bottom:14px;">
            <div class="quick-stat"><div class="value">${stats.total}</div><div class="label">סה"כ פק"לים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success)"><div class="value" style="color:var(--success)">${stats.signed}</div><div class="label">חתמו</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger)"><div class="value" style="color:var(--danger)">${stats.unsigned}</div><div class="label">לא חתמו</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--warning)"><div class="value" style="color:var(--warning)">${stats.partial}</div><div class="label">חלקי</div></div>
        </div>
        <div class="search-bar">
            <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input type="text" id="pakalSearch" placeholder="חיפוש לפי שם חייל, פריט..." oninput="renderPakalSubTab()" value="${search}">
        </div>
        <div class="filter-buttons" style="margin-bottom:14px;">
            <button class="filter-btn ${pakalFilter==='all'?'active':''}" onclick="setPakalFilter('all',this)">הכל (${stats.total})</button>
            <button class="filter-btn ${pakalFilter==='signed'?'active':''}" onclick="setPakalFilter('signed',this)">חתמו (${stats.signed})</button>
            <button class="filter-btn ${pakalFilter==='unsigned'?'active':''}" onclick="setPakalFilter('unsigned',this)">לא חתמו (${stats.unsigned})</button>
            <button class="filter-btn ${pakalFilter==='partial'?'active':''}" onclick="setPakalFilter('partial',this)">חלקי (${stats.partial})</button>
        </div>
        ${pelist.length === 0 ? '<div class="empty-state"><p>אין פק"לים להצגה</p></div>' :
        pelist.map(pe => renderPakalCard(pe)).join('')}
    `;
}

function renderPakalCard(pe) {
    const sol = pe.soldier;
    const totalItems = pe.items.length;
    const issuedItems = pe.items.filter(i => i.status === 'issued').length;
    const isSigned = pe.bulkSignature.signed;
    const statusClass = isSigned ? 'signed' : (issuedItems > 0 ? 'partial' : 'unsigned');
    const statusText = isSigned ? 'חתם' : (issuedItems > 0 ? `חלקי (${issuedItems}/${totalItems})` : 'טרם חתם');
    const statusBadge = isSigned ? 'status-on-duty' : (issuedItems > 0 ? 'status-available' : 'status-on-leave');
    const compName = companyData[sol.company]?.name || sol.company;

    return `<div class="pakal-card ${statusClass}">
        <div class="pakal-card-header">
            <div>
                <h4>${esc(sol.name)}</h4>
                <div class="pakal-card-meta">${esc(sol.role) || 'לוחם'} | ${esc(compName)} | ${esc(sol.personalId) || ''}</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span class="person-status ${statusBadge}">${statusText}</span>
            </div>
        </div>
        <div style="margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;font-size:0.83em;margin-bottom:3px;">
                <span>התקדמות הנפקה</span><span>${issuedItems}/${totalItems}</span>
            </div>
            <div class="pakal-progress"><div class="pakal-progress-bar" style="width:${totalItems>0?(issuedItems/totalItems*100):0}%;${isSigned?'background:var(--success)':''}"></div></div>
        </div>
        <details>
            <summary style="cursor:pointer;font-size:0.85em;font-weight:600;margin-bottom:6px;">פירוט פריטים (${totalItems})</summary>
            <div class="table-scroll"><table class="pakal-items-table">
                <thead><tr><th>פריט</th><th>כמות</th><th>קטגוריה</th><th>מקור</th><th>סטטוס</th></tr></thead>
                <tbody>
                    ${pe.items.map(item => `<tr>
                        <td style="text-align:right;">${item.name}</td>
                        <td>${item.quantity}</td>
                        <td>${item.category}</td>
                        <td>${item.source === 'base' ? 'בסיס' : item.source === 'role' ? 'תפקיד' : 'ידני'}</td>
                        <td><span class="pakal-status ${item.status}">${item.status === 'pending' ? 'ממתין' : item.status === 'issued' ? 'הונפק' : 'הוחזר'}</span></td>
                    </tr>`).join('')}
                </tbody>
            </table></div>
        </details>
        <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
            ${!isSigned ? `<button class="btn btn-success btn-sm" onclick="openBulkSignModal('${pe.soldierId}')">&#9998; חתימה</button>` : ''}
            <button class="btn btn-sm" style="background:#7B1FA2;color:#fff;" onclick="openAddExtraItemModal('${pe.soldierId}')">+ פריט</button>
            ${issuedItems > 0 ? `<button class="btn btn-warning btn-sm" onclick="openReturnPakalModal('${pe.soldierId}')">&#8634; החזרה</button>` : ''}
            <button class="btn btn-sm" style="background:var(--bg)" onclick="generatePakalPDF('${pe.soldierId}')">PDF</button>
            <button class="btn btn-danger btn-sm" onclick="deletePakal('${pe.soldierId}')">&#10005;</button>
        </div>
    </div>`;
}

async function deletePakal(soldierId) {
    if (!await customConfirm('למחוק את הפק"ל של חייל זה?')) return;
    state.personalEquipment = state.personalEquipment.filter(pe => pe.soldierId !== soldierId);
    saveState();
    renderPakalSubTab();
    showToast('פק"ל נמחק');
}

// --- Bulk Sign ---
function openBulkSignModal(soldierId) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!pe || !sol) return;

    document.getElementById('bulkSignSoldierId').value = soldierId;
    document.getElementById('bulkSignSoldierInfo').innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
            <strong>${esc(sol.name)}</strong> | ${esc(sol.role) || 'לוחם'} | ${companyData[sol.company]?.name || ''} | מ.א: ${esc(sol.personalId) || '-'}
        </div>`;

    document.getElementById('bulkSignItemsList').innerHTML = `
        <div class="table-scroll"><table class="pakal-items-table">
            <thead><tr><th>פריט</th><th>כמות</th><th>קטגוריה</th><th>סריאלי</th></tr></thead>
            <tbody>
                ${pe.items.map(item => `<tr>
                    <td style="text-align:right;">${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.category}</td>
                    <td>${item.requiresSerial ? 'כן' : '-'}</td>
                </tr>`).join('')}
            </tbody>
        </table></div>
        <div style="font-size:0.85em;font-weight:700;margin-top:8px;">סה"כ: ${pe.items.length} פריטים</div>`;

    // Set default signing unit
    document.getElementById('bulkSignUnit').value = settings.equipmentSets?.defaultSigningUnit || 'פלוגת פלס"ם';

    // Try to load saved signature info for current user
    const savedSigKey = currentUser ? currentUser.name : '';
    const savedSignature = settings.equipmentSets?.savedSignatures?.[savedSigKey];

    if (savedSignature) {
        document.getElementById('bulkSignIssuerFirstName').value = savedSignature.firstName || '';
        document.getElementById('bulkSignIssuerLastName').value = savedSignature.lastName || '';
        document.getElementById('bulkSignUnit').value = savedSignature.unit || 'פלוגת פלס"ם';
    } else {
        document.getElementById('bulkSignIssuerFirstName').value = '';
        document.getElementById('bulkSignIssuerLastName').value = '';
    }

    openModal('bulkSignPakalModal');
    setTimeout(() => {
        setupSignatureCanvas('bulkSignCanvas');
        setupSignatureCanvas('issuerSignCanvas');

        // Load saved signature if exists
        if (savedSignature && savedSignature.signatureImg) {
            loadSignatureToCanvas('issuerSignCanvas', savedSignature.signatureImg);
        }
    }, 200);
}

// Helper function to load signature image to canvas
function loadSignatureToCanvas(canvasId, imageDataUrl) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !imageDataUrl) return;

    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = imageDataUrl;
}

// Function to manually load saved signature
function loadSavedSignature() {
    const savedSigKey = currentUser ? currentUser.name : '';
    const savedSignature = settings.equipmentSets?.savedSignatures?.[savedSigKey];

    if (savedSignature) {
        if (savedSignature.signatureImg) {
            loadSignatureToCanvas('issuerSignCanvas', savedSignature.signatureImg);
            showToast('חתימה נטענה מהזיכרון');
        } else {
            showToast('לא נמצאת חתימה שמורה', 'info');
        }
    } else {
        showToast('לא נמצאת חתימה שמורה עבור המשתמש הנוכחי', 'info');
    }
}

function confirmBulkSign() {
    const soldierId = document.getElementById('bulkSignSoldierId').value;
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    if (!pe) { showToast('פק"ל לא נמצא', 'error'); return; }

    if (isCanvasEmpty('bulkSignCanvas')) { showToast('חייל חייב לחתום', 'error'); return; }
    if (isCanvasEmpty('issuerSignCanvas')) { showToast('מנפיק חייב לחתום', 'error'); return; }

    const signingUnit = document.getElementById('bulkSignUnit').value;
    const issuerFirstName = document.getElementById('bulkSignIssuerFirstName').value.trim();
    const issuerLastName = document.getElementById('bulkSignIssuerLastName').value.trim();

    if (!issuerFirstName || !issuerLastName) {
        showToast('נא למלא שם פרטי ושם משפחה של המחתים', 'error');
        return;
    }

    const issuerFullName = `${issuerFirstName} ${issuerLastName}`;

    // Save signature info for future use
    if (!settings.equipmentSets.savedSignatures) {
        settings.equipmentSets.savedSignatures = {};
    }

    const savedSigKey = currentUser ? currentUser.name : issuerFullName;
    settings.equipmentSets.savedSignatures[savedSigKey] = {
        firstName: issuerFirstName,
        lastName: issuerLastName,
        unit: signingUnit,
        signatureImg: getCanvasDataURL('issuerSignCanvas'),
        lastUsed: new Date().toISOString()
    };

    saveSettings();

    const now = new Date();
    pe.bulkSignature = {
        signed: true,
        signatureImg: getCanvasDataURL('bulkSignCanvas'),
        signedDate: now.toISOString(),
        issuedBy: issuerFullName,
        issuerFirstName: issuerFirstName,
        issuerLastName: issuerLastName,
        signingUnit: signingUnit,
        issuerSignatureImg: getCanvasDataURL('issuerSignCanvas')
    };

    pe.items.forEach(item => {
        if (item.status === 'pending') {
            item.status = 'issued';
            item.issuedQuantity = item.quantity;
            item.issuedDate = now.toISOString();
        }
    });

    pe.history.push({ date: now.toISOString(), action: 'bulk_signed', details: `חתימה כוללנית ע"י ${issuerFullName}` });

    saveState();
    closeModal('bulkSignPakalModal');
    generatePakalPDF(soldierId);
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
    showToast('חתימה נשמרה בהצלחה');
}

// --- Extra Items ---
function openAddExtraItemModal(soldierId) {
    document.getElementById('extraItemSoldierId').value = soldierId;
    document.getElementById('extraItemName').value = '';
    document.getElementById('extraItemQty').value = '1';
    document.getElementById('extraItemNotes').value = '';
    document.getElementById('extraItemSerial').checked = false;
    openModal('addExtraItemModal');
}

function confirmAddExtraItem() {
    const soldierId = document.getElementById('extraItemSoldierId').value;
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    if (!pe) { showToast('פק"ל לא נמצא', 'error'); return; }

    const name = document.getElementById('extraItemName').value.trim();
    if (!name) { showToast('נא למלא שם פריט', 'error'); return; }

    const item = {
        itemId: 'pi_extra_' + Date.now(),
        name,
        quantity: parseInt(document.getElementById('extraItemQty').value) || 1,
        category: document.getElementById('extraItemCategory').value,
        requiresSerial: document.getElementById('extraItemSerial').checked,
        source: 'manual',
        status: 'pending',
        issuedQuantity: 0,
        linkedEquipmentIds: [],
        issuedDate: null,
        returnedDate: null,
        notes: document.getElementById('extraItemNotes').value.trim()
    };
    pe.items.push(item);
    pe.history.push({ date: new Date().toISOString(), action: 'item_added', details: `פריט "${name}" נוסף ידנית` });
    saveState();
    closeModal('addExtraItemModal');
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
    showToast(`פריט "${name}" נוסף לפק"ל`);
}

// --- Return Pakal ---
function openReturnPakalModal(soldierId) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!pe || !sol) return;

    document.getElementById('returnPakalSoldierId').value = soldierId;
    document.getElementById('returnPakalSoldierInfo').innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
            <strong>${esc(sol.name)}</strong> | ${esc(sol.role) || 'לוחם'} | ${companyData[sol.company]?.name || ''}
        </div>`;

    const issuedItems = pe.items.filter(i => i.status === 'issued');
    document.getElementById('returnPakalItemsList').innerHTML = issuedItems.length === 0
        ? '<p style="color:var(--text-light);">אין פריטים מונפקים להחזרה</p>'
        : `<div class="table-scroll"><table class="pakal-items-table">
            <thead><tr><th>החזר</th><th>פריט</th><th>כמות</th><th>קטגוריה</th></tr></thead>
            <tbody>
                ${issuedItems.map(item => `<tr>
                    <td><input type="checkbox" class="return-item-cb" data-item-id="${item.itemId}" checked></td>
                    <td style="text-align:right;">${item.name}</td>
                    <td>${item.quantity}</td>
                    <td>${item.category}</td>
                </tr>`).join('')}
            </tbody>
        </table></div>`;

    document.getElementById('returnPakalNotes').value = '';
    openModal('returnPakalModal');
    setTimeout(() => setupSignatureCanvas('returnPakalCanvas'), 200);
}

function confirmReturnPakal() {
    const soldierId = document.getElementById('returnPakalSoldierId').value;
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    if (!pe) { showToast('פק"ל לא נמצא', 'error'); return; }

    if (isCanvasEmpty('returnPakalCanvas')) { showToast('נדרשת חתימת מחזיר', 'error'); return; }

    const checkedIds = [];
    document.querySelectorAll('.return-item-cb:checked').forEach(cb => checkedIds.push(cb.dataset.itemId));

    if (checkedIds.length === 0) { showToast('בחר פריטים להחזרה', 'error'); return; }

    const now = new Date();
    const notes = document.getElementById('returnPakalNotes').value.trim();
    const returnedNames = [];

    checkedIds.forEach(itemId => {
        const item = pe.items.find(i => i.itemId === itemId);
        if (item) {
            item.status = 'returned';
            item.returnedDate = now.toISOString();
            returnedNames.push(item.name);
        }
    });

    const allReturned = pe.items.every(i => i.status === 'returned');
    if (allReturned) {
        pe.bulkSignature.signed = false;
    }

    pe.history.push({ date: now.toISOString(), action: 'items_returned', details: `הוחזרו: ${returnedNames.join(', ')}${notes ? ' | ' + notes : ''}` });
    saveState();
    closeModal('returnPakalModal');
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
    showToast(`${checkedIds.length} פריטים הוחזרו`);
}

// --- Palsam Dashboard ---
function getPakalStats(companyFilter) {
    let pelist = state.personalEquipment;
    if (companyFilter && companyFilter !== 'all') {
        pelist = pelist.filter(pe => {
            const sol = state.soldiers.find(s => s.id === pe.soldierId);
            return sol && sol.company === companyFilter;
        });
    }
    const total = pelist.length;
    const signed = pelist.filter(pe => pe.bulkSignature.signed).length;
    const partial = pelist.filter(pe => !pe.bulkSignature.signed && pe.items.some(i => i.status !== 'pending')).length;
    const unsigned = total - signed - partial;
    return { total, signed, unsigned, partial };
}

function renderPalsamDashboard() {
    const container = document.getElementById('palsamDashboardContent');
    if (!container) return;

    const companyNames = { a: 'פלוגה א', b: 'פלוגה ב', c: 'פלוגה ג', d: 'פלוגה ד', hq: 'חפ"ק', palsam: 'פלס"ם' };
    const allStats = getPakalStats();

    // Per-company stats
    const companyStats = ALL_COMPANIES.map(k => {
        const stats = getPakalStats(k);
        return { key: k, name: companyNames[k], ...stats };
    }).filter(c => c.total > 0);

    // Unsigned soldiers
    const unsignedSoldiers = state.personalEquipment
        .filter(pe => !pe.bulkSignature.signed)
        .map(pe => {
            const sol = state.soldiers.find(s => s.id === pe.soldierId);
            return sol ? { ...sol, pe } : null;
        })
        .filter(Boolean);

    const pct = allStats.total > 0 ? Math.round(allStats.signed / allStats.total * 100) : 0;

    container.innerHTML = `
        <div class="info-box" style="margin-bottom:16px;">
            <span class="info-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/><path d="M9 14l2 2 4-4"/></svg></span>
            <div><strong>דשבורד פלס"ם:</strong> מעקב החתמות ציוד לכל חיילי הגדוד</div>
        </div>

        <!-- Overall Stats -->
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px;">
            <div class="dashboard-stat-card" style="border-top:3px solid var(--primary);">
                <div class="big-num" style="color:var(--primary);">${allStats.total}</div>
                <div class="label">סה"כ פק"לים</div>
            </div>
            <div class="dashboard-stat-card" style="border-top:3px solid var(--success);">
                <div class="big-num" style="color:var(--success);">${allStats.signed}</div>
                <div class="label">חתמו</div>
            </div>
            <div class="dashboard-stat-card" style="border-top:3px solid var(--danger);">
                <div class="big-num" style="color:var(--danger);">${allStats.unsigned}</div>
                <div class="label">טרם חתמו</div>
            </div>
            <div class="dashboard-stat-card" style="border-top:3px solid var(--warning);">
                <div class="big-num" style="color:var(--warning);">${pct}%</div>
                <div class="label">אחוז השלמה</div>
            </div>
        </div>

        <!-- Overall progress -->
        <div style="margin-bottom:20px;">
            <div style="display:flex;justify-content:space-between;font-size:0.85em;margin-bottom:4px;">
                <span>התקדמות כוללת</span><span>${allStats.signed}/${allStats.total}</span>
            </div>
            <div class="pakal-progress" style="height:12px;">
                <div class="pakal-progress-bar" style="width:${pct}%;"></div>
            </div>
        </div>

        <!-- Per-company breakdown -->
        ${companyStats.length > 0 ? `
        <div class="sub-section" style="margin-bottom:20px;">
            <div class="section-title"><div class="icon" style="background:#E3F2FD;color:var(--primary);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2"/><circle cx="9" cy="7" r="4"/></svg></div> מצב לפי פלוגה</div>
            <div class="table-scroll"><table style="width:100%;font-size:0.85em;">
                <thead><tr><th>פלוגה</th><th>סה"כ</th><th>חתמו</th><th>לא חתמו</th><th>התקדמות</th></tr></thead>
                <tbody>
                    ${companyStats.map(c => {
                        const cpct = c.total > 0 ? Math.round(c.signed / c.total * 100) : 0;
                        return `<tr>
                            <td style="text-align:right;font-weight:600;">${c.name}</td>
                            <td style="text-align:center;">${c.total}</td>
                            <td style="text-align:center;color:var(--success);">${c.signed}</td>
                            <td style="text-align:center;color:var(--danger);">${c.unsigned + c.partial}</td>
                            <td><div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:6px;background:var(--border);border-radius:3px;">
                                    <div style="width:${cpct}%;height:100%;background:${cpct>=100?'var(--success)':cpct>=50?'var(--warning)':'var(--danger)'};border-radius:3px;"></div>
                                </div>
                                <span style="font-size:0.82em;min-width:35px;">${cpct}%</span>
                            </div></td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table></div>
        </div>` : ''}

        <!-- Unsigned soldiers list -->
        ${unsignedSoldiers.length > 0 ? `
        <div class="sub-section">
            <div class="section-title"><div class="icon" style="background:#FFEBEE;color:var(--danger);"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg></div> חיילים שטרם חתמו (${unsignedSoldiers.length})</div>
            <div class="table-scroll"><table style="width:100%;font-size:0.85em;">
                <thead><tr><th>שם</th><th>תפקיד</th><th>פלוגה</th><th>פריטים</th><th>פעולות</th></tr></thead>
                <tbody>
                    ${unsignedSoldiers.slice(0, 50).map(s => `<tr>
                        <td style="text-align:right;font-weight:600;">${esc(s.name)}</td>
                        <td>${esc(s.role) || 'לוחם'}</td>
                        <td>${companyNames[s.company] || s.company}</td>
                        <td style="text-align:center;">${s.pe.items.length}</td>
                        <td style="display:flex;gap:4px;">
                            <button class="btn btn-success btn-sm" onclick="openBulkSignModal('${s.id}')">חתימה</button>
                            ${s.phone ? `<a class="btn btn-sm" style="background:#25D366;color:#fff;" href="https://wa.me/972${s.phone.replace(/^0/,'').replace(/-/g,'')}?text=${encodeURIComponent('שלום ' + s.name + ', יש לך פק"ל ציוד שממתין לחתימתך במערכת הגדודית. נא להגיע לפלס"ם לחתום.')}" target="_blank">WhatsApp</a>` : ''}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table></div>
        </div>` : '<div class="empty-state"><p>כל החיילים חתמו!</p></div>'}
    `;
}

// --- PDF Generation ---
function generatePakalPDF(soldierId) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!pe || !sol) { showToast('לא נמצא', 'error'); return; }

    // Ensure pe.items exists and is an array
    if (!pe.items || !Array.isArray(pe.items)) {
        pe.items = [];
    }

    // Ensure pe.bulkSignature exists
    if (!pe.bulkSignature) {
        pe.bulkSignature = { signed: false };
    }

    const compName = companyData[sol.company]?.name || sol.company;
    const dateStr = pe.bulkSignature.signedDate
        ? new Date(pe.bulkSignature.signedDate).toLocaleDateString('he-IL')
        : new Date().toLocaleDateString('he-IL');

    const html = `<!DOCTYPE html><html lang="he" dir="rtl"><head><meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; direction: rtl; padding: 20px; }
        h1 { text-align: center; color: #1a3a5c; border-bottom: 3px solid #1a3a5c; padding-bottom: 10px; }
        .info { margin: 15px 0; }
        .info td { padding: 4px 10px; font-size: 14px; }
        table.items { width: 100%; border-collapse: collapse; margin: 15px 0; }
        table.items th { background: #1a3a5c; color: white; padding: 8px; font-size: 13px; }
        table.items td { padding: 6px 8px; border: 1px solid #ddd; font-size: 13px; text-align: center; }
        table.items tr:nth-child(even) { background: #f9f9f9; }
        .sig-section { margin-top: 30px; display: flex; justify-content: space-between; }
        .sig-box { width: 45%; text-align: center; }
        .sig-box img { max-width: 200px; max-height: 80px; border-bottom: 1px solid #333; }
        .sig-label { font-size: 12px; margin-top: 4px; color: #666; }
        .footer { text-align: center; font-size: 11px; color: #999; margin-top: 40px; border-top: 1px solid #eee; padding-top: 10px; }
    </style></head><body>
    <h1>פק"ל אישי - טופס חתימה על ציוד</h1>
    <table class="info">
        <tr><td><strong>שם:</strong></td><td>${sol.name}</td><td><strong>מ.א:</strong></td><td>${sol.personalId || '-'}</td></tr>
        <tr><td><strong>תפקיד:</strong></td><td>${sol.role || 'לוחם'}</td><td><strong>פלוגה:</strong></td><td>${compName}</td></tr>
        <tr><td><strong>טלפון:</strong></td><td>${sol.phone || '-'}</td><td><strong>תאריך:</strong></td><td>${dateStr}</td></tr>
    </table>
    <p style="font-size:13px;">אני מאשר בחתימתי שקיבלתי את הציוד המפורט להלן במצב תקין, ואני מתחייב להחזירו במצב תקין בסיום השירות.</p>
    <table class="items">
        <thead><tr><th>#</th><th>פריט</th><th>כמות</th><th>קטגוריה</th><th>מקור</th><th>סטטוס</th></tr></thead>
        <tbody>
            ${pe.items.map((item, i) => `<tr>
                <td>${i + 1}</td>
                <td style="text-align:right;">${item.name}</td>
                <td>${item.quantity}</td>
                <td>${item.category}</td>
                <td>${item.source === 'base' ? 'בסיס' : item.source === 'role' ? 'תפקיד' : 'ידני'}</td>
                <td>${item.status === 'issued' ? 'הונפק' : item.status === 'returned' ? 'הוחזר' : 'ממתין'}</td>
            </tr>`).join('')}
        </tbody>
    </table>
    ${pe.bulkSignature.signed ? `
    <div class="sig-section">
        <div class="sig-box">
            ${pe.bulkSignature.signatureImg ? `<img src="${pe.bulkSignature.signatureImg}">` : ''}
            <div class="sig-label">חתימת חייל מקבל</div>
            <div style="font-size:12px;">${sol.name}</div>
        </div>
        <div class="sig-box">
            ${pe.bulkSignature.issuerSignatureImg ? `<img src="${pe.bulkSignature.issuerSignatureImg}">` : ''}
            <div class="sig-label">חתימת מנפיק</div>
            <div style="font-size:12px;">${pe.bulkSignature.issuedBy || ''}</div>
            ${pe.bulkSignature.signingUnit ? `<div style="font-size:10px;color:#666;">${pe.bulkSignature.signingUnit}</div>` : ''}
        </div>
    </div>` : '<p style="text-align:center;color:#e74c3c;font-weight:bold;">טרם נחתם</p>'}
    <div class="footer">מערכת ניהול גדודי - גדוד יהודה 1875 | הופק אוטומטית ${new Date().toLocaleString('he-IL')}</div>
    </body></html>`;

    downloadPDF(html, `פקל_${sol.name}_${dateStr.replace(/\//g, '-')}`);
}

// --- CSV Export ---
function exportPakalCSV() {
    let csv = '\uFEFF' + 'שם חייל,תפקיד,פלוגה,מ.א,סטטוס חתימה,תאריך חתימה,פריטים,מנפיק\n';
    state.personalEquipment.forEach(pe => {
        const sol = state.soldiers.find(s => s.id === pe.soldierId);
        if (!sol) return;
        const compName = companyData[sol.company]?.name || sol.company;
        const status = pe.bulkSignature.signed ? 'חתם' : 'לא חתם';
        const signDate = pe.bulkSignature.signedDate ? new Date(pe.bulkSignature.signedDate).toLocaleDateString('he-IL') : '-';
        const itemNames = pe.items.map(i => i.name).join(' | ');
        csv += `"${sol.name}","${sol.role || ''}","${compName}","${sol.personalId || ''}","${status}","${signDate}","${itemNames}","${pe.bulkSignature.issuedBy || ''}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `פקל_גדודי_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ==================== GLOBAL SEARCH ====================
let searchFocusIndex = -1;

function onGlobalSearch(query) {
    const results = document.getElementById('globalSearchResults');
    query = query.trim();
    if (query.length < 2) { results.classList.remove('open'); return; }

    const matches = state.soldiers.filter(s =>
        canView(s.company) &&
        (s.name.includes(query) || (s.personalId && s.personalId.includes(query)))
    ).slice(0, 8);

    if (matches.length === 0) {
        results.innerHTML = '<div class="search-no-results">לא נמצאו תוצאות</div>';
    } else {
        results.innerHTML = matches.map((s, i) => {
            const comp = companyData[s.company];
            return `<div class="search-result-item" data-company="${s.company}" data-id="${s.id}" onclick="selectSearchResult('${s.company}','${s.id}')">
                <span class="search-result-name">${esc(s.name)}</span>
                <span class="search-result-meta">${esc(s.rank) || ''} · ${comp ? comp.name : ''}</span>
            </div>`;
        }).join('');
    }
    searchFocusIndex = -1;
    results.classList.add('open');
}

function onSearchKeydown(e) {
    const results = document.getElementById('globalSearchResults');
    const items = results.querySelectorAll('.search-result-item');
    if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchFocusIndex = Math.min(searchFocusIndex + 1, items.length - 1);
        items.forEach((el, i) => el.classList.toggle('focused', i === searchFocusIndex));
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchFocusIndex = Math.max(searchFocusIndex - 1, 0);
        items.forEach((el, i) => el.classList.toggle('focused', i === searchFocusIndex));
    } else if (e.key === 'Enter' && searchFocusIndex >= 0 && items[searchFocusIndex]) {
        items[searchFocusIndex].click();
    } else if (e.key === 'Escape') {
        closeGlobalSearch();
    }
}

function selectSearchResult(company, soldierId) {
    closeGlobalSearch();
    switchTab(company);
    setTimeout(() => {
        const el = document.querySelector(`[data-soldier-id="${soldierId}"]`);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('highlight-row'); setTimeout(() => el.classList.remove('highlight-row'), 1800); }
    }, 150);
}

function closeGlobalSearch() {
    document.getElementById('globalSearchResults').classList.remove('open');
    document.getElementById('globalSearchInput').value = '';
}

document.addEventListener('click', e => {
    const wrap = document.getElementById('topbarSearchWrap');
    if (wrap && !wrap.contains(e.target)) document.getElementById('globalSearchResults').classList.remove('open');
});

// Close modals
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) { o.classList.remove('active'); document.body.classList.remove('modal-open'); } });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); document.body.classList.remove('modal-open'); }
});

init();
