/**
 * EasyDo Weapons Form - Gmail to Google Sheets Sync
 *
 * סורק אימיילים מ-EasyDo ומעדכן גיליון Google Sheets עם שמות חיילים שמילאו טופס.
 * מחלץ את שם החותם מתוך ה-PDF המצורף (כי EasyDo לא שולח את השם באימייל).
 *
 * התקנה על החשבון הגדודי (gdud1875idf@gmail.com):
 * 1. פתח https://script.google.com
 * 2. צור פרויקט חדש
 * 3. העתק את הקוד הזה ל-Code.gs
 * 4. הפעל שירות מתקדם: Resources > Advanced Google services > Drive API > ON
 * 5. הפעל את הפונקציה setup() פעם אחת (Run > setup)
 * 6. אשר הרשאות Gmail + Sheets + Drive
 * 7. הסקריפט ירוץ אוטומטית כל 5 דקות
 */

// ========== הגדרות ==========
const WEAPONS_SHEET_ID = '1paWndmcqlsaKZJLYDcI2KHRkO5b2nkNarQj6Vo16Uk0';
const STATUS_TAB_NAME = 'סטטוס מילוי';
const PROCESSED_LABEL = 'weapons-processed';
const TEMP_FOLDER_NAME = '_weapons_temp';

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

  // Create temp folder for PDF processing
  const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
  if (!folders.hasNext()) {
    DriveApp.createFolder(TEMP_FOLDER_NAME);
    Logger.log('Created temp folder: ' + TEMP_FOLDER_NAME);
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
      if (existingData[i][4]) existingIds.add(existingData[i][4]);
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

        // Try to extract name from subject first
        let signerName = extractSignerFromSubject(subject);

        // If not in subject, extract from PDF attachment
        if (!signerName) {
          const attachments = message.getAttachments();
          const pdfAtt = attachments.find(a => a.getContentType() === 'application/pdf');
          if (pdfAtt) {
            signerName = extractNameFromPdf(pdfAtt);
          }
        }

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

// ========== חילוץ שם מהנושא ==========

function extractSignerFromSubject(subject) {
  const match = subject.match(/ע"י\s+(.{2,})$/);
  return match ? match[1].trim() : null;
}

// ========== חילוץ שם מתוך PDF ==========

function extractNameFromPdf(pdfAttachment) {
  let tempFile = null;
  let docFile = null;
  try {
    // Get temp folder
    const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
    const folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(TEMP_FOLDER_NAME);

    // Save PDF to Drive
    tempFile = folder.createFile(pdfAttachment);

    // Convert PDF to Google Doc using OCR
    const resource = {
      title: 'temp_ocr_' + Date.now(),
      mimeType: 'application/vnd.google-apps.document'
    };
    const options = {
      ocr: true,
      ocrLanguage: 'he'
    };
    const docMeta = Drive.Files.copy(resource, tempFile.getId(), options);
    docFile = DriveApp.getFileById(docMeta.id);

    // Read text from converted doc
    const doc = DocumentApp.openById(docMeta.id);
    const text = doc.getBody().getText();

    // Extract name from text - look for first+last name pattern on page 1
    // The PDF has fields: שם פרטי, שם משפחה followed by the actual values
    const name = parseNameFromPdfText(text);

    return name;

  } catch (err) {
    Logger.log('PDF extraction error: ' + err.message);
    return null;
  } finally {
    // Cleanup temp files
    try { if (tempFile) tempFile.setTrashed(true); } catch(e) {}
    try { if (docFile) docFile.setTrashed(true); } catch(e) {}
  }
}

function parseNameFromPdfText(text) {
  // OCR output structure from EasyDo weapons form:
  // "שם פרטי שם משפחה תעודת זהות מספר אישי..." (labels line)
  // then blank lines
  // then "גע כ 033305392 4 4 4" (data: name + ID + other fields)
  // The name is the Hebrew text BEFORE the first digit sequence.

  var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l; });

  // Strategy 1: Find data line after "שם פרטי שם משפחה תעודת זהות" header
  for (var i = 0; i < lines.length; i++) {
    if (lines[i].indexOf('שם פרטי') >= 0 && lines[i].indexOf('תעודת זהות') >= 0) {
      // Look at next lines for actual data (skip labels and empty)
      for (var j = i + 1; j < Math.min(i + 5, lines.length); j++) {
        var line = lines[j];
        // Skip label lines
        if (line.indexOf('רחוב') >= 0 || line.indexOf('יישוב') >= 0) continue;
        if (line.indexOf('שם פרטי') >= 0) continue;
        // Extract Hebrew text before first digit sequence
        var nameMatch = line.match(/([\u05d0-\u05ea][\u05d0-\u05ea\s\-'"]+)/);
        if (nameMatch) {
          var name = nameMatch[1].trim();
          // Must be at least 2 chars, skip known non-name words
          if (name.length >= 2 && name.indexOf('בלמ') < 0 && name.indexOf('חטיבה') < 0 && name.indexOf('טופס') < 0) {
            return name;
          }
        }
      }
    }
  }

  // Strategy 2 (fallback): Any line with Hebrew name followed by digits (like "יצחק אשכנזי022395875")
  for (var k = 0; k < lines.length; k++) {
    var m = lines[k].match(/^([\u05d0-\u05ea][\u05d0-\u05ea\s]{2,20})\d{6,}/);
    if (m) {
      var candidate = m[1].trim();
      if (candidate.indexOf('בלמ') < 0 && candidate.indexOf('חטיבה') < 0 && candidate.indexOf('טופס') < 0) {
        return candidate;
      }
    }
  }

  return null;
}

// ========== חילוץ פלוגה ==========

function extractCompany(subject) {
  const match = subject.match(/פלוגה\s+([\u05d0-\u05ea]['"]?)/);
  if (match) {
    const key = match[1].replace(/['"]/g, '');
    for (const [heb, eng] of Object.entries(COMPANY_MAP)) {
      if (heb.includes(key)) return eng;
    }
  }

  if (subject.includes('1875')) return 'battalion';

  return 'unknown';
}

// ========== בדיקה ידנית ==========

function testManual() {
  checkNewWeaponsForms();
}

// ========== עיבוד מחדש (אחרי תיקון קוד) ==========

function reprocessAll() {
  // Remove processed label from all weapons emails so they get reprocessed
  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL);
  if (!label) { Logger.log('No label found'); return; }

  const threads = label.getThreads();
  Logger.log('Removing label from ' + threads.length + ' threads');
  for (const thread of threads) {
    thread.removeLabel(label);
  }

  // Clear existing data (keep header)
  const ss = SpreadsheetApp.openById(WEAPONS_SHEET_ID);
  const tab = ss.getSheetByName(STATUS_TAB_NAME);
  if (tab && tab.getLastRow() > 1) {
    tab.deleteRows(2, tab.getLastRow() - 1);
  }

  Logger.log('Ready to reprocess. Now run testManual().');
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
