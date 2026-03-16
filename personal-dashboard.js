// ==================== PERSONAL DASHBOARD (דשבורד אישי) ====================
// Inspired by miuim's personal home screen — shows soldier's own data

function renderPersonalDashboard() {
    const container = document.getElementById('personalDashboardContent');
    if (!container) return;
    if (!currentUser || !currentUser.soldierId) {
        container.innerHTML = '<div class="empty-state"><p>לא זוהה חייל מחובר</p></div>';
        return;
    }

    const soldier = state.soldiers.find(s => s.id === currentUser.soldierId);
    const soldierName = soldier ? soldier.name : currentUser.name;
    const unitName = getCompNames()[currentUser.unit] || currentUser.unit || '';

    container.innerHTML = `
        ${renderGreetingWidget(soldierName, unitName)}
        <div class="pd-grid">
            <div class="pd-col-main">
                ${renderMyTodaySchedule()}
                ${renderMyUpcomingSchedule()}
                ${renderMyLeaveWidget()}
            </div>
            <div class="pd-col-side">
                ${renderMyWeeklySummary()}
                ${renderMyEquipmentWidget()}
                ${renderMyAnnouncementsWidget()}
            </div>
        </div>
    `;
    refreshIcons();
}

// ---- Greeting Widget ----
function renderGreetingWidget(name, unit) {
    const now = new Date();
    const hour = now.getHours();
    let greeting = 'לילה טוב';
    let greetIcon = 'moon';
    if (hour >= 5 && hour < 12) { greeting = 'בוקר טוב'; greetIcon = 'sunrise'; }
    else if (hour >= 12 && hour < 17) { greeting = 'צהריים טובים'; greetIcon = 'sun'; }
    else if (hour >= 17 && hour < 21) { greeting = 'ערב טוב'; greetIcon = 'sunset'; }

    const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    const dayName = dayNames[now.getDay()];
    const dateStr = now.toLocaleDateString('he-IL', { day: 'numeric', month: 'long' });
    const timeStr = now.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

    return `
    <div class="pd-greeting">
        <div class="pd-greeting-text">
            <h1>${greeting}, ${escapeHtml(name.split(' ')[0])}</h1>
            <div class="pd-greeting-meta">
                <i data-lucide="calendar" style="width:16px;height:16px;"></i>
                <span>יום ${dayName}, ${dateStr}</span>
                <span class="pd-sep">|</span>
                <span>${timeStr}</span>
            </div>
            ${unit ? `<div class="pd-greeting-unit"><i data-lucide="shield" style="width:14px;height:14px;"></i> ${escapeHtml(unit)}</div>` : ''}
        </div>
        <div class="pd-greeting-icon"><i data-lucide="${greetIcon}" style="width:48px;height:48px;"></i></div>
    </div>`;
}

// ---- Today's Schedule ----
function renderMyTodaySchedule() {
    const today = new Date().toISOString().split('T')[0];
    const soldierId = currentUser.soldierId;
    const myShifts = (state.shifts || []).filter(sh =>
        sh.date === today && sh.soldiers && sh.soldiers.includes(soldierId)
    ).sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

    let content = '';
    if (myShifts.length === 0) {
        content = `
            <div class="pd-empty-shift">
                <i data-lucide="coffee" style="width:32px;height:32px;color:var(--text-light);"></i>
                <h4>אין משמרת פעילה</h4>
                <p>זמן מעולה למילוי מצברים לקראת המשימה הבאה.</p>
            </div>`;
    } else {
        content = '<div class="pd-timeline">' + myShifts.map(sh => {
            const taskName = sh.task || sh.name || sh.type || 'משמרת';
            const shiftLabel = sh.shiftName || '';
            return `
            <div class="pd-timeline-item">
                <div class="pd-timeline-time">${sh.startTime || '?'}</div>
                <div class="pd-timeline-dot"></div>
                <div class="pd-timeline-card">
                    <div class="pd-timeline-task">${escapeHtml(taskName)}</div>
                    ${shiftLabel ? `<div class="pd-timeline-shift">${escapeHtml(shiftLabel)}</div>` : ''}
                    <div class="pd-timeline-range">${sh.startTime || '?'} - ${sh.endTime || '?'}</div>
                </div>
            </div>`;
        }).join('') + '</div>';
    }

    return `
    <div class="pd-widget">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="clock" style="width:18px;height:18px;"></i> סדר יום</div>
            <span class="pd-badge">היום</span>
        </div>
        ${content}
    </div>`;
}

// ---- Upcoming Schedule (3 days ahead) ----
function renderMyUpcomingSchedule() {
    const soldierId = currentUser.soldierId;
    const today = new Date();
    let items = [];

    for (let i = 1; i <= 3; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
        const dayLabel = `יום ${dayNames[d.getDay()]}, ${d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}`;

        const shifts = (state.shifts || []).filter(sh =>
            sh.date === dateStr && sh.soldiers && sh.soldiers.includes(soldierId)
        );

        if (shifts.length > 0) {
            shifts.forEach(sh => {
                items.push(`
                <div class="pd-upcoming-item">
                    <div class="pd-upcoming-date">${dayLabel}</div>
                    <div class="pd-upcoming-info">
                        <strong>${escapeHtml(sh.task || sh.name || 'משמרת')}</strong>
                        <span>${sh.startTime || ''} - ${sh.endTime || ''}</span>
                    </div>
                </div>`);
            });
        }
    }

    if (items.length === 0) {
        items.push(`
        <div class="pd-empty-small">
            <i data-lucide="calendar-off" style="width:20px;height:20px;"></i>
            <span>אין שיבוצים ב-3 הימים הקרובים</span>
        </div>`);
    }

    return `
    <div class="pd-widget">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="calendar-range" style="width:18px;height:18px;"></i> הלו"ז הקרוב</div>
            <span class="pd-badge-muted">3 ימים קדימה</span>
        </div>
        ${items.join('')}
    </div>`;
}

// ---- Leave / Rotation Status ----
function renderMyLeaveWidget() {
    const soldierId = currentUser.soldierId;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Check current leave
    const currentLeave = (state.leaves || []).find(l =>
        l.soldierId === soldierId && isOnLeaveForDate(l, todayStr)
    );

    // Check upcoming leave
    const upcomingLeaves = (state.leaves || []).filter(l =>
        l.soldierId === soldierId && l.startDate > todayStr
    ).sort((a, b) => a.startDate.localeCompare(b.startDate));

    // Check rotation status
    const rotGroup = getRotationGroupForSoldier(soldierId);
    let rotationHtml = '';
    if (rotGroup) {
        const status = getRotationStatus(rotGroup, today);
        const nextChange = getNextRotationChange(rotGroup, today);
        const nextStr = nextChange.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
        const statusText = status.inBase ? 'בבסיס' : 'בבית';
        const statusColor = status.inBase ? 'var(--success)' : 'var(--info)';
        const daysIn = status.inBase ? (rotGroup.daysIn - status.dayInCycle + 1) : (rotGroup.daysIn + rotGroup.daysOut - status.dayInCycle + 1);
        rotationHtml = `
        <div class="pd-rotation-status" style="border-right:3px solid ${statusColor};">
            <div><strong>${statusText}</strong> — יום ${status.dayInCycle} במחזור</div>
            <div class="pd-rotation-next">חילוף: ${nextStr} (עוד ${daysIn} ימים)</div>
        </div>`;
    }

    let leaveHtml = '';
    if (currentLeave) {
        const end = new Date(currentLeave.endDate + 'T' + (currentLeave.endTime || '23:59'));
        const endStr = end.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
        leaveHtml = `<div class="pd-leave-active"><i data-lucide="home" style="width:16px;height:16px;"></i> ביציאה עד ${endStr} ${currentLeave.endTime || ''}</div>`;
    } else if (upcomingLeaves.length > 0) {
        const next = upcomingLeaves[0];
        const startStr = new Date(next.startDate).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
        leaveHtml = `<div class="pd-leave-upcoming"><i data-lucide="calendar-check" style="width:16px;height:16px;"></i> יציאה הבאה: ${startStr} ${next.startTime || ''}</div>`;
    } else {
        leaveHtml = `<div class="pd-empty-small"><i data-lucide="calendar-x" style="width:16px;height:16px;"></i> <span>אין יציאות מתוכננות</span></div>`;
    }

    return `
    <div class="pd-widget">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="map-pin" style="width:18px;height:18px;"></i> סטטוס</div>
        </div>
        ${rotationHtml}
        ${leaveHtml}
    </div>`;
}

// ---- Weekly Summary ----
function renderMyWeeklySummary() {
    const soldierId = currentUser.soldierId;
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    const startStr = startOfWeek.toISOString().split('T')[0];
    const endStr = endOfWeek.toISOString().split('T')[0];

    const weekShifts = (state.shifts || []).filter(sh =>
        sh.date >= startStr && sh.date <= endStr &&
        sh.soldiers && sh.soldiers.includes(soldierId)
    );

    let totalHours = 0;
    weekShifts.forEach(sh => {
        if (sh.startTime && sh.endTime) {
            const [sh1, sm1] = sh.startTime.split(':').map(Number);
            const [eh1, em1] = sh.endTime.split(':').map(Number);
            let diff = (eh1 * 60 + em1) - (sh1 * 60 + sm1);
            if (diff < 0) diff += 24 * 60; // cross-midnight
            totalHours += diff / 60;
        }
    });

    return `
    <div class="pd-widget pd-widget-compact">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="bar-chart-3" style="width:18px;height:18px;"></i> סיכום שבועי</div>
        </div>
        <div class="pd-summary-grid">
            <div class="pd-summary-item">
                <div class="pd-summary-num">${weekShifts.length}</div>
                <div class="pd-summary-label">משמרות</div>
            </div>
            <div class="pd-summary-item">
                <div class="pd-summary-num">${Math.round(totalHours)}</div>
                <div class="pd-summary-label">שעות</div>
            </div>
        </div>
    </div>`;
}

// ---- Equipment Widget ----
function renderMyEquipmentWidget() {
    const soldierId = currentUser.soldierId;
    const heldItems = (state.equipment || []).filter(e => e.holderId === soldierId);

    let content = '';
    if (heldItems.length === 0) {
        content = `<div class="pd-empty-small"><i data-lucide="package" style="width:16px;height:16px;"></i> <span>אין ציוד חתום</span></div>`;
    } else {
        const shown = heldItems.slice(0, 4);
        content = shown.map(e => `
            <div class="pd-equip-item">
                <i data-lucide="package" style="width:14px;height:14px;color:var(--success);"></i>
                <span>${escapeHtml(e.type)}</span>
                <span class="pd-equip-serial">${escapeHtml(e.serial || '')}</span>
            </div>
        `).join('');
        if (heldItems.length > 4) {
            content += `<div class="pd-equip-more">+${heldItems.length - 4} פריטים נוספים</div>`;
        }
    }

    return `
    <div class="pd-widget pd-widget-compact">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="package" style="width:18px;height:18px;"></i> הציוד שלי</div>
            <span class="pd-badge-muted">${heldItems.length} פריטים</span>
        </div>
        ${content}
    </div>`;
}

// ---- Announcements Widget ----
function renderMyAnnouncementsWidget() {
    const announcements = (state.announcements || [])
        .sort((a, b) => {
            if (a.priority === 'pinned' && b.priority !== 'pinned') return -1;
            if (b.priority === 'pinned' && a.priority !== 'pinned') return 1;
            return b.timestamp - a.timestamp;
        })
        .slice(0, 3);

    let content = '';
    if (announcements.length === 0) {
        content = `<div class="pd-empty-small"><i data-lucide="bell-off" style="width:16px;height:16px;"></i> <span>אין עדכונים</span></div>`;
    } else {
        content = announcements.map(ann => {
            const date = new Date(ann.timestamp);
            const dateStr = date.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
            const isUrgent = ann.priority === 'urgent';
            return `
            <div class="pd-ann-item ${isUrgent ? 'pd-ann-urgent' : ''}">
                <div class="pd-ann-date">${dateStr}</div>
                <div class="pd-ann-content">
                    <strong>${escapeHtml(ann.title)}</strong>
                    <p>${escapeHtml((ann.body || '').substring(0, 80))}${(ann.body || '').length > 80 ? '...' : ''}</p>
                </div>
            </div>`;
        }).join('');
    }

    return `
    <div class="pd-widget pd-widget-compact">
        <div class="pd-widget-header">
            <div class="pd-widget-title"><i data-lucide="bell" style="width:18px;height:18px;"></i> עדכונים</div>
            ${announcements.length > 0 ? `<span class="pd-badge">${announcements.length} חדשים</span>` : ''}
        </div>
        ${content}
    </div>`;
}
