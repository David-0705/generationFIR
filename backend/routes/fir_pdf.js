const express = require("express");
const router = express.Router();
const Fir = require("../models/Fir");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Helper: fill LaTeX template with FIR data
function fillLatexTemplate(fir) {
  const templatePath = path.join(__dirname, "../templates/fir_template.tex");
  let tex = fs.readFileSync(templatePath, "utf8");

  // Helper to safely get nested values
  const get = (obj, path, def = "") => {
    try {
      return path.split(".").reduce((acc, k) => acc && acc[k], obj) ?? def;
    } catch { return def; }
  };


  // Helper to sanitize for LaTeX
  const latexSafe = (val) => {
    if (!val) return "--";
    return String(val)
      .replace(/([#$%&_{}~^\\])/g, '\\$1') // escape LaTeX special chars
      .replace(/\n/g, ' ');
  };

  // Format date as YYYY-MM-DD
  const formatDate = (val) => {
    if (!val) return "--";
    const d = new Date(val);
    if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    // If already looks like YYYY-MM-DD, return as is
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    return "--";
  };

  // Section2 (acts/sections)
  let sections = "";
  if (Array.isArray(fir.section2)) {
    sections = fir.section2.map(s => `\\textbf{${latexSafe(s.sno)}} \\hspace{3cm} ${latexSafe(s.act)} \\hspace{2cm} ${latexSafe(s.section)} \\`).join("\n");
  }

  // Accused list
  let accusedList = "";
  if (Array.isArray(fir.accused)) {
    accusedList = fir.accused.map((a, i) => `${i+1}. ${latexSafe(a.name)}${a.alias ? ` (${latexSafe(a.alias)})` : ""} ${latexSafe(a.address)}`).join("\\\n");
  }

  // ...removed propertiesOfInterest logic...

  // Fill template


  // Safely handle firDateTime splitting and formatting
  const firDateTimeRaw = get(fir, "meta.firDateTime", "");
  const firDateTimeStr = firDateTimeRaw ? String(firDateTimeRaw) : "";
  let firDate = formatDate(firDateTimeStr);
  let firTime = "--";
  if (firDateTimeStr.includes("T")) {
    const parts = firDateTimeStr.split("T");
    firDate = formatDate(parts[0]);
    firTime = parts[1] ? parts[1].slice(0,5) : "--";
  }

  tex = tex.replace(/{{district}}/g, latexSafe(get(fir, "meta.district")))
    .replace(/{{policeStation}}/g, latexSafe(get(fir, "meta.policeStation")))
    .replace(/{{year}}/g, latexSafe(get(fir, "meta.year")))
    .replace(/{{firNo}}/g, latexSafe(get(fir, "meta.firNo")))
    .replace(/{{firDate}}/g, firDate)
    .replace(/{{firTime}}/g, firTime)
    .replace(/{{sections}}/g, sections)
    .replace(/{{occurrenceDay}}/g, latexSafe(get(fir, "occurrence.day")))
    .replace(/{{occurrenceDateFrom}}/g, formatDate(get(fir, "occurrence.dateFrom")))
    .replace(/{{occurrenceDateTo}}/g, formatDate(get(fir, "occurrence.dateTo")))
    .replace(/{{occurrenceTimePeriod}}/g, latexSafe(get(fir, "occurrence.timePeriod")))
    .replace(/{{occurrenceTimeFrom}}/g, latexSafe(get(fir, "occurrence.timeFrom")))
    .replace(/{{occurrenceTimeTo}}/g, latexSafe(get(fir, "occurrence.timeTo")))
    .replace(/{{infoReceivedDate}}/g, formatDate(get(fir, "occurrence.infoReceivedAtPS.date")))
    .replace(/{{infoReceivedTime}}/g, latexSafe(get(fir, "occurrence.infoReceivedAtPS.time")))
    .replace(/{{gdEntryNo}}/g, latexSafe(get(fir, "occurrence.gdRef.entryNo")))
    .replace(/{{gdDateTime}}/g, formatDate(get(fir, "occurrence.gdRef.dateTime")))
    .replace(/{{typeOfInfo}}/g, latexSafe(get(fir, "typeOfInfo")))
    .replace(/{{directionDistanceFromPS}}/g, latexSafe(get(fir, "placeOfOccurrence.directionDistanceFromPS")))
    .replace(/{{address}}/g, latexSafe(get(fir, "placeOfOccurrence.address")))
    .replace(/{{districtState}}/g, latexSafe(get(fir, "placeOfOccurrence.districtState")))
    .replace(/{{complainantName}}/g, latexSafe(get(fir, "complainant.name")))
    .replace(/{{complainantFatherOrHusbandName}}/g, latexSafe(get(fir, "complainant.fatherOrHusbandName")))
    .replace(/{{complainantDOB}}/g, formatDate(get(fir, "complainant.dob")))
    .replace(/{{complainantNationality}}/g, latexSafe(get(fir, "complainant.nationality")))
    .replace(/{{complainantUIDNo}}/g, latexSafe(get(fir, "complainant.uidNo")))
    .replace(/{{complainantPassportNo}}/g, latexSafe(get(fir, "complainant.passportNo")))
    .replace(/{{complainantOccupation}}/g, latexSafe(get(fir, "complainant.occupation")))
    .replace(/{{complainantCurrentAddress}}/g, latexSafe(get(fir, "complainant.currentAddress")))
    .replace(/{{complainantPermanentAddress}}/g, latexSafe(get(fir, "complainant.permanentAddress")))
    .replace(/{{complainantPhone}}/g, latexSafe(get(fir, "complainant.phone")))
    .replace(/{{complainantMobile}}/g, latexSafe(get(fir, "complainant.mobile")))
  .replace(/{{accusedList}}/g, accusedList)
    .replace(/{{totalValueOfProperty}}/g, latexSafe(get(fir, "totalValueOfProperty")))
    .replace(/{{firstInformationContents}}/g, latexSafe(get(fir, "firstInformationContents")));

  return tex;
}

// GET /api/fir/:id/pdf
router.get("/:id/pdf", async (req, res) => {
  // Legacy LaTeX PDF generation logic (commented out)
  /*
  try {
    const fir = await Fir.findById(req.params.id);
    if (!fir) return res.status(404).send("FIR not found");

    // Fill LaTeX template
    const texContent = fillLatexTemplate(fir);
    const tempDir = path.join(__dirname, "../tmp");
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    const texFile = path.join(tempDir, `fir_${fir._id}.tex`);
    const pdfFile = path.join(tempDir, `fir_${fir._id}.pdf`);
    fs.writeFileSync(texFile, texContent);

    // Compile LaTeX to PDF (requires pdflatex installed)
    exec(`xelatex -output-directory=${tempDir} ${texFile}`, (err, stdout, stderr) => {
      if (err) {
        console.error("LaTeX compile error:", stderr);
        return res.status(500).send("PDF generation failed");
      }
      // Serve PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=fir_${fir._id}.pdf`);
      fs.createReadStream(pdfFile).pipe(res);
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating FIR PDF");
  }
  */
  // End legacy logic
});

module.exports = router;
// New HTML-to-PDF endpoint using Puppeteer
const { generateFirPdfHtml } = require("../utils/fir_pdf_html");

router.get("/:id/pdf_html", async (req, res) => {
  try {
    const fir = await Fir.findById(req.params.id);
    if (!fir) {
      console.error(`[PDF] FIR not found for id: ${req.params.id}`);
      return res.status(404).send("FIR not found");
    }
    // Generate PDF using HTML template and Puppeteer
    try {
      const pdfBuffer = await generateFirPdfHtml(fir);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename=fir_${fir._id}.pdf`);
      res.send(pdfBuffer);
    } catch (pdfErr) {
      console.error(`[PDF] Error in generateFirPdfHtml:`, pdfErr);
      res.status(500).send(`Error generating FIR PDF (HTML): ${pdfErr.message || pdfErr}`);
    }
  } catch (err) {
    console.error(`[PDF] Route error:`, err);
    res.status(500).send(`Error generating FIR PDF (HTML): ${err.message || err}`);
  }
});
