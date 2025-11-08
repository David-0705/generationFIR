const express = require("express");
const router = express.Router();
const { spawn } = require("child_process");

// POST /api/bns/predict-section
router.post("/predict-section", async (req, res) => {
  const text = req.body.firstInformationContents;
  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Missing or invalid firstInformationContents" });
  }

  // Call Python script for prediction
  const py = spawn("python", [
    "../bns_multi_label_model/predict.py", // You will create this script next
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
    if (code !== 0 || error) {
      return res.status(500).json({ error: error || "Prediction failed" });
    }
    // Expect Python to print a JSON string: { "sections": "..." }
    try {
      const parsed = JSON.parse(result);
      res.json(parsed);
    } catch (e) {
      res.status(500).json({ error: "Invalid prediction output" });
    }
  });
});

module.exports = router;
