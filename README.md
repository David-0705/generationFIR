
# FIR Chatbot Project - System Architecture

## 1. Project Overview

The **FIR Chatbot Project** is a full-stack web application designed to streamline the process of filing a First Information Report (FIR) in India. It leverages AI for section prediction, generates FIR PDFs, helps users locate the nearest police station, and supports multilingual input via voice and text.

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (Frontend)                      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌────────────────────┐         ┌──────────────────────┐            │
│  │  Citizen Justice   │         │   FIR Form & Chat    │            │
│  │  Hub (Vite/React)  │         │   Component (React)  │            │
│  │                    │         │                      │            │
│  │ - Routing          │         │ - Voice Input (Web   │            │
│  │ - Auth (Supabase)  │         │   Speech API)        │            │
│  │ - UI Components    │         │ - Question Flow      │            │
│  │ - Navigation       │         │ - Live Preview       │            │
│  │                    │         │ - PDF Download       │            │
│  └────────┬───────────┘         └──────────┬───────────┘            │
│           │                                 │                       │
│           └─────────────┬───────────────────┘                       │
│                         │                                           │
└─────────────────────────┼───────────────────────────────────────────┘
                          │
                    HTTP / REST APIs
                          │
┌─────────────────────────┼────────────────────────────────────────────┐
│                    API GATEWAY LAYER (Express)                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      ┤ 
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │          Backend Server (Node.js + Express)                  │    │
│  │                  PORT: 5000                                  │    │
│  │                                                              │    │
│  │  ┌────────────────────────────────────────────────────┐      │    │
│  │  │              API Routes / Endpoints                │      │    │
│  │  ├────────────────────────────────────────────────────┤      │    │
│  │  │ POST   /api/fir/save             → FIR Persistence │      │    │
│  │  │ GET    /api/fir/                 → Fetch FIRs      │      │    │
│  │  │ GET    /api/fir/:id/pdf_html     → PDF Generation  │      │    │
│  │  │ POST   /api/bns/predict-section  → BNS Prediction  │      │    │
│  │  │ POST   /api/nearest-police/...   → Police Finder   │      │    │
│  │  │ POST   /api/llm/ask-llm          → LLM (Ollama)    │      │    │
│  │  │ POST   /api/llm/transcribe       → Audio (Stub)    │      │    │
│  │  └────────────────────────────────────────────────────┘      │    │
│  │                                                              │    │
│  └──────────────────────────────────────────────────────────────┘    │
│                                                                      │
└──────────┬──────────────┬──────────────────┬──────────────┬──────────┘
           │              │                  │              │
           │              │                  │              │
      [MongoDB]   [Python ML]      [Google Places API]  [Ollama/OpenAI]
           │              │                  │              │
┌──────────▼──────┐ ┌─────▼────────┐ ┌──────▼────────┐ ┌──▼─────────┐
│                 │ │              │ │               │ │            │
│  Data Layer     │ │  ML Layer    │ │ External APIs │ │ LLM APIs   │
│                 │ │              │ │               │ │            │
└─────────────────┘ └──────────────┘ └───────────────┘ └────────────┘
```

---

## 3. Detailed Component Breakdown

### 3.1 Frontend Layer

#### **A. Citizen Justice Hub (`citizen-justice-hub-main/`)**
- **Framework:** React + TypeScript, Vite, Tailwind CSS
- **Authentication:** Supabase Auth
- **Key Pages:**
  - `src/pages/Chatbot.tsx` — Conversational FIR assistant with field extraction & validation
  - `src/pages/Form.tsx` — Bridges to the FIR form component
  - `src/pages/Index.tsx`, `Login.tsx`, `Signup.tsx` — Navigation & auth pages
- **UI Components:**
  - `src/components/Navigation.tsx` — Header/nav bar
  - `src/components/ui/` — Reusable UI elements (Button, Card, Input, Badge, etc.)
- **Integrations:**
  - Supabase client: `src/integrations/supabase/client.ts`
  - Database migrations: `supabase/migrations/`
- **State & Hooks:**
  - `src/hooks/use-toast.ts`, `use-mobile.tsx` — Custom React hooks
  - `src/lib/utils.ts` — Utility functions

#### **B. FIR Form & Chat Component (`frontend/`)**
- **Framework:** React, plain JavaScript
- **Main Component:** `src/components/chat.jsx`
  - **Features:**
    - Question-based FIR input flow (25+ questions)
    - Web Speech API for voice recognition (supports `en-IN` by default)
    - Live JSON preview of FIR object
    - PDF download functionality
    - BNS section prediction UI
    - Nearest police station detector (geolocation-based)
  - **State Management:** React `useState` hook
  - **Key Functions:**
    - `setAtPath()` — Nested path-based state updates
    - `getAtPath()` — Nested path-based state retrieval
    - `preparePayloadForSave()` — Normalization before DB save
    - `combineDateAndTime()` — Date/time formatting
    - `handlePredictSection()` — Trigger BNS prediction
    - `handleDownloadPdf()` — Trigger PDF generation
    - `NearestPoliceStation()` — Component for police finder
- **API Calls:** `src/api.js`
  - `saveFir(data)` → POST `/api/fir/save`
  - `getFirPdf(id)` → GET `/api/fir/:id/pdf_html`
  - `getNearestPoliceStation(lat, lng)` → POST `/api/nearest-police/nearest-police-station`
  - `predictSection(text)` → POST `/api/bns/predict-section`

---

### 3.2 Backend Layer

#### **A. Express Server (`backend/server.js`)**
- **Port:** 5000 (configurable via `PORT` env var)
- **Middleware:**
  - CORS (cross-origin requests)
  - Body parser (JSON, 5MB limit)
  - Mongoose connection (MongoDB)
- **Route Mounting:**
  ```javascript
  app.use("/api/fir", firRoutes);           // FIR save/fetch
  app.use("/api/fir", firPdfRoutes);        // PDF generation
  app.use("/api/llm", ollamaRoutes);        // LLM (Ollama)
  app.use("/api/nearest-police", nearestPoliceRoutes);
  app.use("/api/bns", bnsPredictRoutes);    // Section prediction
  ```

#### **B. API Routes (`backend/routes/`)**

**1. FIR Routes (`fir.js`)**
- `POST /api/fir/save` — Save FIR to MongoDB
  - Input: FIR object (from frontend)
  - Output: `{ ok: true, id: <mongo_id> }`
  - Uses Mongoose model `backend/models/Fir.js`
- `GET /api/fir/` — Fetch latest FIRs
  - Output: Array of FIR records (limited to 20)

**2. PDF Generation Routes (`fir_pdf.js`)**
- `GET /api/fir/:id/pdf_html` — Generate PDF from saved FIR
  - Uses `backend/utils/fir_pdf_html.js`
  - Returns: PDF buffer with `Content-Type: application/pdf`
  - Fallback: Legacy LaTeX-to-PDF logic (commented out)

**3. BNS Section Prediction (`bns_predict.js`)**
- `POST /api/bns/predict-section` — Predict legal sections
  - Input: `{ firstInformationContents: "..." }`
  - Process: Spawns Python subprocess (`predictt.py`)
  - Output: `{ sections: [{ section, title, confidence }, ...] }`
  - Python executable: Hardcoded to project virtualenv (Windows-specific path)

**4. Nearest Police Station (`nearest_police.js`)**
- `POST /api/nearest-police/nearest-police-station` — Find nearest police station
  - Input: `{ lat, lng }`
  - API: Google Places API (requires `GOOGLE_PLACES_API_KEY` env var)
  - Output: `{ name, address, location: { lat, lng } }`

**5. LLM Routes (`ollama.js` & `llm.js`)**
- **Ollama (`ollama.js`)** — Local LLM inference
  - `POST /api/llm/ask-llm` — Send prompt to local Ollama
  - Endpoint: `http://localhost:11434/api/generate` (configurable)
  - Normalizes response shapes (handles streaming, object, array responses)
  - Fallback: Return friendly error if Ollama unavailable
- **OpenAI (`llm.js`)** — Cloud-based LLM (optional)
  - `POST /api/llm/ask-llm` — Send messages to OpenAI GPT
  - Endpoint: `https://api.openai.com/v1/chat/completions`
  - Requires `OPENAI_API_KEY` env var

#### **C. Mongoose Model (`backend/models/Fir.js`)**
- **Schema Structure:**
  ```javascript
  {
    meta: {
      district, policeStation, year, firNo, firDateTime
    },
    section2: [{ sno, act, section }],
    occurrence: {
      day, dateFrom, dateTo, timePeriod, timeFrom, timeTo,
      infoReceivedAtPS: { date, time },
      gdRef: { entryNo, dateTime }
    },
    typeOfInfo,
    placeOfOccurrence: { directionDistanceFromPS, address, districtState },
    complainant: {
      name, fatherOrHusbandName, dob, nationality, uidNo, 
      passportNo, occupation, currentAddress, permanentAddress, phone, mobile
    },
    accused: [{ name, alias, relativeName, address }],
    delayReason,
    totalValueOfProperty,
    inquestReport,
    firstInformationContents,
    createdAt (auto-generated)
  }
  ```

---

### 3.3 Data Layer

#### **A. MongoDB**
- **Database:** `firdb` (default in `MONGO_URI` env var)
- **Collections:**
  - `firs` — Stores FIR documents
- **Connection:** Mongoose ORM via `mongoose.connect(MONGO_URI, ...)`

#### **B. Supabase (PostgreSQL)**
- **Schema:** `public.complaints` (for citizen-justice-hub)
  - Stores robbery/theft complaints with structure matching `Chatbot.tsx` state
  - Foreign key: `user_id` (links to auth user)
  - Columns: `complaint_id`, `name`, `mobile`, `email`, `age`, `gender`, `father_name`, `present_address`, `district`, `nearest_police_station_home`, `incident_location`, `stolen_items`, `robber_description`, `nearest_police_station_incident`, `incident_description`

---

### 3.4 ML/AI Layer

#### **A. BNS Section Prediction (`backend/predict.py` & `predictt.py`)**
- **Model:** Enhanced BERT for legal section classification
  - Model file: `backend/model/enhanced_legal_bert_model.pth` (PyTorch)
  - Multi-label classification of BNS (Bharatiya Nyaya Sanhita) sections
- **Process:**
  - Load tokenizer & model at runtime
  - Tokenize input text (firstInformationContents)
  - Get top-k predictions with confidence scores
  - Map predictions to section numbers & titles (via `bns_sections.json`)
  - Return as JSON to backend route
- **Input:** Text of FIR description
- **Output:** Predicted sections with IDs, titles, and confidence

#### **B. BNS Sections Mapping (`bns_sections.json` & `bns_multi_label_model/`)**
- `bns_sections.json` — Metadata for BNS sections (section number → title mapping)
- `bns_multi_label_model/` — Tokenizer & model artifacts
  - `config.json`, `tokenizer_config.json`, `tokenizer.json`, `vocab.txt` — BERT model files
  - `model.safetensors` — Model weights (HuggingFace format)

---

### 3.5 Utility & Template Layer

#### **A. PDF Generation Utilities (`backend/utils/fir_pdf_html.js`)**
- **Main Functions:**
  - `fillHtmlTemplate(fir)` — Replace placeholders in HTML template with FIR data
    - Handles nested paths (e.g., `complainant.name`)
    - Formats dates (YYYY-MM-DD)
    - Generates HTML tables for `section2` and `accused`
    - Outputs debug HTML to `backend/tmp/fir_debug.html`
  - `generateFirPdfHtml(fir)` — Render HTML → PDF using Puppeteer
    - Launches headless Chromium browser
    - Renders A4 page with background colors
    - Returns PDF buffer
    - Saves debug PDF to `backend/tmp/fir_debug.pdf`

#### **B. Templates**
- **HTML Template (`backend/templates/fir_template.html`)**
  - NCRB/FIR standard format
  - Bilingual labels (English + Devanagari/Marathi)
  - Placeholder structure:
    - Section 1: District, P.S., Year, FIR No., Date & Time
    - Section 2: Acts/Sections (table)
    - Section 3: Occurrence details
    - Section 4: Type of information
    - Section 5: Place of occurrence
    - Complainant details
    - Accused details
    - Other details (property value, FIR contents)
  - Font: `Noto Sans` (Unicode support for Devanagari)
- **LaTeX Template (`backend/templates/fir_template.tex`)**
  - Legacy format using XeLaTeX
  - Supports complex typesetting (if PDF generation switches to LaTeX)
  - Currently commented out in routes

---

## 4. Data Flow Diagrams

### 4.1 FIR Form Submission & Saving Flow

```
User Input (Voice/Text)
        ↓
   chat.jsx
        ├─ setAtPath() → Update state[question.key]
        ├─ extractInformation() → Validate input
        ├─ setAtPath() recursively → Build nested object
        └─ preparePayloadForSave() → Normalize payload
        ↓
API Call: saveFir(payload)
        ↓
   frontend/src/api.js
        └─ axios.post(/api/fir/save, payload)
        ↓
   backend/routes/fir.js
        ├─ new Fir(data)
        ├─ fir.save() → MongoDB
        └─ return { ok: true, id }
        ↓
   Frontend Updates
        ├─ setFirId(id)
        ├─ Display success message
        └─ Enable PDF download button
```

### 4.2 PDF Generation & Download Flow

```
User Action: Click "Download PDF"
        ↓
   chat.jsx handleDownloadPdf()
        ├─ Check if firId exists
        └─ Call getFirPdf(firId)
        ↓
   frontend/src/api.js
        └─ axios.get(/api/fir/:id/pdf_html, { responseType: 'blob' })
        ↓
   backend/routes/fir_pdf.js
        ├─ Fetch FIR from MongoDB by ID
        └─ Call generateFirPdfHtml(fir)
        ↓
   backend/utils/fir_pdf_html.js
        ├─ fillHtmlTemplate(fir) → Replace {{placeholders}}
        ├─ Launch Puppeteer browser
        ├─ page.setContent(html)
        ├─ page.pdf() → Generate PDF buffer
        └─ Return buffer
        ↓
   Backend Response
        ├─ Content-Type: application/pdf
        └─ Content-Disposition: attachment; filename=fir_<id>.pdf
        ↓
   Frontend
        ├─ Create Blob from response
        ├─ Create download anchor
        └─ Trigger browser download
```

### 4.3 Section Prediction Flow

```
User Input: firstInformationContents (FIR description)
        ↓
   chat.jsx handlePredictSection()
        └─ Call predictSection(sectionPredictText)
        ↓
   frontend/src/api.js
        └─ axios.post(/api/bns/predict-section, { firstInformationContents })
        ↓
   backend/routes/bns_predict.js
        ├─ spawn('python', ['predictt.py', text])
        ├─ Capture stdout → result
        └─ Parse JSON result
        ↓
   Python ML Process (predictt.py)
        ├─ Load BERT tokenizer & model
        ├─ Tokenize input text
        ├─ Forward pass → logits
        ├─ Top-k predictions
        ├─ Map to section titles (bns_sections.json)
        └─ Output JSON: { sections: [...] }
        ↓
   Backend Response
        └─ { sections: [{ section, title, confidence }, ...] }
        ↓
   Frontend
        └─ Display predicted sections in UI
```

### 4.4 Nearest Police Station Lookup Flow

```
User Action: Click "Detect Nearest Police Station"
        ↓
   chat.jsx NearestPoliceStation component
        ├─ navigator.geolocation.getCurrentPosition()
        ├─ Get user lat/lng
        └─ Call getNearestPoliceStation(lat, lng)
        ↓
   frontend/src/api.js
        └─ axios.post(/api/nearest-police/nearest-police-station, { lat, lng })
        ↓
   backend/routes/nearest_police.js
        ├─ Extract lat, lng from request
        ├─ Call Google Places API
        └─ URL: https://maps.googleapis.com/maps/api/place/nearbysearch/json?
               location=lat,lng&radius=5000&type=police&key=API_KEY
        ↓
   Google Places API Response
        ├─ returns: { results: [...stations...] }
        └─ Each station has: name, vicinity, geometry.location
        ↓
   Backend Processing
        ├─ Extract nearest (first) station
        └─ Return { name, address, location }
        ↓
   Frontend
        └─ Display police station details
```

---

## 5. Deployment Architecture

### 5.1 Environment Configuration

**Backend Environment Variables (`.env`)**
```
MONGO_URI=mongodb://localhost:27017/firdb
GOOGLE_PLACES_API_KEY=<your_api_key>
OPENAI_API_KEY=<optional_openai_key>
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:3b
PORT=5000
```

**Frontend Environment Variables (`.env` for Vite)**
```
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=<your_supabase_url>
VITE_SUPABASE_ANON_KEY=<your_supabase_key>
```

### 5.2 Deployment Stack

| Component | Technology | Port | Status |
|-----------|-----------|------|--------|
| Frontend (Citizen Hub) | React + Vite | 3000 | Served via `npm run dev` |
| FIR Form UI | React | Embedded in Citizen Hub | - |
| Backend API | Node.js + Express | 5000 | HTTP |
| Database | MongoDB | 27017 | Local or Atlas |
| Auth | Supabase | Cloud | Managed |
| ML Model Serving | Python (subprocess) | On-demand | Spawned per request |
| Ollama (Optional) | Docker container | 11434 | Optional local LLM |

### 5.3 External Dependencies

| Service | Purpose | Configuration |
|---------|---------|----------------|
| Google Places API | Nearest police station lookup | API key in `.env` |
| OpenAI API (Optional) | LLM completions | API key in `.env` (optional) |
| Supabase | Authentication & complaint DB | Managed cloud service |
| MongoDB | FIR document storage | `MONGO_URI` in `.env` |
| Ollama (Optional) | Local LLM inference | Running on `localhost:11434` |

---

## 6. Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React + TypeScript | UI framework |
| | Vite | Build tool & dev server |
| | Tailwind CSS | Styling |
| | Supabase Client | Auth & DB |
| | Axios | HTTP client |
| | Web Speech API | Voice input |
| **Backend** | Node.js + Express | REST API server |
| | Mongoose | MongoDB ORM |
| | Puppeteer | PDF generation |
| | Axios | HTTP requests |
| | dotenv | Environment config |
| **Database** | MongoDB | Primary data store (FIRs) |
| | PostgreSQL (Supabase) | Auth & complaints |
| **ML/AI** | Python | ML model runtime |
| | PyTorch | Neural network inference |
| | HuggingFace Transformers | BERT model |
| **External APIs** | Google Places API | Police station geolocation |
| | OpenAI / Ollama | LLM completions |

---

## 7. Security & Considerations

### 7.1 Authentication & Authorization
- **Frontend:** Supabase Auth (JWT tokens)
- **Backend:** No explicit auth guards on public FIR routes (consider adding)
- **Recommendation:** Add middleware to validate JWT on protected endpoints

### 7.2 Data Privacy
- **Sensitive Data:** FIRs contain personal information (names, addresses, phone numbers)
- **Encryption:** Consider encrypting sensitive fields at rest (MongoDB)
- **HTTPS:** Enforce TLS/SSL in production
- **API Rate Limiting:** Implement to prevent abuse of prediction/LLM endpoints

### 7.3 Input Validation & Sanitization
- **Frontend:** Basic regex validation (mobile, email, age)
- **Backend:** Mongoose schema provides type validation; consider additional XSS/injection protection
- **LLM Prompt Injection:** Sanitize user inputs before sending to LLM endpoints

### 7.4 Error Handling
- **Graceful Fallbacks:** PDF generation errors return 500 with message
- **Logging:** Add structured logging for debugging production issues
- **Exception Handling:** Wrap ML model loads and external API calls in try-catch

---

## 8. Scalability & Performance Notes

### 8.1 Current Bottlenecks
1. **Python Model Loading:** `predictt.py` loads BERT model on every request (slow)
   - **Fix:** Deploy as microservice with persistent model in memory
2. **PDF Generation:** Puppeteer launches browser per request (memory-intensive)
   - **Fix:** Implement request queuing or use serverless functions
3. **Google Places API:** Rate-limited; consider caching results
4. **MongoDB Indexing:** Ensure indexes on frequently-queried fields (e.g., `createdAt`, `user_id`)

### 8.2 Optimization Strategies
- Implement caching (Redis) for section prediction results
- Use async job queues (Bull/BullMQ) for PDF generation
- Containerize ML services (Docker) for easier scaling
- Implement CDN for static assets (HTML templates, CSS)
- Database query optimization & connection pooling

---

## 9. File Structure Overview

```
fir_chatbot_project/
├── citizen-justice-hub-main/         # Main polished UI (Vite + React + TS)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Chatbot.tsx          # Conversational FIR assistant
│   │   │   ├── Form.tsx             # FIR form wrapper
│   │   │   ├── Index.tsx, Login.tsx, Signup.tsx
│   │   ├── components/
│   │   │   ├── Navigation.tsx
│   │   │   └── ui/                  # Reusable UI components
│   │   ├── integrations/
│   │   │   └── supabase/            # Supabase client
│   │   ├── hooks/
│   │   └── lib/
│   ├── supabase/migrations/         # Database migrations
│   └── package.json
│
├── frontend/                         # Legacy React UI
│   ├── src/
│   │   ├── components/
│   │   │   ├── chat.jsx             # Main FIR form component
│   │   │   └── ChatForm.jsx
│   │   ├── api.js                   # API client
│   │   └── main.jsx
│   └── package.json
│
├── backend/                          # Node.js + Express backend
│   ├── server.js                    # Express app entry point
│   ├── routes/
│   │   ├── fir.js                   # FIR CRUD
│   │   ├── fir_pdf.js               # PDF generation
│   │   ├── bns_predict.js           # Section prediction
│   │   ├── nearest_police.js        # Police station lookup
│   │   ├── ollama.js                # LLM inference
│   │   └── llm.js                   # OpenAI proxy
│   ├── models/
│   │   └── Fir.js                   # Mongoose schema
│   ├── utils/
│   │   └── fir_pdf_html.js          # PDF utility
│   ├── templates/
│   │   ├── fir_template.html        # HTML template
│   │   └── fir_template.tex         # LaTeX template (legacy)
│   ├── predict.py / predictt.py     # ML inference scripts
│   ├── model/
│   │   └── enhanced_legal_bert_model.pth  # PyTorch model
│   ├── tmp/                         # Debug outputs
│   └── package.json
│
├── bns_multi_label_model/           # BERT model artifacts
│   ├── config.json
│   ├── tokenizer_config.json
│   ├── tokenizer.json
│   ├── vocab.txt
│   └── model.safetensors
│
├── env/                             # Python virtual environment
│   ├── Scripts/
│   └── Lib/site-packages/           # Python dependencies
│
├── bns_sections.json                # BNS section metadata
├── index.html                       # Static HTML entry
├── package.json                     # Root package (if monorepo)
└── README.md
```

---

## 10. API Endpoints Reference

| Method | Endpoint | Description | Input | Output |
|--------|----------|-------------|-------|--------|
| POST | `/api/fir/save` | Save FIR to DB | FIR object | `{ ok, id }` |
| GET | `/api/fir/` | Fetch latest FIRs | - | FIR array |
| GET | `/api/fir/:id/pdf_html` | Generate PDF | FIR ID | PDF blob |
| POST | `/api/bns/predict-section` | Predict BNS sections | `{ firstInformationContents }` | `{ sections }` |
| POST | `/api/nearest-police/nearest-police-station` | Find nearest police | `{ lat, lng }` | `{ name, address, location }` |
| POST | `/api/llm/ask-llm` | LLM inference (Ollama) | `{ prompt, model }` | `{ text }` |
| POST | `/api/llm/transcribe` | Audio transcription | form-data (file) | `{ text }` (stub) |

---

## 11. Multilingual Support

- **UI Labels:** Bilingual (English + Devanagari/Marathi) embedded in question labels
- **Voice Input:** Web Speech API with `lang="en-IN"` (supports Indian English)
- **PDF Rendering:** `Noto Sans` font family for Devanagari character support
- **LLM Support:** Ollama/OpenAI endpoints can process multilingual prompts
- **Future:** Integrate i18n library (e.g., `react-i18next`) for runtime language switching

---

## 12. Workflow Diagram (User Perspective)

```
┌─────────────┐
│   Sign Up   │ (Supabase Auth)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Login     │
└──────┬──────┘
       │
       ▼
┌──────────────────────────────┐
│  FIR Form / Chat Assistant   │
├──────────────────────────────┤
│ 1. Answer questions (voice   │
│    or text input)            │
│ 2. Review live JSON preview  │
│ 3. Predict BNS sections      │
│ 4. Detect nearest police     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Save FIR to Database        │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  Generate & Download PDF     │
└──────┬───────────────────────┘
       │
       ▼
┌──────────────────────────────┐
│  File Another Complaint?     │
│  Yes → Loop back             │
│  No → Exit                   │
└──────────────────────────────┘
```

---

## 13. Future Enhancements

1. **Microservices Architecture:** Split ML, PDF, and API into separate services
2. **Real-time Collaboration:** WebSocket support for police officer review
3. **Advanced Analytics:** Dashboard for complaint statistics and trends
4. **Mobile App:** React Native or Flutter version
5. **Offline Support:** Progressive Web App (PWA) with service workers
6. **Multi-language UI:** Dynamic language switching via i18n
7. **Advanced ML:** Fine-tune BNS model with more training data; multi-class hierarchical classification
8. **Blockchain Integration:** Immutable FIR records using Ethereum/Polygon

---

## 14. Conclusion

The FIR Chatbot Project is a well-structured, full-stack application combining React frontends, Node.js/Express backend, MongoDB database, ML model serving, and external API integrations. The architecture supports voice and text input, AI-powered legal section suggestion, PDF export, and location-based police station discovery. Future scaling will require microservice containerization, caching layers, and async job processing.

