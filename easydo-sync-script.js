/**
 * EasyDo Weapons Form - Direct API Sync
 *
 * סורק טפסים חתומים ישירות מ-API של EasyDo (לא דרך Gmail).
 * מוריד קבצים מצורפים (צילום ת.ז + אישור רופא) ושומר ב-Google Drive.
 * מעדכן Google Sheets עם כל הנתונים + קישורים לקבצים.
 *
 * כותב לטאב "תגובות לטופס 1" — אותו טאב של Google Forms.
 * מבנה העמודות (A-Z):
 *   A=חותמת זמן, B=כתובת אימייל, C=ניקוד, D=מאיזו פלוגה?,
 *   E=שם פרטי, F=שם משפחה, G=תעודת זהות, H=מספר אישי, I=שנת לידה,
 *   J=שם האב, K=רחוב, L=מס' הבית, M=יישוב, N=מיקוד,
 *   O=טלפון נייד, P=טלפון נייח, Q=מקור הנשק, R=מטווח בנק"ל,
 *   S=תאריך גיוס, T=תאריך שחרור, U=מועד אישור רפואי, V=דרגה,
 *   W=הוסמכת כלוחם?, X=אישור רופא (קישור), Y=צילום ת.ז (קישור),
 *   Z=מספר טלפון נייד
 *
 * התקנה על החשבון הגדודי (gdud1875idf@gmail.com):
 * 1. פתח https://script.google.com
 * 2. צור פרויקט חדש בשם "EasyDo Sync"
 * 3. העתק את הקוד הזה ל-Code.gs
 * 4. הפעל את הפונקציה setup() פעם אחת (Run > setup)
 * 5. אשר הרשאות Sheets + Drive
 * 6. הסקריפט ירוץ אוטומטית כל 10 דקות
 */

// ========== הגדרות ==========

const EASYDO_API = 'https://api.easydo.co.il/api/entity/me';

// טוקן EasyDo — תוקף עד 2028. אם פג, התחבר ל-app.easydo.co.il והרץ בקונסול:
// JSON.parse(localStorage.getItem('@ngxs.store.easydoc_auth')).data.auth.access_token
const EASYDO_TOKEN_KEY = 'EASYDO_TOKEN'; // stored in Script Properties

// Google Sheets — כותב לטאב התגובות הקיים של Google Forms
const WEAPONS_SHEET_ID = '1paWndmcqlsaKZJLYDcI2KHRkO5b2nkNarQj6Vo16Uk0';
const DATA_TAB_NAME = 'תגובות לטופס 1';
const LOG_TAB_NAME = 'לוג סנכרון';

// Google Drive folder name for attachments
const DRIVE_ROOT_FOLDER = 'טפסי נשק - EasyDo';

// Template IDs per company
const TEMPLATES = {
  62549: { company: 'a', name: "פלוגה א'" },
  62546: { company: 'b', name: "פלוגה ב'" },
  62556: { company: 'c', name: "פלוגה ג'" },
  62557: { company: 'd', name: "פלוגה ד'" },
  62745: { company: 'palsam', name: 'פלס"ם' },
  62561: { company: 'battalion', name: '1875 גדודי' },
};

// Field mapping from EasyDo custom fields
const FIELDS = {
  firstName:     'custom_field_699b2cd099ef1',
  lastName:      'custom_field_699b2cd099ef7',
  idNumber:      'custom_field_699b2cd099efb',
  personalNum:   'custom_field_699b2cd099eff',
  birthYear:     'custom_field_699b2cd099f03',
  fatherName:    'custom_field_699b2cd099f07',
  address:       'custom_field_699b2cd099f0b',
  phone:         'custom_field_699b2cd099f0e',
  landline:      'custom_field_699b2cd099f12',   // טלפון נייח
  weaponSource:  'custom_field_699b2cd099f16',   // מקור הנשק
  weaponType:    'custom_field_699b2cd099f1e',
  rangeDate:     'custom_field_699b2cd099f22',   // מתי עברת מטווח בנק"ל
  enlistDate:    'custom_field_699b2cd099f27',   // תאריך גיוס
  releaseDate:   'custom_field_699b2cd099f2b',   // תאריך שחרור
  rank:          'custom_field_699b2cd099f30',
  isFighter:     'custom_field_699b2cd099f34',   // האם הוסמכת כלוחם
  unit:          'custom_field_699b2cd099f3b',
  signedDate:    'custom_field_699b2cd099f47',
  doctorFile:    'custom_field_699b2cd099f6e',   // file ID - אישור רופא
  idPhotoFile:   'custom_field_699b2cd099f77',   // file ID - צילום תעודת זהות
};

// ========== הגדרה ראשונית ==========

function setup() {
  // 1. Set token (CHANGE THIS before first run!)
  const currentToken = PropertiesService.getScriptProperties().getProperty(EASYDO_TOKEN_KEY);
  if (!currentToken) {
    // Paste your token here on first setup, then it's stored securely
    const token = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI5NGM5ZGM3MC1jNThjLTQ5ZGUtYjIxMS02Mzg2YzVlMDEyOWEiLCJqdGkiOiI0NTI3ZWM3MjJiY2MzNzU1YTY1Mjg4OTYxMDI1ZTllMmRhZTdhZDgzYzE3NWMzNjk4NzNkYTI0OWU2OTVjZTNkNjIyMGU1YjRmYjhkMjU1ZiIsImlhdCI6MTc3MTc0NTg3OC45ODAzNzIsIm5iZiI6MTc3MTc0NTg3OC45ODAzNzMsImV4cCI6MTc3OTUyMTg3OC45ODU1NTIsInN1YiI6IjIxODU1OSIsInNjb3BlcyI6W119.oWss9mY4beU18qnmwSlsLjLrTNMH-Y8KI_B7uvwvRYBxrXZFieXMk9bRnyt9QJpcJiubK_QRX1UvY8ktDzisUMsj_7QYGd5YmCaE6bg1d-U8WSbePuk25Tt_ll8c4yYOZfoAoFQSF1YcWmd6WeE4ImturR6xt0aeMhBSUMYMjRQ22Q14bEpfZ_ElPZy1ADIgOP1vJFo4uCyIlFa8ZxZ5fr-dD4SI9crk5LGkIZUSYDTL8hTTO4jojboPO4WdPqDdXVJOGJN3QNGsg3M0AeqLD_kCQ7Od5OXSJzHh6Li1HwG7jd4ByNs7YHFLnyJbWMecp-fB9jY3klFxiCTiKU_ar_R2XX5cUPmE6AmI1CucIjxTnvYYX1xZa871khCPh1EDG0TmUTHNzxGfdfBz3VHxldkcW-2Fynhs5h6ca7AbslHs5D6AJ5e90V4mqKzUIV54yL_4VijjuQc2ZtTzN4tG8nPTZBVCzbRAMhfWU6cqAT-M2TJ-oMEZzbsIU3EUJV8WaUVF-vTVmntFFTbxkHmLj3Ebpp7eVqv-rVaPe_qsOk8T7Px6TzHdY3XD-V3mdQAlxwHKcDbnAD-sT_k6pZBsv-n2pSJtv1Oswv9LBatY5jjEaiAigiwnmwB78-Nmc38hX0XXw8AU4j17or5H0OU-SIT8Gq_q6H8ewlNimJIWLjw';
    PropertiesService.getScriptProperties().setProperty(EASYDO_TOKEN_KEY, token);
    Logger.log('Token saved.');
  }

  // 2. Verify spreadsheet tab exists
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);

  let dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) {
    Logger.log('Tab "' + DATA_TAB_NAME + '" not found! Check the tab name in Google Sheets.');
    return;
  }

  let logTab = ss.getSheetByName(LOG_TAB_NAME);
  if (!logTab) {
    logTab = ss.insertSheet(LOG_TAB_NAME);
    logTab.appendRow(['תאריך', 'פעולה', 'פרטים']);
    logTab.getRange(1, 1, 1, 3).setFontWeight('bold');
    Logger.log('Created tab: ' + LOG_TAB_NAME);
  }

  // 3. Create Drive folders
  const rootFolder = getOrCreateFolder_(null, DRIVE_ROOT_FOLDER);
  for (const [tid, info] of Object.entries(TEMPLATES)) {
    getOrCreateFolder_(rootFolder, info.name);
  }
  Logger.log('Drive folders created under: ' + DRIVE_ROOT_FOLDER);

  // 4. Set up trigger
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(t => t.getHandlerFunction() === 'syncNewForms');
  if (!existing) {
    ScriptApp.newTrigger('syncNewForms')
      .timeBased()
      .everyMinutes(10)
      .create();
    Logger.log('Created 10-minute trigger for syncNewForms');
  }

  Logger.log('Setup complete!');
}

// ========== סנכרון ראשי ==========

function syncNewForms() {
  const token = PropertiesService.getScriptProperties().getProperty(EASYDO_TOKEN_KEY);
  if (!token) {
    Logger.log('No token configured. Run setup() first.');
    return;
  }

  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) {
    Logger.log('Data tab not found. Run setup() first.');
    return;
  }

  // Get existing IDs to skip duplicates (column G = תעודת זהות, index 6)
  const existingData = dataTab.getDataRange().getValues();
  const processedIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    const idNum = String(existingData[i][6]).trim(); // column G
    if (idNum) processedIds.add(idNum);
  }

  const rootFolder = getOrCreateFolder_(null, DRIVE_ROOT_FOLDER);
  let totalAdded = 0;

  for (const [templateId, templateInfo] of Object.entries(TEMPLATES)) {
    try {
      const added = processTemplate_(token, templateId, templateInfo, dataTab, processedIds, rootFolder);
      totalAdded += added;
    } catch (err) {
      Logger.log('Error processing template ' + templateId + ' (' + templateInfo.name + '): ' + err.message);
      appendLog_(ss, 'שגיאה', templateInfo.name + ': ' + err.message);
    }
  }

  if (totalAdded > 0) {
    appendLog_(ss, 'סנכרון', 'נוספו ' + totalAdded + ' טפסים חדשים');
    Logger.log('Sync complete. Added ' + totalAdded + ' new forms.');
  } else {
    Logger.log('Sync complete. No new forms.');
  }
}

// ========== עיבוד template ==========

function processTemplate_(token, templateId, templateInfo, dataTab, processedIds, rootFolder) {
  // Fetch all signed forms for this template
  const response = callEasyDoAPI_(token, 'POST', '/templates/' + templateId + '/data-table', {
    page: 1,
    per_page: 100,
    sort_by: 'created_at',
    sort_direction: 'desc'
  });

  if (!response || !response.data) {
    Logger.log('No data for template ' + templateId);
    return 0;
  }

  const companyFolder = getOrCreateFolder_(rootFolder, templateInfo.name);
  let added = 0;

  for (const item of response.data) {
    const form = item.form;
    const data = item.data || {};

    // Skip non-signed forms
    if (form.status !== 'signed') continue;

    // Skip already processed (by ת.ז)
    const idNumber = String(data[FIELDS.idNumber] || '').trim();
    if (!idNumber) continue;
    if (processedIds.has(idNumber)) continue;

    // Extract all fields
    const firstName    = data[FIELDS.firstName] || '';
    const lastName     = data[FIELDS.lastName] || '';
    const personalNum  = data[FIELDS.personalNum] || '';
    const birthYear    = data[FIELDS.birthYear] || '';
    const fatherName   = data[FIELDS.fatherName] || '';
    const fullAddress  = data[FIELDS.address] || '';
    const phone        = data[FIELDS.phone] || '';
    const landline     = data[FIELDS.landline] || '';
    const weaponSource = data[FIELDS.weaponSource] || '';
    const rangeDate    = data[FIELDS.rangeDate] || '';
    const enlistDate   = data[FIELDS.enlistDate] || '';
    const releaseDate  = data[FIELDS.releaseDate] || '';
    const rank         = data[FIELDS.rank] || '';
    const isFighter    = data[FIELDS.isFighter] || '';
    const signedDate   = data[FIELDS.signedDate] || '';

    // Download attachments to Google Drive
    const idPhotoFileId = data[FIELDS.idPhotoFile];
    const doctorFileId  = data[FIELDS.doctorFile];

    const soldierFolderName = firstName + ' ' + lastName + ' - ' + idNumber;
    const soldierFolder = getOrCreateFolder_(companyFolder, soldierFolderName);

    let doctorUrl = '';
    let idPhotoUrl = '';

    if (doctorFileId) {
      try {
        const file = downloadEasyDoFile_(token, form.id, doctorFileId, soldierFolder, 'אישור_רופא_' + idNumber);
        if (file) doctorUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error downloading doctor file for ' + firstName + ' ' + lastName + ': ' + e.message);
      }
    }

    if (idPhotoFileId) {
      try {
        const file = downloadEasyDoFile_(token, form.id, idPhotoFileId, soldierFolder, 'צילום_תז_' + idNumber);
        if (file) idPhotoUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error downloading ID photo for ' + firstName + ' ' + lastName + ': ' + e.message);
      }
    }

    // Timestamp
    const timestamp = form.signed_date ? new Date(form.signed_date) : new Date();

    // Company name for column D
    const companyHeb = templateInfo.name;

    // Write row matching Google Forms column structure (A-Z):
    // A=חותמת זמן, B=אימייל, C=ניקוד, D=פלוגה, E=שם פרטי, F=שם משפחה,
    // G=ת.ז, H=מ.א, I=שנת לידה, J=שם האב, K=רחוב, L=מס' בית,
    // M=יישוב, N=מיקוד, O=טלפון נייד, P=טלפון נייח, Q=מקור נשק,
    // R=מטווח בנק"ל, S=תאריך גיוס, T=תאריך שחרור, U=מועד אישור רפואי,
    // V=דרגה, W=הוסמכת כלוחם?, X=אישור רופא, Y=צילום ת.ז, Z=טלפון נייד
    dataTab.appendRow([
      timestamp,         // A - חותמת זמן
      '',                // B - כתובת אימייל (אין ב-EasyDo)
      '',                // C - ניקוד
      companyHeb,        // D - מאיזו פלוגה?
      firstName,         // E - שם פרטי
      lastName,          // F - שם משפחה
      idNumber,          // G - תעודת זהות
      personalNum,       // H - מספר אישי
      birthYear,         // I - שנת לידה
      fatherName,        // J - שם האב
      fullAddress,       // K - רחוב (כתובת מלאה מ-EasyDo)
      '',                // L - מס' הבית (כלול בכתובת)
      '',                // M - יישוב (כלול בכתובת)
      '',                // N - מיקוד (כלול בכתובת)
      phone,             // O - טלפון נייד
      landline,          // P - טלפון נייח
      weaponSource,      // Q - מקור הנשק
      rangeDate,         // R - מתי עברת מטווח בנק"ל
      enlistDate,        // S - תאריך גיוס לצה"ל
      releaseDate,       // T - תאריך שחרור מצה"ל
      signedDate,        // U - מועד אישור רפואי בטופס הבקשה
      rank,              // V - דרגה נוכחית בצה"ל
      isFighter,         // W - האם הוסמכת כלוחם?
      doctorUrl,         // X - נא לצרף אישור רופא חתום
      idPhotoUrl,        // Y - נא לצרף צילום תעודת זהות
      phone,             // Z - מספר טלפון נייד (חזרה על O)
    ]);

    processedIds.add(idNumber);
    added++;
    Logger.log('Added: ' + firstName + ' ' + lastName + ' (' + templateInfo.name + ')');
  }

  return added;
}

// ========== EasyDo API ==========

function callEasyDoAPI_(token, method, path, payload) {
  const url = EASYDO_API + path;
  const options = {
    method: method.toLowerCase(),
    headers: {
      'Authorization': 'Bearer ' + token,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    },
    muteHttpExceptions: true,
  };

  if (payload) {
    options.payload = JSON.stringify(payload);
  }

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code === 401) {
    throw new Error('EasyDo token expired! Update token in Script Properties → EASYDO_TOKEN');
  }

  if (code !== 200) {
    throw new Error('EasyDo API error ' + code + ': ' + response.getContentText().substring(0, 200));
  }

  return JSON.parse(response.getContentText());
}

function downloadEasyDoFile_(token, formId, fileId, folder, fileName) {
  const url = EASYDO_API + '/forms/' + formId + '/download/' + fileId;
  const options = {
    method: 'get',
    headers: {
      'Authorization': 'Bearer ' + token,
    },
    muteHttpExceptions: true,
  };

  const response = UrlFetchApp.fetch(url, options);
  const code = response.getResponseCode();

  if (code !== 200) {
    Logger.log('Download failed for file ' + fileId + ': HTTP ' + code);
    return null;
  }

  const blob = response.getBlob();

  // Detect file extension from content type
  const contentType = blob.getContentType();
  let ext = '.pdf';
  if (contentType && contentType.includes('image/jpeg')) ext = '.jpg';
  else if (contentType && contentType.includes('image/png')) ext = '.png';
  else if (contentType && contentType.includes('application/pdf')) ext = '.pdf';

  blob.setName(fileName + ext);

  // Check if file already exists in folder (avoid duplicates)
  const existingFiles = folder.getFilesByName(fileName + ext);
  if (existingFiles.hasNext()) {
    return existingFiles.next();
  }

  return folder.createFile(blob);
}

// ========== עזרים ==========

function getOrCreateFolder_(parent, name) {
  let iterator;
  if (parent) {
    iterator = parent.getFoldersByName(name);
  } else {
    iterator = DriveApp.getFoldersByName(name);
  }

  if (iterator.hasNext()) {
    return iterator.next();
  }

  if (parent) {
    return parent.createFolder(name);
  }
  return DriveApp.createFolder(name);
}

function appendLog_(ss, action, details) {
  let logTab = ss.getSheetByName(LOG_TAB_NAME);
  if (!logTab) return;
  logTab.appendRow([
    new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
    action,
    details
  ]);
}

// ========== עדכון טוקן ==========

/**
 * עדכון טוקן EasyDo — הרץ פעם אחת כשהטוקן פג
 * 1. התחבר ל-app.easydo.co.il
 * 2. פתח Console (F12)
 * 3. הרץ: JSON.parse(localStorage.getItem('@ngxs.store.easydoc_auth')).data.auth.access_token
 * 4. העתק את הטוקן והדבק למטה
 * 5. הרץ את הפונקציה הזו
 */
function updateToken() {
  const newToken = 'PASTE_NEW_TOKEN_HERE';
  if (newToken === 'PASTE_NEW_TOKEN_HERE') {
    Logger.log('הדבק את הטוקן החדש בפונקציה updateToken()');
    return;
  }

  const url = EASYDO_API;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + newToken, 'Accept': 'application/json' },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('טוקן לא תקין! בדוק שהעתקת נכון.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty(EASYDO_TOKEN_KEY, newToken);
  Logger.log('טוקן עודכן בהצלחה!');
}

// ========== הרצה ידנית ==========

function testSync() {
  syncNewForms();
}

function syncAll() {
  Logger.log('Starting full sync of all forms...');
  syncNewForms();
  Logger.log('Full sync complete.');
}

// ========== ניקוי כפילויות ==========

/**
 * מנקה כפילויות מהטבלה לפי תעודת זהות (עמודה G, index 6)
 * משאיר רק את השורה האחרונה לכל ת.ז
 */
function removeDuplicates() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) return;

  const data = dataTab.getDataRange().getValues();
  const seen = new Set();
  const rowsToDelete = [];

  // Go bottom-up so we keep the LAST entry for each ת.ז
  for (let i = data.length - 1; i >= 1; i--) {
    const idNum = String(data[i][6]).trim(); // column G = תעודת זהות
    if (!idNum) continue;
    if (seen.has(idNum)) {
      rowsToDelete.push(i + 1); // 1-based row number
    } else {
      seen.add(idNum);
    }
  }

  // Delete from bottom up to preserve row numbers
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    dataTab.deleteRow(rowsToDelete[i]);
  }

  Logger.log('Removed ' + rowsToDelete.length + ' duplicate rows. Kept latest entry per ID.');
}

/**
 * מחיקת שורות EasyDo (שעמודה B ריקה = לא Google Forms) והרצה מחדש
 * שומר על שורות שהגיעו מ-Google Forms (יש להן אימייל בעמודה B)
 */
function resetEasyDoAndSync() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab || dataTab.getLastRow() <= 1) {
    syncNewForms();
    return;
  }

  const data = dataTab.getDataRange().getValues();
  const rowsToDelete = [];

  // Find EasyDo rows (no email in column B = not from Google Forms)
  for (let i = data.length - 1; i >= 1; i--) {
    const email = String(data[i][1]).trim(); // column B = email
    if (!email) {
      rowsToDelete.push(i + 1);
    }
  }

  // Delete from bottom up
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    dataTab.deleteRow(rowsToDelete[i]);
  }

  Logger.log('Removed ' + rowsToDelete.length + ' EasyDo rows. Kept Google Forms rows.');
  syncNewForms();
}

// ========== ניקוי ==========

function removeTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'syncNewForms') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log('Trigger removed.');
    }
  }
}
