/**
 * EasyDo Weapons Form - Direct API Sync
 *
 * סורק טפסים חתומים ישירות מ-API של EasyDo (לא דרך Gmail).
 * מוריד קבצים מצורפים (צילום ת.ז + אישור רופא) ושומר ב-Google Drive.
 * מעדכן Google Sheets עם כל הנתונים + קישורים לקבצים.
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

// Google Sheets
const WEAPONS_SHEET_ID = '1paWndmcqlsaKZJLYDcI2KHRkO5b2nkNarQj6Vo16Uk0';
const DATA_TAB_NAME = 'נתוני טפסים';
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
  firstName:    'custom_field_699b2cd099ef1',
  lastName:     'custom_field_699b2cd099ef7',
  idNumber:     'custom_field_699b2cd099efb',
  personalNum:  'custom_field_699b2cd099eff',
  birthYear:    'custom_field_699b2cd099f03',
  fatherName:   'custom_field_699b2cd099f07',
  address:      'custom_field_699b2cd099f0b',
  phone:        'custom_field_699b2cd099f0e',
  weaponType:   'custom_field_699b2cd099f1e',
  rank:         'custom_field_699b2cd099f30',
  unit:         'custom_field_699b2cd099f3b',
  idPhotoFile:  'custom_field_699b2cd099f6e',  // file ID - צילום תעודת זהות
  doctorFile:   'custom_field_699b2cd099f77',  // file ID - אישור רופא
  signedDate:   'custom_field_699b2cd099f47',
};

// ========== הגדרה ראשונית ==========

function setup() {
  // 1. Set token (CHANGE THIS before first run!)
  const currentToken = PropertiesService.getScriptProperties().getProperty(EASYDO_TOKEN_KEY);
  if (!currentToken) {
    // Paste your token here on first setup, then it's stored securely
    const token = 'PASTE_YOUR_EASYDO_TOKEN_HERE';
    if (token === 'PASTE_YOUR_EASYDO_TOKEN_HERE') {
      Logger.log('⚠️ עדכן את הטוקן בפונקציית setup() לפני הפעלה ראשונה!');
      return;
    }
    PropertiesService.getScriptProperties().setProperty(EASYDO_TOKEN_KEY, token);
    Logger.log('Token saved.');
  }

  // 2. Create spreadsheet tabs
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);

  let dataTab = ss.getSheetByName(DATA_TAB_NAME);
  if (!dataTab) {
    dataTab = ss.insertSheet(DATA_TAB_NAME);
    dataTab.appendRow([
      'form_id', 'פלוגה', 'שם פרטי', 'שם משפחה', 'ת.ז', 'מ.א',
      'טלפון', 'דרגה', 'סוג נשק', 'תאריך חתימה', 'תאריך מילוי',
      'צילום ת.ז (קישור)', 'אישור רופא (קישור)', 'PDF חתום (קישור)',
      'סטטוס'
    ]);
    dataTab.getRange(1, 1, 1, 15).setFontWeight('bold');
    dataTab.setFrozenRows(1);
    Logger.log('Created tab: ' + DATA_TAB_NAME);
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

  Logger.log('✅ Setup complete!');
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

  // Get existing form IDs to skip
  const existingData = dataTab.getDataRange().getValues();
  const processedFormIds = new Set();
  for (let i = 1; i < existingData.length; i++) {
    if (existingData[i][0]) processedFormIds.add(String(existingData[i][0]));
  }

  const rootFolder = getOrCreateFolder_(null, DRIVE_ROOT_FOLDER);
  let totalAdded = 0;

  for (const [templateId, templateInfo] of Object.entries(TEMPLATES)) {
    try {
      const added = processTemplate_(token, templateId, templateInfo, dataTab, processedFormIds, rootFolder);
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

function processTemplate_(token, templateId, templateInfo, dataTab, processedFormIds, rootFolder) {
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

    // Skip already processed
    if (processedFormIds.has(String(form.id))) continue;

    const firstName = data[FIELDS.firstName] || '';
    const lastName = data[FIELDS.lastName] || '';
    const idNumber = data[FIELDS.idNumber] || '';
    const personalNum = data[FIELDS.personalNum] || '';
    const phone = data[FIELDS.phone] || '';
    const rank = data[FIELDS.rank] || '';
    const weaponType = data[FIELDS.weaponType] || '';
    const signedDate = data[FIELDS.signedDate] || '';
    const formSignedDate = form.signed_date || '';

    // Download attachments
    const idPhotoFileId = data[FIELDS.idPhotoFile];
    const doctorFileId = data[FIELDS.doctorFile];
    const pdfFileId = form.file_id;

    const soldierFolderName = firstName + ' ' + lastName + ' - ' + idNumber;
    const soldierFolder = getOrCreateFolder_(companyFolder, soldierFolderName);

    let idPhotoUrl = '';
    let doctorUrl = '';
    let pdfUrl = '';

    // Download ID photo
    if (idPhotoFileId) {
      try {
        const file = downloadEasyDoFile_(token, form.id, idPhotoFileId, soldierFolder, 'צילום_תז_' + idNumber);
        if (file) idPhotoUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error downloading ID photo for ' + firstName + ' ' + lastName + ': ' + e.message);
      }
    }

    // Download doctor approval
    if (doctorFileId) {
      try {
        const file = downloadEasyDoFile_(token, form.id, doctorFileId, soldierFolder, 'אישור_רופא_' + idNumber);
        if (file) doctorUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error downloading doctor file for ' + firstName + ' ' + lastName + ': ' + e.message);
      }
    }

    // Download signed PDF
    if (pdfFileId) {
      try {
        const file = downloadEasyDoFile_(token, form.id, pdfFileId, soldierFolder, 'טופס_חתום_' + idNumber);
        if (file) pdfUrl = file.getUrl();
      } catch (e) {
        Logger.log('Error downloading PDF for ' + firstName + ' ' + lastName + ': ' + e.message);
      }
    }

    // Format dates
    const createdDate = form.created_at ? new Date(form.created_at).toLocaleDateString('he-IL') : '';

    // Add row to sheet
    dataTab.appendRow([
      form.id,
      templateInfo.name,
      firstName,
      lastName,
      idNumber,
      personalNum,
      phone,
      rank,
      weaponType,
      signedDate,
      createdDate,
      idPhotoUrl,
      doctorUrl,
      pdfUrl,
      'נקלט'
    ]);

    processedFormIds.add(String(form.id));
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
    return existingFiles.next(); // Return existing file
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
    Logger.log('⚠️ הדבק את הטוקן החדש בפונקציה updateToken()');
    return;
  }

  // Verify token works
  const url = EASYDO_API;
  const response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: { 'Authorization': 'Bearer ' + newToken, 'Accept': 'application/json' },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    Logger.log('❌ טוקן לא תקין! בדוק שהעתקת נכון.');
    return;
  }

  PropertiesService.getScriptProperties().setProperty(EASYDO_TOKEN_KEY, newToken);
  Logger.log('✅ טוקן עודכן בהצלחה!');
}

// ========== הרצה ידנית ==========

function testSync() {
  syncNewForms();
}

/**
 * הרצה חד-פעמית — מוריד את כל הטפסים הקיימים
 * (אם רוצים לשחזר את כל ההיסטוריה)
 */
function syncAll() {
  Logger.log('Starting full sync of all forms...');
  syncNewForms();
  Logger.log('Full sync complete.');
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
