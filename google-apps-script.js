// ============================================================
// Google Apps Script - Rasheedy Restaurant Order Logger
// ============================================================
// HOW TO DEPLOY:
// 1. Open your Google Sheet at sheets.google.com (logged in as itqanstudio.tech@gmail.com)
// 2. Click Extensions → Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click Save (Ctrl+S)
// 5. Click Deploy → New deployment
// 6. Select type: Web App
// 7. Description: Rasheedy Orders
// 8. Execute as: Me (itqanstudio.tech@gmail.com)
// 9. Who has access: Anyone
// 10. Click Deploy → Authorize → Copy the Web App URL
// 11. Paste that URL into index.js where it says: PASTE_YOUR_APPS_SCRIPT_URL_HERE
// ============================================================

const HEADERS = [
  'Date & Time',
  'Customer Name',
  'Phone',
  'Additional Phone',
  'Address',
  'Items',
  'Total',
  'Notes',
  'Order Type',
];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // Sheet name = today's date in Cairo time e.g. "2026-03-20"
    const today = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd');
    let sheet = ss.getSheetByName(today);

    // Create sheet for today if it doesn't exist yet
    if (!sheet) {
      sheet = ss.insertSheet(today);
      sheet.appendRow(HEADERS);

      // Style the header row
      const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
      headerRange.setBackground('#e67e22');
      headerRange.setFontColor('#ffffff');
      headerRange.setFontWeight('bold');
      headerRange.setHorizontalAlignment('center');
      sheet.setFrozenRows(1);

      // Set column widths
      sheet.setColumnWidth(1, 160); // date/time
      sheet.setColumnWidth(2, 140); // name
      sheet.setColumnWidth(3, 130); // phone
      sheet.setColumnWidth(4, 130); // additional phone
      sheet.setColumnWidth(5, 220); // address
      sheet.setColumnWidth(6, 320); // items
      sheet.setColumnWidth(7, 100); // total
      sheet.setColumnWidth(8, 200); // notes
      sheet.setColumnWidth(9, 120); // order type
    }

    const timestamp = Utilities.formatDate(new Date(), 'Africa/Cairo', 'yyyy-MM-dd HH:mm:ss');

    sheet.appendRow([
      timestamp,
      data.customerName || '',
      data.phone || '',
      data.additionalPhone || '',
      data.address || '',
      data.items || '',
      data.total || '',
      data.notes || '',
      data.orderType || '',
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Run this manually from the Apps Script editor to verify everything works
function testOrder() {
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        customerName: 'أحمد محمد',
        phone: '01012345678',
        additionalPhone: '',
        address: '١٢ شارع التحرير، القاهرة',
        items: 'مشوي مشكل (2x) - 160 جنيه | فراخ مشوية (1x) - 80 جنيه',
        total: '240 جنيه',
        notes: 'بدون بصل',
        orderType: 'توصيل',
      }),
    },
  };
  doPost(mockEvent);
}
