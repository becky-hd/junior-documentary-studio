/**
 * Optional 60-Second Google Sheets Database Bridge (Google Apps Script)
 *
 * 1. Open your Google Sheet Database:
 *    https://docs.google.com/spreadsheets/d/1ZXGI2h9wErEprRag-yKT8gv6PpBXZoygiQQ59x_2gcI/edit
 * 2. Click Extensions -> Apps Script, paste this file, and save.
 * 3. In Project Settings -> Script Properties, add:
 *      APPS_SCRIPT_SECRET = <a long random secret you generate>
 * 4. Click Deploy -> New deployment -> Web app -> Execute as: Me -> Who has access: Anyone.
 * 5. Add GOOGLE_APPS_SCRIPT_URL and APPS_SCRIPT_SECRET to your Vercel Project Environment Variables.
 */

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents || '{}');
    var expected = PropertiesService.getScriptProperties().getProperty('APPS_SCRIPT_SECRET');
    if (!expected || body.secret !== expected) {
      return jsonOut({ ok: false, error: 'Unauthorized' });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var action = body.action;
    var payload = body.payload || {};

    if (action === 'bootstrap') {
      var sid = payload.studentId || '';
      var topics = ss.getSheetByName('Topics').getDataRange().getValues();
      var warmups = ss.getSheetByName('WarmupChallenges').getDataRange().getValues();
      var wordVault = ss.getSheetByName('WordVault').getDataRange().getValues();
      var profiles = ss.getSheetByName('StudentProfiles').getDataRange().getValues().slice(1);
      var submissions = ss.getSheetByName('WarmupSubmissions').getDataRange().getValues().slice(1);
      var drafts = ss.getSheetByName('WritingDrafts').getDataRange().getValues().slice(1);

      return jsonOut({
        ok: true,
        data: {
          topics: topics,
          warmups: warmups,
          wordVault: wordVault,
          profile: sid ? profiles.find(function (r) { return r[0] === sid; }) || null : null,
          warmupSubmissions: sid ? submissions.filter(function (r) { return r[1] === sid; }) : [],
          drafts: sid ? drafts.filter(function (r) { return r[1] === sid; }) : [],
        },
      });
    }

    if (action === 'upsertProfile') {
      upsertRow(ss.getSheetByName('StudentProfiles'), payload.row, function (r) {
        return r[0] === payload.row[0];
      });
      return jsonOut({ ok: true, data: true });
    }

    if (action === 'saveWarmup') {
      upsertRow(ss.getSheetByName('WarmupSubmissions'), payload.row, function (r) {
        return r[1] === payload.row[1] && r[2] === payload.row[2];
      });
      return jsonOut({ ok: true, data: true });
    }

    if (action === 'upsertDraft') {
      upsertRow(ss.getSheetByName('WritingDrafts'), payload.row, function (r) {
        return r[0] === payload.row[0] && r[1] === payload.row[1];
      });
      return jsonOut({ ok: true, data: true });
    }

    return jsonOut({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return jsonOut({ ok: false, error: 'Server error' });
  }
}

function upsertRow(sheet, row, matchFn) {
  var values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (matchFn(values[i])) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

function jsonOut(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}
