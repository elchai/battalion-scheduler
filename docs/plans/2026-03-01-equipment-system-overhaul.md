# Equipment System Overhaul Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix critical equipment bugs (serial duplicates, Firestore race condition), simplify categories to 5, add issuer tracking, redesign login with role-holder identification by מ.א, streamline signing flow, and fix PDF output.

**Architecture:** Vanilla JS PWA with Firebase Firestore sync. Single app.js (~8164 lines) + index.html + style.css. Changes span categories, login, signing flow, PDF generation, and equipment sets.

**Tech Stack:** Vanilla JS, Firebase Firestore, html2pdf.js, Lucide icons

---

### Task 1: Simplify Categories to 5

**Files:**
- Modify: `app.js:130-137` (CATEGORY_GROUPS)
- Modify: `app.js:14-56` (DEFAULT_SETTINGS categories)
- Modify: `app.js:585-595` (detectCategoryFromType)
- Modify: `app.js:6803-6861` (renderEquipmentSetsSettings - category dropdown)

**Step 1: Update CATEGORY_GROUPS constant** (app.js line 130-137)

Replace with:
```js
const EQUIPMENT_CATEGORIES = ['נשק', 'אופטיקה', 'קשר', 'לוגיסטיקה', 'אחר'];
const CATEGORY_GROUPS = {
    'נשק': ['נשק'],
    'אופטיקה': ['אופטיקה', 'תצפית'],
    'קשר': ['קשר'],
    'לוגיסטיקה': ['לוגיסטיקה', 'מגן', 'רפואי', 'שטח', 'תחמושת', 'טנ"א', 'אחר'],
    'אחר': ['אחר']
};
```

Note: CATEGORY_GROUPS maps NEW group names to OLD category values for backward compat.

**Step 2: Update DEFAULT_SETTINGS baseSet categories** (app.js lines 14-42)

Change all `category` values:
- `'תצפית'` → `'אופטיקה'` (כוונת טריג'יקון, כוונת לילה אקילה, ליונט, אול"ר)
- `'מגן'` → `'לוגיסטיקה'` (אפוד קרב, קסדה, כיסוי קסדה, מצנפת, ברכיות)
- `'תחמושת'` → `'לוגיסטיקה'` (מחסניות M16)
- `'רפואי'` → `'לוגיסטיקה'` (תחבושת, חוסם עורקים)
- `'שטח'` → `'לוגיסטיקה'` (מצפן in commander set)

Also in roleSets:
- משקפת שדה: `'תצפית'` → `'אופטיקה'`
- מצפן: `'שטח'` → `'לוגיסטיקה'`

**Step 3: Update detectCategoryFromType()** (app.js:585-595)

Replace with:
```js
function detectCategoryFromType(type) {
    if (!type) return 'אחר';
    if (['נשק','M16','M4','MAG','נגב','רובה'].some(t => type.includes(t))) return 'נשק';
    if (['כוונת','משקפת','ליונט','אול"ר','תצפית','אקילה','טריגיקון','מפרולייט'].some(t => type.includes(t))) return 'אופטיקה';
    if (['קשר','624','עכבר','מדונה','סוללה','מע"ד','אמר"ל'].some(t => type.includes(t))) return 'קשר';
    return 'לוגיסטיקה';
}
```

**Step 4: Update category dropdown in renderEquipmentSetsSettings()** (app.js ~line 6825)

Change the categories array from `['מגן','נשק','קשר','רפואי','שטח','תחמושת','תצפית','טנ"א','אחר']` to `EQUIPMENT_CATEGORIES`.

**Step 5: Add category migration in loadState()**

After loading `state.equipment`, migrate old categories:
```js
const CAT_MIGRATION = { 'תצפית':'אופטיקה', 'מגן':'לוגיסטיקה', 'רפואי':'לוגיסטיקה', 'שטח':'לוגיסטיקה', 'תחמושת':'לוגיסטיקה', 'טנ"א':'לוגיסטיקה' };
state.equipment.forEach(e => { if (CAT_MIGRATION[e.category]) e.category = CAT_MIGRATION[e.category]; });
```

**Step 6: Update export filter modal categories**

Find `openExportFilter()` and update the category checkboxes to use `EQUIPMENT_CATEGORIES`.

**Step 7: Bump migration version to v21 in migrateEquipmentSets()**

Update `_baseSetVer` check from `< 20` to `< 21` to force-reset baseSet with new categories.

**Step 8: Commit**
```
git add app.js && git commit -m "feat: simplify equipment categories to 5 (נשק, אופטיקה, קשר, לוגיסטיקה, אחר)"
```

---

### Task 2: Update BaseSet + Add אמר"ל עכבר

**Files:**
- Modify: `app.js:14-56` (DEFAULT_SETTINGS)

**Step 1: Add אמר"ל עכבר to baseSet items**

After מכשיר קשר 624 (line 25), add:
```js
{ name: 'אמר"ל עכבר', quantity: 1, category: 'קשר', requiresSerial: true, serialNumber: '993960' },
```

**Step 2: Move כוונת מפרולייט from baseSet to commanderSet**

Remove line 20 (`כוונת השלכה מפרולייט`) from baseSet.items.
Add to roleSets[0].items:
```js
{ name: 'כוונת השלכה מפרולייט', quantity: 1, category: 'אופטיקה', requiresSerial: true, serialNumber: '993518' },
```

**Step 3: Verify final baseSet** should have these serial items:
1. נשק (991247)
2. כוונת טריג'יקון (994082)
3. כוונת לילה אקילה (992674)
4. ליונט (995831)
5. אול"ר (990456)
6. מכשיר קשר 624 (997319)
7. אמר"ל עכבר (993960)

And commanderSet should have:
1. כוונת השלכה מפרולייט (993518)
2. משקפת שדה (998142)
3. מצפן (996705)

**Step 4: Commit**
```
git add app.js && git commit -m "feat: add אמר"ל עכבר to baseSet, move מפרולייט to commanderSet"
```

---

### Task 3: Serial Number Duplicate Prevention

**Files:**
- Modify: `app.js:4952-5061` (confirmSignEquipment)

**Step 1: Add serial duplicate validation before assignment**

After `const allEquip = [];` and the forEach that populates it (line 5013), add:
```js
// Validate no serial duplicates
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
    return;
}
```

**Step 2: Commit**
```
git add app.js && git commit -m "fix: prevent assigning same serial number to multiple soldiers"
```

---

### Task 4: Login Screen with Role Holders + מ.א Identification

**Files:**
- Modify: `index.html:18-54` (login screen HTML)
- Modify: `app.js:139-153` (detectUserRole)
- Modify: `app.js:174-200` (doLogin)
- Modify: `app.js:427-439` (checkSession)

**Step 1: Update login HTML** (index.html lines 18-54)

Replace login-box content with:
```html
<div class="login-screen" id="loginScreen">
    <div class="login-box">
        <img src="logo.png" alt="גדוד יהודה" style="width:100px;height:100px;border-radius:50%;margin-bottom:16px;box-shadow:0 4px 15px rgba(0,0,0,0.2);">
        <h2>מערכת ניהול גדודי</h2>
        <div class="subtitle">תעסוקה מבצעית - כניסה למערכת</div>

        <!-- Role holders quick-select -->
        <div id="roleHoldersList" style="margin:16px 0;max-height:180px;overflow-y:auto;"></div>

        <div class="login-field">
            <label>מספר אישי (מ.א)</label>
            <input type="text" id="loginPersonalId" placeholder="הזן מ.א לזיהוי מהיר" autocomplete="off" oninput="autoIdentifyByPersonalId()">
        </div>
        <div class="login-field">
            <label>שם מלא</label>
            <input type="text" id="loginName" placeholder="הכנס את שמך" autocomplete="off">
        </div>
        <div class="login-field">
            <label>מסגרת</label>
            <select id="loginUnit">
                <option value="">-- בחר מסגרת --</option>
                <option value="a">פלוגה א (עתודה)</option>
                <option value="b">פלוגה ב (מבוא חורון)</option>
                <option value="c">פלוגה ג (חשמונאים)</option>
                <option value="d">פלוגה ד (443)</option>
                <option value="hq">חפ"ק מג"ד/סמג"ד</option>
                <option value="palsam">פלס"ם</option>
                <option value="gdudi">גדודי</option>
            </select>
        </div>
        <div class="login-field">
            <label>סיסמה</label>
            <input type="password" id="loginPassword" placeholder="הכנס סיסמה" autocomplete="new-password">
        </div>
        <button class="login-btn" onclick="doLogin()">כניסה למערכת</button>
        <div class="login-error" id="loginError">סיסמה שגויה, נסה שוב</div>
    </div>
    <div class="login-footer">
        מערכת מאובטחת - גישה מורשית בלבד<br>
        <a href="https://wa.me/972542012000" target="_blank" style="color:rgba(255,255,255,0.7);text-decoration:none;margin-top:6px;display:inline-block;">
            נבנה ע"י אלחי פיין | 054-2012000
        </a>
    </div>
</div>
```

**Step 2: Add renderRoleHolders() and autoIdentifyByPersonalId() functions** (app.js, after doLogin)

```js
function renderRoleHolders() {
    const container = document.getElementById('roleHoldersList');
    if (!container || !state.soldiers.length) return;
    const roleHolders = state.soldiers.filter(s => s.role && SIGNING_ROLES.includes(s.role));
    if (roleHolders.length === 0) return;
    container.innerHTML = `<div style="font-size:0.8em;color:rgba(255,255,255,0.7);margin-bottom:6px;text-align:center;">בעלי תפקידים - לחץ לבחירה מהירה</div>` +
        roleHolders.map(s => `
            <div class="role-holder-card" onclick="selectRoleHolder('${s.id}')" style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;margin:4px 0;background:rgba(255,255,255,0.1);border-radius:8px;cursor:pointer;color:white;font-size:0.85em;transition:background 0.2s;">
                <span style="font-weight:600;">${esc(s.name)}</span>
                <span style="opacity:0.7;">${esc(s.role || '')}</span>
                <span style="opacity:0.5;font-family:monospace;direction:ltr;">${esc(s.personalId || '')}</span>
            </div>
        `).join('');
}

function selectRoleHolder(soldierId) {
    const sol = state.soldiers.find(s => s.id === soldierId);
    if (!sol) return;
    document.getElementById('loginName').value = sol.name;
    document.getElementById('loginPersonalId').value = sol.personalId || '';
    // Auto-select unit
    if (sol.company) document.getElementById('loginUnit').value = sol.company;
    document.getElementById('loginPassword').focus();
}

function autoIdentifyByPersonalId() {
    const pid = document.getElementById('loginPersonalId').value.trim();
    if (pid.length < 5) return;
    const sol = state.soldiers.find(s => s.personalId === pid);
    if (sol) {
        document.getElementById('loginName').value = sol.name;
        if (sol.company) document.getElementById('loginUnit').value = sol.company;
        document.getElementById('loginPassword').focus();
    }
}
```

**Step 3: Update doLogin()** (app.js:174-200)

Add `personalId` to currentUser and sessionStorage:
```js
function doLogin() {
    const name = document.getElementById('loginName').value.trim();
    const unit = document.getElementById('loginUnit').value;
    const password = document.getElementById('loginPassword').value;
    const personalId = document.getElementById('loginPersonalId').value.trim();

    if (!name || !unit) {
        document.getElementById('loginError').textContent = 'נא למלא שם ומסגרת';
        document.getElementById('loginError').style.display = 'block';
        return;
    }
    if (password !== settings.password) {
        document.getElementById('loginError').textContent = 'סיסמה שגויה, נסה שוב';
        document.getElementById('loginError').style.display = 'block';
        return;
    }
    document.getElementById('loginError').style.display = 'none';
    currentUser = { name, unit, personalId };
    sessionStorage.setItem('battalionUser', JSON.stringify(currentUser));
    activateApp();
}
```

**Step 4: Update checkSession()** (app.js:427-439)

Ensure `personalId` is preserved from session:
```js
function checkSession() {
    const saved = sessionStorage.getItem('battalionUser');
    if (saved) {
        try {
            currentUser = JSON.parse(saved);
            activateApp();
        } catch(e) {}
    }
}
```

**Step 5: Call renderRoleHolders() after soldiers are loaded**

In `init()`, after Google Sheets sync resolves (or in `renderAll()`), add:
```js
renderRoleHolders();
```

Also call it in `checkSession()` flow — specifically, after `loadState()` in `init()`, call `renderRoleHolders()`.

**Step 6: Add CSS for role-holder-card hover** (style.css)

```css
.role-holder-card:hover { background: rgba(255,255,255,0.25) !important; }
```

**Step 7: Commit**
```
git add app.js index.html style.css && git commit -m "feat: login with role holders list + מ.א identification"
```

---

### Task 5: Issuer Tracking on All Equipment Operations

**Files:**
- Modify: `app.js:4952-5061` (confirmSignEquipment - already has partial issuer)
- Modify: `app.js` return equipment function
- Modify: `app.js` transfer equipment function

**Step 1: Verify confirmSignEquipment() issuer fields**

Lines 5045-5047 already save:
```js
issuedBy: currentUser.name || '',
issuerUnit: currentUser.unit || '',
issuerRole: currentUser.role || ''
```

Add `issuerPersonalId`:
```js
issuerPersonalId: currentUser.personalId || '',
```

**Step 2: Update equipment item to store issuer**

In the `allEquip.forEach(eq => {` block (line 5018-5024), add:
```js
eq.issuerId = currentUser.personalId || '';
eq.issuerName = currentUser.name || '';
```

**Step 3: Find and update return equipment function**

Find `confirmReturnEquipment()` and add issuer fields to the log entry:
```js
issuedBy: currentUser.name || '',
issuerUnit: currentUser.unit || '',
issuerRole: currentUser.role || '',
issuerPersonalId: currentUser.personalId || '',
```

**Step 4: Update transfer equipment function**

Find `confirmTransferEquipment()` and add issuer fields to both log entries.

**Step 5: Commit**
```
git add app.js && git commit -m "feat: track issuer (מנפיק) on all equipment operations"
```

---

### Task 6: Redesign Signing Flow - Fast 3-Step Process

**Files:**
- Modify: `app.js:4745-4804` (openSignEquipment)
- Modify: `index.html` (signEquipmentModal)

**Step 1: Update openSignEquipment() to show sets with optional מפרולייט**

Replace the equipment list generation to be set-based:
1. "סט ציוד ללוחם" - checkbox (checked by default), shows all baseSet items
2. "סט מפקד" - checkbox (shown for commanders, checked by default; hidden for regular soldiers)
3. "כוונת מפרולייט (אופציונלי)" - separate checkbox (unchecked for soldiers, checked for commanders since it's in their set). If checked → show serial input field.

```js
function openSignEquipment() {
    const container = document.getElementById('signEquipCheckboxList');
    const es = settings.equipmentSets || { baseSet: { items: [] }, roleSets: [] };
    const baseItems = (es.baseSet?.items) || [];
    const cmdSet = (es.roleSets || []).find(rs => rs.id === 'rs_commander');
    const cmdItems = cmdSet?.items || [];

    let html = '';

    // Section 1: סט ציוד ללוחם (always shown, checked by default)
    html += `<div class="sign-group-header" style="display:flex;align-items:center;gap:8px;">
        <input type="checkbox" id="signBaseSetToggle" checked onchange="toggleSignSet('baseset', this.checked)">
        <label for="signBaseSetToggle" style="font-weight:700;cursor:pointer;">סט ציוד ללוחם (${baseItems.length} פריטים)</label>
    </div>`;
    html += `<div id="signBaseSetItems">`;
    html += baseItems.map((item, i) => `
        <label class="sign-equip-checkbox-item sign-equip-row" data-search="${esc(item.name)} ${item.category}" data-set="baseset">
            <input type="checkbox" value="bs_${i}" data-src="baseset" data-name="${esc(item.name)}" data-qty="${item.quantity}" data-category="${esc(item.category)}" data-serial-req="${item.requiresSerial}" checked onchange="updateSignEquipSelection()">
            <span class="sign-equip-name">${esc(item.name)}</span>
            ${item.requiresSerial ? `<input type="text" class="sign-bs-serial" data-bs-idx="${i}" value="${item.serialNumber||''}" placeholder="מס' צ'" onclick="event.stopPropagation()" style="width:100px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:0.82em;text-align:center;direction:ltr;">` : '<span class="sign-equip-serial" style="color:var(--text-light);font-size:0.78em;">—</span>'}
            <span class="sign-equip-qty">x${item.quantity}</span>
        </label>
    `).join('');
    html += `</div>`;

    // Section 2: סט מפקד (shown for commanders or as optional add-on)
    if (cmdItems.length > 0) {
        html += `<div class="sign-group-header" style="display:flex;align-items:center;gap:8px;margin-top:12px;">
            <input type="checkbox" id="signCmdSetToggle" onchange="toggleSignSet('cmdset', this.checked)">
            <label for="signCmdSetToggle" style="font-weight:700;cursor:pointer;">סט מפקד (${cmdItems.length} פריטים נוספים)</label>
        </div>`;
        html += `<div id="signCmdSetItems" style="display:none;">`;
        html += cmdItems.map((item, i) => `
            <label class="sign-equip-checkbox-item sign-equip-row" data-search="${esc(item.name)} ${item.category}" data-set="cmdset">
                <input type="checkbox" value="cmd_${i}" data-src="cmdset" data-name="${esc(item.name)}" data-qty="${item.quantity}" data-category="${esc(item.category)}" data-serial-req="${item.requiresSerial}" onchange="updateSignEquipSelection()">
                <span class="sign-equip-name">${esc(item.name)}</span>
                ${item.requiresSerial ? `<input type="text" class="sign-cmd-serial" data-cmd-idx="${i}" value="${item.serialNumber||''}" placeholder="מס' צ'" onclick="event.stopPropagation()" style="width:100px;padding:4px 8px;border:1px solid var(--border);border-radius:4px;font-size:0.82em;text-align:center;direction:ltr;">` : '<span class="sign-equip-serial" style="color:var(--text-light);font-size:0.78em;">—</span>'}
                <span class="sign-equip-qty">x${item.quantity}</span>
            </label>
        `).join('');
        html += `</div>`;
    }

    // Section 3: Existing tracked equipment in inventory
    const availableEquip = state.equipment.filter(e => !e.holderId && e.condition !== 'תקול');
    if (availableEquip.length > 0) {
        html += `<div class="sign-group-header" style="margin-top:12px;">ציוד קיים במלאי (${availableEquip.length})</div>`;
        html += availableEquip.map(e => `
            <label class="sign-equip-checkbox-item sign-equip-row" data-search="${esc(e.type)} ${esc(e.serial)}">
                <input type="checkbox" value="${e.id}" data-src="equip" onchange="updateSignEquipSelection()">
                <span class="sign-equip-name">${esc(e.type)}</span>
                <span class="sign-equip-serial">${esc(e.serial)}</span>
                <span class="sign-equip-qty">x${e.defaultQty || 1}</span>
            </label>
        `).join('');
    }

    container.innerHTML = html || '<div style="padding:12px;color:var(--text-light);text-align:center;">אין פריטי ציוד</div>';

    // ... rest of function (soldier selection, company filter, canvas setup) stays the same
}
```

**Step 2: Add toggleSignSet() function**

```js
function toggleSignSet(setType, checked) {
    const container = setType === 'cmdset' ? document.getElementById('signCmdSetItems') : document.getElementById('signBaseSetItems');
    if (!container) return;
    container.style.display = checked ? '' : 'none';
    container.querySelectorAll('input[type="checkbox"]').forEach(cb => { cb.checked = checked; });
    updateSignEquipSelection();
}
```

**Step 3: Auto-check commander set when commander selected**

In `updateSignSoldiers()` or the soldier select onChange, detect if selected soldier is commander:
```js
function onSignSoldierChange() {
    const soldierId = document.getElementById('signSoldier').value;
    const sol = state.soldiers.find(s => s.id === soldierId);
    const cmdToggle = document.getElementById('signCmdSetToggle');
    if (cmdToggle && sol) {
        const isCommander = sol.role && SIGNING_ROLES.includes(sol.role);
        cmdToggle.checked = isCommander;
        toggleSignSet('cmdset', isCommander);
    }
}
```

**Step 4: Update confirmSignEquipment() to handle cmdset items**

In the `selectedItems.forEach(item => {` block, add handling for `item.src === 'cmdset'`:
```js
} else if (item.src === 'cmdset') {
    const cmdSet = (settings.equipmentSets.roleSets || []).find(rs => rs.id === 'rs_commander');
    const cmdItems = cmdSet?.items || [];
    const idx = parseInt(item.id.replace('cmd_', ''));
    const templateItem = cmdItems[idx];
    if (templateItem) {
        const serialInput = document.querySelector(`.sign-cmd-serial[data-cmd-idx="${idx}"]`);
        const newEq = {
            id: 'eq_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
            type: templateItem.name,
            serial: serialInput ? serialInput.value.trim() : '',
            company: sol.company,
            condition: 'תקין',
            category: templateItem.category,
            holderId: null, holderName: '', holderPhone: '',
            assignedDate: null, signatureImg: null,
            notes: '', defaultQty: templateItem.quantity
        };
        state.equipment.push(newEq);
        allEquip.push(newEq);
    }
}
```

**Step 5: Update getSelectedSignEquipItems()**

Find this function and ensure it handles `data-src="cmdset"` items the same way as baseset items.

**Step 6: Commit**
```
git add app.js && git commit -m "feat: fast signing flow with set toggles + commander set auto-detection"
```

---

### Task 7: Fix PDF Output

**Files:**
- Modify: `app.js:5448-5535` (generateSignaturePDF)
- Modify: `app.js:5537-5578` (generateReturnPDF)

**Step 1: Add issuer מ.א to PDFs**

In `generateSignaturePDF()`, update the issuer section (line 5509-5514):
```js
${logEntry.issuedBy ? `
<div style="display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid #d0d7de;border-radius:8px;overflow:hidden;margin-bottom:20px;">
    <div style="padding:9px 14px;background:#E8EAF6;font-weight:700;border-bottom:1px solid #d0d7de;">מנפיק</div>
    <div style="padding:9px 14px;border-bottom:1px solid #d0d7de;border-right:1px solid #d0d7de;">${logEntry.issuedBy}</div>
    <div style="padding:9px 14px;background:#E8EAF6;font-weight:700;border-bottom:1px solid #d0d7de;">תפקיד</div>
    <div style="padding:9px 14px;border-bottom:1px solid #d0d7de;border-right:1px solid #d0d7de;">${logEntry.issuerRole || '-'}</div>
    <div style="padding:9px 14px;background:#E8EAF6;font-weight:700;">מ.א</div>
    <div style="padding:9px 14px;border-right:1px solid #d0d7de;direction:ltr;font-family:monospace;">${logEntry.issuerPersonalId || '-'}</div>
</div>` : ''}
```

Similarly update `generateReturnPDF()`.

**Step 2: Ensure html2pdf container is hidden during rendering**

In `downloadPDF()` (line 5580), ensure the wrapper element uses `position:fixed; left:-9999px;` instead of being visible during capture.

**Step 3: Commit**
```
git add app.js && git commit -m "fix: PDF layout + add issuer מ.א field"
```

---

### Task 8: Bump SW Cache + Final Commit

**Files:**
- Modify: `sw.js:1`

**Step 1: Bump cache version**
```js
const CACHE_NAME = 'battalion-v39';
```

**Step 2: Final commit and push**
```
git add sw.js && git commit -m "chore: bump SW cache to v39"
git push
```

---

## Verification

1. **Categories** → הגדרות → dropdown קטגוריה → רק 5 (נשק, אופטיקה, קשר, לוגיסטיקה, אחר)
2. **BaseSet** → הגדרות → סט ציוד ללוחם → 22 פריטים כולל אמר"ל עכבר, ללא מפרולייט
3. **CommanderSet** → סט מפקד → 3 פריטים כולל מפרולייט + משקפת + מצפן
4. **Serial validation** → ניסיון לחתום אותו צ' לשני חיילים → חסום עם הודעה
5. **Login** → מסך כניסה → רשימת בעלי תפקידים → לחיצה ממלאת שם + מ.א
6. **מ.א** → הזנת מ.א → זיהוי אוטומטי → כניסה
7. **Issuer** → חתימה על ציוד → בלוג: מנפיק + מ.א
8. **Signing flow** → בחירת חייל → סט לוחם מסומן → למפקד: סט מפקד מסומן אוטומטית
9. **PDF** → הורדת PDF → RTL תקין + שדה מנפיק
