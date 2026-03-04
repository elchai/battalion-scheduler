// ==================== BATTALION CONFIG — גדוד 1875 ====================
const CONFIG = {
    // --- זהות ---
    battalionName: 'גדוד יהודה',
    battalionId: '1875',
    systemTitle: 'מערכת ניהול גדודי',
    systemSubtitle: 'תעסוקה מבצעית',
    divisionName: 'אוגדה 96',
    serviceType: 'מילואים',

    // --- כניסה ---
    password: '1875',
    adminName: 'אלחי פיין',

    // --- Firebase ---
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
    firestoreCollection: 'battalion',

    // --- Google Sheets ---
    sheetId: '1JedoEvaQyHtNVYF7lwJwNSV0lu8e97k2kwCJuSRaGTE',
    nispachimSheetId: '1mZOPiEIzRHj_lDqJWgh56JRkjTFvTWmx-GiVbr7Wwl4',

    // --- נתיבים ---
    deployPath: '/battalion-scheduler',
    logoPath: 'logo.png',
    docLogoPath: 'doc-logo.png',
    stampPath: 'stamp.png',

    // --- localStorage ---
    storagePrefix: 'battalion',

    // --- פלוגות ---
    companies: {
        a: {
            name: 'פלוגה א', location: 'עתודה', baseName: 'מכבים', forecast: 51,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה א', sheetGid: '1028480518',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
                { name: 'צוותי יזומות', soldiers: 22, commanders: 2, officers: 0, shifts: 1, perShift: { soldiers: 22, commanders: 2, officers: 0 } },
                { name: 'של"ז', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'תגבור', soldiers: 12, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 12, commanders: 0, officers: 0 } },
                { name: 'ליווי גשש', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 41, commanders: 2, officers: 2 }
        },
        b: {
            name: 'פלוגה ב', location: 'מבוא חורון', baseName: 'מכבים', forecast: 66,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה ב', sheetGid: '2089743793',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור קל', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'בונקר', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
                { name: 'ש.ג', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'פטרול לילה', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'חמל', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'כ"כ', soldiers: 4, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
            ],
            totals: { soldiers: 36, commanders: 5, officers: 2 }
        },
        c: {
            name: 'פלוגה ג', location: 'חשמונאים', baseName: 'חשמונאים', forecast: 65,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה ג', sheetGid: '12652557',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור קל דרום', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'סיור קל צפון', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'חמל פלוגתי', soldiers: 3, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'הגנת מחנה', soldiers: 6, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'כ"כ', soldiers: 5, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 1, officers: 0 } },
                { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
            ],
            totals: { soldiers: 41, commanders: 8, officers: 2 }
        },
        d: {
            name: 'פלוגה ד', location: '443', baseName: 'מכבים', forecast: 71,
            units: ['מחלקה 1', 'מחלקה 2', 'מחלקה 3', 'סגל'],
            sheetTab: 'פלוגה ד', sheetGid: '59321270',
            tasks: [
                { name: 'חפק מפ', soldiers: 3, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 1 } },
                { name: 'סיור', soldiers: 6, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 2, commanders: 1, officers: 0 } },
                { name: 'מחסום בל', soldiers: 12, commanders: 3, officers: 0, shifts: 3, perShift: { soldiers: 4, commanders: 1, officers: 0 } },
                { name: 'חמל פלוגתי', soldiers: 3, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 3, commanders: 0, officers: 0 } },
                { name: 'קצין מוצב', soldiers: 0, commanders: 0, officers: 1, shifts: 1, perShift: { soldiers: 0, commanders: 0, officers: 1 } },
                { name: 'מעבר מכבים (בוקר 06-09)', soldiers: 11, commanders: 3, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 3, officers: 0 } },
                { name: 'מעבר מכבים (יום 09-15)', soldiers: 9, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 9, commanders: 0, officers: 0 } },
                { name: 'תורן מטבח', soldiers: 1, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 1, commanders: 0, officers: 0 } },
                { name: 'צוות יזומות', soldiers: 11, commanders: 1, officers: 0, shifts: 1, perShift: { soldiers: 11, commanders: 1, officers: 0 } }
            ],
            totals: { soldiers: 56, commanders: 10, officers: 2 }
        },
        hq: {
            name: 'חפ"קים', location: 'מפקדה', baseName: 'מכבים',
            units: ['חפ"ק מג"ד', 'לשכה'],
            tasks: [],
            totals: { soldiers: 0, commanders: 0, officers: 0 }
        },
        agam: {
            name: 'אג"מ', location: 'מפקדה', baseName: 'מכבים',
            sheetGid: '107677945',
            units: ['מחלקת מבצעים', 'מחלקת הדרכה', 'מחלקת תקשוב', 'מחלקת מודיעין'],
            tasks: [
                { name: 'משמרת א׳', soldiers: 2, commanders: 0, officers: 2, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 2 } },
                { name: 'משמרת ב׳', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'משמרת ג׳', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } },
                { name: 'כונן', soldiers: 2, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 2, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 0, commanders: 0, officers: 0 }
        },
        palsam: {
            name: 'פלס"ם', location: 'פלוגת סיוע מנהלתי', baseName: 'מכבים',
            sheetGid: '865038187',
            units: ['לוגיסטיקה', 'קשר', 'טנ"א', 'רפואה', 'מטבח', 'רכב', 'דת וז"ח', 'מפל"ג', 'מודיעין'],
            tasks: [
                { name: 'מטבח', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'שמירה', soldiers: 5, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'ארמו"ן', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'נהיגה', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'חפ"ק רפואי', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'תורנות', soldiers: 5, commanders: 0, officers: 0, shifts: 3, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'ניידת טנ"א', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'ניידת לוגיסטית', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } },
                { name: 'משימת ת"ש', soldiers: 5, commanders: 0, officers: 0, shifts: 1, perShift: { soldiers: 5, commanders: 0, officers: 0 } }
            ],
            totals: { soldiers: 45, commanders: 0, officers: 0 }
        }
    },
    combatCompanies: ['a', 'b', 'c', 'd'],

    departmentToCompany: {
        'חפ"ק מג"ד': 'hq',
        'לשכה': 'hq',
        'אג"מ': 'agam',
        'מחלקת מבצעים': 'agam',
        'מחלקת הדרכה': 'agam',
        'מחלקת תקשוב': 'agam',
        'מחלקת מודיעין': 'agam',
        'מחלקת משא"ן': 'palsam',
        'מפקדת הפלס"ם': 'palsam',
        'פלגת הספקה': 'palsam',
        'פלגת הפינוי': 'palsam',
        'פלגת טנ"א': 'palsam',
        'פלגת רפואה': 'palsam'
    },

    // --- תפקידים ---
    signingRoles: ['רס"פ', 'סרס"פ', 'סמ"ח', 'מ"כ', 'מ"פ', 'סמ"פ'],
    warehouses: ['מחסן גדוד', 'מחסן אוגדה', 'ימ"ח רנטיס', 'אחר'],
    defaultWarehouse: 'מחסן גדוד',
    defaultWeaponType: 'M-16',
    defaultSigningUnit: 'פלוגת פלס"ם',

    // --- נשקים — סנכרון גוגל שיטס ---
    weaponsSheetId: '',       // Google Sheets ID of responses table
    weaponsScriptUrl: '',     // Google Apps Script Web App URL for push

    // --- קרדיט ---
    developerName: 'אלחי פיין',
    developerPhone: '972542012000',
    developerPhoneDisplay: '054-2012000',
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
