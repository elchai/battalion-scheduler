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

    // Company distributions: { key, total, soldiers, commanders, officers, units }
    const companyDefs = [
        { key: 'a', total: 90, soldiersN: 72, cmdN: 12, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'b', total: 100, soldiersN: 80, cmdN: 14, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'c', total: 85, soldiersN: 68, cmdN: 11, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'd', total: 95, soldiersN: 76, cmdN: 13, offN: 6, units: ['מחלקה 1','מחלקה 2','מחלקה 3','סגל'] },
        { key: 'hq', total: 15, soldiersN: 8, cmdN: 3, offN: 4, units: ['חפ"ק מג"ד','לשכה'] },
        { key: 'agam', total: 30, soldiersN: 22, cmdN: 4, offN: 4, units: ['קמב"צים','סמב"צים'] },
        { key: 'palsam', total: 85, soldiersN: 75, cmdN: 6, offN: 4, units: ['לוגיסטיקה','קשר','טנ"א','רפואה','מטבח','רכב'] }
    ];

    const officerRoles = ['מ"פ','סמ"פ','קצין','רס"פ'];
    const cmdRoles = ['מ"כ','מפקד','סמב"צ'];
    const soldierRoles = ['לוחם','לוחם','לוחם','נהג','קשר','חובש','לוחם','לוחם'];
    const officerRanks = ['סגן','סרן','רס"ל'];
    const cmdRanks = ['סמל','סמ"ר','רס"ל'];
    const soldierRanks = ['טוראי','טוראי','רב"ט','טוראי'];

    // Operation dates for service periods
    const opStart = '2026-03-22';
    const opEnd = '2026-04-30';
    const splitEnd1 = '2026-04-14';
    const splitStart2 = '2026-04-14';

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
                        { start: opStart, end: '2026-03-29' },
                        { start: splitStart2, end: opEnd }
                    ];
                } else {
                    // Special range
                    s.servicePeriods = [{ start: '2026-04-05', end: '2026-04-25' }];
                }
            }
            soldiers.push(s);
        }
    });

    return soldiers;
}

function _generateDemoShifts(soldiers) {
    const shifts = [];
    const companies = ['a','b','c','d'];
    const tasks = {
        a: ['חפק מפ','סיור','תצפית','שמירה'],
        b: ['חפק מפ','סיור','מחסום','חמל'],
        c: ['חפק מפ','סיור','הגנת מחנה'],
        d: ['חפק מפ','סיור','מחסום']
    };
    const shiftDefs = [
        { name: 'בוקר', start: '06:00', end: '14:00' },
        { name: 'צהריים', start: '14:00', end: '22:00' },
        { name: 'לילה', start: '22:00', end: '06:00' }
    ];

    // Generate shifts for 7 days starting from 2026-03-22
    const baseDate = new Date('2026-03-22T00:00:00');
    for (let day = 0; day < 7; day++) {
        const d = new Date(baseDate);
        d.setDate(d.getDate() + day);
        const dateStr = d.toISOString().slice(0, 10);

        companies.forEach(compKey => {
            const compSoldiers = soldiers.filter(s => s.company === compKey);
            const soldiersPool = compSoldiers.filter(s => s.role === 'לוחם' || s.role === 'נהג' || s.role === 'קשר');
            const commanders = compSoldiers.filter(s => ['מ"כ','מפקד','סמב"צ'].some(r => s.role.includes(r)));
            const officers = compSoldiers.filter(s => ['מ"פ','סמ"פ','קצין','רס"פ'].some(r => s.role.includes(r)));
            let solIdx = (day * 3) % Math.max(soldiersPool.length, 1);
            let cmdIdx = day % Math.max(commanders.length, 1);
            let offIdx = day % Math.max(officers.length, 1);

            (tasks[compKey] || []).forEach(task => {
                shiftDefs.forEach(sh => {
                    const assigned = [];
                    // 2 soldiers per shift
                    for (let i = 0; i < 2; i++) {
                        if (soldiersPool.length > 0) {
                            assigned.push(soldiersPool[solIdx % soldiersPool.length].id);
                            solIdx++;
                        }
                    }
                    // 1 commander for patrol/checkpoint
                    if (task.includes('סיור') || task.includes('מחסום')) {
                        if (commanders.length > 0) {
                            assigned.push(commanders[cmdIdx % commanders.length].id);
                            cmdIdx++;
                        }
                    }
                    // 1 officer for חפ"ק
                    if (task.includes('חפק')) {
                        if (officers.length > 0) {
                            assigned.push(officers[offIdx % officers.length].id);
                            offIdx++;
                        }
                    }

                    shifts.push({
                        id: 'sh_demo_' + shifts.length,
                        company: compKey,
                        task: task,
                        date: dateStr,
                        shiftName: sh.name,
                        startTime: sh.start,
                        endTime: sh.end,
                        soldiers: assigned,
                        taskCommander: assigned[0] || ''
                    });
                });
            });
        });
    }
    return shifts;
}

function _generateDemoLeaves(soldiers) {
    const leaves = [];
    const combatSoldiers = soldiers.filter(s => ['a','b','c','d'].includes(s.company));
    // ~15% on leave
    const onLeave = combatSoldiers.slice(0, Math.floor(combatSoldiers.length * 0.15));
    onLeave.forEach((s, i) => {
        const startDay = 22 + (i % 5);
        leaves.push({
            id: 'lv_demo_' + i,
            soldierId: s.id,
            startDate: `2026-03-${startDay}`,
            startTime: '14:00',
            endDate: `2026-03-${startDay + 2}`,
            endTime: '14:00',
            reason: ['חופשה','סיבה רפואית','אירוע משפחתי','אישי'][i % 4],
            approvedBy: 'מ"פ'
        });
    });
    return leaves;
}

function _generateDemoTraining(soldiers) {
    const training = [];
    const types = ['squad_open','squad_urban','advanced_shooting','weapon_zero','grenade'];
    soldiers.forEach(s => {
        if (!['a','b','c','d'].includes(s.company)) return;
        types.forEach(typeId => {
            // Random completion: ~60%
            if (Math.random() < 0.6) {
                if (typeId === 'weapon_zero') {
                    training.push({ soldierId: s.id, typeId, done: true, date: '2026-03-' + String(15 + Math.floor(Math.random() * 10)).padStart(2,'0') });
                } else {
                    training.push({ soldierId: s.id, typeId, done: true });
                }
            }
        });
    });
    return training;
}

function _generateDemoConstraints(soldiers) {
    const constraints = [];
    // A few soldiers with constraints
    const pool = soldiers.filter(s => ['a','b','c','d'].includes(s.company));
    for (let i = 0; i < 8; i++) {
        const s = pool[Math.floor(Math.random() * pool.length)];
        constraints.push({
            id: 'con_demo_' + i,
            soldierId: s.id,
            startDate: '2026-03-' + String(25 + (i % 4)).padStart(2,'0'),
            endDate: '2026-03-' + String(27 + (i % 3)).padStart(2,'0'),
            reason: ['בדיקה רפואית','משפט','תורנות אחרת','אילוץ אישי'][i % 4],
            createdBy: 'מערכת דמו'
        });
    }
    return constraints;
}

// Build seed data
const _demoSoldiers = _generateDemoSoldiers();
const _demoShifts = _generateDemoShifts(_demoSoldiers);
const _demoLeaves = _generateDemoLeaves(_demoSoldiers);
const _demoTraining = _generateDemoTraining(_demoSoldiers);
const _demoConstraints = _generateDemoConstraints(_demoSoldiers);

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
    docLogoPath: 'demo/doc-logo.png',
    stampPath: 'demo/stamp.png',

    // --- localStorage (separate prefix to avoid collisions) ---
    storagePrefix: 'battalionDemo',

    // --- פלוגות ---
    companies: {
        a: {
            name: 'פלוגה 1', location: 'בסיס צפון', baseName: 'בסיס צפון', forecast: 90,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 1',
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
            name: 'פלוגה 2', location: 'בסיס מרכז', baseName: 'בסיס מרכז', forecast: 100,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 2',
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
            name: 'פלוגה 3', location: 'בסיס דרום', baseName: 'בסיס דרום', forecast: 85,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 3',
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
            name: 'פלוגה 4', location: 'בסיס מערב', baseName: 'בסיס מערב', forecast: 95,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 4',
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
    warehouses: ['מחסן גדוד', 'מחסן אוגדה', 'אחר'],
    defaultWarehouse: 'מחסן גדוד',
    defaultWeaponType: 'M-16',
    defaultSigningUnit: 'פלוגת פלס"ם',

    // --- קרדיט ---
    developerName: 'אלחי פיין',
    developerPhone: '972542012000',
    developerPhoneDisplay: '054-2012000',

    // --- נתוני דמו ---
    demoSeedData: {
        soldiers: _demoSoldiers,
        shifts: _demoShifts,
        leaves: _demoLeaves,
        training: _demoTraining,
        constraints: _demoConstraints
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
