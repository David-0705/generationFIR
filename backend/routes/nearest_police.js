const express = require("express");
const router = express.Router();
const axios = require("axios");

// POST /api/nearest-police-station
router.post("/nearest-police-station", async (req, res) => {
  const { lat, lng } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Missing latitude or longitude" });
  }
  try {
    // Use Google Places API (requires API key in .env)
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    console.log("[NearestPolice] Using API Key:", apiKey);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&type=police&key=${apiKey}`;
    console.log("[NearestPolice] Request URL:", url);
    const response = await axios.get(url);
    console.log("[NearestPolice] Google Places Response:", response.data);
    const stations = response.data.results;
    if (!stations || stations.length === 0) {
      return res.status(404).json({ error: "No police stations found nearby", apiResponse: response.data });
    }
    // Return the nearest police station
    const nearest = stations[0];
    res.json({
      name: nearest.name,
      address: nearest.vicinity,
      location: nearest.geometry.location
    });
  } catch (err) {
    console.error("Google Places API error:", err?.response?.data || err);
    res.status(500).json({ error: "Failed to fetch police station", apiError: err?.response?.data || String(err) });
  }
});

module.exports = router;
