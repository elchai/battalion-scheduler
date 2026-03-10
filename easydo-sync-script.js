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
 *   W=הוסמכת כלוחם?, X=אישור רופא (קישור), Y=צילום ת.ז (קישור)
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
  doctorFile:    'custom_field_699b2cd099f77',   // file ID - אישור רופא (f77 מכיל בפועל את אישור הרופא)
  idPhotoFile:   'custom_field_699b2cd099f6e',   // file ID - צילום תעודת זהות (f6e מכיל בפועל את צילום הת.ז)
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
    const rawWeaponSource = data[FIELDS.weaponSource] || '';
    const rawWeaponType   = data[FIELDS.weaponType] || '';
    const rangeDate    = data[FIELDS.rangeDate] || '';
    const enlistDate   = data[FIELDS.enlistDate] || '';
    const releaseDate  = data[FIELDS.releaseDate] || '';
    const rank         = data[FIELDS.rank] || '';
    const isFighter    = data[FIELDS.isFighter] || '';
    const signedDate   = data[FIELDS.signedDate] || '';

    // Determine actual weapon source — skip fixed "הגנה גזרתית" text
    const weaponSource = resolveWeaponSource_(rawWeaponSource, rawWeaponType);

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

    // Parse address into components
    const addr = parseAddress_(fullAddress);

    // Write row matching Google Forms column structure (A-Z):
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
      addr.street,       // K - רחוב
      addr.number,       // L - מס' הבית
      addr.city,         // M - יישוב
      addr.zip,          // N - מיקוד
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

  // Delete from bottom up (rowsToDelete is already bottom-first from the loop above)
  for (const rowNum of rowsToDelete) {
    dataTab.deleteRow(rowNum);
  }

  Logger.log('Removed ' + rowsToDelete.length + ' EasyDo rows. Kept Google Forms rows.');
  syncNewForms();
}

// ========== פיצול כתובות + תיקון מקור נשק ==========

/**
 * מנתח כתובת מלאה לרכיבים: רחוב, מספר, יישוב, מיקוד
 * דוגמאות:
 *   "הדקל 5, דולב, 7194500" → { street: "הדקל", number: "5", city: "דולב", zip: "7194500" }
 *   "רחוב הזית 12 מודיעין" → { street: "הזית", number: "12", city: "מודיעין", zip: "" }
 *   "דולב" → { street: "", number: "", city: "דולב", zip: "" }
 */
function parseAddress_(fullAddress) {
  if (!fullAddress || !String(fullAddress).trim()) {
    return { street: '', number: '', city: '', zip: '' };
  }

  const raw = String(fullAddress).trim();

  // Split by comma or multiple spaces
  const parts = raw.split(/[,،]+/).map(p => p.trim()).filter(Boolean);

  let street = '', number = '', city = '', zip = '';

  if (parts.length >= 3) {
    // "רחוב 5, יישוב, מיקוד" or "רחוב, מספר, יישוב, מיקוד"
    const streetPart = parts[0];
    const streetMatch = streetPart.match(/^(.+?)\s+(\d+.*)$/);
    if (streetMatch) {
      street = streetMatch[1].replace(/^רחוב\s+/, '');
      number = streetMatch[2];
    } else {
      street = streetPart.replace(/^רחוב\s+/, '');
    }
    // Check last part for zip code (5-7 digits)
    const lastPart = parts[parts.length - 1];
    if (/^\d{5,7}$/.test(lastPart)) {
      zip = lastPart;
      city = parts.slice(1, parts.length - 1).join(' ');
    } else {
      city = parts.slice(1).join(' ');
    }
  } else if (parts.length === 2) {
    // "רחוב 5, יישוב" or "יישוב, מיקוד"
    const first = parts[0];
    const second = parts[1];
    if (/^\d{5,7}$/.test(second)) {
      // second is zip
      const m = first.match(/^(.+?)\s+(\d+.*)$/);
      if (m) { street = m[1].replace(/^רחוב\s+/, ''); number = m[2]; }
      else { city = first; }
      zip = second;
    } else {
      const m = first.match(/^(.+?)\s+(\d+.*)$/);
      if (m) { street = m[1].replace(/^רחוב\s+/, ''); number = m[2]; }
      else { street = first.replace(/^רחוב\s+/, ''); }
      city = second;
    }
  } else {
    // Single part — try to extract street+number, otherwise treat as city
    const m = raw.match(/^(.+?)\s+(\d+.*)$/);
    if (m) {
      street = m[1].replace(/^רחוב\s+/, '');
      number = m[2];
    } else {
      city = raw;
    }
  }

  return { street: street.trim(), number: number.trim(), city: city.trim(), zip: zip.trim() };
}

/**
 * קובע את מקור הנשק מתוך שני שדות EasyDo.
 * מדלג על הטקסט הקבוע "הגנה גזרתית" ומחזיר את המקור בפועל.
 * ברירת מחדל: "פרטי"
 */
function resolveWeaponSource_(rawSource, rawType) {
  const purposePattern = /הגנה\s*גזרתית/;
  // If rawSource is the fixed purpose text, use rawType instead
  if (rawSource && !purposePattern.test(rawSource)) return rawSource;
  if (rawType && !purposePattern.test(rawType)) return rawType;
  // Both are empty or both are the fixed text — default to פרטי
  return 'פרטי';
}

/**
 * פיצול וניקוי כתובות קיימות בגיליון.
 * שלב 1: פיצול תוכן מעורבב מעמודה L (מס' הבית)
 * שלב 2: ניקוי עמודה M (יישוב) — ת.ד., דירה, מיקוד מעורבב
 * שלב 3: אם K (רחוב) ריק — משכפל את שם העיר מ-M
 * הרץ פעם אחת: Run > splitExistingAddresses
 */
function splitExistingAddresses() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) { Logger.log('Tab not found'); return; }

  const data = dataTab.getDataRange().getValues();
  let updated = 0;

  for (let i = 1; i < data.length; i++) {
    const row = i + 1;
    let kVal = String(data[i][10] || '').trim(); // K = רחוב
    let lVal = String(data[i][11] || '').trim(); // L = מס' הבית
    let mVal = String(data[i][12] || '').trim(); // M = יישוב
    let nVal = String(data[i][13] || '').trim(); // N = מיקוד
    let changed = false;

    // --- שלב 1: פיצול L אם מכיל תוכן מעורבב ---
    if (lVal && !mVal) {
      const hasHebrew = /[\u0590-\u05FF]/.test(lVal);
      const hasZip = /\d{5,7}/.test(lVal);
      if (hasHebrew || hasZip) {
        const parsed = parseMixedHouseNumber_(lVal);
        lVal = parsed.number;
        mVal = parsed.city;
        if (parsed.zip) nVal = parsed.zip;
        changed = true;
        Logger.log('Row ' + row + ' L split: "' + data[i][11] + '" → L=' + lVal + ', M=' + mVal + ', N=' + nVal);
      }
    }

    // --- שלב 2: ניקוי M אם מכיל תוכן מעורבב ---
    if (mVal) {
      // מקרה: "ת.ד. 193 מיקוד: 7319000" או "ת.ד 45"
      const tdMatch = mVal.match(/ת\.?ד\.?\s*(\d+)/);
      if (tdMatch) {
        lVal = 'ת.ד. ' + tdMatch[1]; // ת.ד. → L
        // חלץ מיקוד אם יש
        const zipInM = mVal.match(/\b(\d{5,7})\b/);
        if (zipInM) nVal = zipInM[1];
        // חלץ שם עיר (מה שנשאר אחרי הסרת ת.ד. ומיקוד)
        let remaining = mVal
          .replace(/ת\.?ד\.?\s*\d+/, '')
          .replace(/מיקוד:?\s*\d+/, '')
          .replace(/\d{5,7}/, '')
          .trim();
        // אם לא נשאר שם עיר, השתמש ב-K
        mVal = remaining || kVal;
        changed = true;
        Logger.log('Row ' + row + ' ת.ד: L=' + lVal + ', M=' + mVal + ', N=' + nVal);
      }

      // מקרה: "דירה 1 מודיעין מכבים רעות"
      const diraMatch = mVal.match(/^(דירה\s+\d+)\s+([\u0590-\u05FF].+)$/);
      if (diraMatch) {
        lVal = lVal ? lVal + ' ' + diraMatch[1] : diraMatch[1]; // צרף "דירה X" ל-L
        mVal = diraMatch[2].trim();
        changed = true;
        Logger.log('Row ' + row + ' דירה: L=' + lVal + ', M=' + mVal);
      }
    }

    // --- שלב 3: אם K ריק — שכפל שם העיר ---
    if (!kVal && mVal) {
      kVal = mVal;
      changed = true;
      Logger.log('Row ' + row + ' K empty → copied city: K=' + kVal);
    }

    // כתוב שינויים
    if (changed) {
      dataTab.getRange(row, 11).setValue(kVal);  // K = רחוב
      dataTab.getRange(row, 12).setValue(lVal);  // L = מס' בית
      dataTab.getRange(row, 13).setValue(mVal);  // M = יישוב
      dataTab.getRange(row, 14).setValue(nVal);  // N = מיקוד
      updated++;
    }
  }

  Logger.log('Fixed ' + updated + ' address rows.');
  appendLog_(ss, 'פיצול כתובות', 'עודכנו ' + updated + ' שורות');
}

/**
 * מנתח תוכן מעורבב מעמודה L (מס' הבית).
 * דוגמאות:
 *   "30 מודיעין מכבים רעות 830" → { number: "30", city: "מודיעין מכבים רעות", zip: "" }
 *   "253/1 דולב 7193500"        → { number: "253/1", city: "דולב", zip: "7193500" }
 *   "18/10 מודיעין"             → { number: "18/10", city: "מודיעין", zip: "" }
 *   "36 בת ים"                  → { number: "36", city: "בת ים", zip: "" }
 *   "12 תל אביב"               → { number: "12", city: "תל אביב", zip: "" }
 *   "השלום"                     → { number: "", city: "השלום", zip: "" }
 */
function parseMixedHouseNumber_(val) {
  let number = '', city = '', zip = '';

  // Extract zip code (5-7 digits at end or standalone)
  const zipMatch = val.match(/\b(\d{5,7})\b/);
  if (zipMatch) {
    zip = zipMatch[1];
    val = val.replace(zipMatch[0], '').trim();
  }

  // Try to split: leading number/fraction + Hebrew city name
  // Pattern: optional number (like 30, 253/1, 18/10) followed by Hebrew text
  const m = val.match(/^(\d+(?:[\/\-]\d+)?)\s+([\u0590-\u05FF].*)$/);
  if (m) {
    number = m[1];
    city = m[2].trim();
  } else if (/^[\u0590-\u05FF]/.test(val)) {
    // Starts with Hebrew — it's all city name (like "השלום")
    city = val;
  } else if (/^\d+(?:[\/\-]\d+)?$/.test(val)) {
    // Pure number remaining after zip extraction
    number = val;
  } else {
    // Fallback — put everything in city
    city = val;
  }

  return { number: number.trim(), city: city.trim(), zip: zip.trim() };
}

/**
 * השלמת מיקוד חסר (עמודה N) לפי עמודה M (עיר).
 * שלב 1: בונה מיפוי עיר→מיקוד מהשורות שכבר מלאות.
 * שלב 2: משלים מיקוד לשורות עם עיר ללא מיקוד.
 * כולל מיפוי fallback לישובים נפוצים.
 * הרץ פעם אחת: Run > fillMissingZipCodes
 */
function fillMissingZipCodes() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) { Logger.log('Tab not found'); return; }

  const data = dataTab.getDataRange().getValues();

  // Fallback map — ישובים נפוצים עם מיקוד
  const fallbackZips = {
    'ירושלים': '9100000',
    'תל אביב': '6100000',
    'תל אביב יפו': '6100000',
    'חיפה': '3100000',
    'באר שבע': '8400000',
    'נתניה': '4210000',
    'אשדוד': '7700000',
    'אשקלון': '7810000',
    'פתח תקווה': '4900000',
    'ראשון לציון': '7500000',
    'חולון': '5800000',
    'בת ים': '5900000',
    'בני ברק': '5100000',
    'רמת גן': '5200000',
    'גבעתיים': '5300000',
    'הרצליה': '4610000',
    'כפר סבא': '4430000',
    'רעננה': '4350000',
    'הוד השרון': '4500000',
    'רמלה': '7210000',
    'לוד': '7100000',
    'מודיעין מכבים רעות': '7170000',
    'מודיעין': '7170000',
    'רחובות': '7610000',
    'נס ציונה': '7400000',
    'קריית גת': '8200000',
    'עפולה': '1800000',
    'טבריה': '1410000',
    'נצרת עילית': '1700000',
    'נוף הגליל': '1700000',
    'קריית שמונה': '1100000',
    'צפת': '1300000',
    'עכו': '2400000',
    'נהריה': '2200000',
    'כרמיאל': '2160000',
    'קריית אתא': '2800000',
    'קריית ביאליק': '2700000',
    'קריית מוצקין': '2600000',
    'קריית ים': '2900000',
    'טירת כרמל': '3900000',
    'אור עקיבא': '3060000',
    'חדרה': '3800000',
    'זכרון יעקב': '3095000',
    'יקנעם עילית': '2060000',
    'מגדל העמק': '2310000',
    'בית שאן': '1080000',
    'אילת': '8800000',
    'דימונה': '8600000',
    'ערד': '8900000',
    'מצפה רמון': '8060000',
    'אריאל': '4070000',
    'מעלה אדומים': '9834000',
    'ביתר עילית': '9090000',
    'בית שמש': '9900000',
    'קריית מלאכי': '8300000',
    'שדרות': '8700000',
    'אופקים': '8730000',
    'נתיבות': '8770000',
    'יבנה': '8100000',
    'גדרה': '7090000',
    'קריית עקרון': '7680000',
    'אור יהודה': '6020000',
    'יהוד מונוסון': '5600000',
    'גני תקווה': '5590000',
    'קריית אונו': '5550000',
    'אלעד': '4080000',
    'רמת השרון': '4720000',
    'גבעת שמואל': '5400000',
    'פרדס חנה כרכור': '3700000',
    'בנימינה': '3080000',
    'עתלית': '3060000',
    'דולב': '9063500',
    'טלמון': '7284400',
    'נחשונים': '7319000',
  };

  // שלב 1: בניית מיפוי עיר→מיקוד מהנתונים הקיימים
  const cityZipMap = {};
  for (let i = 1; i < data.length; i++) {
    const city = String(data[i][12] || '').trim(); // M = index 12
    const zip  = String(data[i][13] || '').trim(); // N = index 13
    if (city && zip && /^\d{5,7}$/.test(zip)) {
      cityZipMap[city] = zip;
    }
  }

  // מיזוג fallback (לא דורס נתונים קיימים)
  for (const [city, zip] of Object.entries(fallbackZips)) {
    if (!cityZipMap[city]) cityZipMap[city] = zip;
  }

  Logger.log('City→Zip map has ' + Object.keys(cityZipMap).length + ' entries');

  // שלב 2: השלמת מיקוד חסר
  let filled = 0;
  for (let i = 1; i < data.length; i++) {
    const city = String(data[i][12] || '').trim(); // M
    const zip  = String(data[i][13] || '').trim(); // N
    if (city && (!zip || !/^\d{5,7}$/.test(zip))) {
      const foundZip = cityZipMap[city];
      if (foundZip) {
        dataTab.getRange(i + 1, 14).setValue(foundZip); // N = column 14 (1-based)
        filled++;
        Logger.log('Row ' + (i + 1) + ': ' + city + ' → ' + foundZip);
      } else {
        Logger.log('Row ' + (i + 1) + ': no zip found for "' + city + '"');
      }
    }
  }

  Logger.log('Filled ' + filled + ' missing zip codes.');
  appendLog_(ss, 'השלמת מיקוד', 'הושלמו ' + filled + ' מיקודים חסרים');
}

/**
 * תיקון עמודה Q (מקור הנשק) בשורות קיימות.
 * אם Q ריק או מכיל "הגנה גזרתית" → מחליף ל"פרטי".
 * הרץ פעם אחת: Run > fixExistingWeaponSource
 */
function fixExistingWeaponSource() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) { Logger.log('Tab not found'); return; }

  const data = dataTab.getDataRange().getValues();
  let updated = 0;

  for (let i = 1; i < data.length; i++) {
    const qVal = String(data[i][16] || '').trim(); // Q = index 16
    if (!qVal || /הגנה\s*גזרתית/.test(qVal)) {
      dataTab.getRange(i + 1, 17).setValue('פרטי'); // Q = column 17 (1-based)
      updated++;
    }
  }

  Logger.log('Fixed ' + updated + ' weapon source values to "פרטי".');
  appendLog_(ss, 'תיקון מקור נשק', 'עודכנו ' + updated + ' שורות ל"פרטי"');
}

/**
 * Debug — מדפיס את כל השדות של טופס אחד כדי לזהות field IDs
 */
function debugFields() {
  const token = PropertiesService.getScriptProperties().getProperty(EASYDO_TOKEN_KEY);
  if (!token) { Logger.log('No token'); return; }

  const templateId = Object.keys(TEMPLATES)[0]; // first template
  const response = callEasyDoAPI_(token, 'POST', '/templates/' + templateId + '/data-table', {
    page: 1, per_page: 1, sort_by: 'created_at', sort_direction: 'desc'
  });

  if (!response || !response.data || !response.data[0]) {
    Logger.log('No data found');
    return;
  }

  const item = response.data[0];
  const data = item.data || {};
  Logger.log('=== Form ID: ' + item.form.id + ' ===');
  Logger.log('=== Status: ' + item.form.status + ' ===');

  for (const [key, val] of Object.entries(data)) {
    // Find known name
    let label = key;
    for (const [name, fieldId] of Object.entries(FIELDS)) {
      if (fieldId === key) { label = name + ' (' + key + ')'; break; }
    }
    Logger.log(label + ' = ' + JSON.stringify(val));
  }
}

/**
 * מוחק את כל תיקיות החיילים ב-Drive (תחת "טפסי נשק - EasyDo").
 * הרץ לפני resetEasyDoAndSync כשצריך להוריד קבצים מחדש עם שמות נכונים.
 * Run > cleanDriveFiles
 */
function cleanDriveFiles() {
  const rootIter = DriveApp.getFoldersByName(DRIVE_ROOT_FOLDER);
  if (!rootIter.hasNext()) {
    Logger.log('Root folder not found: ' + DRIVE_ROOT_FOLDER);
    return;
  }
  const rootFolder = rootIter.next();
  let deleted = 0;

  // Iterate company folders
  const companyFolders = rootFolder.getFolders();
  while (companyFolders.hasNext()) {
    const companyFolder = companyFolders.next();
    // Delete all soldier sub-folders inside each company folder
    const soldierFolders = companyFolder.getFolders();
    while (soldierFolders.hasNext()) {
      const sf = soldierFolders.next();
      sf.setTrashed(true);
      deleted++;
    }
    Logger.log(companyFolder.getName() + ': deleted ' + deleted + ' soldier folders');
  }

  Logger.log('Total deleted: ' + deleted + ' soldier folders. Now run resetEasyDoAndSync().');
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
