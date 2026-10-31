/**
 * Lord of the Flies Quiz - Google Apps Script web app
 *
 * - Serves the quiz page (Index.html) as a public website.
 * - Counts every visitor in a Google Sheet ("Visits").
 * - Emails a daily visitor report to REPORT_EMAIL.
 *
 * After pasting or pushing this code, run setup() once from the
 * Apps Script editor and approve the permissions.
 */

// Who receives the daily report.
const REPORT_EMAIL = 'alanyy61@gmail.com';

// Hour of the daily report, 24-hour clock, Baghdad time (20 = 8 PM).
const REPORT_HOUR = 20;
const REPORT_TIME_ZONE = 'Asia/Baghdad';

const SHEET_NAME = 'Visits';
const SPREADSHEET_TITLE = 'Lord of the Flies Quiz - Visitors';


/** Serves the quiz page. */
function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Lord of the Flies Quiz')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}


/**
 * Called by the page once per visit with an anonymous id saved in the
 * visitor's browser. Returns true when this is a first-time visitor.
 */
function registerVisit(visitorId) {
  const id = cleanId_(visitorId);
  rememberSiteUrl_();
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return false;
  try {
    const sheet = getSheet_();
    const isNew = !hasVisitor_(sheet, id);
    sheet.appendRow([new Date(), id, isNew ? 'Yes' : 'No']);
    return isNew;
  } finally {
    lock.releaseLock();
  }
}


/** Sends the visitor report. The daily trigger calls this. */
function sendDailyReport() {
  const s = getStats_();
  const siteUrl = PropertiesService.getScriptProperties().getProperty('SITE_URL') || '';
  const rows = [
    ['الأشخاص الذين دخلوا اليوم', s.peopleToday],
    ['منهم يدخلون لأول مرة', s.newToday],
    ['عدد الزيارات اليوم', s.visitsToday],
    ['إجمالي الأشخاص منذ البداية', s.totalPeople],
    ['إجمالي الزيارات منذ البداية', s.totalVisits]
  ];

  const subject = 'زوار اختبار Lord of the Flies اليوم: ' + s.peopleToday +
    ' (الإجمالي ' + s.totalPeople + ')';

  const text = ['تقرير زوار الاختبار ليوم ' + s.day, '']
    .concat(rows.map(function (r) { return r[0] + ': ' + r[1]; }))
    .concat(['', siteUrl ? 'رابط الموقع: ' + siteUrl : '', 'جدول كل الزيارات: ' + s.sheetUrl])
    .join('\n');

  const html =
    '<div dir="rtl" style="font-family:Arial,sans-serif;font-size:15px;line-height:1.6">' +
    '<h2 style="margin:0 0 12px">تقرير زوار الاختبار ليوم ' + s.day + '</h2>' +
    '<table cellpadding="6" style="border-collapse:collapse">' +
    rows.map(function (r) {
      return '<tr><td>' + r[0] + '</td><td><b>' + r[1] + '</b></td></tr>';
    }).join('') +
    '</table>' +
    (siteUrl ? '<p>رابط الموقع: <a href="' + siteUrl + '">' + siteUrl + '</a></p>' : '') +
    '<p>جدول كل الزيارات: <a href="' + s.sheetUrl + '">افتح الجدول</a></p>' +
    '</div>';

  MailApp.sendEmail({ to: REPORT_EMAIL, subject: subject, body: text, htmlBody: html });
}


/**
 * Run once from the Apps Script editor. Creates the visits sheet,
 * sets the daily report trigger and sends a confirmation email.
 */
function setup() {
  const sheet = getSheet_();

  ScriptApp.getProjectTriggers()
    .filter(function (t) { return t.getHandlerFunction() === 'sendDailyReport'; })
    .forEach(function (t) { ScriptApp.deleteTrigger(t); });

  ScriptApp.newTrigger('sendDailyReport')
    .timeBased()
    .everyDays(1)
    .atHour(REPORT_HOUR)
    .inTimezone(REPORT_TIME_ZONE)
    .create();

  MailApp.sendEmail(
    REPORT_EMAIL,
    'عداد زوار اختبار Lord of the Flies يعمل',
    'تم تفعيل العداد. سيصلك تقرير بعدد الزوار كل يوم بين الساعة ' +
      REPORT_HOUR + ':00 و' + (REPORT_HOUR + 1) + ':00 بتوقيت بغداد.\n\n' +
      'جدول كل الزيارات: ' + sheet.getParent().getUrl()
  );

  Logger.log('Setup done. Visits sheet: ' + sheet.getParent().getUrl());
}


/** Optional: sends the report right now, for testing. */
function sendReportNow() {
  sendDailyReport();
}


/* ---------------- Helpers ---------------- */

function cleanId_(value) {
  const id = String(value || '').replace(/[^A-Za-z0-9-]/g, '').slice(0, 64);
  return 'v-' + (id || 'unknown');
}

function hasVisitor_(sheet, id) {
  const last = sheet.getLastRow();
  if (last < 2) return false;
  return sheet.getRange(2, 2, last - 1, 1)
    .createTextFinder(id)
    .matchEntireCell(true)
    .findNext() !== null;
}

function getSheet_() {
  const props = PropertiesService.getScriptProperties();
  const savedId = props.getProperty('SHEET_ID');
  let ss = null;
  if (savedId) {
    try {
      ss = SpreadsheetApp.openById(savedId);
    } catch (e) {
      ss = null;
    }
  }
  if (!ss) {
    ss = SpreadsheetApp.create(SPREADSHEET_TITLE);
    props.setProperty('SHEET_ID', ss.getId());
  }
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.getSheets()[0];
    sheet.setName(SHEET_NAME);
    sheet.getRange(1, 1, 1, 3)
      .setValues([['Time', 'Visitor ID', 'New visitor']])
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function getStats_() {
  const sheet = getSheet_();
  const tz = Session.getScriptTimeZone();
  const today = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  const last = sheet.getLastRow();
  const rows = last > 1 ? sheet.getRange(2, 1, last - 1, 3).getValues() : [];

  const todayIds = new Set();
  let visitsToday = 0;
  let newToday = 0;
  let totalPeople = 0;

  rows.forEach(function (r) {
    const isNew = r[2] === 'Yes';
    if (isNew) totalPeople++;
    const day = r[0] instanceof Date ? Utilities.formatDate(r[0], tz, 'yyyy-MM-dd') : '';
    if (day === today) {
      visitsToday++;
      todayIds.add(String(r[1]));
      if (isNew) newToday++;
    }
  });

  return {
    day: today,
    peopleToday: todayIds.size,
    newToday: newToday,
    visitsToday: visitsToday,
    totalPeople: totalPeople,
    totalVisits: rows.length,
    sheetUrl: sheet.getParent().getUrl()
  };
}

/** Saves the public /exec address so the report email can link to the site. */
function rememberSiteUrl_() {
  try {
    const url = ScriptApp.getService().getUrl();
    if (url && /\/exec$/.test(url)) {
      const props = PropertiesService.getScriptProperties();
      if (props.getProperty('SITE_URL') !== url) props.setProperty('SITE_URL', url);
    }
  } catch (e) {
    // The site link in the email is optional.
  }
}
