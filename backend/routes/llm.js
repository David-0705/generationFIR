const express = require("express");
const router = express.Router();
const axios = require("axios");
const multer = require("multer");
const upload = multer();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

// Example LLM completion (chat) — you can replace model and endpoint
router.post("/ask-llm", async (req, res) => {
  try {
    const { messages, model = "gpt-4o-mini" } = req.body;
    if (!OPENAI_API_KEY) return res.status(400).json({ error: "OPENAI_API_KEY not configured" });

    const resp = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model,
        messages
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    res.json(resp.data);
  } catch (err) {
    console.error(err?.response?.data || err.message);
    res.status(500).json({ error: err.message });
  }
});

// Optional audio transcription with uploaded audio buffer (multipart/form-data)
// This is only a stub. For Whisper use: POST /v1/audio/transcriptions with form-data (file, model=whisper-1)
router.post("/transcribe", upload.single("file"), async (req, res) => {
  try {
    if (!OPENAI_API_KEY) return res.status(400).json({ error: "OPENAI_API_KEY not configured" });
    // If you want to forward this audio to OpenAI Whisper, you'd implement a multipart request to OpenAI here.
    // For brevity, we'll return a stub.
    res.json({ text: "Transcription not implemented on server in this example. Use browser SR or implement Whisper." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
