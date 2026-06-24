/**
 * FOOLPROOF Google Apps Script Code for Wealthix Lead Capture with CAPTCHA & IP Verification
 * 
 * This version allows you to explicitly link your Spreadsheet by its ID,
 * captures the user's IP Address, and logs the CAPTCHA status as boolean TRUE / FALSE
 * which can be rendered as check boxes inside Google Sheets!
 */

// 1. Paste your spreadsheet ID between the quotes below.
// You can find this ID in the URL of your Google Sheet.
// For example: https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F/edit -> ID is "1A2B3C4D5E6F"
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// 2. Specify the name of the tab you want to save data to (e.g., "Sheet1", "Leads", etc.)
const SHEET_NAME = "Sheet1";

// 3. Set this to true to reject submissions that have an incorrect CAPTCHA answer
const REQUIRE_CAPTCHA = true;

function doPost(e) {
  try {
    // Open the spreadsheet by ID if provided, otherwise fallback to active sheet
    var ss;
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" && SPREADSHEET_ID.trim() !== "") {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    if (!ss) {
      throw new Error("Could not find Google Spreadsheet. Please make sure SPREADSHEET_ID is set correctly in the script.");
    }
    
    // Open the sheet (tab) by name
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0] || ss.getActiveSheet();
    if (!sheet) {
      throw new Error("Could not find any sheet tab inside the spreadsheet.");
    }
    
    // Parse the payload
    var data;
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    } else {
      data = {};
    }
    
    // Server-side CAPTCHA Verification (Returns TRUE or FALSE)
    var captchaVerified = false;
    if (data.captchaQuestion && data.captchaAnswer !== undefined && data.captchaAnswer !== "") {
      var parts = data.captchaQuestion.split("+");
      if (parts.length === 2) {
        var num1 = parseInt(parts[0].trim(), 10);
        var num2 = parseInt(parts[1].trim(), 10);
        var expected = num1 + num2;
        var actual = parseInt(data.captchaAnswer, 10);
        if (expected === actual) {
          captchaVerified = true;
        } else if (REQUIRE_CAPTCHA) {
          throw new Error("CAPTCHA verification failed. Bot detected. Expected " + expected + ", got " + actual);
        }
      }
    } else if (REQUIRE_CAPTCHA && (data.captchaQuestion || data.captchaAnswer)) {
      // If CAPTCHA is required but verification failed/empty
      throw new Error("CAPTCHA answer is missing or incomplete.");
    }
    
    // Define headers
    var headers = ["Timestamp", "Source", "Name", "Phone", "Email", "Service", "Message", "Captcha Verified", "IP Address"];
    
    // Check if sheet is empty, if so, write headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    } else {
      // Proactively check if headers need to be updated to support the new columns
      var lastCol = sheet.getLastColumn();
      if (lastCol < headers.length) {
        var existingHeaders = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
        // Make sure "Captcha Verified" exists
        if (existingHeaders.indexOf("Captcha Verified") === -1) {
          sheet.getRange(1, lastCol + 1).setValue("Captcha Verified").setFontWeight("bold").setBackground("#f3f3f3");
          lastCol++;
        }
        // Make sure "IP Address" exists
        if (existingHeaders.indexOf("IP Address") === -1) {
          sheet.getRange(1, lastCol + 1).setValue("IP Address").setFontWeight("bold").setBackground("#f3f3f3");
        }
      }
    }
    
    // Map fields from the payload
    var timestamp = new Date();
    var source = data.source || "";
    var name = data.name || data.fullName || "";
    var phone = data.phone || data.mobile || "";
    var email = data.email || "";
    var service = data.service || "";
    var message = data.message || "";
    var ip = data.ip || "";
    
    // Construct the row to append
    var row = [
      timestamp,
      source,
      name,
      "'" + phone, // Prefix with ' to treat as text and preserve formatting
      email,
      service,
      message,
      captchaVerified, // Boolean TRUE/FALSE (Google Sheets formats this as checkbox automatically!)
      ip
    ];
    
    // Append row
    sheet.appendRow(row);
    
    // Return success response
    return ContentService.createTextOutput(JSON.stringify({ status: "success", message: "Data saved successfully" }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    // Return error response
    return ContentService.createTextOutput(JSON.stringify({ status: "error", error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Support GET requests for testing
function doGet(e) {
  return ContentService.createTextOutput("Wealthix Apps Script is running! Use POST to submit data.");
}
