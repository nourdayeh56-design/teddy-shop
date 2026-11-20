/**
 * TEDDY BEAR SHOP — Google Apps Script backend
 *
 * Setup:
 * 1. Open the Google Sheet that should store orders.
 * 2. Extensions > Apps Script; replace Code.gs with this file.
 * 3. Run setupSheets() once and approve permissions.
 * 4. Deploy > New deployment > Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the /exec URL into js/script.js (SHEET_URL).
 *
 * IMPORTANT: This endpoint accepts public order/contact submissions.
 * Never put an admin password or secret token in the storefront JavaScript.
 */

function doGet(e) {
  if (e && e.parameter && e.parameter.page === "admin") {
    return HtmlService.createHtmlOutputFromFile("Admin")
      .setTitle("Teddy Bear Shop — Admin")
      .addMetaTag("viewport", "width=device-width, initial-scale=1");
  }
  return ContentService.createTextOutput("Teddy Bear Shop backend is running.");
}

function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  createSheetIfMissing_(ss, "Orders", [
    "Order ID", "Date", "Customer", "Phone", "Governorate", "Address",
    "Products", "Subtotal (TND)", "Discount (TND)", "Promo Code",
    "Delivery (TND)", "Total (TND)", "Payment", "Status"
  ]);
  createSheetIfMissing_(ss, "Messages", ["Date", "Name", "Email", "Message"]);
}

function createSheetIfMissing_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const data = JSON.parse(e.postData.contents || "{}");
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (data.type === "contact") {
      saveContact_(ss, data);
      return json_({ ok: true, type: "contact" });
    }

    if (data.type === "order") {
      saveOrder_(ss, data);
      return json_({ ok: true, type: "order", orderID: data.orderID });
    }

    // Backward compatibility with the original version of the site.
    saveLegacyOrder_(ss, data);
    return json_({ ok: true, type: "legacy-order" });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error.message || error) });
  } finally {
    lock.releaseLock();
  }
}

function saveOrder_(ss, data) {
  const required = ["orderID", "name", "phone", "city", "address", "items"];
  required.forEach(key => {
    if (!data[key]) throw new Error("Missing field: " + key);
  });
  if (!/^[0-9]{8}$/.test(String(data.phone))) throw new Error("Invalid phone number");
  const sheet = ss.getSheetByName("Orders") || createAndReturnSheet_(ss, "Orders", [
    "Order ID", "Date", "Customer", "Phone", "Governorate", "Address",
    "Products", "Subtotal (TND)", "Discount (TND)", "Promo Code",
    "Delivery (TND)", "Total (TND)", "Payment", "Status"
  ]);
  // Prevent accidental duplicate Order IDs.
  if (sheet.getLastRow() > 1) {
    const ids = sheet.getRange(2, 1, sheet.getLastRow() - 1, 1).getDisplayValues().flat();
    if (ids.includes(String(data.orderID))) return;
  }
  sheet.appendRow([
    data.orderID, new Date(data.date || new Date()), safeCell_(data.name),
    "'" + data.phone, safeCell_(data.city), safeCell_(data.address),
    safeCell_(data.items), Number(data.subtotal || 0), Number(data.discount || 0),
    safeCell_(data.promoCode || ""), Number(data.delivery || 0),
    Number(data.total || 0), safeCell_(data.payment || "Cash on delivery"),
    "Pending"
  ]);
  MailApp.sendEmail({
    to: "nourdayeh6@gmail.com",
    subject: "🧸 New Teddy Bear Shop order — " + data.orderID,
    body:
      "A new order request was received.\n\n" +
      "Order ID: " + data.orderID + "\n" +
      "Customer: " + data.name + "\nPhone: " + data.phone +
      "\nGovernorate: " + data.city + "\nAddress: " + data.address +
      "\nProducts: " + data.items + "\nSubtotal: " + data.subtotal +
      " TND\nDiscount: " + data.discount + " TND\nDelivery: " +
      data.delivery + " TND\nTotal: " + data.total + " TND\nPayment: " +
      (data.payment || "Cash on delivery") + "\nStatus: Pending"
  });
}

function saveContact_(ss, data) {
  if (!data.name || !data.email || !data.message) throw new Error("Missing contact fields");
  let sheet = ss.getSheetByName("Messages");
  if (!sheet) sheet = createAndReturnSheet_(ss, "Messages", ["Date", "Name", "Email", "Message"]);
  sheet.appendRow([new Date(data.date || new Date()), safeCell_(data.name), safeCell_(data.email), safeCell_(data.message)]);
  MailApp.sendEmail({
    to: "nourdayeh6@gmail.com",
    subject: "Teddy Bear Shop — New contact message",
    body: "Name: " + data.name + "\nEmail: " + data.email + "\n\n" + data.message
  });
}

function saveLegacyOrder_(ss, data) {
  if (!data.name || !data.phone || !data.address || !data.items) throw new Error("Incomplete order");
  let sheet = ss.getSheetByName("Orders");
  if (!sheet) sheet = createAndReturnSheet_(ss, "Orders", [
    "Order ID", "Date", "Customer", "Phone", "Governorate", "Address",
    "Products", "Subtotal (TND)", "Discount (TND)", "Promo Code",
    "Delivery (TND)", "Total (TND)", "Payment", "Status"
  ]);
  sheet.appendRow([
    "LEGACY-" + new Date().getTime(), new Date(), safeCell_(data.name),
    "'" + data.phone, "", safeCell_(data.address), safeCell_(data.items),
    Number(data.total || 0), 0, "", 0, Number(data.total || 0),
    "Cash on delivery", "Pending"
  ]);
  MailApp.sendEmail({
    to: "nourdayeh6@gmail.com",
    subject: "🧸 New Teddy Bear Shop order",
    body: "Name: " + data.name + "\nPhone: " + data.phone +
      "\nAddress: " + data.address + "\nProducts: " + data.items +
      "\nTotal: " + data.total
  });
}

function createAndReturnSheet_(ss, name, headers) {
  const sheet = ss.insertSheet(name);
  sheet.appendRow(headers);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
  return sheet;
}

function safeCell_(value) {
  const text = String(value == null ? "" : value);
  // Avoid interpreting user input as a spreadsheet formula.
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}
function json_(object) {
  return ContentService.createTextOutput(JSON.stringify(object))
    .setMimeType(ContentService.MimeType.JSON);
}

/* Admin dashboard data functions.
 * Set ADMIN_PASSWORD in Apps Script > Project Settings > Script properties.
 * The password is checked server-side; it is not embedded in the website.
 */
function adminLogin(password) {
  const saved = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!saved) throw new Error("Admin password is not configured in Script Properties.");
  if (String(password) !== saved) throw new Error("Incorrect password.");
  const token = Utilities.getUuid();
  CacheService.getScriptCache().put("admin_" + token, "valid", 60 * 60);
  return token;
}
function adminGetOrders(token) {
  requireAdmin_(token);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet || sheet.getLastRow() < 2) return [];
  const rows = sheet.getDataRange().getDisplayValues();
  return rows.slice(1).reverse().map(row => ({
    orderID: row[0], date: row[1], name: row[2], phone: row[3],
    city: row[4], address: row[5], items: row[6], subtotal: row[7],
    discount: row[8], promo: row[9], delivery: row[10], total: row[11],
    payment: row[12], status: row[13]
  }));
}
function adminUpdateStatus(token, orderID, status) {
  requireAdmin_(token);
  const allowed = ["Pending", "Confirmed", "Preparing", "Shipped", "Delivered", "Cancelled"];
  if (!allowed.includes(status)) throw new Error("Invalid status.");
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Orders");
  if (!sheet) throw new Error("Orders sheet not found.");
  const ids = sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), 1).getDisplayValues().flat();
  const index = ids.indexOf(String(orderID));
  if (index < 0) throw new Error("Order not found.");
  sheet.getRange(index + 2, 14).setValue(status);
  return true;
}
function requireAdmin_(token) {
  const valid = CacheService.getScriptCache().get("admin_" + String(token || ""));
  if (valid !== "valid") throw new Error("Admin session expired. Please log in again.");
}
