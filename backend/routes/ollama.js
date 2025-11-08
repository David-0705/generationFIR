// backend/routes/ollama.js
const express = require("express");
const axios = require("axios");
const router = express.Router();

const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

// POST /api/llm/ask-llm
// body expected: { prompt: string, max_tokens?: number, temperature?: number, model?: string }
router.post("/ask-llm", async (req, res) => {
  try {
    const { prompt, max_tokens = 512, temperature = 0.2, model } = req.body;
    const modelName = model || OLLAMA_MODEL;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Missing prompt string in request body" });
    }

    // Ollama generate endpoint
    const url = `${OLLAMA_URL}/api/generate`;

    // Request body shape: Ollama expects { model, prompt, ... } (their API evolves; this is a general pattern)
    const body = {
      model: modelName,
      prompt,
      // you can pass generation options - some Ollama versions expect `options` or top-level keys
      max_tokens,
      temperature
    };

    // call Ollama
    const response = await axios.post(url, body, {
      headers: { "Content-Type": "application/json" },
      timeout: 120000
    });

    // Normalize response — Ollama returns different shapes; try common
    // let text = "";
    // const data = response.data;
    // if (!data) {
    //   return res.status(500).json({ error: "empty_response_from_ollama" });
    // }

    // after receiving `response` from axios.post(...)
const raw = response.data;
let cleanText = "";

// Case A: response.data is a string containing newline-delimited JSON (stream)
if (typeof raw === "string" && raw.trim().length > 0 && raw.includes("\n")) {
  try {
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const pieces = [];
    for (const line of lines) {
      try {
        const obj = JSON.parse(line);
        if (obj && typeof obj === "object") {
          if (obj.response) pieces.push(String(obj.response));
          else if (obj.generated_text) pieces.push(String(obj.generated_text));
          else if (obj.text) pieces.push(String(obj.text));
        } else if (typeof line === "string") {
          pieces.push(line);
        }
      } catch (e) {
        // not JSON — keep the raw line
        pieces.push(line);
      }
    }
    cleanText = pieces.join("");
  } catch (e) {
    cleanText = raw; // fallback to raw if parsing fails
  }
}
// Case B: response.data is an object or array (non-stream)
else if (typeof raw === "object" && raw !== null) {
  if (Array.isArray(raw)) {
    cleanText = raw.map(item => item.generated_text || item.text || JSON.stringify(item)).join("\n");
  } else if (raw.output && typeof raw.output === "string") {
    cleanText = raw.output;
  } else if (raw.generated_text) {
    cleanText = raw.generated_text;
  } else if (raw.choices && raw.choices.length) {
    cleanText = raw.choices.map(c => c.text || c.message?.content || c.output).join("\n");
  } else {
    cleanText = JSON.stringify(raw).slice(0, 20000);
  }
}
// Case C: fallback
else {
  cleanText = String(raw);
}

return res.json({ ok: true, model: modelName, text: cleanText });


    // Common patterns: data.output, data.choices[0].text, data.choices[0].content, or data (string)
    if (typeof data === "string") {
      text = data;
    } else if (Array.isArray(data)) {
      text = data.map(d => (d?.generated_text || d?.text || (typeof d === "string" ? d : JSON.stringify(d)))).join("\n");
    } else if (data?.output) {
      // some builds return { output: "..." }
      text = data.output;
    } else if (data?.choices && data.choices.length > 0) {
      text = data.choices.map(c => c.text || c.message?.content || c.output).join("\n");
    } else if (data?.generated_text) {
      text = data.generated_text;
    } else {
      text = JSON.stringify(data).slice(0, 20000);
    }

    return res.json({ ok: true, model: modelName, text });
  } catch (err) {
    console.error("Ollama inference error:", err?.response?.data || err.message);

    // If Ollama not reachable, return friendly error to frontend so it can fallback
    if (err.code === "ECONNREFUSED" || (err.response && err.response.status === 404)) {
      return res.status(503).json({ error: "ollama_unavailable", detail: "Ollama local server not running at " + (process.env.OLLAMA_URL || "http://localhost:11434") });
    }

    // rate limits and other issues
    const status = (err.response && err.response.status) || 500;
    return res.status(status).json({ error: "inference_failed", detail: err?.response?.data || err.message });
  }
});

module.exports = router;
