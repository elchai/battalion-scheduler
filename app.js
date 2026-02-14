// ==================== SETTINGS ====================
const DEFAULT_SETTINGS = {
    adminName: 'אלחי פיין',
    password: '1875',
    shiftPresets: {
        morning:   { name: 'בוקר',    start: '06:00', end: '14:00' },
        afternoon: { name: 'צהריים',  start: '14:00', end: '22:00' },
        night:     { name: 'לילה',    start: '22:00', end: '06:00' }
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
}

function isAdmin() {
    return currentUser && currentUser.name === settings.adminName;
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
    document.querySelectorAll('.sidebar-item.tab-rotation').forEach(el => el.style.display = isGdudi ? '' : 'none');
    document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = isAdmin() ? '' : 'none');

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
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    } else {
        sidebar.classList.toggle('collapsed');
        document.getElementById('topbar').classList.toggle('expanded');
        document.querySelectorAll('.tab-content').forEach(el => el.classList.toggle('expanded'));
        const footer = document.querySelector('.app-footer');
        if (footer) footer.style.marginRight = sidebar.classList.contains('collapsed') ? '0' : '260px';
    }
}

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
        tasks: [],
        totals: { soldiers: 0, commanders: 0, officers: 0 }
    }
};

// State
let state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [] };

// Calendar state
let calendarWeekOffset = 0;

// Search & filter state per company
let searchState = {};
let equipmentFilter = 'all';

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
}

function saveState() {
    localStorage.setItem('battalionState_v2', JSON.stringify(state));
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

function init() {
    loadSettings();
    loadState();
    loadTasksFromStorage();
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
}

function renderAll() {
    renderOverview();
    renderDashboard();
    ALL_COMPANIES.forEach(renderCompanyTab);
    renderRotationTab();
    updateGlobalStats();
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
                <button class="btn btn-edit btn-icon btn-sm" onclick="openEditSoldier('${s.id}')" title="עריכה">&#9998;</button>
                <button class="btn btn-danger btn-icon btn-sm" onclick="deleteSoldier('${s.id}')" title="מחק">&#10005;</button>
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

    container.innerHTML = `
        <div class="action-bar">
            <button class="btn btn-primary" onclick="openAddSoldier('${compKey}')">+ הוספת חייל</button>
            <button class="btn btn-success" onclick="openAddShift('${compKey}')">+ שיבוץ למשמרת</button>
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')">+ יציאה הביתה</button>
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
                                <div style="margin-top:6px;text-align:left;display:flex;gap:4px;">
                                    <button class="btn btn-edit btn-sm" onclick="openEditShift('${sh.id}')">&#9998; עריכה</button>
                                    <button class="btn btn-danger btn-sm" onclick="deleteShift('${sh.id}')">&#10005; מחק</button>
                                </div>
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
                                        <button class="btn btn-edit btn-sm" onclick="openEditLeave('${l.id}')">&#9998;</button>
                                        <button class="btn btn-danger btn-sm" onclick="deleteLeave('${l.id}')">&#10005;</button>
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
    if (tab === 'rotation') renderRotationTab();
    if (tab === 'equipment') renderEquipmentTab();
    if (tab === 'settings') renderSettingsTab();

    // Close sidebar on mobile after tab switch
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
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
    if (!confirm('למחוק חייל זה?')) return;
    const sol = state.soldiers.find(s => s.id === id);
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
    if (!confirm('למחוק משמרת?')) return;
    const sh = state.shifts.find(s => s.id === id);
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
    if (!confirm('למחוק יציאה?')) return;
    const l = state.leaves.find(x => x.id === id);
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

function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }

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
        ${['morning','afternoon','night'].map(key => {
            const p = settings.shiftPresets[key];
            const labels = { morning: 'בוקר', afternoon: 'צהריים', night: 'לילה' };
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
            <input type="text" value="${settings.password}" onchange="settings.password=this.value.trim();saveSettings();showToast('סיסמה עודכנה');">
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
    state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [] };
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
    document.getElementById('equipCompany').value = currentUser ? currentUser.unit : 'a';
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
    // Default to user's company, or show all if gdudi
    const userUnit = currentUser ? currentUser.unit : 'a';
    document.getElementById('signCompany').value = (userUnit === 'gdudi') ? 'all' : userUnit;
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

// Close modals
document.querySelectorAll('.modal-overlay').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('active'); });
});
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
});

init();
