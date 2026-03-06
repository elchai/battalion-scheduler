// ==================== DEMO CONFIG — גדוד אריות ====================

// --- Name banks for demo data generation ---
const _FIRST_NAMES = ['יוסי','דוד','משה','אבי','רון','עמית','איתי','נתן','אלון','גיל','תומר','עידן','שי','ליאור','אורן','נדב','ערן','מאור','יונתן','בן','אור','הלל','הוד','שחר','רז','נועם','יובל','עומר','דניאל','אייל','גלעד','אסף','רותם','עדי','ניר','ישי','אוהד','מתן','סתיו','נריה','חגי','ארנון','ברק','מוטי','אילן','זיו','שמעון','לוי','תמיר','עקיבא','נפתלי','צחי','קובי','אהרון','אליעד','שלומי','חיים','יניב','גדעון','דרור','ליעד','עמוס','צביקה','אריאל','נתי','אופיר','בועז','ראם','אלעד','נח','עמרי','שגיא','יפתח','ניב','איציק','עוזי','יגאל','מנחם','דורון','אילת','עודד','נועה','מיכל','הילה','יעל','טלי','שירה','דנה','רוני','ליאת','ענבל','אפרת','תמר','מירב','סיגל','אורלי','רינת','שרון','גלית','נועה','מור'];
const _LAST_NAMES = ['כהן','לוי','אברהם','ישראלי','חיימוב','שרון','גולן','ברק','כרמי','אדרי','פרץ','מזרחי','ביטון','דהן','סויסה','רוזנברג','גבע','אזולאי','פרידמן','אליהו','אוחיון','בוחבוט','דוידוב','הרשקוביץ','וינברג','חדד','טל','יוסף','כנפו','לנדאו','מלכה','נחמני','סבג','עמר','פנחס','צור','קדוש','רביב','שלם','תורג׳מן','אבוטבול','בכר','גפני','דגן','הררי','ויזל','זהבי','חן','טרבלסי','ימיני','כספי','לב','מגן','נעמן','סרוסי','עובדיה','פלד','צדוק','קורן','רז','שמש','אטיאס','בניון','גליק','דרעי','הכהן','ולנשטיין','זנו','חזן','טולדנו','יצחק','כהנוב','לביא','משיח','נגר','סימן-טוב','עזרא','פרנס','צוקרמן','קליין','רמון','שפירא'];

function _generateDemoSoldiers() {
    const soldiers = [];
    let counter = 1;
    const used = new Set();
    const usedPersonalIds = new Set();

    function makeName() {
        let name;
        do {
            const f = _FIRST_NAMES[Math.floor(Math.random() * _FIRST_NAMES.length)];
            const l = _LAST_NAMES[Math.floor(Math.random() * _LAST_NAMES.length)];
            name = f + ' ' + l;
        } while (used.has(name));
        used.add(name);
        return name;
    }

    // IDF draft cycles: March, August, November each year
    // Personal ID prefix increments each cycle: March 93=51, Aug 93=52, Nov 93=53, March 94=53, Aug 94=54...
    const draftMonths = [3, 8, 11]; // מרץ, אוגוסט, נובמבר
    const draftCycles = [];
    let prefix = 51;
    for (let year = 1993; year <= 2020; year++) {
        draftMonths.forEach((month, mi) => {
            draftCycles.push({ year, month, prefix });
            // Increment prefix: each cycle bumps by 1, but March of next year sometimes shares with prev November
            if (mi === 2) prefix++; // after November, bump for next year's March
            else prefix++;
        });
    }

    function makeDraftInfo() {
        const cycle = draftCycles[Math.floor(Math.random() * draftCycles.length)];
        return cycle;
    }

    function makePersonalId(draftInfo) {
        let pid;
        do {
            const suffix = String(10000 + Math.floor(Math.random() * 89999));
            pid = String(draftInfo.prefix) + suffix;
        } while (usedPersonalIds.has(pid));
        usedPersonalIds.add(pid);
        return pid;
    }

    function makeEnlistmentDate(draftInfo) {
        // Enlistment day varies within the draft month
        const day = 1 + Math.floor(Math.random() * 20);
        return `${draftInfo.year}-${String(draftInfo.month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    }

    function makeDischargeDate(enlistDate) {
        // Reserve service: 3 years after enlistment
        const y = parseInt(enlistDate.slice(0, 4)) + 3;
        return y + enlistDate.slice(4);
    }

    function makeId() { return '800' + String(counter++).padStart(4, '0'); }
    function makePhone() { return '050' + String(1000000 + Math.floor(Math.random() * 9000000)); }

    // Company distributions: total=512
    const companyDefs = [
        { key: 'a', total: 92, soldiersN: 74, cmdN: 12, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'b', total: 104, soldiersN: 82, cmdN: 15, offN: 7, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'c', total: 88, soldiersN: 70, cmdN: 12, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'd', total: 98, soldiersN: 78, cmdN: 14, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'hq', total: 16, soldiersN: 8, cmdN: 4, offN: 4, units: ['חפ"ק מג"ד','לשכה'] },
        { key: 'agam', total: 32, soldiersN: 24, cmdN: 4, offN: 4, units: ['קמב"צים','סמב"צים'] },
        { key: 'palsam', total: 82, soldiersN: 72, cmdN: 6, offN: 4, units: ['לוגיסטיקה','קשר','טנ"א','רפואה','מטבח','רכב'] }
    ];

    const officerRoles = ['מ"פ','סמ"פ','קצין','רס"פ'];
    const cmdRoles = ['מ"כ','מפקד','סמב"צ'];
    const soldierRoles = ['לוחם','לוחם','לוחם','נהג','קשר','חובש','לוחם','לוחם'];
    const officerRanks = ['סגן','סרן','רס"ל'];
    const cmdRanks = ['סמל','סמ"ר','רס"ל'];
    const soldierRanks = ['טוראי','טוראי','רב"ט','טוראי'];

    // Operation dates for service periods (תעסוקה מ-19.02.26)
    const opStart = '2026-02-19';
    const opEnd = '2026-04-30';
    const splitEnd1 = '2026-03-14';
    const splitStart2 = '2026-03-14';

    companyDefs.forEach(def => {
        // Officers
        for (let i = 0; i < def.offN; i++) {
            const draft = makeDraftInfo();
            const enlistDate = makeEnlistmentDate(draft);
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makePersonalId(draft),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: officerRoles[i % officerRoles.length],
                rank: officerRanks[i % officerRanks.length],
                enlistmentDate: enlistDate,
                dischargeDate: makeDischargeDate(enlistDate)
            };
            soldiers.push(s);
        }
        // Commanders
        for (let i = 0; i < def.cmdN; i++) {
            const draft = makeDraftInfo();
            const enlistDate = makeEnlistmentDate(draft);
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makePersonalId(draft),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: cmdRoles[i % cmdRoles.length],
                rank: cmdRanks[i % cmdRanks.length],
                enlistmentDate: enlistDate,
                dischargeDate: makeDischargeDate(enlistDate)
            };
            soldiers.push(s);
        }
        // Soldiers
        for (let i = 0; i < def.soldiersN; i++) {
            const draft = makeDraftInfo();
            const enlistDate = makeEnlistmentDate(draft);
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makePersonalId(draft),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: soldierRoles[i % soldierRoles.length],
                rank: soldierRanks[i % soldierRanks.length],
                enlistmentDate: enlistDate,
                dischargeDate: makeDischargeDate(enlistDate)
            };
            // ~20% of soldiers get service periods (splits)
            if (Math.random() < 0.2 && ['a','b','c','d','agam'].includes(def.key)) {
                const splitType = Math.random();
                if (splitType < 0.4) {
                    // Split 1 only
                    s.servicePeriods = [{ start: opStart, end: splitEnd1 }];
                } else if (splitType < 0.7) {
                    // Split 2 (two periods)
                    s.servicePeriods = [
                        { start: opStart, end: '2026-03-05' },
                        { start: splitStart2, end: opEnd }
                    ];
                } else {
                    // Special range
                    s.servicePeriods = [{ start: '2026-03-15', end: '2026-04-15' }];
                }
            }
            soldiers.push(s);
        }
    });

    return soldiers;
}

function _generateDemoShifts(soldiers) {
    const shifts = [];
    const shiftDefs = [
        { name: 'בוקר', start: '06:00', end: '14:00' },
        { name: 'צהריים', start: '14:00', end: '22:00' },
        { name: 'לילה', start: '22:00', end: '06:00' }
    ];

    // Task definitions matching CONFIG.companies — { perShift: {s,c,o}, shifts, time }
    const taskDefs = {
        a: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'תצפית', s: 2, c: 0, o: 0, numShifts: 3 },
            { name: 'שמירה', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'צוותי יזומות', s: 20, c: 2, o: 0, numShifts: 1, time: ['06:00','22:00'] },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1, time: ['06:00','18:00'] }
        ],
        b: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור קל', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'בונקר', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'ש.ג', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'חמל', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'כ"כ', s: 4, c: 1, o: 0, numShifts: 1 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1, time: ['06:00','22:00'] },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1, time: ['06:00','18:00'] }
        ],
        c: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור קל צפון', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'סיור קל דרום', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'הגנת מחנה', s: 2, c: 0, o: 0, numShifts: 3 },
            { name: 'כ"כ', s: 5, c: 1, o: 0, numShifts: 1 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1, time: ['06:00','22:00'] },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1, time: ['06:00','18:00'] }
        ],
        d: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'מחסום בל', s: 4, c: 1, o: 0, numShifts: 3 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1, time: ['06:00','22:00'] },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1, time: ['06:00','18:00'] }
        ],
        hq: [
            { name: 'תורנות חפ"ק', s: 2, c: 0, o: 1, numShifts: 1 },
            { name: 'קישור', s: 2, c: 0, o: 0, numShifts: 1 }
        ],
        agam: [
            { name: 'משמרת א׳', s: 2, c: 0, o: 2, numShifts: 1, time: ['06:00','14:00'] },
            { name: 'משמרת ב׳', s: 2, c: 0, o: 0, numShifts: 1, time: ['14:00','22:00'] },
            { name: 'משמרת ג׳', s: 2, c: 0, o: 0, numShifts: 1, time: ['22:00','06:00'] },
            { name: 'כונן', s: 2, c: 0, o: 0, numShifts: 1, time: ['08:00','20:00'] },
            { name: 'חמל גדודי', s: 3, c: 0, o: 0, numShifts: 1, time: ['07:00','19:00'] },
            { name: 'תקשוב', s: 2, c: 0, o: 0, numShifts: 1, time: ['07:00','19:00'] },
            { name: 'אבטחת מידע', s: 2, c: 0, o: 0, numShifts: 1, time: ['07:00','19:00'] }
        ],
        palsam: [
            { name: 'מטבח', s: 5, c: 0, o: 0, numShifts: 1, time: ['05:00','20:00'] },
            { name: 'שמירה', s: 5, c: 0, o: 0, numShifts: 3 },
            { name: 'נהיגה', s: 5, c: 0, o: 0, numShifts: 1, time: ['06:00','20:00'] },
            { name: 'תורנות', s: 3, c: 0, o: 0, numShifts: 3 },
            { name: 'אחזקה', s: 3, c: 0, o: 0, numShifts: 1, time: ['07:00','17:00'] },
            { name: 'ניקיון מחנה', s: 3, c: 0, o: 0, numShifts: 1, time: ['06:00','14:00'] },
            { name: 'הובלות', s: 2, c: 0, o: 0, numShifts: 1, time: ['07:00','19:00'] }
        ]
    };

    const baseDate = new Date('2026-02-25T00:00:00');
    for (let day = 0; day < 14; day++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + day);
        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;

        Object.keys(taskDefs).forEach(compKey => {
            const compSoldiers = soldiers.filter(s => s.company === compKey);
            const soldiersPool = compSoldiers.filter(s => ['לוחם','נהג','קשר','חובש'].includes(s.role));
            const commanders = compSoldiers.filter(s => ['מ"כ','מפקד','סמב"צ'].some(r => s.role.includes(r)));
            const officers = compSoldiers.filter(s => ['מ"פ','סמ"פ','קצין','רס"פ'].some(r => s.role.includes(r)));
            let solIdx = (day * 7) % Math.max(soldiersPool.length, 1);
            let cmdIdx = day % Math.max(commanders.length, 1);
            let offIdx = day % Math.max(officers.length, 1);

            function pickSoldiers(n) {
                const arr = [];
                for (let i = 0; i < n; i++) {
                    if (soldiersPool.length > 0) { arr.push(soldiersPool[solIdx % soldiersPool.length].id); solIdx++; }
                }
                return arr;
            }
            function pickCommanders(n) {
                const arr = [];
                for (let i = 0; i < n; i++) {
                    if (commanders.length > 0) { arr.push(commanders[cmdIdx % commanders.length].id); cmdIdx++; }
                }
                return arr;
            }
            function pickOfficers(n) {
                const arr = [];
                for (let i = 0; i < n; i++) {
                    if (officers.length > 0) { arr.push(officers[offIdx % officers.length].id); offIdx++; }
                }
                return arr;
            }

            (taskDefs[compKey] || []).forEach(task => {
                const shiftCount = task.numShifts;
                const shiftsToUse = shiftCount === 1
                    ? [{ name: 'יום', start: (task.time || ['07:00','19:00'])[0], end: (task.time || ['07:00','19:00'])[1] }]
                    : shiftDefs;

                shiftsToUse.forEach(sh => {
                    const assigned = [
                        ...pickSoldiers(task.s),
                        ...pickCommanders(task.c),
                        ...pickOfficers(task.o)
                    ];
                    shifts.push({
                        id: 'sh_demo_' + shifts.length,
                        company: compKey,
                        task: task.name,
                        date: dateStr,
                        shiftName: sh.name,
                        startTime: sh.start,
                        endTime: sh.end,
                        soldiers: assigned,
                        taskCommander: assigned[assigned.length - 1] || ''
                    });
                });
            });
        });
    }
    return shifts;
}

function _generateDemoTasks() {
    // Must match task names used in _generateDemoShifts taskDefs
    const defs = {
        a: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'תצפית', s: 2, c: 0, o: 0, numShifts: 3 },
            { name: 'שמירה', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'צוותי יזומות', s: 22, c: 2, o: 0, numShifts: 1 },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1 }
        ],
        b: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור קל', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'בונקר', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'ש.ג', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'חמל', s: 1, c: 0, o: 0, numShifts: 3 },
            { name: 'כ"כ', s: 4, c: 1, o: 0, numShifts: 1 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1 },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1 }
        ],
        c: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור קל צפון', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'סיור קל דרום', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'הגנת מחנה', s: 2, c: 0, o: 0, numShifts: 3 },
            { name: 'כ"כ', s: 5, c: 1, o: 0, numShifts: 1 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1 },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1 }
        ],
        d: [
            { name: 'חפק מפ', s: 3, c: 0, o: 1, numShifts: 1 },
            { name: 'סיור', s: 2, c: 1, o: 0, numShifts: 3 },
            { name: 'מחסום בל', s: 4, c: 1, o: 0, numShifts: 3 },
            { name: 'צוות יזומות', s: 11, c: 1, o: 0, numShifts: 1 },
            { name: 'תורן מטבח', s: 1, c: 0, o: 0, numShifts: 1 }
        ],
        hq: [
            { name: 'תורנות חפ"ק', s: 2, c: 0, o: 1, numShifts: 1 },
            { name: 'קישור', s: 2, c: 0, o: 0, numShifts: 1 }
        ],
        agam: [
            { name: 'משמרת א׳', s: 2, c: 0, o: 2, numShifts: 1 },
            { name: 'משמרת ב׳', s: 2, c: 0, o: 0, numShifts: 1 },
            { name: 'משמרת ג׳', s: 2, c: 0, o: 0, numShifts: 1 },
            { name: 'כונן', s: 2, c: 0, o: 0, numShifts: 1 }
        ],
        palsam: [
            { name: 'מטבח', s: 5, c: 0, o: 0, numShifts: 1 },
            { name: 'שמירה', s: 5, c: 0, o: 0, numShifts: 3 },
            { name: 'נהיגה', s: 5, c: 0, o: 0, numShifts: 1 },
            { name: 'תורנות', s: 3, c: 0, o: 0, numShifts: 3 },
            { name: 'אחזקה', s: 3, c: 0, o: 0, numShifts: 1 },
            { name: 'ניקיון מחנה', s: 3, c: 0, o: 0, numShifts: 1 },
            { name: 'הובלות', s: 2, c: 0, o: 0, numShifts: 1 }
        ]
    };
    const tasks = {};
    Object.entries(defs).forEach(([k, arr]) => {
        tasks[k] = arr.map(t => ({
            name: t.name,
            soldiers: t.s * t.numShifts,
            commanders: t.c * t.numShifts,
            officers: t.o * t.numShifts,
            shifts: t.numShifts,
            perShift: { soldiers: t.s, commanders: t.c, officers: t.o }
        }));
    });
    return tasks;
}

function _generateDemoRotationGroups(soldiers) {
    const groups = [];
    const compDefs = [
        { key: 'a', name: 'קבוצה א\' — פלוגה א\'', startDate: '2026-02-19', count: 14 },
        { key: 'b', name: 'קבוצה ב\' — פלוגה ב\'', startDate: '2026-02-23', count: 13 },
        { key: 'c', name: 'קבוצה ג\' — פלוגה ג\'', startDate: '2026-02-16', count: 15 },
        { key: 'd', name: 'קבוצה ד\' — פלוגה ד\'', startDate: '2026-02-25', count: 12 }
    ];
    compDefs.forEach((def, gi) => {
        const pool = soldiers.filter(s => s.company === def.key && !s.notArrived
            && ['לוחם','נהג','קשר','חובש'].some(r => (s.role || '').includes(r)));
        const selected = pool.slice(0, Math.min(def.count, pool.length)).map(s => s.id);
        if (selected.length > 0) {
            groups.push({
                id: 'rot_demo_' + gi,
                name: def.name,
                startDate: def.startDate,
                daysIn: 10,
                daysOut: 4,
                soldiers: selected
            });
        }
    });
    return groups;
}

function _generateDemoAnnouncements() {
    const now = Date.now();
    const DAY = 86400000;
    return [
        {
            id: 'ann_demo_1',
            title: 'פקודת מבצע — תעסוקה מבצעית 2026',
            body: 'הגדוד ממשיך בתעסוקה מבצעית במרחב יהודה ושומרון.\nמפקדי הפלוגות יוודאו עדכון סידור עבודה יומי עד 20:00.\nדגשים: הקפדה על נהלי פתיחת אש, דיווח אירועים מיידי לחמ"ל.',
            priority: 'pinned',
            author: 'מג"ד',
            timestamp: now - 5 * DAY
        },
        {
            id: 'ann_demo_2',
            title: 'דיווח מצב כוח — עדכון יומי',
            body: 'מצב כוח נכון לבוקר:\nפלוגה א\' — 3 חיילים בחופשה, קבוצה א\' בימי מנוחה\nפלוגה ב\' — כוח מלא\nפלוגה ג\' — 2 חיילים בחופשת מחלה\nפלוגה ד\' — כוח מלא\n\nנדרש: השלמת 2 חיילים ליזומות בפלוגה א\'.',
            priority: 'urgent',
            author: 'קמב"צ',
            timestamp: now - 2 * 3600000
        },
        {
            id: 'ann_demo_3',
            title: 'שינוי סידור משמרות — פלוגה ב\'',
            body: 'עקב מעבר חייל לחופשה, סיור קל של הצהריים עודכן.\nהחלפה: שגב כהן במקום עומר לוי.\nנא לעדכן את החיילים בהתאם.',
            priority: 'normal',
            author: 'מ"פ פלוגה ב\'',
            timestamp: now - 1 * DAY
        },
        {
            id: 'ann_demo_4',
            title: 'תזכורת: מטווח איפוס ביום ראשון',
            body: 'מטווח איפוס נשק יתקיים ביום ראשון 09.03 בין 07:00-14:00.\nכל חייל שלא ביצע מטווח ב-6 חודשים אחרונים חייב להשתתף.\nציוד נדרש: אפוד, קסדה, 3 מחסניות.\nרכזי אימונים — שלחו רשימות עד יום חמישי.',
            priority: 'normal',
            author: 'קצין אימונים',
            timestamp: now - 3 * DAY
        },
        {
            id: 'ann_demo_5',
            title: 'עדכון ציוד — חלוקת אפודים חדשים',
            body: 'הגיעה אספקה של 40 אפודי מגן חדשים.\nחלוקה תתבצע דרך פלס"ם לפי סדר עדיפות:\n1. פלוגות קרביות\n2. חפ"קים ואג"מ\n\nמ"פים — שלחו רשימות שמיות לרס"פ.',
            priority: 'normal',
            author: 'רס"פ',
            timestamp: now - 4 * DAY
        },
        {
            id: 'ann_demo_6',
            title: 'נהלי חירום — מספרי טלפון חשובים',
            body: 'חמ"ל גדודי: 02-5555001\nחמ"ל אוגדה: 02-5555100\nמוקד רפואי: 02-5555200\nקב"ט מרחב: 02-5555300\n\nבכל אירוע חריג — דיווח מיידי לחמ"ל!',
            priority: 'pinned',
            author: 'מג"ד',
            timestamp: now - 6 * DAY
        }
    ];
}

function _generateDemoLeaves(soldiers) {
    const leaves = [];
    const companies = ['a','b','c','d','hq','agam','palsam'];
    const activeReasons = ['חופשה','סיבה רפואית','אירוע משפחתי','אישי'];
    const approvers = ['מ"פ','סמ"פ','רס"פ'];
    let lvId = 0;

    // Group 1: ~8% currently on leave (covers today 2026-03-04)
    // ~5-8 per combat company, 1-2 per hq/agam, 3-4 per palsam
    const leavePerComp = { a: 7, b: 8, c: 6, d: 7, hq: 2, agam: 3, palsam: 4 };
    companies.forEach(comp => {
        const compSoldiers = soldiers.filter(s => s.company === comp);
        const pool = compSoldiers.filter(s => !['מ"פ','סמ"פ','קצין'].some(r => (s.role||'').includes(r)));
        const count = Math.min(leavePerComp[comp] || 4, pool.length);
        for (let i = 0; i < count; i++) {
            const startDay = 1 + (i % 4); // March 1-4
            const endDay = 5 + (i % 4);   // March 5-8
            leaves.push({
                id: 'lv_demo_' + (lvId++),
                soldierId: pool[i].id,
                startDate: `2026-03-${String(startDay).padStart(2,'0')}`,
                startTime: ['08:00','14:00','06:00'][i % 3],
                endDate: `2026-03-${String(endDay).padStart(2,'0')}`,
                endTime: '14:00',
                reason: activeReasons[i % activeReasons.length],
                approvedBy: approvers[i % 3]
            });
        }
    });

    // Group 2: ~3% did not arrive to מילואים (from start of operation, no real end)
    const noShowPerComp = { a: 4, b: 5, c: 3, d: 4, hq: 0, agam: 1, palsam: 2 };
    companies.forEach(comp => {
        const compSoldiers = soldiers.filter(s => s.company === comp);
        const pool = compSoldiers.filter(s =>
            !['מ"פ','סמ"פ','קצין','מ"כ'].some(r => (s.role||'').includes(r)) &&
            !leaves.some(l => l.soldierId === s.id)
        );
        const count = Math.min(noShowPerComp[comp] || 0, pool.length);
        for (let i = 0; i < count; i++) {
            leaves.push({
                id: 'lv_demo_' + (lvId++),
                soldierId: pool[pool.length - 1 - i].id, // take from end of pool
                startDate: '2026-02-19',
                startTime: '06:00',
                endDate: '2026-04-30',
                endTime: '23:59',
                reason: 'לא הגיע',
                approvedBy: 'מערכת'
            });
        }
    });

    // Group 3: ~15 past leaves (already returned) for history
    const pastPool = soldiers.filter(s => !leaves.some(l => l.soldierId === s.id));
    for (let i = 0; i < 15 && i < pastPool.length; i++) {
        const startDay = 20 + (i % 7);
        leaves.push({
            id: 'lv_demo_' + (lvId++),
            soldierId: pastPool[i * 3].id,
            startDate: `2026-02-${String(startDay).padStart(2,'0')}`,
            startTime: '08:00',
            endDate: `2026-03-${String(1 + (i % 2)).padStart(2,'0')}`,
            endTime: '14:00',
            reason: activeReasons[i % activeReasons.length],
            approvedBy: approvers[i % 3]
        });
    }

    return leaves;
}

function _generateDemoTraining(soldiers) {
    const training = [];

    // --- Base completion rates per training type (realistic for reserve battalion) ---
    const baseRates = {
        squad_open: 0.73,        // תרגיל כיתה שטח פתוח - harder to organize
        squad_urban: 0.64,       // תרגיל כיתה שטח בנוי - requires special facilities
        advanced_shooting: 0.81, // אימון ירי מתקדם - high priority, done early
        grenade: 0.45,           // אימון זריקת רימון - limited availability, dangerous
        weapon_zero: 0.92        // בקרת איפוס נשק - basic requirement, almost everyone
    };

    // --- Per-company variance (makes each company look different) ---
    // Offsets added to base rate per company (clamped 0-1)
    const companyOffsets = {
        a:     { squad_open: +0.05, squad_urban: -0.04, advanced_shooting: +0.08, grenade: +0.03, weapon_zero: +0.03 },
        b:     { squad_open: -0.03, squad_urban: +0.07, advanced_shooting: -0.02, grenade: +0.08, weapon_zero: +0.02 },
        c:     { squad_open: +0.02, squad_urban: +0.03, advanced_shooting: -0.06, grenade: -0.05, weapon_zero: -0.01 },
        d:     { squad_open: -0.06, squad_urban: -0.03, advanced_shooting: +0.04, grenade: +0.10, weapon_zero: +0.01 },
        hq:    { squad_open: +0.10, squad_urban: +0.10, advanced_shooting: +0.05, grenade: -0.08, weapon_zero: +0.05 },
        agam:  { squad_open: -0.08, squad_urban: -0.10, advanced_shooting: -0.04, grenade: -0.12, weapon_zero: +0.02 }
    };

    // Palsam weapon_zero rate
    const palsamWeaponZeroRate = 0.88;

    // Combat training types (everything except weapon_zero)
    const combatTypes = ['squad_open', 'squad_urban', 'advanced_shooting', 'grenade'];

    // Simple deterministic hash for consistent per-soldier results
    function soldierHash(id, salt) {
        let h = salt || 0;
        for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
        return (Math.abs(h) % 1000) / 1000;
    }

    soldiers.forEach(s => {
        const isPalsam = s.company === 'palsam';

        if (isPalsam) {
            // Palsam soldiers ONLY get weapon_zero, nothing else
            if (soldierHash(s.id, 7) < palsamWeaponZeroRate) {
                training.push({ soldierId: s.id, typeId: 'weapon_zero', done: true, date: '2026-02-17' });
            }
            return; // Skip all combat training for palsam
        }

        // --- Combat soldiers (a, b, c, d, hq, agam) ---
        const offsets = companyOffsets[s.company] || {};

        combatTypes.forEach(typeId => {
            const rate = Math.min(1, Math.max(0, baseRates[typeId] + (offsets[typeId] || 0)));
            if (soldierHash(s.id, typeId.length * 13) < rate) {
                training.push({ soldierId: s.id, typeId, done: true });
            }
        });

        // weapon_zero: date-based, high completion
        const wzRate = Math.min(1, Math.max(0, baseRates.weapon_zero + (offsets.weapon_zero || 0)));
        if (soldierHash(s.id, 99) < wzRate) {
            training.push({ soldierId: s.id, typeId: 'weapon_zero', done: true, date: '2026-02-17' });
        }
    });

    return training;
}

function _generateDemoConstraints(soldiers) {
    const constraints = [];
    const pool = soldiers.filter(s => ['a','b','c','d','agam','palsam'].includes(s.company));
    const reasons = ['בדיקה רפואית','משפט','תורנות אחרת','אילוץ אישי','קורס','ליווי משפחתי','בדיקת שמיעה','פגישה עם מח"ט'];
    for (let i = 0; i < 18; i++) {
        const s = pool[(i * 29) % pool.length]; // deterministic spread
        const startDay = 19 + (i % 10);
        const duration = 1 + (i % 3);
        const startMonth = startDay > 28 ? '03' : '02';
        const startDayStr = startDay > 28 ? String(startDay - 28).padStart(2,'0') : String(startDay).padStart(2,'0');
        const endDay = startDay + duration;
        const endMonth = endDay > 28 ? '03' : '02';
        const endDayStr = endDay > 28 ? String(endDay - 28).padStart(2,'0') : String(endDay).padStart(2,'0');
        constraints.push({
            id: 'con_demo_' + i,
            soldierId: s.id,
            startDate: `2026-${startMonth}-${startDayStr}`,
            endDate: `2026-${endMonth}-${endDayStr}`,
            reason: reasons[i % reasons.length],
            createdBy: ['מ"פ','סמ"פ','רס"פ','מנהל'][i % 4]
        });
    }
    return constraints;
}

// --- Generate realistic scribble signature on offscreen canvas ---
function _generateDemoSignature(seed) {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#2563eb';

    // Simple seeded random
    let _s = seed || 1;
    function rng() { _s = (_s * 16807 + 0) % 2147483647; return (_s & 0x7fffffff) / 2147483647; }

    // Draw 2-4 connected stroke segments like a real signature
    const strokes = 2 + Math.floor(rng() * 3);
    let x = 20 + rng() * 40;
    let y = 30 + rng() * 30;

    for (let s = 0; s < strokes; s++) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        const points = 3 + Math.floor(rng() * 5);
        for (let p = 0; p < points; p++) {
            const cpx1 = x + (rng() * 60 - 10);
            const cpy1 = y + (rng() * 50 - 25);
            x = Math.min(280, x + 15 + rng() * 40);
            y = 20 + rng() * 60;
            const cpx2 = x - (rng() * 30);
            const cpy2 = y + (rng() * 40 - 20);
            ctx.bezierCurveTo(cpx1, cpy1, cpx2, cpy2, x, y);
        }
        ctx.stroke();
        // Small gap between strokes
        if (s < strokes - 1) {
            x += rng() * 10;
            y = 30 + rng() * 40;
        }
    }

    // Add a small underline flourish
    if (rng() > 0.4) {
        ctx.beginPath();
        ctx.moveTo(20 + rng() * 30, 75 + rng() * 10);
        ctx.lineTo(80 + rng() * 120, 78 + rng() * 8);
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }

    return canvas.toDataURL('image/png');
}

function _generateDemoEquipment(soldiers) {
    const personalEquipment = [];
    let piCounter = 1;

    // Combat soldier base items (סט לוחם)
    const combatItems = [
        { name: 'נשק M4', quantity: 1, category: 'נשק', requiresSerial: true },
        { name: 'כוונת טריג\'יקון', quantity: 1, category: 'אופטיקה', requiresSerial: true },
        { name: 'מחסנית', quantity: 7, category: 'נשק', requiresSerial: false },
        { name: 'אפוד טקטי', quantity: 1, category: 'מגן', requiresSerial: false },
        { name: 'קסדה', quantity: 1, category: 'מגן', requiresSerial: true },
        { name: 'מסכת אב"כ', quantity: 1, category: 'מגן', requiresSerial: true },
        { name: 'חולצת ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'מכנסי ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'נעליים', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'חגורה צבאית', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'שק שינה', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'בקבוק שתייה', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false }
    ];

    // Commander extra items
    const cmdExtraItems = [
        { name: 'כוונת השלכה מפרולייט', quantity: 1, category: 'אופטיקה', requiresSerial: true },
        { name: 'משקפת שדה', quantity: 1, category: 'אופטיקה', requiresSerial: true }
    ];

    // PALSAM items (נשק + מחסנית + מדים + נעליים + חגורה)
    const palsamItems = [
        { name: 'נשק M16', quantity: 1, category: 'נשק', requiresSerial: true },
        { name: 'מחסנית', quantity: 3, category: 'נשק', requiresSerial: false },
        { name: 'חולצת ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'מכנסי ב\'', quantity: 2, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'נעליים', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false },
        { name: 'חגורה צבאית', quantity: 1, category: 'לוגיסטיקה', requiresSerial: false }
    ];

    function makeSerial() { return String(990000 + Math.floor(Math.random() * 10000)); }

    const sigIssuers = [
        { first: 'יוסי', last: 'כהן' },
        { first: 'משה', last: 'לוי' },
        { first: 'דוד', last: 'ברק' }
    ];

    soldiers.forEach((s, idx) => {
        const isPalsam = s.company === 'palsam';
        const isCombat = ['a','b','c','d'].includes(s.company);
        const isCmd = ['מ"כ','מפקד','סמב"צ','מ"פ','סמ"פ','קצין','רס"פ'].some(r => s.role.includes(r));

        let itemTemplates;
        if (isPalsam) {
            itemTemplates = palsamItems;
        } else if (isCombat) {
            itemTemplates = isCmd ? [...combatItems, ...cmdExtraItems] : combatItems;
        } else {
            itemTemplates = isCmd ? [...combatItems, ...cmdExtraItems] : combatItems;
        }

        const issuer = sigIssuers[idx % sigIssuers.length];
        // 80% signed, 20% unsigned
        const isSigned = (idx % 5 !== 0);
        // Generate unique scribble signatures per soldier
        const soldierSigImg = isSigned ? _generateDemoSignature(idx * 7 + 3) : null;
        const issuerSigImg = isSigned ? _generateDemoSignature(idx * 13 + 97) : null;

        const items = itemTemplates.map((item, ii) => {
            // For unsigned soldiers: items stay 'pending'
            // For signed: ~10% exchanged, ~5% missing, rest issued
            let status = 'pending';
            if (isSigned) {
                status = 'issued';
                const itemSeed = idx * 100 + ii;
                if (itemSeed % 20 === 0) status = 'exchanged';
                else if (itemSeed % 20 === 1) status = 'missing';
            }

            return {
                itemId: 'pi_' + (piCounter++),
                name: item.name,
                quantity: item.quantity,
                category: item.category,
                requiresSerial: item.requiresSerial,
                serialNumber: item.requiresSerial ? makeSerial() : '',
                source: 'base',
                status,
                issuedQuantity: isSigned ? item.quantity : 0,
                linkedEquipmentIds: [],
                issuedDate: isSigned ? '2026-02-19T08:00:00.000Z' : null,
                returnedDate: status === 'exchanged' ? '2026-02-28T12:00:00.000Z' : null,
                notes: status === 'exchanged' ? 'הוחלף עקב תקלה' : status === 'missing' ? 'דווח חסר' : ''
            };
        });

        const history = [{ date: '2026-02-19T08:00:00.000Z', action: 'created', details: 'ציוד הונפק' }];
        if (isSigned) history.push({ date: '2026-02-19T10:00:00.000Z', action: 'signed', details: 'חתימה על ציוד' });
        if (items.some(it => it.status === 'exchanged')) history.push({ date: '2026-02-28T12:00:00.000Z', action: 'exchange', details: 'החלפת פריט' });

        personalEquipment.push({
            id: 'pe_demo_' + idx,
            soldierId: s.id,
            generatedDate: '2026-02-19T08:00:00.000Z',
            roleSetId: isCmd ? 'rs_commander' : null,
            items,
            bulkSignature: isSigned ? {
                signed: true,
                signatureImg: soldierSigImg,
                signedDate: '2026-02-19T10:00:00.000Z',
                issuedBy: issuer.first + ' ' + issuer.last,
                issuerFirstName: issuer.first,
                issuerLastName: issuer.last,
                signingUnit: 'פלוגת פלס"ם',
                issuerSignatureImg: issuerSigImg
            } : { signed: false },
            history
        });
    });

    return personalEquipment;
}

function _generateDemoSignatureLog(soldiers) {
    const log = [];
    // 10 transfer/exchange entries
    const combatPool = soldiers.filter(s => ['a','b','c','d'].includes(s.company));
    const weaponTypes = ['M4','M4','M16','M4','נגב','M4','M4','MAG','M4','M4'];
    for (let i = 0; i < 10; i++) {
        const fromSoldier = combatPool[(i * 17) % combatPool.length];
        const toSoldier = combatPool[(i * 17 + 5) % combatPool.length];
        const serial = String(990000 + i * 137);
        const day = 20 + (i % 8);
        const dateStr = `2026-02-${String(day).padStart(2,'0')}T${String(8 + i).padStart(2,'0')}:00:00.000Z`;
        // Return from source
        log.push({
            id: 'sig_demo_ret_' + i,
            type: 'return',
            equipId: 'eq_demo_' + i,
            equipType: weaponTypes[i],
            equipSerial: serial,
            equipItems: [{ equipId: 'eq_demo_' + i, equipType: weaponTypes[i], equipSerial: serial, equipQty: 1 }],
            soldierId: fromSoldier.id,
            soldierName: fromSoldier.name,
            soldierPhone: fromSoldier.phone || '',
            soldierPersonalId: fromSoldier.personalId || '',
            date: dateStr,
            signatureImg: _generateDemoSignature(i * 11 + 41),
            issuedBy: 'רס"פ',
            issuerUnit: fromSoldier.company,
            issuerRole: 'רס"פ',
            issuerPersonalId: '',
            notes: 'החלפת חתימה'
        });
        // Assign to target
        log.push({
            id: 'sig_demo_asgn_' + i,
            type: 'assign',
            equipId: 'eq_demo_' + i,
            equipType: weaponTypes[i],
            equipSerial: serial,
            equipItems: [{ equipId: 'eq_demo_' + i, equipType: weaponTypes[i], equipSerial: serial, equipQty: 1 }],
            soldierId: toSoldier.id,
            soldierName: toSoldier.name,
            soldierPhone: toSoldier.phone || '',
            soldierPersonalId: toSoldier.personalId || '',
            date: dateStr,
            signatureImg: _generateDemoSignature(i * 19 + 73),
            issuedBy: 'רס"פ',
            issuerUnit: toSoldier.company,
            issuerRole: 'רס"פ',
            issuerPersonalId: '',
            notes: 'החלפת חתימה'
        });
    }
    return log;
}

function _generateDemoWeaponsData(soldiers) {
    const weaponsData = [];
    const cities = ['ירושלים','תל אביב','חיפה','באר שבע','נתניה','פתח תקווה','ראשון לציון','אשדוד','הרצליה','רעננה','כפר סבא','מודיעין','רמת גן','גבעתיים','חולון'];
    const streets = ['הרצל','ז\'בוטינסקי','בן גוריון','ויצמן','רוטשילד','אלנבי','דיזנגוף','בגין','רבין','שמעון פרס'];
    const cmdNames = { a: 'דוד כהן', b: 'ניר גולן', c: 'משה לוי', d: 'יוסי ברק', hq: 'אבי שמש', agam: 'רון דגן' };
    const cmdRanks = { a: 'סרן', b: 'סרן', c: 'סרן', d: 'רס"ן', hq: 'סגן', agam: 'סגן' };

    // ~60% of combat soldiers have completed weapons forms
    const combatSoldiers = soldiers.filter(s => ['a','b','c','d','hq','agam'].includes(s.company));
    combatSoldiers.forEach((s, idx) => {
        if (idx % 5 >= 3) return; // ~60%
        const nameParts = s.name.split(' ');

        weaponsData.push({
            soldierId: s.id,
            company: s.company,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            idNumber: s.personalId || '',
            personalNum: s.personalId || '',
            birthYear: String(s.enlistmentDate ? parseInt(s.enlistmentDate.slice(0,4)) - 18 : 1985 + (idx % 20)),
            fatherName: _FIRST_NAMES[(idx * 7) % _FIRST_NAMES.length],
            street: streets[idx % streets.length],
            houseNum: String(1 + (idx % 50)),
            city: cities[idx % cities.length],
            postalCode: String(1000000 + (idx * 137) % 9000000),
            phone: s.phone || '',
            landline: idx % 5 === 0 ? '0' + (2 + (idx % 7)) + '-' + String(1000000 + idx * 111).slice(0,7) : '',
            personalWeaponSource: idx % 20 === 0 ? 'צה"ל' : '',
            rangeDate: idx % 20 === 0 ? '2025-' + String(6 + (idx % 4)).padStart(2,'0') + '-15'
                     : '2026-02-' + String(1 + (idx % 28)).padStart(2,'0'),
            enlistmentDate: s.enlistmentDate || '2010-03-01',
            dischargeDate: s.dischargeDate || '2013-03-01',
            medicalApprovalDate: '2026-01-' + String(1 + (idx % 28)).padStart(2,'0'),
            rank: s.rank || '',
            combatCertified: idx % 8 !== 0,
            idPhoto: idx % 3 === 0 ? null : _generateDemoSignature(idx * 23 + 151),
            doctorApproval: idx % 4 === 0 ? null : _generateDemoSignature(idx * 29 + 199),
            cmdName: cmdNames[s.company] || 'מפקד',
            cmdRank: cmdRanks[s.company] || 'סרן',
            cmdId: String(100000 + idx),
            cmdRole: 'מ"פ ' + (s.company === 'hq' ? 'חפ"ק' : s.company === 'agam' ? 'אג"מ' : s.company + '\''),
            cmdSig: idx % 5 === 0 ? null : _generateDemoSignature(idx * 31 + 257),
            cmdDate: '2026-02-19',
            lastUpdated: '2026-02-19T10:00:00',
            source: 'app'
        });
    });
    return weaponsData;
}

function _generateDemoInventory(soldiers) {
    const equipment = [];
    let eqCounter = 1;

    function makeEqId() { return 'eq_demo_inv_' + (eqCounter++); }

    // Weapons in battalion warehouse (unassigned)
    const warehouseWeapons = [
        { type: 'M4', count: 8, category: 'נשק' },
        { type: 'M16', count: 5, category: 'נשק' },
        { type: 'נגב', count: 3, category: 'נשק' },
        { type: 'MAG', count: 2, category: 'נשק' },
        { type: 'כוונת טריג\'יקון', count: 6, category: 'אופטיקה' },
        { type: 'כוונת מפרולייט', count: 4, category: 'אופטיקה' },
        { type: 'משקפת שדה', count: 3, category: 'אופטיקה' },
        { type: 'אקילה', count: 2, category: 'אופטיקה' },
        { type: 'קסדה', count: 10, category: 'מגן' },
        { type: 'אפוד טקטי', count: 8, category: 'מגן' },
        { type: 'מסכת אב"כ', count: 6, category: 'מגן' }
    ];

    warehouseWeapons.forEach(w => {
        for (let i = 0; i < w.count; i++) {
            equipment.push({
                id: makeEqId(),
                type: w.type,
                serial: String(880000 + eqCounter * 7),
                company: '',
                condition: 'תקין',
                category: w.category,
                defaultQty: 1,
                notes: '',
                warehouse: 'מחסן גדודי',
                holderId: null,
                holderName: '',
                holderPhone: '',
                assignedDate: null,
                signatureImg: null
            });
        }
    });

    // Some equipment assigned to soldiers (from combat companies)
    const combatSoldiers = soldiers.filter(s => ['a','b','c','d'].includes(s.company));
    const assignedTypes = ['M4','M4','M16','M4','נגב'];
    for (let i = 0; i < 25; i++) {
        const s = combatSoldiers[(i * 13) % combatSoldiers.length];
        equipment.push({
            id: makeEqId(),
            type: assignedTypes[i % assignedTypes.length],
            serial: String(870000 + i * 11),
            company: s.company,
            condition: 'תקין',
            category: 'נשק',
            defaultQty: 1,
            notes: '',
            warehouse: 'מחסן גדודי',
            holderId: s.id,
            holderName: s.name,
            holderPhone: s.phone || '',
            assignedDate: '2026-02-19',
            signatureImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'
        });
    }

    // Brigade warehouse items
    const brigadeItems = [
        { type: 'M4', count: 4, category: 'נשק' },
        { type: 'MAG', count: 2, category: 'נשק' },
        { type: 'אקילה', count: 2, category: 'אופטיקה' }
    ];
    brigadeItems.forEach(w => {
        for (let i = 0; i < w.count; i++) {
            equipment.push({
                id: makeEqId(),
                type: w.type,
                serial: String(860000 + eqCounter * 3),
                company: '',
                condition: 'תקין',
                category: w.category,
                defaultQty: 1,
                notes: '',
                warehouse: 'מחסן חטיבה',
                holderId: null,
                holderName: '',
                holderPhone: '',
                assignedDate: null,
                signatureImg: null
            });
        }
    });

    return equipment;
}

function _generateDemoEasyDoCompletions(soldiers) {
    // ~55% of combat soldiers completed EasyDo forms
    const completions = [];
    const combatSoldiers = soldiers.filter(s => ['a','b','c','d','hq','agam'].includes(s.company));
    combatSoldiers.forEach((s, idx) => {
        if (idx % 9 >= 5) return; // ~55%
        const day = 1 + (idx % 28);
        const month = idx % 3 === 0 ? '01' : '02';
        completions.push({
            name: s.name,
            company: s.company,
            completedAt: `2026-${month}-${String(day).padStart(2,'0')} ${String(8 + (idx % 10)).padStart(2,'0')}:${String(idx % 60).padStart(2,'0')}`
        });
    });
    return completions;
}

// Build seed data
const _demoSoldiers = _generateDemoSoldiers();
const _demoShifts = _generateDemoShifts(_demoSoldiers);
const _demoTasks = _generateDemoTasks();
const _demoLeaves = _generateDemoLeaves(_demoSoldiers);
const _demoTraining = _generateDemoTraining(_demoSoldiers);
const _demoConstraints = _generateDemoConstraints(_demoSoldiers);
const _demoEquipment = _generateDemoEquipment(_demoSoldiers);
const _demoSignatureLog = _generateDemoSignatureLog(_demoSoldiers);
const _demoWeaponsData = _generateDemoWeaponsData(_demoSoldiers);
const _demoInventory = _generateDemoInventory(_demoSoldiers);
const _demoRotationGroups = _generateDemoRotationGroups(_demoSoldiers);
const _demoAnnouncements = _generateDemoAnnouncements();
const _demoEasyDoCompletions = _generateDemoEasyDoCompletions(_demoSoldiers);

const CONFIG = {
    // --- זהות ---
    battalionName: 'גדוד אריות',
    battalionId: 'demo',
    systemTitle: 'מערכת ניהול גדודי',
    systemSubtitle: 'תעסוקה מבצעית',
    divisionName: 'אוגדה 99',
    serviceType: 'מילואים',

    // --- כניסה ---
    password: 'demo',
    adminName: 'רון כהן',
    isDemo: true,
    skipPassword: true,
    collectVisitorData: true,
    visitorCollection: 'demo-visitors',

    // --- Green API (WhatsApp auto-message to demo visitors) ---
    greenApi: {
        idInstance: '1101817056',
        apiTokenInstance: 'faebc932e6514a8eb5695d9a57aad22821fb37d36145468098',
        apiUrl: 'https://api.green-api.com'
    },

    // --- Firebase (same project, separate collection) ---
    firebase: {
        apiKey: "AIzaSyCFs1YrTTRU6TQlzkkqmUASh8y6zq5VNKM",
        authDomain: "battalion-scheduler.firebaseapp.com",
        projectId: "battalion-scheduler",
        storageBucket: "battalion-scheduler.firebasestorage.app",
        messagingSenderId: "782286427873",
        appId: "1:782286427873:web:385fa860253eedd8d909a0",
        measurementId: "G-WWXZCY49E1"
    },
    firebaseEnabled: false,
    firestoreCollection: 'battalion-demo',

    // --- Google Sheets (empty — demo uses seed data) ---
    sheetId: '',

    // --- נתיבים ---
    deployPath: '/battalion-scheduler/demo',
    logoPath: 'demo/logo.png',
    loginLogoPath: 'demo/logo-login.png',
    docLogoPath: 'demo/doc-logo.png',
    stampPath: 'demo/stamp.png',

    // --- localStorage (separate prefix to avoid collisions) ---
    storagePrefix: 'battalionDemo',

    // --- פלוגות ---
    companies: {
        a: {
            name: "פלוגה א'", location: 'בסיס צפון', baseName: 'בסיס צפון', forecast: 90,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: "פלוגה א'",
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'תצפית', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'שמירה', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 30, commanders: 4, officers: 1 }
        },
        b: {
            name: "פלוגה ב'", location: 'בסיס מרכז', baseName: 'בסיס מרכז', forecast: 100,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: "פלוגה ב'",
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'מחסום', soldiers: 9, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 1, officers: 0 } },
                { name: 'חמל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'בונקר', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'ש.ג', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 39, commanders: 7, officers: 1 }
        },
        c: {
            name: "פלוגה ג'", location: 'בסיס דרום', baseName: 'בסיס דרום', forecast: 85,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: "פלוגה ג'",
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור צפון', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'סיור דרום', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'הגנת מחנה', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 33, commanders: 7, officers: 1 }
        },
        d: {
            name: "פלוגה ד'", location: 'בסיס מערב', baseName: 'בסיס מערב', forecast: 95,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: "פלוגה ד'",
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'מחסום', soldiers: 12, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 33, commanders: 7, officers: 1 }
        },
        hq: {
            name: 'חפ"קים', location: 'מפקדה', baseName: 'בסיס מרכז',
            units: ['חפ"ק מג"ד', 'לשכה'],
            tasks: [],
            totals: { soldiers: 0, commanders: 0, officers: 0 }
        },
        agam: {
            name: 'אג"מ', location: 'מפקדה', baseName: 'בסיס מרכז',
            units: ['קמב"צים', 'סמב"צים'],
            tasks: [
                { name: 'משמרת א׳', soldiers: 2, commanders: 0, officers: 2, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 2 } },
                { name: 'משמרת ב׳', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'משמרת ג׳', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'כונן', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 0, commanders: 0, officers: 0 }
        },
        palsam: {
            name: 'פלס"ם', location: 'פלוגת סיוע', baseName: 'בסיס מרכז',
            units: ['לוגיסטיקה', 'קשר', 'טנ"א', 'רפואה', 'מטבח', 'רכב'],
            tasks: [
                { name: 'מטבח', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'שמירה', soldiers: 5, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'נהיגה', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'תורנות', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 18, commanders: 0, officers: 0 }
        }
    },
    combatCompanies: ['a', 'b', 'c', 'd'],

    departmentToCompany: {
        'חפ"ק מג"ד': 'hq',
        'לשכה': 'hq',
        'אג"מ': 'agam',
        'מחלקת משא"ן': 'palsam',
        'מפקדת הפלס"ם': 'palsam',
        'פלגת הספקה': 'palsam',
        'פלגת הפינוי': 'palsam',
        'פלגת טנ"א': 'palsam',
        'פלגת רפואה': 'palsam'
    },

    // --- נשקים ---
    weaponsSheetId: '',
    weaponsDoctorFormUrl: 'https://example.com/demo-doctor-form',
    weaponsEasyDoLinks: {
        a: 'https://example.com/demo-easydo/a',
        b: 'https://example.com/demo-easydo/b',
        c: 'https://example.com/demo-easydo/c',
        d: 'https://example.com/demo-easydo/d',
        palsam: 'https://example.com/demo-easydo/palsam',
        hq: 'https://example.com/demo-easydo/hq',
        agam: 'https://example.com/demo-easydo/agam',
        battalion: 'https://example.com/demo-easydo/battalion',
    },

    // --- תפקידים ---
    signingRoles: ['רס"פ', 'סרס"פ', 'סמ"ח', 'מ"כ', 'מ"פ', 'סמ"פ'],
    warehouses: ['מחסן גדודי', 'מחסן חטיבה', 'מחסן אוגדה'],
    defaultWarehouse: 'מחסן גדודי',
    defaultWeaponType: 'M-16',
    defaultSigningUnit: 'פלוגת פלס"ם',

    // --- קרדיט ---
    developerName: 'אלחי פיין',
    developerPhone: '972542012000',
    developerPhoneDisplay: '054-2012000',

    // --- הגדרות דמו (override settings) ---
    demoSettings: {
        operationStartDate: '2026-02-19',
        operationStartTime: '14:00',
        operationEndDate: '2026-04-30',
        operationEndTime: '14:00',
        rotationDaysIn: 10,
        rotationDaysOut: 4,
        closedDays: ['שישי', 'שבת']
    },

    // --- נתוני דמו ---
    demoSeedVersion: 16,
    demoSeedData: {
        soldiers: _demoSoldiers,
        shifts: _demoShifts,
        leaves: _demoLeaves,
        training: _demoTraining,
        constraints: _demoConstraints,
        personalEquipment: _demoEquipment,
        signatureLog: _demoSignatureLog,
        weaponsData: _demoWeaponsData,
        equipment: _demoInventory,
        tasks: _demoTasks,
        rotationGroups: _demoRotationGroups,
        announcements: _demoAnnouncements,
        easyDoCompletions: _demoEasyDoCompletions
    }
};

// --- Helper functions ---
function compName(key) { return CONFIG.companies[key]?.name || key; }
function getCompNames() {
    const m = {};
    for (const [k, v] of Object.entries(CONFIG.companies)) m[k] = v.name;
    m.gdudi = 'גדודי';
    return m;
}
function allCompanyKeys() { return Object.keys(CONFIG.companies); }
