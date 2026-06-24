/**
 * FOOLPROOF Google Apps Script Code for Wealthix Lead Capture
 * 
 * This version allows you to explicitly link your Spreadsheet by its ID,
 * which solves issues if you created a "Standalone" script or if Google
 * cannot find the "Active" spreadsheet.
 */

// 1. paste your spreadsheet ID between the quotes below.
// You can find this ID in the URL of your Google Sheet.
// For example: https://docs.google.com/spreadsheets/d/1A2B3C4D5E6F/edit -> ID is "1A2B3C4D5E6F"
const SPREADSHEET_ID = "YOUR_SPREADSHEET_ID_HERE";

// 2. Specify the name of the tab you want to save data to (e.g., "Sheet1", "Leads", etc.)
const SHEET_NAME = "Sheet1";

function doPost(e) {
  try {
    // Open the spreadsheet by ID if provided, otherwise fallback to the active container-bound sheet
    var ss;
    if (SPREADSHEET_ID && SPREADSHEET_ID !== "YOUR_SPREADSHEET_ID_HERE" && SPREADSHEET_ID.trim() !== "") {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID.trim());
    } else {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    }
    
    if (!ss) {
      throw new Error("Could not find Google Spreadsheet. Please make sure SPREADSHEET_ID is set correctly in the script.");
    }
    
    // Open the sheet (tab) by name, fallback to the first sheet, fallback to active sheet
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
    
    // Define headers
    var headers = ["Timestamp", "Source", "Name", "Phone", "Email", "Service", "Message"];
    
    // Check if sheet is empty, if so, write headers
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    }
    
    // Map fields from the payload
    var timestamp = new Date();
    var source = data.source || "";
    var name = data.name || data.fullName || "";
    var phone = data.phone || data.mobile || "";
    var email = data.email || "";
    var service = data.service || "";
    var message = data.message || "";
    
    // Construct the row to append
    var row = [
      timestamp,
      source,
      name,
      "'" + phone, // Prefix with ' to treat as text and preserve formatting (leading +, zeros)
      email,
      service,
      message
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
