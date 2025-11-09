const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");

// POST /api/bns/predict-section
router.post("/predict-section", async (req, res) => {
  const text = req.body.firstInformationContents;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid firstInformationContents" });
  }

  // Call new Python script for prediction
  // const py = spawn("python", [
  //   "predictt.py",
  //   text
  // ]);

  const py = spawn("C:\\Users\\david\\Code\\fir_chatbot_project\\env\\Scripts\\python.exe", [
    "predictt.py",
    text
  ]);

  let result = "";
  let error = "";

  py.stdout.on("data", (data) => {
    result += data.toString();
  });
  py.stderr.on("data", (data) => {
    error += data.toString();
  });
  py.on("close", (code) => {
    if (code !== 0) {
      return res.status(500).json({ error: error || "Prediction failed" });
    }
    // If code is 0, ignore stderr and use stdout as result
    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: "Invalid prediction output" });
    }
  });
});

module.exports = router;
