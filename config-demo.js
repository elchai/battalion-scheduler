// ==================== DEMO CONFIG — גדוד אריות ====================

// --- Name banks for demo data generation ---
const _FIRST_NAMES = ['יוסי','דוד','משה','אבי','רון','עמית','איתי','נתן','אלון','גיל','תומר','עידן','שי','ליאור','אורן','נדב','ערן','מאור','יונתן','בן','אור','הלל','הוד','שחר','רז','נועם','יובל','עומר','דניאל','אייל','גלעד','אסף','רותם','עדי','ניר','ישי','אוהד','מתן','סתיו','נריה','חגי','ארנון','ברק','מוטי','אילן','זיו','שמעון','לוי','תמיר','עקיבא','נפתלי','צחי','קובי','אהרון','אליעד','שלומי','חיים','יניב','גדעון','דרור','ליעד','עמוס','צביקה','אריאל','נתי','אופיר','בועז','ראם','אלעד','נח','עמרי','שגיא','יפתח','ניב','איציק','עוזי','יגאל','מנחם','דורון','אילת','עודד','נועה','מיכל','הילה','יעל','טלי','שירה','דנה','רוני','ליאת','ענבל','אפרת','תמר','מירב','סיגל','אורלי','רינת','שרון','גלית','נועה','מור'];
const _LAST_NAMES = ['כהן','לוי','אברהם','ישראלי','חיימוב','שרון','גולן','ברק','כרמי','אדרי','פרץ','מזרחי','ביטון','דהן','סויסה','רוזנברג','גבע','אזולאי','פרידמן','אליהו','אוחיון','בוחבוט','דוידוב','הרשקוביץ','וינברג','חדד','טל','יוסף','כנפו','לנדאו','מלכה','נחמני','סבג','עמר','פנחס','צור','קדוש','רביב','שלם','תורג׳מן','אבוטבול','בכר','גפני','דגן','הררי','ויזל','זהבי','חן','טרבלסי','ימיני','כספי','לב','מגן','נעמן','סרוסי','עובדיה','פלד','צדוק','קורן','רז','שמש','אטיאס','בניון','גליק','דרעי','הכהן','ולנשטיין','זנו','חזן','טולדנו','יצחק','כהנוב','לביא','משיח','נגר','סימן-טוב','עזרא','פרנס','צוקרמן','קליין','רמון','שפירא'];

function _generateDemoSoldiers() {
    const soldiers = [];
    let counter = 1;
    const used = new Set();

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
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makeId(),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: officerRoles[i % officerRoles.length],
                rank: officerRanks[i % officerRanks.length]
            };
            soldiers.push(s);
        }
        // Commanders
        for (let i = 0; i < def.cmdN; i++) {
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makeId(),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: cmdRoles[i % cmdRoles.length],
                rank: cmdRanks[i % cmdRanks.length]
            };
            soldiers.push(s);
        }
        // Soldiers
        for (let i = 0; i < def.soldiersN; i++) {
            const s = {
                id: 'demo_' + makeId(),
                name: makeName(),
                personalId: makeId(),
                phone: makePhone(),
                company: def.key,
                unit: def.units[i % def.units.length],
                role: soldierRoles[i % soldierRoles.length],
                rank: soldierRanks[i % soldierRanks.length]
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
    const tasks = {
        a: ['חפק מפ','סיור','תצפית','שמירה','צוות יזומות','תורן מטבח'],
        b: ['חפק מפ','סיור','מחסום','חמל','בונקר','ש.ג','צוות יזומות','תורן מטבח'],
        c: ['חפק מפ','סיור צפון','סיור דרום','הגנת מחנה','צוות יזומות','תורן מטבח'],
        d: ['חפק מפ','סיור','מחסום','צוות יזומות','תורן מטבח'],
        hq: ['תורנות חפ"ק','קישור'],
        agam: ['משמרת א׳','משמרת ב׳','משמרת ג׳','כונן'],
        palsam: ['מטבח','שמירה','נהיגה','תורנות']
    };
    const shiftDefs = [
        { name: 'בוקר', start: '06:00', end: '14:00' },
        { name: 'צהריים', start: '14:00', end: '22:00' },
        { name: 'לילה', start: '22:00', end: '06:00' }
    ];
    // AGM has its own shift structure
    const agamShiftMap = {
        'משמרת א׳': { name: 'בוקר', start: '06:00', end: '14:00' },
        'משמרת ב׳': { name: 'צהריים', start: '14:00', end: '22:00' },
        'משמרת ג׳': { name: 'לילה', start: '22:00', end: '06:00' },
        'כונן': { name: 'יום', start: '08:00', end: '20:00' }
    };

    const baseDate = new Date('2026-02-19T00:00:00');
    for (let day = 0; day < 10; day++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + day);
        const dateStr = d.toISOString().slice(0, 10);

        Object.keys(tasks).forEach(compKey => {
            const compSoldiers = soldiers.filter(s => s.company === compKey);
            const soldiersPool = compSoldiers.filter(s => ['לוחם','נהג','קשר','חובש'].includes(s.role));
            const commanders = compSoldiers.filter(s => ['מ"כ','מפקד','סמב"צ'].some(r => s.role.includes(r)));
            const officers = compSoldiers.filter(s => ['מ"פ','סמ"פ','קצין','רס"פ'].some(r => s.role.includes(r)));
            let solIdx = (day * 4) % Math.max(soldiersPool.length, 1);
            let cmdIdx = day % Math.max(commanders.length, 1);
            let offIdx = day % Math.max(officers.length, 1);

            (tasks[compKey] || []).forEach(task => {
                // Single-shift tasks (initiatives, kitchen, agam)
                if (task === 'צוות יזומות') {
                    const assigned = [];
                    for (let i = 0; i < 6; i++) {
                        if (soldiersPool.length > 0) { assigned.push(soldiersPool[solIdx % soldiersPool.length].id); solIdx++; }
                    }
                    if (commanders.length > 0) { assigned.push(commanders[cmdIdx % commanders.length].id); cmdIdx++; }
                    if (officers.length > 0) { assigned.push(officers[offIdx % officers.length].id); offIdx++; }
                    shifts.push({ id: 'sh_demo_' + shifts.length, company: compKey, task, date: dateStr, shiftName: 'יום', startTime: '06:00', endTime: '22:00', soldiers: assigned, taskCommander: assigned[assigned.length - 1] || '' });
                    return;
                }
                if (task === 'תורן מטבח') {
                    const assigned = [];
                    if (soldiersPool.length > 0) { assigned.push(soldiersPool[solIdx % soldiersPool.length].id); solIdx++; }
                    shifts.push({ id: 'sh_demo_' + shifts.length, company: compKey, task, date: dateStr, shiftName: 'יום', startTime: '06:00', endTime: '18:00', soldiers: assigned, taskCommander: '' });
                    return;
                }
                if (agamShiftMap[task]) {
                    const sh = agamShiftMap[task];
                    const assigned = [];
                    for (let i = 0; i < 2; i++) {
                        if (soldiersPool.length > 0) { assigned.push(soldiersPool[solIdx % soldiersPool.length].id); solIdx++; }
                    }
                    if (task === 'משמרת א׳' && officers.length > 0) { assigned.push(officers[offIdx % officers.length].id); offIdx++; }
                    shifts.push({ id: 'sh_demo_' + shifts.length, company: compKey, task, date: dateStr, shiftName: sh.name, startTime: sh.start, endTime: sh.end, soldiers: assigned, taskCommander: assigned[0] || '' });
                    return;
                }

                // Regular 3-shift tasks
                shiftDefs.forEach(sh => {
                    const assigned = [];
                    const numSoldiers = (task.includes('מחסום') ? 3 : 2);
                    for (let i = 0; i < numSoldiers; i++) {
                        if (soldiersPool.length > 0) { assigned.push(soldiersPool[solIdx % soldiersPool.length].id); solIdx++; }
                    }
                    if (task.includes('סיור') || task.includes('מחסום')) {
                        if (commanders.length > 0) { assigned.push(commanders[cmdIdx % commanders.length].id); cmdIdx++; }
                    }
                    if (task.includes('חפק') || task.includes('חפ"ק')) {
                        if (officers.length > 0) { assigned.push(officers[offIdx % officers.length].id); offIdx++; }
                    }
                    shifts.push({ id: 'sh_demo_' + shifts.length, company: compKey, task, date: dateStr, shiftName: sh.name, startTime: sh.start, endTime: sh.end, soldiers: assigned, taskCommander: assigned[0] || '' });
                });
            });
        });
    }
    return shifts;
}

function _generateDemoLeaves(soldiers) {
    const leaves = [];
    // ~12% of all soldiers on leave at some point
    const allSoldiers = soldiers.slice();
    const count = Math.floor(allSoldiers.length * 0.12);
    const reasons = ['חופשה','סיבה רפואית','אירוע משפחתי','אישי','לימודים','סיום שירות'];
    for (let i = 0; i < count; i++) {
        const s = allSoldiers[i];
        const startDay = 19 + (i % 8);
        const duration = 1 + (i % 3);
        const month = startDay > 28 ? '03' : '02';
        const day = startDay > 28 ? String(startDay - 28).padStart(2,'0') : String(startDay).padStart(2,'0');
        const endDay = startDay + duration;
        const endMonth = endDay > 28 ? '03' : '02';
        const endDayStr = endDay > 28 ? String(endDay - 28).padStart(2,'0') : String(endDay).padStart(2,'0');
        leaves.push({
            id: 'lv_demo_' + i,
            soldierId: s.id,
            startDate: `2026-${month}-${day}`,
            startTime: ['08:00','14:00','18:00'][i % 3],
            endDate: `2026-${endMonth}-${endDayStr}`,
            endTime: '14:00',
            reason: reasons[i % reasons.length],
            approvedBy: ['מ"פ','סמ"פ','רס"פ'][i % 3]
        });
    }
    return leaves;
}

function _generateDemoTraining(soldiers) {
    const training = [];
    const types = ['squad_open','squad_urban','advanced_shooting','weapon_zero','grenade'];
    // Non-zero types (exclude weapon_zero for separate handling)
    const regularTypes = ['squad_open','squad_urban','advanced_shooting','grenade'];

    soldiers.forEach((s, idx) => {
        // 82% completed ALL training, 18% have gaps
        const completedAll = (idx % 100) < 82;

        regularTypes.forEach((typeId, ti) => {
            if (completedAll) {
                // Completed all
                training.push({ soldierId: s.id, typeId, done: true });
            } else {
                // Logical gaps: each soldier missing 1-2 specific types
                const missIdx = idx % regularTypes.length;
                const missIdx2 = (idx + 2) % regularTypes.length;
                if (ti !== missIdx && ti !== missIdx2) {
                    training.push({ soldierId: s.id, typeId, done: true });
                }
            }
        });

        // weapon_zero: 98% completed, date 17.02.26
        if ((idx % 100) < 98) {
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
            // HQ, AGM — same as combat
            itemTemplates = isCmd ? [...combatItems, ...cmdExtraItems] : combatItems;
        }

        const items = itemTemplates.map(item => ({
            itemId: 'pi_' + (piCounter++),
            name: item.name,
            quantity: item.quantity,
            category: item.category,
            requiresSerial: item.requiresSerial,
            serialNumber: item.requiresSerial ? makeSerial() : '',
            source: 'base',
            status: 'issued',
            issuedQuantity: item.quantity,
            linkedEquipmentIds: [],
            issuedDate: '2026-02-19T08:00:00.000Z',
            returnedDate: null,
            notes: ''
        }));

        const issuer = sigIssuers[idx % sigIssuers.length];

        personalEquipment.push({
            id: 'pe_demo_' + idx,
            soldierId: s.id,
            generatedDate: '2026-02-19T08:00:00.000Z',
            roleSetId: isCmd ? 'rs_commander' : null,
            items,
            bulkSignature: {
                signed: true,
                signatureImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
                signedDate: '2026-02-19T10:00:00.000Z',
                issuedBy: issuer.first + ' ' + issuer.last,
                issuerFirstName: issuer.first,
                issuerLastName: issuer.last,
                signingUnit: 'פלוגת פלס"ם',
                issuerSignatureImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg'
            },
            history: [
                { date: '2026-02-19T08:00:00.000Z', action: 'created', details: 'ציוד הונפק' },
                { date: '2026-02-19T10:00:00.000Z', action: 'signed', details: 'חתימה על ציוד' }
            ]
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
            signatureImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
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
            signatureImg: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
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
    const cmdNames = { a: 'דוד כהן', b: 'אלחי פיין', c: 'משה לוי', d: 'יוסי ברק', hq: 'אבי שמש', agam: 'רון דגן' };
    const cmdRanks = { a: 'סרן', b: 'סרן', c: 'סרן', d: 'רס"ן', hq: 'סגן', agam: 'סגן' };

    // ~90% of combat soldiers have completed weapons forms
    const combatSoldiers = soldiers.filter(s => ['a','b','c','d','hq','agam'].includes(s.company));
    combatSoldiers.forEach((s, idx) => {
        if ((idx % 10) >= 9) return; // skip ~10%
        const nameParts = s.name.split(' ');

        weaponsData.push({
            soldierId: s.id,
            company: s.company,
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            idNumber: s.personalId || '',
            personalNum: s.personalId || '',
            birthYear: String(1985 + (idx % 20)),
            fatherName: _FIRST_NAMES[(idx * 7) % _FIRST_NAMES.length],
            street: streets[idx % streets.length],
            houseNum: String(1 + (idx % 50)),
            city: cities[idx % cities.length],
            postalCode: String(1000000 + (idx * 137) % 9000000),
            phone: s.phone || '',
            landline: idx % 5 === 0 ? '0' + (2 + (idx % 7)) + '-' + String(1000000 + idx * 111).slice(0,7) : '',
            personalWeaponSource: idx % 20 === 0 ? 'צה"ל' : '',
            rangeDate: '2025-' + String(1 + (idx % 12)).padStart(2,'0') + '-15',
            enlistmentDate: '20' + String(15 + (idx % 8)).padStart(2,'0') + '-03-01',
            dischargeDate: '20' + String(18 + (idx % 8)).padStart(2,'0') + '-03-01',
            medicalApprovalDate: '2026-01-' + String(1 + (idx % 28)).padStart(2,'0'),
            rank: s.rank || '',
            combatCertified: idx % 8 !== 0,
            idPhoto: idx % 3 === 0 ? null : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
            doctorApproval: idx % 4 === 0 ? null : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
            cmdName: cmdNames[s.company] || 'מפקד',
            cmdRank: cmdRanks[s.company] || 'סרן',
            cmdId: String(100000 + idx),
            cmdRole: 'מ"פ ' + (s.company === 'hq' ? 'חפ"ק' : s.company === 'agam' ? 'אג"מ' : s.company + '\''),
            cmdSig: idx % 5 === 0 ? null : 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg',
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

// Build seed data
const _demoSoldiers = _generateDemoSoldiers();
const _demoShifts = _generateDemoShifts(_demoSoldiers);
const _demoLeaves = _generateDemoLeaves(_demoSoldiers);
const _demoTraining = _generateDemoTraining(_demoSoldiers);
const _demoConstraints = _generateDemoConstraints(_demoSoldiers);
const _demoEquipment = _generateDemoEquipment(_demoSoldiers);
const _demoSignatureLog = _generateDemoSignatureLog(_demoSoldiers);
const _demoWeaponsData = _generateDemoWeaponsData(_demoSoldiers);
const _demoInventory = _generateDemoInventory(_demoSoldiers);

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
    adminName: 'ישראל ישראלי',
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
    firebaseEnabled: true,
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
        rotationDaysOut: 4
    },

    // --- נתוני דמו ---
    demoSeedVersion: 7,
    demoSeedData: {
        soldiers: _demoSoldiers,
        shifts: _demoShifts,
        leaves: _demoLeaves,
        training: _demoTraining,
        constraints: _demoConstraints,
        personalEquipment: _demoEquipment,
        signatureLog: _demoSignatureLog,
        weaponsData: _demoWeaponsData,
        equipment: _demoInventory
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
