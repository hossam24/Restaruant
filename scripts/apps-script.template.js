
var TAB_MENU = 'المنيو';
var TAB_SETTINGS = 'الإعدادات';
var TAB_CATEGORIES = 'الأقسام';
var BREAST_SURCHARGE = 10;
var CACHE_KEY = 'menu_v2';
var CACHE_SECONDS = 60;
var TIME_ZONE = 'Africa/Cairo';

var CATEGORY_HEADERS = ['القسم', 'ملاحظة تظهر فوق أصناف القسم (اختياري)'];
var MAX_CATEGORIES = 30;

var MENU_HEADERS = [
  'الكود (لا تغيّره)',
  'القسم',
  'الاسم',
  'الوصف',
  'السعر',
  'السعر قبل الخصم',
  'حجم 1',
  'سعر حجم 1',
  'حجم 2',
  'سعر حجم 2',
  'حجم 3',
  'سعر حجم 3',
  'ورك/صدر؟',
  'متاح النهارده؟',
  'ظاهر في المنيو؟',
  'الصورة',
];

var SETTINGS_ROWS = [
  ['يفتح الساعة', '10:00', 'بتوقيت القاهرة، مثال 10:00. سيبه فاضي لو مش عايز يظهر "مفتوحين / مقفولين".'],
  ['يقفل الساعة', '02:00', 'لو بعد نص الليل اكتبه عادي، مثال 02:00.'],
  ['رسوم التوصيل (جنيه)', '', 'سيبها فاضية = الإجمالي بيفضل مكتوب عليه "غير شامل التوصيل".'],
  ['التوصيل مجاني لو الطلب وصل (جنيه)', '', 'اختياري. بيشتغل بس لو في رسوم توصيل.'],
  ['الوقت المتوقع للتوصيل', '', 'اختياري، مثال: خلال 45 دقيقة تقريباً'],
];

var ORDER_HEADERS = [
  'Date & Time', 'Customer Name', 'Phone', 'Additional Phone', 'Address', 'Items', 'Total', 'Notes', 'Order Type',
];

var SEED = /*__SEED__*/ [];
var SEED_CATEGORIES = /*__SEED_CATEGORIES__*/ [];

function ss_() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

function text_(v) {
  return v === null || v === undefined ? '' : String(v).trim();
}

function digits_(s) {
  return String(s).replace(/[٠-٩]/g, function (d) {
    return '٠١٢٣٤٥٦٧٨٩'.indexOf(d);
  });
}

function num_(v) {
  if (typeof v === 'number') return isFinite(v) ? v : NaN;
  var s = digits_(text_(v)).replace(/[,،\s]/g, '');
  return s === '' ? NaN : Number(s);
}

function price_(v) {
  var n = num_(v);
  return n >= 1 && n <= 100000 && Math.floor(n) === n ? n : null;
}

function fee_(v) {
  if (text_(v) === '') return null;
  var n = num_(v);
  return n >= 0 && n <= 10000 && Math.floor(n) === n ? n : null;
}

function yes_(v, dflt) {
  var s = text_(v).toLowerCase();
  if (s === '') return dflt;
  if (['نعم', 'ايوه', 'أيوه', 'اه', 'yes', 'y', 'true', '1', 'x'].indexOf(s) >= 0) return true;
  if (['لا', 'لأ', 'لاء', 'no', 'n', 'false', '0'].indexOf(s) >= 0) return false;
  return dflt;
}

function readCategories_() {
  var sheet = ss_().getSheetByName(TAB_CATEGORIES);
  var out = [];
  if (!sheet || sheet.getLastRow() < 2) return out;
  var rows = sheet.getRange(2, 1, Math.min(sheet.getLastRow() - 1, 200), 2).getValues();
  var seen = {};
  for (var i = 0; i < rows.length && out.length < MAX_CATEGORIES; i++) {
    var label = text_(rows[i][0]).slice(0, 40);
    if (!label || seen[label]) continue;
    seen[label] = true;
    var cat = { id: label, label: label };
    var note = text_(rows[i][1]).slice(0, 200);
    if (note) cat.note = note;
    out.push(cat);
  }
  return out;
}

function categoryId_(label, categories) {
  var l = text_(label);
  for (var i = 0; i < categories.length; i++) if (categories[i].id === l) return l;
  return '';
}

function imagePath_(v) {
  var s = text_(v);
  if (!s) return '';
  if (/^https:\/\//i.test(s)) return s;
  if (/[:\\]|\.\./.test(s)) return '';
  return s.replace(/^\/+/, '').replace(/^imgs\//, '');
}

function time_(v) {
  if (v && typeof v.getHours === 'function') return Utilities.formatDate(v, ss_().getSpreadsheetTimeZone(), 'HH:mm');
  var m = /^(\d{1,2}):(\d{2})/.exec(digits_(text_(v)));
  if (!m) return null;
  var h = Number(m[1]);
  var mi = Number(m[2]);
  if (h > 23 || mi > 59) return null;
  return (h < 10 ? '0' : '') + h + ':' + (mi < 10 ? '0' : '') + mi;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function readSettings_() {
  var sheet = ss_().getSheetByName(TAB_SETTINGS);
  var vals = sheet ? sheet.getRange(2, 2, SETTINGS_ROWS.length, 1).getValues() : [];
  var at = function (i) {
    return vals[i] ? vals[i][0] : '';
  };
  var open = time_(at(0));
  var close = time_(at(1));
  var fee = fee_(at(2));
  var freeOver = fee === null ? null : price_(at(3));
  var estimate = text_(at(4)).slice(0, 60);
  return {
    hours: open && close && open !== close ? { open: open, close: close } : null,
    delivery: { fee: fee, freeOver: freeOver, estimate: estimate || null },
  };
}

function readMenu_() {
  var sheet = ss_().getSheetByName(TAB_MENU);
  var items = [];
  var problems = [];
  var categories = readCategories_();
  if (!categories.length) {
    return { items: items, categories: categories, problems: ['ورقة الأقسام فاضية: اكتب أسماء الأقسام في ورقة "' + TAB_CATEGORIES + '".'] };
  }
  if (!sheet || sheet.getLastRow() < 2) return { items: items, categories: categories, problems: ['ورقة المنيو فاضية.'] };

  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, MENU_HEADERS.length).getValues();
  var seen = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    var line = i + 2;
    var id = text_(r[0]);
    var name = text_(r[2]);
    if (!id && !name) continue;
    if (!name) {
      problems.push('سطر ' + line + ': الاسم فاضي.');
      continue;
    }
    if (!/^[A-Za-z0-9_-]{2,40}$/.test(id)) {
      problems.push('سطر ' + line + ' (' + name + '): الكود ناقص أو فيه حروف غلط.');
      continue;
    }
    if (seen[id]) {
      problems.push('سطر ' + line + ' (' + name + '): الكود ' + id + ' متكرر.');
      continue;
    }
    var category = categoryId_(r[1], categories);
    if (!category) {
      problems.push('سطر ' + line + ' (' + name + '): القسم مش موجود في ورقة الأقسام، اختاره من القايمة.');
      continue;
    }

    var item = { id: id, category: category, name: name.slice(0, 80) };
    var description = text_(r[3]);
    if (description) item.description = description.slice(0, 300);

    var sizes = [];
    var sizeProblem = false;
    for (var k = 0; k < 3; k++) {
      var sizeName = text_(r[6 + k * 2]);
      var sizePrice = r[7 + k * 2];
      if (sizeName === '' && text_(sizePrice) === '') continue;
      var p = price_(sizePrice);
      if (sizeName === '' || p === null) {
        problems.push('سطر ' + line + ' (' + name + '): حجم ' + (k + 1) + ' ناقص (اكتب الاسم والسعر الاتنين).');
        sizeProblem = true;
        break;
      }
      sizes.push({ id: 's' + (k + 1), name: sizeName.slice(0, 30), price: p });
    }
    if (sizeProblem) continue;

    if (sizes.length) {
      item.sizes = sizes;
    } else {
      var price = price_(r[4]);
      if (price === null) {
        problems.push('سطر ' + line + ' (' + name + '): السعر ناقص أو مش رقم صحيح.');
        continue;
      }
      item.price = price;
      var before = price_(r[5]);
      if (before !== null && before > price) item.oldPrice = before;
    }

    if (yes_(r[12], false)) item.chickenChoice = true;
    if (!yes_(r[13], true)) item.soldOut = true;
    if (!yes_(r[14], true)) item.hidden = true;
    var image = imagePath_(r[15]);
    if (image) item.image = image;

    seen[id] = true;
    items.push(item);
  }
  return { items: items, categories: categories, problems: problems };
}

function ensureIds_() {
  var sheet = ss_().getSheetByName(TAB_MENU);
  if (!sheet || sheet.getLastRow() < 2) return;
  var rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  var used = {};
  for (var i = 0; i < rows.length; i++) if (text_(rows[i][0])) used[text_(rows[i][0])] = true;
  for (var j = 0; j < rows.length; j++) {
    if (text_(rows[j][2]) && !text_(rows[j][0])) {
      var id;
      do {
        id = 'x-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8);
      } while (used[id]);
      used[id] = true;
      sheet.getRange(j + 2, 1).setValue(id);
    }
  }
}

function doGet() {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(CACHE_KEY);
    if (cached) return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);

    ensureIds_();
    var menu = readMenu_();
    var body = JSON.stringify({ ok: true, items: menu.items, categories: menu.categories, settings: readSettings_() });
    if (body.length < 90000) cache.put(CACHE_KEY, body, CACHE_SECONDS);
    return ContentService.createTextOutput(body).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

function itemUnitPrice_(item, sizeId, part) {
  var base = item.price;
  if (item.sizes) {
    base = item.sizes[0].price;
    for (var i = 0; i < item.sizes.length; i++) if (item.sizes[i].id === sizeId) base = item.sizes[i].price;
  }
  return base + (part === 'صدر' ? BREAST_SURCHARGE : 0);
}

function itemLineName_(item, sizeId, part) {
  var name = item.name;
  if (item.sizes) {
    var size = item.sizes[0];
    for (var i = 0; i < item.sizes.length; i++) if (item.sizes[i].id === sizeId) size = item.sizes[i];
    name += ' - ' + size.name;
  }
  if (part) name += ' (' + part + ')';
  return name;
}

function throttled_(key, limit, seconds) {
  var cache = CacheService.getScriptCache();
  var used = Number(cache.get(key) || 0);
  if (used >= limit) return true;
  cache.put(key, String(used + 1), seconds);
  return false;
}

function orderSheet_() {
  var ss = ss_();
  var today = Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd');
  var sheet = ss.getSheetByName(today);
  if (!sheet) {
    sheet = ss.insertSheet(today);
    sheet.appendRow(ORDER_HEADERS);
    var head = sheet.getRange(1, 1, 1, ORDER_HEADERS.length);
    head.setBackground('#e67e22');
    head.setFontColor('#ffffff');
    head.setFontWeight('bold');
    head.setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    var widths = [160, 140, 130, 130, 220, 320, 100, 200, 120];
    for (var i = 0; i < widths.length; i++) sheet.setColumnWidth(i + 1, widths[i]);
  }
  return sheet;
}

function str_(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var raw = e && e.postData && e.postData.contents ? e.postData.contents : '';
    if (!raw || raw.length > 30000) return json_({ status: 'error', message: 'bad request' });
    var body = JSON.parse(raw);
    var c = body.customer || {};

    var name = str_(c.name, 100);
    var phone = digits_(str_(c.phone, 20));
    var extra = digits_(str_(c.additionalPhone, 20));
    var address = str_(c.address, 300);
    var notes = str_(c.notes, 500);
    var phoneOk = /^01[0125]\d{8}$/;
    if (!name || !address || !phoneOk.test(phone) || (extra && !phoneOk.test(extra))) {
      return json_({ status: 'error', message: 'invalid customer details' });
    }
    if (!Array.isArray(body.lines) || body.lines.length < 1 || body.lines.length > 40) {
      return json_({ status: 'error', message: 'invalid order' });
    }

    lock.waitLock(15000);
    if (throttled_('rl_all', 120, 600) || throttled_('rl_phone_' + phone, 3, 600)) {
      return json_({ status: 'error', message: 'too many orders' });
    }

    var menu = readMenu_().items;
    var byId = {};
    for (var m = 0; m < menu.length; m++) byId[menu[m].id] = menu[m];

    var rows = [];
    var subtotal = 0;
    for (var i = 0; i < body.lines.length; i++) {
      var line = body.lines[i] || {};
      var item = byId[str_(line.itemId, 60)];
      if (!item || item.hidden) return json_({ status: 'error', message: 'unknown item' });
      var qty = line.quantity;
      if (typeof qty !== 'number' || Math.floor(qty) !== qty || qty < 1 || qty > 99) {
        return json_({ status: 'error', message: 'invalid quantity' });
      }
      var sizeId = null;
      if (item.sizes) for (var s = 0; s < item.sizes.length; s++) if (item.sizes[s].id === line.sizeId) sizeId = line.sizeId;
      var part = item.chickenChoice && (line.part === 'ورك' || line.part === 'صدر') ? line.part : null;
      var note = str_(line.note, 120);

      var total = itemUnitPrice_(item, sizeId, part) * qty;
      subtotal += total;
      rows.push(
        itemLineName_(item, sizeId, part) + ' (' + qty + 'x) - ' + total + ' جنيه' + (item.soldOut ? ' (كان خلصان)' : '') + (note ? ' [' + note + ']' : ''),
      );
    }

    var delivery = readSettings_().delivery;
    var grand = subtotal;
    if (delivery.fee !== null) {
      var free = delivery.freeOver !== null && subtotal >= delivery.freeOver;
      grand = subtotal + (free ? 0 : delivery.fee);
    }

    orderSheet_().appendRow([
      Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm:ss'),
      name,
      phone,
      extra,
      address,
      rows.join(' | '),
      grand + ' جنيه',
      notes,
      'توصيل',
    ]);
    return json_({ status: 'success' });
  } catch (err) {
    return json_({ status: 'error', message: String(err && err.message ? err.message : err) });
  } finally {
    try {
      lock.releaseLock();
    } catch (ignore) {}
  }
}

function onEdit(e) {
  try {
    var sheet = e && e.range && e.range.getSheet();
    if (!sheet) return;
    var name = sheet.getName();
    if (name !== TAB_MENU && name !== TAB_SETTINGS && name !== TAB_CATEGORIES) return;
    CacheService.getScriptCache().remove(CACHE_KEY);
    if (name === TAB_MENU) ensureIds_();
  } catch (ignore) {}
}

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('إدارة المنيو')
      .addItem('فحص المنيو', 'checkMenu')
      .addItem('إنشاء / إصلاح الأوراق', 'setup')
      .addToUi();
  } catch (ignore) {}
}

function checkMenu() {
  ensureIds_();
  var menu = readMenu_();
  var message = menu.problems.length
    ? 'فيه ' + menu.problems.length + ' سطر مش هيظهر في الموقع:\n\n' + menu.problems.join('\n')
    : 'تمام. كل الأصناف (' + menu.items.length + ') سليمة وهتظهر في الموقع.';
  try {
    SpreadsheetApp.getUi().alert(message);
  } catch (ignore) {}
  return message;
}

function setup() {
  var ss = ss_();
  var menu = ss.getSheetByName(TAB_MENU) || ss.insertSheet(TAB_MENU);
  var settings = ss.getSheetByName(TAB_SETTINGS) || ss.insertSheet(TAB_SETTINGS);
  var cats = ss.getSheetByName(TAB_CATEGORIES) || ss.insertSheet(TAB_CATEGORIES);

  var catHead = cats.getRange(1, 1, 1, CATEGORY_HEADERS.length);
  catHead.setValues([CATEGORY_HEADERS]);
  catHead.setBackground('#e67e22');
  catHead.setFontColor('#ffffff');
  catHead.setFontWeight('bold');
  cats.setFrozenRows(1);
  cats.setColumnWidth(1, 220);
  cats.setColumnWidth(2, 460);
  if (cats.getLastRow() < 2 && SEED_CATEGORIES.length) {
    cats.getRange(2, 1, SEED_CATEGORIES.length, 2).setValues(SEED_CATEGORIES);
  }

  var head = menu.getRange(1, 1, 1, MENU_HEADERS.length);
  head.setValues([MENU_HEADERS]);
  head.setBackground('#e67e22');
  head.setFontColor('#ffffff');
  head.setFontWeight('bold');
  head.setHorizontalAlignment('center');
  head.setWrap(true);
  menu.setFrozenRows(1);
  var widths = [110, 150, 190, 300, 80, 110, 90, 80, 90, 80, 90, 80, 90, 100, 100, 230];
  for (var i = 0; i < widths.length; i++) menu.setColumnWidth(i + 1, widths[i]);

  if (menu.getLastRow() < 2 && SEED.length) {
    menu.getRange(2, 1, SEED.length, MENU_HEADERS.length).setValues(SEED);
  }

  var listRule = function (values) {
    return SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  };
  var categoryRule = SpreadsheetApp.newDataValidation()
    .requireValueInRange(cats.getRange(2, 1, 200, 1), true)
    .setAllowInvalid(false)
    .build();
  menu.getRange(2, 2, 998, 1).setDataValidation(categoryRule);
  menu.getRange(2, 13, 998, 3).setDataValidation(listRule(['نعم', 'لا']));

  settings.getRange(1, 1, 1, 3).setValues([['الإعداد', 'القيمة', 'شرح']]);
  settings.getRange(1, 1, 1, 3).setBackground('#e67e22');
  settings.getRange(1, 1, 1, 3).setFontColor('#ffffff');
  settings.getRange(1, 1, 1, 3).setFontWeight('bold');
  settings.setColumnWidth(1, 260);
  settings.setColumnWidth(2, 160);
  settings.setColumnWidth(3, 480);
  settings.getRange(2, 2, SETTINGS_ROWS.length, 1).setNumberFormat('@');
  if (settings.getLastRow() < 2) settings.getRange(2, 1, SETTINGS_ROWS.length, 3).setValues(SETTINGS_ROWS);

  CacheService.getScriptCache().remove(CACHE_KEY);
  ensureIds_();
  return 'ok';
}
