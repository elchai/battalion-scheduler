// ==================== ATTENDANCE TABLE VIEW (תצוגת טבלה חודשית) ====================
// Enhances Report 1 (דוח 1) with a monthly table view (soldiers × days)
// Uses existing state.rollCalls data + getReport1SoldierStatus() for hybrid attendance

let attTableCompany = 'all';

function renderAttendanceTable() {
    const container = document.getElementById('report1Content');
    if (!container) return;

    const compSelect = document.getElementById('report1Company');
    attTableCompany = compSelect ? compSelect.value : 'all';
    const isNispachim = attTableCompany === 'nispachim';
    const isAll = attTableCompany === 'all';
    const soldiers = isNispachim
        ? state.soldiers.filter(s => s.nispach)
        : isAll
        ? state.soldiers.filter(s => !s.nispach)
        : state.soldiers.filter(s => s.company === attTableCompany && !s.nispach);

    if (soldiers.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>אין חיילים בפלוגה זו</p></div>';
        return;
    }

    const sorted = [...soldiers].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'he'));
    const year = attendanceYear || new Date().getFullYear();
    const month = attendanceMonth || new Date().getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayStr = localToday();
    const hebDays = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];

    // Monthly navigation (reuse attendance module vars)
    if (typeof attendanceYear === 'undefined') window.attendanceYear = new Date().getFullYear();
    if (typeof attendanceMonth === 'undefined') window.attendanceMonth = new Date().getMonth();

    const monthNames = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

    // Build day status for each soldier × day
    const data = {};
    const daySummaries = {};

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let dayPresent = 0;

        sorted.forEach(s => {
            const status = typeof getReport1SoldierStatus === 'function'
                ? getReport1SoldierStatus(s, dateStr)
                : 'unknown';

            // Also check rollCalls for this date
            let rollStatus = null;
            if (state.rollCalls) {
                const rc = state.rollCalls.filter(r => r.date === dateStr &&
                    (isAll || r.company === s.company));
                rc.forEach(r => {
                    if (r.entries && r.entries[s.id]) rollStatus = r.entries[s.id];
                });
            }

            // Determine display status: rollCall > report1 status
            let displayStatus;
            if (rollStatus === 'present') displayStatus = 'present';
            else if (rollStatus === 'absent') displayStatus = 'absent';
            else if (rollStatus === 'leave') displayStatus = 'leave';
            else if (status === 'active' || status === 'base') displayStatus = 'present';
            else if (status === 'home') displayStatus = 'leave';
            else if (status === 'notserving') displayStatus = 'notserving';
            else displayStatus = 'unknown';

            if (!data[s.id]) data[s.id] = {};
            data[s.id][dateStr] = displayStatus;
            if (displayStatus === 'present') dayPresent++;
        });

        daySummaries[dateStr] = { present: dayPresent, total: sorted.length };
    }

    // Build HTML
    let html = `
    <div class="att-table-nav">
        <button class="btn btn-sm" onclick="attTableMonthNav(-1)"><i data-lucide="chevron-right" style="width:16px;height:16px;"></i></button>
        <span class="att-table-month">${monthNames[month]} ${year}</span>
        <button class="btn btn-sm" onclick="attTableMonthNav(1)"><i data-lucide="chevron-left" style="width:16px;height:16px;"></i></button>
    </div>
    <div class="att-table-wrap">
        <table class="att-monthly-table">
            <thead>
                <tr>
                    <th class="att-tbl-name-col">חייל</th>`;

    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const dow = new Date(dateStr + 'T12:00:00').getDay();
        const isToday = dateStr === todayStr;
        const isWeekend = dow === 5 || dow === 6;
        html += `<th class="att-tbl-day ${isToday ? 'att-tbl-today' : ''} ${isWeekend ? 'att-tbl-weekend' : ''}">
            <div>${hebDays[dow]}</div><div>${d}</div>
        </th>`;
    }
    html += `<th class="att-tbl-summary-col">%</th></tr></thead><tbody>`;

    // Soldier rows
    sorted.forEach(s => {
        let presentDays = 0;
        html += `<tr><td class="att-tbl-name-col">
            <a href="#" onclick="event.preventDefault();openSoldierProfile('${s.id}')" class="soldier-link">${esc(s.name)}</a>
            <span class="att-tbl-role">${esc(s.role || '')}</span>
        </td>`;

        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const status = data[s.id] ? data[s.id][dateStr] : 'unknown';
            const isToday = dateStr === todayStr;
            const isWeekend = new Date(dateStr + 'T12:00:00').getDay() >= 5;
            let symbol = '';
            let cls = '';

            if (status === 'present') { symbol = '✓'; cls = 'att-cell-ok'; presentDays++; }
            else if (status === 'absent') { symbol = '✗'; cls = 'att-cell-bad'; }
            else if (status === 'leave') { symbol = '⌂'; cls = 'att-cell-leave'; }
            else if (status === 'notserving') { symbol = '—'; cls = 'att-cell-ns'; }
            else { symbol = ''; cls = 'att-cell-empty'; }

            html += `<td class="att-tbl-cell ${cls} ${isToday ? 'att-tbl-today' : ''} ${isWeekend ? 'att-tbl-weekend' : ''}">${symbol}</td>`;
        }

        const pct = daysInMonth > 0 ? Math.round(presentDays / daysInMonth * 100) : 0;
        html += `<td class="att-tbl-summary-col att-tbl-pct">${pct}%</td></tr>`;
    });

    // Summary row
    html += `<tr class="att-tbl-totals"><td class="att-tbl-name-col"><strong>נוכחים</strong></td>`;
    for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const sum = daySummaries[dateStr] || { present: 0, total: 0 };
        const pct = sum.total > 0 ? Math.round(sum.present / sum.total * 100) : 0;
        const pctCls = pct >= 80 ? 'att-pct-high' : pct >= 50 ? 'att-pct-mid' : pct > 0 ? 'att-pct-low' : '';
        html += `<td class="att-tbl-cell att-tbl-total-cell ${pctCls}">${sum.present}</td>`;
    }
    html += `<td class="att-tbl-summary-col"></td></tr>`;

    html += '</tbody></table></div>';

    // Legend
    html += `<div class="att-legend">
        <span><span class="att-legend-dot att-cell-ok">✓</span> נוכח/בפעילות</span>
        <span><span class="att-legend-dot att-cell-bad">✗</span> חסר</span>
        <span><span class="att-legend-dot att-cell-leave">⌂</span> בבית/ביציאה</span>
        <span><span class="att-legend-dot att-cell-ns">—</span> לא במילואים</span>
    </div>`;

    container.innerHTML = html;
    refreshIcons();
}

// Month navigation for table view
var attendanceYear = new Date().getFullYear();
var attendanceMonth = new Date().getMonth();

function attTableMonthNav(dir) {
    attendanceMonth += dir;
    if (attendanceMonth > 11) { attendanceMonth = 0; attendanceYear++; }
    if (attendanceMonth < 0) { attendanceMonth = 11; attendanceYear--; }
    renderAttendanceTable();
}

// Toggle between report1 views — called from a button added to the Report 1 UI
function toggleReport1TableView() {
    const isTable = document.getElementById('report1Content').classList.toggle('att-table-mode');
    if (isTable) {
        renderAttendanceTable();
    } else {
        renderReport1();
    }
}
