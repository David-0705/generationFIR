const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));

const MONGO = process.env.MONGO_URI || "mongodb://localhost:27017/firdb";
mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(()=>console.log("Mongo connected"))
  .catch((e)=>console.error("Mongo error", e));



const firRoutes = require("./routes/fir");
const firPdfRoutes = require("./routes/fir_pdf");
const ollamaRoutes = require("./routes/ollama");
const llmRoutes = require("./routes/llm");

const nearestPoliceRoutes = require("./routes/nearest_police");
const bnsPredictRoutes = require("./routes/bns_predict");



app.use("/api/fir", firRoutes);
app.use("/api/fir", firPdfRoutes); // PDF route
// app.use("/api/llm", llmRoutes);
app.use("/api/llm", ollamaRoutes);

app.use("/api/nearest-police", nearestPoliceRoutes);
app.use("/api/bns", bnsPredictRoutes); // Section prediction route


const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>console.log("Server listening on", PORT));
