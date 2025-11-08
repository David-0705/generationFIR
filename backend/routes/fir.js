const express = require("express");
const router = express.Router();
const Fir = require("../models/Fir");

// Save FIR
router.post("/save", async (req, res) => {
  try {
    const data = req.body;
    const fir = new Fir(data);
    await fir.save();
    res.json({ ok: true, id: fir._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

// get latest FIRs (example)
router.get("/", async (req, res) => {
  const docs = await Fir.find().sort({ createdAt: -1 }).limit(20);
  res.json(docs);
});

module.exports = router;
