# Permission System Redesign - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 3-tier permission system with a 7-level role-based system. Login via password 1875 + personal ID. Each role sees a clean, relevant UI.

**Architecture:** Keep all logic in app.js. Replace permission functions (isAdmin, canEdit, canView, etc.) with a single `getUserPermissionLevel()` that returns level 1-7. All UI gating flows through this level. Login becomes: password → personal ID → auto-detect role → assign level.

**Tech Stack:** Vanilla JS, Firebase Firestore, existing codebase (no build system)

---

### Task 1: Define Permission Level Constants & Role Mapping

**Files:**
- Modify: `app.js:128-198` (permission functions section)

**Step 1: Add permission level constants and role-to-level mapping**

Replace the existing permission functions block (lines 128-198) with:

```javascript
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

// Roles that map to each level (checked via includes on soldier.role)
const ROLE_LEVEL_MAP = [
    { level: PERM.COMPANY_CMD, roles: ['מ"פ', 'סמ"פ', 'סרס"פ', 'רס"פ'] },
    { level: PERM.OFFICER,     roles: ['קצין', 'סג"מ', 'סג"ם', 'רס"ן', 'סא"ל', 'אל"מ'] },
    { level: PERM.SAMAL,       roles: ['סמל', 'סמ"ח', 'רס"מ', 'רס"ר'] },
    { level: PERM.MASHAK,      roles: ['מ"כ', 'מ"מ', 'מפקד'] },
];

// Full access users by name
const FULL_ACCESS_NAMES = ['ניסים סוויסה'];

function getUserPermissionLevel() {
    if (!currentUser) return 0;

    // Level 7: Admin or full-access names
    if (isAdmin()) return PERM.FULL_ACCESS;
    if (FULL_ACCESS_NAMES.some(n => currentUser.name.includes(n))) return PERM.FULL_ACCESS;

    // Level 7: Lishka/HQ/Gdudi
    if (currentUser.company === 'gdudi' || currentUser.company === 'hq') return PERM.FULL_ACCESS;

    // Level 6: Palsam
    if (currentUser.company === 'palsam') return PERM.PALSAM;

    // Detect role from soldier data
    const role = currentUser.role || '';
    if (!role) return PERM.SOLDIER;

    // Check role map (ordered high→low, first match wins)
    for (const mapping of ROLE_LEVEL_MAP) {
        if (mapping.roles.some(r => role.includes(r))) return mapping.level;
    }

    return PERM.SOLDIER;
}

// Is this a palsam officer? (level 6b)
function isPalsamOfficer() {
    if (currentUser?.company !== 'palsam') return false;
    const role = currentUser.role || '';
    return ROLE_LEVEL_MAP[0].roles.concat(ROLE_LEVEL_MAP[1].roles)
        .some(r => role.includes(r));
}

// Keep backward-compatible wrappers (used in 50+ places)
function isAdmin() {
    return currentUser && currentUser.name === settings.adminName;
}

function isGdudiAccess() {
    return getUserPermissionLevel() >= PERM.FULL_ACCESS;
}

function canView(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.COMPANY_CMD) return true;  // מ"פ+ sees all companies
    if (level === PERM.PALSAM) return true;       // פלסם sees all
    return currentUser.unit === compKey;           // others see own company
}

function canEdit(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;   // לשכה edits all
    if (level === PERM.PALSAM) return false;       // פלסם can't edit company data (only equipment)
    if (level >= PERM.OFFICER) return currentUser.unit === compKey;  // קצין+ edits own company
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

function canSignEquipment(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level === PERM.PALSAM) return true;  // all palsam can sign equipment everywhere
    if (level >= PERM.SAMAL) return currentUser.unit === (compKey || currentUser.unit);
    return false;
}

function canEditConstraints(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (level >= PERM.SAMAL) return currentUser.unit === compKey;  // סמל+ can add constraints
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

function isSoldierView() {
    return getUserPermissionLevel() === PERM.SOLDIER;
}

function canEditTasks(compKey) {
    if (!currentUser) return false;
    const level = getUserPermissionLevel();
    if (level >= PERM.FULL_ACCESS) return true;
    if (isPalsamOfficer() && compKey === 'palsam') return true;
    if (level >= PERM.OFFICER) return currentUser.unit === compKey;
    return false;
}
```

**Step 2: Verify no syntax errors**

Open `index.html` in browser, open console, check for errors.

**Step 3: Commit**

```bash
git add app.js
git commit -m "feat: add 7-level permission system constants and functions"
```

---

### Task 2: Redesign Login Flow

**Files:**
- Modify: `app.js:224-278` (doLogin function)
- Modify: `index.html` (login form HTML)

**Step 1: Simplify login form in index.html**

Replace login form content with two-step flow:
- Step 1: Password field only (value must be "1875")
- Step 2: Personal ID field + auto-identification

```html
<!-- Login Step 1: Password -->
<div id="loginStep1">
    <div class="login-field">
        <label>סיסמה</label>
        <input type="password" id="loginPassword" placeholder="הזן סיסמה"
               onkeypress="if(event.key==='Enter')checkPassword()">
    </div>
    <button class="btn btn-primary btn-block" onclick="checkPassword()">כניסה</button>
    <div id="loginError" class="login-error"></div>
</div>

<!-- Login Step 2: Personal ID -->
<div id="loginStep2" class="hidden">
    <div class="login-field">
        <label>מספר אישי</label>
        <input type="text" id="loginPersonalId" placeholder="הזן מספר אישי"
               inputmode="numeric" onkeypress="if(event.key==='Enter')doLoginByPersonalId()">
    </div>
    <div id="loginSoldierPreview" class="hidden">
        <!-- Shows soldier name + role after ID match -->
    </div>
    <button class="btn btn-primary btn-block" onclick="doLoginByPersonalId()">המשך</button>
    <div id="loginStep2Error" class="login-error"></div>
    <button class="btn btn-link" onclick="showManualLogin()">כניסה ידנית (ללא מ.א)</button>
</div>

<!-- Login Step 3: Manual fallback (for admin/lishka without soldier record) -->
<div id="loginStep3" class="hidden">
    <div class="login-field">
        <label>שם מלא</label>
        <input type="text" id="loginName" placeholder="שם מלא">
    </div>
    <div class="login-field">
        <label>מסגרת</label>
        <select id="loginUnit">
            <option value="">בחר מסגרת</option>
            <!-- company options -->
        </select>
    </div>
    <button class="btn btn-primary btn-block" onclick="doManualLogin()">כניסה</button>
    <div id="loginStep3Error" class="login-error"></div>
</div>
```

**Step 2: Implement new login functions in app.js**

Replace `doLogin()` with:

```javascript
function checkPassword() {
    const password = document.getElementById('loginPassword').value;
    if (password !== '1875') {
        document.getElementById('loginError').textContent = 'סיסמה שגויה';
        document.getElementById('loginError').classList.add('show');
        return;
    }
    document.getElementById('loginStep1').classList.add('hidden');
    document.getElementById('loginStep2').classList.remove('hidden');
    document.getElementById('loginPersonalId').focus();
}

function doLoginByPersonalId() {
    const pid = document.getElementById('loginPersonalId').value.trim();
    if (!pid) {
        document.getElementById('loginStep2Error').textContent = 'יש להזין מספר אישי';
        document.getElementById('loginStep2Error').classList.add('show');
        return;
    }

    const soldier = state.soldiers.find(s => s.personalId === pid);
    if (!soldier) {
        document.getElementById('loginStep2Error').textContent = 'מספר אישי לא נמצא במערכת';
        document.getElementById('loginStep2Error').classList.add('show');
        return;
    }

    // Build currentUser from soldier data
    let effectiveUnit = soldier.company;
    if (soldier.company === 'palsam') effectiveUnit = soldier.company; // keep palsam as-is
    if (FULL_ACCESS_NAMES.some(n => soldier.name.includes(n))) effectiveUnit = 'gdudi';

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

function showManualLogin() {
    document.getElementById('loginStep2').classList.add('hidden');
    document.getElementById('loginStep3').classList.remove('hidden');
}

function doManualLogin() {
    const name = document.getElementById('loginName').value.trim();
    const unit = document.getElementById('loginUnit').value;
    if (!name || !unit) {
        document.getElementById('loginStep3Error').textContent = 'יש להזין שם ומסגרת';
        document.getElementById('loginStep3Error').classList.add('show');
        return;
    }

    let effectiveUnit = unit;
    if (name === settings.adminName || unit === 'gdudi' || unit === 'hq') effectiveUnit = 'gdudi';
    if (FULL_ACCESS_NAMES.some(n => name.includes(n))) effectiveUnit = 'gdudi';

    currentUser = { name, unit: effectiveUnit, personalId: '', company: unit, role: '' };
    sessionStorage.setItem(CONFIG.storagePrefix + 'User', JSON.stringify(currentUser));
    detectUserRole();
    activateApp();
}
```

**Step 3: Test login flow in browser**

- Enter wrong password → error message
- Enter 1875 → moves to personal ID step
- Enter valid personal ID → logs in with correct role
- Click manual login → fallback form works

**Step 4: Commit**

```bash
git add app.js index.html
git commit -m "feat: two-step login — password 1875 then personal ID"
```

---

### Task 3: Update applyUnitFilter for 7 Permission Levels

**Files:**
- Modify: `app.js:453-488` (applyUnitFilter)

**Step 1: Rewrite applyUnitFilter**

Replace current function with level-based logic:

```javascript
function applyUnitFilter() {
    const level = getUserPermissionLevel();
    const unit = currentUser.unit;
    const company = currentUser.company;

    // Soldier view: minimal sidebar
    if (level === PERM.SOLDIER) {
        // Hide all company tabs, show only personal-relevant items
        document.querySelectorAll('.sidebar-item').forEach(el => el.style.display = 'none');
        // Show: my company (read-only), calendar, announcements
        document.querySelectorAll(`.sidebar-item.tab-${company}`).forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-calendar').forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-reports').forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');
        return;
    }

    // Full access (level 7): show everything
    if (level >= PERM.FULL_ACCESS) {
        document.querySelectorAll('.sidebar-item').forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-settings').forEach(el =>
            el.style.display = isAdmin() ? '' : 'none');
        return;
    }

    // Company commander (level 5): sees all companies
    if (level >= PERM.COMPANY_CMD) {
        document.querySelectorAll('.sidebar-item').forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = 'none');
        return;
    }

    // Palsam (level 6): sees all
    if (level === PERM.PALSAM) {
        document.querySelectorAll('.sidebar-item').forEach(el => el.style.display = '');
        document.querySelectorAll('.sidebar-item.tab-settings').forEach(el => el.style.display = 'none');
        return;
    }

    // Levels 2-4 (מ"כ/סמל/קצין): own company + cross-unit tabs
    document.querySelectorAll('.sidebar-item').forEach(el => el.style.display = 'none');
    document.querySelectorAll(`.sidebar-item.tab-${company}`).forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-all').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-calendar').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-reports').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-rotation').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-equipment').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-training').forEach(el => el.style.display = '');
    document.querySelectorAll('.sidebar-item.tab-commander').forEach(el =>
        el.style.display = CONFIG.combatCompanies.includes(company) ? '' : 'none');

    // Hide section labels if all items hidden
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
```

**Step 2: Test with different roles**

Log in as soldier → minimal sidebar. Log in as מ"כ → company sidebar. Log in as admin → full sidebar.

**Step 3: Commit**

```bash
git add app.js
git commit -m "feat: level-based sidebar filtering for 7 permission levels"
```

---

### Task 4: Soldier View — Clean Personal Dashboard

**Files:**
- Modify: `app.js` (activateSoldierView function)
- Modify: `index.html` (add soldier dashboard tab content)
- Modify: `style.css` (soldier dashboard styling)

**Step 1: Create soldier dashboard HTML in index.html**

Add a new tab content div for soldier personal view:

```html
<div id="tab-soldier-dashboard" class="tab-content">
    <div class="soldier-dashboard">
        <div class="soldier-welcome" id="soldierWelcome"></div>
        <div class="soldier-sections">
            <div class="soldier-section" id="soldierShiftsSection">
                <h3>המשמרות שלי</h3>
                <div id="soldierMyShifts"></div>
            </div>
            <div class="soldier-section" id="soldierEquipmentSection">
                <h3>הציוד שלי</h3>
                <div id="soldierMyEquipment"></div>
            </div>
            <div class="soldier-section" id="soldierCompanyShifts">
                <h3>משמרות הפלוגה</h3>
                <div id="soldierCompanyShiftsList"></div>
            </div>
        </div>
    </div>
</div>
```

**Step 2: Add soldier dashboard CSS in style.css**

```css
.soldier-dashboard { padding: 16px; max-width: 600px; margin: 0 auto; }
.soldier-welcome { background: var(--card-bg); border-radius: 12px; padding: 20px; margin-bottom: 16px; text-align: center; }
.soldier-welcome h2 { margin: 0 0 4px; font-size: 1.3em; }
.soldier-welcome .role-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; background: var(--primary); color: #fff; font-size: 0.85em; margin-top: 8px; }
.soldier-section { background: var(--card-bg); border-radius: 12px; padding: 16px; margin-bottom: 12px; }
.soldier-section h3 { margin: 0 0 12px; font-size: 1.1em; border-bottom: 2px solid var(--primary); padding-bottom: 8px; }
.soldier-shift-card { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-radius: 8px; background: var(--bg-secondary); margin-bottom: 8px; }
.soldier-equip-item { display: flex; justify-content: space-between; padding: 8px 10px; border-bottom: 1px solid var(--border); }
.soldier-equip-item:last-child { border-bottom: none; }
```

**Step 3: Implement renderSoldierDashboard() in app.js**

```javascript
function renderSoldierDashboard() {
    if (!currentUser || !currentUser.soldierId) return;
    const soldier = state.soldiers.find(s => s.id === currentUser.soldierId);
    if (!soldier) return;

    // Welcome card
    document.getElementById('soldierWelcome').innerHTML = `
        <h2>שלום, ${soldier.name}</h2>
        <div>${companyData[soldier.company]?.name || soldier.company}</div>
        ${soldier.role ? `<span class="role-badge">${soldier.role}</span>` : ''}
    `;

    // My shifts (upcoming)
    const myShifts = state.shifts
        .filter(sh => sh.soldiers?.includes(currentUser.soldierId) && sh.date >= new Date().toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 10);

    document.getElementById('soldierMyShifts').innerHTML = myShifts.length ?
        myShifts.map(sh => `
            <div class="soldier-shift-card">
                <div><strong>${sh.task || sh.name}</strong></div>
                <div>${sh.date}</div>
            </div>
        `).join('') : '<div class="empty-state">אין משמרות קרובות</div>';

    // My equipment
    const myEquip = state.personalEquipment?.[currentUser.soldierId];
    const equipEl = document.getElementById('soldierMyEquipment');
    if (myEquip && myEquip.items) {
        equipEl.innerHTML = myEquip.items
            .filter(item => item.signed)
            .map(item => `
                <div class="soldier-equip-item">
                    <span>${item.name}</span>
                    <span>${item.serial || ''}</span>
                </div>
            `).join('') || '<div class="empty-state">אין ציוד רשום</div>';
    } else {
        equipEl.innerHTML = '<div class="empty-state">אין ציוד רשום</div>';
    }

    // Company shifts (read-only)
    const compShifts = state.shifts
        .filter(sh => sh.company === soldier.company && sh.date >= new Date().toISOString().slice(0, 10))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 15);

    document.getElementById('soldierCompanyShiftsList').innerHTML = compShifts.length ?
        compShifts.map(sh => `
            <div class="soldier-shift-card">
                <div><strong>${sh.task || sh.name}</strong></div>
                <div>${sh.date}</div>
                <div>${(sh.soldiers || []).length} חיילים</div>
            </div>
        `).join('') : '<div class="empty-state">אין משמרות קרובות</div>';
}
```

**Step 4: Update activateSoldierView() to use new dashboard**

```javascript
function activateSoldierView() {
    // Show soldier dashboard instead of hiding everything
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
    document.getElementById('tab-soldier-dashboard').classList.add('active');
    renderSoldierDashboard();
}
```

**Step 5: Test soldier view in browser**

Login as regular soldier → see clean dashboard with shifts, equipment, company info.

**Step 6: Commit**

```bash
git add app.js index.html style.css
git commit -m "feat: soldier personal dashboard with shifts and equipment"
```

---

### Task 5: Constraint Logging to Announcements

**Files:**
- Modify: `app.js` (constraint add function)

**Step 1: Find and modify the constraint creation function**

When a מ"כ/סמל adds a constraint, auto-create an announcement:

```javascript
// Inside the function that saves a new constraint (after saving to state.constraints):
if (getUserPermissionLevel() <= PERM.OFFICER) {
    // Auto-log to announcements when non-officer adds constraint
    const soldier = state.soldiers.find(s => s.id === constraint.soldierId);
    const announcement = {
        id: 'ann_' + Date.now(),
        title: `אילוץ חדש - ${soldier?.name || 'חייל'}`,
        body: `${currentUser.name} הוסיף אילוץ ל${soldier?.name}: ${constraint.reason} (${constraint.startDate} - ${constraint.endDate})`,
        priority: 'normal',
        author: currentUser.name,
        timestamp: new Date().toISOString(),
        company: currentUser.unit,
        autoGenerated: true
    };
    if (!state.announcements) state.announcements = [];
    state.announcements.unshift(announcement);
    saveState();
}
```

**Step 2: Commit**

```bash
git add app.js
git commit -m "feat: auto-log constraints by מכ/סמל to company announcements"
```

---

### Task 6: Wire Up Edit Buttons with Permission Checks

**Files:**
- Modify: `app.js` (all places that show edit/delete buttons)

**Step 1: Update renderCompanyTab to use new permission functions**

Find all places in `renderCompanyTab` and other render functions where edit buttons are shown and replace:
- `canEdit(compKey)` for soldier details → `canEditSoldierDetails(compKey)`
- `canEditShifts(compKey)` stays as-is (already correct)
- `canSignEquipment()` → `canSignEquipment(compKey)` (now takes company param)
- Constraint buttons: add `canEditConstraints(compKey)` check
- Task editing: add `canEditTasks(compKey)` check

**Step 2: Audit all `canEdit()` calls**

Search for every `canEdit(` call in app.js and verify each one uses the right new function:
- Editing soldier name/details → `canEditSoldierDetails()`
- Editing shifts → `canEditShifts()`
- Editing tasks/missions → `canEditTasks()`
- Signing equipment → `canSignEquipment()`
- Adding constraints → `canEditConstraints()`

**Step 3: Test each permission level**

Manual test: login as each role level and verify buttons appear/disappear correctly.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: granular permission checks on all edit operations"
```

---

### Task 7: Update Palsam Permissions

**Files:**
- Modify: `app.js` (palsam-specific logic)

**Step 1: Fix palsam login flow**

In `doLoginByPersonalId`, palsam soldiers should NOT get elevated to 'gdudi'. They stay as 'palsam' unit:

```javascript
// Remove the old: if (unit === 'palsam') effectiveUnit = 'gdudi';
// Palsam keeps their own unit, permissions handled by level system
```

**Step 2: Verify palsam equipment access**

`canSignEquipment()` already returns true for all palsam. Verify equipment tab renders correctly for palsam users across all companies.

**Step 3: Verify palsam officer task editing**

`isPalsamOfficer()` + `canEditTasks()` should allow palsam officers to edit palsam tasks only.

**Step 4: Commit**

```bash
git add app.js
git commit -m "feat: palsam permission split — soldiers=equipment, officers=tasks+soldiers"
```

---

### Task 8: Update Config & Password

**Files:**
- Modify: `config.js` (remove old password, add new constant)
- Modify: `app.js` (DEFAULT_SETTINGS)

**Step 1: Set hardcoded password**

In config.js or app.js CONFIG:
```javascript
password: '1875',
```

Remove password from settings UI (it's no longer configurable).

**Step 2: Commit**

```bash
git add config.js app.js
git commit -m "feat: hardcode password 1875, remove password from settings"
```

---

### Task 9: Final Testing & Cleanup

**Step 1: Test all 7 levels end-to-end**

| Level | Login as | Expected |
|-------|----------|----------|
| 1 | Regular soldier (no role) | See dashboard, shifts, own equipment |
| 2 | מ"כ soldier | Edit shifts in own company |
| 3 | סמל soldier | Sign equipment + add constraints (logged) |
| 4 | קצין | Full edit of own company |
| 5 | מ"פ/סמ"פ | See all companies, edit own |
| 6a | Palsam soldier | Equipment everywhere, no task edit |
| 6b | Palsam officer | Equipment everywhere + palsam tasks/soldiers |
| 7 | Admin/Lishka/Nissim | Full access |

**Step 2: Fix any issues found**

**Step 3: Update CLAUDE.md with new permission docs**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete 7-level permission system"
```
