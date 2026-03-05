/**
 * EasyDo Weapons Form - Gmail to Google Sheets Sync
 *
 * סורק אימיילים מ-EasyDo ומעדכן גיליון Google Sheets עם שמות חיילים שמילאו טופס.
 * המערכת הגדודית קוראת את הגיליון ומציגה סטטוס בזמן אמת.
 *
 * התקנה על החשבון הגדודי (gdud1875idf@gmail.com):
 * 1. פתח https://script.google.com
 * 2. צור פרויקט חדש
 * 3. העתק את הקוד הזה ל-Code.gs
 * 4. הפעל את הפונקציה setup() פעם אחת (Run > setup)
 * 5. אשר הרשאות Gmail + Sheets
 * 6. הסקריפט ירוץ אוטומטית כל 5 דקות
 */

// ========== הגדרות ==========
const WEAPONS_SHEET_ID = '1paWndmcqlsaKZJLYDcI2KHRkO5b2nkNarQj6Vo16Uk0';
const STATUS_TAB_NAME = 'סטטוס מילוי';
const PROCESSED_LABEL = 'weapons-processed';

// זיהוי פלוגה מהנושא/שם הטופס
const COMPANY_MAP = {
  "א'": 'a', "א": 'a', 'פלוגה א': 'a',
  "ב'": 'b', "ב": 'b', 'פלוגה ב': 'b',
  "ג'": 'c', "ג": 'c', 'פלוגה ג': 'c',
  "ד'": 'd', "ד": 'd', 'פלוגה ד': 'd',
  '1875': 'battalion',
};

// ========== הגדרה ראשונית ==========

function setup() {
  // Create Gmail label
  let label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!label) {
    label = GmailApp.createLabel(PROCESSED_LABEL);
    Logger.log('Created label: ' + PROCESSED_LABEL);
  }

  // Create status tab if missing
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  let tab = ss.getSheetByName(STATUS_TAB_NAME);
  if (!tab) {
    tab = ss.insertSheet(STATUS_TAB_NAME);
    tab.appendRow(['שם חותם', 'פלוגה', 'תאריך מילוי', 'נושא אימייל', 'מזהה אימייל']);
    tab.getRange(1, 1, 1, 5).setFontWeight('bold');
    tab.setColumnWidth(1, 200);
    tab.setColumnWidth(2, 100);
    tab.setColumnWidth(3, 160);
    tab.setColumnWidth(4, 300);
    Logger.log('Created tab: ' + STATUS_TAB_NAME);
  }

  // Set up time trigger
  const triggers = ScriptApp.getProjectTriggers();
  const existing = triggers.find(t => t.getHandlerFunction() === 'checkNewWeaponsForms');
  if (!existing) {
    ScriptApp.newTrigger('checkNewWeaponsForms')
      .timeBased()
      .everyMinutes(5)
      .create();
    Logger.log('Created 5-minute trigger');
  }

  Logger.log('Setup complete!');
}

// ========== סריקת אימיילים ==========

function checkNewWeaponsForms() {
  try {
    const processedLabel = GmailApp.getUserLabelByName(PROCESSED_LABEL);
    if (!processedLabel) {
      Logger.log('Label not found. Run setup() first.');
      return;
    }

    // Search for unprocessed signed-form emails from EasyDo
    const query = 'from:no-reply@easydo.co.il subject:נחתם -label:' + PROCESSED_LABEL;
    const threads = GmailApp.search(query, 0, 50);

    if (threads.length === 0) {
      Logger.log('No new weapons form emails.');
      return;
    }

    Logger.log('Found ' + threads.length + ' threads to process.');

    const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
    let tab = ss.getSheetByName(STATUS_TAB_NAME);
    if (!tab) {
      Logger.log('Status tab not found. Run setup() first.');
      return;
    }

    // Get existing entries to avoid duplicates
    const existingData = tab.getDataRange().getValues();
    const existingIds = new Set();
    for (let i = 1; i < existingData.length; i++) {
      if (existingData[i][4]) existingIds.add(existingData[i][4]); // message ID column
    }

    let added = 0;

    for (const thread of threads) {
      const messages = thread.getMessages();
      for (const message of messages) {
        const msgId = message.getId();
        if (existingIds.has(msgId)) continue;

        const subject = message.getSubject();
        const date = message.getDate();

        // Only process weapons form emails
        if (!subject.includes('נחתם') || !subject.includes('נשק')) continue;

        // Extract signer name: "טופס חדש נחתם טופס החתמה על נשק - פלוגה ב ע"י יצחק אשכנזי"
        const signerName = extractSignerName(subject, message.getPlainBody());
        if (!signerName) {
          Logger.log('Could not extract name from: ' + subject);
          continue;
        }

        // Extract company
        const company = extractCompany(subject);

        // Add row
        tab.appendRow([
          signerName,
          company,
          Utilities.formatDate(date, 'Asia/Jerusalem', 'yyyy-MM-dd HH:mm'),
          subject,
          msgId
        ]);

        existingIds.add(msgId);
        added++;
        Logger.log('Added: ' + signerName + ' (' + company + ')');
      }

      // Mark as processed
      thread.addLabel(processedLabel);
    }

    Logger.log('Done. Added ' + added + ' new entries.');

  } catch (err) {
    Logger.log('Error: ' + err.message);
  }
}

// ========== חילוץ שם חותם ==========

function extractSignerName(subject, body) {
  // Pattern 1: "ע"י [name]" at end of subject
  const match1 = subject.match(/ע"י\s+(.+?)$/);
  if (match1) return match1[1].trim();

  // Pattern 2: "טופס מולא ע"י: [name]" in body
  const match2 = body.match(/מולא\s+ע"י[:\s]+(.+?)[\n\r]/);
  if (match2) return match2[1].trim();

  // Pattern 3: "חותם: [name]" in body
  const match3 = body.match(/חותם[:\s]+(.+?)[\n\r]/);
  if (match3) return match3[1].trim();

  // Pattern 4: attachment filename "טופס-[name].pdf"
  // (handled separately if needed)

  return null;
}

// ========== חילוץ פלוגה ==========

function extractCompany(subject) {
  // Try to find company in subject
  const match = subject.match(/פלוגה\s+([\u05d0-\u05ea]['"]?)/);
  if (match) {
    const key = match[1].replace(/['"]/g, '');
    for (const [heb, eng] of Object.entries(COMPANY_MAP)) {
      if (heb.includes(key)) return eng;
    }
  }

  // Check for battalion-level
  if (subject.includes('1875')) return 'battalion';

  return 'unknown';
}

// ========== בדיקה ידנית ==========

function testManual() {
  checkNewWeaponsForms();
}

// ========== ייבוא חיילים שכבר מילאו (הפעלה חד-פעמית) ==========

function importExisting() {
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  let tab = ss.getSheetByName(STATUS_TAB_NAME);
  if (!tab) {
    Logger.log('Run setup() first.');
    return;
  }

  const existing = [
    ['יצחק אשכנזי', 'b', '2026-02-23', 'ייבוא ידני', 'import_1'],
    ['פטובי', 'b', '2026-02-22', 'ייבוא ידני', 'import_2'],
    ['כהן', 'b', '2026-02-22', 'ייבוא ידני', 'import_3'],
    ['אסרף', 'b', '2026-02-22', 'ייבוא ידני', 'import_4'],
    ['אבו סיאם', 'b', '2026-03-01', 'ייבוא ידני', 'import_5'],
    ['לנדאו', 'b', '2026-02-27', 'ייבוא ידני', 'import_6'],
    ['מקס', 'b', '2026-02-14', 'ייבוא ידני', 'import_7'],
    ['טיטלבוים', 'b', '2026-03-24', 'ייבוא ידני', 'import_8'],
    ['אמון', 'battalion', '2026-02-23', 'ייבוא ידני', 'import_9'],
    ['סויסא', 'battalion', '2026-02-22', 'ייבוא ידני', 'import_10'],
  ];

  existing.forEach(row => tab.appendRow(row));
  Logger.log('Imported ' + existing.length + ' entries.');
}
