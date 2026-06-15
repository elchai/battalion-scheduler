// ==================== ENHANCED REPORTS (דוחות מתקדמים) ====================
// Adds visual reports: role availability, shift fairness, anomalies
// Integrates as sub-tabs in the existing Reports tab

let reportsSubTab = 'existing'; // 'existing' | 'roles' | 'fairness' | 'anomalies'

function renderReportsSubTabs() {
    const container = document.getElementById('reportsSubTabsBar');
    if (!container) return;
    container.innerHTML = `
        <button class="subtab-btn ${reportsSubTab === 'existing' ? 'active' : ''}" onclick="switchReportsSubTab('existing')">דוחות קיימים</button>
        <button class="subtab-btn ${reportsSubTab === 'roles' ? 'active' : ''}" onclick="switchReportsSubTab('roles')">זמינות לפי תפקיד</button>
        <button class="subtab-btn ${reportsSubTab === 'fairness' ? 'active' : ''}" onclick="switchReportsSubTab('fairness')">הוגנות שיבוצים</button>
        <button class="subtab-btn ${reportsSubTab === 'anomalies' ? 'active' : ''}" onclick="switchReportsSubTab('anomalies')">חריגות</button>
    `;
}

function switchReportsSubTab(tab) {
    reportsSubTab = tab;
    renderReportsSubTabs();

    const existingContent = document.getElementById('reportsExistingContent');
    const enhancedContent = document.getElementById('reportsEnhancedContent');
    if (!existingContent || !enhancedContent) return;

    if (tab === 'existing') {
        existingContent.style.display = '';
        enhancedContent.style.display = 'none';
    } else {
        existingContent.style.display = 'none';
        enhancedContent.style.display = '';
        if (tab === 'roles') renderRoleAvailability();
        else if (tab === 'fairness') renderShiftFairness();
        else if (tab === 'anomalies') renderAnomalies();
    }
}

// ==================== ROLE AVAILABILITY (זמינות לפי תפקיד) ====================
function renderRoleAvailability() {
    const container = document.getElementById('reportsEnhancedContent');
    if (!container) return;

    const todayStr = typeof localToday === 'function' ? localToday() : new Date().toISOString().split('T')[0];
    const companies = typeof allCompanyKeys === 'function' ? allCompanyKeys() : ['a','b','c','d','hq','agam','palsam'];

    // Collect all roles
    const roleMap = {}; // role -> { total, available, byCompany }
    (state.soldiers || []).forEach(s => {
        const roles = Array.isArray(s.role) ? s.role : (s.role || 'לא מוגדר').split(',').map(r => r.trim());
        roles.forEach(role => {
            if (!role) return;
            if (!roleMap[role]) roleMap[role] = { total: 0, available: 0, byCompany: {} };
            roleMap[role].total++;

            // Check availability
            let isAvailable = true;
            if (typeof getSoldierShiftStatus === 'function') {
                const status = getSoldierShiftStatus(s.id, todayStr, '08:00', '16:00');
                isAvailable = status.available;
            }
            if (isAvailable) roleMap[role].available++;

            // By company
            const comp = s.company || 'unknown';
            if (!roleMap[role].byCompany[comp]) roleMap[role].byCompany[comp] = { total: 0, available: 0 };
            roleMap[role].byCompany[comp].total++;
            if (isAvailable) roleMap[role].byCompany[comp].available++;
        });
    });

    // Sort by total count descending
    const roles = Object.keys(roleMap).sort((a, b) => roleMap[b].total - roleMap[a].total);

    let html = `
    <div class="rpt-section-header">
        <h3><i data-lucide="users" style="width:18px;height:18px;"></i> זמינות לפי תפקיד</h3>
        <span class="rpt-date">נכון ל: ${new Date(todayStr).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
    </div>
    <div class="rpt-cards-grid">`;

    // Summary cards
    const totalSoldiers = (state.soldiers || []).length;
    let totalAvailable = 0;
    (state.soldiers || []).forEach(s => {
        if (typeof getSoldierShiftStatus === 'function') {
            const st = getSoldierShiftStatus(s.id, todayStr, '08:00', '16:00');
            if (st.available) totalAvailable++;
        }
    });
    const availPct = totalSoldiers > 0 ? Math.round(totalAvailable / totalSoldiers * 100) : 0;

    html += `
        <div class="rpt-stat-card"><div class="rpt-stat-num">${totalSoldiers}</div><div class="rpt-stat-label">סד"כ כולל</div></div>
        <div class="rpt-stat-card rpt-stat-good"><div class="rpt-stat-num">${totalAvailable}</div><div class="rpt-stat-label">זמינים</div></div>
        <div class="rpt-stat-card rpt-stat-bad"><div class="rpt-stat-num">${totalSoldiers - totalAvailable}</div><div class="rpt-stat-label">לא זמינים</div></div>
        <div class="rpt-stat-card"><div class="rpt-stat-num">${availPct}%</div><div class="rpt-stat-label">כשירות</div></div>
    </div>`;

    // Role bars
    html += '<div class="rpt-role-list">';
    roles.forEach(role => {
        const r = roleMap[role];
        const pct = r.total > 0 ? Math.round(r.available / r.total * 100) : 0;
        const barColor = pct >= 80 ? 'var(--success)' : pct >= 50 ? 'var(--warning)' : 'var(--danger)';

        html += `
        <div class="rpt-role-item">
            <div class="rpt-role-header">
                <span class="rpt-role-name">${esc(role)}</span>
                <span class="rpt-role-count">${r.available} / ${r.total}</span>
                <span class="rpt-role-pct" style="color:${barColor};">${pct}%</span>
            </div>
            <div class="rpt-bar-bg">
                <div class="rpt-bar-fill" style="width:${pct}%;background:${barColor};"></div>
            </div>
        </div>`;
    });
    html += '</div>';

    container.innerHTML = html;
    refreshIcons();
}

// ==================== SHIFT FAIRNESS (הוגנות שיבוצים) ====================
function renderShiftFairness() {
    const container = document.getElementById('reportsEnhancedContent');
    if (!container) return;

    // Count shifts per soldier from shiftHistory + current shifts
    const shiftCounts = {};
    const nightCounts = {};
    const soldierMap = {};

    (state.soldiers || []).forEach(s => {
        shiftCounts[s.id] = 0;
        nightCounts[s.id] = 0;
        soldierMap[s.id] = s;
    });

    // Count from current shifts
    (state.shifts || []).forEach(sh => {
        const isNight = sh.startTime && parseInt(sh.startTime.split(':')[0]) >= 22;
        (sh.soldiers || []).forEach(sid => {
            if (shiftCounts[sid] !== undefined) {
                shiftCounts[sid]++;
                if (isNight) nightCounts[sid]++;
            }
        });
    });

    // Also count from shiftHistory if exists
    (state.shiftHistory || []).forEach(h => {
        if (h.soldierId && shiftCounts[h.soldierId] !== undefined) {
            shiftCounts[h.soldierId]++;
            if (h.isNight) nightCounts[h.soldierId]++;
        }
    });

    // Sort by shift count
    const sorted = Object.keys(shiftCounts)
        .filter(id => soldierMap[id])
        .sort((a, b) => shiftCounts[b] - shiftCounts[a]);

    if (sorted.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין נתוני שיבוצים</p></div>';
        return;
    }

    const maxShifts = Math.max(...sorted.map(id => shiftCounts[id]), 1);
    const avgShifts = sorted.length > 0 ? (sorted.reduce((s, id) => s + shiftCounts[id], 0) / sorted.length).toFixed(1) : 0;
    const stdDev = sorted.length > 0 ? Math.sqrt(sorted.reduce((s, id) => s + Math.pow(shiftCounts[id] - avgShifts, 2), 0) / sorted.length).toFixed(1) : 0;

    let html = `
    <div class="rpt-section-header">
        <h3><i data-lucide="scale" style="width:18px;height:18px;"></i> הוגנות שיבוצים</h3>
    </div>
    <div class="rpt-cards-grid">
        <div class="rpt-stat-card"><div class="rpt-stat-num">${avgShifts}</div><div class="rpt-stat-label">ממוצע משמרות</div></div>
        <div class="rpt-stat-card"><div class="rpt-stat-num">${maxShifts}</div><div class="rpt-stat-label">מקסימום</div></div>
        <div class="rpt-stat-card"><div class="rpt-stat-num">${stdDev}</div><div class="rpt-stat-label">סטיית תקן</div></div>
        <div class="rpt-stat-card"><div class="rpt-stat-num">${sorted.filter(id => shiftCounts[id] === 0).length}</div><div class="rpt-stat-label">בלי משמרות</div></div>
    </div>
    <div class="rpt-fairness-list">`;

    sorted.forEach(id => {
        const s = soldierMap[id];
        const count = shiftCounts[id];
        const nights = nightCounts[id];
        const pct = maxShifts > 0 ? Math.round(count / maxShifts * 100) : 0;
        const isOver = count > parseFloat(avgShifts) * 1.5;
        const isUnder = count < parseFloat(avgShifts) * 0.5 && parseFloat(avgShifts) > 0;
        const barColor = isOver ? 'var(--danger)' : isUnder ? 'var(--warning)' : 'var(--primary)';
        const compColor = CONFIG && CONFIG.companies && CONFIG.companies[s.company] ? CONFIG.companies[s.company].color : '#666';

        html += `
        <div class="rpt-fair-row ${isOver ? 'rpt-fair-over' : ''} ${isUnder ? 'rpt-fair-under' : ''}">
            <div class="rpt-fair-name">
                <span>${esc(s.name)}</span>
                <span class="rpt-fair-comp" style="color:${compColor};">${typeof compName === 'function' ? compName(s.company) : s.company}</span>
            </div>
            <div class="rpt-fair-bar-wrap">
                <div class="rpt-bar-bg">
                    <div class="rpt-bar-fill" style="width:${pct}%;background:${barColor};"></div>
                </div>
            </div>
            <div class="rpt-fair-count">${count}</div>
            ${nights > 0 ? `<div class="rpt-fair-nights" title="משמרות לילה">🌙${nights}</div>` : ''}
        </div>`;
    });

    html += '</div>';
    container.innerHTML = html;
    refreshIcons();
}

// ==================== ANOMALIES (חריגות) ====================
function renderAnomalies() {
    const container = document.getElementById('reportsEnhancedContent');
    if (!container) return;

    const todayStr = typeof localToday === 'function' ? localToday() : new Date().toISOString().split('T')[0];
    const anomalies = [];

    // 1. Soldiers with 0 shifts in last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekAgoStr = weekAgo.toISOString().split('T')[0];

    const recentShiftSoldiers = new Set();
    (state.shifts || []).filter(sh => sh.date >= weekAgoStr && sh.date <= todayStr)
        .forEach(sh => (sh.soldiers || []).forEach(sid => recentShiftSoldiers.add(sid)));

    (state.soldiers || []).forEach(s => {
        if (!recentShiftSoldiers.has(s.id) && !s.notArrived) {
            // Check if active
            const isActive = typeof isSoldierActiveOnDate === 'function' ? isSoldierActiveOnDate(s, todayStr) : true;
            const onLeave = (state.leaves || []).some(l => l.soldierId === s.id && typeof isOnLeaveForDate === 'function' && isOnLeaveForDate(l, todayStr));
            if (isActive && !onLeave) {
                anomalies.push({
                    type: 'no_shifts',
                    severity: 'warning',
                    icon: '⚠️',
                    soldier: s,
                    message: `${esc(s.name)} — 0 משמרות ב-7 ימים אחרונים`
                });
            }
        }
    });

    // 2. Soldiers with 3+ consecutive night shifts
    const nightSoldierDays = {}; // soldierId -> sorted array of night shift dates
    (state.shifts || []).forEach(sh => {
        const isNight = sh.startTime && parseInt(sh.startTime.split(':')[0]) >= 22;
        if (!isNight) return;
        (sh.soldiers || []).forEach(sid => {
            if (!nightSoldierDays[sid]) nightSoldierDays[sid] = [];
            nightSoldierDays[sid].push(sh.date);
        });
    });

    Object.keys(nightSoldierDays).forEach(sid => {
        const dates = [...new Set(nightSoldierDays[sid])].sort();
        let consecutive = 1;
        for (let i = 1; i < dates.length; i++) {
            const prev = new Date(dates[i-1] + 'T12:00:00');
            const curr = new Date(dates[i] + 'T12:00:00');
            const diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
                consecutive++;
                if (consecutive >= 3) {
                    const s = (state.soldiers || []).find(x => x.id === sid);
                    if (s) {
                        anomalies.push({
                            type: 'consecutive_nights',
                            severity: 'danger',
                            icon: '🔴',
                            soldier: s,
                            message: `${esc(s.name)} — ${consecutive} לילות רצופים`
                        });
                    }
                    break;
                }
            } else {
                consecutive = 1;
            }
        }
    });

    // 3. Shifts with missing soldiers (unfilled positions)
    const todayShifts = (state.shifts || []).filter(sh => sh.date === todayStr);
    todayShifts.forEach(sh => {
        const requiredCount = sh.requiredSoldiers || 0;
        const actualCount = (sh.soldiers || []).length;
        if (requiredCount > 0 && actualCount < requiredCount) {
            anomalies.push({
                type: 'understaffed',
                severity: 'danger',
                icon: '🚨',
                message: `${esc(sh.task || 'משימה')} ${sh.shiftName || ''} — חסרים ${requiredCount - actualCount} חיילים (${actualCount}/${requiredCount})`
            });
        }
    });

    // 4. Soldiers on leave returning today
    (state.leaves || []).forEach(l => {
        if (l.endDate === todayStr) {
            const s = (state.soldiers || []).find(x => x.id === l.soldierId);
            if (s) {
                anomalies.push({
                    type: 'returning',
                    severity: 'info',
                    icon: 'ℹ️',
                    soldier: s,
                    message: `${esc(s.name)} — חוזר מיציאה היום ${l.endTime || ''}`
                });
            }
        }
    });

    // Sort: danger first, then warning, then info
    const severityOrder = { danger: 0, warning: 1, info: 2 };
    anomalies.sort((a, b) => (severityOrder[a.severity] || 9) - (severityOrder[b.severity] || 9));

    let html = `
    <div class="rpt-section-header">
        <h3><i data-lucide="alert-triangle" style="width:18px;height:18px;"></i> חריגות</h3>
        <span class="rpt-date">${anomalies.length} ממצאים</span>
    </div>`;

    if (anomalies.length === 0) {
        html += '<div class="rpt-empty"><i data-lucide="check-circle" style="width:32px;height:32px;color:var(--success);"></i><p>לא נמצאו חריגות — הכל תקין!</p></div>';
    } else {
        html += '<div class="rpt-anomaly-list">';
        anomalies.forEach(a => {
            html += `<div class="rpt-anomaly rpt-anomaly-${a.severity}">
                <span class="rpt-anomaly-icon">${a.icon}</span>
                <span class="rpt-anomaly-msg">${a.message}</span>
            </div>`;
        });
        html += '</div>';
    }

    container.innerHTML = html;
    refreshIcons();
}
