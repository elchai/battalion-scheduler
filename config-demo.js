// ==================== DEMO CONFIG — גדוד אריות ====================
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
            name: 'פלוגה 1', location: 'בסיס צפון', baseName: 'בסיס צפון', forecast: 55,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 1',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'תצפית', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'שמירה', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 19, commanders: 3, officers: 1 }
        },
        b: {
            name: 'פלוגה 2', location: 'בסיס מרכז', baseName: 'בסיס מרכז', forecast: 60,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 2',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'מחסום', soldiers: 9, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 1, officers: 0 } },
                { name: 'חמל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 22, commanders: 6, officers: 1 }
        },
        c: {
            name: 'פלוגה 3', location: 'בסיס דרום', baseName: 'בסיס דרום', forecast: 50,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 3',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'הגנת מחנה', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 16, commanders: 3, officers: 1 }
        },
        d: {
            name: 'פלוגה 4', location: 'בסיס מערב', baseName: 'בסיס מערב', forecast: 58,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה 4',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'מחסום', soldiers: 12, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 22, commanders: 6, officers: 1 }
        },
        hq: {
            name: 'חפ"קים', location: 'מפקדה', baseName: 'בסיס מרכז',
            units: ['חפ"ק מג"ד', 'לשכה'],
            tasks: [],
            totals: { soldiers: 0, commanders: 0, officers: 0 }
        },
        palsam: {
            name: 'פלס"ם', location: 'פלוגת סיוע', baseName: 'בסיס מרכז',
            units: ['אג"מ', 'לוגיסטיקה', 'קשר', 'טנ"א', 'רפואה', 'מטבח'],
            tasks: [
                { name: 'מטבח', soldiers: 4, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 4, commanders: 0, officers: 0 } },
                { name: 'שמירה', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
                { name: 'נהיגה', soldiers: 3, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
                { name: 'תורנות', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 3, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 13, commanders: 0, officers: 0 }
        }
    },
    combatCompanies: ['a', 'b', 'c', 'd'],

    departmentToCompany: {
        'חפ"ק מג"ד': 'hq',
        'לשכה': 'hq',
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
        soldiers: [
            { id: 'demo_s1', name: 'יוסי כהן', personalId: '8001001', phone: '0501111111', company: 'a', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s2', name: 'דוד לוי', personalId: '8001002', phone: '0502222222', company: 'a', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s3', name: 'משה אברהם', personalId: '8001003', phone: '0503333333', company: 'a', unit: 'מחלקה 2', role: 'מ"כ', rank: 'סמל' },
            { id: 'demo_s4', name: 'אבי ישראלי', personalId: '8001004', phone: '0504444444', company: 'a', unit: 'מחלקה 2', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s5', name: 'רון חיימוב', personalId: '8001005', phone: '0505555555', company: 'a', unit: 'מחלקה 3', role: 'מ"פ', rank: 'סגן' },
            { id: 'demo_s6', name: 'עמית שרון', personalId: '8001006', phone: '0506666666', company: 'b', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s7', name: 'איתי גולן', personalId: '8001007', phone: '0507777777', company: 'b', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s8', name: 'נתן ברק', personalId: '8001008', phone: '0508888888', company: 'b', unit: 'מחלקה 2', role: 'מ"כ', rank: 'סמל' },
            { id: 'demo_s9', name: 'אלון כרמי', personalId: '8001009', phone: '0509999999', company: 'b', unit: 'מחלקה 3', role: 'לוחם', rank: 'רב"ט' },
            { id: 'demo_s10', name: 'גיל אדרי', personalId: '8001010', phone: '0501010101', company: 'c', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s11', name: 'תומר פרץ', personalId: '8001011', phone: '0501111112', company: 'c', unit: 'מחלקה 2', role: 'מ"כ', rank: 'סמל' },
            { id: 'demo_s12', name: 'עידן מזרחי', personalId: '8001012', phone: '0501212121', company: 'c', unit: 'מחלקה 3', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s13', name: 'שי ביטון', personalId: '8001013', phone: '0501313131', company: 'd', unit: 'מחלקה 1', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s14', name: 'ליאור דהן', personalId: '8001014', phone: '0501414141', company: 'd', unit: 'מחלקה 2', role: 'מ"כ', rank: 'סמל' },
            { id: 'demo_s15', name: 'אורן סויסה', personalId: '8001015', phone: '0501515151', company: 'd', unit: 'מחלקה 3', role: 'לוחם', rank: 'רב"ט' },
            { id: 'demo_s16', name: 'נדב רוזנברג', personalId: '8001016', phone: '0501616161', company: 'hq', unit: 'חפ"ק מג"ד', role: 'קצין', rank: 'רס"ן' },
            { id: 'demo_s17', name: 'ערן גבע', personalId: '8001017', phone: '0501717171', company: 'hq', unit: 'לשכה', role: 'חייל', rank: 'טוראי' },
            { id: 'demo_s18', name: 'מאור אזולאי', personalId: '8001018', phone: '0501818181', company: 'palsam', unit: 'לוגיסטיקה', role: 'לוחם', rank: 'טוראי' },
            { id: 'demo_s19', name: 'יונתן פרידמן', personalId: '8001019', phone: '0501919191', company: 'palsam', unit: 'רפואה', role: 'חובש', rank: 'טוראי' },
            { id: 'demo_s20', name: 'בן אליהו', personalId: '8001020', phone: '0502020202', company: 'palsam', unit: 'מטבח', role: 'טבח', rank: 'טוראי' }
        ]
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
