// ==================== ENHANCED CONSTRAINTS (אילוצים מתקדמים) ====================
// Extends the existing constraints system with new types:
// - date_block (existing): soldier unavailable on date range
// - no_nights: soldier cannot do night shifts
// - no_pair: two soldiers cannot be in the same shift
// - max_consecutive: max consecutive shifts for a soldier
// - min_rest: minimum hours between shifts

let constraintsSubTab = 'task'; // 'task' | 'personal'

function renderConstraintsTab() {
    const container = document.getElementById('constraintsContent');
    if (!container) return;

    const taskConstraints = (state.constraints || []).filter(c => c.type !== 'no_pair');
    const pairConstraints = (state.constraints || []).filter(c => c.type === 'no_pair');

    container.innerHTML = `
        <div class="con-header">
            <div class="con-title">
                <i data-lucide="shield-alert" style="width:22px;height:22px;"></i>
                <h2>ניהול אילוצים</h2>
                <span class="con-count">${(state.constraints || []).filter(c => c.active !== false).length} חוקים פעילים</span>
            </div>
        </div>
        <div class="con-tabs">
            <button class="con-tab ${constraintsSubTab === 'task' ? 'active' : ''}" onclick="switchConstraintsSubTab('task')">
                <i data-lucide="shield" style="width:14px;height:14px;"></i> חוקי משימות
            </button>
            <button class="con-tab ${constraintsSubTab === 'personal' ? 'active' : ''}" onclick="switchConstraintsSubTab('personal')">
                <i data-lucide="users" style="width:14px;height:14px;"></i> חוקים בין-אישיים
            </button>
        </div>
        <div id="constraintsListContent"></div>
    `;
    refreshIcons();
    renderConstraintsListContent();
}

function switchConstraintsSubTab(tab) {
    constraintsSubTab = tab;
    renderConstraintsTab();
}

function renderConstraintsListContent() {
    const container = document.getElementById('constraintsListContent');
    if (!container) return;

    const constraints = (state.constraints || []).filter(c => {
        if (constraintsSubTab === 'personal') return c.type === 'no_pair';
        return c.type !== 'no_pair';
    });

    if (constraints.length === 0) {
        container.innerHTML = `
        <div class="con-empty">
            <i data-lucide="shield-check" style="width:40px;height:40px;color:var(--text-light);"></i>
            <h4>לא נמצאו חוקים פעילים</h4>
            <p>לחץ על כפתור ה-+ להוספת חוק חדש</p>
        </div>`;
        refreshIcons();
        return;
    }

    const typeLabels = {
        'date_block': '🚫 חסימת תאריכים',
        'no_nights': '🌙 ללא לילות',
        'no_pair': '👥 לא לזווג',
        'max_consecutive': '🔄 מקסימום רצופים',
        'min_rest': '⏰ מנוחה מינימלית'
    };

    container.innerHTML = constraints.map(c => {
        const soldier = (state.soldiers || []).find(s => s.id === c.soldierId);
        const soldierB = c.soldierIdB ? (state.soldiers || []).find(s => s.id === c.soldierIdB) : null;
        const isActive = c.active !== false;
        const type = c.type || 'date_block';
        const label = typeLabels[type] || type;

        let details = '';
        if (type === 'date_block') {
            details = `${c.startDate || ''} — ${c.endDate || ''}`;
            if (c.reason) details += ` (${esc(c.reason)})`;
        } else if (type === 'no_nights') {
            details = c.reason || 'לא למשמרות לילה';
        } else if (type === 'no_pair') {
            details = soldierB ? `לא לזווג עם ${esc(soldierB.name)}` : '';
            if (c.reason) details += ` — ${esc(c.reason)}`;
        } else if (type === 'max_consecutive') {
            details = `מקסימום ${c.maxConsecutive || 2} משמרות רצופות`;
        } else if (type === 'min_rest') {
            details = `מנוחה מינימלית: ${c.restHours || 8} שעות`;
        }

        return `
        <div class="con-card ${isActive ? '' : 'con-card-inactive'}">
            <div class="con-card-header">
                <span class="con-type-badge">${label}</span>
                <div class="con-card-actions">
                    <button class="btn btn-sm" onclick="toggleConstraintActive('${c.id}')" title="${isActive ? 'השבת' : 'הפעל'}">
                        <i data-lucide="${isActive ? 'toggle-right' : 'toggle-left'}" style="width:16px;height:16px;"></i>
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteEnhancedConstraint('${c.id}')" title="מחק">
                        <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
                    </button>
                </div>
            </div>
            <div class="con-card-body">
                <div class="con-soldier-name">${soldier ? esc(soldier.name) : 'חייל לא ידוע'}</div>
                <div class="con-details">${details}</div>
                ${c.createdBy ? `<div class="con-meta">נוצר ע"י ${esc(c.createdBy)}</div>` : ''}
            </div>
        </div>`;
    }).join('');
    refreshIcons();
}

// ---- Add constraint wizard ----
function openAddConstraint() {
    const type = constraintsSubTab === 'personal' ? 'no_pair' : 'date_block';
    const soldiers = (state.soldiers || []).sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));

    let typeOptions = '';
    if (constraintsSubTab === 'task') {
        typeOptions = `
            <option value="date_block">🚫 חסימת תאריכים</option>
            <option value="no_nights">🌙 ללא לילות</option>
            <option value="max_consecutive">🔄 מקסימום רצופים</option>
            <option value="min_rest">⏰ מנוחה מינימלית</option>
        `;
    } else {
        typeOptions = `<option value="no_pair">👥 לא לזווג</option>`;
    }

    const soldierOptions = soldiers.map(s => `<option value="${s.id}">${esc(s.name)} (${typeof compName === 'function' ? compName(s.company) : s.company})</option>`).join('');

    const html = `
    <div class="modal-overlay" id="addConstraintModal" style="display:flex;">
        <div class="modal" style="max-width:480px;">
            <div class="modal-header">
                <h3>אילוץ חדש</h3>
                <button class="modal-close" onclick="closeModal('addConstraintModal'); document.getElementById('addConstraintModal')?.remove()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>סוג אילוץ</label>
                    <select id="newConType" onchange="updateConstraintForm()">${typeOptions}</select>
                </div>
                <div class="form-group">
                    <label>חייל</label>
                    <select id="newConSoldier"><option value="">-- בחר חייל --</option>${soldierOptions}</select>
                </div>
                <div id="newConSoldierB" class="form-group" style="display:${type === 'no_pair' ? '' : 'none'};">
                    <label>חייל שני</label>
                    <select id="newConSoldierBSelect"><option value="">-- בחר חייל --</option>${soldierOptions}</select>
                </div>
                <div id="newConDates" class="form-row" style="display:${type === 'date_block' ? '' : 'none'};">
                    <div class="form-group"><label>מתאריך</label><input type="date" id="newConStart"></div>
                    <div class="form-group"><label>עד תאריך</label><input type="date" id="newConEnd"></div>
                </div>
                <div id="newConMaxField" class="form-group" style="display:none;">
                    <label>מקסימום משמרות רצופות</label>
                    <input type="number" id="newConMax" value="2" min="1" max="10">
                </div>
                <div id="newConRestField" class="form-group" style="display:none;">
                    <label>שעות מנוחה מינימליות</label>
                    <input type="number" id="newConRest" value="8" min="4" max="24">
                </div>
                <div class="form-group">
                    <label>סיבה / הערה</label>
                    <input type="text" id="newConReason" placeholder="אופציונלי">
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-cancel" onclick="closeModal('addConstraintModal'); document.getElementById('addConstraintModal')?.remove()">ביטול</button>
                <button class="btn btn-add" onclick="saveNewConstraint()"><i data-lucide="plus"></i> הוסף</button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', html);
    refreshIcons();
}

function updateConstraintForm() {
    const type = document.getElementById('newConType').value;
    document.getElementById('newConDates').style.display = type === 'date_block' ? '' : 'none';
    document.getElementById('newConSoldierB').style.display = type === 'no_pair' ? '' : 'none';
    document.getElementById('newConMaxField').style.display = type === 'max_consecutive' ? '' : 'none';
    document.getElementById('newConRestField').style.display = type === 'min_rest' ? '' : 'none';
}

function saveNewConstraint() {
    const type = document.getElementById('newConType').value;
    const soldierId = document.getElementById('newConSoldier').value;
    const reason = document.getElementById('newConReason').value.trim();

    if (!soldierId) { showToast('יש לבחור חייל', 'error'); return; }

    const constraint = {
        id: 'con_' + Date.now(),
        type,
        soldierId,
        reason,
        active: true,
        createdBy: currentUser ? currentUser.name : ''
    };

    if (type === 'date_block') {
        constraint.startDate = document.getElementById('newConStart').value;
        constraint.endDate = document.getElementById('newConEnd').value;
        if (!constraint.startDate || !constraint.endDate) { showToast('יש לבחור תאריכים', 'error'); return; }
    } else if (type === 'no_pair') {
        constraint.soldierIdB = document.getElementById('newConSoldierBSelect').value;
        if (!constraint.soldierIdB) { showToast('יש לבחור חייל שני', 'error'); return; }
    } else if (type === 'max_consecutive') {
        constraint.maxConsecutive = parseInt(document.getElementById('newConMax').value) || 2;
    } else if (type === 'min_rest') {
        constraint.restHours = parseInt(document.getElementById('newConRest').value) || 8;
    }

    if (!state.constraints) state.constraints = [];
    state.constraints.push(constraint);
    if (typeof saveState === 'function') saveState();

    closeModal('addConstraintModal');
    document.getElementById('addConstraintModal').remove();
    renderConstraintsTab();
    showToast('אילוץ נוסף בהצלחה');
}

function toggleConstraintActive(id) {
    const c = (state.constraints || []).find(x => x.id === id);
    if (c) {
        c.active = c.active === false ? true : false;
        if (typeof saveState === 'function') saveState();
        renderConstraintsListContent();
    }
}

function deleteEnhancedConstraint(id) {
    state.constraints = (state.constraints || []).filter(c => c.id !== id);
    if (typeof saveState === 'function') saveState();
    renderConstraintsListContent();
    showToast('אילוץ הוסר');
}

// ---- Enhanced constraint checking (integrates with getSoldierShiftStatus) ----
function checkEnhancedConstraints(soldierId, date, startTime, endTime) {
    const violations = [];
    if (!state.constraints) return violations;

    state.constraints.filter(c => c.active !== false && c.soldierId === soldierId).forEach(c => {
        const type = c.type || 'date_block';

        if (type === 'date_block') {
            if (date >= c.startDate && date <= c.endDate) {
                violations.push({ type, message: c.reason || 'חסום בתאריכים אלו' });
            }
        }

        if (type === 'no_nights' && startTime) {
            const hour = parseInt(startTime.split(':')[0]);
            if (hour >= 22 || hour < 6) {
                violations.push({ type, message: 'אילוץ: ללא משמרות לילה' });
            }
        }

        if (type === 'max_consecutive') {
            const max = c.maxConsecutive || 2;
            // Count consecutive days with shifts ending on this date
            let consecutive = 0;
            for (let i = 1; i <= max + 1; i++) {
                const checkDate = new Date(date + 'T12:00:00');
                checkDate.setDate(checkDate.getDate() - i);
                const checkStr = checkDate.toISOString().split('T')[0];
                const hasShift = (state.shifts || []).some(sh =>
                    sh.date === checkStr && sh.soldiers && sh.soldiers.includes(soldierId)
                );
                if (hasShift) consecutive++;
                else break;
            }
            if (consecutive >= max) {
                violations.push({ type, message: `חריגה: ${consecutive} משמרות רצופות (מקסימום ${max})` });
            }
        }

        if (type === 'min_rest' && startTime) {
            const restHours = c.restHours || 8;
            // Find the previous shift end time
            const prevShifts = (state.shifts || []).filter(sh =>
                sh.soldiers && sh.soldiers.includes(soldierId) && sh.date <= date
            ).sort((a, b) => (b.date + b.endTime).localeCompare(a.date + a.endTime));

            if (prevShifts.length > 0) {
                const prev = prevShifts[0];
                if (prev.endTime && prev.date) {
                    const prevEnd = new Date(`${prev.date}T${prev.endTime}`);
                    const thisStart = new Date(`${date}T${startTime}`);
                    const hoursDiff = (thisStart - prevEnd) / (1000 * 60 * 60);
                    if (hoursDiff < restHours && hoursDiff >= 0) {
                        violations.push({ type, message: `מנוחה לא מספקת: ${Math.round(hoursDiff)} שעות (מינימום ${restHours})` });
                    }
                }
            }
        }
    });

    // Check no_pair constraints (for both soldiers)
    state.constraints.filter(c => c.active !== false && c.type === 'no_pair' &&
        (c.soldierId === soldierId || c.soldierIdB === soldierId)
    ).forEach(c => {
        const pairedId = c.soldierId === soldierId ? c.soldierIdB : c.soldierId;
        // Check if paired soldier is in any shift on same date/time
        const overlap = (state.shifts || []).some(sh =>
            sh.date === date && sh.soldiers && sh.soldiers.includes(pairedId) &&
            sh.startTime < endTime && sh.endTime > startTime
        );
        if (overlap) {
            const pairedName = (state.soldiers || []).find(s => s.id === pairedId)?.name || '';
            violations.push({ type: 'no_pair', message: `לא לזווג עם ${esc(pairedName)}` });
        }
    });

    return violations;
}
