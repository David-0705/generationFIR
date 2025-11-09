const path = require("path");
const fs = require("fs");
const puppeteer = require("puppeteer");

// Helper: fill HTML template with FIR data
function fillHtmlTemplate(fir) {
  const templatePath = path.join(__dirname, "../templates/fir_template.html");
  let html = fs.readFileSync(templatePath, "utf8");

  // Helper to safely get nested values, always return a string
  const get = (obj, path, def = "") => {
    try {
      let val = path.split(".").reduce((acc, k) => acc && acc[k], obj);
      if (val === undefined || val === null) return def;
      if (val instanceof Date) return val.toISOString().split('T')[0];
      if (typeof val === "object") return String(val);
      return String(val);
    } catch { return def; }
  };

  // Format date as YYYY-MM-DD, blank if missing
  const formatDate = (val) => {
    if (!val) return "";
    if (val instanceof Date) return val.toISOString().split('T')[0];
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return "";
  };

  // Section2 (acts/sections)
  let sections = "";
  if (Array.isArray(fir.section2) && fir.section2.length > 0) {
    sections = fir.section2.map(s => `<tr><td>${get(s, "sno", "")}</td><td>${get(s, "act", "")}</td><td>${get(s, "section", "")}</td></tr>`).join("\n");
  } else {
    sections = `<tr><td></td><td></td><td></td></tr>`;
  }

  // Accused list
  let accusedList = "";
  if (Array.isArray(fir.accused) && fir.accused.length > 0) {
    accusedList = fir.accused.map((a, i) => `${i+1}. ${get(a, "name", "")}${get(a, "alias") ? ` (${get(a, "alias")})` : ""} ${get(a, "address", "")}`).join("<br>");
  }

  // Safely handle firDateTime splitting and formatting
  const firDateTimeRaw = get(fir, "meta.firDateTime", "");
  let firDate = "", firTime = "";
  if (firDateTimeRaw) {
    const firDateTimeStr = String(firDateTimeRaw);
    const parts = firDateTimeStr.split("T");
    firDate = formatDate(parts[0]);
    firTime = parts[1] ? parts[1].slice(0,5) : "";
  }

  // Replace placeholders
  html = html.replace(/{{district}}/g, get(fir, "meta.district", ""))
    .replace(/{{policeStation}}/g, get(fir, "meta.policeStation", ""))
    .replace(/{{year}}/g, get(fir, "meta.year", ""))
    .replace(/{{firNo}}/g, get(fir, "meta.firNo", ""))
    .replace(/{{firDate}}/g, firDate)
    .replace(/{{firTime}}/g, firTime)
    .replace(/{{sections}}/g, sections)
    .replace(/{{occurrenceDay}}/g, get(fir, "occurrence.day", ""))
    .replace(/{{occurrenceDateFrom}}/g, formatDate(get(fir, "occurrence.dateFrom", "")))
    .replace(/{{occurrenceDateTo}}/g, formatDate(get(fir, "occurrence.dateTo", "")))
    .replace(/{{occurrenceTimePeriod}}/g, get(fir, "occurrence.timePeriod", ""))
    .replace(/{{occurrenceTimeFrom}}/g, get(fir, "occurrence.timeFrom", ""))
    .replace(/{{occurrenceTimeTo}}/g, get(fir, "occurrence.timeTo", ""))
    .replace(/{{infoReceivedDate}}/g, formatDate(get(fir, "occurrence.infoReceivedAtPS.date", "")))
    .replace(/{{infoReceivedTime}}/g, get(fir, "occurrence.infoReceivedAtPS.time", ""))
    .replace(/{{gdEntryNo}}/g, get(fir, "occurrence.gdRef.entryNo", ""))
    .replace(/{{gdDateTime}}/g, formatDate(get(fir, "occurrence.gdRef.dateTime", "")))
    .replace(/{{typeOfInfo}}/g, get(fir, "typeOfInfo", ""))
    .replace(/{{directionDistanceFromPS}}/g, get(fir, "placeOfOccurrence.directionDistanceFromPS", ""))
    .replace(/{{address}}/g, get(fir, "placeOfOccurrence.address", ""))
    .replace(/{{districtState}}/g, get(fir, "placeOfOccurrence.districtState", ""))
    .replace(/{{complainantName}}/g, get(fir, "complainant.name", ""))
    .replace(/{{complainantFatherOrHusbandName}}/g, get(fir, "complainant.fatherOrHusbandName", ""))
    .replace(/{{complainantDOB}}/g, formatDate(get(fir, "complainant.dob", "")))
    .replace(/{{complainantNationality}}/g, get(fir, "complainant.nationality", ""))
    .replace(/{{complainantUIDNo}}/g, get(fir, "complainant.uidNo", ""))
    .replace(/{{complainantPassportNo}}/g, get(fir, "complainant.passportNo", ""))
    .replace(/{{complainantOccupation}}/g, get(fir, "complainant.occupation", ""))
    .replace(/{{complainantCurrentAddress}}/g, get(fir, "complainant.currentAddress", ""))
    .replace(/{{complainantPermanentAddress}}/g, get(fir, "complainant.permanentAddress", ""))
    .replace(/{{complainantPhone}}/g, get(fir, "complainant.phone", ""))
    .replace(/{{complainantMobile}}/g, get(fir, "complainant.mobile", ""))
    .replace(/{{accusedList}}/g, accusedList)
    .replace(/{{totalValueOfProperty}}/g, get(fir, "totalValueOfProperty", ""))
    .replace(/{{firstInformationContents}}/g, get(fir, "firstInformationContents", ""));

  // Log the generated HTML for debugging
  fs.writeFileSync(path.join(__dirname, "../tmp/fir_debug.html"), html);

  return html;
}

// Generate PDF from HTML and return buffer (for API response)
async function generateFirPdfHtml(fir) {
  console.log("[PDF] generateFirPdfHtml called for FIR:", fir._id);
  const html = fillHtmlTemplate(fir);
  if (!html || html.trim().length < 100) {
    throw new Error("Generated HTML is empty or too short. Check FIR data and template.");
  }
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 60000 });
  const pdfBuffer = await page.pdf({ format: "A4", printBackground: true });
  // Save PDF for manual inspection
  fs.writeFileSync(path.join(__dirname, "../tmp/fir_debug.pdf"), pdfBuffer);
  await browser.close();
  return pdfBuffer;
}

module.exports = { fillHtmlTemplate, generateFirPdfHtml };
