/**
 * Battalion Main Soldiers Sheet - Web App for Soldier Deletion
 *
 * סקריפט נפרד עבור הגיליון הראשי של חיילי הגדוד.
 * מספק נקודת קצה (Web App) למחיקת חיילים מתוך המערכת.
 *
 * הגיליון מכיל טאב לכל פלוגה (פלוגה א/ב/ג/ד, אג"מ, פלס"ם),
 * ומחיקת חייל מהמערכת מסירה אותו מהטאב המתאים.
 *
 * התקנה:
 * 1. פתח https://script.google.com
 * 2. צור פרויקט חדש בשם "Main Soldiers Sync"
 * 3. העתק את הקוד הזה ל-Code.gs
 * 4. שמור (Ctrl+S)
 * 5. Deploy → New deployment → Type: Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. אשר הרשאות Sheets
 * 7. העתק את ה-URL שמתקבל ועדכן ב-config.js → CONFIG.mainSoldiersWebhookUrl
 */

// ========== הגדרות ==========

const MAIN_SHEET_ID = '1JedoEvaQyHtNVYF7lwJwNSV0lu8e97k2kwCJuSRaGTE';
const LOG_TAB_NAME = 'לוג מחיקות';

// Mapping: company key → sheet GID (matches config.js → CONFIG.companies[k].sheetGid)
const COMPANY_GIDS = {
  a: '1028480518',
  b: '2089743793',
  c: '12652557',
  d: '59321270',
  agam: '107677945',
  palsam: '865038187',
};

// ========== Web App endpoint ==========

/**
 * Web App endpoint. Deploy as web app (Deploy → New deployment → Web app,
 * Execute as: Me, Who has access: Anyone).
 *
 * הקוד תומך בפעולה:
 *   { action: 'deleteSoldier', personalIds: [...], company: 'a'|'b'|'c'|'d'|'agam'|'palsam' }
 *   אם company לא מצוין — מנסה למחוק מכל הטאבים.
 *
 * עמודה 0 (A) = מספר אישי בכל טאב.
 */
function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action || '';

    if (action === 'deleteSoldier') {
      const personalIds = (params.personalIds || []).filter(Boolean);
      if (personalIds.length === 0) {
        return _jsonResponse_({ ok: false, error: 'No personalIds provided' });
      }
      const normalized = new Set(personalIds.map(_normId_));
      const targetCompany = params.company || ''; // 'a', 'b', etc., or '' for all

      const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
      let totalDeleted = 0;
      const perTab = {};

      const tabsToCheck = targetCompany && COMPANY_GIDS[targetCompany]
        ? [{ company: targetCompany, gid: COMPANY_GIDS[targetCompany] }]
        : Object.entries(COMPANY_GIDS).map(([company, gid]) => ({ company, gid }));

      for (const { company, gid } of tabsToCheck) {
        const tab = _getSheetByGid_(ss, gid);
        if (!tab) { perTab[company] = 'not found'; continue; }

        const lastRow = tab.getLastRow();
        const lastCol = tab.getLastColumn();
        if (lastRow <= 1) { perTab[company] = 0; continue; }

        const data = tab.getRange(1, 1, lastRow, lastCol).getValues();
        const kept = [data[0]];
        let tabDeleted = 0;

        for (let i = 1; i < data.length; i++) {
          const cellVal = _normId_(String(data[i][0] || '')); // column A = personalId
          if (cellVal && normalized.has(cellVal)) {
            tabDeleted++;
          } else {
            kept.push(data[i]);
          }
        }

        if (tabDeleted > 0) {
          tab.getRange(2, 1, lastRow - 1, lastCol).clearContent();
          if (kept.length > 1) {
            tab.getRange(2, 1, kept.length - 1, lastCol).setValues(kept.slice(1));
          }
        }

        perTab[company] = tabDeleted;
        totalDeleted += tabDeleted;
      }

      _appendLog_(ss, 'מחיקה', 'סה"כ ' + totalDeleted + ' שורות. פירוט: ' + JSON.stringify(perTab));
      return _jsonResponse_({ ok: true, deleted: totalDeleted, perTab: perTab });
    }

    return _jsonResponse_({ ok: false, error: 'Unknown action: ' + action });
  } catch (err) {
    return _jsonResponse_({ ok: false, error: String(err) });
  }
}

// GET — health check
function doGet(e) {
  return _jsonResponse_({ ok: true, service: 'Main Soldiers Sync', tabs: Object.keys(COMPANY_GIDS) });
}

// ========== עזרים ==========

function _normId_(id) {
  if (!id) return '';
  return String(id).trim().replace(/[\s\-]/g, '').replace(/^0+/, '');
}

function _getSheetByGid_(ss, gid) {
  const sheets = ss.getSheets();
  for (const s of sheets) {
    if (String(s.getSheetId()) === String(gid)) return s;
  }
  return null;
}

function _jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function _appendLog_(ss, action, details) {
  let logTab = ss.getSheetByName(LOG_TAB_NAME);
  if (!logTab) {
    logTab = ss.insertSheet(LOG_TAB_NAME);
    logTab.appendRow(['תאריך', 'פעולה', 'פרטים']);
    logTab.getRange(1, 1, 1, 3).setFontWeight('bold');
  }
  logTab.appendRow([
    new Date().toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem' }),
    action,
    details
  ]);
}

// ========== בדיקות ==========

/** הרץ זה אחרי deploy כדי לאמת שהכל עובד */
function testHealth() {
  const ss = SpreadsheetApp.openById(MAIN_SHEET_ID);
  Logger.log('Sheet name: ' + ss.getName());
  for (const [company, gid] of Object.entries(COMPANY_GIDS)) {
    const tab = _getSheetByGid_(ss, gid);
    Logger.log(company + ' (gid ' + gid + '): ' + (tab ? '✓ ' + tab.getName() + ' (' + tab.getLastRow() + ' rows)' : '✗ NOT FOUND'));
  }
}
