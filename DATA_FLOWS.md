# FIR Chatbot - Data Flow Analysis
## Complete Flow Details for Diagram Creation

---

## FLOW 1: FIR Form Submission & Database Save

### Main Flow: User Input → Validation → Save to MongoDB

**Starting Point:** User submits FIR form  
**Ending Point:** FIR saved in MongoDB with ID  
**Duration:** 2-5 seconds

### Step-by-Step Flow:

```
1. USER ACTION (Frontend - chat.jsx)
   ├─ User enters answer to question (voice or keyboard)
   ├─ Speech Recognition API captures voice → Text
   └─ Text input stored in React state: setState(text)

2. INPUT EXTRACTION & VALIDATION (chat.jsx)
   ├─ extractInformation(userInput, currentField)
   ├─ Field-specific validation:
   │  ├─ Mobile: Regex /\b\d{10}\b/
   │  ├─ Email: Regex /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/
   │  ├─ Age: Regex \d{1,3} → check 1-120 range
   │  └─ Text: Check length > 2 chars
   └─ Return: Extracted value or null

3. STATE UPDATE (chat.jsx)
   ├─ If validation passes:
   │  ├─ Call setAtPath(state, question.key, extractedValue)
   │  │  └─ Handles nested paths like "accused.0.name"
   │  │  └─ Auto-creates parent objects/arrays as needed
   │  ├─ Update collectedFields Set
   │  └─ setState(newState)
   └─ Else: Show validation error message

4. MOVE TO NEXT QUESTION
   ├─ getNextField() → Check which fields still need data
   ├─ setCurrentField(nextField)
   └─ Render next question

5. ALL QUESTIONS COMPLETE?
   ├─ If NO → Loop back to Step 1
   └─ If YES → Proceed to payload preparation

6. PAYLOAD PREPARATION (chat.jsx - preparePayloadForSave)
   ├─ Deep clone state object
   ├─ Normalize arrays:
   │  ├─ section2: Ensure array of {sno, act, section}
   │  └─ accused: Ensure array of {name, alias, address}
   ├─ Normalize dates:
   │  ├─ combineDateAndTime(dateFrom, timeFrom) → ISO timestamp
   │  ├─ occurrence.dateFrom → YYYY-MM-DD
   │  ├─ occurrence.dateTo → YYYY-MM-DD
   │  └─ meta.firDateTime → ISO datetime
   ├─ Ensure numeric types:
   │  └─ totalValueOfProperty → Number (default 0)
   ├─ Remove empty section2 entries
   └─ Return normalized payload

7. API CALL (frontend/src/api.js - saveFir)
   ├─ axios.post(`${API}/api/fir/save`, payload)
   ├─ Headers: Content-Type: application/json
   └─ Request body: Full normalized FIR object

8. BACKEND ROUTE HANDLER (backend/routes/fir.js)
   ├─ router.post("/save", async (req, res) => {
   │  ├─ const data = req.body (entire FIR object)
   │  ├─ const fir = new Fir(data)
   │  │  └─ Mongoose validates schema on instantiation
   │  ├─ await fir.save() → MongoDB insert
   │  │  └─ Generates _id (ObjectId)
   │  │  └─ Sets createdAt timestamp
   │  └─ res.json({ ok: true, id: fir._id })
   └─ Return response

9. DATABASE OPERATION (MongoDB)
   ├─ Connection: mongoose.connect(MONGO_URI)
   ├─ Database: "firdb"
   ├─ Collection: "firs"
   ├─ Insert operation:
   │  ├─ Validate schema types
   │  ├─ Index on _id
   │  └─ Write document
   └─ Document stored with:
      ├─ meta: {district, policeStation, year, firNo, firDateTime}
      ├─ section2: [{sno, act, section}]
      ├─ occurrence: {dateFrom, dateTo, timeFrom, timeTo, ...}
      ├─ complainant: {name, phone, address, ...}
      ├─ accused: [{name, alias, address}]
      ├─ totalValueOfProperty: Number
      ├─ firstInformationContents: String
      └─ createdAt: Timestamp

10. RESPONSE TO FRONTEND
    ├─ Backend returns: { ok: true, id: "507f1f77bcf86cd799439011" }
    ├─ Frontend receives response
    ├─ setFirId(response.id)
    ├─ Display success message
    ├─ Enable PDF download button
    └─ User can now download or file another complaint
```

### State Structure at Each Step:

**Initial State (defaults from QUESTIONS array):**
```javascript
{
  meta: { district: "Brihanmumbai City", policeStation: "Agripada", year: 2025, ... },
  occurrence: { day: "Monday", dateFrom: "2025-10-06", ... },
  complainant: { name: "", phone: "", ... },
  accused: [{ name: "", alias: "", address: "" }],
  firstInformationContents: ""
}
```

**After Each Answer:**
```javascript
// Example after answering "complainant.name"
{
  ...previous,
  complainant: {
    ...previous.complainant,
    name: "Nasir Nazir Shaikh"  // ← Updated
  }
}
```

**Before Save (after preparePayloadForSave):**
```javascript
{
  meta: {
    district: "...",
    firDateTime: "2025-10-06T20:04:00Z"  // ← Combined & ISO formatted
  },
  occurrence: {
    dateFrom: "2025-10-06",  // ← Formatted as YYYY-MM-DD
    dateTo: "2025-10-06",
    timeFrom: "18:00",
    timeTo: "18:10",
    infoReceivedAtPS: { date: "2025-10-06", time: "20:04" }
  },
  totalValueOfProperty: 1900,  // ← Converted to Number
  section2: [
    { sno: 1, act: "BNS", section: "303" },
    { sno: 2, act: "BNS", section: "304" }
  ],  // ← Validated as array, empty items removed
  accused: [...],
  complainant: {...}
}
```

### Key Files in This Flow:
- **frontend/src/components/chat.jsx** — Main form logic, validation, state management
- **frontend/src/api.js** — Axios POST to backend
- **backend/routes/fir.js** — Save endpoint
- **backend/models/Fir.js** — Mongoose schema
- **MongoDB** — Data persistence

### Error Handling:
| Point | Error | Handling |
|-------|-------|----------|
| Input validation | Invalid email/mobile | Show message: "Invalid format" |
| State update | setAtPath fails | Fallback to default, log to console |
| API call | Network error | Catch error, show "Network error" |
| DB save | Duplicate key / schema error | Return 500 error to frontend |
| Response | Missing _id | Frontend shows "Save failed" |

---

## FLOW 2: PDF Generation & Download

### Main Flow: FIR ID → Template Rendering → PDF → Download

**Starting Point:** User clicks "Download PDF" button  
**Ending Point:** PDF file saved on user's computer  
**Duration:** 3-8 seconds (depends on FIR data size)

### Step-by-Step Flow:

```
1. USER ACTION (Frontend - chat.jsx)
   ├─ User clicks button: "Download/Print FIR PDF"
   ├─ Check if firId exists (from previous save)
   └─ If no firId: Show message "Save FIR first"

2. INITIATE PDF DOWNLOAD (chat.jsx - handleDownloadPdf)
   ├─ setStatus("Generating PDF...")
   ├─ Call getFirPdf(firId) → API request
   └─ Await response (blocking)

3. API CALL (frontend/src/api.js)
   ├─ axios.get(`${API}/api/fir/${firId}/pdf_html`, {
   │  └─ responseType: "blob"  ← Tell axios to expect binary data
   │  })
   └─ Send GET request to backend

4. BACKEND ROUTE HANDLER (backend/routes/fir_pdf.js - GET /:id/pdf_html)
   ├─ Extract FIR ID from URL params
   ├─ router.get("/:id/pdf_html", async (req, res) => {
   │  ├─ const id = req.params.id
   │  ├─ const fir = await Fir.findById(id)
   │  │  └─ Query MongoDB for document with matching _id
   │  ├─ If not found: return res.status(404).send("FIR not found")
   │  └─ If found: Proceed to PDF generation
   └─ })

5. PDF GENERATION (backend/utils/fir_pdf_html.js - generateFirPdfHtml)
   ├─ Call: fillHtmlTemplate(fir)
   │  ├─ Read HTML template file: backend/templates/fir_template.html
   │  ├─ For each placeholder in template:
   │  │  ├─ {{district}} → Replace with fir.meta.district
   │  │  ├─ {{policeStation}} → Replace with fir.meta.policeStation
   │  │  ├─ {{sections}} → Generate <tr> table rows from fir.section2[]
   │  │  ├─ {{complainantName}} → Replace with fir.complainant.name
   │  │  ├─ {{accusedList}} → Generate list from fir.accused[]
   │  │  └─ ... (40+ placeholders total)
   │  ├─ Date formatting:
   │  │  ├─ formatDate(val) → Convert to YYYY-MM-DD
   │  │  ├─ Handle ISO strings, Date objects, malformed dates
   │  │  └─ Return empty string if invalid
   │  ├─ Array handling:
   │  │  ├─ section2 → Build table HTML: <tr><td>{{sno}}</td><td>{{act}}</td>...</tr>
   │  │  └─ accused → Build numbered list: "1. Name (Alias) Address"
   │  ├─ Save debug HTML: fs.writeFileSync(/tmp/fir_debug.html, html)
   │  └─ Return: Populated HTML string
   │
   ├─ Validate HTML: Check length > 100 chars, throw error if empty
   │
   ├─ Launch Puppeteer:
   │  ├─ const browser = await puppeteer.launch({ headless: "new" })
   │  │  └─ Spawns headless Chromium process
   │  ├─ const page = await browser.newPage()
   │  │  └─ Create new tab in browser
   │  ├─ await page.setContent(html, {
   │  │     waitUntil: "domcontentloaded",
   │  │     timeout: 60000
   │  │  })
   │  │  └─ Render HTML content in page (60 sec timeout)
   │  └─ Apply CSS rendering:
   │     ├─ Fonts load (Noto Sans for Devanagari)
   │     └─ Colors, borders, tables render
   │
   ├─ Generate PDF:
   │  ├─ const pdfBuffer = await page.pdf({
   │  │     format: "A4",
   │  │     printBackground: true
   │  │  })
   │  │  └─ Render page to PDF
   │  │  └─ A4 size (210 × 297 mm)
   │  │  └─ printBackground: Include background colors/images
   │  ├─ Save debug PDF: fs.writeFileSync(/tmp/fir_debug.pdf, pdfBuffer)
   │  └─ Return pdfBuffer (Buffer object with binary data)
   │
   └─ Cleanup:
      ├─ await browser.close()
      └─ Release Chromium process
```

6. SEND PDF RESPONSE (backend/routes/fir_pdf.js)
   ├─ Set response headers:
   │  ├─ Content-Type: application/pdf
   │  ├─ Content-Disposition: inline; filename=fir_${firId}.pdf
   │  └─ (inline = open in browser, attachment = download)
   ├─ res.send(pdfBuffer)
   └─ Send PDF binary data

7. RECEIVE RESPONSE (Frontend - Axios)
   ├─ Response: { data: <Blob>, status: 200 }
   ├─ data = Blob with mimetype application/pdf
   ├─ response.data = PDF binary content
   └─ Proceed to download

8. TRIGGER BROWSER DOWNLOAD (chat.jsx - handleDownloadPdf)
   ├─ const url = window.URL.createObjectURL(
   │     new Blob([response.data], { type: "application/pdf" })
   │  )
   │  └─ Create object URL from blob
   ├─ const link = document.createElement("a")
   │  └─ Create temporary anchor element
   ├─ link.href = url
   │  └─ Set href to object URL
   ├─ link.setAttribute("download", `FIR_${firId}.pdf`)
   │  └─ Set filename for download
   ├─ document.body.appendChild(link)
   │  └─ Add to DOM (temporary)
   ├─ link.click()
   │  └─ Trigger click event → browser download dialog
   ├─ link.remove()
   │  └─ Remove from DOM
   ├─ window.URL.revokeObjectURL(url)
   │  └─ Free up memory from object URL
   └─ setStatus("PDF downloaded")

9. USER INTERACTION
   ├─ Browser shows download dialog
   ├─ File saved to: C:\Users\<username>\Downloads\FIR_<id>.pdf
   └─ PDF can be opened, printed, or shared
```

### HTML Template Placeholder Mapping:

| Placeholder | Source | Example |
|-------------|--------|---------|
| `{{district}}` | fir.meta.district | "Brihanmumbai City" |
| `{{policeStation}}` | fir.meta.policeStation | "Agripada" |
| `{{year}}` | fir.meta.year | 2025 |
| `{{firNo}}` | fir.meta.firNo | "0498" |
| `{{firDate}}` | fir.meta.firDateTime (split) | "2025-10-06" |
| `{{firTime}}` | fir.meta.firDateTime (split) | "20:04" |
| `{{sections}}` | Build from fir.section2 | `<tr><td>1</td><td>BNS</td><td>303</td></tr>` |
| `{{complainantName}}` | fir.complainant.name | "Nasir Nazir Shaikh" |
| `{{complainantPhone}}` | fir.complainant.phone | "9876543210" |
| `{{accusedList}}` | Build from fir.accused | "1. John Doe (Johnny) 123 Street\n2. Jane Smith..." |
| `{{totalValueOfProperty}}` | fir.totalValueOfProperty | "1900" |
| `{{firstInformationContents}}` | fir.firstInformationContents | "Incident description here..." |

### Key Files in This Flow:
- **frontend/src/components/chat.jsx** — handleDownloadPdf() function
- **frontend/src/api.js** — getFirPdf(id) API call
- **backend/routes/fir_pdf.js** — GET /:id/pdf_html endpoint
- **backend/utils/fir_pdf_html.js** — fillHtmlTemplate(), generateFirPdfHtml()
- **backend/templates/fir_template.html** — HTML template with placeholders
- **Puppeteer** — Browser automation for PDF rendering
- **MongoDB** — Fetch FIR document by ID

### Performance Metrics:
| Stage | Duration |
|-------|----------|
| API call + find in DB | ~200ms |
| HTML template filling | ~50ms |
| Puppeteer launch | ~500ms |
| HTML rendering | ~1000ms |
| PDF generation | ~1000ms |
| Total backend time | ~2750ms (~3 sec) |
| Frontend download trigger | ~100ms |
| **Total end-to-end** | **~3-4 seconds** |

---

## FLOW 3: BNS Section Prediction

### Main Flow: FIR Description → BERT Model → Section Suggestions

**Starting Point:** User enters FIR description and clicks "Predict Section"  
**Ending Point:** Predicted legal sections displayed  
**Duration:** 2-5 seconds (first time includes model load)

### Step-by-Step Flow:

```
1. USER ACTION (Frontend - chat.jsx)
   ├─ User types text in "Predict Section" input box
   ├─ sectionPredictText = "Description of incident..."
   └─ User clicks button: "Predict Section"

2. INITIATE PREDICTION (chat.jsx - handlePredictSection)
   ├─ setSectionPredictLoading(true)
   ├─ setSectionPredictResult("")
   ├─ setSectionPredictError("")
   └─ Call predictSection(sectionPredictText) → API

3. API CALL (frontend/src/api.js - predictSection)
   ├─ axios.post(`${API}/api/bns/predict-section`, {
   │  └─ firstInformationContents: sectionPredictText
   │  })
   └─ Send POST request

4. BACKEND ROUTE HANDLER (backend/routes/bns_predict.js)
   ├─ router.post("/predict-section", async (req, res) => {
   │  ├─ const text = req.body.firstInformationContents
   │  ├─ Validate: text is string, not empty
   │  │  └─ If invalid: return 400 error
   │  │
   │  ├─ Spawn Python subprocess:
   │  │  ├─ const py = spawn(
   │  │  │     "C:\\Users\\david\\...\\env\\Scripts\\python.exe",
   │  │  │     ["predictt.py", text]  ← Text as command-line argument
   │  │  │  )
   │  │  │  └─ Note: Hardcoded Python path (should be configurable)
   │  │  │
   │  │  ├─ Capture stdout (success output)
   │  │  └─ Capture stderr (error output)
   │  │
   │  ├─ py.stdout.on("data", (data) => {
   │  │  └─ result += data.toString()  ← Accumulate output
   │  │  })
   │  │
   │  ├─ py.on("close", (code) => {
   │  │  ├─ If code !== 0: return 500 error with stderr
   │  │  ├─ If code === 0:
   │  │  │  ├─ Try: const parsed = JSON.parse(result)
   │  │  │  │  └─ Python outputs JSON string
   │  │  │  ├─ res.json(parsed)  ← Send parsed JSON response
   │  │  │  └─ Catch: res.status(500).json({ error: "Invalid output" })
   │  │  └─ })
   │  └─ })

5. PYTHON ML PROCESS (backend/predictt.py)
   ├─ Receive: Command-line argument (FIR text)
   ├─ sys.argv[1] = firstInformationContents
   │
   ├─ LOAD MODEL & TOKENIZER:
   │  ├─ from transformers import AutoTokenizer, AutoModel
   │  ├─ tokenizer = AutoTokenizer.from_pretrained("bert-base-multilingual-cased")
   │  │  └─ Load pre-trained BERT tokenizer
   │  ├─ model = torch.load("backend/model/enhanced_legal_bert_model.pth")
   │  │  └─ Load fine-tuned legal BERT model
   │  ├─ label_encoder = joblib.load("label_encoder.pkl")
   │  │  └─ Load mapping of integer labels to BNS section numbers
   │  └─ section_titles = json.load("bns_sections.json")
   │     └─ Load BNS section number → title mapping
   │
   ├─ TOKENIZE INPUT:
   │  ├─ inputs = tokenizer(
   │  │     text,
   │  │     max_length=512,
   │  │     truncation=True,
   │  │     padding=True,
   │  │     return_tensors="pt"
   │  │  )
   │  │  └─ Convert text to token IDs
   │  │  └─ Pad/truncate to 512 tokens
   │  └─ Process GPU/CPU (model on device)
   │
   ├─ MODEL INFERENCE:
   │  ├─ with torch.no_grad():
   │  │  ├─ outputs = model(**inputs)
   │  │  │  └─ Forward pass through BERT
   │  │  ├─ logits = outputs.logits  ← Raw prediction scores
   │  │  ├─ probabilities = torch.sigmoid(logits)
   │  │  │  └─ Multi-label: sigmoid activation (not softmax)
   │  │  └─ predictions = (probabilities > 0.5).int()
   │  │     └─ Binarize: threshold 0.5
   │  └─ })
   │
   ├─ POST-PROCESS PREDICTIONS:
   │  ├─ Get top-k predictions (e.g., k=5)
   │  ├─ For each predicted label:
   │  │  ├─ section_number = label_encoder.inverse_transform([label])
   │  │  ├─ section_title = section_titles[section_number]
   │  │  ├─ confidence = probabilities[label].item()
   │  │  └─ Append {section, title, confidence}
   │  └─ Sort by confidence (descending)
   │
   ├─ OUTPUT JSON:
   │  ├─ {
   │  │    "sections": [
   │  │      {
   │  │        "section": "303",
   │  │        "title": "Dacoity",
   │  │        "confidence": 0.94
   │  │      },
   │  │      {
   │  │        "section": "304",
   │  │        "title": "Attempt to commit dacoity",
   │  │        "confidence": 0.87
   │  │      },
   │  │      ...
   │  │    ]
   │  │  }
   │  └─ Print to stdout (captured by Node.js)
   │
   └─ Exit: sys.exit(0)  ← Success exit code

6. BACKEND RECEIVES PYTHON OUTPUT
   ├─ py.on("close") triggered with code=0
   ├─ Parse JSON result
   ├─ res.json(parsed)
   └─ Send response to frontend

7. FRONTEND RECEIVES RESPONSE
   ├─ axios.post success → data = { sections: [...] }
   ├─ If Array.isArray(data.sections) && length > 0:
   │  ├─ setSectionPredictResult(
   │  │     <div>
   │  │       <strong>Predicted Section(s):</strong>
   │  │       <ol>
   │  │         {data.sections.map((s) => (
   │  │           <li>Section {s.section}: {s.title}</li>
   │  │         ))}
   │  │       </ol>
   │  │     </div>
   │  │  )
   │  └─ Render as ordered list
   ├─ Else:
   │  └─ setSectionPredictResult("No section predicted")
   └─ setSectionPredictLoading(false)

8. DISPLAY RESULTS
   ├─ Show list of predicted sections
   ├─ User can review and optionally copy sections to FIR form
   ├─ User can file another prediction or continue with FIR
   └─ Results are not auto-saved (advisory only)
```

### Model Architecture:

```
Input Text (FIR Description)
        ↓
   Tokenizer (BERT)
   - Converts words → Token IDs
   - Max 512 tokens
   - Padding/truncation
        ↓
   BERT Encoder (12 layers)
   - Multi-head attention: 12 heads
   - Feed-forward networks
   - Outputs: [CLS] token embedding + all token embeddings
        ↓
   Classification Head (Fine-tuned)
   - Dense layers
   - Sigmoid activation (multi-label)
        ↓
   Output Logits (num_sections, e.g., 500)
   - One score per BNS section
        ↓
   Sigmoid → Probabilities (0-1)
   - Each section independently scored
        ↓
   Threshold (0.5)
   - Predicted = prob > 0.5
        ↓
   Top-K Filtering (e.g., k=5)
   - Sort by confidence
   - Return top 5 sections
        ↓
   Label Mapping
   - Convert integer label → BNS section number
   - Look up title from bns_sections.json
        ↓
   JSON Output
   - { sections: [{section, title, confidence}, ...] }
```

### Performance Metrics:

| Stage | Duration | Notes |
|-------|----------|-------|
| Tokenization | ~10ms | Fast |
| Model load (first time) | ~1000ms | Cached after first call |
| Model inference | ~500ms | GPU faster if available |
| Label mapping | ~50ms | In-memory lookups |
| JSON serialization | ~20ms | Small output |
| **Total (first call)** | **~1600ms** | Model load overhead |
| **Total (subsequent)** | **~600ms** | Cached model |

### Key Files in This Flow:
- **frontend/src/components/chat.jsx** — handlePredictSection(), UI
- **frontend/src/api.js** — predictSection(text) API call
- **backend/routes/bns_predict.js** — POST /predict-section endpoint
- **backend/predictt.py** — BERT inference, section prediction
- **backend/model/enhanced_legal_bert_model.pth** — PyTorch model
- **backend/bns_sections.json** — Section metadata
- **backend/bns_multi_label_model/** — Tokenizer & model artifacts

---

## FLOW 4: Nearest Police Station Detection

### Main Flow: User Location → Google Places API → Police Station Info

**Starting Point:** User clicks "Detect Nearest Police Station" button  
**Ending Point:** Police station name, address, and map coordinates displayed  
**Duration:** 1-3 seconds (depends on network and GPS)

### Step-by-Step Flow:

```
1. USER ACTION (Frontend - NearestPoliceStation component)
   ├─ User clicks button: "Detect Nearest Police Station"
   ├─ setLoading(true)
   ├─ setError("")
   ├─ setStation(null)
   └─ handleDetect() triggered

2. CHECK GEOLOCATION SUPPORT
   ├─ if (!navigator.geolocation)
   │  ├─ setError("Geolocation not supported")
   │  └─ return
   └─ Browser has geolocation API

3. REQUEST USER PERMISSION
   ├─ navigator.geolocation.getCurrentPosition(
   │     onSuccess,
   │     onError,
   │     { timeout: 10000, maximumAge: 0 }
   │  )
   ├─ Browser shows permission dialog:
   │  ├─ "Allow <website> to access your location?"
   │  ├─ User clicks "Allow" or "Block"
   │  └─ Result: onSuccess or onError callback
   └─ If allowed: Continue to Step 4

4. GET GPS COORDINATES
   ├─ onSuccess callback:
   │  ├─ const { latitude, longitude } = pos.coords
   │  │  └─ GPS coordinates from device
   │  │  └─ Example: { latitude: 19.0144, longitude: 72.8479 }  (Mumbai)
   │  ├─ setLocation({ lat: latitude, lng: longitude })
   │  └─ Proceed to API call
   │
   └─ onError callback:
      ├─ error.code:
      │  ├─ 1 = Permission denied
      │  ├─ 2 = Position unavailable
      │  └─ 3 = Timeout
      ├─ setError("Location error: " + error.message)
      └─ return

5. API CALL (frontend/src/api.js)
   ├─ getNearestPoliceStation(latitude, longitude)
   ├─ axios.post(
   │     `${API}/api/nearest-police/nearest-police-station`,
   │     { lat, lng }
   │  )
   └─ Send POST request to backend

6. BACKEND ROUTE HANDLER (backend/routes/nearest_police.js)
   ├─ router.post("/nearest-police-station", async (req, res) => {
   │  ├─ const { lat, lng } = req.body
   │  ├─ Validate:
   │  │  ├─ if (!lat || !lng)
   │  │  │  └─ return 400 error "Missing lat/lng"
   │  │  └─ Valid coordinates
   │  │
   │  ├─ Get API Key:
   │  │  ├─ const apiKey = process.env.GOOGLE_PLACES_API_KEY
   │  │  └─ From .env file
   │  │
   │  ├─ Build API URL:
   │  │  ├─ const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?
   │  │  │              location=${lat},${lng}&
   │  │  │              radius=5000&
   │  │  │              type=police&
   │  │  │              key=${apiKey}`
   │  │  │
   │  │  ├─ Query Parameters:
   │  │  │  ├─ location: center point (lat,lng)
   │  │  │  ├─ radius: 5000 meters (5 km search radius)
   │  │  │  ├─ type: "police" (search for police stations)
   │  │  │  └─ key: Google API key (authentication)
   │  │  │
   │  │  └─ Example URL:
   │  │     https://maps.googleapis.com/maps/api/place/nearbysearch/json?
   │  │     location=19.0144,72.8479&radius=5000&type=police&key=AIza...
   │  │
   │  ├─ Make API Call:
   │  │  ├─ const response = await axios.get(url)
   │  │  │  └─ Send GET request to Google
   │  │  │
   │  │  └─ response.data = {
   │  │       "results": [
   │  │         {
   │  │           "name": "Agripada Police Station",
   │  │           "vicinity": "Agripada, Mumbai, Maharashtra 400011",
   │  │           "geometry": {
   │  │             "location": {
   │  │               "lat": 19.0168,
   │  │               "lng": 72.8483
   │  │             }
   │  │           },
   │  │           ... (other fields)
   │  │         },
   │  │         { ... more stations ... }
   │  │       ],
   │  │       "status": "OK"
   │  │     }
   │  │
   │  ├─ Parse Response:
   │  │  ├─ const stations = response.data.results
   │  │  ├─ Check: stations.length > 0
   │  │  │  ├─ If empty: return 404 "No police stations found nearby"
   │  │  │  └─ Found results
   │  │  │
   │  │  ├─ Get Nearest (first result is closest):
   │  │  │  ├─ const nearest = stations[0]
   │  │  │  │  └─ Google returns sorted by distance
   │  │  │  │
   │  │  │  └─ Extract Data:
   │  │  │     ├─ name = nearest.name
   │  │  │     │  └─ "Agripada Police Station"
   │  │  │     ├─ address = nearest.vicinity
   │  │  │     │  └─ "Agripada, Mumbai, Maharashtra 400011"
   │  │  │     └─ location = nearest.geometry.location
   │  │  │        └─ { lat: 19.0168, lng: 72.8483 }
   │  │  │
   │  │  └─ Return:
   │  │     res.json({
   │  │       name,
   │  │       address,
   │  │       location
   │  │     })

7. ERROR HANDLING (backend)
   ├─ if Google API error:
   │  ├─ catch (err) {
   │  │  ├─ console.error(err.response.data or err)
   │  │  ├─ return 500 {
   │  │  │     error: "Failed to fetch police station",
   │  │  │     apiError: err.response.data or err message
   │  │  │  }
   │  │  └─ }
   │  └─ Possible errors:
   │     ├─ Invalid API key
   │     ├─ API quota exceeded
   │     ├─ Network timeout
   │     └─ Invalid coordinates

8. FRONTEND RECEIVES RESPONSE
   ├─ axios.post success:
   │  ├─ result = { name, address, location: { lat, lng } }
   │  ├─ setStation(result)
   │  ├─ setLoading(false)
   │  └─ Display in UI
   │
   └─ axios.post error:
      ├─ catch (err) {
      │  ├─ error_msg = err.response.data.error or err.message
      │  ├─ setError("Could not find: " + error_msg)
      │  └─ setLoading(false)
      └─ }

9. DISPLAY RESULTS
   ├─ Show police station info:
   │  ├─ <b>Nearest Police Station:</b>
   │  ├─ Station Name: "Agripada Police Station"
   │  ├─ Address: "Agripada, Mumbai, Maharashtra 400011"
   │  ├─ Coordinates: "Lat: 19.0168, Lng: 72.8483"
   │  └─ (Optional: Link to Google Maps)
   └─ User can save to FIR form or search again
```

### API Response Structure:

**Success Response:**
```json
{
  "name": "Agripada Police Station",
  "address": "Agripada, Mumbai, Maharashtra 400011",
  "location": {
    "lat": 19.0168,
    "lng": 72.8483
  }
}
```

**Error Response:**
```json
{
  "error": "Failed to fetch police station",
  "apiError": "Invalid API key"
}
```

### Geolocation Accuracy:

| Accuracy | Range | Source |
|----------|-------|--------|
| GPS | ±5-10 meters | Satellite (best outdoors) |
| WiFi | ±20-30 meters | WiFi networks |
| Cell tower | ±500+ meters | Cell signal (fallback) |
| User denied | N/A | No location available |

### Performance Metrics:

| Stage | Duration |
|-------|----------|
| Permission dialog | User-dependent |
| GPS acquisition | ~1-5 seconds |
| API call to Google | ~500-1000ms |
| Parse response | ~10ms |
| **Total** | **~2-6 seconds** |

### Key Files in This Flow:
- **frontend/src/components/chat.jsx** — NearestPoliceStation component
- **frontend/src/api.js** — getNearestPoliceStation(lat, lng)
- **backend/routes/nearest_police.js** — POST /nearest-police-station endpoint
- **Google Places API** — External service
- **Browser Geolocation API** — navigator.geolocation

---

## Summary: Cross-Flow Dependencies

### Dataflow Graph:

```
┌─────────────────┐
│  User Input     │
│  (Voice/Text)   │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  FIR Form Submission (FLOW 1)            │
│  ├─ Input validation                     │
│  ├─ State management                     │
│  ├─ Payload preparation                  │
│  └─ Save to MongoDB                      │
└────────┬─────────────────────────────────┘
         │
         ├──────────────────┐
         │                  │
         ▼                  ▼
  ┌─────────────┐   ┌──────────────────┐
  │  FIR ID     │   │  FIR Data        │
  │             │   │  (MongoDB)       │
  └──────┬──────┘   └──────────────────┘
         │
         ├─────────────┬────────────────┐
         │             │                │
         ▼             ▼                ▼
   ┌─────────────┐ ┌──────────┐   ┌──────────┐
   │ FLOW 2      │ │ FLOW 3   │   │ FLOW 4   │
   │ PDF Gen     │ │ BNS Pred │   │ Police   │
   │ & Download  │ │ Section  │   │ Finder   │
   └─────────────┘ └──────────┘   └──────────┘
         │             │                │
         ▼             ▼                ▼
   [PDF File]  [Sections]         [Station Info]
```

### Data Structures Passing Through:

```
FIR Object Structure:
{
  _id: ObjectId,
  meta: { district, policeStation, year, firNo, firDateTime },
  occurrence: { dateFrom, dateTo, timeFrom, timeTo, ... },
  complainant: { name, phone, dob, ... },
  accused: [{ name, alias, address }],
  section2: [{ sno, act, section }],
  totalValueOfProperty: Number,
  firstInformationContents: String,
  createdAt: Date
}

↓ (FLOW 2)

HTML Template with Placeholders
↓
Rendered HTML (with fonts, styles)
↓
PDF Buffer (binary)
↓
Downloaded as file

↓ (FLOW 3)

firstInformationContents (String)
↓
BERT Tokenizer → Token IDs
↓
BERT Model → Logits → Probabilities
↓
{ sections: [{ section, title, confidence }] }
↓
Displayed as list

↓ (FLOW 4)

{ lat, lng }
↓
Google Places API query
↓
{ name, address, location }
↓
Displayed on UI
```

---

## Key Takeaways for Diagram

1. **FLOW 1 (FIR Save):** Sequential step-by-step input → validation → normalization → save
2. **FLOW 2 (PDF):** ID lookup → template filling → browser rendering → PDF output
3. **FLOW 3 (Prediction):** Text → Python subprocess → BERT model → JSON sections
4. **FLOW 4 (Police):** GPS → Google API → Parse → Display

All flows are **asynchronous** (use Promises/async-await) except FLOW 4 which includes **geolocation permission** dialog.

---

## Diagram Recommendations:

### For FLOW 1: Use **Sequence Diagram**
- Shows interactions between User → Frontend → Backend → Database
- Time flows top to bottom
- Highlight validation & error paths

### For FLOW 2: Use **Activity Diagram**
- Shows parallel tasks: template filling, Puppeteer launch, PDF generation
- Emphasize resource-intensive PDF generation

### For FLOW 3: Use **Data Flow Diagram**
- Shows data transformation through ML pipeline
- Highlight model layers and tensor operations

### For FLOW 4: Use **State Diagram**
- Shows user permission → GPS → API → Display states
- Include error fallbacks

