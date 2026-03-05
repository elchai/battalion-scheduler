// ==================== SETTINGS ====================
const DEFAULT_SETTINGS = {
    adminName: CONFIG.adminName,
    password: CONFIG.password,
    shiftPresets: {
        morning:   { name: 'בוקר',    start: '06:00', end: '14:00' },
        afternoon: { name: 'צהריים',  start: '14:00', end: '22:00' },
        night:     { name: 'לילה',    start: '22:00', end: '06:00' },
        fullday:   { name: 'יום שלם', start: '00:00', end: '23:59' }
    },
    rotationDaysIn: 10,
    rotationDaysOut: 4,
    operationStartDate: '',
    operationStartTime: '14:00',
    operationEndDate: '',
    operationEndTime: '14:00',
    closedDays: [],
    sheetId: CONFIG.sheetId,
    equipmentSets: {
        baseSet: {
            name: 'סט ציוד ללוחם',
            items: [
                // ציוד עם מספר צ'
                { name: 'נשק', quantity: 1, category: 'נשק', requiresSerial: true, serialNumber: '991247' },
                { name: 'כוונת טריג\'יקון', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '994082' },
                { name: 'כוונת לילה אקילה', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '992674' },
                { name: 'ליונט', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '995831' },
                { name: 'אול"ר', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '990456' },
                // ציוד ללא מספר צ'
                { name: 'חולצת ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'מכנסי ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'נעליים צבאיות', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'אפוד קרב', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'קסדה', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'כיסוי קסדה', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'מחסניות M16', quantity: 5, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'תחבושת אישית', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'חוסם עורקים CAT', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'מצנפת לקסדה', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'ברכיות', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
                { name: 'חגורה צבאית', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false }
            ]
        },
        roleSets: [{
            id: 'rs_commander',
            name: 'ערכת מפקד',
            roles: ['מ"פ', 'סמ"פ', 'סרס"פ', 'רס"פ', 'מ"כ', 'מ"מ', 'סמל', 'סמב"צ', 'סמ"ח'],
            items: [
                { name: 'כוונת השלכה מפרולייט', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '993518' },
                { name: 'משקפת שדה', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '998142' },
                { name: 'מצפן', quantity: 1, category: 'לוגיסטיקה', requiresSerial: true, serialNumber: '996705' },
                { name: 'מכשיר קשר 624', quantity: 1, category: 'קשר', requiresSerial: true, serialNumber: '997319' },
                { name: 'אמר"ל עכבר', quantity: 1, category: 'קשר', requiresSerial: true, serialNumber: '993960' },
                { name: 'מע"ד למכשיר קשר', quantity: 1, category: 'קשר', requiresSerial: false },
                { name: 'ערכת מדונה למכשיר קשר', quantity: 1, category: 'קשר', requiresSerial: false },
                { name: 'סוללה ל-624', quantity: 1, category: 'קשר', requiresSerial: false },
                { name: 'סוללה לעכבר', quantity: 1, category: 'קשר', requiresSerial: false }
            ]
        }],
        defaultSigningUnit: CONFIG.defaultSigningUnit,
        savedSignatures: {} // לחתימות קבועות של מחתימים
    }
};

let settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));

function loadSettings() {
    const saved = localStorage.getItem(CONFIG.storagePrefix + 'Settings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
            settings = { ...defaults, ...parsed };
            if (parsed.shiftPresets) settings.shiftPresets = { ...defaults.shiftPresets, ...parsed.shiftPresets };
            // equipmentSets migration moved to migrateEquipmentSets() - runs AFTER Firebase sync
        } catch (e) {
            console.warn('loadSettings: corrupt localStorage, using defaults', e);
            settings = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
        }
    }
}

// Must run AFTER Firebase sync completes to prevent Firestore from overwriting migrated data
function migrateEquipmentSets() {
    const defaults = JSON.parse(JSON.stringify(DEFAULT_SETTINGS));
    if (!settings.equipmentSets) settings.equipmentSets = {};
    settings.equipmentSets.baseSet = settings.equipmentSets.baseSet || defaults.equipmentSets.baseSet;
    if (!settings.equipmentSets.baseSet.items) settings.equipmentSets.baseSet.items = defaults.equipmentSets.baseSet.items;

    // Migration v22: move 624, מדונה, מע"ד, אמר"ל עכבר, סוללות from baseSet to commanderSet
    if (!settings.equipmentSets._baseSetVer || settings.equipmentSets._baseSetVer < 22) {
        settings.equipmentSets.baseSet = JSON.parse(JSON.stringify(defaults.equipmentSets.baseSet));
        settings.equipmentSets.roleSets = JSON.parse(JSON.stringify(defaults.equipmentSets.roleSets));
        settings.equipmentSets._baseSetVer = 22;
        settings.equipmentSets._roleSetVer = 22;
    }
    // Always clean up: remove empty/broken roleSets
    if (settings.equipmentSets.roleSets) {
        settings.equipmentSets.roleSets = settings.equipmentSets.roleSets.filter(rs => rs.id && rs.name && rs.name !== 'סט חדש');
        if (!settings.equipmentSets.roleSets.length) {
            settings.equipmentSets.roleSets = JSON.parse(JSON.stringify(defaults.equipmentSets.roleSets));
        }
    } else {
        settings.equipmentSets.roleSets = JSON.parse(JSON.stringify(defaults.equipmentSets.roleSets));
    }
    settings.equipmentSets.savedSignatures = settings.equipmentSets.savedSignatures || {};

    // Fix item names truncated by unescaped quotes (אול → אול"ר)
    if (settings.equipmentSets.baseSet && settings.equipmentSets.baseSet.items) {
        settings.equipmentSets.baseSet.items.forEach(item => {
            if (item.name === 'אול') item.name = 'אול"ר';
        });
    }

    // Save locally + FORCE push to Firestore (bypass debounce)
    localStorage.setItem(CONFIG.storagePrefix + 'Settings', JSON.stringify(settings));
    if (typeof db !== 'undefined' && db && firestoreReady) {
        db.collection(DB_COLLECTION).doc('settings').set(JSON.parse(JSON.stringify(settings)))
            .catch(err => console.warn('Migration Firestore save error:', err));
    }
}

function saveSettings() {
    localStorage.setItem(CONFIG.storagePrefix + 'Settings', JSON.stringify(settings));
    if (typeof firebaseSaveSettings === 'function') firebaseSaveSettings();
}

// ==================== PERMISSION LEVELS ====================
const PERM = {
    SOLDIER: 1,      // חייל רגיל
    MASHAK: 2,       // מ"כ ומעלה - squad commander
    SAMAL: 3,        // סמל ומעלה - sergeant
    OFFICER: 4,      // קצין/מפקד מחלקה
    COMPANY_CMD: 5,  // מ"פ/סמ"פ - company commander
    PALSAM: 6,       // פלסם (6a=soldier, 6b=officer)
    FULL_ACCESS: 7   // לשכה + ניסים סוויסה
};

const ROLE_LEVEL_MAP = [
    { level: PERM.COMPANY_CMD, roles: ['מ"פ', 'סמ"פ', 'סרס"פ', 'רס"פ'] },
    { level: PERM.OFFICER,     roles: ['קצין', 'סג"מ', 'סג"ם', 'רס"ן', 'סא"ל', 'אל"מ'] },
    { level: PERM.SAMAL,       roles: ['סמל', 'סמ"ח', 'רס"מ', 'רס"ר'] },
    { level: PERM.MASHAK,      roles: ['מ"כ', 'מ"מ', 'מפקד'] },
];

const FULL_ACCESS_NAMES = ['ניסים סוויסה'];

function getUserPermissionLevel() {
    if (!currentUser) return 0;
    if (isAdmin()) return PERM.FULL_ACCESS;
    if (FULL_ACCESS_NAMES.some(n => currentUser.name.includes(n))) return PERM.FULL_ACCESS;
    if (currentUser.unit === 'gdudi' || currentUser.unit === 'hq') return PERM.FULL_ACCESS;
    if (currentUser.unit === 'palsam') return PERM.PALSAM;
    const role = currentUser.role || '';
    if (!role) return PERM.SOLDIER;
    for (const mapping of ROLE_LEVEL_MAP) {
        if (mapping.roles.some(r => role.includes(r))) return mapping.level;
    }
    return PERM.SOLDIER;
}

function isPalsamOfficer() {
    if (currentUser?.unit !== 'palsam') return false;
    const role = currentUser.role || '';
    return ROLE_LEVEL_MAP[0].roles.concat(ROLE_LEVEL_MAP[1].roles)
        .some(r => role.includes(r));
}

function isAdmin() {
    return currentUser && currentUser.name === settings.adminName;
}

function isGdudiAccess() {
    return getUserPermissionLevel() >= PERM.FULL_ACCESS;
}

function canView(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.COMPANY_CMD) return true;
    if (level === PERM.PALSAM) return true;
    return currentUser.unit === compKey;
}

function canEdit(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level === PERM.PALSAM) return false;
    if (level >= PERM.OFFICER) return currentUser.unit === compKey;
    return false;
}

function canEditShifts(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (isPalsamOfficer() && compKey === 'palsam') return true;
    if (level >= PERM.MASHAK) return currentUser.unit === compKey;
    return false;
}

function canEditConstraints(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level >= PERM.MASHAK) return currentUser.unit === compKey;
    return false;
}

function canEditSoldierDetails(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (isPalsamOfficer() && compKey === 'palsam') return true;
    if (level >= PERM.OFFICER) return currentUser.unit === compKey;
    return false;
}

function canEditTasks(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (isPalsamOfficer() && compKey === 'palsam') return true;
    if (level >= PERM.OFFICER) return currentUser.unit === compKey;
    return false;
}

// --- Role detection & equipment signing permissions ---
const SIGNING_ROLES = CONFIG.signingRoles;
const WAREHOUSES = CONFIG.warehouses;
const EQUIPMENT_CATEGORIES = ['נשק', 'אופטיקה', 'קשר', 'לוגיסטיקה', 'אחר'];
const CATEGORY_GROUPS = {
    'נשק': ['נשק'],
    'אופטיקה': ['אופטיקה', 'תצפית'],
    'קשר': ['קשר'],
    'לוגיסטיקה': ['לוגיסטיקה', 'מגן', 'רפואי', 'שטח', 'תחמושת', 'טנ"א', 'אחר'],
    'אחר': ['אחר']
};

function detectUserRole() {
    if (!currentUser) return null;
    const match = state.soldiers.find(s =>
        s.name === currentUser.name &&
        (currentUser.unit === 'palsam' || getUserPermissionLevel() >= PERM.COMPANY_CMD || s.company === currentUser.unit)
    );
    if (match) {
        currentUser.role = match.role || '';
        currentUser.soldierId = match.id;
    } else {
        currentUser.role = '';
        currentUser.soldierId = null;
    }
    return currentUser.role;
}

function canSignEquipment(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level === PERM.PALSAM) return true;
    if (level >= PERM.SAMAL) return currentUser.unit === (compKey || currentUser.unit);
    return false;
}

function isSoldierView() {
    return getUserPermissionLevel() === PERM.SOLDIER;
}

// ==================== GREEN API WHATSAPP ====================
function sendGreenApiWhatsApp(firstName, phone) {
    if (!CONFIG.greenApi) return;
    const { idInstance, apiTokenInstance, apiUrl } = CONFIG.greenApi;
    if (!idInstance || !apiTokenInstance) return;
    // Normalize phone: remove leading 0, add 972 prefix
    let cleanPhone = phone.replace(/[\s\-\(\)\+]/g, '');
    if (cleanPhone.startsWith('0')) cleanPhone = '972' + cleanPhone.slice(1);
    if (!cleanPhone.match(/^\d{10,15}$/)) return;
    const chatId = cleanPhone + '@c.us';
    const message = `שלום ${firstName} 😎\nאני שמח לראות שאתה מתעניין במערכת!\nאם יש שאלות אתה מוזמן לפנות אלי כאן\nבהצלחה!\nאלחי פיין`;
    const url = `${apiUrl || 'https://api.green-api.com'}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chatId, message })
    }).then(r => r.json()).then(data => {
        if (data.idMessage) console.log('WhatsApp sent:', data.idMessage);
        else console.warn('WhatsApp response:', data);
    }).catch(err => console.warn('Green API send failed:', err));
}

// ==================== LOGIN ====================
let currentUser = null;

function checkPassword() {
    const password = document.getElementById('loginPassword').value;
    if (password !== CONFIG.password) {
        const err = document.getElementById('loginError');
        err.textContent = 'סיסמה שגויה';
        err.classList.add('show');
        return;
    }
    document.getElementById('loginError').classList.remove('show');
    document.getElementById('loginStep1').classList.add('hidden');
    document.getElementById('loginStep2').classList.remove('hidden');
    document.getElementById('loginPersonalId').focus();
}

function doLoginByPersonalId() {
    const pid = document.getElementById('loginPersonalId').value.trim();
    if (!pid) {
        const err = document.getElementById('loginStep2Error');
        err.textContent = 'יש להזין מספר אישי';
        err.classList.add('show');
        return;
    }

    const soldier = state.soldiers.find(s => s.personalId === pid);
    if (!soldier) {
        const err = document.getElementById('loginStep2Error');
        err.textContent = 'מספר אישי לא נמצא במערכת';
        err.classList.add('show');
        return;
    }

    document.getElementById('loginStep2Error').classList.remove('show');

    let effectiveUnit = soldier.company;
    if (FULL_ACCESS_NAMES.some(n => soldier.name.includes(n))) effectiveUnit = 'gdudi';
    if (soldier.company === 'gdudi' || soldier.company === 'hq') effectiveUnit = 'gdudi';

    currentUser = {
        name: soldier.name,
        unit: effectiveUnit,
        personalId: pid,
        company: soldier.company,
        role: soldier.role || '',
        soldierId: soldier.id
    };

    sessionStorage.setItem(CONFIG.storagePrefix + 'User', JSON.stringify(currentUser));
    activateApp();
}


function doDemoLogin() {
    const name = (document.getElementById('loginDemoName')?.value || '').trim();
    const email = (document.getElementById('loginEmail')?.value || '').trim();
    const phone = (document.getElementById('loginPhone')?.value || '').trim();
    if (!name) {
        const err = document.getElementById('loginDemoError');
        err.textContent = 'יש להזין שם';
        err.classList.add('show');
        return;
    }
    if (!email && !phone) {
        const err = document.getElementById('loginDemoError');
        err.textContent = 'יש להזין אימייל או טלפון';
        err.classList.add('show');
        return;
    }

    if (CONFIG.collectVisitorData && typeof db !== 'undefined' && db) {
        const visitorData = { name, email, phone, timestamp: new Date().toISOString(), userAgent: navigator.userAgent };
        db.collection(CONFIG.visitorCollection || 'demo-visitors').add(visitorData)
            .catch(err => console.warn('Failed to save visitor:', err));
    }
    if (CONFIG.greenApi && phone) sendGreenApiWhatsApp(name, phone);

    currentUser = { name, unit: 'gdudi', personalId: '', company: 'gdudi', role: '' };
    sessionStorage.setItem(CONFIG.storagePrefix + 'User', JSON.stringify(currentUser));
    activateApp();
}

function renderRoleHolders() {
    const container = document.getElementById('roleHoldersList');
    if (!container || !state.soldiers || !state.soldiers.length) return;
    const roleHolders = state.soldiers.filter(s => s.role && SIGNING_ROLES.includes(s.role));
    if (roleHolders.length === 0) return;
    container.innerHTML = `<div style="font-size:0.72em;color:rgba(255,255,255,0.6);margin-bottom:4px;text-align:center;">בעלי תפקידים - לחץ לבחירה</div>` +
        roleHolders.map(s => `
            <div class="role-holder-card" onclick="selectRoleHolder('${s.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;margin:2px 0;background:rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;color:white;font-size:0.78em;transition:background 0.2s;">
                <span style="font-weight:600;">${esc(s.name)}</span>
                <span style="opacity:0.7;">${esc(s.role || '')}</span>
            </div>
        `).join('');
}

function selectRoleHolder(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;
    const pidField = document.getElementById('loginPersonalId');
    if (pidField) {
        pidField.value = sol.personalId || '';
        autoIdentifyByPersonalId();
    }
}

function autoIdentifyByPersonalId() {
    const pid = (document.getElementById('loginPersonalId')?.value || '').trim();
    const preview = document.getElementById('loginSoldierPreview');
    if (!pid || pid.length < 3) {
        if (preview) preview.classList.add('hidden');
        return;
    }
    const sol = state.soldiers.find(s => s.personalId === pid);
    if (sol && preview) {
        preview.innerHTML = '<strong>' + sol.name + '</strong><br><span style="font-size:0.85em;opacity:0.7;">' + (sol.role || 'חייל') + ' | ' + (companyData[sol.company]?.name || sol.company) + '</span>';
        preview.classList.remove('hidden');
    } else if (preview) {
        preview.classList.add('hidden');
    }
}

function doLogout() {
    sessionStorage.removeItem(CONFIG.storagePrefix + 'User');
    currentUser = null;
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('mainApp').style.display = 'none';

    // Reset login steps
    document.getElementById('loginStep1')?.classList.remove('hidden');
    document.getElementById('loginStep2')?.classList.add('hidden');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPersonalId').value = '';
    const preview = document.getElementById('loginSoldierPreview');
    if (preview) preview.classList.add('hidden');
}

let _refreshIconsTimer = null;
function refreshIcons() {
    if (_refreshIconsTimer) return;
    _refreshIconsTimer = setTimeout(() => {
        _refreshIconsTimer = null;
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }, 60);
}

function activateApp() {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('mainApp').style.display = '';

    // Restore sidebar visibility (may have been hidden by previous soldier view)
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = '';

    const unitMap = getCompNames();
    document.getElementById('userBadge').textContent = currentUser.name + ' | ' + unitMap[currentUser.unit];
    const sidebarUser = document.getElementById('sidebarUser');
    if (sidebarUser) sidebarUser.textContent = currentUser.name;

    detectUserRole();

    // Soldier read-only view
    if (isSoldierView()) {
        activateSoldierView();
        refreshIcons();
        return;
    }

    applyUnitFilter();

    // Set calendar filter to user's company (levels 2-4 see own company only)
    const calFilter = document.getElementById('calCompanyFilter');
    const userLevel = getUserPermissionLevel();
    if (calFilter && userLevel < PERM.COMPANY_CMD) {
        calFilter.value = currentUser.unit;
    }

    // Auto-switch to the relevant tab
    if (userLevel >= PERM.COMPANY_CMD) {
        switchTab('all');
    } else {
        switchTab(currentUser.unit);
    }

    // Close sidebar on mobile after login
    if (window.innerWidth <= 768) {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.remove('open');
        document.body.classList.remove('sidebar-open');
    }
    refreshIcons();

    // Auto-sync from Google Sheets on login
    syncFromGoogleSheets(true);
    syncWeaponsEasyDoStatus(true);
}

function activateSoldierView() {
    // Hide sidebar
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.style.display = 'none';
    document.body.classList.remove('sidebar-open');

    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');

    // Show soldier view tab
    const soldierTab = document.getElementById('tab-myequipment');
    if (soldierTab) {
        soldierTab.style.display = '';
        const unitMap = getCompNames();
        const nameEl = document.getElementById('soldierViewName');
        const unitEl = document.getElementById('soldierViewUnit');
        if (nameEl) nameEl.textContent = currentUser.name;
        if (unitEl) unitEl.textContent = unitMap[currentUser.unit] || currentUser.unit;
        renderSoldierEquipment();
        renderSoldierShifts();
    }
}

function renderSoldierEquipment() {
    const container = document.getElementById('myEquipmentContent');
    if (!container) return;
    const soldierId = currentUser.soldierId;
    if (!soldierId) {
        container.innerHTML = '<div class="empty-state"><p>לא נמצא חייל מתאים במערכת</p></div>';
        return;
    }
    const heldItems = state.equipment.filter(e => e.holderId === soldierId);
    if (!heldItems.length) {
        container.innerHTML = '<div class="empty-state"><p>אין ציוד חתום על שמך</p></div>';
        return;
    }
    container.innerHTML = heldItems.map(e => `
        <div class="soldier-equip-card">
            <div class="icon" style="background:#E8F5E9;color:#2E7D32;width:40px;height:40px;display:flex;align-items:center;justify-content:center;border-radius:10px;flex-shrink:0;"><i data-lucide="package"></i></div>
            <div style="flex:1;">
                <div style="font-weight:700;">${e.type}</div>
                <div style="font-size:0.82em;color:var(--text-light);direction:ltr;font-family:monospace;">${e.serial}</div>
            </div>
            <div style="text-align:left;font-size:0.82em;color:var(--text-light);">
                ${e.assignedDate ? new Date(e.assignedDate).toLocaleDateString('he-IL') : ''}
            </div>
        </div>
    `).join('');
    refreshIcons();
}

function renderSoldierShifts() {
    const container = document.getElementById('myShiftsContent');
    if (!container) return;
    const soldierId = currentUser.soldierId;
    const comp = currentUser.unit;
    // Show all company shifts (spec: "משמרות הפלוגה שלו"), highlight soldier's own
    const compShifts = (state.shifts || []).filter(sh => sh.company === comp);
    if (!compShifts.length) {
        container.innerHTML = '<div class="empty-state"><p>אין משמרות בפלוגה</p></div>';
        return;
    }
    container.innerHTML = compShifts.slice(-15).reverse().map(sh => {
        const isMine = soldierId && sh.soldiers && sh.soldiers.includes(soldierId);
        const borderColor = isMine ? 'var(--primary)' : 'var(--border)';
        const badge = isMine ? '<span style="background:var(--primary);color:white;font-size:0.72em;padding:2px 8px;border-radius:10px;margin-right:8px;">אני משובץ</span>' : '';
        return `<div style="background:var(--card);border-radius:var(--radius);padding:12px 16px;margin-bottom:8px;border-right:4px solid ${borderColor};">
            <div style="font-weight:600;">${escapeHtml(sh.name || sh.type || 'משמרת')} ${badge}</div>
            <div style="font-size:0.82em;color:var(--text-light);">${sh.date || ''} ${sh.time || ''}</div>
            ${sh.notes ? `<div style="font-size:0.82em;margin-top:4px;">${escapeHtml(sh.notes)}</div>` : ''}
        </div>`;
    }).join('');
}

function applyUnitFilter() {
    const level = getUserPermissionLevel();
    const seesAll = level >= PERM.COMPANY_CMD; // levels 5, 6, 7 see all companies

    // "All companies" overview tab - only for users who see all
    document.querySelectorAll('.sidebar-item.tab-all').forEach(el => el.style.display = seesAll ? '' : 'none');

    // Company tabs - show based on canView()
    ['a', 'b', 'c', 'd', 'hq', 'agam', 'palsam'].forEach(comp => {
        const show = canView(comp);
        document.querySelectorAll(`.sidebar-item.tab-${comp}`).forEach(el => el.style.display = show ? '' : 'none');
    });

    // General tabs - visible to all (level 2+, since level 1 is redirected to soldier view)
    document.querySelectorAll('.sidebar-item.tab-calendar').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-reports').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-rotation').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');

    // Training - hidden for palsam (excluded from combat training)
    document.querySelectorAll('.sidebar-item.tab-training').forEach(el => el.style.display = level !== PERM.PALSAM ? '' : 'none');

    // Weapons - hidden in demo, otherwise visible
    document.querySelectorAll('.sidebar-item.tab-weapons').forEach(el => el.style.display = CONFIG.isDemo ? 'none' : '');

    // Settings - only FULL_ACCESS (level 7)
    document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = level >= PERM.FULL_ACCESS ? '' : 'none');

    // Rotation management - only FULL_ACCESS
    const addRotBtn = document.getElementById('addRotGroupBtn');
    if (addRotBtn) addRotBtn.style.display = level >= PERM.FULL_ACCESS ? '' : 'none';

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
    const saved = sessionStorage.getItem(CONFIG.storagePrefix + 'User');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            // Detect role if not already set (e.g. manual login sessions)
            if (!currentUser.role && state.soldiers.length) {
                detectUserRole();
            }
            activateApp();
            return true;
        } catch {
            sessionStorage.removeItem(CONFIG.storagePrefix + 'User');
        }
    }
    return false;
}

// Enter key support on login - handled inline via onkeypress in HTML

// ==================== DATA (built from CONFIG) ====================
const companyData = {};
Object.entries(CONFIG.companies).forEach(([key, cfg]) => {
    companyData[key] = {
        name: cfg.name,
        location: cfg.location,
        color: 'var(--pluga-' + key + ')',
        colorClass: 'company-' + key,
        forecast: cfg.forecast || 0,
        tasks: JSON.parse(JSON.stringify(cfg.tasks || [])),
        totals: cfg.totals || { soldiers: 0, commanders: 0, officers: 0 }
    };
});

// State
let state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [], personalEquipment: [], shiftHistory: [], constraints: [] };

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
    const saved = localStorage.getItem(CONFIG.storagePrefix + 'State_v2');
    if (saved) {
        try { state = JSON.parse(saved); } catch { localStorage.removeItem(CONFIG.storagePrefix + 'State_v2'); }
    }
    if (!state.rotationGroups) state.rotationGroups = [];
    if (!state.equipment) state.equipment = [];
    if (!state.signatureLog) state.signatureLog = [];
    if (!state.weaponsData) state.weaponsData = [];
    if (!state.personalEquipment) state.personalEquipment = [];
    if (!state.rollCalls) state.rollCalls = [];
    if (!state.announcements) state.announcements = [];
    if (!state.constraints) state.constraints = [];
    if (!state.shiftHistory) state.shiftHistory = [];
    if (!state.initiativeTeams) state.initiativeTeams = [];
    if (!state.training) state.training = [];

    // Normalize shifts — ensure every shift has a soldiers array
    if (state.shifts) state.shifts.forEach(sh => { if (!Array.isArray(sh.soldiers)) sh.soldiers = []; });

    // Migration v1 already completed — just ensure flag is set for new devices
    if (!localStorage.getItem(CONFIG.storagePrefix + '_migration_clear_v1')) {
        localStorage.setItem(CONFIG.storagePrefix + '_migration_clear_v1', '1');
    }

    // Migration: add warehouse + category to existing equipment
    if (!localStorage.getItem(CONFIG.storagePrefix + '_migration_warehouse_v1')) {
        state.equipment.forEach(e => {
            if (!e.warehouse) e.warehouse = CONFIG.defaultWarehouse;
            if (!e.category) e.category = detectCategoryFromType(e.type);
        });
        localStorage.setItem(CONFIG.storagePrefix + '_migration_warehouse_v1', '1');
        saveState();
    }

    // Migration: simplify categories to 5 (נשק, אופטיקה, קשר, לוגיסטיקה, אחר)
    const CAT_MIGRATION = { 'תצפית':'אופטיקה', 'מגן':'לוגיסטיקה', 'רפואי':'לוגיסטיקה', 'שטח':'לוגיסטיקה', 'תחמושת':'לוגיסטיקה', 'טנ"א':'לוגיסטיקה' };
    state.equipment.forEach(e => { if (CAT_MIGRATION[e.category]) e.category = CAT_MIGRATION[e.category]; });

    // (test soldier removed)

    // Load demo seed data if available and state is empty or outdated
    if (CONFIG.demoSeedData) {
        const seed = CONFIG.demoSeedData;
        const expectedCount = seed.soldiers ? seed.soldiers.length : 0;
        const demoSoldiers = state.soldiers.filter(s => s.id && s.id.startsWith('demo_'));
        const storedSeedVer = parseInt(localStorage.getItem(CONFIG.storagePrefix + 'SeedVer') || '0');
        const needReseed = demoSoldiers.length < expectedCount * 0.8 || storedSeedVer < (CONFIG.demoSeedVersion || 0);
        if (needReseed) {
            // Remove old demo soldiers and re-seed
            state.soldiers = state.soldiers.filter(s => !s.id || !s.id.startsWith('demo_'));
            if (seed.soldiers) seed.soldiers.forEach(s => state.soldiers.push(s));
            if (seed.shifts) state.shifts = seed.shifts;
            if (seed.leaves) state.leaves = seed.leaves;
            if (seed.training) state.training = seed.training;
            if (seed.constraints) state.constraints = seed.constraints;
            if (seed.personalEquipment) state.personalEquipment = seed.personalEquipment;
            if (seed.signatureLog) seed.signatureLog.forEach(e => state.signatureLog.push(e));
            if (seed.weaponsData) state.weaponsData = seed.weaponsData;
            if (seed.equipment) state.equipment = seed.equipment;
            if (seed.rotationGroups) state.rotationGroups = seed.rotationGroups;
            if (seed.announcements) state.announcements = seed.announcements;
            localStorage.setItem(CONFIG.storagePrefix + 'SeedVer', String(CONFIG.demoSeedVersion || 0));
            // Save demo task definitions so dashboard alerts match demo shifts
            if (seed.tasks) {
                localStorage.setItem(CONFIG.storagePrefix + 'Tasks', JSON.stringify(seed.tasks));
            } else {
                localStorage.removeItem(CONFIG.storagePrefix + 'Tasks');
            }
            saveState();
        }
    }
    // Apply demo settings overrides
    if (CONFIG.demoSettings) {
        Object.assign(settings, CONFIG.demoSettings);
        saveSettings();
    }
}

function detectCategoryFromType(type) {
    if (!type) return 'לוגיסטיקה';
    if (['נשק','M16','M4','MAG','נגב','רובה'].some(t => type.includes(t))) return 'נשק';
    if (['כוונת','משקפת','ליונט','אול"ר','תצפית','אקילה','טריגיקון','מפרולייט'].some(t => type.includes(t))) return 'אופטיקה';
    if (['קשר','624','מע"ד','מדונה','עכבר','אמר"ל','סוללה'].some(t => type.includes(t))) return 'קשר';
    return 'לוגיסטיקה';
}


function saveState() {
    try {
        localStorage.setItem(CONFIG.storagePrefix + 'State_v2', JSON.stringify(state));
    } catch (e) {
        // localStorage quota exceeded — trim large demo arrays and retry
        console.warn('localStorage quota exceeded, trimming data...');
        if (state.personalEquipment.length > 180) state.personalEquipment = state.personalEquipment.slice(0, 180);
        if (state.weaponsData.length > 260) state.weaponsData = state.weaponsData.slice(0, 260);
        if (state.training.length > 500) state.training = state.training.slice(0, 500);
        if (state.shifts.length > 400) state.shifts = state.shifts.slice(-400);
        try {
            localStorage.setItem(CONFIG.storagePrefix + 'State_v2', JSON.stringify(state));
        } catch (e2) {
            console.error('localStorage still full after trim:', e2);
            showToast('אזהרה: הזיכרון המקומי מלא - ייתכן אובדן נתונים', 'error');
        }
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
    const id = settings.sheetId;
    const urls = {};
    // Prefer export endpoint (ignores sheet filters) when gid is available
    // Fallback to gviz/tq for tabs without gid
    const gvizBase = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv`;
    const exportBase = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv`;
    urls.support = gvizBase; // first tab (support staff — hq, palsam)
    const supportKeys = ['hq', 'palsam']; // agam has its own tab with sheetGid
    Object.entries(CONFIG.companies).forEach(([k, v]) => {
        if (supportKeys.includes(k)) return; // covered by urls.support
        if (v.sheetGid) {
            urls[k] = exportBase + '&gid=' + v.sheetGid;
        } else if (v.sheetTab) {
            urls[k] = gvizBase + '&sheet=' + encodeURIComponent(v.sheetTab);
        }
    });
    return urls;
}
const ALL_COMPANIES = allCompanyKeys();

const deptToCompany = CONFIG.departmentToCompany;

const UNITS_BY_COMPANY = {};
Object.entries(CONFIG.companies).forEach(([k, v]) => { UNITS_BY_COMPANY[k] = v.units || []; });

function updateSoldierUnits() {
    const compKey = document.getElementById('soldierCompany').value;
    const unitSel = document.getElementById('soldierUnit');
    if (!unitSel) return;
    const units = UNITS_BY_COMPANY[compKey] || [];
    unitSel.innerHTML = '<option value="">-- בחר --</option>' + units.map(u => `<option value="${esc(u)}">${esc(u)}</option>`).join('');
}

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

    // Run equipment migration AFTER Firestore data loaded (prevents overwrite race condition)
    migrateEquipmentSets();

    // Force re-sync if data version changed (multi-sheet support)
    const dataVersion = 'v4_allsheets_fix';
    if (localStorage.getItem(CONFIG.storagePrefix + 'DataVersion') !== dataVersion) {
        state.soldiers = state.soldiers.filter(s => !s.fromSheets);
        localStorage.setItem(CONFIG.storagePrefix + 'DataVersion', dataVersion);
        syncFromGoogleSheets(true);
    } else if (state.soldiers.length === 0) {
        syncFromGoogleSheets(true);
    }
    // Auto-cleanup: remove shifts/leaves older than 30 days
    cleanupOldData();
    renderAll();
    const today = localToday();
    const _el = id => document.getElementById(id);
    if (_el('shiftDate')) _el('shiftDate').value = today;
    if (_el('leaveStart')) _el('leaveStart').value = today;
    if (_el('rotGroupStartDate')) _el('rotGroupStartDate').value = today;
    const d4 = new Date(); d4.setDate(d4.getDate() + 4);
    if (_el('leaveEnd')) _el('leaveEnd').value = d4.toISOString().split('T')[0];
    updateShiftOptions();
    checkSession();

    // Register Service Worker for PWA — bypass HTTP cache for SW updates
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).catch(() => {});
        navigator.serviceWorker.addEventListener('message', event => {
            if (event.data && event.data.type === 'SW_UPDATED') {
                showToast('מעדכן גרסה...', 'info');
                setTimeout(() => location.reload(), 1000);
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
    if (allCompanyKeys().includes(activeTab)) {
        if (companyViewMode[activeTab] === 'commander') renderCommanderDashboard(activeTab);
        else renderCompanyTab(activeTab);
    } else if (activeTab === 'rotation') {
        renderRotationTab();
    } else if (activeTab === 'equipment') {
        renderEquipmentTab();
    } else if (activeTab === 'weapons') {
        renderWeaponsTab();
    } else if (activeTab === 'morningreport') {
        generateMorningReport();
    } else if (activeTab === 'rollcall') {
        renderReport1();
    } else if (activeTab === 'announcements') {
        renderAnnouncements();
    }
}

// ==================== GOOGLE SHEETS SYNC ====================
let syncInProgress = false;
function syncFromGoogleSheets(silent) {
    if (CONFIG.isDemo) {
        if (!silent) {
            // Simulate sync in demo mode
            const syncBtns = document.querySelectorAll('[onclick*="syncFromGoogleSheets"]');
            syncBtns.forEach(btn => { btn._origHTML = btn.innerHTML; btn.innerHTML = '<span class="sync-spinner"></span> מסנכרן...'; btn.disabled = true; });
            showToast('מסנכרן מגוגל שיטס...', 'success');
            setTimeout(() => {
                const soldierCount = state.soldiers ? state.soldiers.length : 0;
                showToast(`סונכרנו ${soldierCount} חיילים מגוגל שיטס בהצלחה ✓`, 'success');
                syncBtns.forEach(btn => { btn.innerHTML = btn._origHTML || btn.innerHTML; btn.disabled = false; });
            }, 1800);
        }
        return;
    }
    if (syncInProgress) { if (!silent) showToast('סנכרון כבר פעיל, אנא המתן...', 'info'); return; }
    syncInProgress = true;

    // Show spinner on sync button
    const syncBtns = document.querySelectorAll('[onclick*="syncFromGoogleSheets"]');
    syncBtns.forEach(btn => { btn._origHTML = btn.innerHTML; btn.innerHTML = '<span class="sync-spinner"></span> מסנכרן...'; btn.disabled = true; });

    if (!silent) showToast('מסנכרן מגוגל שיטס...', 'success');

    const fetches = Object.entries(getSheetUrls()).map(([key, url]) =>
        fetch(url).then(r => r.text()).then(csv => ({ key, csv }))
    );

    // Also fetch nispachim sheet if configured
    if (CONFIG.nispachimSheetId) {
        const nispUrl = `https://docs.google.com/spreadsheets/d/${CONFIG.nispachimSheetId}/gviz/tq?tqx=out:csv`;
        fetches.push(fetch(nispUrl).then(r => r.text()).then(csv => ({ key: 'nispachim', csv })));
    }

    Promise.all(fetches).then(results => {
        const manualSoldiers = state.soldiers.filter(s => !s.fromSheets);
        let sheetSoldiers = [];

        results.forEach(({ key, csv }) => {
            if (key === 'nispachim') {
                const parsed = parseNispachimSheet(csv);
                console.log(`Sheet nispachim: ${parsed.length} soldiers`);
                sheetSoldiers.push(...parsed);
            } else if (key === 'support' || key === 'agam') {
                const parsed = parseSupportSheet(csv);
                console.log(`Sheet ${key}: ${parsed.length} soldiers`);
                sheetSoldiers.push(...parsed);
            } else {
                const parsed = parseCombatSheet(csv, key);
                console.log(`Sheet ${key}: ${parsed.length} soldiers`);
                sheetSoldiers.push(...parsed);
            }
        });

        // Dedup by personalId — later sheets (agam) override earlier (support/palsam)
        const seenIds = new Map();
        sheetSoldiers.forEach((s, i) => { if (s.personalId) seenIds.set(s.personalId, i); });
        const beforeDedup = sheetSoldiers.length;
        sheetSoldiers = sheetSoldiers.filter((s, i) => !s.personalId || seenIds.get(s.personalId) === i);
        if (beforeDedup !== sheetSoldiers.length) console.log(`Dedup: removed ${beforeDedup - sheetSoldiers.length} duplicate soldiers by personalId`);

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
        syncBtns.forEach(btn => { btn.innerHTML = btn._origHTML || btn.innerHTML; btn.disabled = false; });
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
            arrival: (f[6] || '').trim(),
            notArrived: (f[6] || '').trim() !== 'מגיע'
        });
    }
    return soldiers;
}

// Parse nispachim (attached soldiers) sheet - columns: שם מלא, תפקיד, מ.א., מס' נייד, ק.קישור, הערות
function parseNispachimSheet(csv) {
    const lines = csv.split('\n');
    const soldiers = [];
    for (let i = 1; i < lines.length; i++) {
        const f = parseCSVLine(lines[i]);
        if (f.length < 4) continue;
        const name = f[0].trim();
        const role = f[1].trim();
        const id = f[2].trim();
        const phone = f[3].trim();
        const notes = (f[5] || '').trim();
        if (!name || !id) continue;
        if (notes.includes('לא אושר')) continue;

        // Map role to unit
        let unit = 'לוגיסטיקה';
        if (role.includes('טבח') || role.includes('מטבח') || role.includes('כשרות')) unit = 'מטבח';
        else if (role.includes('חובש') || role.includes('רופא') || role.includes('רפוא')) unit = 'רפואה';
        else if (role.includes('נהג') || role.includes('רכב')) unit = 'רכב';
        else if (role.includes('קשר')) unit = 'קשר';
        else if (role.includes('טנ"א') || role.includes('מכונאי')) unit = 'טנ"א';
        else if (role.includes('סמבצ') || role.includes('נתונים')) unit = 'לוגיסטיקה';

        const existing = state.soldiers.find(s => s.personalId === id && s.fromSheets);
        soldiers.push({
            id: existing ? existing.id : 'sol_nisp_' + id + '_' + Math.random().toString(36).substr(2, 4),
            name, personalId: id,
            phone: phone || '',
            company: 'palsam', unit,
            role: role || 'לוחם',
            rank: '', fromSheets: true,
            nispach: true,
            notes: notes.includes('ניוד') ? 'ניוד' : ''
        });
    }
    return soldiers;
}

// Parse combat company sheet - columns: מספר אישי, שם, טלפון, ארוחה, צו, מחלקה, סגל/מתאמן, תפקיד, הסמכה, וידוא הגעה
function parseCombatSheet(csv, companyKey) {
    const lines = csv.split('\n');
    const soldiers = [];
    const compNames = getCompNames();
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
            arrival, certification: cert || '',
            notArrived: arrival !== 'מגיע'
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
            const officers = soldiers.filter(s => officerRoles.some(r => (s.role || '').includes(r))).length;
            const commanders = soldiers.filter(s => cmdRoles.some(r => (s.role || '').includes(r))).length;
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
        const notArrivedCount = state.soldiers.filter(s => s.company === key && s.notArrived).length;
        const homeCount = onLeave + notArrivedCount;
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
                    <span>${homeCount > 0 ? homeCount + ' בבית' : 'כולם בבסיס'}</span>
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
        const notArrivedCount = state.soldiers.filter(s => s.company === k && s.notArrived).length;
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

        const home = onLeave + rotLeave + notArrivedCount;
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

    // === BAR CHART - Company manning (all companies with soldiers) ===
    const mainCompanies = ALL_COMPANIES.filter(k => compStats[k].regCount > 0);
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

    // === Task Readiness (today only) ===
    let taskAlerts = [];
    const _now = new Date();
    const todayForAlerts = `${_now.getFullYear()}-${String(_now.getMonth()+1).padStart(2,'0')}-${String(_now.getDate()).padStart(2,'0')}`;
    mainCompanies.forEach(k => {
        const comp = companyData[k];
        comp.tasks.forEach(task => {
            const needed = task.perShift ? (task.perShift.soldiers + task.perShift.commanders + task.perShift.officers) * task.shifts : 0;
            if (needed <= 0) return;
            const assigned = state.shifts.filter(sh => sh.company === k && sh.task === task.name && sh.date === todayForAlerts)
                .reduce((sum, sh) => sum + sh.soldiers.length, 0);
            const missing = needed - assigned;
            if (missing > 0) {
                const pct = Math.round((assigned / needed) * 100);
                taskAlerts.push({ company: comp.name, task: task.name, pct, needed, assigned, missing });
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
        // Show worst alert per company first, then fill remaining slots
        taskAlerts.sort((a, b) => a.pct - b.pct);
        const seen = new Set();
        const prioritized = [];
        taskAlerts.forEach(a => {
            if (!seen.has(a.company)) { prioritized.push(a); seen.add(a.company); }
        });
        taskAlerts.forEach(a => { if (!prioritized.includes(a)) prioritized.push(a); });
        const topAlerts = prioritized.slice(0, 8);
        topAlerts.forEach(a => {
            const cls = a.pct === 0 ? 'dash-alert-danger' : 'dash-alert-warn';
            const icon = a.pct === 0
                ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
                : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
            alertsHtml += `<div class="dash-alert ${cls}">
                ${icon}
                <span><strong>${a.company}</strong> - ${a.task}: חסרים ${a.missing} (${a.assigned}/${a.needed} משובצים)</span>
            </div>`;
        });
    }

    // Alert: soldiers who didn't arrive to מילואים
    const notArrivedSoldiers = state.soldiers.filter(s => s.notArrived && canView(s.company));
    if (notArrivedSoldiers.length > 0) {
        alertsHtml += `<div class="dash-alert dash-alert-danger">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
            <span><strong>${notArrivedSoldiers.length} חיילים</strong> לא הגיעו למילואים</span>
        </div>`;
    }

    // Alert: soldiers without signed equipment
    const unsignedPE = state.soldiers.filter(s => {
        if (!canView(s.company)) return false;
        const pe = (state.personalEquipment || []).find(p => p.soldierId === s.id);
        return pe && (!pe.bulkSignature || !pe.bulkSignature.signed);
    });
    if (unsignedPE.length > 0) {
        alertsHtml += `<div class="dash-alert dash-alert-warn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            <span><strong>${unsignedPE.length} חיילים</strong> ללא פק"ל חתום</span>
        </div>`;
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

    // Check for soldiers needing range qualification renewal (6+ months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsStr = sixMonthsAgo.toISOString().split('T')[0];
    const needsRange = state.soldiers.filter(s => {
        if (!canView(s.company)) return false;
        const wp = state.weaponsData.find(w => w.soldierId === s.id);
        if (!wp) return true; // no weapons data = needs range
        return !wp.rangeDate || wp.rangeDate < sixMonthsStr;
    });
    if (needsRange.length > 0) {
        alertsHtml += `<div class="dash-alert dash-alert-warn" style="cursor:pointer;" onclick="openRangeResetSummary()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span><strong>שים לב!</strong> יש חיילים שהנשק שלהם לא מאופס — לחץ לריכוז</span>
        </div>`;
    }

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
        // Position fixed panel relative to bell button
        const bell = panel.closest('.notif-wrapper')?.querySelector('.topbar-bell');
        if (bell) {
            const r = bell.getBoundingClientRect();
            panel.style.top = (r.bottom + 8) + 'px';
            panel.style.left = Math.max(8, r.left - 300 + r.width) + 'px';
        }
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

    // 2. Leaves starting/ending today/tomorrow
    const leavingTodayNotif = state.leaves.filter(l => l.startDate === todayStr);
    if (leavingTodayNotif.length > 0) {
        notifications.push({
            type: 'warning',
            title: `${leavingTodayNotif.length} חיילים יוצאים היום`,
            desc: leavingTodayNotif.map(l => {
                const sol = state.soldiers.find(s => s.id === l.soldierId);
                return sol ? sol.name : '?';
            }).slice(0, 5).join(', ') + (leavingTodayNotif.length > 5 ? '...' : ''),
            icon: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>'
        });
    }
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
    ALL_COMPANIES.forEach(k => {
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
let _searchDebounce = {};
function onSearchInput(compKey) {
    clearTimeout(_searchDebounce[compKey]);
    _searchDebounce[compKey] = setTimeout(() => {
        const ss = getSearchState(compKey);
        const input = document.getElementById(`search-${compKey}`);
        if (input) ss.query = input.value.trim();
        renderSoldiersGrid(compKey);
    }, 200);
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
            const isNotArrived = s.notArrived === true;
            const onLeave = !isNotArrived && leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
            const rotGroup = getRotationGroupForSoldier(s.id);
            const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
            const isHome = isNotArrived || onLeave || (rotStatus && !rotStatus.inBase);
            const isAssigned = !isHome && shifts.some(sh => sh.soldiers.includes(s.id));

            if (ss.filter === 'home') return isHome;
            if (ss.filter === 'assigned') return isAssigned;
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
        const isNotArrived = s.notArrived === true;
        const onLeave = !isNotArrived && leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
        const rotGroup = getRotationGroupForSoldier(s.id);
        const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
        const isHome = isNotArrived || onLeave || (rotStatus && !rotStatus.inBase);
        const isAssigned = !isHome && shifts.some(sh => sh.soldiers.includes(s.id));
        const cls = isHome ? 'on-leave' : isAssigned ? 'on-duty' : 'unassigned';
        const txt = isNotArrived ? 'לא הגיע' : onLeave ? 'בבית' : (rotStatus && !rotStatus.inBase) ? 'בבית' : isAssigned ? 'בשיבוץ' : 'זמין';
        const badge = isHome ? 'status-on-leave' : isAssigned ? 'status-on-duty' : 'status-available';
        let rotInfo = '';
        if (rotGroup && rotStatus) {
            rotInfo = `<div class="meta">רוטציה: ${esc(rotGroup.name)} | ${rotStatus.inBase ? 'יום ' + rotStatus.dayInCycle + '/' + rotGroup.daysIn + ' בבסיס' : 'יום ' + (rotStatus.dayInCycle - rotGroup.daysIn) + '/' + rotGroup.daysOut + ' בבית'}</div>`;
        }
        return `<div class="person-card ${cls}" data-soldier-id="${s.id}">
            <div class="person-info">
                <h4><a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a>${s.tempAssigned ? ' <span style="font-size:0.75em;color:var(--text-light);font-weight:400;">(מוצב זמנית)</span>' : ''}</h4>
                <div class="meta">${esc(s.role || '')}${s.unit ? ' | '+esc(s.unit) : ''}${s.personalId ? ' | '+esc(s.personalId) : ''}</div>
                ${s.phone ? `<div class="meta">${esc(s.phone)}</div>` : ''}
                ${rotInfo}
            </div>
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="person-status ${badge}">${txt}</span>
                ${canEditSoldierDetails(compKey) ? `<button class="btn btn-edit btn-icon btn-sm" onclick="openEditSoldier('${s.id}')" title="עריכה">&#9998;</button>
                <button class="btn btn-icon btn-sm" style="background:${s.notArrived ? '#e74c3c' : '#78909C'};color:white;" onclick="toggleNotArrived('${s.id}')" title="${s.notArrived ? 'סמן כמגיע' : 'סמן כלא מגיע'}">${s.notArrived ? '&#10007;' : '&#10003;'}</button>
                ${!(CONFIG.skipPassword && s.id.startsWith('demo_')) ? `<button class="btn btn-danger btn-icon btn-sm" onclick="deleteSoldier('${s.id}')" title="מחק">&#10005;</button>` : ''}` : ''}
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

    const editShifts = canEditShifts(compKey);
    const editSoldiers = canEditSoldierDetails(compKey);
    const editConstraints = canEditConstraints(compKey);
    container.innerHTML = `
        <div class="action-bar">
            ${editSoldiers ? `<button class="btn btn-primary" onclick="openAddSoldier('${compKey}')">+ הוספת חייל</button>` : ''}
            ${editShifts ? `<button class="btn btn-success" onclick="openAddShift('${compKey}')">+ שיבוץ למשמרת</button>
            <button class="btn btn-warning" onclick="openAddLeave('${compKey}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> יציאה הביתה</button>
            <button class="btn" style="background:#7c4dff;color:white;" onclick="openAutoSchedule('${compKey}')">שיבוץ אוטומטי</button>` : ''}
            ${editConstraints ? `<button class="btn" style="background:#e53935;color:white;" onclick="openConstraints('${compKey}')">אילוצים</button>` : ''}
            <button class="btn" style="background:var(--bg)" onclick="exportCompanyData('${compKey}')">ייצוא CSV</button>
            <button class="btn" style="background:#7B1FA2;color:white;" onclick="toggleCompanyView('${compKey}')"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:4px;"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> תצוגת מ"פ</button>
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
                        <th style="text-align:right;">משימה</th>
                        <th>חיי׳/מש׳</th>
                        <th>מפק׳/מש׳</th>
                        <th>קצי׳/מש׳</th>
                        <th>משמרות</th>
                        <th>סה״כ חיי׳</th>
                        <th>סה״כ מפק׳</th>
                        <th>סה״כ קצי׳</th>
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
                                    ${formatDate(sh.date)} | ${names.length}/${needed} משובצים
                                </div>
                                ${needsCommander ? `<div class="task-commander-badge">${cmdSol ? '<strong>מפקד המשימה:</strong> <a href="#" onclick="event.preventDefault();openSoldierProfile(\'' + sh.taskCommander + '\')" class="soldier-link">' + esc(cmdSol.name) + '</a>' : '<span style="color:var(--danger)">לא נבחר מפקד משימה</span>'}</div>` : ''}
                                ${names.length > 0 ? `<ul class="shift-soldiers">${names.map(n => `<li class="shift-soldier"><span>${n}</span></li>`).join('')}</ul>` : '<div style="text-align:center;padding:8px;color:var(--danger);font-size:0.83em;">לא שובצו חיילים</div>'}
                                ${editShifts ? `<div style="margin-top:6px;text-align:left;display:flex;gap:4px;">
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
                                        ${editShifts ? `<button class="btn btn-edit btn-sm" onclick="openEditLeave('${l.id}')">&#9998;</button>
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
    if (!currentUser || getUserPermissionLevel() >= PERM.COMPANY_CMD) return state.rotationGroups;
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
        html += `<div class="rotation-label">${esc(group.name)}<br><small style="color:var(--text-light)">${group.soldiers.length} חיילים</small></div>`;
        html += '<div class="rotation-days">';
        days.forEach((d, i) => {
            const status = getRotationStatus(group, d);
            const isToday = i === 0;
            const cls = status.inBase ? 'in-base' : 'at-home';
            html += `<div class="rotation-day ${cls} ${isToday ? 'today' : ''}" title="${status.inBase ? 'בבסיס - יום '+status.dayInCycle : 'בבית - יום '+(status.dayInCycle - group.daysIn)}">
                <div style="font-size:1em;">${status.inBase ? '&#9989;' : '&#9670;'}</div>
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
    const canManage = !currentUser || getUserPermissionLevel() >= PERM.FULL_ACCESS;
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
    if (isNaN(start) || isNaN(check)) return { inBase: true, dayInCycle: 1 };
    const diffDays = Math.floor((check - start) / (1000*60*60*24));
    const cycleLength = (group.daysIn || 0) + (group.daysOut || 0);
    if (cycleLength <= 0) return { inBase: true, dayInCycle: 1 };
    let dayInCycle = ((diffDays % cycleLength) + cycleLength) % cycleLength + 1;
    const inBase = dayInCycle <= (group.daysIn || 0);
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

    const calFilterEl = document.getElementById('calCompanyFilter');
    const filterCompany = calFilterEl ? calFilterEl.value : 'all';

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
        if (filterCompany === 'all' || CONFIG.combatCompanies.includes(filterCompany)) {
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
            eventsHtml += `<div class="cal-event cal-event-shift" title="${esc(label)} (${sh.startTime}-${sh.endTime}) - ${sh.soldiers.length} חיילים">
                <span class="cal-event-time">${sh.startTime}</span>
                <span class="cal-event-label">${esc(label)}</span>
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
                    eventsHtml += `<div class="cal-event cal-event-leave" title="${esc(compName)} - ${count} ביציאה">
                        <span class="cal-event-label">${esc(compName)}</span>
                        <span class="cal-event-count">${count}</span>
                    </div>`;
                });
            }
        }

        // Rotation out
        rotationEvents.forEach(r => {
            eventsHtml += `<div class="cal-event cal-event-rotation" title="${esc(r.name)} - ${r.count} בבית (יום ${r.dayInCycle} במחזור)">
                <span class="cal-event-label">${esc(r.name)}</span>
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
    const calFilterEl2 = document.getElementById('calCompanyFilter');
    const filterCompany = calFilterEl2 ? calFilterEl2.value : 'all';
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
            <h1 style="color:#1a237e;margin:0;font-size:28px;font-weight:bold;">${CONFIG.battalionName} - לוח שיבוצים שבועי</h1>
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
let companyViewMode = {};

function toggleCompanyView(compKey) {
    companyViewMode[compKey] = companyViewMode[compKey] === 'commander' ? 'manage' : 'commander';
    if (companyViewMode[compKey] === 'commander') {
        renderCommanderDashboard(compKey);
    } else {
        renderCompanyTab(compKey);
    }
}

function renderCommanderDashboard(targetCompKey) {
    const compKey = targetCompKey || (currentUser && currentUser.unit) || 'a';
    const container = document.getElementById('content-' + compKey);
    if (!container) return;

    const comp = companyData[compKey];
    if (!comp) return;

    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const todayStr = localToday();
    const shifts = state.shifts.filter(sh => sh.company === compKey);
    const todayShifts = shifts.filter(sh => sh.date === todayStr);
    const leaves = state.leaves.filter(l => l.company === compKey);

    // Categorize soldiers
    const inBase = [], atHome = [], returningToday = [], leavingToday = [], unassigned = [];
    const assignedIds = new Set();
    todayShifts.forEach(sh => sh.soldiers.forEach(sid => assignedIds.add(sid)));

    soldiers.forEach(s => {
        const onLeave = leaves.some(l => l.soldierId === s.id && isCurrentlyOnLeave(l));
        const rotGroup = getRotationGroupForSoldier(s.id);
        const rotStatus = rotGroup ? getRotationStatus(rotGroup, new Date()) : null;
        const isHome = onLeave || (rotStatus && !rotStatus.inBase) || s.notArrived;
        const returning = leaves.some(l => l.soldierId === s.id && l.endDate === todayStr);
        const leaving = leaves.some(l => l.soldierId === s.id && l.startDate === todayStr);

        if (isHome) {
            atHome.push(s);
            if (returning) returningToday.push(s);
        } else {
            inBase.push(s);
            if (leaving) leavingToday.push(s);
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
    container.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <h2 style="margin:0;font-size:1.3em;">תצוגת מ"פ - ${comp.name}</h2>
            <div style="display:flex;align-items:center;gap:10px;">
                <button class="btn btn-sm" onclick="toggleCompanyView('${compKey}')" style="background:var(--primary);color:white;">חזרה לניהול</button>
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
            <div style="background:var(--card);border-radius:var(--radius);padding:14px;text-align:center;box-shadow:var(--shadow);border-top:3px solid #FF7043;">
                <div style="font-size:1.6em;font-weight:700;color:#FF7043;">${leavingToday.length}</div>
                <div style="font-size:0.82em;color:var(--text-light);">יוצאים היום</div>
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

        ${leavingToday.length > 0 ? `
        <div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title">
                <div class="icon" style="background:#fbe9e7;color:#FF7043;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg>
                </div>
                יוצאים היום (${leavingToday.length})
            </div>
            <div class="personnel-grid">${leavingToday.map(s => cmdSoldierCard(s, 'leaving')).join('')}</div>
        </div>` : ''}

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
    const cls = status === 'home' ? 'on-leave' : status === 'returning' ? 'on-duty' : status === 'leaving' ? 'on-leave' : '';
    const badge = status === 'home' ? 'status-on-leave' : status === 'returning' ? 'status-on-duty' : status === 'leaving' ? 'status-on-leave' : 'status-available';
    const txt = status === 'home' ? 'בבית' : status === 'returning' ? 'חוזר היום' : status === 'leaving' ? 'יוצא היום' : 'ללא שיבוץ';
    return `<div class="person-card ${cls}">
        <div class="person-info">
            <h4>${esc(s.name)}</h4>
            <div class="meta">${esc(s.role || '')}${s.rank ? ' | '+esc(s.rank) : ''}${s.phone ? ' | '+esc(s.phone) : ''}</div>
        </div>
        <div style="display:flex;align-items:center;gap:6px;">
            <span class="person-status ${badge}">${txt}</span>
            ${s.phone ? `<a href="https://wa.me/972${s.phone.replace(/^0/,'')}" target="_blank" class="btn btn-icon btn-sm" style="background:#25D366;color:white;" title="WhatsApp">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/></svg>
            </a>` : ''}
        </div>
    </div>`;
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
                        `<option value="${esc(s.phone)}">${esc(s.name)} | ${esc(s.phone)}</option>`
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
    if (allCompanyKeys().includes(tab)) {
        companyViewMode[tab] = 'manage';
        renderCompanyTab(tab);
    }
    if (tab === 'calendar') renderCalendar();
    if (tab === 'reports') { /* Static tab, no render needed */ }
    if (tab === 'morningreport') generateMorningReport();
    if (tab === 'rollcall') renderReport1();
    if (tab === 'announcements') renderAnnouncements();
    if (tab === 'rotation') renderRotationTab();
    if (tab === 'equipment') { renderEquipmentTab(); switchEquipmentSubTab(equipmentSubTab); }
    if (tab === 'weapons') { syncWeaponsEasyDoStatus(true).then(() => renderWeaponsTab()); renderWeaponsTab(); }
    if (tab === 'training') renderTrainingTab();
    if (tab === 'settings') renderSettingsTab();
    if (tab === 'whatsapp') renderWhatsAppCenter();


    // Close sidebar on mobile after tab switch
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
        document.body.classList.remove('sidebar-open');
    }
    setTimeout(refreshIcons, 50);
}

// ==================== SERVICE PERIODS (פיצול) ====================
function addServicePeriodRow(start, end) {
    const container = document.getElementById('servicePeriodsContainer');
    const idx = container.children.length;
    const div = document.createElement('div');
    div.className = 'service-period-row';
    div.style.cssText = 'display:flex;gap:8px;align-items:center;margin-bottom:6px;';
    div.innerHTML = `
        <input type="date" class="sp-start" value="${start || settings.operationStartDate || ''}" style="flex:1;">
        <span>עד</span>
        <input type="date" class="sp-end" value="${end || settings.operationEndDate || ''}" style="flex:1;">
        <button type="button" onclick="this.parentElement.remove()" style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.2em;padding:2px 6px;">✕</button>
    `;
    container.appendChild(div);
}

function renderServicePeriods(periods) {
    const container = document.getElementById('servicePeriodsContainer');
    container.innerHTML = '';
    if (!periods || periods.length === 0) {
        addServicePeriodRow();
    } else {
        periods.forEach(p => addServicePeriodRow(p.start, p.end));
    }
}

function getServicePeriodsFromForm() {
    const rows = document.querySelectorAll('#servicePeriodsContainer .service-period-row');
    const periods = [];
    rows.forEach(row => {
        const start = row.querySelector('.sp-start').value;
        const end = row.querySelector('.sp-end').value;
        if (start || end) periods.push({ start: start || '', end: end || '' });
    });
    return periods;
}

function isSoldierActiveOnDate(soldier, dateStr) {
    if (!soldier.servicePeriods || soldier.servicePeriods.length === 0) return true;
    return soldier.servicePeriods.some(p => {
        const afterStart = !p.start || dateStr >= p.start;
        const beforeEnd = !p.end || dateStr <= p.end;
        return afterStart && beforeEnd;
    });
}

// ==================== SOLDIER ====================
function openAddSoldier(company) {
    document.getElementById('soldierModalTitle').textContent = 'הוספת חייל';
    document.getElementById('soldierEditId').value = '';
    document.getElementById('soldierCompany').value = company || 'a';
    updateSoldierUnits();
    document.getElementById('soldierFirstName').value = '';
    document.getElementById('soldierLastName').value = '';
    document.getElementById('soldierId').value = '';
    document.getElementById('soldierPhone').value = '';
    document.getElementById('soldierRank').value = 'טוראי';
    document.getElementById('soldierRole').value = 'לוחם';
    document.getElementById('soldierShoeSize').value = '';
    document.getElementById('soldierShirtSize').value = '';
    document.getElementById('soldierPantsSize').value = '';
    document.getElementById('soldierNotes').value = '';
    renderServicePeriods([]);
    openModal('addSoldierModal');
    setTimeout(() => document.getElementById('soldierFirstName').focus(), 100);
}

let _returnToSignAfterSave = false;

function openAddSoldierFromSign() {
    _returnToSignAfterSave = true;
    const compSel = document.getElementById('signCompany');
    const company = compSel && compSel.value !== 'all' ? compSel.value : 'a';
    closeModal('signEquipmentModal');
    setTimeout(() => openAddSoldier(company), 150);
}

function openSoldierProfile(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (!sol) return;
    const container = document.getElementById('soldierProfileContent');
    if (!container) return;
    document.getElementById('profileTitle').textContent = `כרטיס חייל - ${sol.name}`;

    const compNames = getCompNames();
    const todayStr = localToday();

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
            ${sol.shoeSize ? `<div class="sp-info-item"><span class="sp-label">מידת נעליים</span><span class="sp-value">${esc(sol.shoeSize)}</span></div>` : ''}
            ${sol.shirtSize ? `<div class="sp-info-item"><span class="sp-label">מידת חולצה</span><span class="sp-value">${esc(sol.shirtSize)}</span></div>` : ''}
            ${sol.pantsSize ? `<div class="sp-info-item"><span class="sp-label">מידת מכנס</span><span class="sp-value">${esc(sol.pantsSize)}</span></div>` : ''}
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
        ${sol.phone ? `<a class="btn btn-sm" style="background:#25D366;color:white;text-decoration:none;" href="https://wa.me/${sol.phone.replace(/[^0-9]/g,'').replace(/^0/,'972')}" target="_blank">WhatsApp</a>` : ''}
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
    // Split name into first/last
    const nameParts = (sol.name || '').split(' ');
    document.getElementById('soldierFirstName').value = nameParts[0] || '';
    document.getElementById('soldierLastName').value = nameParts.slice(1).join(' ') || '';
    document.getElementById('soldierId').value = sol.personalId || '';
    document.getElementById('soldierRank').value = sol.rank || 'טוראי';
    document.getElementById('soldierCompany').value = sol.company;
    updateSoldierUnits();
    document.getElementById('soldierUnit').value = sol.unit || '';
    document.getElementById('soldierRole').value = sol.role || 'לוחם';
    document.getElementById('soldierPhone').value = sol.phone || '';
    document.getElementById('soldierShoeSize').value = sol.shoeSize || '';
    document.getElementById('soldierShirtSize').value = sol.shirtSize || '';
    document.getElementById('soldierPantsSize').value = sol.pantsSize || '';
    document.getElementById('soldierNotes').value = sol.notes || '';
    renderServicePeriods(sol.servicePeriods || []);
    openModal('addSoldierModal');
}

function saveSoldier() {
    const firstName = document.getElementById('soldierFirstName').value.trim();
    const lastName = document.getElementById('soldierLastName').value.trim();
    if (!firstName || !lastName) { showToast('יש להזין שם פרטי ושם משפחה', 'error'); return; }
    const name = firstName + ' ' + lastName;

    const editId = document.getElementById('soldierEditId').value;
    const company = document.getElementById('soldierCompany').value;
    if (!canEditSoldierDetails(company)) { showToast('אין הרשאה לערוך חיילים בפלוגה זו', 'error'); return; }

    const unit = document.getElementById('soldierUnit').value;

    if (editId) {
        // Edit existing soldier
        const sol = state.soldiers.find(s => s.id === editId);
        if (sol) {
            sol.name = name;
            sol.personalId = document.getElementById('soldierId').value.trim();
            sol.rank = document.getElementById('soldierRank').value;
            sol.company = company;
            sol.unit = unit;
            sol.role = document.getElementById('soldierRole').value;
            sol.phone = document.getElementById('soldierPhone').value.trim();
            sol.shoeSize = document.getElementById('soldierShoeSize').value;
            sol.shirtSize = document.getElementById('soldierShirtSize').value;
            sol.pantsSize = document.getElementById('soldierPantsSize').value;
            sol.notes = document.getElementById('soldierNotes').value.trim();
            sol.servicePeriods = getServicePeriodsFromForm();
            // If all service periods removed → mark as not arrived
            if (sol.servicePeriods.length === 0 && !sol.notArrived) {
                sol.notArrived = true;
                state.shifts.forEach(sh => { sh.soldiers = sh.soldiers.filter(sid => sid !== editId); });
            }
            saveState();
            closeModal('addSoldierModal');
            renderCompanyTab(company);
            renderOverview();
            renderDashboard();
            updateGlobalStats();
            showToast(sol.notArrived ? `${name} סומן כלא מגיע למילואים` : `${name} עודכן בהצלחה`);
        }
    } else {
        // Add new soldier
        const soldier = {
            id: 'sol_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
            name,
            personalId: document.getElementById('soldierId').value.trim(),
            rank: document.getElementById('soldierRank').value,
            company,
            unit,
            role: document.getElementById('soldierRole').value,
            phone: document.getElementById('soldierPhone').value.trim(),
            shoeSize: document.getElementById('soldierShoeSize').value,
            shirtSize: document.getElementById('soldierShirtSize').value,
            pantsSize: document.getElementById('soldierPantsSize').value,
            notes: document.getElementById('soldierNotes').value.trim(),
            servicePeriods: getServicePeriodsFromForm()
        };
        state.soldiers.push(soldier);
        saveState();
        closeModal('addSoldierModal');
        renderCompanyTab(company);
        renderOverview();
        updateGlobalStats();
        showToast(`${name} נוסף בהצלחה`);

        // If came from sign equipment modal, return there with new soldier selected
        if (_returnToSignAfterSave) {
            _returnToSignAfterSave = false;
            setTimeout(() => {
                openSignEquipment();
                setTimeout(() => {
                    const compSel = document.getElementById('signCompany');
                    if (compSel) { compSel.value = company; updateSignSoldiers(); }
                    setTimeout(() => {
                        const solSel = document.getElementById('signSoldier');
                        if (solSel) { solSel.value = soldier.id; onSignSoldierSelect(); }
                    }, 100);
                }, 100);
            }, 200);
        }
    }
}

async function toggleNotArrived(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;
    if (!canEditSoldierDetails(sol.company)) { showToast('אין הרשאה', 'error'); return; }

    if (!sol.notArrived) {
        if (!await customConfirm(`לסמן את ${sol.name} כלא מגיע למילואים?`)) return;
        sol.notArrived = true;
        state.shifts.forEach(sh => { sh.soldiers = sh.soldiers.filter(sid => sid !== soldierId); });
        showToast(`${sol.name} סומן כלא מגיע למילואים`);
    } else {
        sol.notArrived = false;
        showToast(`${sol.name} סומן כמגיע למילואים`);
    }

    saveState();
    renderCompanyTab(sol.company);
    renderOverview();
    renderDashboard();
    updateGlobalStats();
}

async function deleteSoldier(id) {
    const sol = state.soldiers.find(s => s.id === id);
    if (sol && !canEditSoldierDetails(sol.company)) { showToast('אין הרשאה', 'error'); return; }
    if (CONFIG.skipPassword && id.startsWith('demo_')) { showToast('לא ניתן למחוק נתוני דמו', 'error'); return; }
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
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level >= PERM.OFFICER) return currentUser.unit === fromComp || currentUser.unit === toComp;
    return false;
}

function openTransferSoldier(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    if (!canEditSoldierDetails(sol.company)) {
        showToast('אין הרשאה להעביר חייל זה', 'error');
        return;
    }

    document.getElementById('transferSoldierId').value = soldierId;
    const compNames = getCompNames();
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
    if (rotGroup) warnings.push(`החייל יוסר מקבוצת רוטציה "${esc(rotGroup.name)}"`);

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

    const compNames = getCompNames();
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
    const tasks = (companyData[company] && companyData[company].tasks) || [];
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
                let label = esc(s.name);
                let badge = '';
                if (status.onLeave) {
                    badge = '<span class="badge-sm" style="background:#fce4ec;color:#c62828;">בבית</span>';
                } else if (status.assignedTo) {
                    badge = `<span class="badge-sm" style="background:#fff3e0;color:#e65100;">${esc(status.assignedTo)}</span>`;
                } else {
                    badge = `<span class="badge-sm">${esc(s.role || '')}</span>`;
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
    const soldier = state.soldiers.find(s => s.id === soldierId);
    // Check notArrived
    if (soldier && soldier.notArrived) {
        return { available: false, onLeave: false, assignedTo: 'לא הגיע למילואים' };
    }
    // Check service periods (פיצול)
    if (soldier && !isSoldierActiveOnDate(soldier, date)) {
        return { available: false, onLeave: false, assignedTo: 'מחוץ לתקופת שירות' };
    }

    // Check constraints
    const hasConstraint = state.constraints && state.constraints.some(c =>
        c.soldierId === soldierId && date >= c.startDate && date <= c.endDate
    );
    if (hasConstraint) return { available: false, onLeave: false, assignedTo: 'אילוץ' };

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
    // Check if the date falls within the leave period (day-level comparison)
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59');
    const leaveStart = new Date(`${leave.startDate}T${leave.startTime || '00:00'}`);
    const leaveEnd = new Date(`${leave.endDate}T${leave.endTime || '23:59'}`);
    // Overlap: leave started before day ends AND leave ends after day starts
    return leaveStart <= dayEnd && leaveEnd >= dayStart;
}

// ==================== CONSTRAINTS (אילוצים) ====================
function openConstraints(compKey) {
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const select = document.getElementById('constraintSoldier');
    select.innerHTML = '<option value="">-- בחר חייל --</option>';
    soldiers.sort((a, b) => a.name.localeCompare(b.name, 'he')).forEach(s => {
        select.innerHTML += `<option value="${s.id}">${esc(s.name)}</option>`;
    });
    document.getElementById('constraintStart').value = '';
    document.getElementById('constraintEnd').value = '';
    document.getElementById('constraintReason').value = '';
    document.getElementById('constraintsTitle').textContent = `אילוצים — ${compName(compKey)}`;
    renderConstraintsList(compKey);
    openModal('constraintsModal');
    document.getElementById('constraintsModal').dataset.company = compKey;
}

function addConstraint() {
    const compKey = document.getElementById('constraintsModal').dataset.company;
    const soldierId = document.getElementById('constraintSoldier').value;
    const startDate = document.getElementById('constraintStart').value;
    const endDate = document.getElementById('constraintEnd').value;
    const reason = document.getElementById('constraintReason').value.trim();
    if (!soldierId) { showToast('יש לבחור חייל', 'error'); return; }
    if (!startDate || !endDate) { showToast('יש לבחור תאריכים', 'error'); return; }
    if (startDate > endDate) { showToast('תאריך התחלה חייב להיות לפני תאריך סיום', 'error'); return; }

    const constraint = {
        id: 'con_' + Date.now(),
        soldierId, startDate, endDate, reason,
        createdBy: currentUser ? currentUser.name : ''
    };
    state.constraints.push(constraint);

    // Auto-log to announcements when constraint added by מ"כ/סמל (levels 2-3)
    const level = getUserPermissionLevel();
    if (level === PERM.MASHAK || level === PERM.SAMAL) {
        const soldierName = state.soldiers.find(s => s.id === soldierId)?.name || soldierId;
        if (!state.announcements) state.announcements = [];
        state.announcements.push({
            id: 'ann_' + Date.now(),
            title: `אילוץ חדש — ${soldierName}`,
            body: `${currentUser.name} הוסיף/ה אילוץ ל${soldierName}: ${reason || 'ללא סיבה'} (${startDate} עד ${endDate})`,
            priority: 'normal',
            author: currentUser.name,
            timestamp: Date.now(),
            autoGenerated: true
        });
    }

    // Check if soldier is assigned to shifts in this period
    const affectedShifts = state.shifts.filter(sh =>
        sh.soldiers.includes(soldierId) && sh.date >= startDate && sh.date <= endDate
    );

    if (affectedShifts.length > 0) {
        const soldierName2 = state.soldiers.find(s => s.id === soldierId)?.name || '';
        showReplacementSuggestions(affectedShifts, soldierId, soldierName2, compKey);
    }

    saveState();
    renderConstraintsList(compKey);
    document.getElementById('constraintSoldier').value = '';
    document.getElementById('constraintStart').value = '';
    document.getElementById('constraintEnd').value = '';
    document.getElementById('constraintReason').value = '';
    showToast('אילוץ נוסף בהצלחה');
}

function deleteConstraint(id) {
    const compKey = document.getElementById('constraintsModal').dataset.company;
    state.constraints = state.constraints.filter(c => c.id !== id);
    saveState();
    renderConstraintsList(compKey);
    showToast('אילוץ הוסר');
}

function renderConstraintsList(compKey) {
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const solIds = new Set(soldiers.map(s => s.id));
    const constraints = state.constraints.filter(c => solIds.has(c.soldierId));
    const container = document.getElementById('constraintsList');
    if (constraints.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:20px;">אין אילוצים פעילים</div>';
        return;
    }
    container.innerHTML = `<table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:var(--bg);"><th style="padding:8px;text-align:right;">חייל</th><th>מתאריך</th><th>עד תאריך</th><th>סיבה</th><th>נוצר ע"י</th><th></th></tr></thead>
        <tbody>${constraints.map(c => {
            const sol = state.soldiers.find(s => s.id === c.soldierId);
            return `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:8px;">${sol ? esc(sol.name) : '?'}</td>
                <td style="padding:8px;">${formatDate(c.startDate)}</td>
                <td style="padding:8px;">${formatDate(c.endDate)}</td>
                <td style="padding:8px;">${esc(c.reason || '')}</td>
                <td style="padding:8px;font-size:0.85em;">${esc(c.createdBy || '')}</td>
                <td style="padding:8px;"><button class="btn btn-sm" style="background:var(--danger);color:white;padding:2px 8px;" onclick="deleteConstraint('${c.id}')">מחק</button></td>
            </tr>`;
        }).join('')}</tbody>
    </table>`;
}

function findReplacementSoldiers(compKey, date, startTime, endTime, role) {
    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const available = [];
    soldiers.forEach(s => {
        const status = getSoldierShiftStatus(s.id, date, startTime, endTime);
        if (!status.available) return;
        if (!isSoldierActiveOnDate(s, date)) return;
        // Count how many shifts this soldier had recently (fairness)
        const recentShifts = state.shiftHistory ? state.shiftHistory.filter(h => h.soldierId === s.id).length : 0;
        available.push({ soldier: s, recentShifts });
    });
    // Sort by fairness (fewer shifts first), then matching role
    available.sort((a, b) => {
        const roleMatchA = role && a.soldier.role === role ? -1 : 0;
        const roleMatchB = role && b.soldier.role === role ? -1 : 0;
        if (roleMatchA !== roleMatchB) return roleMatchA - roleMatchB;
        return a.recentShifts - b.recentShifts;
    });
    return available.map(a => a.soldier);
}

function showReplacementSuggestions(affectedShifts, removedSoldierId, soldierName, compKey) {
    let html = `<div style="margin-bottom:12px;padding:10px;background:#fff3e0;border-radius:var(--radius);border-right:4px solid #ff9800;">
        <strong>${esc(soldierName)}</strong> משובץ ב-${affectedShifts.length} משמרות בטווח האילוץ.
    </div>`;

    affectedShifts.forEach(sh => {
        const replacements = findReplacementSoldiers(compKey, sh.date, sh.startTime, sh.endTime, null);
        const top3 = replacements.slice(0, 5);
        html += `<div style="margin-bottom:12px;padding:10px;background:var(--bg);border-radius:var(--radius);">
            <div style="font-weight:600;margin-bottom:6px;">${esc(sh.task)} — ${formatDate(sh.date)} ${sh.startTime}-${sh.endTime}</div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                <button class="btn btn-sm" style="background:var(--danger);color:white;" onclick="removeFromShift('${sh.id}','${removedSoldierId}')">הסר בלי מחליף</button>
                ${top3.map(s => `<button class="btn btn-sm" style="background:var(--success);color:white;" onclick="replaceInShift('${sh.id}','${removedSoldierId}','${s.id}')">${esc(s.name)}</button>`).join('')}
            </div>
        </div>`;
    });

    document.getElementById('replacementContent').innerHTML = html;
    openModal('replacementModal');
}

function removeFromShift(shiftId, soldierId) {
    const sh = state.shifts.find(s => s.id === shiftId);
    if (!sh) return;
    sh.soldiers = sh.soldiers.filter(id => id !== soldierId);
    if (sh.taskCommander === soldierId) sh.taskCommander = '';
    saveState();
    showToast('חייל הוסר מהמשמרת');
    // Refresh replacement modal if still open
    const compKey = document.getElementById('constraintsModal').dataset.company;
    if (compKey) renderCompanyTab(compKey);
}

function replaceInShift(shiftId, oldSoldierId, newSoldierId) {
    const sh = state.shifts.find(s => s.id === shiftId);
    if (!sh) return;
    if (!Array.isArray(sh.soldiers)) sh.soldiers = [];
    const idx = sh.soldiers.indexOf(oldSoldierId);
    if (idx >= 0) sh.soldiers[idx] = newSoldierId;
    else sh.soldiers.push(newSoldierId);
    if (sh.taskCommander === oldSoldierId) sh.taskCommander = newSoldierId;
    // Record in shift history
    if (state.shiftHistory) {
        state.shiftHistory.push({
            soldierId: newSoldierId,
            date: sh.date,
            task: sh.task,
            shiftType: sh.startTime < '12:00' ? 'morning' : sh.startTime < '18:00' ? 'afternoon' : 'night',
            company: sh.company
        });
    }
    saveState();
    const newName = state.soldiers.find(s => s.id === newSoldierId)?.name || '';
    showToast(`${newName} הוחלף בהצלחה`);
    const compKey = document.getElementById('constraintsModal').dataset.company;
    if (compKey) renderCompanyTab(compKey);
}

// ==================== AUTO SCHEDULE ENGINE ====================
let _autoScheduleProposal = null;
let _autoScheduleCompany = null;

function openAutoSchedule(compKey) {
    _autoScheduleCompany = compKey;
    _autoScheduleProposal = null;
    // Default: tomorrow to end of week
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const endWeek = new Date(tomorrow); endWeek.setDate(endWeek.getDate() + (6 - endWeek.getDay()));
    document.getElementById('autoSchedStart').value = tomorrow.toISOString().slice(0, 10);
    document.getElementById('autoSchedEnd').value = endWeek.toISOString().slice(0, 10);
    document.getElementById('autoSchedPreview').innerHTML = '<div style="text-align:center;color:var(--text-light);padding:40px;">בחר טווח תאריכים ולחץ "הצע שיבוץ"</div>';
    document.getElementById('autoSchedFooter').style.display = 'none';
    document.getElementById('autoScheduleTitle').textContent = `שיבוץ אוטומטי — ${compName(compKey)}`;
    openModal('autoScheduleModal');
}

function runAutoSchedule() {
    const compKey = _autoScheduleCompany;
    const startDate = document.getElementById('autoSchedStart').value;
    const endDate = document.getElementById('autoSchedEnd').value;
    if (!startDate || !endDate) { showToast('יש לבחור תאריכים', 'error'); return; }
    if (startDate > endDate) { showToast('תאריך התחלה חייב להיות לפני סיום', 'error'); return; }

    const proposal = generateScheduleProposal(compKey, startDate, endDate);
    _autoScheduleProposal = proposal;
    renderScheduleProposal(proposal);
    document.getElementById('autoSchedFooter').style.display = '';
}

function generateScheduleProposal(compKey, startDate, endDate) {
    const comp = companyData[compKey];
    if (!comp || !comp.tasks || comp.tasks.length === 0) return [];

    const soldiers = state.soldiers.filter(s => s.company === compKey);
    const proposal = []; // Array of { date, tasks: [{ task, shifts: [{ shiftName, startTime, endTime, soldiers: [id], warnings: [] }] }] }

    // Track assignments for fairness
    const assignmentCount = {};
    soldiers.forEach(s => { assignmentCount[s.id] = 0; });
    // Pre-count from history
    if (state.shiftHistory) {
        state.shiftHistory.forEach(h => {
            if (assignmentCount[h.soldierId] !== undefined) assignmentCount[h.soldierId]++;
        });
    }

    // Track last shift type for rotation
    const lastShiftType = {};

    // Shift time definitions
    const shiftTimes = {
        3: [
            { name: 'בוקר', start: '06:00', end: '14:00' },
            { name: 'צהריים', start: '14:00', end: '22:00' },
            { name: 'לילה', start: '22:00', end: '06:00' }
        ],
        2: [
            { name: 'יום', start: '06:00', end: '18:00' },
            { name: 'לילה', start: '18:00', end: '06:00' }
        ],
        1: [
            { name: 'יום שלם', start: '06:00', end: '22:00' }
        ]
    };

    // Role classification
    const isOfficer = (s) => ['קצין', 'מ"פ', 'סמ"פ', 'סרס"פ', 'רס"פ'].some(r => (s.role || '').includes(r));
    const isCommander = (s) => ['מפקד', 'מ"כ', 'מ"מ', 'סמל', 'סמב"צ'].some(r => (s.role || '').includes(r));
    const isSoldier = (s) => !isOfficer(s) && !isCommander(s);

    // Medic check
    const isMedic = (s) => (s.role || '').includes('חובש') || (s.role || '').includes('רופא');

    // Track used soldiers per day-shift to avoid double booking
    const usedMap = {}; // key: date+startTime+endTime => Set of soldier ids

    function getUsedKey(date, start, end) { return `${date}_${start}_${end}`; }

    function markUsed(date, start, end, solId) {
        const key = getUsedKey(date, start, end);
        if (!usedMap[key]) usedMap[key] = new Set();
        usedMap[key].add(solId);
    }

    function isUsed(date, start, end, solId) {
        const key = getUsedKey(date, start, end);
        return usedMap[key] && usedMap[key].has(solId);
    }

    // Check if soldier has enough rest since a shift
    function hasEnoughRest(solId, date, startTime) {
        // Simple check: don't assign to morning if did night before
        const prevDate = new Date(date + 'T00:00:00');
        prevDate.setDate(prevDate.getDate() - 1);
        const prevDateStr = prevDate.toISOString().slice(0, 10);
        const nightKey = getUsedKey(prevDateStr, '22:00', '06:00');
        if (usedMap[nightKey] && usedMap[nightKey].has(solId) && startTime < '14:00') return false;
        return true;
    }

    // Initiative team members locked
    const initiativeLocked = new Set();
    if (state.initiativeTeams) {
        state.initiativeTeams.forEach(team => {
            (team.soldiers || []).forEach(id => initiativeLocked.add(id));
            if (team.officerId) initiativeLocked.add(team.officerId);
            if (team.ncoId) initiativeLocked.add(team.ncoId);
        });
    }

    // Generate dates
    const dates = [];
    let d = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    while (d <= end) {
        dates.push(d.toISOString().slice(0, 10));
        d.setDate(d.getDate() + 1);
    }

    // Check if soldier leaving tomorrow
    function isLeavingTomorrow(solId, date) {
        const tomorrow = new Date(date + 'T00:00:00');
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toISOString().slice(0, 10);
        return state.leaves.some(l => l.soldierId === solId && l.startDate === tomorrowStr);
    }

    // Pick best soldier for a role
    function pickSoldier(date, startTime, endTime, roleFilter, taskName) {
        const eligible = soldiers.filter(s => {
            if (!isSoldierActiveOnDate(s, date)) return false;
            if (isUsed(date, startTime, endTime, s.id)) return false;
            if (initiativeLocked.has(s.id)) return false;
            if (!hasEnoughRest(s.id, date, startTime)) return false;
            // Check existing shift status
            const status = getSoldierShiftStatus(s.id, date, startTime, endTime);
            if (!status.available) return false;
            // Role filter
            if (roleFilter === 'officer' && !isOfficer(s)) return false;
            if (roleFilter === 'commander' && !isCommander(s)) return false;
            if (roleFilter === 'soldier' && !isSoldier(s)) return false;
            // Officers/commanders not in kitchen
            if (taskName.includes('מטבח') && (isOfficer(s) || isCommander(s))) return false;
            // Officers/commanders not in bunker
            if (taskName.includes('בונקר') && (isOfficer(s) || isCommander(s))) return false;
            // Medics only in חפ"ק and יזומות
            if (isMedic(s) && !taskName.includes('חפ') && !taskName.includes('יזומ')) return false;
            return true;
        });

        // Sort by fairness + pre-leave night preference
        eligible.sort((a, b) => {
            // Pre-leave soldiers prefer night
            if (startTime >= '22:00') {
                const aLeaving = isLeavingTomorrow(a.id, date) ? -1 : 0;
                const bLeaving = isLeavingTomorrow(b.id, date) ? -1 : 0;
                if (aLeaving !== bLeaving) return aLeaving - bLeaving;
            }
            return (assignmentCount[a.id] || 0) - (assignmentCount[b.id] || 0);
        });

        if (eligible.length === 0) return null;
        const picked = eligible[0];
        markUsed(date, startTime, endTime, picked.id);
        assignmentCount[picked.id] = (assignmentCount[picked.id] || 0) + 1;
        return picked.id;
    }

    // Process each date
    dates.forEach(date => {
        const dayProposal = { date, tasks: [] };

        comp.tasks.forEach(task => {
            const shifts = shiftTimes[task.shifts] || shiftTimes[1];
            const taskProposal = { task: task.name, shifts: [] };

            shifts.forEach(shift => {
                const shiftProposal = {
                    shiftName: shift.name,
                    startTime: shift.start,
                    endTime: shift.end,
                    soldiers: [],
                    warnings: []
                };

                // Pick officers
                for (let i = 0; i < (task.perShift?.officers || 0); i++) {
                    const id = pickSoldier(date, shift.start, shift.end, 'officer', task.name);
                    if (id) shiftProposal.soldiers.push(id);
                    else shiftProposal.warnings.push('חסר קצין');
                }

                // Pick commanders
                for (let i = 0; i < (task.perShift?.commanders || 0); i++) {
                    const id = pickSoldier(date, shift.start, shift.end, 'commander', task.name);
                    if (id) shiftProposal.soldiers.push(id);
                    else shiftProposal.warnings.push('חסר מפקד');
                }

                // Pick soldiers
                for (let i = 0; i < (task.perShift?.soldiers || 0); i++) {
                    const id = pickSoldier(date, shift.start, shift.end, 'soldier', task.name);
                    if (id) shiftProposal.soldiers.push(id);
                    else shiftProposal.warnings.push('חסר חייל');
                }

                taskProposal.shifts.push(shiftProposal);
            });

            dayProposal.tasks.push(taskProposal);
        });

        proposal.push(dayProposal);
    });

    return proposal;
}

function renderScheduleProposal(proposal) {
    const container = document.getElementById('autoSchedPreview');
    if (!proposal || proposal.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:var(--text-light);padding:40px;">לא נמצאו משימות לשיבוץ</div>';
        return;
    }

    let html = '';
    proposal.forEach((day, dayIdx) => {
        html += `<div style="margin-bottom:20px;">
            <h4 style="margin:0 0 8px;padding:8px 12px;background:var(--primary);color:white;border-radius:var(--radius) var(--radius) 0 0;">${formatDate(day.date)} — ${getDayName(day.date)}</h4>
            <div style="overflow-x:auto;">
            <table style="width:100%;border-collapse:collapse;font-size:0.88em;">
                <thead><tr style="background:var(--bg);"><th style="padding:6px 8px;text-align:right;">משימה</th><th>משמרת</th><th>שעות</th><th>משובצים</th><th>אזהרות</th></tr></thead>
                <tbody>`;

        day.tasks.forEach((task, taskIdx) => {
            task.shifts.forEach((shift, shiftIdx) => {
                const soldierNames = shift.soldiers.map(id => {
                    const s = state.soldiers.find(x => x.id === id);
                    return s ? esc(s.name) : '?';
                });
                const warningClass = shift.warnings.length > 0 ? 'background:#fff3e0;' : '';
                const errorClass = shift.soldiers.length === 0 && (shift.warnings.length > 0) ? 'background:#ffebee;' : '';

                html += `<tr style="border-bottom:1px solid var(--border);${warningClass}${errorClass}">
                    <td style="padding:6px 8px;font-weight:600;">${esc(task.task)}</td>
                    <td style="padding:6px 8px;">${esc(shift.shiftName)}</td>
                    <td style="padding:6px 8px;">${shift.startTime}-${shift.endTime}</td>
                    <td style="padding:6px 8px;">
                        ${soldierNames.map((name, solIdx) => `<span class="badge" style="margin:2px;display:inline-flex;align-items:center;gap:4px;">${name}
                            <button style="background:none;border:none;cursor:pointer;color:var(--danger);font-size:0.9em;padding:0 2px;" onclick="swapSoldierInProposal(${dayIdx},${taskIdx},${shiftIdx},${solIdx})">&#x21c4;</button>
                        </span>`).join('')}
                    </td>
                    <td style="padding:6px 8px;color:var(--danger);font-size:0.85em;">${shift.warnings.join(', ')}</td>
                </tr>`;
            });
        });

        html += `</tbody></table></div></div>`;
    });

    // Summary
    let totalSlots = 0, filledSlots = 0, warnings = 0;
    proposal.forEach(day => day.tasks.forEach(task => task.shifts.forEach(shift => {
        totalSlots += shift.soldiers.length + shift.warnings.length;
        filledSlots += shift.soldiers.length;
        warnings += shift.warnings.length;
    })));

    html = `<div style="display:flex;gap:16px;margin-bottom:16px;flex-wrap:wrap;">
        <div style="padding:10px 16px;background:#e8f5e9;border-radius:var(--radius);"><strong>${filledSlots}</strong> משובצים</div>
        <div style="padding:10px 16px;background:${warnings > 0 ? '#fff3e0' : '#e8f5e9'};border-radius:var(--radius);"><strong>${warnings}</strong> חריגות</div>
        <div style="padding:10px 16px;background:var(--bg);border-radius:var(--radius);"><strong>${proposal.length}</strong> ימים</div>
    </div>` + html;

    container.innerHTML = html;
}

function getDayName(dateStr) {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return 'יום ' + days[new Date(dateStr + 'T12:00:00').getDay()];
}

function swapSoldierInProposal(dayIdx, taskIdx, shiftIdx, solIdx) {
    if (!_autoScheduleProposal) return;
    const shift = _autoScheduleProposal[dayIdx]?.tasks[taskIdx]?.shifts[shiftIdx];
    if (!shift) return;
    const day = _autoScheduleProposal[dayIdx];
    const currentId = shift.soldiers[solIdx];

    // Find available replacements
    const available = findReplacementSoldiers(_autoScheduleCompany, day.date, shift.startTime, shift.endTime, null);
    const filtered = available.filter(s => s.id !== currentId && !shift.soldiers.includes(s.id));

    if (filtered.length === 0) {
        showToast('אין חיילים זמינים להחלפה', 'error');
        return;
    }

    // Show a quick select
    const currentName = state.soldiers.find(s => s.id === currentId)?.name || '?';
    let html = `<div style="margin-bottom:12px;"><strong>החלף את ${esc(currentName)}:</strong></div>`;
    html += `<div style="display:flex;gap:6px;flex-wrap:wrap;">`;
    filtered.slice(0, 8).forEach(s => {
        html += `<button class="btn btn-sm" style="background:var(--primary);color:white;" onclick="doSwapInProposal(${dayIdx},${taskIdx},${shiftIdx},${solIdx},'${s.id}')">${esc(s.name)}</button>`;
    });
    html += `</div>`;

    document.getElementById('replacementContent').innerHTML = html;
    openModal('replacementModal');
}

function doSwapInProposal(dayIdx, taskIdx, shiftIdx, solIdx, newSoldierId) {
    if (!_autoScheduleProposal) return;
    _autoScheduleProposal[dayIdx].tasks[taskIdx].shifts[shiftIdx].soldiers[solIdx] = newSoldierId;
    closeModal('replacementModal');
    renderScheduleProposal(_autoScheduleProposal);
    showToast('חייל הוחלף בהצעה');
}

function approveScheduleProposal() {
    if (!_autoScheduleProposal || !_autoScheduleCompany) return;
    let count = 0;

    _autoScheduleProposal.forEach(day => {
        day.tasks.forEach(task => {
            task.shifts.forEach(shift => {
                if (shift.soldiers.length === 0) return;
                const shiftObj = {
                    id: 'sh_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                    company: _autoScheduleCompany,
                    task: task.task,
                    date: day.date,
                    shiftName: shift.shiftName,
                    startTime: shift.startTime,
                    endTime: shift.endTime,
                    soldiers: [...shift.soldiers],
                    taskCommander: shift.soldiers[0] || ''
                };
                state.shifts.push(shiftObj);

                // Record history
                if (!state.shiftHistory) state.shiftHistory = [];
                shift.soldiers.forEach(solId => {
                    state.shiftHistory.push({
                        soldierId: solId,
                        date: day.date,
                        task: task.task,
                        shiftType: shift.startTime < '12:00' ? 'morning' : shift.startTime < '18:00' ? 'afternoon' : 'night',
                        company: _autoScheduleCompany
                    });
                });
                count++;
            });
        });
    });

    saveState();
    closeModal('autoScheduleModal');
    renderCompanyTab(_autoScheduleCompany);
    showToast(`${count} שיבוצים נשמרו בהצלחה`, 'success');
    _autoScheduleProposal = null;
}

// ==================== INITIATIVE TEAMS (צוות יזומות) ====================
function getActiveInitiativeTeam(compKey) {
    if (!state.initiativeTeams) return null;
    const today = localToday();
    return state.initiativeTeams.find(t => t.company === compKey && t.startDate <= today && t.endDate >= today);
}

// ==================== TRAINING MODULE (אימונים) ====================
const DEFAULT_TRAINING_TYPES = [
    { id: 'squad_open', name: 'תרגיל כיתה שטח פתוח', type: 'boolean' },
    { id: 'squad_urban', name: 'תרגיל כיתה שטח בנוי', type: 'boolean' },
    { id: 'advanced_shooting', name: 'אימון ירי מתקדם', type: 'boolean' },
    { id: 'weapon_zero', name: 'בקרת איפוס נשק', type: 'date' },
    { id: 'grenade', name: 'אימון זריקת רימון', type: 'boolean' }
];

function getTrainingTypes() {
    return settings.trainingTypes || DEFAULT_TRAINING_TYPES;
}

let trainingCompanyFilter = 'all';

function renderTrainingTab() {
    const container = document.getElementById('content-training');
    if (!container) return;
    const canManage = currentUser && getUserPermissionLevel() >= PERM.FULL_ACCESS;
    const allTypes = getTrainingTypes();
    const isPalsamFilter = trainingCompanyFilter === 'palsam';

    // When palsam is selected, only show weapon_zero column; otherwise show all types
    const types = isPalsamFilter ? allTypes.filter(t => t.id === 'weapon_zero') : allTypes;

    // Filter soldiers — exclude palsam unless specifically filtering for palsam
    let soldiers = [...state.soldiers];
    if (trainingCompanyFilter === 'all') {
        soldiers = soldiers.filter(s => s.company !== 'palsam');
    } else {
        soldiers = soldiers.filter(s => s.company === trainingCompanyFilter);
    }
    soldiers.sort((a, b) => a.name.localeCompare(b.name, 'he'));

    // Stats
    const totalSoldiers = soldiers.length;
    const statsPerType = types.map(t => {
        const completed = soldiers.filter(s => {
            const rec = (state.training || []).find(r => r.soldierId === s.id && r.typeId === t.id);
            if (t.type === 'date') return rec && rec.date;
            return rec && rec.done;
        }).length;
        return { ...t, completed, pct: totalSoldiers > 0 ? Math.round(completed / totalSoldiers * 100) : 0 };
    });

    let html = `
        <div class="section-header">
            <div class="section-title" style="display:flex;align-items:center;gap:10px;">
                <img src="training-icon.png" width="18" height="18" style="opacity:0.85;" alt="">
                מעקב אימונים
            </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
            <select onchange="trainingCompanyFilter=this.value;renderTrainingTab()" style="padding:8px 14px;border-radius:var(--radius);border:2px solid var(--primary-light);background:var(--bg);color:var(--text);font-weight:600;font-size:0.9em;cursor:pointer;">
                <option value="all" ${trainingCompanyFilter === 'all' ? 'selected' : ''}>כל הגדוד</option>
                ${allCompanyKeys().map(k => `<option value="${k}" ${trainingCompanyFilter === k ? 'selected' : ''}>${compName(k)}</option>`).join('')}
            </select>
            ${isPalsamFilter ? '<span style="font-size:0.82em;color:var(--text-light);align-self:center;">פלח"ם — מוצג רק איפוס נשק</span>' : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px;margin-bottom:20px;">
            ${statsPerType.map(t => `
                <div class="training-card" style="text-align:center;">
                    <div style="font-size:0.82em;color:var(--text-light);margin-bottom:4px;">${esc(t.name)}</div>
                    <div style="font-size:1.8em;font-weight:700;color:${t.pct >= 80 ? 'var(--success)' : t.pct >= 50 ? '#ff9800' : 'var(--danger)'};">${t.pct}%</div>
                    <div style="font-size:0.78em;color:var(--text-light);">${t.completed}/${totalSoldiers}</div>
                </div>
            `).join('')}
        </div>`;

    // Table
    html += `<div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:0.88em;">
            <thead><tr style="background:var(--bg);">
                <th style="padding:8px;text-align:right;position:sticky;right:0;background:var(--bg);z-index:1;">חייל</th>
                <th style="padding:8px;text-align:right;">פלוגה</th>
                ${types.map(t => `<th style="padding:8px;text-align:center;">${esc(t.name)}</th>`).join('')}
            </tr></thead>
            <tbody>`;

    soldiers.forEach(s => {
        html += `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:6px 8px;position:sticky;right:0;background:var(--card);z-index:1;font-weight:500;">
                <a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a>
            </td>
            <td style="padding:6px 8px;font-size:0.85em;">${compName(s.company)}</td>`;

        types.forEach(t => {
            const rec = (state.training || []).find(r => r.soldierId === s.id && r.typeId === t.id);
            if (t.type === 'date') {
                const dateVal = rec ? rec.date || '' : '';
                html += `<td style="padding:4px 6px;text-align:center;">
                    <input type="date" value="${dateVal}" style="width:130px;font-size:0.85em;padding:2px 4px;border:1px solid var(--border);border-radius:6px;"
                        onchange="updateTraining('${s.id}','${t.id}','date',this.value)" ${canManage || canEditShifts(s.company) ? '' : 'disabled'}>
                </td>`;
            } else {
                const done = rec && rec.done;
                html += `<td style="padding:4px 6px;text-align:center;">
                    <input type="checkbox" ${done ? 'checked' : ''} style="width:18px;height:18px;accent-color:var(--success);"
                        onchange="updateTraining('${s.id}','${t.id}','boolean',this.checked)" ${canManage || canEditShifts(s.company) ? '' : 'disabled'}>
                </td>`;
            }
        });

        html += `</tr>`;
    });

    html += `</tbody></table></div>`;

    container.innerHTML = html;
}

function updateTraining(soldierId, typeId, type, value) {
    if (!state.training) state.training = [];
    let rec = state.training.find(r => r.soldierId === soldierId && r.typeId === typeId);
    if (!rec) {
        rec = { soldierId, typeId };
        state.training.push(rec);
    }
    if (type === 'date') {
        rec.date = value;
        rec.done = !!value;
    } else {
        rec.done = value;
    }
    saveState();
}

function addTrainingType() {
    if (!settings.trainingTypes) settings.trainingTypes = [...DEFAULT_TRAINING_TYPES];
    const id = 'custom_' + Date.now();
    settings.trainingTypes.push({ id, name: 'אימון חדש', type: 'boolean' });
    saveSettings();
    renderSettingsTab();
}

function removeTrainingType(idx) {
    if (!settings.trainingTypes) settings.trainingTypes = [...DEFAULT_TRAINING_TYPES];
    settings.trainingTypes.splice(idx, 1);
    saveSettings();
    renderSettingsTab();
}

function updateTrainingTypeName(idx, name) {
    if (!settings.trainingTypes) settings.trainingTypes = [...DEFAULT_TRAINING_TYPES];
    settings.trainingTypes[idx].name = name;
    saveSettings();
}

function updateTrainingTypeType(idx, type) {
    if (!settings.trainingTypes) settings.trainingTypes = [...DEFAULT_TRAINING_TYPES];
    settings.trainingTypes[idx].type = type;
    saveSettings();
}

function hasTimeOverlap(soldierId, date, startTime, endTime, excludeShiftId) {
    function toMin(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
    function crossMidnightOverlap(s1, e1, s2, e2) {
        // Split cross-midnight ranges into two segments
        const r1 = e1 > s1 ? [[s1, e1]] : [[s1, 1440], [0, e1]];
        const r2 = e2 > s2 ? [[s2, e2]] : [[s2, 1440], [0, e2]];
        for (const [a, b] of r1)
            for (const [c, d] of r2)
                if (a < d && b > c) return true;
        return false;
    }
    const newS = toMin(startTime), newE = toMin(endTime);
    return state.shifts.find(sh => {
        if (sh.id === excludeShiftId || !sh.soldiers.includes(soldierId) || sh.date !== date) return false;
        return crossMidnightOverlap(toMin(sh.startTime), toMin(sh.endTime), newS, newE);
    });
}

async function saveShift() {
    const company = document.getElementById('shiftCompany').value;
    if (!canEditShifts(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }
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
    const taskData = companyData[company] && companyData[company].tasks.find(t => t.name === task);
    if (taskData) {
        const needed = taskData.perShift.soldiers + taskData.perShift.commanders + taskData.perShift.officers;
        const alreadyAssigned = state.shifts.filter(sh => {
            if (sh.id === editId || sh.company !== company || sh.task !== task || sh.date !== date) return false;
            // Handle cross-midnight overlap (same as hasTimeOverlap)
            function _toM(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
            const s1 = _toM(sh.startTime), e1 = _toM(sh.endTime), s2 = _toM(startTime), e2 = _toM(endTime);
            const r1 = e1 > s1 ? [[s1, e1]] : [[s1, 1440], [0, e1]];
            const r2 = e2 > s2 ? [[s2, e2]] : [[s2, 1440], [0, e2]];
            return r1.some(([a, b]) => r2.some(([c, d]) => a < d && b > c));
        }).reduce((sum, sh) => sum + sh.soldiers.length, 0);
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
    if (sh && !canEditShifts(sh.company)) { showToast('אין הרשאה', 'error'); return; }
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
    const today = localToday();
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
    if (!canEditShifts(company)) { showToast('אין הרשאה לערוך פלוגה זו', 'error'); return; }
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
    if (l && !canEditShifts(l.company)) { showToast('אין הרשאה', 'error'); return; }
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
    CONFIG.combatCompanies.forEach(renderCompanyTab);
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

// Return today's date as YYYY-MM-DD in local timezone (avoids UTC midnight off-by-one in Israel)
function localToday() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function openModal(id) {
    document.getElementById(id).classList.add('active');
    document.body.classList.add('modal-open');
}
function closeModal(id) {
    const el = document.getElementById(id);
    el.classList.remove('active');
    el.style.zIndex = '';
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

let _deleteConfirmCleanup = null;
function customDeleteConfirm() {
    return new Promise(resolve => {
        if (_deleteConfirmCleanup) _deleteConfirmCleanup(false);
        const overlay = document.getElementById('deleteConfirmDialog');
        const msgEl = document.getElementById('deleteConfirmMsg');
        const input = document.getElementById('deleteConfirmInput');
        const yesBtn = document.getElementById('deleteConfirmYes');
        const noBtn = document.getElementById('deleteConfirmNo');
        msgEl.textContent = 'שים לב! מחיקת ציוד הינו צעד חריג!\nיש לזכות את החייל על הציוד ולא למחוק את הפריט.\n\nאם בכל זאת ברצונך למחוק נא לכתוב כאן "מחק" כדי שהפעולה תבוצע.';
        input.value = '';
        yesBtn.disabled = true;
        overlay.classList.add('active');
        document.body.classList.add('modal-open');
        function onInput() {
            yesBtn.disabled = input.value.trim() !== 'מחק';
        }
        function cleanup(result) {
            _deleteConfirmCleanup = null;
            overlay.classList.remove('active');
            if (!document.querySelector('.modal-overlay.active')) document.body.classList.remove('modal-open');
            input.removeEventListener('input', onInput);
            yesBtn.removeEventListener('click', onYes);
            noBtn.removeEventListener('click', onNo);
            overlay.removeEventListener('click', onOverlay);
            resolve(result);
        }
        _deleteConfirmCleanup = cleanup;
        function onYes() { cleanup(true); }
        function onNo() { cleanup(false); }
        function onOverlay(e) { if (e.target === overlay) cleanup(false); }
        input.addEventListener('input', onInput);
        yesBtn.addEventListener('click', onYes);
        noBtn.addEventListener('click', onNo);
        overlay.addEventListener('click', onOverlay);
        setTimeout(() => input.focus(), 100);
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
    const level = currentUser ? getUserPermissionLevel() : PERM.FULL_ACCESS;

    // Filter data by user's permission level
    const filterCompanies = level >= PERM.COMPANY_CMD ? ALL_COMPANIES : [currentUser?.unit || 'a'];

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

    const todayStr = localToday();
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
    CONFIG.combatCompanies.forEach(k => {
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
    const companyNames = getCompNames();

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

    <!-- Operation Dates + Rotation -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> תעסוקה נוכחית</h3>
        <p style="font-size:0.83em;color:var(--text-light);margin-bottom:12px;">הגדר תאריכי תחילה וסיום של התעסוקה לדיוק דו"ח 1</p>
        <div class="settings-row">
            <div class="settings-field">
                <label>תחילת תעסוקה</label>
                <input type="date" value="${settings.operationStartDate || ''}" onchange="settings.operationStartDate=this.value;saveSettings();">
            </div>
            <div class="settings-field">
                <label>שעת התחלה</label>
                <input type="time" value="${settings.operationStartTime || '14:00'}" onchange="settings.operationStartTime=this.value;saveSettings();">
            </div>
        </div>
        <div class="settings-row">
            <div class="settings-field">
                <label>סיום תעסוקה</label>
                <input type="date" value="${settings.operationEndDate || ''}" onchange="settings.operationEndDate=this.value;saveSettings();">
            </div>
            <div class="settings-field">
                <label>שעת סיום</label>
                <input type="time" value="${settings.operationEndTime || '14:00'}" onchange="settings.operationEndTime=this.value;saveSettings();">
            </div>
        </div>
        <div style="border-top:1px solid var(--border);margin-top:14px;padding-top:14px;">
            <h4 style="font-size:0.95em;margin-bottom:10px;display:flex;align-items:center;gap:6px;"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-6.219-8.56"/><polyline points="21 3 21 9 15 9"/></svg> רוטציה</h4>
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
    </div>

    <!-- Training Types -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M4 20L20 4M4 4l16 16M7 2l3 3-3 3M17 16l3 3-3 3"/></svg> סוגי אימונים</h3>
        <div id="trainingTypesSettings">
            ${getTrainingTypes().map((t, i) => `
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px;">
                    <input type="text" value="${esc(t.name)}" style="flex:2;" onchange="updateTrainingTypeName(${i},this.value)">
                    <select style="flex:1;" onchange="updateTrainingTypeType(${i},this.value)">
                        <option value="boolean" ${t.type === 'boolean' ? 'selected' : ''}>כן/לא</option>
                        <option value="date" ${t.type === 'date' ? 'selected' : ''}>תאריך</option>
                    </select>
                    <button class="btn btn-sm" style="background:var(--danger);color:white;padding:2px 8px;" onclick="removeTrainingType(${i})">✕</button>
                </div>
            `).join('')}
        </div>
        <button class="btn btn-sm" style="margin-top:8px;" onclick="addTrainingType()">+ הוסף סוג אימון</button>
    </div>

    <!-- Security -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg> אבטחה</h3>
        <div class="settings-field">
            <label>סיסמת כניסה</label>
            <input type="password" value="${esc(settings.password)}" onchange="settings.password=this.value.trim();saveSettings();showToast('סיסמה עודכנה');">
        </div>
        <div class="settings-field">
            <label>שם מנהל מערכת (אדמין)</label>
            <input type="text" value="${esc(settings.adminName)}" onchange="settings.adminName=this.value.trim();saveSettings();showToast('שם אדמין עודכן');">
        </div>
    </div>

    <!-- Google Sheets -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg> קישור גוגל שיטס</h3>
        ${CONFIG.isDemo ? `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:10px;height:10px;border-radius:50%;background:#27ae60;"></div>
            <span style="font-size:0.85em;">מחובר — 7 גיליונות מסונכרנים</span>
        </div>
        <p style="font-size:0.78em;color:var(--text-light);">פלוגות א׳-ד׳, חפ"ק, אגם, פלח"ם מסונכרנים מהגיליונות.</p>
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="syncFromGoogleSheets(false)">סנכרון מחדש</button>
        </div>
        ` : `
        <div class="settings-field">
            <label>מזהה הגיליון (Sheet ID)</label>
            <input type="text" value="${esc(settings.sheetId)}" style="direction:ltr;font-family:monospace;font-size:0.8em;" onchange="settings.sheetId=this.value.trim();saveSettings();showToast('מזהה גיליון עודכן');">
        </div>
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="syncFromGoogleSheets(false)">סנכרון מחדש</button>
        </div>
        `}
    </div>

    <!-- Firebase Sync -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> סנכרון Firebase</h3>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
            <div style="width:10px;height:10px;border-radius:50%;background:${CONFIG.isDemo || (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED && typeof firestoreReady !== 'undefined' && firestoreReady) ? '#27ae60' : '#e74c3c'};"></div>
            <span style="font-size:0.85em;">${CONFIG.isDemo ? 'מחובר ומסנכרן' : (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED ? (typeof firestoreReady !== 'undefined' && firestoreReady ? 'מחובר ומסנכרן' : 'מנסה להתחבר...') : 'לא מוגדר')}</span>
        </div>
        <p style="font-size:0.78em;color:var(--text-light);">
            ${CONFIG.isDemo ? 'הנתונים מסונכרנים בזמן אמת בין כל המשתמשים.' : (typeof FIREBASE_ENABLED !== 'undefined' && FIREBASE_ENABLED ? 'הנתונים מסונכרנים בזמן אמת בין כל המשתמשים.' : 'להפעלה: ערוך את firebase-config.js והגדר FIREBASE_ENABLED = true עם פרטי הפרויקט שלך.')}
        </p>
    </div>

    <!-- Data Management -->
    <div class="settings-card">
        <h3><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align:middle;margin-left:6px;"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg> ניהול נתונים</h3>
        <div class="settings-actions">
            <button class="btn btn-primary" onclick="exportAllData()">ייצוא נתונים (Excel)</button>
            <button class="btn btn-warning" onclick="document.getElementById('importFile').click();">ייבוא נתונים (Excel)</button>
            <input type="file" id="importFile" accept=".xlsx,.xls,.json" style="display:none" onchange="importAllData(this)">
            ${isAdmin() ? '<button class="btn btn-danger" onclick="resetAllData()">&#9651; איפוס כל הנתונים</button>' : ''}
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
                ${ALL_COMPANIES.filter(k => companyData[k].tasks.length > 0 || CONFIG.combatCompanies.includes(k)).map(k =>
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
    const tasks = companyData[compKey] ? companyData[compKey].tasks : [];
    if (!tasks) return;

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
    else if (field === 'shifts') {
        t.shifts = value;
        // Recalc totals
        t.soldiers = t.perShift.soldiers * value;
        t.commanders = t.perShift.commanders * value;
        t.officers = t.perShift.officers * value;
    } else {
        t.perShift[field] = value;
        t[field] = value * t.shifts;
    }
    saveTasksToStorage();
    renderDashboard();
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
    localStorage.setItem(CONFIG.storagePrefix + 'Tasks', JSON.stringify(tasksData));
    if (typeof firebaseSaveTasks === 'function') firebaseSaveTasks();
}

function loadTasksFromStorage() {
    const saved = localStorage.getItem(CONFIG.storagePrefix + 'Tasks');
    if (saved) {
        let tasksData;
        try { tasksData = JSON.parse(saved); } catch { tasksData = null; }
        if (tasksData) ALL_COMPANIES.forEach(k => {
            if (tasksData[k] && companyData[k]) companyData[k].tasks = tasksData[k];
        });
    }
    // Add מפל"ג to combat companies only if no saved tasks exist yet (skip in demo)
    if (!saved && !CONFIG.isDemo) {
        CONFIG.combatCompanies.forEach(k => {
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
    const wb = XLSX.utils.book_new();
    // Sheet 1: Soldiers
    if (state.soldiers.length) {
        const solRows = state.soldiers.map(s => ({
            'שם': s.name || '', 'מ.א': s.personalId || '', 'טלפון': s.phone || '',
            'פלוגה': s.company || '', 'תפקיד': s.role || '', 'צוות': s.team || '',
            'קבוצת רוטציה': s.rotationGroup || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(solRows), 'חיילים');
    }
    // Sheet 2: Equipment
    if (state.equipment.length) {
        const eqRows = state.equipment.map(e => ({
            'סוג': e.type || '', 'מק"ט / סידורי': e.serial || '', 'פלוגה': e.company || '',
            'מוחזק ע"י': e.holderName || '', 'מ.א מחזיק': e.holderId || '',
            'תאריך הקצאה': e.assignedDate || '', 'קטגוריה': e.category || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(eqRows), 'ציוד');
    }
    // Sheet 3: Signature Log
    if (state.signatureLog.length) {
        const logRows = state.signatureLog.map(l => ({
            'סוג': l.type === 'assign' ? 'הקצאה' : l.type === 'return' ? 'זיכוי' : l.type === 'delete' ? 'מחיקה' : l.type,
            'חייל': l.soldierName || '', 'מ.א חייל': l.soldierPersonalId || '',
            'ציוד': (l.equipItems || []).map(i => `${i.equipType}${i.equipSerial ? ' (' + i.equipSerial + ')' : ''} x${i.equipQty}`).join(', '),
            'תאריך': l.date ? new Date(l.date).toLocaleString('he-IL') : '',
            'מחתים': l.issuedBy || '', 'מ.א מחתים': l.issuerPersonalId || '',
            'הערות': l.notes || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logRows), 'היסטוריית חתימות');
    }
    // Sheet 4: Shifts
    if (state.shifts.length) {
        const shRows = state.shifts.map(s => ({
            'פלוגה': s.company || '', 'חייל': s.soldierName || '', 'משמרת': s.shiftName || '',
            'תאריך': s.date || '', 'שעת התחלה': s.startTime || '', 'שעת סיום': s.endTime || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(shRows), 'משמרות');
    }
    // Sheet 5: Leaves
    if (state.leaves.length) {
        const lvRows = state.leaves.map(l => ({
            'חייל': l.soldierName || '', 'פלוגה': l.company || '',
            'תאריך יציאה': l.startDate || '', 'תאריך חזרה': l.endDate || '',
            'סוג': l.type || '', 'הערות': l.notes || ''
        }));
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(lvRows), 'יציאות');
    }
    // Sheet 6: Full JSON backup (for import)
    const fullData = { state, settings, tasks: {} };
    ALL_COMPANIES.forEach(k => { fullData.tasks[k] = companyData[k].tasks; });
    const jsonSheet = XLSX.utils.aoa_to_sheet([['_BACKUP_JSON_'], [JSON.stringify(fullData)]]);
    XLSX.utils.book_append_sheet(wb, jsonSheet, '_גיבוי_מלא_');

    XLSX.writeFile(wb, `battalion_backup_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToast('נתונים יוצאו לאקסל בהצלחה');
}

function importAllData(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data;
            if (file.name.endsWith('.json')) {
                // Legacy JSON support
                data = JSON.parse(e.target.result);
            } else {
                // Excel import - read _גיבוי_מלא_ sheet
                const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
                const backupSheet = wb.Sheets['_גיבוי_מלא_'];
                if (!backupSheet) { showToast('קובץ לא תקין - חסר גיליון גיבוי', 'error'); return; }
                const rows = XLSX.utils.sheet_to_json(backupSheet, { header: 1 });
                if (!rows[1] || !rows[1][0]) { showToast('קובץ גיבוי ריק', 'error'); return; }
                data = JSON.parse(rows[1][0]);
            }
            if (data.state) {
                state = data.state;
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
    if (file.name.endsWith('.json')) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
    input.value = '';
}

async function resetAllData() {
    if (!isAdmin()) { showToast('פעולה זו מותרת למנהל מערכת בלבד', 'error'); return; }
    if (!await customDeleteConfirm()) return;
    state = { soldiers: [], shifts: [], leaves: [], rotationGroups: [], equipment: [], signatureLog: [], weaponsData: [], personalEquipment: [], rollCalls: [], announcements: [], shiftHistory: [], constraints: [], initiativeTeams: [], training: [] };
    saveState();
    localStorage.removeItem(CONFIG.storagePrefix + 'Tasks');
    localStorage.removeItem(CONFIG.storagePrefix + 'DataVersion');
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
    soldiers.forEach(s => csv += `${s.name},${s.rank || ''},${s.role || ''},${s.personalId || ''},${s.phone || ''}\n`);
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
        const priorityIcon = ann.priority === 'urgent' ? '<i data-lucide="alert-triangle" style="width:14px;height:14px;display:inline;vertical-align:-2px;color:var(--danger);"></i> ' : ann.priority === 'pinned' ? '<i data-lucide="pin" style="width:14px;height:14px;display:inline;vertical-align:-2px;"></i> ' : '';
        const isAuthor = currentUser && currentUser.name === ann.author;

        return `<div class="ann-card ${priorityClass}">
            <div class="ann-header">
                <h4>${priorityIcon}${esc(ann.title)}</h4>
                ${isAuthor || isAdmin() ? `<div class="ann-actions">
                    <button class="btn btn-edit btn-sm" onclick="editAnnouncement('${ann.id}')" title="ערוך"><i data-lucide="edit-2"></i></button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAnnouncement('${ann.id}')" title="מחק"><i data-lucide="trash-2"></i></button>
                </div>` : ''}
            </div>
            <div class="ann-body">${esc(ann.body).replace(/\n/g, '<br>')}</div>
            <div class="ann-footer">${esc(ann.author)} | ${dateStr} ${timeStr}</div>
        </div>`;
    }).join('');

    updateAnnouncementBadge();
    refreshIcons();
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
                        <span class="rc-role">${esc(s.role || '')}</span>
                    </div>
                    <div class="rc-buttons">
                        <button class="rc-btn ${st==='present'?'active':''}" data-status="present" onclick="setRollCallStatus('${s.id}','present')" title="נוכח">&#10003;</button>
                        <button class="rc-btn rc-absent ${st==='absent'?'active':''}" data-status="absent" onclick="setRollCallStatus('${s.id}','absent')" title="חסר">&#10007;</button>
                        <button class="rc-btn rc-leave ${st==='leave'?'active':''}" data-status="leave" onclick="setRollCallStatus('${s.id}','leave')" title="ביציאה">&#9670;</button>
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
                            <span style="color:var(--warning);">&#9670; ${leave}</span>
                            <span>סה"כ: ${entries.length}</span>
                        </div>
                    </div>`;
                }).join('')}
            </div>
        </details>`;
}

function copyRollCallText() {
    const compKey = document.getElementById('rollcallCompany').value;
    const compNames = getCompNames();
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

// ==================== REPORT 1 - ATTENDANCE ====================
let report1Offset = 0;

function report1Nav(dir) {
    if (dir === 0) report1Offset = 0;
    else report1Offset += dir;
    renderReport1();
}

function getReport1Days() {
    const rangeEl = document.getElementById('report1Range');
    const range = rangeEl ? rangeEl.value : 'week';
    const today = new Date();
    today.setHours(0,0,0,0);

    if (range === 'operation') {
        // Full operation period - ignore offset
        const start = settings.operationStartDate ? new Date(settings.operationStartDate + 'T00:00:00') : new Date(today);
        const end = settings.operationEndDate ? new Date(settings.operationEndDate + 'T00:00:00') : new Date(today);
        const days = [];
        const d = new Date(start);
        while (d <= end) {
            days.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return days.length > 0 ? days : [new Date(today)];
    }

    if (range === 'day') {
        const d = new Date(today);
        d.setDate(d.getDate() + report1Offset);
        return [d];
    }

    if (range === 'month') {
        const base = new Date(today.getFullYear(), today.getMonth() + report1Offset, 1);
        const days = [];
        const d = new Date(base);
        while (d.getMonth() === base.getMonth()) {
            days.push(new Date(d));
            d.setDate(d.getDate() + 1);
        }
        return days;
    }

    // week (default)
    const dayOfWeek = today.getDay(); // 0=Sun
    const sunday = new Date(today);
    sunday.setDate(sunday.getDate() - dayOfWeek + (report1Offset * 7));
    const days = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(sunday);
        d.setDate(d.getDate() + i);
        days.push(d);
    }
    return days;
}

function getReport1SoldierStatus(soldier, dateStr) {
    // Check if soldier is in a rotation group (i.e., called up for reserves)
    const rotGroup = getRotationGroupForSoldier(soldier.id);
    if (!rotGroup) return 'notserving'; // לא במילואים

    // Check rotation status
    const rotStatus = getRotationStatus(rotGroup, new Date(dateStr + 'T00:00:00'));
    const rotationOut = rotStatus && !rotStatus.inBase;

    // Check if on leave
    const onLeave = state.leaves.some(l => l.soldierId === soldier.id && isOnLeaveForDate(l, dateStr));

    // שמ"פ סגור - everyone stays at base
    const closed = (settings.closedDays || []).includes(dateStr);
    if (closed && !onLeave && !rotationOut) return 'base'; // forced at base
    if (onLeave || rotationOut) return 'home'; // בבית

    // At base - check if assigned to a shift that day
    const hasShift = state.shifts.some(sh => sh.date === dateStr && sh.soldiers.includes(soldier.id));
    if (hasShift) return 'active'; // בפעילות

    return 'base'; // בבסיס (no shift)
}

function isDateInOperation(dateStr) {
    if (!settings.operationStartDate && !settings.operationEndDate) return true;
    if (settings.operationStartDate && dateStr < settings.operationStartDate) return false;
    if (settings.operationEndDate && dateStr > settings.operationEndDate) return false;
    return true;
}

function toggleClosedDay(dateStr) {
    if (!settings.closedDays) settings.closedDays = [];
    const idx = settings.closedDays.indexOf(dateStr);
    if (idx >= 0) settings.closedDays.splice(idx, 1);
    else settings.closedDays.push(dateStr);
    saveSettings();
    renderReport1();
}

function renderReport1() {
    const container = document.getElementById('report1Content');
    if (!container) return;

    const compSelect = document.getElementById('report1Company');
    const compKey = compSelect ? compSelect.value : 'a';
    const compNames = getCompNames();
    const isNispachim = compKey === 'nispachim';
    const soldiers = isNispachim
        ? state.soldiers.filter(s => s.nispach)
        : state.soldiers.filter(s => s.company === compKey && !s.nispach);
    const days = getReport1Days();
    const todayStr = localToday();
    const hebDays = ['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'];

    // Hide nav buttons when showing full operation period
    const rangeEl = document.getElementById('report1Range');
    const navBtns = document.getElementById('report1NavBtns');
    if (navBtns) navBtns.style.display = rangeEl && rangeEl.value === 'operation' ? 'none' : '';

    if (soldiers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין חיילים בפלוגה זו</p></div>';
        return;
    }

    // Operation period info
    let opInfo = '';
    if (settings.operationStartDate || settings.operationEndDate) {
        const s = settings.operationStartDate ? formatDate(settings.operationStartDate) : '?';
        const e = settings.operationEndDate ? formatDate(settings.operationEndDate) : '?';
        opInfo = `<div style="font-size:0.82em;color:var(--text-light);margin-bottom:12px;">תעסוקה: ${s} – ${e}</div>`;
    }

    // Date range header
    const rangeLabel = days.length === 1
        ? formatDate(days[0].toISOString().split('T')[0])
        : `${formatDate(days[0].toISOString().split('T')[0])} – ${formatDate(days[days.length - 1].toISOString().split('T')[0])}`;

    // SVG icons for statuses
    const isCompact = days.length > 14;
    const ICONS = isCompact ? {
        active: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#1565c0;"></span>',
        home: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#e65100;"></span>',
        base: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#2e7d32;"></span>',
        notserving: '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#999;"></span>'
    } : {
        active: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C8 2 4 5 4 9c0 1 .2 2 .5 3h15c.3-1 .5-2 .5-3 0-4-4-7-8-7z"/><path d="M4.5 12C3 12 2 13 2 14h20c0-1-1-2-2.5-2"/><path d="M8 14v2"/><path d="M16 14v2"/></svg>',
        home: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
        base: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>',
        notserving: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
    };

    // Build daily summaries
    const dailySummary = days.map(d => {
        const ds = d.toISOString().split('T')[0];
        const inOp = isDateInOperation(ds);
        if (!inOp) return { active: '-', base: '-', home: '-', notserving: '-' };
        let active = 0, base = 0, home = 0, notserving = 0;
        soldiers.forEach(s => {
            const st = getReport1SoldierStatus(s, ds);
            if (st === 'active') active++;
            else if (st === 'base') base++;
            else if (st === 'home') home++;
            else notserving++;
        });
        return { active, base, home, notserving };
    });

    // Table
    container.innerHTML = `
        ${opInfo}
        <div style="font-weight:600;margin-bottom:8px;">${isNispachim ? 'נספחים' : compNames[compKey]} | ${rangeLabel}</div>
        <div class="table-scroll">
        <table class="r1-table">
            <thead>
                <tr>
                    <th style="text-align:right;min-width:140px;position:sticky;right:0;background:var(--card);z-index:2;">חייל</th>
                    ${days.map((d, i) => {
                        const ds = d.toISOString().split('T')[0];
                        const isToday = ds === todayStr;
                        const isClosed = (settings.closedDays || []).includes(ds);
                        const inOp = isDateInOperation(ds);
                        const compact = days.length > 14;
                        return `<th class="r1-day-header ${isToday ? 'r1-today' : ''} ${!inOp ? 'r1-out-of-op' : ''}" style="text-align:center;min-width:${compact ? '36' : '60'}px;${compact ? 'font-size:0.7em;padding:4px 2px;' : ''}">
                            <div>${hebDays[d.getDay()]}</div>
                            <div style="font-size:0.75em;font-weight:400;">${d.getDate()}/${d.getMonth()+1}</div>
                            ${!compact && inOp ? `<button class="r1-closed-btn ${isClosed ? 'active' : ''}" onclick="toggleClosedDay('${ds}')" title="${isClosed ? 'פתח שמ\"פ' : 'סגור שמ\"פ'}">${isClosed ? '🔒' : '🔓'}</button>` : ''}
                        </th>`;
                    }).join('')}
                </tr>
            </thead>
            <tbody>
                ${soldiers.map(s => `<tr>
                    <td style="text-align:right;font-weight:600;white-space:nowrap;position:sticky;right:0;background:var(--card);z-index:1;">
                        <a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a>
                        <div style="font-size:0.72em;color:var(--text-light);font-weight:400;">${esc(s.role || '')}</div>
                    </td>
                    ${days.map(d => {
                        const ds = d.toISOString().split('T')[0];
                        const inOp = isDateInOperation(ds);
                        if (!inOp) return '<td class="r1-cell r1-out-of-op" style="text-align:center;">-</td>';
                        const st = getReport1SoldierStatus(s, ds);
                        const cls = 'r1-' + st;
                        return `<td class="r1-cell ${cls}" style="text-align:center;">${ICONS[st]}</td>`;
                    }).join('')}
                </tr>`).join('')}
            </tbody>
            <tfoot>
                <tr style="font-weight:700;background:var(--bg);">
                    <td style="text-align:right;position:sticky;right:0;background:var(--bg);z-index:1;">בפעילות</td>
                    ${dailySummary.map((sum, i) => {
                        const ds = days[i].toISOString().split('T')[0];
                        const isToday = ds === todayStr;
                        return `<td style="text-align:center;color:#1565c0;" class="${isToday ? 'r1-today' : ''}">${sum.active}</td>`;
                    }).join('')}
                </tr>
                <tr style="font-weight:700;background:var(--bg);">
                    <td style="text-align:right;position:sticky;right:0;background:var(--bg);z-index:1;">בבסיס</td>
                    ${dailySummary.map((sum, i) => {
                        const ds = days[i].toISOString().split('T')[0];
                        const isToday = ds === todayStr;
                        return `<td style="text-align:center;color:#2e7d32;" class="${isToday ? 'r1-today' : ''}">${sum.base}</td>`;
                    }).join('')}
                </tr>
                <tr style="font-weight:700;background:var(--bg);">
                    <td style="text-align:right;position:sticky;right:0;background:var(--bg);z-index:1;">בבית</td>
                    ${dailySummary.map((sum, i) => {
                        const ds = days[i].toISOString().split('T')[0];
                        const isToday = ds === todayStr;
                        return `<td style="text-align:center;color:#e65100;" class="${isToday ? 'r1-today' : ''}">${sum.home}</td>`;
                    }).join('')}
                </tr>
            </tfoot>
        </table>
        </div>
        <div class="r1-legend">
            <span class="r1-legend-item"><span class="r1-dot r1-active"></span> בפעילות (קסדה)</span>
            <span class="r1-legend-item"><span class="r1-dot r1-base"></span> בבסיס (דגל)</span>
            <span class="r1-legend-item"><span class="r1-dot r1-home"></span> בבית (בית)</span>
            <span class="r1-legend-item"><span class="r1-dot r1-notserving"></span> לא במילואים (X)</span>
        </div>
    `;
}

function copyReport1Text() {
    const compSelect = document.getElementById('report1Company');
    const compKey = compSelect ? compSelect.value : 'a';
    const compNames = getCompNames();
    const isNispachim = compKey === 'nispachim';
    const soldiers = isNispachim
        ? state.soldiers.filter(s => s.nispach)
        : state.soldiers.filter(s => s.company === compKey && !s.nispach);
    const days = getReport1Days();
    const hebDays = ['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
    const todayStr = localToday();

    let text = `*דו"ח 1 - ${isNispachim ? 'נספחים' : compNames[compKey]}*\n`;

    if (settings.operationStartDate || settings.operationEndDate) {
        const s = settings.operationStartDate ? formatDate(settings.operationStartDate) : '?';
        const e = settings.operationEndDate ? formatDate(settings.operationEndDate) : '?';
        text += `תעסוקה: ${s} – ${e}\n`;
    }

    // Today summary
    const activeToday = [], baseToday = [], homeToday = [], notServingToday = [];
    soldiers.forEach(s => {
        const st = getReport1SoldierStatus(s, todayStr);
        if (st === 'active') activeToday.push(s.name);
        else if (st === 'base') baseToday.push(s.name);
        else if (st === 'home') homeToday.push(s.name);
        else notServingToday.push(s.name);
    });

    const isClosed = (settings.closedDays || []).includes(todayStr);
    text += `\n*${formatDate(todayStr)}${isClosed ? ' (שמ"פ סגור)' : ''}*\n`;
    text += `בפעילות: ${activeToday.length} | בבסיס: ${baseToday.length} | בבית: ${homeToday.length}${notServingToday.length ? ' | לא במילואים: '+notServingToday.length : ''}\n\n`;

    if (activeToday.length > 0) text += `*⛑️ בפעילות (${activeToday.length}):*\n${activeToday.join(', ')}\n\n`;
    if (baseToday.length > 0) text += `*🚩 בבסיס (${baseToday.length}):*\n${baseToday.join(', ')}\n\n`;
    if (homeToday.length > 0) text += `*🏠 בבית (${homeToday.length}):*\n${homeToday.join(', ')}\n\n`;
    if (notServingToday.length > 0) text += `*✗ לא במילואים (${notServingToday.length}):*\n${notServingToday.join(', ')}\n`;

    navigator.clipboard.writeText(text).then(() => {
        showToast('דו"ח 1 הועתק ללוח');
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        ta.remove();
        showToast('דו"ח 1 הועתק ללוח');
    });
}

function exportShavtzak() {
    if (typeof XLSX === 'undefined') { showToast('ספריית Excel לא נטענה', 'error'); return; }
    const wb = XLSX.utils.book_new();
    const todayStr = localToday();
    const dateFormatted = new Date().toLocaleDateString('he-IL');
    const compNames = getCompNames();
    const baseNames = {}; allCompanyKeys().forEach(k => { baseNames[k] = CONFIG.companies[k]?.baseName || ''; });

    // --- Sheet 1: Personnel list (שבצ"ק) ---
    const header = ['מספר אישי', 'דרגה', 'מחושבת', 'שם משפחה', 'שם פרטי', 'סוג שירות', 'פלוגה', 'עיסוק מיועד', 'שם הבסיס נמצא'];
    const rows = [['שבצ"ק ודמ"ח', '', '', '', '', '', '', '', dateFormatted], [], header];

    // Sort: combat companies first, then hq, palsam
    const compOrder = allCompanyKeys();
    compOrder.forEach(compKey => {
        const soldiers = state.soldiers.filter(s => s.company === compKey);
        soldiers.forEach(s => {
            const nameParts = (s.name || '').split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            rows.push([
                s.personalId || '',
                s.rank || '',
                CONFIG.serviceType,
                lastName,
                firstName,
                CONFIG.serviceType,
                compNames[compKey] || '',
                s.role || 'לוחם חי"ר',
                baseNames[compKey] || ''
            ]);
        });
    });

    const ws1 = XLSX.utils.aoa_to_sheet(rows);
    ws1['!cols'] = [{wch:12},{wch:8},{wch:10},{wch:14},{wch:14},{wch:10},{wch:14},{wch:16},{wch:14}];
    XLSX.utils.book_append_sheet(wb, ws1, 'שבצ"ק');

    // --- Sheet 2: Summary table (דמ"ח) ---
    const summaryHeader = [
        'פלוגה', 'אורגני', 'מקום', 'תע"מ',
        'סד"כ פעיל סדיר + מילואים', 'סד"כ חמרה גבל / מבצעים / אמהות מיידית',
        'סה"כ מילואים', 'סה"כ נא"מ סדיר',
        'נוכחים', 'חוגר', 'מגוייס', 'יושב',
        'חופש', 'חונך'
    ];
    const summaryRows = [['דמ"ח - סיכום לפי פלוגה', '', '', '', '', '', '', '', '', '', '', '', '', dateFormatted], [], summaryHeader];

    let totalAll = 0;
    compOrder.forEach(compKey => {
        const soldiers = state.soldiers.filter(s => s.company === compKey);
        const total = soldiers.length;
        totalAll += total;
        // Count statuses
        let active = 0, base = 0, home = 0;
        soldiers.forEach(s => {
            const st = getReport1SoldierStatus(s, todayStr);
            if (st === 'active') active++;
            else if (st === 'base') base++;
            else if (st === 'home') home++;
        });
        const present = active + base;
        const onLeave = state.leaves.filter(l => l.company === compKey && l.startDate <= todayStr && l.endDate >= todayStr).length;

        summaryRows.push([
            compNames[compKey] || '',
            baseNames[compKey] || '',
            baseNames[compKey] || '',
            'תע"מ',
            total, // סד"כ פעיל
            0, // חמרה
            total, // סה"כ מילואים
            0, // סדיר
            present, // נוכחים
            active, // חוגר (בפעילות)
            total, // מגוייס
            base, // יושב (בבסיס)
            onLeave, // חופש
            0 // חונך
        ]);
    });

    // Total row
    const totals = summaryRows.slice(3).reduce((acc, r) => {
        for (let i = 4; i < r.length; i++) acc[i] = (acc[i] || 0) + (r[i] || 0);
        return acc;
    }, ['סה"כ גדוד', '', '', '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
    totals[0] = 'סה"כ גדוד';
    summaryRows.push(totals);

    const ws2 = XLSX.utils.aoa_to_sheet(summaryRows);
    ws2['!cols'] = [{wch:14},{wch:12},{wch:12},{wch:8},{wch:10},{wch:10},{wch:10},{wch:10},{wch:10},{wch:8},{wch:8},{wch:8},{wch:8},{wch:8}];
    XLSX.utils.book_append_sheet(wb, ws2, 'דמ"ח');

    XLSX.writeFile(wb, `שבצק_ודמח_${todayStr}.xlsx`);
    showToast('שבצ"ק ודמ"ח יוצא לאקסל');
}

// ==================== MORNING REPORT ====================
function generateMorningReport() {
    const container = document.getElementById('morningReportContent');
    if (!container) return;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const dateDisplay = now.toLocaleDateString('he-IL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const timeDisplay = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const companies = allCompanyKeys();
    const compNames = getCompNames();
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
                <h3>דוח גדודי - ${CONFIG.battalionName}</h3>
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
    const companies = allCompanyKeys();
    const compNames = getCompNames();

    let text = `*דוח גדודי - ${CONFIG.battalionName}*\n${dateDisplay} | ${timeDisplay}\n\n`;
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
    const todayStr = localToday();
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
                html += `<tr><td>${esc(s.name)}</td><td>${esc(s.rank || '')}</td><td>${esc(s.role || '')}</td><td>${esc(s.personalId) || '-'}</td><td>${esc(s.phone) || '-'}</td></tr>`;
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
    const todayStr = localToday();
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
    const todayStr = localToday();
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
    const todayStr = localToday();
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
    const todayStr = localToday();
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
                soldiers.forEach(s => html += `<tr><td>${esc(s.name)}</td><td>${esc(s.rank || '')}</td><td>${esc(s.role || '')}</td><td>${esc(s.personalId)||'-'}</td><td>${esc(s.phone)||'-'}</td></tr>`);
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
    const todayStr = localToday();
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
    img.src = CONFIG.docLogoPath;
    img.onerror = function() {
        const fallback = new Image();
        fallback.onload = function() {
            const c = document.createElement('canvas');
            c.width = fallback.width; c.height = fallback.height;
            c.getContext('2d').drawImage(fallback, 0, 0);
            DOC_LOGO_BASE64 = c.toDataURL('image/png');
        };
        fallback.src = CONFIG.logoPath;
    };
})();

// --- Battalion Stamp Loader ---
let DOC_STAMP_BASE64 = '';
(function loadDocStamp() {
    const img = new Image();
    img.onload = function() {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        DOC_STAMP_BASE64 = c.toDataURL('image/png');
    };
    img.src = CONFIG.stampPath;
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
    ctx.strokeStyle = '#2563eb';

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
function onEquipConditionChange() {
    const cond = document.getElementById('equipCondition').value;
    const grp = document.getElementById('lossFieldsGroup');
    if (grp) grp.style.display = (cond === 'אובדן' || cond === 'מת"ש') ? '' : 'none';
}

function toggleCustomWarehouse() {
    const sel = document.getElementById('equipWarehouse');
    const grp = document.getElementById('equipCustomWarehouseGroup');
    if (grp) grp.style.display = sel && sel.value === 'אחר' ? '' : 'none';
}

function getEquipmentTypes() {
    const types = new Set();
    const es = settings.equipmentSets || {};
    (es.baseSet?.items || []).forEach(item => types.add(item.name));
    (es.roleSets || []).forEach(rs => (rs.items || []).forEach(item => types.add(item.name)));
    types.add('אחר');
    return [...types];
}

function populateEquipTypeDropdown() {
    const select = document.getElementById('equipType');
    if (!select) return;
    const types = getEquipmentTypes();
    select.innerHTML = types.map(t => `<option value="${esc(t)}">${esc(t)}</option>`).join('');
}

function openAddEquipment() {
    document.getElementById('equipmentModalTitle').textContent = 'הוספת פריט ציוד';
    document.getElementById('equipEditId').value = '';
    populateEquipTypeDropdown();
    document.getElementById('equipType').value = getEquipmentTypes()[0] || 'נשק';
    document.getElementById('equipCustomTypeGroup').style.display = 'none';
    document.getElementById('equipSerial').value = '';
    document.getElementById('equipCompany').value = 'gdudi';
    document.getElementById('equipCondition').value = 'תקין';
    document.getElementById('equipWarehouse').value = CONFIG.defaultWarehouse;
    toggleCustomWarehouse();
    document.getElementById('equipDefaultQty').value = '1';
    document.getElementById('equipNotes').value = '';
    openModal('addEquipmentModal');
}

function openEditEquipment(id) {
    const eq = state.equipment.find(e => e.id === id);
    if (!eq) return;
    document.getElementById('equipmentModalTitle').textContent = 'עריכת פריט ציוד';
    document.getElementById('equipEditId').value = id;
    populateEquipTypeDropdown();
    const knownTypes = getEquipmentTypes();
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
    // Warehouse
    const wh = eq.warehouse || CONFIG.defaultWarehouse;
    const whSel = document.getElementById('equipWarehouse');
    if (WAREHOUSES.slice(0, -1).includes(wh)) {
        whSel.value = wh;
    } else {
        whSel.value = 'אחר';
        document.getElementById('equipCustomWarehouse').value = wh;
    }
    toggleCustomWarehouse();
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
    let warehouse = document.getElementById('equipWarehouse').value;
    if (warehouse === 'אחר') {
        warehouse = document.getElementById('equipCustomWarehouse').value.trim() || 'אחר';
    }
    const category = detectCategoryFromType(type);
    // Loss/write-off fields
    const lossDescription = (condition === 'אובדן' || condition === 'מת"ש') ? (document.getElementById('lossDescription').value.trim() || '') : '';
    const lossDate = (condition === 'אובדן' || condition === 'מת"ש') ? (document.getElementById('lossDate').value || '') : '';
    const lossReportingSoldier = (condition === 'אובדן' || condition === 'מת"ש') ? (document.getElementById('lossReportingSoldier').value.trim() || '') : '';

    if (editId) {
        const eq = state.equipment.find(e => e.id === editId);
        if (eq) {
            eq.type = type;
            eq.serial = serial;
            eq.company = company;
            eq.condition = condition;
            eq.defaultQty = defaultQty;
            eq.notes = notes;
            eq.warehouse = warehouse;
            eq.category = category;
            eq.lossDescription = lossDescription;
            eq.lossDate = lossDate;
            eq.lossReportingSoldier = lossReportingSoldier;
            // Release from holder if lost/written-off
            if (condition === 'אובדן' || condition === 'מת"ש') {
                eq.holderId = null; eq.holderName = ''; eq.holderPhone = '';
            }
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
            warehouse, category,
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
    if (!await customDeleteConfirm()) return;
    logEquipDeletion([eq]);
    state.equipment = state.equipment.filter(e => e.id !== id);
    saveState();
    renderEquipmentTab();
    showToast('פריט נמחק');
}

function logEquipDeletion(items) {
    items.forEach(eq => {
        state.signatureLog.push({
            id: 'sig_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            type: 'delete',
            equipId: eq.id,
            equipType: eq.type,
            equipSerial: eq.serial || '',
            equipItems: [{ equipId: eq.id, equipType: eq.type, equipSerial: eq.serial || '', equipQty: eq.defaultQty || 1 }],
            soldierId: eq.holderId || '',
            soldierName: eq.holderName || '-',
            soldierPhone: eq.holderPhone || '',
            soldierPersonalId: '',
            date: new Date().toISOString(),
            signatureImg: '',
            issuedBy: currentUser.name || '',
            issuerUnit: currentUser.unit || '',
            issuerRole: '',
            issuerPersonalId: currentUser.personalId || '',
            notes: eq.holderId ? `נמחק בעת שהיה מוחזק ע"י ${eq.holderName}` : 'נמחק ממלאי'
        });
    });
}

// --- Sign Equipment ---
function openSignEquipment() {
    // Reset UI
    document.getElementById('signSoldierSearch').value = '';
    document.getElementById('signSoldierInfo').style.display = 'none';
    document.getElementById('signEquipSection').style.display = 'none';
    document.getElementById('signSignatureSection').style.display = 'none';
    document.getElementById('signEquipCheckboxList').innerHTML = '';

    // Company filtering
    const signCompDd = document.getElementById('signCompany');
    const signCompGroup = document.getElementById('signCompanyGroup');
    if (getUserPermissionLevel() < PERM.COMPANY_CMD && currentUser.unit !== 'palsam') {
        signCompDd.value = currentUser.unit;
        if (signCompGroup) signCompGroup.style.display = 'none';
    } else {
        signCompDd.value = 'all';
        if (signCompGroup) signCompGroup.style.display = '';
    }
    updateSignSoldiers();
    delete document.getElementById('signEquipmentModal').dataset.editLogId;
    openModal('signEquipmentModal');
    // Canvas setup moved to onSignSoldierSelect - must be visible for getBoundingClientRect
}

function filterSignSoldiers() {
    const query = document.getElementById('signSoldierSearch').value.trim().toLowerCase();
    const sel = document.getElementById('signSoldier');
    const opts = sel.querySelectorAll('option');
    // Also hide/show optgroups
    opts.forEach(opt => {
        if (!opt.value) return; // skip placeholder
        opt.style.display = opt.textContent.toLowerCase().includes(query) ? '' : 'none';
    });
    // Show optgroups that have visible children
    sel.querySelectorAll('optgroup').forEach(grp => {
        const hasVisible = Array.from(grp.querySelectorAll('option')).some(o => o.style.display !== 'none');
        grp.style.display = hasVisible ? '' : 'none';
    });
    // Auto-select if single match
    const visible = Array.from(opts).filter(o => o.value && o.style.display !== 'none');
    if (visible.length === 1) {
        sel.value = visible[0].value;
        onSignSoldierSelect();
    } else if (query && visible.length > 0 && visible.length <= 5) {
        // Open dropdown hint
        sel.size = Math.min(visible.length + 1, 6);
    } else {
        sel.size = 0;
    }
}

function onSignSoldierSelect() {
    const sel = document.getElementById('signSoldier');
    if (sel) sel.size = 0; // collapse dropdown after selection
    const soldierId = sel?.value;
    if (!soldierId) {
        document.getElementById('signEquipSection').style.display = 'none';
        document.getElementById('signSignatureSection').style.display = 'none';
        document.getElementById('signSoldierInfo').style.display = 'none';
        return;
    }
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    // Show soldier info with clear highlight + editable sizes
    const info = document.getElementById('signSoldierInfo');
    info.style.display = '';
    const shoeOpts = ['','36','37','38','39','40','41','42','43','44','45','46','47','48','49'].map(v => `<option value="${v}"${v === (sol.shoeSize||'') ? ' selected' : ''}>${v || '--'}</option>`).join('');
    const sizeList = ['','קק','ק','ב1','ב2','ב3','ג1','ג2','ג3','מ','ממ','מממ','ממממ'];
    const shirtOpts = sizeList.map(v => `<option value="${v}"${v === (sol.shirtSize||'') ? ' selected' : ''}>${v || '--'}</option>`).join('');
    const pantsOpts = sizeList.map(v => `<option value="${v}"${v === (sol.pantsSize||'') ? ' selected' : ''}>${v || '--'}</option>`).join('');
    info.innerHTML = `<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <span style="font-size:1.2em;">&#9745;</span>
        <span><strong>${esc(sol.name)}</strong> | ${esc(sol.role||'לוחם')} | מ.א: ${esc(sol.personalId||'-')}</span>
    </div>
    <div style="display:flex;gap:10px;margin-top:6px;align-items:center;font-size:0.85em;flex-wrap:wrap;">
        <label style="display:flex;align-items:center;gap:4px;">נעליים: <select id="signShoeSize" onchange="updateSoldierSizeFromSign()" style="padding:3px 6px;border:1px solid var(--border);border-radius:4px;font-size:0.95em;">${shoeOpts}</select></label>
        <label style="display:flex;align-items:center;gap:4px;">חולצה: <select id="signShirtSize" onchange="updateSoldierSizeFromSign()" style="padding:3px 6px;border:1px solid var(--border);border-radius:4px;font-size:0.95em;">${shirtOpts}</select></label>
        <label style="display:flex;align-items:center;gap:4px;">מכנס: <select id="signPantsSize" onchange="updateSoldierSizeFromSign()" style="padding:3px 6px;border:1px solid var(--border);border-radius:4px;font-size:0.95em;">${pantsOpts}</select></label>
    </div>`;

    // Show equipment mode selection
    const CMD_SET_EXCLUDED = ['רס"פ', 'סרס"פ'];
    const isCommander = sol.role && SIGNING_ROLES.includes(sol.role) && !CMD_SET_EXCLUDED.includes(sol.role);

    const container = document.getElementById('signEquipCheckboxList');
    container.innerHTML = `
        <div style="display:flex;gap:8px;margin-bottom:10px;">
            <button class="btn btn-primary" onclick="loadSignSetMode(${isCommander})" style="flex:1;padding:10px;">סט ציוד ללוחם</button>
            <button class="btn" onclick="loadSignManualMode()" style="flex:1;padding:10px;background:#4CAF50;color:white;">בחירת פריטים ידנית</button>
        </div>`;
    document.getElementById('signEquipSection').style.display = '';
    document.getElementById('signSignatureSection').style.display = '';

    // Show issuer details before signature
    const issuerSoldier = state.soldiers.find(s => s.personalId === currentUser.personalId);
    const issuerInfoEl = document.getElementById('signIssuerInfo');
    if (issuerInfoEl) {
        issuerInfoEl.style.display = '';
        issuerInfoEl.innerHTML = `
            <div style="font-weight:600;font-size:0.85em;margin-bottom:6px;color:var(--primary);">פרטי מנפיק:</div>
            <div style="display:grid;grid-template-columns:auto 1fr;gap:4px 12px;font-size:0.83em;">
                <span style="font-weight:600;">שם:</span><span>${esc(currentUser.name || '-')}</span>
                <span style="font-weight:600;">מ.א:</span><span>${esc(currentUser.personalId || '-')}</span>
                <span style="font-weight:600;">תפקיד:</span><span>${esc(issuerSoldier?.role || '-')}</span>
                <span style="font-weight:600;">טלפון:</span><span>${esc(issuerSoldier?.phone || '-')}</span>
            </div>`;
    }

    // Setup canvas AFTER section is visible (getBoundingClientRect needs visible element)
    setTimeout(() => { setupSignatureCanvas('signatureCanvas'); clearCanvasById('signatureCanvas'); }, 50);
}

function updateSoldierSizeFromSign() {
    const soldierId = document.getElementById('signSoldier')?.value;
    if (!soldierId) return;
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;
    const shoe = document.getElementById('signShoeSize')?.value || '';
    const shirt = document.getElementById('signShirtSize')?.value || '';
    const pants = document.getElementById('signPantsSize')?.value || '';
    if (shoe !== (sol.shoeSize || '')) { sol.shoeSize = shoe; }
    if (shirt !== (sol.shirtSize || '')) { sol.shirtSize = shirt; }
    if (pants !== (sol.pantsSize || '')) { sol.pantsSize = pants; }
    saveState();
}

function loadSignSetMode(includeCmd) {
    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const baseItems = (es.baseSet?.items) || [];
    const cmdSet = (es.roleSets || []).find(rs => rs.id === 'rs_commander');
    const cmdItems = includeCmd ? (cmdSet?.items || []) : [];

    let html = `
    <div style="background:var(--primary);color:white;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:600;font-size:0.85em;">סט ציוד ללוחם (${baseItems.length})</div>
    <table style="width:100%;border-collapse:collapse;font-size:0.82em;margin-bottom:4px;">
        <thead><tr style="background:var(--bg);"><th style="text-align:right;padding:3px 6px;">פריט</th><th style="padding:3px 4px;">מס' צ'</th><th style="padding:3px 2px;width:42px;">כמות</th></tr></thead>
        <tbody>${baseItems.map((item, i) => `<tr style="border-bottom:1px solid var(--border);">
            <td style="padding:2px 6px;text-align:right;white-space:nowrap;font-size:0.92em;">
                <input type="checkbox" value="bs_${i}" data-src="baseset" data-name="${esc(item.name)}" data-qty="${item.quantity}" data-category="${esc(item.category)}" data-serial-req="${item.requiresSerial}" checked style="display:none;">
                ${esc(item.name)}
            </td>
            <td style="padding:2px 3px;text-align:center;">${item.requiresSerial ? `<input type="text" class="sign-bs-serial" data-bs-idx="${i}" placeholder="הזן מספר" style="width:100%;min-width:120px;padding:5px 8px;border:2px solid #90CAF9;border-radius:5px;font-size:1.05em;text-align:center;direction:ltr;background:#f8fbff;">` : '<span style="color:#bbb;">—</span>'}</td>
            <td style="padding:2px 2px;text-align:center;"><input type="number" min="0" value="${item.quantity}" data-bs-qty="${i}" style="width:38px;padding:2px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:0.92em;"></td>
        </tr>`).join('')}</tbody>
    </table>`;

    if (cmdItems.length > 0) {
        html += `
        <div style="background:#e65100;color:white;padding:6px 10px;border-radius:6px 6px 0 0;font-weight:600;font-size:0.85em;margin-top:8px;">סט מפקד (${cmdItems.length})</div>
        <table style="width:100%;border-collapse:collapse;font-size:0.82em;">
            <thead><tr style="background:var(--bg);"><th style="text-align:right;padding:3px 6px;">פריט</th><th style="padding:3px 4px;">מס' צ'</th><th style="padding:3px 2px;width:42px;">כמות</th></tr></thead>
            <tbody>${cmdItems.map((item, i) => `<tr style="border-bottom:1px solid var(--border);">
                <td style="padding:2px 6px;text-align:right;white-space:nowrap;font-size:0.92em;">
                    <input type="checkbox" value="cmd_${i}" data-src="cmdset" data-name="${esc(item.name)}" data-qty="${item.quantity}" data-category="${esc(item.category)}" data-serial-req="${item.requiresSerial}" checked style="display:none;">
                    ${esc(item.name)}
                </td>
                <td style="padding:2px 3px;text-align:center;">${item.requiresSerial ? `<input type="text" class="sign-cmd-serial" data-cmd-idx="${i}" placeholder="הזן מספר" style="width:100%;min-width:120px;padding:5px 8px;border:2px solid #FFCC80;border-radius:5px;font-size:1.05em;text-align:center;direction:ltr;background:#fffbf5;">` : '<span style="color:#bbb;">—</span>'}</td>
                <td style="padding:2px 2px;text-align:center;"><input type="number" min="0" value="${item.quantity}" data-cmd-qty="${i}" style="width:38px;padding:2px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:0.92em;"></td>
            </tr>`).join('')}</tbody>
        </table>`;
    }

    document.getElementById('signEquipCheckboxList').innerHTML = html;
}

function loadSignManualMode() {
    const allItems = new Map();
    const es = settings.equipmentSets || {};
    (es.baseSet?.items || []).forEach(item => allItems.set(item.name, item));
    (es.roleSets || []).forEach(rs => (rs.items || []).forEach(item => allItems.set(item.name, item)));
    state.equipment.forEach(e => { if (!allItems.has(e.type)) allItems.set(e.type, { name: e.type, requiresSerial: false }); });
    const types = [...allItems.keys()].sort();

    let html = `<input type="text" id="signManualSearch" placeholder="חפש ציוד..." oninput="filterManualEquip()" style="padding:6px 10px;font-size:0.88em;margin-bottom:6px;width:100%;">`;
    html += `<div id="signManualList" style="max-height:200px;overflow-y:auto;border:1px solid var(--border);border-radius:6px;">
        <table style="width:100%;border-collapse:collapse;font-size:0.84em;">
        <tbody>${types.map((t, i) => {
            const item = allItems.get(t);
            const needsSerial = item && item.requiresSerial === true;
            const defQty = item?.quantity || 1;
            return `<tr class="sign-manual-row" data-name="${esc(t)}" style="border-bottom:1px solid var(--border);">
            <td style="padding:5px 8px;text-align:right;">
                <input type="checkbox" value="manual_${i}" data-src="baseset" data-name="${esc(t)}" data-qty="${defQty}" data-category="${esc(item?.category || detectCategoryFromType(t))}" data-serial-req="${needsSerial}" style="margin-left:6px;">
                ${esc(t)}
            </td>
            <td style="padding:2px 4px;text-align:center;width:95px;">${needsSerial ? `<input type="text" class="sign-bs-serial" data-bs-idx="m${i}" placeholder="צ'" style="width:85px;padding:3px 5px;border:1px solid var(--border);border-radius:4px;font-size:0.88em;text-align:center;direction:ltr;">` : '<span style="color:#bbb;">—</span>'}</td>
            <td style="padding:2px 4px;text-align:center;width:50px;"><input type="number" min="1" value="${defQty}" data-bs-qty="m${i}" style="width:42px;padding:2px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:0.88em;"></td>
        </tr>`;
        }).join('')}</tbody>
        </table>
    </div>`;

    document.getElementById('signEquipCheckboxList').innerHTML = html;
}

function filterManualEquip() {
    const q = document.getElementById('signManualSearch').value.trim().toLowerCase();
    document.querySelectorAll('.sign-manual-row').forEach(row => {
        row.style.display = row.dataset.name.toLowerCase().includes(q) ? '' : 'none';
    });
}

// Old filterSignEquipCheckboxes, toggleSignSet, onSignSoldierChange, updateSignEquipSelection
// removed — replaced by onSignSoldierSelect() + loadSignSetMode() + loadSignManualMode()

function getSelectedSignEquipItems() {
    const checked = Array.from(document.querySelectorAll('#signEquipCheckboxList input[type="checkbox"]:checked'));
    return checked.filter(cb => cb.dataset.src).map(cb => {
        if (cb.dataset.src === 'baseset') {
            // Handle both set mode (bs_N) and manual mode (manual_N)
            let idx;
            if (cb.value.startsWith('bs_')) idx = cb.value.replace('bs_', '');
            else if (cb.value.startsWith('manual_')) idx = 'm' + cb.value.replace('manual_', '');
            else idx = cb.value;
            const qtyInput = document.querySelector(`input[data-bs-qty="${idx}"]`);
            const serialInput = document.querySelector(`.sign-bs-serial[data-bs-idx="${idx}"]`);
            const qty = qtyInput ? parseInt(qtyInput.value) || 0 : parseInt(cb.dataset.qty) || 1;
            return {
                src: 'baseset',
                id: cb.value,
                name: cb.dataset.name,
                qty,
                category: cb.dataset.category,
                serialRequired: cb.dataset.serialReq === 'true',
                serial: serialInput ? serialInput.value.trim() : ''
            };
        }
        if (cb.dataset.src === 'cmdset') {
            const idx = cb.value.replace('cmd_', '');
            const qtyInput = document.querySelector(`input[data-cmd-qty="${idx}"]`);
            const serialInput = document.querySelector(`.sign-cmd-serial[data-cmd-idx="${idx}"]`);
            const qty = qtyInput ? parseInt(qtyInput.value) || 0 : parseInt(cb.dataset.qty) || 1;
            return {
                src: 'cmdset',
                id: cb.value,
                name: cb.dataset.name,
                qty,
                category: cb.dataset.category,
                serialRequired: cb.dataset.serialReq === 'true',
                serial: serialInput ? serialInput.value.trim() : ''
            };
        }
        return { src: 'equip', id: cb.value };
    }).filter(item => item.src === 'equip' || item.qty > 0);
}
// Backward compat
function getSelectedSignEquipIds() {
    return getSelectedSignEquipItems().filter(i => i.src === 'equip').map(i => i.id);
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

// Old onSignSoldierSelect removed - new version at line ~5082 with mode buttons

function confirmSignEquipment() {
    if (!canSignEquipment()) { showToast('אין לך הרשאה להחתים ציוד', 'error'); return; }
    const selectedItems = getSelectedSignEquipItems();
    const soldierId = document.getElementById('signSoldier').value;
    const editLogId = document.getElementById('signEquipmentModal').dataset.editLogId || '';

    if (selectedItems.length === 0) { showToast('יש לבחור לפחות פריט ציוד אחד', 'error'); return; }
    if (!soldierId) { showToast('יש לבחור חייל', 'error'); return; }

    // Validate serial numbers - required for items that need them
    const missingSerials = selectedItems.filter(item => item.serialRequired && !item.serial);
    if (missingSerials.length > 0) {
        const names = missingSerials.map(i => i.name).join(', ');
        showToast(`חסר מספר צ\' עבור: ${names}`, 'error');
        return;
    }

    // Validate sizes for clothing items
    const selectedNames = selectedItems.map(i => (i.name || '').toLowerCase());
    const hasShirt = selectedNames.some(n => n.includes('חולצ'));
    const hasPants = selectedNames.some(n => n.includes('מכנס'));
    const hasShoes = selectedNames.some(n => n.includes('נעל') || n.includes('נעליים'));
    const shirtSize = document.getElementById('signShirtSize')?.value || '';
    const pantsSize = document.getElementById('signPantsSize')?.value || '';
    const shoeSize = document.getElementById('signShoeSize')?.value || '';
    const missingSizes = [];
    if (hasShirt && !shirtSize) missingSizes.push('חולצה');
    if (hasPants && !pantsSize) missingSizes.push('מכנס');
    if (hasShoes && !shoeSize) missingSizes.push('נעליים');
    if (missingSizes.length > 0) {
        showToast(`חסרה מידה עבור: ${missingSizes.join(', ')}`, 'error');
        return;
    }

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
            state.signatureLog = state.signatureLog.filter(l => l.id !== editLogId);
        }
    }

    // Process selected items: existing equipment + baseSet templates
    const allEquip = [];
    selectedItems.forEach(item => {
        if (item.src === 'equip') {
            const eq = state.equipment.find(e => e.id === item.id);
            if (eq) allEquip.push(eq);
        } else if (item.src === 'baseset') {
            // Auto-create equipment entry from baseSet template
            const newEq = {
                id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: item.name,
                serial: item.serial || '',
                company: sol.company,
                condition: 'תקין',
                category: item.category || 'לוגיסטיקה',
                holderId: null,
                holderName: '',
                holderPhone: '',
                assignedDate: null,
                signatureImg: null,
                notes: '',
                defaultQty: item.qty
            };
            state.equipment.push(newEq);
            allEquip.push(newEq);
        } else if (item.src === 'cmdset') {
            // Auto-create equipment entry from commander set template
            const newEq = {
                id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
                type: item.name,
                serial: item.serial || '',
                company: sol.company,
                condition: 'תקין',
                category: item.category || 'אחר',
                holderId: null,
                holderName: '',
                holderPhone: '',
                assignedDate: null,
                signatureImg: null,
                notes: '',
                defaultQty: item.qty
            };
            state.equipment.push(newEq);
            allEquip.push(newEq);
        }
    });

    if (allEquip.length === 0) { showToast('שגיאה בבחירת ציוד', 'error'); return; }

    // Validate no serial duplicates - prevent same צ' assigned to multiple soldiers
    const serialErrors = [];
    allEquip.forEach(eq => {
        if (eq.serial) {
            const existing = state.equipment.find(e => e.id !== eq.id && e.serial === eq.serial && e.holderId);
            if (existing) {
                const holder = state.soldiers.find(s => s.id === existing.holderId);
                serialErrors.push(`מספר צ' ${eq.serial} (${eq.type}) כבר מוקצה ל-${holder?.name || 'חייל אחר'}`);
            }
        }
    });
    if (serialErrors.length > 0) {
        showToast(serialErrors.join('\n'), 'error');
        // Remove newly created equipment entries that failed validation
        allEquip.forEach(eq => {
            const idx = state.equipment.indexOf(eq);
            if (idx !== -1 && !eq.holderId) state.equipment.splice(idx, 1);
        });
        return;
    }

    // Update each equipment item - assign to soldier
    allEquip.forEach(eq => {
        eq.holderId = sol.id;
        eq.holderName = sol.name;
        eq.holderPhone = sol.phone || '';
        eq.assignedDate = dateStr;
        eq.signatureImg = signatureImg;
        eq.issuerId = currentUser.personalId || '';
        eq.issuerName = currentUser.name || '';
    });

    // Find issuer details from soldiers list
    const issuerSoldier = state.soldiers.find(s => s.personalId === currentUser.personalId);

    // Create ONE batch log entry
    const logEntry = {
        id: 'sig_' + Date.now(),
        type: 'assign',
        equipId: allEquip[0].id,
        equipType: allEquip[0].type,
        equipSerial: allEquip[0].serial,
        equipItems: allEquip.map(eq => ({
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
        signatureImg,
        issuedBy: currentUser.name || '',
        issuerUnit: currentUser.unit || '',
        issuerRole: issuerSoldier?.role || '',
        issuerPersonalId: currentUser.personalId || '',
        issuerPhone: issuerSoldier?.phone || ''
    };
    state.signatureLog.push(logEntry);
    saveState();

    // Clear edit context
    delete document.getElementById('signEquipmentModal').dataset.editLogId;

    closeModal('signEquipmentModal');
    renderEquipmentTab();

    const itemNames = allEquip.map(e => e.type).join(', ');
    showToast(`${sol.name} חתם על ${allEquip.length} פריטים: ${itemNames}`);

    // Auto-download PDF
    try { generateSignaturePDF(logEntry, null, sol); } catch(e) { console.warn('PDF auto-download failed:', e); }
}

// --- Return Equipment (soldier-first flow) ---
function openReturnEquipment() {
    const compDd = document.getElementById('returnCompany');
    const compGroup = document.getElementById('returnCompanyGroup');
    if (getUserPermissionLevel() < PERM.COMPANY_CMD && currentUser.unit !== 'palsam') {
        compDd.value = currentUser.unit;
        if (compGroup) compGroup.style.display = 'none';
    } else {
        compDd.value = 'all';
        if (compGroup) compGroup.style.display = '';
    }
    updateReturnSoldiers();
    document.getElementById('returnSoldierEquipCard').style.display = 'none';
    document.getElementById('returnNotes').value = '';
    openModal('returnEquipmentModal');
    setTimeout(() => {
        setupSignatureCanvas('returnSignatureCanvas');
        clearReturnSignatureCanvas();
    }, 100);
}

function updateReturnSoldiers() {
    const company = document.getElementById('returnCompany').value;
    const sel = document.getElementById('returnSoldier');
    sel.innerHTML = '<option value="">-- בחר חייל --</option>';
    const holdingIds = new Set(state.equipment.filter(e => e.holderId).map(e => e.holderId));
    let soldiers = state.soldiers.filter(s => holdingIds.has(s.id));
    if (company !== 'all') soldiers = soldiers.filter(s => s.company === company);
    soldiers.sort((a, b) => a.name.localeCompare(b.name, 'he'));
    soldiers.forEach(s => {
        const opt = document.createElement('option');
        opt.value = s.id;
        const compName = companyData[s.company]?.name || s.company;
        opt.textContent = `${s.name} (${s.role || 'לוחם'}) - ${compName}`;
        sel.appendChild(opt);
    });
    document.getElementById('returnSoldierEquipCard').style.display = 'none';
}

function onReturnSoldierSelect() {
    const soldierId = document.getElementById('returnSoldier').value;
    const card = document.getElementById('returnSoldierEquipCard');
    if (!soldierId) { card.style.display = 'none'; return; }
    const sol = state.soldiers.find(s => s.id === soldierId);
    const heldItems = state.equipment.filter(e => e.holderId === soldierId);
    if (!sol || heldItems.length === 0) {
        card.style.display = '';
        card.innerHTML = '<p style="color:var(--text-light);padding:8px;">לחייל זה אין ציוד מוחזק</p>';
        return;
    }
    card.style.display = '';
    card.innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:10px 12px;margin-bottom:10px;">
            <strong>${esc(sol.name)}</strong> | ${esc(sol.role || 'לוחם')} | מ.א: ${esc(sol.personalId || '-')}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>ציוד מוחזק (${heldItems.length} פריטים)</strong>
            <div style="display:flex;gap:6px;">
                <button type="button" class="btn btn-sm" style="background:var(--success);color:#fff;font-size:0.8em;" onclick="document.querySelectorAll('.return-equip-cb').forEach(c=>c.checked=true)">בחר הכל</button>
                <button type="button" class="btn btn-sm" style="background:var(--bg);font-size:0.8em;" onclick="document.querySelectorAll('.return-equip-cb').forEach(c=>c.checked=false)">נקה הכל</button>
            </div>
        </div>
        <div class="table-scroll">
            <table style="width:100%;border-collapse:collapse;font-size:0.85em;">
                <thead><tr style="background:var(--primary);color:#fff;">
                    <th style="padding:6px;width:30px;"></th>
                    <th style="padding:6px;text-align:right;">סוג ציוד</th>
                    <th style="padding:6px;">מספר צ'</th>
                    <th style="padding:6px;">כמות</th>
                    <th style="padding:6px;">תאריך חתימה</th>
                </tr></thead>
                <tbody>
                    ${heldItems.map(e => `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:4px;text-align:center;"><input type="checkbox" class="return-equip-cb" value="${e.id}" checked></td>
                        <td style="padding:4px 6px;font-weight:600;text-align:right;">${esc(e.type)}</td>
                        <td style="padding:4px 6px;direction:ltr;text-align:center;">${esc(e.serial || '-')}</td>
                        <td style="padding:4px 6px;text-align:center;">${e.defaultQty || 1}</td>
                        <td style="padding:4px 6px;text-align:center;">${e.assignedDate ? formatDate(e.assignedDate.split('T')[0]) : '-'}</td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>`;
}

function confirmReturnEquipment() {
    if (!canSignEquipment()) { showToast('אין לך הרשאה לזכות ציוד', 'error'); return; }
    const checkedIds = Array.from(document.querySelectorAll('.return-equip-cb:checked')).map(cb => cb.value);
    if (checkedIds.length === 0) { showToast('יש לבחור לפחות פריט אחד להחזרה', 'error'); return; }
    if (isCanvasEmpty('returnSignatureCanvas')) { showToast('יש לחתום על המסך', 'error'); return; }

    const soldierId = document.getElementById('returnSoldier').value;
    const sol = state.soldiers.find(s => s.id === soldierId);
    const signatureImg = getCanvasDataURL('returnSignatureCanvas');
    const returnNotes = document.getElementById('returnNotes').value.trim();
    const now = new Date();

    // Find issuer details from soldiers list
    const issuerSoldier = state.soldiers.find(s => s.personalId === currentUser.personalId);

    const returnedItems = [];
    checkedIds.forEach(equipId => {
        const eq = state.equipment.find(e => e.id === equipId);
        if (!eq) return;
        returnedItems.push({ equipId: eq.id, equipType: eq.type, equipSerial: eq.serial, equipQty: eq.defaultQty || 1 });
        // Return to warehouse inventory - clear holder AND company
        eq.holderId = null;
        eq.holderName = '';
        eq.holderPhone = '';
        eq.assignedDate = null;
        eq.signatureImg = null;
        eq.company = '';
        if (returnNotes) eq.notes = returnNotes;
    });

    if (returnedItems.length === 0) return;

    const logEntry = {
        id: 'sig_' + Date.now(),
        type: 'return',
        equipId: returnedItems[0].equipId,
        equipType: returnedItems[0].equipType,
        equipSerial: returnedItems[0].equipSerial,
        equipItems: returnedItems,
        soldierId: soldierId,
        soldierName: sol?.name || '',
        soldierPhone: sol?.phone || '',
        soldierPersonalId: sol?.personalId || '',
        date: now.toISOString(),
        signatureImg,
        notes: returnNotes,
        issuedBy: currentUser.name || '',
        issuerUnit: currentUser.unit || '',
        issuerRole: issuerSoldier?.role || '',
        issuerPersonalId: currentUser.personalId || '',
        issuerPhone: issuerSoldier?.phone || ''
    };
    state.signatureLog.push(logEntry);
    saveState();

    closeModal('returnEquipmentModal');
    renderEquipmentTab();
    showToast(`${returnedItems.length} פריטים זוכו והוחזרו למלאי מחסן`);

    // Auto-download return PDF
    if (returnedItems.length > 0) {
        const firstEq = state.equipment.find(e => e.id === returnedItems[0].equipId) || { type: returnedItems[0].equipType, serial: returnedItems[0].equipSerial };
        try { generateReturnPDF(logEntry, firstEq); } catch(e) { console.warn('Return PDF failed:', e); }
    }
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
    // Toggle sign/return buttons based on permission
    const btnSign = document.getElementById('btnSignEquip');
    const btnReturn = document.getElementById('btnReturnEquip');
    if (btnSign) btnSign.style.display = canSignEquipment() ? '' : 'none';
    if (btnReturn) btnReturn.style.display = canSignEquipment() ? '' : 'none';

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

    // Filter by status
    if (equipmentFilter === 'assigned') items = items.filter(e => e.holderId);
    else if (equipmentFilter === 'available') items = items.filter(e => !e.holderId && !['תקול','אובדן','מת"ש'].includes(e.condition));
    else if (equipmentFilter === 'faulty') items = items.filter(e => e.condition === 'תקול');
    else if (equipmentFilter === 'lost') items = items.filter(e => e.condition === 'אובדן' || e.condition === 'מת"ש');

    // Filter by warehouse
    const whFilter = document.getElementById('equipWarehouseFilter');
    if (whFilter && whFilter.value !== 'all') {
        items = items.filter(e => (e.warehouse || CONFIG.defaultWarehouse) === whFilter.value);
    }

    // Stats
    const statsEl = document.getElementById('equipmentStats');
    if (statsEl) {
        const total = state.equipment.length;
        const assigned = state.equipment.filter(e => e.holderId).length;
        const available = state.equipment.filter(e => !e.holderId && !['תקול','אובדן','מת"ש'].includes(e.condition)).length;
        const faulty = state.equipment.filter(e => e.condition === 'תקול').length;
        const lost = state.equipment.filter(e => e.condition === 'אובדן' || e.condition === 'מת"ש').length;
        statsEl.innerHTML = `
            <div class="quick-stat"><div class="value">${total}</div><div class="label">סה"כ פריטים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success);"><div class="value">${assigned}</div><div class="label">מוחזקים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--info);"><div class="value">${available}</div><div class="label">פנויים</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger);"><div class="value">${faulty}</div><div class="label">תקולים</div></div>
            ${lost ? `<div class="quick-stat" style="border-top:3px solid #9C27B0;"><div class="value">${lost}</div><div class="label">אובדן/מת"ש</div></div>` : ''}
        `;
    }

    // Count
    const countEl = document.getElementById('equipmentCount');
    if (countEl) countEl.textContent = items.length;

    // Table
    const tableContainer = document.getElementById('equipmentTableContainer');
    if (!tableContainer) return;

    const companyNames = getCompNames();

    if (items.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state"><div class="icon"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg></div><p>אין פריטי ציוד</p></div>';
    } else {
        tableContainer.innerHTML = `
            <div id="equipBulkBar" style="display:none;background:#fff3e0;padding:8px 12px;border-radius:6px;margin-bottom:8px;display:none;align-items:center;gap:10px;">
                <span id="equipSelectedCount" style="font-weight:600;font-size:0.88em;">0 נבחרו</span>
                <button class="btn btn-danger btn-sm" onclick="deleteSelectedEquipment()" style="font-size:0.82em;">מחק נבחרים</button>
                <button class="btn btn-sm" onclick="clearEquipSelection()" style="background:var(--bg);font-size:0.82em;">בטל בחירה</button>
            </div>
            <div class="task-table-wrapper"><div class="table-scroll">
                <table class="equip-table">
                    <thead><tr>
                        <th style="width:30px;"><input type="checkbox" id="equipSelectAll" onchange="toggleEquipSelectAll(this.checked)" title="בחר הכל"></th>
                        <th>סוג ציוד</th><th>מספר סידורי</th><th>כמות</th><th>מחסן</th><th>מסגרת</th><th>מצב</th>
                        <th>סטטוס</th><th>מחזיק</th><th>טלפון</th><th>תאריך חתימה</th><th>פעולות</th>
                    </tr></thead>
                    <tbody>
                        ${items.map(e => {
                            const statusClass = ['תקול','אובדן','מת"ש'].includes(e.condition) ? 'faulty' : e.holderId ? 'assigned' : 'available';
                            const statusText = e.condition === 'תקול' ? 'תקול' : e.condition === 'אובדן' ? 'אובדן' : e.condition === 'מת"ש' ? 'מת"ש' : e.holderId ? 'מוחזק' : 'פנוי';
                            return `<tr>
                                <td style="text-align:center;"><input type="checkbox" class="equip-select-cb" value="${e.id}" onchange="updateEquipBulkBar()"></td>
                                <td style="font-weight:600;">${esc(e.type)}</td>
                                <td style="direction:ltr;font-family:monospace;">${esc(e.serial)}</td>
                                <td>${e.defaultQty || 1}</td>
                                <td style="font-size:0.82em;">${esc(e.warehouse || CONFIG.defaultWarehouse)}</td>
                                <td>${esc(companyNames[e.company] || e.company || 'מלאי מחסן')}</td>
                                <td>${esc(e.condition || '')}</td>
                                <td><span class="equip-status ${statusClass}">${statusText}</span></td>
                                <td class="equip-holder-name">${esc(e.holderName || '-')}</td>
                                <td style="direction:ltr;">${esc(e.holderPhone || '-')}</td>
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

function toggleEquipSelectAll(checked) {
    document.querySelectorAll('.equip-select-cb').forEach(cb => { cb.checked = checked; });
    updateEquipBulkBar();
}

function updateEquipBulkBar() {
    const checked = document.querySelectorAll('.equip-select-cb:checked');
    const bar = document.getElementById('equipBulkBar');
    const countEl = document.getElementById('equipSelectedCount');
    if (bar) bar.style.display = checked.length > 0 ? 'flex' : 'none';
    if (countEl) countEl.textContent = `${checked.length} נבחרו`;
    // Sync "select all" checkbox
    const allCb = document.getElementById('equipSelectAll');
    const total = document.querySelectorAll('.equip-select-cb').length;
    if (allCb) allCb.checked = checked.length === total && total > 0;
}

function clearEquipSelection() {
    document.querySelectorAll('.equip-select-cb').forEach(cb => { cb.checked = false; });
    const allCb = document.getElementById('equipSelectAll');
    if (allCb) allCb.checked = false;
    updateEquipBulkBar();
}

async function deleteSelectedEquipment() {
    const checkedIds = Array.from(document.querySelectorAll('.equip-select-cb:checked')).map(cb => cb.value);
    if (checkedIds.length === 0) return;

    if (!await customDeleteConfirm()) return;

    const deletedItems = state.equipment.filter(e => checkedIds.includes(e.id));
    logEquipDeletion(deletedItems);
    state.equipment = state.equipment.filter(e => !checkedIds.includes(e.id));
    saveState();
    renderEquipmentTab();
    showToast(`${checkedIds.length} פריטים נמחקו`);
    refreshIcons();
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
        const isDelete = log.type === 'delete';
        const d = new Date(log.date);
        const dateFormatted = d.toLocaleDateString('he-IL') + ' ' + d.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        // Handle batch display
        let equipDisplay;
        if (log.equipItems && log.equipItems.length > 1) {
            equipDisplay = `${log.equipItems.length} פריטים: ${log.equipItems.map(i => esc(i.equipType)).join(', ')}`;
        } else {
            equipDisplay = `${esc(log.equipType || '')}${log.equipSerial ? ' (' + esc(log.equipSerial) + ')' : ''}`;
        }

        const typeLabel = isDelete ? 'מחיקה' : isReturn ? 'זיכוי' : 'חתימה';
        const cardClass = isDelete ? 'delete' : isReturn ? 'return' : '';

        return `<div class="sig-history-card ${cardClass}" ${isDelete ? 'style="border-right:3px solid #9C27B0;opacity:0.85;"' : ''}>
            <div class="sig-info">
                <h4>${typeLabel} — ${equipDisplay}</h4>
                <div class="meta">${esc(log.soldierName || '-')} | ${esc(log.soldierPersonalId || '')} | ${esc(log.soldierPhone || '')}</div>
                <div class="meta">${dateFormatted}${log.issuedBy ? ' | ' + (isDelete ? 'מחק: ' : 'מחתים: ') + esc(log.issuedBy) : ''}${log.notes ? ' | ' + esc(log.notes) : ''}</div>
            </div>
            <div class="sig-actions">
                ${log.signatureImg ? `<img class="sig-preview" src="${log.signatureImg}" alt="חתימה">` : ''}
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${!isDelete ? `<button class="btn btn-primary btn-sm" onclick="redownloadPDF('${log.id}')">PDF</button>` : ''}
                    ${!isReturn && !isDelete ? `<button class="btn btn-sm" style="background:var(--card);" onclick="editSignatureLog('${log.id}')" title="עריכה">עריכה</button>` : ''}
                    <button class="btn btn-danger btn-sm" onclick="deleteSignatureLog('${log.id}')" title="מחיקה">מחק</button>
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

    // Release equipment back to warehouse if it was an assign
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
                eq.company = '';
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

    // Open sign modal and pre-select the soldier
    openModal('signEquipmentModal');
    document.getElementById('signCompany').value = 'all';
    updateSignSoldiers();
    setTimeout(() => {
        const solSel = document.getElementById('signSoldier');
        if (solSel) { solSel.value = log.soldierId; onSignSoldierSelect(); }
        // Store edit context
        document.getElementById('signEquipmentModal').dataset.editLogId = logId;

        // Load manual mode and pre-populate with existing items
        setTimeout(() => {
            loadSignManualMode();
            const items = log.equipItems || [];
            if (items.length > 0) {
                // Check matching checkboxes and fill serials/quantities
                document.querySelectorAll('#signEquipCheckboxList .sign-manual-row').forEach(row => {
                    const rowName = row.dataset.name;
                    const match = items.find(it => it.equipType === rowName);
                    if (match) {
                        const cb = row.querySelector('input[type="checkbox"]');
                        if (cb) cb.checked = true;
                        const serialInput = row.querySelector('.sign-bs-serial');
                        if (serialInput && match.equipSerial) serialInput.value = match.equipSerial;
                        const qtyInput = row.querySelector('input[type="number"]');
                        if (qtyInput && match.equipQty) qtyInput.value = match.equipQty;
                    }
                });
            }
        }, 50);
    }, 100);
    setTimeout(() => {
        setupSignatureCanvas('signatureCanvas');
        clearSignatureCanvas();
    }, 200);
}

// --- PDF Generation ---
// Helper: Hebrew punctuation fix for PDFs
function pdfTxt(str) {
    return (str || '').replace(/'/g, '\u05F3').replace(/"/g, '\u05F4');
}

function generateSignaturePDF(logEntry, eqUnused, sol) {
    const now = new Date(logEntry.date);
    const dateStr = now.toLocaleDateString('he-IL');
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    const items = logEntry.equipItems
        ? logEntry.equipItems
        : [{ equipType: logEntry.equipType, equipSerial: logEntry.equipSerial, equipQty: 1 }];

    const logoHtml = DOC_LOGO_BASE64
        ? `<img src="${DOC_LOGO_BASE64}" style="max-height:80px;margin-bottom:8px;">`
        : '';

    const itemRows = items.map((item, i) => `
        <tr>
            <td style="padding:6px 8px;text-align:center;border:1px solid #dfe6e9;">${i + 1}</td>
            <td style="padding:6px 8px;text-align:right;direction:rtl;border:1px solid #dfe6e9;font-weight:600;">${pdfTxt(item.equipType)}</td>
            <td style="padding:6px 8px;text-align:center;border:1px solid #dfe6e9;direction:ltr;">${item.equipSerial || ''}</td>
            <td style="padding:6px 8px;text-align:center;border:1px solid #dfe6e9;">${item.equipQty || 1}</td>
        </tr>
    `).join('');

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:auto;padding:24px 30px;color:#1a1a1a;word-spacing:2px;">
        <!-- Header -->
        <div style="text-align:center;margin-bottom:16px;">
            ${logoHtml}
            <h1 style="color:#1a3a5c;margin:4px 0 2px;font-size:1.35em;letter-spacing:0.3px;">${pdfTxt('טופס קבלת ציוד מבוקר')}</h1>
            <p style="color:#7f8c8d;margin:0;font-size:0.82em;">${pdfTxt('מערכת ניהול גדודי — צל"מ')}</p>
        </div>
        <hr style="border:none;border-top:2px solid #1a3a5c;margin:0 0 14px;">

        <!-- Soldier details -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #d0d7de;border-radius:8px;margin-bottom:14px;font-size:0.9em;">
            <tr><td style="padding:9px 14px;background:#f6f8fa;font-weight:700;border:1px solid #d0d7de;width:130px;">${pdfTxt('שם מלא')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${pdfTxt(sol.name)}</td></tr>
            <tr><td style="padding:9px 14px;background:#f6f8fa;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('מספר אישי')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${sol.personalId || '-'}</td></tr>
            <tr><td style="padding:9px 14px;background:#f6f8fa;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('טלפון')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;direction:ltr;text-align:right;">${sol.phone || '-'}</td></tr>
            ${sol.shirtSize || sol.pantsSize || sol.shoeSize ? `<tr><td style="padding:9px 14px;background:#f6f8fa;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('מידות')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${[sol.shirtSize ? pdfTxt('חולצה:') + '\u00A0' + sol.shirtSize : '', sol.pantsSize ? pdfTxt('מכנס:') + '\u00A0' + sol.pantsSize : '', sol.shoeSize ? pdfTxt('נעליים:') + '\u00A0' + sol.shoeSize : ''].filter(Boolean).join('\u00A0\u00A0\u00A0')}</td></tr>` : ''}
            <tr><td style="padding:9px 14px;background:#f6f8fa;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('תאריך ושעה')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${dateStr}\u00A0\u00A0${timeStr}</td></tr>
        </table>

        <!-- Equipment items -->
        <div style="font-weight:700;margin-bottom:8px;font-size:1em;text-align:right;">${pdfTxt('פריטי ציוד')} (${items.length}):</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:14px;font-size:0.9em;">
            <thead>
                <tr style="background:#1a3a5c;color:white;text-align:center;">
                    <th style="padding:7px 6px;border:1px solid #1a3a5c;width:32px;">#</th>
                    <th style="padding:7px 10px;border:1px solid #1a3a5c;text-align:right;">${pdfTxt('שם פריט')}</th>
                    <th style="padding:7px 10px;border:1px solid #1a3a5c;">${pdfTxt("מספר צ'")}</th>
                    <th style="padding:7px 6px;border:1px solid #1a3a5c;width:50px;">${pdfTxt('כמות')}</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <!-- Issuer -->
        ${logEntry.issuedBy ? `
        <div style="background:#E8EAF6;padding:8px 14px;border-radius:6px;margin-bottom:12px;font-size:0.84em;text-align:right;">
            <strong>${pdfTxt('מנפיק:')}</strong>\u00A0${pdfTxt(logEntry.issuedBy)}\u00A0\u00A0${pdfTxt(logEntry.issuerRole || '')}\u00A0\u00A0${pdfTxt('מ.א')}\u00A0${logEntry.issuerPersonalId || '-'}\u00A0\u00A0${logEntry.issuerPhone || ''}
        </div>` : ''}

        <!-- Declaration -->
        <div style="background:#f6f8fa;border-right:4px solid #1a3a5c;padding:10px 14px;border-radius:0 6px 6px 0;font-size:0.84em;margin-bottom:18px;line-height:1.5;text-align:right;">
            ${pdfTxt('אני הח"מ מאשר/ת קבלת הציוד המפורט לעיל תקין ומתחייב/ת לשמור עליו ולהחזירו.')}
        </div>

        <!-- Signature -->
        <div style="text-align:center;">
            <div style="font-weight:700;margin-bottom:8px;font-size:0.9em;">${pdfTxt('חתימת המקבל/ת:')}</div>
            <img src="${logEntry.signatureImg}" style="max-width:340px;height:90px;border:1px solid #d0d7de;border-radius:8px;background:#fff;">
            <div style="margin-top:4px;font-size:0.78em;color:#7f8c8d;">${pdfTxt(sol.name)}\u00A0\u00A0${dateStr}</div>
        </div>

        <!-- Stamp -->
        ${DOC_STAMP_BASE64 ? `
        <div style="text-align:center;margin-top:14px;">
            <img src="${DOC_STAMP_BASE64}" style="max-height:80px;opacity:0.85;">
        </div>` : ''}

        <hr style="border:none;border-top:1px solid #e0e0e0;margin:14px 0 6px;">
        <div style="text-align:center;font-size:0.68em;color:#aaa;">
            ${pdfTxt('מסמך זה הופק אוטומטית ממערכת ניהול גדודי')}
            <br>${dateStr}\u00A0${timeStr}\u00A0\u00A0www.daghazahav.com
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

    const items = logEntry.equipItems
        ? logEntry.equipItems
        : [{ equipType: eq.type, equipSerial: eq.serial, equipQty: 1 }];

    const itemRows = items.map((item, i) => `
        <tr>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;">${i + 1}</td>
            <td style="padding:8px;text-align:right;border:1px solid #dfe6e9;font-weight:600;">${pdfTxt(item.equipType)}</td>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;direction:ltr;">${item.equipSerial || '-'}</td>
            <td style="padding:8px;text-align:center;border:1px solid #dfe6e9;">${item.equipQty || 1}</td>
        </tr>
    `).join('');

    const html = `
    <div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:680px;margin:auto;padding:32px 36px;color:#1a1a1a;word-spacing:2px;">
        <div style="text-align:center;margin-bottom:22px;">
            ${logoHtml}
            <h1 style="color:#E65100;margin:6px 0 2px;font-size:1.45em;">${pdfTxt('טופס זיכוי / החזרת ציוד')}</h1>
            <p style="color:#7f8c8d;margin:0;font-size:0.85em;">${pdfTxt('מערכת ניהול גדודי — צל"מ')}</p>
        </div>
        <hr style="border:none;border-top:2px solid #E65100;margin:0 0 20px;">

        <!-- Soldier details -->
        <table style="width:100%;border-collapse:collapse;border:1px solid #d0d7de;margin-bottom:20px;font-size:0.93em;">
            <tr><td style="padding:9px 14px;background:#FFF3E0;font-weight:700;border:1px solid #d0d7de;width:130px;">${pdfTxt('שם מחזיר')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${pdfTxt(logEntry.soldierName)}</td></tr>
            <tr><td style="padding:9px 14px;background:#FFF3E0;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('מספר אישי')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${logEntry.soldierPersonalId || '-'}</td></tr>
            <tr><td style="padding:9px 14px;background:#FFF3E0;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('טלפון')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;direction:ltr;text-align:right;">${logEntry.soldierPhone || '-'}</td></tr>
            <tr><td style="padding:9px 14px;background:#FFF3E0;font-weight:700;border:1px solid #d0d7de;">${pdfTxt('תאריך ושעה')}</td><td style="padding:9px 14px;border:1px solid #d0d7de;">${dateStr}\u00A0\u00A0${timeStr}</td></tr>
        </table>

        <!-- Equipment items -->
        <div style="font-weight:700;margin-bottom:8px;font-size:1em;">${pdfTxt('פריטים מוחזרים')} (${items.length}):</div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:0.93em;">
            <thead>
                <tr style="background:#E65100;color:white;text-align:center;">
                    <th style="padding:9px 6px;border:1px solid #E65100;width:36px;">#</th>
                    <th style="padding:9px 12px;border:1px solid #E65100;text-align:right;">${pdfTxt('שם פריט')}</th>
                    <th style="padding:9px 12px;border:1px solid #E65100;">${pdfTxt("מספר צ'")}</th>
                    <th style="padding:9px 6px;border:1px solid #E65100;width:56px;">${pdfTxt('כמות')}</th>
                </tr>
            </thead>
            <tbody>${itemRows}</tbody>
        </table>

        <!-- Issuer details -->
        ${logEntry.issuedBy ? `
        <div style="background:#E8EAF6;padding:10px 16px;border-radius:6px;margin-bottom:20px;font-size:0.88em;">
            <strong>${pdfTxt('מזכה:')}</strong>\u00A0${pdfTxt(logEntry.issuedBy)}\u00A0\u00A0${pdfTxt(logEntry.issuerRole || '')}\u00A0\u00A0${pdfTxt('מ.א')}\u00A0${logEntry.issuerPersonalId || '-'}\u00A0\u00A0${logEntry.issuerPhone || ''}
        </div>` : ''}

        ${logEntry.notes ? `<div style="background:#FFF3E0;border-right:4px solid #E65100;padding:10px 14px;border-radius:0 6px 6px 0;font-size:0.88em;margin-bottom:20px;"><strong>${pdfTxt('הערות:')}</strong> ${pdfTxt(logEntry.notes)}</div>` : ''}

        <!-- Signature -->
        <div style="text-align:center;">
            <div style="font-weight:700;margin-bottom:10px;font-size:0.95em;">${pdfTxt('חתימת מקבל/ת הציוד:')}</div>
            <img src="${logEntry.signatureImg}" style="max-width:380px;height:110px;border:1px solid #d0d7de;border-radius:8px;background:#fff;">
            <div style="margin-top:6px;font-size:0.8em;color:#7f8c8d;">${pdfTxt(logEntry.soldierName)}\u00A0\u00A0${dateStr}</div>
        </div>

        <!-- Stamp -->
        ${DOC_STAMP_BASE64 ? `
        <div style="text-align:center;margin-top:20px;">
            <img src="${DOC_STAMP_BASE64}" style="max-height:100px;opacity:0.85;">
        </div>` : ''}

        <hr style="border:none;border-top:1px solid #e0e0e0;margin:22px 0 10px;">
        <div style="text-align:center;font-size:0.72em;color:#aaa;">
            ${pdfTxt('מסמך זה הופק אוטומטית ממערכת ניהול גדודי')}
            <br>${dateStr}\u00A0${timeStr}\u00A0\u00A0www.daghazahav.com
        </div>
    </div>`;

    downloadPDF(html, `זיכוי_${logEntry.soldierName}_${items.length}פריטים_${dateStr.replace(/\./g,'-')}`);
}

function downloadPDF(htmlContent, filename) {
    const printWin = window.open('', '_blank');
    if (!printWin) {
        showToast('חלון ההדפסה נחסם - אפשר חלונות קופצים', 'error');
        return;
    }
    printWin.document.write(`<!DOCTYPE html><html dir="rtl"><head><meta charset="UTF-8">
        <title>${filename || 'document'}</title>
        <style>
            @page { size: A4; margin: 15mm; }
            body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; direction: rtl; }
            table { border-collapse: collapse; }
            img { max-width: 100%; }
        </style>
    </head><body>${htmlContent}</body></html>`);
    printWin.document.close();

    // Wait for images to load, then trigger print
    const images = printWin.document.querySelectorAll('img');
    const imgPromises = Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise(r => { img.onload = r; img.onerror = r; });
    });
    Promise.all(imgPromises).then(() => {
        setTimeout(() => {
            printWin.print();
            showToast('בחר "שמור כ-PDF" או הדפס');
        }, 300);
    });
}

// --- Equipment CSV Export ---
function exportEquipmentCSV() {
    let csv = '\uFEFF' + 'ציוד לחימה מבוקר - צל"מ\n\n';
    csv += 'סוג ציוד,מספר סידורי,קטגוריה,מחסן,מסגרת,מצב,סטטוס,מחזיק,טלפון,תאריך חתימה,הערות\n';
    const companyNames = getCompNames();
    state.equipment.forEach(e => {
        const status = e.condition === 'תקול' ? 'תקול' : e.holderId ? 'מוחזק' : 'פנוי';
        csv += `${e.type},${e.serial},${e.category || 'אחר'},${e.warehouse || CONFIG.defaultWarehouse},${companyNames[e.company] || e.company || 'מלאי מחסן'},${e.condition},${status},${e.holderName || '-'},${e.holderPhone || '-'},${e.assignedDate ? formatDate(e.assignedDate.split('T')[0]) : '-'},${e.notes || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `צלמ_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    showToast('צל"מ יוצא ל-CSV');
}

// ==================== TRANSFER EQUIPMENT ====================

let transferState = { step: 1, sourceId: null, targetId: null, selectedItems: [], notes: '' };

const TRANSFER_STEPS = [
    { num: 1, label: 'חייל מוסר' },
    { num: 2, label: 'בחירת ציוד' },
    { num: 3, label: 'חייל מקבל' },
    { num: 4, label: 'חתימות' },
    { num: 5, label: 'אישור' }
];

function renderTransferHistory() {
    const container = document.getElementById('transferHistoryContent');
    if (!container) return;
    const transfers = state.signatureLog.filter(l => l.transferId);
    // Group by transferId
    const grouped = {};
    transfers.forEach(l => {
        if (!grouped[l.transferId]) grouped[l.transferId] = [];
        grouped[l.transferId].push(l);
    });
    const entries = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));
    if (!entries.length) {
        container.innerHTML = '<div class="empty-state"><p>אין היסטוריית העברות</p></div>';
        return;
    }
    container.innerHTML = entries.slice(0, 30).map(([tid, logs]) => {
        const ret = logs.find(l => l.type === 'return');
        const asgn = logs.find(l => l.type === 'assign');
        const d = new Date(ret?.date || asgn?.date);
        const itemCount = (ret?.equipItems || []).length;
        return `<div style="background:var(--card);border-radius:var(--radius);padding:12px 16px;margin-bottom:10px;border-right:4px solid #9C27B0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><strong>${esc(ret?.soldierName || '?')}</strong> ← <strong>${esc(asgn?.soldierName || '?')}</strong> | ${itemCount} פריטים</div>
                <span style="font-size:0.82em;color:var(--text-light);">${d.toLocaleDateString('he-IL')} ${d.toLocaleTimeString('he-IL',{hour:'2-digit',minute:'2-digit'})}</span>
            </div>
            <div style="font-size:0.82em;color:var(--text-light);margin-top:4px;">${(ret?.equipItems || []).map(i => esc(i.equipType)).join(', ')}</div>
        </div>`;
    }).join('');
    refreshIcons();
}

function openTransferEquip() {
    transferState = { step: 1, sourceId: null, targetId: null, selectedItems: [], notes: '' };
    renderTransferWizard();
    openModal('transferEquipModal');
    refreshIcons();
}

function renderTransferWizard() {
    // Steps indicator
    const stepsHtml = TRANSFER_STEPS.map(s =>
        `<div class="wizard-step ${s.num === transferState.step ? 'active' : s.num < transferState.step ? 'done' : ''}" data-step="${s.num}">
            <span class="step-num">${s.num}</span><span class="step-label">${s.label}</span>
        </div>`
    ).join('');
    document.getElementById('transferSteps').innerHTML = stepsHtml;

    // Buttons
    document.getElementById('transferPrevBtn').style.display = transferState.step > 1 ? '' : 'none';
    const nextBtn = document.getElementById('transferNextBtn');
    if (transferState.step === 5) {
        nextBtn.textContent = 'אישור העברה';
        nextBtn.className = 'btn btn-success';
    } else {
        nextBtn.textContent = 'הבא';
        nextBtn.className = 'btn btn-primary';
    }

    // Content
    const container = document.getElementById('transferStepContent');
    if (transferState.step === 1) renderTransferStep1(container);
    else if (transferState.step === 2) renderTransferStep2(container);
    else if (transferState.step === 3) renderTransferStep3(container);
    else if (transferState.step === 4) renderTransferStep4(container);
    else if (transferState.step === 5) renderTransferStep5(container);
    refreshIcons();
}

function _renderSoldierPicker(containerId, searchId, selectedId, excludeId) {
    const q = document.getElementById(searchId)?.value?.trim().toLowerCase() || '';
    const container = document.getElementById(containerId);
    if (!container) return;
    let soldiers = state.soldiers.filter(s => s.id !== excludeId);
    if (q) soldiers = soldiers.filter(s => s.name.toLowerCase().includes(q) || (s.personalId || '').includes(q) || (s.company || '').includes(q));
    // Count held items per soldier
    const heldCount = {};
    state.equipment.forEach(e => { if (e.holderId) heldCount[e.holderId] = (heldCount[e.holderId] || 0) + 1; });
    container.innerHTML = soldiers.length ? soldiers.map(s => {
        const count = heldCount[s.id] || 0;
        const isSelected = s.id === selectedId;
        return `<div class="transfer-soldier-item ${isSelected ? 'selected' : ''}" onclick="selectTransferSoldier('${containerId}','${s.id}')" style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--border);cursor:pointer;${isSelected ? 'background:#E3F2FD;' : ''}">
            <div style="flex:1;">
                <div style="font-weight:600;">${esc(s.name)}</div>
                <div style="font-size:0.8em;color:var(--text-light);">${esc(s.company || '')} ${s.role ? '| ' + esc(s.role) : ''} ${s.personalId ? '| ' + esc(s.personalId) : ''}</div>
            </div>
            ${count ? `<span style="background:var(--success);color:white;padding:2px 8px;border-radius:10px;font-size:0.78em;">${count} פריטים</span>` : ''}
        </div>`;
    }).join('') : '<div style="padding:16px;text-align:center;color:var(--text-light);">לא נמצאו חיילים</div>';
}

function selectTransferSoldier(containerId, soldierId) {
    if (containerId === 'transferSourceList') transferState.sourceId = soldierId;
    else if (containerId === 'transferTargetList') transferState.targetId = soldierId;
    // Re-render to show selection
    if (containerId === 'transferSourceList') _renderSoldierPicker('transferSourceList', 'transferSourceSearch', transferState.sourceId, null);
    else _renderSoldierPicker('transferTargetList', 'transferTargetSearch', transferState.targetId, transferState.sourceId);
}

function renderTransferStep1(c) {
    c.innerHTML = `<div style="margin-top:12px;">
        <label style="font-weight:600;display:block;margin-bottom:8px;">בחר חייל מוסר (בעל הציוד)</label>
        <div class="search-bar" style="margin-bottom:8px;">
            <span class="search-icon"><i data-lucide="search"></i></span>
            <input type="text" id="transferSourceSearch" placeholder="חיפוש לפי שם, מ.א, פלוגה..." oninput="_renderSoldierPicker('transferSourceList','transferSourceSearch',transferState.sourceId,null)">
        </div>
        <div id="transferSourceList" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);"></div>
    </div>`;
    _renderSoldierPicker('transferSourceList', 'transferSourceSearch', transferState.sourceId, null);
}

function renderTransferStep2(c) {
    const heldItems = state.equipment.filter(e => e.holderId === transferState.sourceId);
    const sourceSoldier = state.soldiers.find(s => s.id === transferState.sourceId);
    if (heldItems.length === 0) {
        c.innerHTML = `<div style="margin-top:12px;text-align:center;padding:40px 20px;">
            <i data-lucide="package-x" style="width:48px;height:48px;color:var(--text-light);margin-bottom:12px;"></i>
            <p style="font-weight:600;margin-bottom:8px;">לחייל ${esc(sourceSoldier?.name || '')} אין ציוד מוקצה</p>
            <p style="color:var(--text-light);font-size:0.9em;">יש להקצות ציוד דרך חתימה לפני ביצוע העברה</p>
        </div>`;
        refreshIcons();
        return;
    }
    c.innerHTML = `<div style="margin-top:12px;">
        <p style="font-weight:600;margin-bottom:8px;">בחר ציוד להעברה מ: ${esc(sourceSoldier?.name || '')}</p>
        <div style="max-height:250px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);">
            ${heldItems.map(e => `<label style="display:flex;align-items:center;gap:8px;padding:8px 12px;border-bottom:1px solid var(--border);cursor:pointer;">
                <input type="checkbox" class="transfer-item-check" value="${e.id}" ${transferState.selectedItems.includes(e.id) ? 'checked' : ''}>
                <span style="flex:1;font-weight:600;">${esc(e.type)}</span>
                <span style="font-family:monospace;color:var(--text-light);direction:ltr;">${esc(e.serial)}</span>
            </label>`).join('')}
        </div>
    </div>`;
}

function renderTransferStep3(c) {
    c.innerHTML = `<div style="margin-top:12px;">
        <label style="font-weight:600;display:block;margin-bottom:8px;">בחר חייל מקבל</label>
        <div class="search-bar" style="margin-bottom:8px;">
            <span class="search-icon"><i data-lucide="search"></i></span>
            <input type="text" id="transferTargetSearch" placeholder="חיפוש לפי שם, מ.א, פלוגה..." oninput="_renderSoldierPicker('transferTargetList','transferTargetSearch',transferState.targetId,transferState.sourceId)">
        </div>
        <div id="transferTargetList" style="max-height:280px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);"></div>
    </div>`;
    _renderSoldierPicker('transferTargetList', 'transferTargetSearch', transferState.targetId, transferState.sourceId);
}

function renderTransferStep4(c) {
    c.innerHTML = `<div style="margin-top:12px;">
        <p style="font-weight:600;margin-bottom:12px;">חתימות דיגיטליות</p>
        <div style="display:grid;gap:16px;">
            <div>
                <label style="font-size:0.88em;font-weight:600;display:block;margin-bottom:4px;">חתימת חייל מוסר</label>
                <canvas id="transferSourceSig" width="400" height="120" style="border:1px solid var(--border);border-radius:var(--radius);width:100%;touch-action:none;"></canvas>
                <button class="btn btn-sm" style="margin-top:4px;" onclick="clearCanvasById('transferSourceSig')">נקה</button>
            </div>
            <div>
                <label style="font-size:0.88em;font-weight:600;display:block;margin-bottom:4px;">חתימת חייל מקבל</label>
                <canvas id="transferTargetSig" width="400" height="120" style="border:1px solid var(--border);border-radius:var(--radius);width:100%;touch-action:none;"></canvas>
                <button class="btn btn-sm" style="margin-top:4px;" onclick="clearCanvasById('transferTargetSig')">נקה</button>
            </div>
            <div>
                <label style="font-size:0.88em;font-weight:600;display:block;margin-bottom:4px;">חתימת מחתים</label>
                <canvas id="transferIssuerSig" width="400" height="120" style="border:1px solid var(--border);border-radius:var(--radius);width:100%;touch-action:none;"></canvas>
                <button class="btn btn-sm" style="margin-top:4px;" onclick="clearCanvasById('transferIssuerSig')">נקה</button>
            </div>
        </div>
    </div>`;
    setTimeout(() => {
        setupSignatureCanvas('transferSourceSig');
        setupSignatureCanvas('transferTargetSig');
        setupSignatureCanvas('transferIssuerSig');
    }, 100);
}

function renderTransferStep5(c) {
    const source = state.soldiers.find(s => s.id === transferState.sourceId);
    const target = state.soldiers.find(s => s.id === transferState.targetId);
    const items = transferState.selectedItems.map(id => state.equipment.find(e => e.id === id)).filter(Boolean);
    c.innerHTML = `<div style="margin-top:12px;">
        <div style="background:var(--bg);border-radius:var(--radius);padding:16px;margin-bottom:12px;">
            <p style="margin:0 0 8px;"><strong>מוסר:</strong> ${esc(source?.name || '?')} (${esc(source?.company || '')})</p>
            <p style="margin:0 0 8px;"><strong>מקבל:</strong> ${esc(target?.name || '?')} (${esc(target?.company || '')})</p>
            <p style="margin:0 0 4px;"><strong>פריטים (${items.length}):</strong></p>
            <ul style="margin:0;padding-right:20px;">${items.map(e => `<li>${esc(e.type)} — ${esc(e.serial)}</li>`).join('')}</ul>
        </div>
        <div class="form-group">
            <label>הערות (אופציונלי)</label>
            <input type="text" id="transferNotes" placeholder="הערות להעברה" value="${esc(transferState.notes || '')}">
        </div>
    </div>`;
}

function transferNextStep() {
    if (transferState.step === 1) {
        if (!transferState.sourceId) { showToast('יש לבחור חייל מוסר', 'error'); return; }
    } else if (transferState.step === 2) {
        transferState.selectedItems = [...document.querySelectorAll('.transfer-item-check:checked')].map(cb => cb.value);
        if (!transferState.selectedItems.length) { showToast('יש לבחור לפחות פריט אחד', 'error'); return; }
    } else if (transferState.step === 3) {
        if (!transferState.targetId) { showToast('יש לבחור חייל מקבל', 'error'); return; }
    } else if (transferState.step === 4) {
        if (isCanvasEmpty('transferSourceSig') || isCanvasEmpty('transferTargetSig') || isCanvasEmpty('transferIssuerSig')) {
            showToast('יש לחתום את כל 3 החתימות', 'error'); return;
        }
        transferState.sourceSigImg = getCanvasDataURL('transferSourceSig');
        transferState.targetSigImg = getCanvasDataURL('transferTargetSig');
        transferState.issuerSigImg = getCanvasDataURL('transferIssuerSig');
    } else if (transferState.step === 5) {
        transferState.notes = document.getElementById('transferNotes')?.value || '';
        confirmTransferEquipment();
        return;
    }
    transferState.step++;
    renderTransferWizard();
}

function transferPrevStep() {
    if (transferState.step > 1) {
        if (transferState.step === 3) {
            // Save selected items before going back
            transferState.selectedItems = [...document.querySelectorAll('.transfer-item-check:checked')].map(cb => cb.value);
        }
        transferState.step--;
        renderTransferWizard();
    }
}

function confirmTransferEquipment() {
    const transferId = 'xfr_' + Date.now();
    const source = state.soldiers.find(s => s.id === transferState.sourceId);
    const target = state.soldiers.find(s => s.id === transferState.targetId);
    const items = transferState.selectedItems.map(id => state.equipment.find(e => e.id === id)).filter(Boolean);
    const now = new Date().toISOString();

    const equipItems = items.map(e => ({ equipId: e.id, equipType: e.type, equipSerial: e.serial, equipQty: e.defaultQty || 1 }));

    // Return log entry (from source)
    state.signatureLog.push({
        id: 'sig_' + Date.now() + '_ret',
        type: 'return',
        transferId,
        equipId: items[0]?.id || '',
        equipType: items[0]?.type || '',
        equipSerial: items[0]?.serial || '',
        equipItems,
        soldierId: transferState.sourceId,
        soldierName: source?.name || '',
        soldierPhone: source?.phone || '',
        soldierPersonalId: source?.personalId || '',
        date: now,
        signatureImg: transferState.sourceSigImg,
        issuedBy: currentUser.name || '',
        issuerUnit: currentUser.unit || '',
        issuerRole: currentUser.role || '',
        issuerPersonalId: currentUser.personalId || '',
        issuerSignatureImg: transferState.issuerSigImg,
        notes: transferState.notes
    });

    // Assign log entry (to target)
    state.signatureLog.push({
        id: 'sig_' + Date.now() + '_asgn',
        type: 'assign',
        transferId,
        equipId: items[0]?.id || '',
        equipType: items[0]?.type || '',
        equipSerial: items[0]?.serial || '',
        equipItems,
        soldierId: transferState.targetId,
        soldierName: target?.name || '',
        soldierPhone: target?.phone || '',
        soldierPersonalId: target?.personalId || '',
        date: now,
        signatureImg: transferState.targetSigImg,
        issuedBy: currentUser.name || '',
        issuerUnit: currentUser.unit || '',
        issuerRole: currentUser.role || '',
        issuerPersonalId: currentUser.personalId || '',
        issuerSignatureImg: transferState.issuerSigImg,
        notes: transferState.notes
    });

    // Update equipment holders
    items.forEach(e => {
        e.holderId = transferState.targetId;
        e.holderName = target?.name || '';
        e.holderPhone = target?.phone || '';
        e.assignedDate = now;
        e.signatureImg = transferState.targetSigImg;
    });

    saveState();
    closeModal('transferEquipModal');
    renderEquipmentTab();
    renderTransferHistory();
    showToast(`${items.length} פריטים הועברו מ${source?.name} ל${target?.name}`);
}

// ==================== EXPORT WITH FILTERS ====================

function openExportFilter() {
    // Populate category checkboxes (use standard 5 categories)
    const cats = EQUIPMENT_CATEGORIES;
    const container = document.getElementById('exportCategoryChecks');
    container.innerHTML = cats.map(c =>
        `<label style="display:flex;align-items:center;gap:4px;padding:4px 8px;background:var(--bg);border-radius:var(--radius);cursor:pointer;font-size:0.88em;">
            <input type="checkbox" class="export-cat-check" value="${c}" checked onchange="updateExportPreviewCount()"> ${c}
        </label>`
    ).join('');
    document.getElementById('exportWarehouseFilter').value = 'all';
    document.getElementById('exportStatusFilter').value = 'all';
    document.getElementById('exportCompanyFilter').value = 'all';
    updateExportPreviewCount();
    openModal('exportFilterModal');
    refreshIcons();
}

function getFilteredEquipment() {
    const checkedCats = [...document.querySelectorAll('.export-cat-check:checked')].map(cb => cb.value);
    const wh = document.getElementById('exportWarehouseFilter').value;
    const status = document.getElementById('exportStatusFilter').value;
    const comp = document.getElementById('exportCompanyFilter').value;

    return state.equipment.filter(e => {
        if (!checkedCats.includes(e.category || 'אחר')) return false;
        if (wh !== 'all' && (e.warehouse || CONFIG.defaultWarehouse) !== wh) return false;
        if (comp !== 'all' && e.company !== comp) return false;
        if (status === 'assigned' && !e.holderId) return false;
        if (status === 'available' && (e.holderId || ['תקול','אובדן','מת"ש'].includes(e.condition))) return false;
        if (status === 'faulty' && e.condition !== 'תקול') return false;
        if (status === 'lost' && e.condition !== 'אובדן') return false;
        if (status === 'writeoff' && e.condition !== 'מת"ש') return false;
        return true;
    });
}

function updateExportPreviewCount() {
    const count = getFilteredEquipment().length;
    document.getElementById('exportPreviewCount').textContent = `${count} פריטים לייצוא`;
}

function doFilteredExportCSV() {
    const items = getFilteredEquipment();
    if (!items.length) { showToast('אין פריטים לייצוא', 'error'); return; }
    const companyNames = getCompNames();
    let csv = '\uFEFF' + 'ציוד לחימה מבוקר - צל"מ (מסונן)\n\n';
    csv += 'סוג ציוד,מספר סידורי,קטגוריה,מחסן,מסגרת,מצב,סטטוס,מחזיק,טלפון,תאריך חתימה,הערות\n';
    items.forEach(e => {
        const st = ['תקול','אובדן','מת"ש'].includes(e.condition) ? e.condition : e.holderId ? 'מוחזק' : 'פנוי';
        csv += `${e.type},${e.serial},${e.category || 'אחר'},${e.warehouse || CONFIG.defaultWarehouse},${companyNames[e.company] || e.company || 'מלאי מחסן'},${e.condition},${st},${e.holderName || '-'},${e.holderPhone || '-'},${e.assignedDate ? formatDate(e.assignedDate.split('T')[0]) : '-'},${e.notes || ''}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `צלמ_מסונן_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    closeModal('exportFilterModal');
    showToast(`יוצאו ${items.length} פריטים ל-CSV`);
}

function doFilteredExportPDF() {
    const items = getFilteredEquipment();
    if (!items.length) { showToast('אין פריטים לייצוא', 'error'); return; }
    const companyNames = getCompNames();
    const htmlContent = `<div dir="rtl" style="font-family:Arial,sans-serif;padding:20px;">
        <h2 style="text-align:center;margin-bottom:4px;">דוח ציוד מסונן</h2>
        <p style="text-align:center;font-size:12px;color:#666;margin-bottom:16px;">${new Date().toLocaleDateString('he-IL')} | ${items.length} פריטים</p>
        <table style="width:100%;border-collapse:collapse;font-size:11px;">
            <thead><tr style="background:#263238;color:white;">
                <th style="padding:6px;border:1px solid #ddd;">סוג</th>
                <th style="padding:6px;border:1px solid #ddd;">מס' צ'</th>
                <th style="padding:6px;border:1px solid #ddd;">קטגוריה</th>
                <th style="padding:6px;border:1px solid #ddd;">מחסן</th>
                <th style="padding:6px;border:1px solid #ddd;">מסגרת</th>
                <th style="padding:6px;border:1px solid #ddd;">מצב</th>
                <th style="padding:6px;border:1px solid #ddd;">מחזיק</th>
            </tr></thead>
            <tbody>${items.map(e => `<tr>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(e.type)}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;direction:ltr;font-family:monospace;">${esc(e.serial)}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(e.category || '-')}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(e.warehouse || CONFIG.defaultWarehouse)}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(companyNames[e.company] || e.company || 'מלאי מחסן')}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(e.condition)}</td>
                <td style="padding:4px 6px;border:1px solid #ddd;">${esc(e.holderName || '-')}</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
    generatePDF(htmlContent, `צלמ_מסונן_${new Date().toISOString().split('T')[0]}`);
    closeModal('exportFilterModal');
}

// ==================== IMPORT EQUIPMENT ====================

let importPreviewData = [];

function openImportEquipment() {
    document.getElementById('importEquipFile').value = '';
    document.getElementById('importPreviewContainer').style.display = 'none';
    document.getElementById('importPreviewContainer').innerHTML = '';
    document.getElementById('importSummary').style.display = 'none';
    document.getElementById('importConfirmBtn').style.display = 'none';
    document.getElementById('importWarehouse').value = CONFIG.defaultWarehouse;
    document.getElementById('importCompany').value = 'gdudi';
    importPreviewData = [];
    openModal('importEquipmentModal');
    refreshIcons();
}

function previewImportEquipment() {
    const file = document.getElementById('importEquipFile').files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();

    if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = function(e) {
            let text = e.target.result;
            // Remove BOM
            if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);
            const lines = text.split(/\r?\n/).filter(l => l.trim());
            if (lines.length < 2) { showToast('קובץ ריק', 'error'); return; }
            const headers = parseCSVLine(lines[0]);
            const rows = [];
            for (let i = 1; i < lines.length; i++) {
                const cells = parseCSVLine(lines[i]);
                if (cells.length < 2) continue;
                rows.push(mapImportRow(headers, cells));
            }
            renderImportPreview(rows);
        };
        reader.readAsText(file, 'UTF-8');
    } else if (ext === 'xlsx' || ext === 'xls') {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const wb = XLSX.read(e.target.result, { type: 'array' });
                const ws = wb.Sheets[wb.SheetNames[0]];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                if (data.length < 2) { showToast('קובץ ריק', 'error'); return; }
                const headers = data[0].map(h => String(h || '').trim());
                const rows = [];
                for (let i = 1; i < data.length; i++) {
                    const cells = data[i].map(c => String(c || '').trim());
                    if (cells.filter(c => c).length < 2) continue;
                    rows.push(mapImportRow(headers, cells));
                }
                renderImportPreview(rows);
            } catch (err) {
                showToast('שגיאה בקריאת הקובץ: ' + err.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        showToast('יש להעלות קובץ CSV או Excel', 'error');
    }
}

const IMPORT_COL_MAP = {
    'סוג ציוד': 'type', 'סוג': 'type', 'שם': 'type', 'פריט': 'type', 'type': 'type',
    'מספר סידורי': 'serial', 'מספר צ': 'serial', "צ'": 'serial', 'צ': 'serial', 'serial': 'serial',
    'קטגוריה': 'category', 'סוג קטגוריה': 'category', 'category': 'category',
    'מצב': 'condition', 'condition': 'condition',
    'הערות': 'notes', 'הערה': 'notes', 'notes': 'notes'
};

function mapImportRow(headers, cells) {
    const row = { type: '', serial: '', category: '', condition: 'תקין', notes: '' };
    headers.forEach((h, i) => {
        const key = IMPORT_COL_MAP[h.trim()];
        if (key && cells[i]) row[key] = cells[i].trim();
    });
    // Fallback: if no column mapping, use positional (type, serial, category, condition, notes)
    if (!row.type && cells[0]) row.type = cells[0].trim();
    if (!row.serial && cells[1]) row.serial = cells[1].trim();
    if (!row.category && cells[2]) row.category = cells[2].trim();
    if (!row.category) row.category = detectCategoryFromType(row.type);
    return row;
}

function renderImportPreview(rows) {
    const existingSerials = new Set(state.equipment.map(e => e.serial));
    let newCount = 0, dupCount = 0;
    rows.forEach(r => {
        r._isDuplicate = existingSerials.has(r.serial);
        if (r._isDuplicate) dupCount++; else newCount++;
    });
    importPreviewData = rows;

    const container = document.getElementById('importPreviewContainer');
    container.style.display = '';
    container.innerHTML = `<table class="data-table" style="width:100%;font-size:0.85em;">
        <thead><tr><th></th><th>סוג ציוד</th><th>מס' צ'</th><th>קטגוריה</th><th>מצב</th><th>הערות</th></tr></thead>
        <tbody>${rows.map((r, i) => `<tr style="background:${r._isDuplicate ? '#FFF9C4' : '#E8F5E9'};">
            <td style="text-align:center;">${r._isDuplicate ? '<span style="color:#F57F17;" title="כפילות - ידולג">&#9888;</span>' : '<span style="color:#2E7D32;">&#10003;</span>'}</td>
            <td>${esc(r.type)}</td>
            <td style="direction:ltr;font-family:monospace;">${esc(r.serial)}</td>
            <td>${esc(r.category || '-')}</td>
            <td>${esc(r.condition)}</td>
            <td>${esc(r.notes || '')}</td>
        </tr>`).join('')}</tbody>
    </table>`;

    const summary = document.getElementById('importSummary');
    summary.style.display = '';
    summary.innerHTML = `<span style="color:#2E7D32;">${newCount} פריטים חדשים</span>${dupCount ? ` | <span style="color:#F57F17;">${dupCount} כפילויות (ידולגו)</span>` : ''}`;

    const btn = document.getElementById('importConfirmBtn');
    btn.style.display = newCount > 0 ? '' : 'none';
}

function confirmImportEquipment() {
    const warehouse = document.getElementById('importWarehouse').value;
    const company = document.getElementById('importCompany').value;
    const newItems = importPreviewData.filter(r => !r._isDuplicate && r.type && r.serial);
    if (!newItems.length) { showToast('אין פריטים חדשים לייבוא', 'error'); return; }

    newItems.forEach(r => {
        state.equipment.push({
            id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2,5),
            type: r.type,
            serial: r.serial,
            category: r.category || detectCategoryFromType(r.type),
            company,
            condition: r.condition || 'תקין',
            defaultQty: 1,
            notes: r.notes || '',
            warehouse,
            holderId: null, holderName: '', holderPhone: '',
            assignedDate: null, signatureImg: null
        });
    });

    saveState();
    closeModal('importEquipmentModal');
    renderEquipmentTab();
    showToast(`יובאו ${newItems.length} פריטי ציוד בהצלחה`);
}

// ==================== EASYDO WEAPONS STATUS SYNC ====================

let easyDoCompletions = []; // [{name, company, completedAt}]

async function syncWeaponsEasyDoStatus(silent) {
    if (!CONFIG.weaponsSheetId) return;
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.weaponsSheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('סטטוס מילוי')}`;
        const resp = await fetch(url);
        if (!resp.ok) { if (!silent) console.warn('EasyDo status sheet not found'); return; }
        const csv = await resp.text();
        const rows = parseCSV(csv);
        // Skip header row, columns: שם חותם, פלוגה, תאריך מילוי, נושא אימייל, מזהה אימייל
        easyDoCompletions = [];
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row[0]) continue;
            easyDoCompletions.push({
                name: (row[0] || '').trim(),
                company: (row[1] || '').trim(),
                completedAt: (row[2] || '').trim(),
            });
        }
        if (!silent) showToast(`נטענו ${easyDoCompletions.length} רשומות סטטוס מ-EasyDo`, 'success');
        console.log(`EasyDo status: ${easyDoCompletions.length} completions loaded`);
    } catch (err) {
        console.warn('EasyDo status sync error:', err);
    }
}

function getEasyDoStatus(soldier) {
    if (!easyDoCompletions.length) return null;
    const solName = soldier.name.trim().toLowerCase();
    const solLastName = solName.split(' ').pop();
    // Try exact match first
    let match = easyDoCompletions.find(c => c.name.trim().toLowerCase() === solName);
    // Then try last-name match
    if (!match) match = easyDoCompletions.find(c => c.name.trim().toLowerCase() === solLastName);
    // Then try partial match (last name contained in full name or vice versa)
    if (!match) match = easyDoCompletions.find(c => {
        const cName = c.name.trim().toLowerCase();
        return solName.includes(cName) || cName.includes(solLastName);
    });
    return match || null;
}

function parseCSV(csv) {
    // Simple CSV parser that handles quoted fields
    const rows = [];
    let current = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < csv.length; i++) {
        const ch = csv[i];
        if (inQuotes) {
            if (ch === '"' && csv[i + 1] === '"') { field += '"'; i++; }
            else if (ch === '"') inQuotes = false;
            else field += ch;
        } else {
            if (ch === '"') inQuotes = true;
            else if (ch === ',') { current.push(field); field = ''; }
            else if (ch === '\n' || (ch === '\r' && csv[i + 1] === '\n')) {
                current.push(field); field = '';
                if (current.some(c => c.trim())) rows.push(current);
                current = [];
                if (ch === '\r') i++;
            } else { field += ch; }
        }
    }
    if (field || current.length) { current.push(field); if (current.some(c => c.trim())) rows.push(current); }
    return rows;
}

// ==================== WEAPONS PROJECT ====================

const ISRAELI_CITIES = ['אבו גוש','אבן יהודה','אופקים','אור יהודה','אור עקיבא','אילת','אלעד','אריאל','אשדוד','אשקלון','באר יעקב','באר שבע','בית שאן','בית שמש','בני ברק','בת ים','גבעת שמואל','גבעתיים','גדרה','גני תקווה','דימונה','הוד השרון','הרצליה','חדרה','חולון','חיפה','טבריה','טירת כרמל','יבנה','יהוד-מונוסון','ירוחם','ירושלים','כפר יונה','כפר סבא','כרמיאל','לוד','מגדל העמק','מודיעין-מכבים-רעות','מודיעין עילית','מעלה אדומים','מעלות-תרשיחא','מצפה רמון','נהריה','נס ציונה','נצרת','נתיבות','נתניה','עכו','עפולה','ערד','פתח תקווה','צפת','קדימה-צורן','קלנסווה','קרית אונו','קרית אתא','קרית ביאליק','קרית גת','קרית ים','קרית מוצקין','קרית מלאכי','קרית שמונה','ראש העין','ראשון לציון','רהט','רחובות','רכסים','רמלה','רמת גן','רמת השרון','רעננה','שדרות','שוהם','שלומי','תל אביב-יפו','דולב','בית אריה','אפרת','ביתר עילית','קרני שומרון','אלקנה','גבע בנימין','עמנואל','קדומים','גבעת זאב','ניצן','פרדסיה','זכרון יעקב','בנימינה-גבעת עדה','יקנעם','טירה','טמרה','סח\'נין','באקה אל-גרבייה','אום אל-פחם','רהט','ערערה','כפר קאסם','שפרעם','דלית אל-כרמל','יפיע','עין מאהל','כאבול','טורעאן'];

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
    // Step 1: Personal details
    if (rec.firstName && rec.lastName && rec.idNumber) filled++;
    // Step 2: Military details
    if (rec.phone || rec.enlistmentDate || rec.rank) filled++;
    // Step 3: Documents
    if (rec.idPhoto) filled++;
    if (rec.doctorApproval) filled++;
    // Step 4: Commander signature
    if (rec.cmdSig && rec.cmdName) filled++;
    if (filled >= 5) return 'complete';
    if (filled > 0) return 'partial';
    return 'none';
}

function populateCitiesDatalist() {
    const dl = document.getElementById('israeliCitiesList');
    if (!dl || dl.children.length > 0) return;
    dl.innerHTML = ISRAELI_CITIES.map(c => `<option value="${c}">`).join('');
}

function renderRestrictedTab(tabName, message) {
    const el = document.getElementById('tab-' + tabName);
    if (el) el.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;text-align:center;color:#666;"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom:16px;opacity:0.4;"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg><div style="font-size:1.1em;font-weight:600;margin-bottom:8px;">${message}</div><div style="font-size:0.85em;opacity:0.7;">לקבלת גישה מלאה צור קשר</div></div>`;
}

function openRangeResetSummary() {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsStr = sixMonthsAgo.toISOString().split('T')[0];

    const byCompany = {};
    ALL_COMPANIES.forEach(k => { if (canView(k)) byCompany[k] = []; });

    state.soldiers.forEach(s => {
        if (!canView(s.company)) return;
        const wp = state.weaponsData.find(w => w.soldierId === s.id);
        const rangeDate = wp ? wp.rangeDate : '';
        if (!rangeDate || rangeDate < sixMonthsStr) {
            byCompany[s.company] = byCompany[s.company] || [];
            byCompany[s.company].push({ name: s.name, role: s.role || '', unit: s.unit || '', rangeDate });
        }
    });

    let html = '';
    let totalCount = 0;
    ALL_COMPANIES.forEach(k => {
        if (!byCompany[k] || byCompany[k].length === 0) return;
        const soldiers = byCompany[k];
        totalCount += soldiers.length;
        html += `<div style="margin-bottom:16px;">
            <div style="font-weight:700;font-size:1em;padding:8px 12px;background:var(--primary);color:white;border-radius:var(--radius);">
                ${companyData[k].name} (${soldiers.length})
            </div>
            <table style="width:100%;margin-top:4px;font-size:0.85em;">
                <thead><tr style="background:var(--bg);"><th style="text-align:right;padding:4px 8px;">שם</th><th>תפקיד</th><th>מחלקה</th><th>תאריך איפוס אחרון</th></tr></thead>
                <tbody>${soldiers.map(s => `<tr>
                    <td style="padding:4px 8px;font-weight:600;">${esc(s.name)}</td>
                    <td>${esc(s.role || '')}</td>
                    <td>${esc(s.unit)}</td>
                    <td style="color:${s.rangeDate ? 'var(--danger)' : 'var(--text-light)'};">${s.rangeDate ? formatDate(s.rangeDate) : 'לא בוצע'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    });

    const content = document.getElementById('rangeResetContent');
    content.innerHTML = `<div style="padding:4px 0 12px;font-size:0.9em;color:var(--text-light);">סה"כ <strong>${totalCount}</strong> חיילים שלא ביצעו מטווח איפוס ב-6 חודשים האחרונים</div>` + html;
    openModal('rangeResetModal');
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
        const easyDoSigned = state.soldiers.filter(s => getEasyDoStatus(s)).length;
        statsEl.innerHTML = `
            <div class="quick-stat"><div class="value">${total}</div><div class="label">סה"כ חיילים</div></div>
            <div class="quick-stat" style="border-top:3px solid #2563eb;"><div class="value">${easyDoSigned}</div><div class="label">חתמו ב-EasyDo</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success);"><div class="value">${complete}</div><div class="label">הושלם במערכת</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--warning);"><div class="value">${partial}</div><div class="label">בתהליך</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger);"><div class="value">${none}</div><div class="label">לא התחיל</div></div>
        `;
    }

    document.getElementById('weaponsSoldiersCount').textContent = soldiers.length;

    const companyNames = getCompNames();
    const container = document.getElementById('weaponsTableContainer');

    if (!soldiers.length) {
        container.innerHTML = '<div style="text-align:center;padding:30px;color:var(--text-light);">לא נמצאו חיילים</div>';
        return;
    }

    const statusLabel = { complete: 'הושלם', partial: 'בתהליך', none: 'לא התחיל' };
    const statusClass = { complete: 'wp-status-complete', partial: 'wp-status-partial', none: 'wp-status-none' };

    let html = '<div class="task-table-wrapper"><div class="table-scroll"><table><thead><tr><th>שם</th><th>מסגרת</th><th>מ.א.</th><th>סטטוס מערכת</th><th>טופס EasyDo</th><th>פעולות</th></tr></thead><tbody>';
    soldiers.forEach(s => {
        const status = getWeaponsStatus(s.id);
        const easyDo = getEasyDoStatus(s);
        const easyDoHtml = easyDo
            ? `<span class="wp-status-badge wp-status-complete" title="מולא ב-${esc(easyDo.completedAt)}">נחתם</span>`
            : `<span class="wp-status-badge wp-status-none">טרם נחתם</span>`;
        html += `<tr>
            <td style="font-weight:600;">${esc(s.name)}</td>
            <td>${esc(companyNames[s.company] || s.company)}</td>
            <td>${esc(s.personalId) || '-'}</td>
            <td><span class="wp-status-badge ${statusClass[status]}">${statusLabel[status]}</span></td>
            <td>${easyDoHtml}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="openWeaponsForm('${s.id}')">מלא טופס</button>
            </td>
        </tr>`;
    });
    html += '</tbody></table></div></div>';
    container.innerHTML = html;
}

function getCompanyCommander(compKey) {
    // Returns commander info for a company (for auto-fill)
    const compNames = getCompNames();
    const commanders = {
        a: { name: '', rank: '', role: 'מ"פ א\'' },
        b: { name: 'אלחי פיין', rank: 'סרן', role: 'מ"פ ב\'' },
        c: { name: '', rank: '', role: 'מ"פ ג\'' },
        d: { name: '', rank: '', role: 'מ"פ ד\'' },
        hq: { name: '', rank: '', role: 'מ"פ חפ"ק' },
        palsam: { name: '', rank: '', role: 'מ"פ פלס"ם' }
    };
    return commanders[compKey] || { name: '', rank: '', role: compNames[compKey] || '' };
}

function openWeaponsForm(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;

    populateCitiesDatalist();

    document.getElementById('weaponsSoldierId').value = soldierId;
    document.getElementById('weaponsModalTitle').textContent = `בקשה לקבלת נשק - ${sol.name}`;

    // Load existing data or create new with auto-fill
    let rec = state.weaponsData.find(r => r.soldierId === soldierId);
    if (!rec) {
        const nameParts = sol.name.split(' ');
        const cmd = getCompanyCommander(sol.company);
        rec = {
            soldierId,
            company: sol.company || '',
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            idNumber: '',
            personalNum: sol.personalId || '',
            birthYear: '',
            fatherName: '',
            street: '',
            houseNum: '',
            city: '',
            postalCode: '',
            phone: sol.phone || '',
            landline: '',
            personalWeaponSource: '',
            rangeDate: '',
            enlistmentDate: '',
            dischargeDate: '',
            medicalApprovalDate: '',
            rank: sol.rank || '',
            combatCertified: null,
            idPhoto: null,
            doctorApproval: null,
            cmdName: cmd.name,
            cmdRank: cmd.rank,
            cmdId: '',
            cmdRole: cmd.role,
            cmdSig: null,
            cmdDate: new Date().toISOString().split('T')[0],
            lastUpdated: null,
            source: 'app'
        };
    }

    // Map company key to Hebrew name for dropdown
    const compMap = { a: 'א', b: 'ב', c: 'ג', d: 'ד', hq: 'מבצעים/חפ״ק', palsam: 'פלס״ם' };

    // Fill Step 1: Personal
    document.getElementById('wpCompany').value = compMap[rec.company] || rec.company || '';
    document.getElementById('wpFirstName').value = rec.firstName;
    document.getElementById('wpLastName').value = rec.lastName;
    document.getElementById('wpIdNumber').value = rec.idNumber;
    document.getElementById('wpPersonalNum').value = rec.personalNum;
    document.getElementById('wpBirthYear').value = rec.birthYear;
    document.getElementById('wpFatherName').value = rec.fatherName;
    document.getElementById('wpStreet').value = rec.street || '';
    document.getElementById('wpHouseNum').value = rec.houseNum || '';
    document.getElementById('wpCity').value = rec.city;
    document.getElementById('wpPostalCode').value = rec.postalCode || '';

    // Fill Step 2: Military & Contact
    document.getElementById('wpPhone').value = rec.phone;
    document.getElementById('wpLandline').value = rec.landline || '';
    document.getElementById('wpPersonalWeaponSource').value = rec.personalWeaponSource || '';
    document.getElementById('wpRangeDate').value = rec.rangeDate || '';
    document.getElementById('wpEnlistmentDate').value = rec.enlistmentDate || '';
    document.getElementById('wpDischargeDate').value = rec.dischargeDate || '';
    document.getElementById('wpMedicalApprovalDate').value = rec.medicalApprovalDate || '';
    document.getElementById('wpRank').value = rec.rank;
    // Combat certified radio
    document.querySelectorAll('input[name="wpCombatCertified"]').forEach(r => r.checked = false);
    if (rec.combatCertified === true) document.querySelector('input[name="wpCombatCertified"][value="yes"]').checked = true;
    else if (rec.combatCertified === false) document.querySelector('input[name="wpCombatCertified"][value="no"]').checked = true;

    // Fill Step 3: Documents
    if (rec.idPhoto) {
        document.getElementById('idPhotoImg').src = rec.idPhoto;
        document.getElementById('idPhotoPreview').style.display = '';
        document.getElementById('idUploadArea').style.display = 'none';
    } else {
        document.getElementById('idPhotoPreview').style.display = 'none';
        document.getElementById('idUploadArea').style.display = '';
    }
    if (rec.doctorApproval) {
        document.getElementById('doctorApprovalImg').src = rec.doctorApproval;
        document.getElementById('doctorApprovalPreview').style.display = '';
        document.getElementById('doctorUploadArea').style.display = 'none';
    } else {
        document.getElementById('doctorApprovalPreview').style.display = 'none';
        document.getElementById('doctorUploadArea').style.display = '';
    }

    // Fill Step 4: Commander
    document.getElementById('wpCmdName').value = rec.cmdName;
    document.getElementById('wpCmdRank').value = rec.cmdRank;
    document.getElementById('wpCmdId').value = rec.cmdId;
    document.getElementById('wpCmdRole').value = rec.cmdRole;
    document.getElementById('wpCmdDate').value = rec.cmdDate || new Date().toISOString().split('T')[0];

    // Go to step 1
    currentWizardStep = 1;
    updateWizardUI();

    openModal('weaponsFormModal');

    // Init commander signature canvas after modal is visible
    setTimeout(() => {
        initWpSignatureCanvas('cmdSigCanvas');
        if (rec.cmdSig) restoreCanvasImage('cmdSigCanvas', rec.cmdSig);
    }, 200);
}

function updateWizardUI() {
    document.querySelectorAll('.wizard-step').forEach(s => {
        const step = parseInt(s.dataset.step);
        s.classList.toggle('active', step === currentWizardStep);
        s.classList.toggle('done', step < currentWizardStep);
    });
    document.querySelectorAll('.wizard-page').forEach((p, i) => {
        p.classList.toggle('active', i + 1 === currentWizardStep);
    });
    document.getElementById('wpBtnPrev').disabled = currentWizardStep <= 1;
    document.getElementById('wpBtnNext').style.display = currentWizardStep >= 4 ? 'none' : '';
}

function weaponsWizardNext() {
    if (currentWizardStep < 4) {
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
    const move = (e) => { if (!drawing) return; e.preventDefault(); const p = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#2563eb'; ctx.lineTo(p.x, p.y); ctx.stroke(); };
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

function handleDoctorApprovalUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('doctorApprovalImg').src = e.target.result;
        document.getElementById('doctorApprovalPreview').style.display = '';
        document.getElementById('doctorUploadArea').style.display = 'none';
    };
    reader.readAsDataURL(file);
}

function removeDoctorApproval() {
    document.getElementById('doctorApprovalPreview').style.display = 'none';
    document.getElementById('doctorUploadArea').style.display = '';
    document.getElementById('doctorApprovalInput').value = '';
    document.getElementById('doctorApprovalImg').src = '';
}

function collectWeaponsFormData() {
    const soldierId = document.getElementById('weaponsSoldierId').value;
    const combatRadio = document.querySelector('input[name="wpCombatCertified"]:checked');

    return {
        soldierId,
        company: document.getElementById('wpCompany').value,
        firstName: document.getElementById('wpFirstName').value.trim(),
        lastName: document.getElementById('wpLastName').value.trim(),
        idNumber: document.getElementById('wpIdNumber').value.trim(),
        personalNum: document.getElementById('wpPersonalNum').value.trim(),
        birthYear: document.getElementById('wpBirthYear').value.trim(),
        fatherName: document.getElementById('wpFatherName').value.trim(),
        street: document.getElementById('wpStreet').value.trim(),
        houseNum: document.getElementById('wpHouseNum').value.trim(),
        city: document.getElementById('wpCity').value.trim(),
        postalCode: document.getElementById('wpPostalCode').value.trim(),
        phone: document.getElementById('wpPhone').value.trim(),
        landline: document.getElementById('wpLandline').value.trim(),
        personalWeaponSource: document.getElementById('wpPersonalWeaponSource').value.trim(),
        rangeDate: document.getElementById('wpRangeDate').value,
        enlistmentDate: document.getElementById('wpEnlistmentDate').value,
        dischargeDate: document.getElementById('wpDischargeDate').value,
        medicalApprovalDate: document.getElementById('wpMedicalApprovalDate').value,
        rank: document.getElementById('wpRank').value,
        combatCertified: combatRadio ? combatRadio.value === 'yes' : null,
        idPhoto: (document.getElementById('idPhotoImg').src && document.getElementById('idPhotoImg').src.startsWith('data:')) ? document.getElementById('idPhotoImg').src : null,
        doctorApproval: (document.getElementById('doctorApprovalImg').src && document.getElementById('doctorApprovalImg').src.startsWith('data:')) ? document.getElementById('doctorApprovalImg').src : null,
        cmdName: document.getElementById('wpCmdName').value.trim(),
        cmdRank: document.getElementById('wpCmdRank').value.trim(),
        cmdId: document.getElementById('wpCmdId').value.trim(),
        cmdRole: document.getElementById('wpCmdRole').value.trim(),
        cmdSig: isWpCanvasEmpty('cmdSigCanvas') ? null : getWpCanvasDataURL('cmdSigCanvas'),
        cmdDate: document.getElementById('wpCmdDate').value,
        lastUpdated: new Date().toISOString(),
        source: 'app'
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

    // Push to Google Sheets if configured
    if (CONFIG.weaponsScriptUrl) {
        pushWeaponsToSheets(data);
    }
}

// --- SmoovSign: Send weapons questionnaire via personal links ---

let _smoovSDK = null;
function getSmoovSDK() {
    if (!_smoovSDK && typeof SmoovSDK !== 'undefined') _smoovSDK = new SmoovSDK();
    return _smoovSDK;
}

// ========== WhatsApp Send Modal ==========

const WA_DEFAULT_TEMPLATE = `שלום {שם}, זאת הודעה אוטומטית ממערכת ניהול הגדוד.
ראינו שעדיין לא סיימת את התהליך של הגשת בקשה לאחזקת נשק בבית.

בשלב ראשון עליך להחתים רופא בטופס המצורף בקישור הזה:
{קישור_רופא}

אם יש לך את האישור חתום וכן צילום תעודת זהות, אתה מוזמן להתחיל בתהליך החתימה בקישור המצורף כאן:
{קישור_easydo}`;

let _waSending = false;

function openWeaponsWhatsAppModal() {
    const tpl = document.getElementById('waMessageTemplate');
    if (tpl && !tpl.value) tpl.value = WA_DEFAULT_TEMPLATE;
    // Set company filter from main weapons filter
    const mainComp = document.getElementById('weaponsSendCompany');
    const waComp = document.getElementById('waCompanyFilter');
    if (mainComp && waComp) waComp.value = mainComp.value;
    // Auto-select Green API if configured, else wa.me
    const methodEl = document.getElementById('waSendMethod');
    if (methodEl) methodEl.value = CONFIG.greenApi ? 'greenapi' : 'wame';
    document.getElementById('waSendProgress').textContent = '';
    updateWaSoldierList();
    openModal('weaponsWhatsAppModal');
}

function getWaSoldiers() {
    const comp = document.getElementById('waCompanyFilter').value;
    const onlyUnsigned = document.getElementById('waOnlyUnsigned').checked;
    let soldiers = [...state.soldiers].filter(s => s.phone);
    if (comp !== 'all') soldiers = soldiers.filter(s => s.company === comp);
    if (onlyUnsigned) soldiers = soldiers.filter(s => !getEasyDoStatus(s));
    return soldiers;
}

function updateWaSoldierList() {
    const soldiers = getWaSoldiers();
    const container = document.getElementById('waSoldierList');
    const compNames = getCompNames();
    if (!soldiers.length) {
        container.innerHTML = '<div style="text-align:center;padding:12px;color:var(--text-light);">לא נמצאו חיילים מתאימים</div>';
        document.getElementById('waSelectedCount').textContent = '0 חיילים';
        updateWaPreview();
        return;
    }
    container.innerHTML = soldiers.map(s => `
        <label style="display:flex;align-items:center;gap:8px;padding:4px 6px;border-radius:4px;cursor:pointer;" class="wa-soldier-row">
            <input type="checkbox" checked data-soldier-id="${s.id}" onchange="updateWaSelectedCount();updateWaPreview()">
            <span style="font-weight:500;">${esc(s.name)}</span>
            <span style="color:var(--text-light);font-size:12px;">${esc(compNames[s.company] || s.company)}</span>
            <span style="color:var(--text-light);font-size:12px;">${esc(s.phone)}</span>
        </label>
    `).join('');
    updateWaSelectedCount();
    updateWaPreview();
}

function waSelectAll(checked) {
    document.querySelectorAll('#waSoldierList input[type="checkbox"]').forEach(cb => cb.checked = checked);
    updateWaSelectedCount();
    updateWaPreview();
}

function updateWaSelectedCount() {
    const count = document.querySelectorAll('#waSoldierList input[type="checkbox"]:checked').length;
    document.getElementById('waSelectedCount').textContent = `${count} חיילים נבחרו`;
}

function getEasyDoLink(soldier) {
    const links = CONFIG.weaponsEasyDoLinks || {};
    return links[soldier.company] || links.battalion || '';
}

function buildWaMessage(soldier) {
    const tpl = document.getElementById('waMessageTemplate').value;
    const firstName = soldier.name.split(' ')[0];
    return tpl
        .replace(/\{שם\}/g, firstName)
        .replace(/\{קישור_רופא\}/g, CONFIG.weaponsDoctorFormUrl || '')
        .replace(/\{קישור_easydo\}/g, getEasyDoLink(soldier));
}

function updateWaPreview() {
    const preview = document.getElementById('waPreview');
    const soldiers = getWaSoldiers();
    const checkedIds = new Set();
    document.querySelectorAll('#waSoldierList input[type="checkbox"]:checked').forEach(cb => checkedIds.add(cb.dataset.soldierId));
    const first = soldiers.find(s => checkedIds.has(s.id));
    if (first) {
        preview.textContent = buildWaMessage(first);
    } else {
        preview.textContent = 'אין חיילים נבחרים';
    }
}

function normalizePhone(phone) {
    let clean = phone.replace(/[\s\-\(\)\+]/g, '');
    if (clean.startsWith('0')) clean = '972' + clean.slice(1);
    return clean;
}

async function sendWeaponsWhatsApp() {
    if (_waSending) return;
    const checkedBoxes = document.querySelectorAll('#waSoldierList input[type="checkbox"]:checked');
    const selectedIds = new Set();
    checkedBoxes.forEach(cb => selectedIds.add(cb.dataset.soldierId));
    const soldiers = getWaSoldiers().filter(s => selectedIds.has(s.id));

    if (!soldiers.length) { showToast('לא נבחרו חיילים', 'error'); return; }

    const method = document.getElementById('waSendMethod').value;
    const delay = parseInt(document.getElementById('waSendDelay').value) || 3;

    if (method === 'greenapi' && !CONFIG.greenApi) {
        showToast('Green API לא מוגדר בהגדרות. השתמש בשיטת wa.me או הגדר greenApi ב-config.js', 'error');
        return;
    }

    if (!confirm(`לשלוח הודעה ל-${soldiers.length} חיילים?`)) return;

    _waSending = true;
    const btn = document.getElementById('btnWaSend');
    if (btn) { btn.disabled = true; btn.textContent = 'שולח...'; }
    const progressEl = document.getElementById('waSendProgress');

    let sent = 0, failed = 0;

    for (let i = 0; i < soldiers.length; i++) {
        const s = soldiers[i];
        const msg = buildWaMessage(s);
        const phone = normalizePhone(s.phone);
        progressEl.textContent = `שולח ${i + 1} / ${soldiers.length} — ${s.name}...`;

        try {
            if (method === 'greenapi') {
                const { idInstance, apiTokenInstance, apiUrl } = CONFIG.greenApi;
                const chatId = phone + '@c.us';
                const url = `${apiUrl || 'https://api.green-api.com'}/waInstance${idInstance}/sendMessage/${apiTokenInstance}`;
                const resp = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chatId, message: msg })
                });
                const data = await resp.json();
                if (data.idMessage) { sent++; } else { failed++; console.warn('WA fail:', s.name, data); }
            } else {
                // wa.me fallback
                const intl = phone.startsWith('972') ? phone : '972' + phone;
                window.open(`https://wa.me/${intl}?text=${encodeURIComponent(msg)}`, '_blank');
                sent++;
            }
        } catch (err) {
            failed++;
            console.warn('WA send error for', s.name, err);
        }

        // Delay between sends
        if (i < soldiers.length - 1) {
            await new Promise(r => setTimeout(r, delay * 1000));
        }
    }

    progressEl.textContent = `הושלם: ${sent} נשלחו${failed ? `, ${failed} נכשלו` : ''}`;
    showToast(`נשלחו ${sent} הודעות${failed ? ` (${failed} נכשלו)` : ''}`, failed ? 'warning' : 'success');
    _waSending = false;
    if (btn) { btn.disabled = false; btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg> שלח עכשיו'; }
}

// --- Google Sheets Sync ---

async function pushWeaponsToSheets(data) {
    if (!CONFIG.weaponsScriptUrl) return;
    try {
        const payload = {
            timestamp: new Date().toISOString(),
            company: data.company,
            firstName: data.firstName,
            lastName: data.lastName,
            idNumber: data.idNumber,
            personalNum: data.personalNum,
            birthYear: data.birthYear,
            fatherName: data.fatherName,
            street: data.street,
            houseNum: data.houseNum,
            city: data.city,
            postalCode: data.postalCode,
            phone: data.phone,
            landline: data.landline,
            personalWeaponSource: data.personalWeaponSource,
            rangeDate: data.rangeDate,
            enlistmentDate: data.enlistmentDate,
            dischargeDate: data.dischargeDate,
            medicalApprovalDate: data.medicalApprovalDate,
            rank: data.rank,
            combatCertified: data.combatCertified ? 'כן' : 'לא'
        };
        await fetch(CONFIG.weaponsScriptUrl, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
    } catch (err) {
        console.warn('Push to Sheets failed:', err);
    }
}

async function pullWeaponsFromSheets() {
    if (!CONFIG.weaponsSheetId) { showToast('לא הוגדר מזהה טבלת נשקים', 'error'); return; }
    showToast('מסנכרן תשובות מגוגל שיטס...', 'info');
    try {
        const url = `https://docs.google.com/spreadsheets/d/${CONFIG.weaponsSheetId}/export?format=csv&gid=1582935634`;
        const resp = await fetch(url);
        if (!resp.ok) throw new Error('שגיאה בטעינת הטבלה');
        const csv = await resp.text();
        const rows = csv.split('\n').map(r => r.split(',').map(c => c.replace(/^"|"$/g, '').trim()));
        if (rows.length < 2) { showToast('הטבלה ריקה', 'info'); return; }

        const headers = rows[0];
        let synced = 0;

        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (row.length < 5) continue;
            const idNumber = row[headers.indexOf('תעודת זהות')] || '';
            if (!idNumber) continue;

            // Find soldier by ID number
            const soldier = state.soldiers.find(s => {
                const rec = state.weaponsData.find(r => r.soldierId === s.id);
                return rec && rec.idNumber === idNumber;
            }) || state.soldiers.find(s => s.personalId === (row[headers.indexOf('מספר אישי')] || ''));

            if (!soldier) continue;

            let rec = state.weaponsData.find(r => r.soldierId === soldier.id);
            if (!rec) {
                rec = { soldierId: soldier.id, source: 'sheets' };
                state.weaponsData.push(rec);
            }

            // Only update fields that are empty in the app (don't overwrite app data)
            if (!rec.firstName) rec.firstName = row[headers.indexOf('שם פרטי')] || '';
            if (!rec.lastName) rec.lastName = row[headers.indexOf('שם משפחה')] || '';
            if (!rec.idNumber) rec.idNumber = idNumber;
            if (!rec.personalNum) rec.personalNum = row[headers.indexOf('מספר אישי')] || '';
            if (!rec.birthYear) rec.birthYear = row[headers.indexOf('שנת לידה')] || '';
            if (!rec.fatherName) rec.fatherName = row[headers.indexOf('שם האב')] || '';
            if (!rec.street) rec.street = row[headers.indexOf('רחוב')] || '';
            if (!rec.houseNum) rec.houseNum = row[headers.indexOf('מס\' הבית')] || '';
            if (!rec.city) rec.city = row[headers.indexOf('יישוב')] || '';
            if (!rec.postalCode) rec.postalCode = row[headers.indexOf('מיקוד')] || '';
            if (!rec.phone) rec.phone = row[headers.indexOf('טלפון נייד')] || '';
            if (!rec.landline) rec.landline = row[headers.indexOf('טלפון נייח')] || '';
            if (!rec.rank) rec.rank = row[headers.indexOf('דרגה נוכחית בצה"ל')] || '';

            synced++;
        }

        saveState();
        renderWeaponsTab();
        showToast(`סונכרנו ${synced} רשומות מגוגל שיטס`);
    } catch (err) {
        console.error('Pull from Sheets error:', err);
        showToast('שגיאה בסנכרון: ' + err.message, 'error');
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
        <h4 style="margin:0 0 10px;">סט ציוד ללוחם (${es.baseSet.items.length} פריטים)</h4>
        <div class="table-scroll"><table style="width:100%;font-size:0.85em;border-collapse:collapse;">
            <thead><tr style="background:var(--primary);color:white;">
                <th style="padding:6px 8px;text-align:right;">שם פריט</th>
                <th style="padding:6px 8px;text-align:center;width:55px;">כמות</th>
                <th style="padding:6px 8px;text-align:center;">קטגוריה</th>
                <th style="padding:6px 8px;text-align:center;width:40px;">צ'</th>
                <th style="padding:6px 8px;text-align:center;width:90px;">מס' צ'</th>
                <th style="padding:6px 8px;width:36px;"></th>
            </tr></thead>
            <tbody>
                ${es.baseSet.items.map((item, i) => `<tr draggable="true" data-idx="${i}" ondragstart="onEquipDragStart(event)" ondragover="onEquipDragOver(event)" ondrop="onEquipDrop(event)" style="border-bottom:1px solid var(--border);cursor:grab;">
                    <td style="padding:5px 8px;"><input type="text" value="${esc(item.name)}" onchange="updateBaseSetItem(${i},'name',this.value)" style="width:100%;border:1px solid var(--border);padding:3px 6px;border-radius:4px;"></td>
                    <td style="padding:5px 4px;text-align:center;"><input type="number" min="1" value="${item.quantity}" onchange="updateBaseSetItem(${i},'quantity',parseInt(this.value))" style="width:48px;text-align:center;border:1px solid var(--border);padding:3px;border-radius:4px;"></td>
                    <td style="padding:5px 4px;"><select onchange="updateBaseSetItem(${i},'category',this.value)" style="width:100%;border:1px solid var(--border);padding:3px;border-radius:4px;">
                        ${EQUIPMENT_CATEGORIES.map(c => `<option value="${c}" ${item.category===c?'selected':''}>${c}</option>`).join('')}
                    </select></td>
                    <td style="padding:5px 4px;text-align:center;"><input type="checkbox" ${item.requiresSerial?'checked':''} onchange="updateBaseSetItem(${i},'requiresSerial',this.checked)" title="דורש מספר צ'"></td>
                    <td style="padding:5px 4px;text-align:center;">${item.requiresSerial ? `<input type="text" value="${esc(item.serialNumber||'')}" onchange="updateBaseSetItem(${i},'serialNumber',this.value)" style="width:80px;text-align:center;border:1px solid var(--border);padding:3px;border-radius:4px;font-size:0.85em;direction:ltr;">` : '<span style="color:var(--text-light);">—</span>'}</td>
                    <td style="padding:5px 4px;text-align:center;"><button class="btn btn-danger btn-sm" onclick="removeBaseSetItem(${i})" style="padding:2px 6px;font-size:0.8em;">X</button></td>
                </tr>`).join('')}
            </tbody>
        </table></div>
        <button class="btn btn-sm btn-primary" style="margin-top:8px;" onclick="addBaseSetItem()">+ הוסף פריט</button>
    </div>`;

    // Commander roleSet
    if (es.roleSets && es.roleSets.length > 0) {
        es.roleSets.forEach((rs, ri) => {
            html += `<div class="sub-section" style="margin-top:16px;">
                <h4 style="margin:0 0 6px;">${esc(rs.name)} (${rs.items.length} פריטים)</h4>
                <p style="font-size:0.78em;color:var(--text-light);margin:0 0 8px;">תפקידים: ${esc(rs.roles.join(', '))}</p>
                <div class="table-scroll"><table style="width:100%;font-size:0.85em;border-collapse:collapse;">
                    <thead><tr style="background:#546E7A;color:white;">
                        <th style="padding:6px 8px;text-align:right;">שם פריט</th>
                        <th style="padding:6px 8px;text-align:center;width:55px;">כמות</th>
                        <th style="padding:6px 8px;text-align:center;">קטגוריה</th>
                        <th style="padding:6px 8px;text-align:center;width:90px;">מס' צ'</th>
                    </tr></thead>
                    <tbody>${rs.items.map(item => `<tr style="border-bottom:1px solid var(--border);">
                        <td style="padding:5px 8px;">${esc(item.name)}</td>
                        <td style="padding:5px 8px;text-align:center;">${item.quantity}</td>
                        <td style="padding:5px 8px;text-align:center;">${esc(item.category || '')}</td>
                        <td style="padding:5px 8px;text-align:center;font-family:monospace;direction:ltr;">${item.requiresSerial && item.serialNumber ? esc(item.serialNumber) : '—'}</td>
                    </tr>`).join('')}</tbody>
                </table></div>
            </div>`;
        });
    }

    container.innerHTML = html;
}

// Drag & drop reorder for equipment set items
let _equipDragIdx = null;
function onEquipDragStart(e) {
    _equipDragIdx = parseInt(e.currentTarget.dataset.idx);
    e.currentTarget.style.opacity = '0.4';
    e.dataTransfer.effectAllowed = 'move';
}
function onEquipDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const row = e.currentTarget;
    row.style.borderTop = '3px solid var(--primary)';
}
function onEquipDrop(e) {
    e.preventDefault();
    const toIdx = parseInt(e.currentTarget.dataset.idx);
    e.currentTarget.style.borderTop = '';
    if (_equipDragIdx === null || _equipDragIdx === toIdx) return;
    const items = settings.equipmentSets.baseSet.items;
    const [moved] = items.splice(_equipDragIdx, 1);
    items.splice(toIdx, 0, moved);
    _equipDragIdx = null;
    saveSettings();
    renderEquipmentSetsSettings();
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
    const idx = { items: 0, dashboard: 1, reports: 2, transfer: 3 }[tab] || 0;
    if (btns[idx]) btns[idx].classList.add('active');

    if (tab === 'dashboard') renderPalsamDashboard();
    if (tab === 'reports') renderEquipmentReports();
    if (tab === 'transfer') renderTransferHistory();
}

// --- Equipment Reports ---
function renderEquipmentReports() {
    const container = document.getElementById('equipmentReportContent');
    const filterGroup = document.getElementById('reportFilterGroup');
    const filterSelect = document.getElementById('reportFilter');
    const reportType = document.getElementById('reportType')?.value || 'byCategory';
    if (!container) return;

    const equip = state.equipment || [];

    // Update filter options based on report type
    if (filterSelect) {
        const prev = filterSelect.value;
        let opts = '<option value="all">הכל</option>';
        if (reportType === 'byCategory') {
            const cats = [...new Set(equip.map(e => e.category || 'כללי'))].sort();
            cats.forEach(c => opts += `<option value="${esc(c)}">${esc(c)}</option>`);
        } else if (reportType === 'byType') {
            const types = [...new Set(equip.map(e => e.type))].sort();
            types.forEach(t => opts += `<option value="${esc(t)}">${esc(t)}</option>`);
        } else if (reportType === 'byCompany') {
            const companies = [...new Set(state.soldiers.map(s => s.company).filter(Boolean))].sort();
            companies.forEach(c => opts += `<option value="${c}">${c}</option>`);
        }
        filterSelect.innerHTML = opts;
        if (filterSelect.querySelector(`option[value="${prev}"]`)) filterSelect.value = prev;
        filterGroup.style.display = ['unsigned','byHolder','byLoss','byFaulty'].includes(reportType) ? 'none' : '';
    }

    const filterVal = filterSelect?.value || 'all';
    let html = '';

    if (reportType === 'byCategory') {
        html = _reportByCategory(equip, filterVal);
    } else if (reportType === 'byType') {
        html = _reportByType(equip, filterVal);
    } else if (reportType === 'byHolder') {
        html = _reportByHolder(equip);
    } else if (reportType === 'byCompany') {
        html = _reportByCompany(equip, filterVal);
    } else if (reportType === 'unsigned') {
        html = _reportUnsigned(equip);
    } else if (reportType === 'byLoss') {
        html = _reportByLoss(equip);
    } else if (reportType === 'byFaulty') {
        html = _reportByFaulty(equip);
    }

    container.innerHTML = html || '<div class="empty-state"><p>אין נתונים להצגה</p></div>';
    refreshIcons();
}

function _reportByCategory(equip, filterVal) {
    const grouped = {};
    equip.forEach(e => {
        const cat = e.category || 'כללי';
        if (filterVal !== 'all' && cat !== filterVal) return;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(e);
    });
    if (!Object.keys(grouped).length) return '';
    return Object.keys(grouped).sort().map(cat => {
        const items = grouped[cat];
        const assigned = items.filter(i => i.holderId).length;
        return `<div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title"><div class="icon" style="background:#E3F2FD;color:#1565C0;"><i data-lucide="box"></i></div>${esc(cat)} (${items.length} פריטים, ${assigned} מוחזקים)</div>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>פריט</th><th>מס' צ'</th><th>מחזיק</th><th>סטטוס</th></tr></thead>
                <tbody>${items.map(i => `<tr>
                    <td>${esc(i.type)}</td><td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                    <td>${esc(i.holderName || '-')}</td>
                    <td>${i.holderId ? '<span style="color:#27ae60;">מוחזק</span>' : i.status === 'faulty' ? '<span style="color:#e74c3c;">תקול</span>' : '<span style="color:#7f8c8d;">פנוי</span>'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _reportByType(equip, filterVal) {
    const grouped = {};
    equip.forEach(e => {
        if (filterVal !== 'all' && e.type !== filterVal) return;
        if (!grouped[e.type]) grouped[e.type] = [];
        grouped[e.type].push(e);
    });
    if (!Object.keys(grouped).length) return '';
    return Object.keys(grouped).sort().map(type => {
        const items = grouped[type];
        const assigned = items.filter(i => i.holderId).length;
        return `<div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title"><div class="icon" style="background:#FBE9E7;color:#FF5722;"><i data-lucide="wrench"></i></div>${esc(type)} (${items.length} יחידות, ${assigned} מוחזקים)</div>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>מס' צ'</th><th>קטגוריה</th><th>מחזיק</th><th>מ.א</th><th>פלוגה</th></tr></thead>
                <tbody>${items.map(i => {
                    const sol = i.holderId ? state.soldiers.find(s => s.id === i.holderId) : null;
                    return `<tr>
                        <td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                        <td>${esc(i.category || '-')}</td>
                        <td>${esc(i.holderName || '-')}</td>
                        <td>${esc(sol?.personalId || '-')}</td>
                        <td>${esc(sol?.company || '-')}</td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _reportByHolder(equip) {
    const holders = {};
    equip.filter(e => e.holderId).forEach(e => {
        if (!holders[e.holderId]) holders[e.holderId] = { name: e.holderName, items: [] };
        holders[e.holderId].items.push(e);
    });
    if (!Object.keys(holders).length) return '<div class="empty-state"><p>אין ציוד מוחזק</p></div>';
    return Object.entries(holders).sort((a, b) => a[1].name.localeCompare(b[1].name, 'he')).map(([id, h]) => {
        const sol = state.soldiers.find(s => s.id === id);
        return `<div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title"><div class="icon" style="background:#E8F5E9;color:#2E7D32;"><i data-lucide="user"></i></div>${esc(h.name)} ${sol ? '(' + esc(sol.personalId || '') + ' | ' + esc(sol.company || '') + ')' : ''} — ${h.items.length} פריטים</div>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>פריט</th><th>מס' צ'</th><th>קטגוריה</th><th>תאריך קבלה</th></tr></thead>
                <tbody>${h.items.map(i => `<tr>
                    <td>${esc(i.type)}</td><td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                    <td>${esc(i.category || '-')}</td>
                    <td>${i.assignedDate ? new Date(i.assignedDate).toLocaleDateString('he-IL') : '-'}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _reportByCompany(equip, filterVal) {
    const companies = {};
    equip.filter(e => e.holderId).forEach(e => {
        const sol = state.soldiers.find(s => s.id === e.holderId);
        const comp = sol?.company || 'לא משויך';
        if (filterVal !== 'all' && comp !== filterVal) return;
        if (!companies[comp]) companies[comp] = {};
        if (!companies[comp][e.holderId]) companies[comp][e.holderId] = { name: e.holderName, items: [] };
        companies[comp][e.holderId].items.push(e);
    });
    if (!Object.keys(companies).length) return '<div class="empty-state"><p>אין נתונים</p></div>';
    return Object.keys(companies).sort().map(comp => {
        const soldiers = companies[comp];
        const totalItems = Object.values(soldiers).reduce((s, h) => s + h.items.length, 0);
        return `<div class="sub-section" style="margin-bottom:18px;">
            <div class="section-title"><div class="icon" style="background:#F3E5F5;color:#7B1FA2;"><i data-lucide="building"></i></div>${esc(comp)} (${Object.keys(soldiers).length} חיילים, ${totalItems} פריטים)</div>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>חייל</th><th>מ.א</th><th>מספר פריטים</th><th>פריטים</th></tr></thead>
                <tbody>${Object.entries(soldiers).sort((a, b) => a[1].name.localeCompare(b[1].name, 'he')).map(([id, h]) => {
                    const sol = state.soldiers.find(s => s.id === id);
                    return `<tr>
                        <td>${esc(h.name)}</td>
                        <td>${esc(sol?.personalId || '-')}</td>
                        <td>${h.items.length}</td>
                        <td style="font-size:0.85em;">${esc(h.items.map(i => i.type).join(', '))}</td>
                    </tr>`;
                }).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _reportUnsigned(equip) {
    const unsigned = equip.filter(e => !e.holderId && e.status !== 'faulty');
    if (!unsigned.length) return '<div class="empty-state"><p>כל הציוד מוחזק &#10003;</p></div>';
    return `<div class="sub-section">
        <div class="section-title"><div class="icon" style="background:#FFF3E0;color:#E65100;"><i data-lucide="alert-triangle"></i></div>ציוד לא מוחתם (${unsigned.length} פריטים)</div>
        <table class="data-table" style="width:100%;font-size:0.88em;">
            <thead><tr><th>פריט</th><th>מס' צ'</th><th>קטגוריה</th><th>הערות</th></tr></thead>
            <tbody>${unsigned.map(i => `<tr>
                <td>${esc(i.type)}</td><td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                <td>${esc(i.category || '-')}</td><td>${esc(i.notes || '-')}</td>
            </tr>`).join('')}</tbody>
        </table>
    </div>`;
}

function _getCategoryGroup(category) {
    for (const [group, cats] of Object.entries(CATEGORY_GROUPS)) {
        if (cats.includes(category)) return group;
    }
    return 'לוגיסטיקה';
}

function _reportByLoss(equip) {
    const lostItems = equip.filter(e => e.condition === 'אובדן' || e.condition === 'מת"ש');
    if (!lostItems.length) return '<div class="empty-state"><p>אין פריטי אובדן/מת"ש</p></div>';
    const grouped = {};
    lostItems.forEach(e => {
        const grp = _getCategoryGroup(e.category || 'אחר');
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(e);
    });
    return `<div class="sub-section" style="margin-bottom:12px;">
        <div class="section-title"><div class="icon" style="background:#FCE4EC;color:#C62828;"><i data-lucide="alert-triangle"></i></div>דוח אובדן / מת"ש (${lostItems.length} פריטים)</div>
    </div>` + Object.keys(grouped).sort().map(grp => {
        const items = grouped[grp];
        return `<div class="sub-section" style="margin-bottom:16px;">
            <h4 style="margin:0 0 8px;color:var(--text-light);">${grp} (${items.length})</h4>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>פריט</th><th>מס' צ'</th><th>מצב</th><th>תאריך</th><th>מדווח</th><th>תיאור</th></tr></thead>
                <tbody>${items.map(i => `<tr>
                    <td>${esc(i.type)}</td>
                    <td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                    <td><span style="color:#C62828;font-weight:600;">${esc(i.condition)}</span></td>
                    <td>${i.lossDate || '-'}</td>
                    <td>${esc(i.lossReportingSoldier || '-')}</td>
                    <td style="font-size:0.85em;">${esc(i.lossDescription || '-')}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _reportByFaulty(equip) {
    const faultyItems = equip.filter(e => e.condition === 'תקול');
    if (!faultyItems.length) return '<div class="empty-state"><p>אין פריטים תקולים</p></div>';
    const grouped = {};
    faultyItems.forEach(e => {
        const grp = _getCategoryGroup(e.category || 'אחר');
        if (!grouped[grp]) grouped[grp] = [];
        grouped[grp].push(e);
    });
    return `<div class="sub-section" style="margin-bottom:12px;">
        <div class="section-title"><div class="icon" style="background:#FFF3E0;color:#E65100;"><i data-lucide="wrench"></i></div>דוח תקולים לתיקון (${faultyItems.length} פריטים)</div>
    </div>` + Object.keys(grouped).sort().map(grp => {
        const items = grouped[grp];
        return `<div class="sub-section" style="margin-bottom:16px;">
            <h4 style="margin:0 0 8px;color:var(--text-light);">${grp} (${items.length})</h4>
            <table class="data-table" style="width:100%;font-size:0.88em;">
                <thead><tr><th>פריט</th><th>מס' צ'</th><th>מחסן</th><th>מסגרת</th><th>הערות</th></tr></thead>
                <tbody>${items.map(i => `<tr>
                    <td>${esc(i.type)}</td>
                    <td style="direction:ltr;font-family:monospace;">${esc(i.serial)}</td>
                    <td>${esc(i.warehouse || CONFIG.defaultWarehouse)}</td>
                    <td>${esc(i.company || '-')}</td>
                    <td style="font-size:0.85em;">${esc(i.notes || '-')}</td>
                </tr>`).join('')}</tbody>
            </table>
        </div>`;
    }).join('');
}

function _getReportData() {
    const reportType = document.getElementById('reportType')?.value || 'byCategory';
    const filterVal = document.getElementById('reportFilter')?.value || 'all';
    const equip = state.equipment || [];
    const rows = [];

    if (reportType === 'byCategory' || reportType === 'byType') {
        equip.forEach(e => {
            const cat = e.category || 'כללי';
            if (reportType === 'byCategory' && filterVal !== 'all' && cat !== filterVal) return;
            if (reportType === 'byType' && filterVal !== 'all' && e.type !== filterVal) return;
            const sol = e.holderId ? state.soldiers.find(s => s.id === e.holderId) : null;
            rows.push({
                'סוג': e.type, 'מס צ': e.serial, 'קטגוריה': cat,
                'מחזיק': e.holderName || '', 'מ.א': sol?.personalId || '', 'פלוגה': sol?.company || '',
                'סטטוס': e.holderId ? 'מוחזק' : e.status === 'faulty' ? 'תקול' : 'פנוי'
            });
        });
    } else if (reportType === 'byHolder') {
        equip.filter(e => e.holderId).forEach(e => {
            const sol = state.soldiers.find(s => s.id === e.holderId);
            rows.push({
                'חייל': e.holderName || '', 'מ.א': sol?.personalId || '', 'פלוגה': sol?.company || '',
                'פריט': e.type, 'מס צ': e.serial, 'קטגוריה': e.category || '',
                'תאריך קבלה': e.assignedDate ? new Date(e.assignedDate).toLocaleDateString('he-IL') : ''
            });
        });
    } else if (reportType === 'byCompany') {
        equip.filter(e => e.holderId).forEach(e => {
            const sol = state.soldiers.find(s => s.id === e.holderId);
            const comp = sol?.company || 'לא משויך';
            if (filterVal !== 'all' && comp !== filterVal) return;
            rows.push({
                'פלוגה': comp, 'חייל': e.holderName || '', 'מ.א': sol?.personalId || '',
                'פריט': e.type, 'מס צ': e.serial, 'קטגוריה': e.category || ''
            });
        });
    } else if (reportType === 'unsigned') {
        equip.filter(e => !e.holderId && e.status !== 'faulty').forEach(e => {
            rows.push({ 'פריט': e.type, 'מס צ': e.serial, 'קטגוריה': e.category || '', 'הערות': e.notes || '' });
        });
    }
    return rows;
}

function exportReportCSV() {
    const rows = _getReportData();
    if (!rows.length) { showToast('אין נתונים לייצוא', 'error'); return; }
    const headers = Object.keys(rows[0]);
    const bom = '\uFEFF';
    const csv = bom + headers.join(',') + '\n' + rows.map(r => headers.map(h => `"${(r[h] || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    const reportType = document.getElementById('reportType')?.value || 'report';
    a.download = `דוח_ציוד_${reportType}_${new Date().toLocaleDateString('he-IL').replace(/\./g, '-')}.csv`;
    a.click();
    showToast('קובץ CSV הורד');
}

function exportReportPDF() {
    const rows = _getReportData();
    if (!rows.length) { showToast('אין נתונים לייצוא', 'error'); return; }
    const headers = Object.keys(rows[0]);
    const reportType = document.getElementById('reportType')?.value || '';
    const reportNames = { byCategory: 'לפי קטגוריה', byType: 'לפי סוג ציוד', byHolder: 'לפי מחזיק', byCompany: 'לפי פלוגה', unsigned: 'ציוד לא מוחתם' };
    const title = 'דוח ציוד — ' + (reportNames[reportType] || reportType);
    const dateStr = new Date().toLocaleDateString('he-IL');

    const thStyle = 'padding:7px 10px;background:#1a3a5c;color:white;text-align:right;border:1px solid #1a3a5c;font-size:0.85em;';
    const tdStyle = 'padding:6px 10px;border:1px solid #dfe6e9;font-size:0.83em;text-align:right;';

    const html = `<div style="direction:rtl;font-family:'Segoe UI',Arial,sans-serif;max-width:780px;margin:auto;padding:28px;">
        <div style="text-align:center;margin-bottom:18px;">
            <h2 style="color:#1a3a5c;margin:0 0 4px;">${title}</h2>
            <p style="color:#7f8c8d;margin:0;font-size:0.85em;">תאריך: ${dateStr} | סה"כ ${rows.length} שורות</p>
            <hr style="border:none;border-top:2px solid #1a3a5c;margin:12px 0;">
        </div>
        <table style="width:100%;border-collapse:collapse;">
            <thead><tr>${headers.map(h => `<th style="${thStyle}">${h}</th>`).join('')}</tr></thead>
            <tbody>${rows.map(r => `<tr>${headers.map(h => `<td style="${tdStyle}">${r[h] || ''}</td>`).join('')}</tr>`).join('')}</tbody>
        </table>
        <div style="text-align:center;margin-top:16px;font-size:0.72em;color:#aaa;">מערכת ניהול גדודי | ${dateStr}</div>
    </div>`;
    downloadPDF(html, `דוח_ציוד_${reportType}_${dateStr.replace(/\./g, '-')}`);
}

// --- Generate Personal Equipment ---
function openGeneratePakalModal() {
    openModal('generatePakalModal');
    const compDropdown = document.getElementById('pakalGenCompany');
    const userUnit = currentUser?.unit;
    // Non-palsam/high-level users → lock to their company
    if (userUnit && getUserPermissionLevel() < PERM.COMPANY_CMD && userUnit !== 'palsam') {
        compDropdown.value = userUnit;
        compDropdown.disabled = true;
    } else {
        compDropdown.disabled = false;
    }
    updatePakalGenSoldiers();
    document.getElementById('pakalGenItemsList').style.display = 'none';
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
        soldiers.map(s => `<option value="${s.id}">${esc(s.name)} (${esc(s.role || 'לוחם')} - ${esc(companyData[s.company]?.name || s.company)})</option>`).join('');
    document.getElementById('pakalGenItemsList').style.display = 'none';
}

function previewPakalForSoldier() {
    const soldierId = document.getElementById('pakalGenSoldier').value;
    const itemsList = document.getElementById('pakalGenItemsList');
    if (!soldierId) { itemsList.style.display = 'none'; return; }
    const soldier = state.soldiers.find(s => s.id === soldierId);
    if (!soldier) return;

    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const roleSet = getRoleSetForSoldier(soldier);
    const baseItems = (es.baseSet.items || []).map(i => ({ ...i, source: 'base' }));
    const roleItems = roleSet ? roleSet.items.map(i => ({ ...i, source: 'role' })) : [];
    const allItems = [...baseItems, ...roleItems];

    itemsList.style.display = '';
    itemsList.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong>${esc(soldier.name)}</strong>
            <div style="display:flex;gap:6px;">
                <button type="button" class="btn btn-sm" style="background:var(--success);color:#fff;font-size:0.8em;" onclick="toggleAllPakalItems(true)">בחר הכל</button>
                <button type="button" class="btn btn-sm" style="background:var(--bg);font-size:0.8em;" onclick="toggleAllPakalItems(false)">נקה הכל</button>
            </div>
        </div>
        <div style="max-height:350px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius);">
            <table style="width:100%;border-collapse:collapse;font-size:0.85em;">
                <thead><tr style="background:var(--primary);color:#fff;">
                    <th style="padding:6px 4px;width:30px;"></th>
                    <th style="padding:6px;text-align:right;">פריט</th>
                    <th style="padding:6px;width:60px;text-align:center;">כמות</th>
                    <th style="padding:6px;width:100px;text-align:center;">מספר צ'</th>
                </tr></thead>
                <tbody>
                    ${allItems.map((item, i) => `<tr style="border-bottom:1px solid var(--border);" class="pakal-gen-item-row">
                        <td style="padding:4px;text-align:center;">
                            <input type="checkbox" class="pakal-gen-cb" data-idx="${i}" checked>
                        </td>
                        <td style="padding:4px 6px;">
                            ${esc(item.name)}
                            ${item.source === 'role' ? '<span style="font-size:0.75em;color:var(--primary);margin-right:4px;">(תפקידי)</span>' : ''}
                        </td>
                        <td style="padding:4px;text-align:center;">
                            <input type="number" class="pakal-gen-qty" data-idx="${i}" value="${item.quantity}" min="1" style="width:50px;padding:2px;border:1px solid var(--border);border-radius:4px;text-align:center;">
                        </td>
                        <td style="padding:4px;text-align:center;">
                            ${item.requiresSerial ? `<input type="text" class="pakal-gen-serial" data-idx="${i}" placeholder="מספר צ'" style="width:90px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;text-align:center;">` : '<span style="color:var(--text-light);font-size:0.8em;">-</span>'}
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>
        </div>
        <div style="margin-top:6px;font-size:0.83em;color:var(--text-light);text-align:left;">
            <span id="pakalGenCount">${allItems.length}</span> פריטים נבחרו
        </div>`;

    // Update count on checkbox change
    itemsList.querySelectorAll('.pakal-gen-cb').forEach(cb => {
        cb.addEventListener('change', () => {
            const checked = itemsList.querySelectorAll('.pakal-gen-cb:checked').length;
            document.getElementById('pakalGenCount').textContent = checked;
        });
    });
}

function toggleAllPakalItems(state) {
    document.querySelectorAll('.pakal-gen-cb').forEach(cb => { cb.checked = state; });
    const count = state ? document.querySelectorAll('.pakal-gen-cb').length : 0;
    const el = document.getElementById('pakalGenCount');
    if (el) el.textContent = count;
}

function confirmGeneratePakal() {
    const soldierId = document.getElementById('pakalGenSoldier').value;
    if (!soldierId) { showToast('בחר חייל', 'error'); return; }
    if (state.personalEquipment.find(pe => pe.soldierId === soldierId)) {
        showToast('לחייל זה כבר הונפק ציוד', 'error'); return;
    }

    // Collect selected items from the items table
    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const soldier = state.soldiers.find(s => s.id === soldierId);
    const roleSet = soldier ? getRoleSetForSoldier(soldier) : null;
    const baseItems = (es.baseSet.items || []).map(i => ({ ...i, source: 'base' }));
    const roleItems = roleSet ? roleSet.items.map(i => ({ ...i, source: 'role' })) : [];
    const allItems = [...baseItems, ...roleItems];

    const selectedItems = [];
    document.querySelectorAll('.pakal-gen-cb:checked').forEach(cb => {
        const idx = parseInt(cb.dataset.idx);
        const item = allItems[idx];
        if (!item) return;
        const qtyInput = document.querySelector(`.pakal-gen-qty[data-idx="${idx}"]`);
        const serialInput = document.querySelector(`.pakal-gen-serial[data-idx="${idx}"]`);
        selectedItems.push({
            ...item,
            quantity: parseInt(qtyInput?.value) || item.quantity,
            serialNumber: serialInput?.value?.trim() || ''
        });
    });

    if (selectedItems.length === 0) { showToast('יש לבחור לפחות פריט אחד', 'error'); return; }

    generatePersonalEquipment(soldierId, selectedItems);
    closeModal('generatePakalModal');
    showToast(`ציוד הונפק עם ${selectedItems.length} פריטים`);
    if (equipmentSubTab === 'pakal') renderPakalSubTab();
}

function generatePersonalEquipment(soldierId, selectedItems) {
    const soldier = state.soldiers.find(s => s.id === soldierId);
    if (!soldier) return;

    const items = [];
    let counter = 1;

    if (selectedItems) {
        // From modal - use selected items with custom quantities and serials
        selectedItems.forEach(item => {
            items.push({
                itemId: 'pi_' + (counter++),
                name: item.name, quantity: item.quantity, category: item.category,
                requiresSerial: item.requiresSerial, serialNumber: item.serialNumber || '', source: item.source,
                status: 'pending', issuedQuantity: 0, linkedEquipmentIds: [],
                issuedDate: null, returnedDate: null, notes: ''
            });
        });
    } else {
        // Bulk generate - use all baseSet + roleSet with defaults
        const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
        const roleSet = getRoleSetForSoldier(soldier);
        (es.baseSet.items || []).forEach(item => {
            items.push({
                itemId: 'pi_' + (counter++),
                name: item.name, quantity: item.quantity, category: item.category,
                requiresSerial: item.requiresSerial, serialNumber: '', source: 'base',
                status: 'pending', issuedQuantity: 0, linkedEquipmentIds: [],
                issuedDate: null, returnedDate: null, notes: ''
            });
        });
        if (roleSet) {
            roleSet.items.forEach(item => {
                items.push({
                    itemId: 'pi_' + (counter++),
                    name: item.name, quantity: item.quantity, category: item.category,
                    requiresSerial: item.requiresSerial, serialNumber: '', source: 'role',
                    status: 'pending', issuedQuantity: 0, linkedEquipmentIds: [],
                    issuedDate: null, returnedDate: null, notes: ''
                });
            });
        }
    }

    const pe = {
        id: 'pe_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
        soldierId,
        generatedDate: new Date().toISOString(),
        roleSetId: roleSet ? roleSet.id : null,
        items,
        bulkSignature: { signed: false, signatureImg: null, signedDate: null, issuedBy: '', issuerSignatureImg: null },
        history: [{ date: new Date().toISOString(), action: 'created', details: 'ציוד הונפק' }]
    };
    state.personalEquipment.push(pe);
    saveState();
    return pe;
}

function openBulkGeneratePakalModal() {
    const compDropdown = document.getElementById('bulkPakalCompany');
    const userUnit = currentUser?.unit;
    if (userUnit && getUserPermissionLevel() < PERM.COMPANY_CMD && userUnit !== 'palsam') {
        compDropdown.value = userUnit;
        compDropdown.disabled = true;
    } else {
        compDropdown.disabled = false;
    }
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
    showToast(`הונפק ציוד ל-${count} חיילים`);
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

    // Filter by current user's company (palsam + level 5+ see all)
    const userUnit = currentUser?.unit;
    if (userUnit && getUserPermissionLevel() < PERM.COMPANY_CMD && userUnit !== 'palsam') {
        pelist = pelist.filter(pe => pe.soldier.company === userUnit);
    }

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
            <button class="btn btn-primary" onclick="openGeneratePakalModal()">+ הנפקת ציוד לחייל</button>
            <button class="btn btn-success" onclick="openBulkGeneratePakalModal()">הנפקת ציוד לפלוגה</button>
            <button class="btn" style="background:var(--bg)" onclick="exportPakalCSV()">ייצוא CSV</button>
        </div>
        <div class="quick-stats" style="margin-bottom:14px;">
            <div class="quick-stat"><div class="value">${stats.total}</div><div class="label">סה"כ חתימות על ציוד</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--success)"><div class="value" style="color:var(--success)">${stats.signed}</div><div class="label">חתמו</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--danger)"><div class="value" style="color:var(--danger)">${stats.unsigned}</div><div class="label">לא חתמו</div></div>
            <div class="quick-stat" style="border-top:3px solid var(--warning)"><div class="value" style="color:var(--warning)">${stats.partial}</div><div class="label">חלקי</div></div>
        </div>
        <div class="search-bar">
            <span class="search-icon"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
            <input type="text" id="pakalSearch" placeholder="חיפוש לפי שם חייל, פריט..." oninput="renderPakalSubTab()" value="${esc(search)}">
        </div>
        <div class="filter-buttons" style="margin-bottom:14px;">
            <button class="filter-btn ${pakalFilter==='all'?'active':''}" onclick="setPakalFilter('all',this)">הכל (${stats.total})</button>
            <button class="filter-btn ${pakalFilter==='signed'?'active':''}" onclick="setPakalFilter('signed',this)">חתמו (${stats.signed})</button>
            <button class="filter-btn ${pakalFilter==='unsigned'?'active':''}" onclick="setPakalFilter('unsigned',this)">לא חתמו (${stats.unsigned})</button>
            <button class="filter-btn ${pakalFilter==='partial'?'active':''}" onclick="setPakalFilter('partial',this)">חלקי (${stats.partial})</button>
        </div>
        ${pelist.length === 0 ? '<div class="empty-state"><p>אין חתימות ציוד להצגה</p></div>' :
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
                <thead><tr><th>פריט</th><th>מספר צ'</th><th>כמות</th><th>קטגוריה</th><th>מקור</th><th>סטטוס</th></tr></thead>
                <tbody>
                    ${pe.items.map((item, idx) => `<tr>
                        <td style="text-align:right;">${esc(item.name)}</td>
                        <td><input type="text" class="serial-input" value="${esc(item.serialNumber || '')}" placeholder="-" onchange="updatePakalSerial('${pe.soldierId}',${idx},this.value)" style="width:70px;padding:2px 4px;border:1px solid var(--border);border-radius:4px;text-align:center;font-size:0.85em;background:var(--bg);"></td>
                        <td>${item.quantity}</td>
                        <td>${esc(item.category || '')}</td>
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

function updatePakalSerial(soldierId, itemIdx, value) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    if (pe && pe.items[itemIdx]) {
        pe.items[itemIdx].serialNumber = value.trim();
        saveState();
    }
}

async function deletePakal(soldierId) {
    if (!await customConfirm('למחוק את הציוד של חייל זה?')) return;
    state.personalEquipment = state.personalEquipment.filter(pe => pe.soldierId !== soldierId);
    saveState();
    renderPakalSubTab();
    showToast('ציוד נמחק');
}

// --- Bulk Sign ---
function openBulkSignModal(soldierId) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!pe || !sol) return;

    document.getElementById('bulkSignSoldierId').value = soldierId;
    document.getElementById('bulkSignSoldierInfo').innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
            <strong>${esc(sol.name)}</strong> | ${esc(sol.role) || 'לוחם'} | ${esc(companyData[sol.company]?.name || '')} | מ.א: ${esc(sol.personalId) || '-'}
        </div>`;

    document.getElementById('bulkSignItemsList').innerHTML = `
        <div class="table-scroll"><table class="pakal-items-table">
            <thead><tr><th>פריט</th><th>מספר צ'</th><th>כמות</th><th>קטגוריה</th></tr></thead>
            <tbody>
                ${pe.items.map(item => `<tr>
                    <td style="text-align:right;">${esc(item.name)}</td>
                    <td>${esc(item.serialNumber || '-')}</td>
                    <td>${item.quantity}</td>
                    <td>${esc(item.category || '')}</td>
                </tr>`).join('')}
            </tbody>
        </table></div>
        <div style="font-size:0.85em;font-weight:700;margin-top:8px;">סה"כ: ${pe.items.length} פריטים</div>`;

    // Set default signing unit
    document.getElementById('bulkSignUnit').value = settings.equipmentSets?.defaultSigningUnit || CONFIG.defaultSigningUnit;

    // Try to load saved signature info for current user
    const savedSigKey = currentUser ? currentUser.name : '';
    const savedSignature = settings.equipmentSets?.savedSignatures?.[savedSigKey];

    if (savedSignature) {
        document.getElementById('bulkSignIssuerFirstName').value = savedSignature.firstName || '';
        document.getElementById('bulkSignIssuerLastName').value = savedSignature.lastName || '';
        document.getElementById('bulkSignUnit').value = savedSignature.unit || CONFIG.defaultSigningUnit;
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
    if (!pe) { showToast('ציוד לא נמצא', 'error'); return; }

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
    document.getElementById('extraItemSerialNumber').value = '';
    openModal('addExtraItemModal');
}

function confirmAddExtraItem() {
    const soldierId = document.getElementById('extraItemSoldierId').value;
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    if (!pe) { showToast('ציוד לא נמצא', 'error'); return; }

    const name = document.getElementById('extraItemName').value.trim();
    if (!name) { showToast('נא למלא שם פריט', 'error'); return; }

    const item = {
        itemId: 'pi_extra_' + Date.now(),
        name,
        quantity: parseInt(document.getElementById('extraItemQty').value) || 1,
        category: document.getElementById('extraItemCategory').value,
        requiresSerial: document.getElementById('extraItemSerial').checked,
        serialNumber: (document.getElementById('extraItemSerialNumber').value || '').trim(),
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
    showToast(`פריט "${name}" נוסף לציוד`);
}

// --- Return Pakal ---
function openReturnPakalModal(soldierId) {
    const pe = state.personalEquipment.find(p => p.soldierId === soldierId);
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!pe || !sol) return;

    document.getElementById('returnPakalSoldierId').value = soldierId;
    document.getElementById('returnPakalSoldierInfo').innerHTML = `
        <div style="background:var(--bg);border-radius:var(--radius);padding:12px;margin-bottom:12px;">
            <strong>${esc(sol.name)}</strong> | ${esc(sol.role) || 'לוחם'} | ${esc(companyData[sol.company]?.name || '')}
        </div>`;

    const issuedItems = pe.items.filter(i => i.status === 'issued');
    document.getElementById('returnPakalItemsList').innerHTML = issuedItems.length === 0
        ? '<p style="color:var(--text-light);">אין פריטים מונפקים להחזרה</p>'
        : `<div class="table-scroll"><table class="pakal-items-table">
            <thead><tr><th>החזר</th><th>פריט</th><th>כמות</th><th>קטגוריה</th></tr></thead>
            <tbody>
                ${issuedItems.map(item => `<tr>
                    <td><input type="checkbox" class="return-item-cb" data-item-id="${esc(item.itemId)}" checked></td>
                    <td style="text-align:right;">${esc(item.name)}</td>
                    <td>${item.quantity}</td>
                    <td>${esc(item.category || '')}</td>
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
    if (!pe) { showToast('ציוד לא נמצא', 'error'); return; }

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

    const companyNames = getCompNames();
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
                <div class="label">סה"כ חתימות על ציוד</div>
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
                        <td>${esc(companyNames[s.company] || s.company)}</td>
                        <td style="text-align:center;">${s.pe.items.length}</td>
                        <td style="display:flex;gap:4px;">
                            <button class="btn btn-success btn-sm" onclick="openBulkSignModal('${s.id}')">חתימה</button>
                            ${s.phone ? `<a class="btn btn-sm" style="background:#25D366;color:#fff;" href="https://wa.me/972${s.phone.replace(/^0/,'').replace(/-/g,'')}?text=${encodeURIComponent('שלום ' + s.name + ', יש ציוד שממתין לחתימתך במערכת הגדודית. נא להגיע לפלס"ם לחתום.')}" target="_blank">WhatsApp</a>` : ''}
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

    const ws = 'word-spacing:0.15em;white-space:pre-wrap;';
    const thStyle = `background:#1a3a5c;color:white;padding:8px;font-size:13px;border:1px solid #1a3a5c;${ws}`;
    const tdStyle = `padding:6px 8px;border:1px solid #ddd;font-size:13px;text-align:center;${ws}`;
    const infoTd = `padding:4px 10px;font-size:14px;${ws}`;
    const html = `
    <div style="font-family:Arial,sans-serif;direction:rtl;padding:20px;max-width:700px;margin:0 auto;${ws}">
        <h1 style="text-align:center;color:#1a3a5c;border-bottom:3px solid #1a3a5c;padding-bottom:10px;margin:0 0 15px;${ws}">טופס חתימה על ציוד אישי</h1>
        <table style="margin:15px 0;">
            <tr><td style="${infoTd}"><strong>שם:</strong></td><td style="${infoTd}">${esc(sol.name)}</td><td style="${infoTd}"><strong>מספר אישי:</strong></td><td style="${infoTd}">${esc(sol.personalId || '-')}</td></tr>
            <tr><td style="${infoTd}"><strong>תפקיד:</strong></td><td style="${infoTd}">${esc(sol.role || 'לוחם')}</td><td style="${infoTd}"><strong>פלוגה:</strong></td><td style="${infoTd}">${esc(compName)}</td></tr>
            <tr><td style="${infoTd}"><strong>טלפון:</strong></td><td style="${infoTd}">${esc(sol.phone || '-')}</td><td style="${infoTd}"><strong>תאריך:</strong></td><td style="${infoTd}">${dateStr}</td></tr>
        </table>
        <p style="font-size:13px;${ws}">אני מאשר בחתימתי שקיבלתי את הציוד המפורט להלן במצב תקין, ואני מתחייב להחזירו במצב תקין בסיום השירות.</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0;">
            <thead><tr><th style="${thStyle}">#</th><th style="${thStyle}">פריט</th><th style="${thStyle}">מספר צ'</th><th style="${thStyle}">כמות</th><th style="${thStyle}">קטגוריה</th><th style="${thStyle}">מקור</th><th style="${thStyle}">סטטוס</th></tr></thead>
            <tbody>
                ${pe.items.map((item, i) => `<tr style="${i % 2 === 1 ? 'background:#f9f9f9;' : ''}">
                    <td style="${tdStyle}">${i + 1}</td>
                    <td style="${tdStyle}text-align:right;">${esc(item.name)}</td>
                    <td style="${tdStyle}">${esc(item.serialNumber || '-')}</td>
                    <td style="${tdStyle}">${item.quantity}</td>
                    <td style="${tdStyle}">${esc(item.category || '')}</td>
                    <td style="${tdStyle}">${item.source === 'base' ? 'בסיס' : item.source === 'role' ? 'תפקיד' : 'ידני'}</td>
                    <td style="${tdStyle}">${item.status === 'issued' ? 'הונפק' : item.status === 'returned' ? 'הוחזר' : 'ממתין'}</td>
                </tr>`).join('')}
            </tbody>
        </table>
        ${pe.bulkSignature.signed ? `
        <div style="margin-top:30px;display:flex;justify-content:space-between;">
            <div style="width:45%;text-align:center;">
                ${pe.bulkSignature.signatureImg ? `<img src="${pe.bulkSignature.signatureImg}" style="max-width:200px;max-height:80px;border-bottom:1px solid #333;">` : ''}
                <div style="font-size:12px;margin-top:4px;color:#666;${ws}">חתימת חייל מקבל</div>
                <div style="font-size:12px;${ws}">${esc(sol.name)}</div>
            </div>
            <div style="width:45%;text-align:center;">
                ${pe.bulkSignature.issuerSignatureImg ? `<img src="${pe.bulkSignature.issuerSignatureImg}" style="max-width:200px;max-height:80px;border-bottom:1px solid #333;">` : ''}
                <div style="font-size:12px;margin-top:4px;color:#666;${ws}">חתימת מנפיק</div>
                <div style="font-size:12px;${ws}">${esc(pe.bulkSignature.issuedBy || '')}</div>
                ${pe.bulkSignature.signingUnit ? `<div style="font-size:10px;color:#666;${ws}">${esc(pe.bulkSignature.signingUnit)}</div>` : ''}
            </div>
        </div>` : '<p style="text-align:center;color:#e74c3c;font-weight:bold;">טרם נחתם</p>'}
        <div style="text-align:center;font-size:11px;color:#999;margin-top:40px;border-top:1px solid #eee;padding-top:10px;${ws}">${CONFIG.systemTitle} - ${CONFIG.battalionName} ${CONFIG.battalionId} | הופק אוטומטית ${new Date().toLocaleString('he-IL')}</div>
    </div>`;

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

// Close modals - only via X button or Cancel, not backdrop click
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active')); document.body.classList.remove('modal-open'); }
});

init();
