import React, { useEffect, useState, useRef } from "react";
import { saveFir, predictSection, getFirPdf /*, askLLM */ } from "../api"; 

// Minimal FIR question list based on your provided content
const QUESTIONS = [
  { key: "meta.district", label: "District (जिल्हा)", default: "Brihanmumbai City" },
  { key: "meta.policeStation", label: "P.S. (पोलीस ठाणे)", default: "Agripada" },
  { key: "meta.year", label: "Year (वर्ष)", default: 2025 },
  { key: "meta.firNo", label: "FIR No. (प्रथम खबर क्र.)", default: "0498" },
  { key: "meta.firDateTime", label: "Date and Time of FIR (प्र. ख. दिनांक आणि वेळ)", default: "2025-10-06T20:04:00" },

  // Occurrence
  { key: "occurrence.day", label: "Occurrence Day", default: "Monday" },
  { key: "occurrence.dateFrom", label: "Date from", default: "2025-10-06" },
  { key: "occurrence.dateTo", label: "Date to", default: "2025-10-06" },
  { key: "occurrence.timeFrom", label: "Time from", default: "18:00" },
  { key: "occurrence.timeTo", label: "Time to", default: "18:10" },
  { key: "occurrence.infoReceivedAtPS.date", label: "Info received at PS - Date", default: "2025-10-06" },
  { key: "occurrence.infoReceivedAtPS.time", label: "Info received at PS - Time", default: "20:04" },

  { key: "typeOfInfo", label: "Type of Information", default: "Oral" },

  // Place
  { key: "placeOfOccurrence.directionDistanceFromPS", label: "Direction & distance from P.S.", default: "Southwest, 1 km" },
  { key: "placeOfOccurrence.address", label: "Address", default: "Dhobighat Gate Number 04, Dr. E Moses Road, Saat Rasta, Mumbai" },

  // Complainant
  { key: "complainant.name", label: "Complainant Name", default: "Nasir Nazir Shaikh" },
  { key: "complainant.currentAddress", label: "Current Address", default: "203, Sector 11, Ambar Apartment, Juhugaon, Vashi, Navi Mumbai, Maharashtra, India" },
  { key: "complainant.permanentAddress", label: "Permanent Address", default: "203, Sector 11, Ambar Apartment, Juhugaon, Vashi, Navi Mumbai, Maharashtra, India" },

  // Accused
  { key: "accused.0.name", label: "Accused #1 Name", default: "Mayuresh Milind Nyaynirgune" },
  { key: "totalValueOfProperty", label: "Total value of property (In Rs/-)", default: 1900 },
  { key: "firstInformationContents", label: "First Information contents", default: "" }
];

// Improved setAtPath with robust parent traversal and mixed array/object handling
function setAtPath(obj, path, value) {
  const parts = path.split(".");
  let cur = obj;

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    const isLast = i === parts.length - 1;
    const isIndex = /^\d+$/.test(p);
    const next = parts[i + 1];
    const nextIsIndex = next !== undefined && /^\d+$/.test(next);

    if (isIndex) {
      const idx = parseInt(p, 10);

      // If cur is not an array, try to convert/create it on the parent
      if (!Array.isArray(cur)) {
        // find parent and replace reference with array if possible
        let parent = obj;
        for (let j = 0; j < i - 1; j++) {
          const part = parts[j];
          if (Array.isArray(parent) && /^\d+$/.test(part)) parent = parent[parseInt(part, 10)];
          else parent = parent ? parent[part] : undefined;
        }
        const parentKey = parts[i - 1];
        if (parent && parentKey !== undefined) {
          if (!Array.isArray(parent[parentKey])) parent[parentKey] = [];
          cur = parent[parentKey];
        } else {
          // fallback: if root isn't an object, create array root
          // eslint-disable-next-line no-param-reassign
          obj = [];
          cur = obj;
        }
      }

      // ensure index exists
      if (isLast) {
        cur[idx] = value;
        return;
      } else {
        while (cur.length <= idx) {
          cur.push(nextIsIndex ? [] : {});
        }
        cur = cur[idx];
      }
    } else {
      // object key
      if (isLast) {
        cur[p] = value;
        return;
      }

      if (cur[p] === undefined || cur[p] === null) {
        cur[p] = nextIsIndex ? [] : {};
      } else {
        // if existing type mismatches expected, convert
        if (nextIsIndex && !Array.isArray(cur[p])) cur[p] = [];
        if (!nextIsIndex && Array.isArray(cur[p])) cur[p] = {};
      }

      cur = cur[p];
    }
  }
}

function getAtPath(obj, path) {
  return path.split('.').reduce((acc, p) => (acc ? acc[p] : undefined), obj);
}

// Helper: combine date and time (date in YYYY-MM-DD, time in HH:mm or HH:mm:ss)
function combineDateAndTime(dateStr, timeStr) {
  if (!dateStr && !timeStr) return null;
  if (dateStr && dateStr.includes("T")) return new Date(dateStr).toISOString();
  if (!dateStr && timeStr) return null; // insufficient data
  const time = timeStr && timeStr.length === 5 ? `${timeStr}:00` : (timeStr || "00:00:00");
  const iso = `${dateStr}T${time}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function preparePayloadForSave(state) {
  const p = JSON.parse(JSON.stringify(state || {}));

  // Helper to ensure array fields are valid arrays or empty arrays
  const ensureValidArray = (field, defaultItem = {}) => {
    try {
      // If it's already an array, keep it
      if (Array.isArray(field)) return field;
      
      // If it's a string that looks like an array/object, try to parse it
      if (typeof field === 'string') {
        try {
          const parsed = JSON.parse(field.replace(/'/g, '"')); // handle single quotes
          return Array.isArray(parsed) ? parsed : [defaultItem];
        } catch (e) {
          return [defaultItem]; // if parse fails, return default
        }
      }
      
      // If it's an object, wrap in array
      if (typeof field === 'object' && field !== null) {
        return [field];
      }
      
      // Default to empty array
      return [];
    } catch (e) {
      console.warn('Error processing array field:', e);
      return []; // fail safe to empty array
    }
  };

  p.section2 = ensureValidArray(p.section2, {
    sno: 1,
    act: '',
    section: ''
  });

  // meta
  if (p.meta) {
    if (p.meta.year !== undefined) {
      const year = Number(p.meta.year);
      p.meta.year = isNaN(year) ? null : year;
    }

    if (p.occurrence && p.occurrence.dateFrom && p.occurrence.timeFrom && (!p.meta.firDateTime || String(p.meta.firDateTime).length < 6)) {
      const combined = combineDateAndTime(p.occurrence.dateFrom, p.occurrence.timeFrom);
      if (combined) p.meta.firDateTime = combined;
    } else if (p.meta.firDateTime) {
      const dt = new Date(p.meta.firDateTime);
      if (!isNaN(dt.getTime())) p.meta.firDateTime = dt.toISOString();
    }
  }

  // occurrence dates - set to null if invalid
  if (p.occurrence) {
    ['dateFrom', 'dateTo'].forEach(field => {
      if (p.occurrence[field]) {
        const d = new Date(p.occurrence[field]);
        p.occurrence[field] = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
      }
    });

    if (p.occurrence.infoReceivedAtPS?.date) {
      const d = new Date(p.occurrence.infoReceivedAtPS.date);
      p.occurrence.infoReceivedAtPS.date = !isNaN(d.getTime()) ? d.toISOString().split('T')[0] : null;
    }

    if (p.occurrence.gdRef?.dateTime) {
      const d = new Date(p.occurrence.gdRef.dateTime);
      p.occurrence.gdRef.dateTime = !isNaN(d.getTime()) ? d.toISOString() : null;
    }
  }



  // Total value - default to 0 if invalid
  p.totalValueOfProperty = p.totalValueOfProperty !== undefined ? Number(p.totalValueOfProperty) || 0 : 0;

  // Clean up section2 numbers
  if (p.section2?.length) {
    p.section2 = p.section2.map(it => ({
      ...it,
      sno: it?.sno !== undefined ? Number(it.sno) || 1 : 1
    })).filter(it => it.act || it.section); // remove empty items
  }

  return p;
}

export default function ChatForm() {
  // Section prediction handler (enhanced)
  const handlePredictSection = async () => {
    setSectionPredictLoading(true);
    setSectionPredictResult("");
    setSectionPredictError("");
    try {
      // Use new API function
      const data = await predictSection(sectionPredictText);
      if (data.error) throw new Error(data.error);
      // Show only section number and title, styled as a list
      if (Array.isArray(data.sections) && data.sections.length > 0) {
        setSectionPredictResult(
          <div>
            <strong>Predicted Section(s):</strong>
            <ol style={{ marginTop: 8, marginBottom: 8 }}>
              {data.sections.map((s, i) => (
                <li key={i}>
                  <span style={{ fontWeight: 500 }}>Section {s.section}:</span> {s.title}
                </li>
              ))}
            </ol>
          </div>
        );
      } else {
        setSectionPredictResult("No section predicted");
      }
    } catch (err) {
      setSectionPredictError("Prediction error: " + (err.message || "Unknown error"));
    }
    setSectionPredictLoading(false);
  };
  const [state, setState] = useState({});
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const [firId, setFirId] = useState(null);
  // Section prediction input defaults to FIR state value
  const [sectionPredictText, setSectionPredictText] = useState("");
  const [sectionPredictResult, setSectionPredictResult] = useState("");
  const [sectionPredictLoading, setSectionPredictLoading] = useState(false);
  const [sectionPredictError, setSectionPredictError] = useState("");
  const recognitionRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(() => {
    // initialize defaults
    const s = {};
    QUESTIONS.forEach(q => {
      if (q.default !== undefined && q.default !== "") {
        setAtPath(s, q.key, q.default);
      }
    });
    setState(s);
  }, []);

  useEffect(() => {
    // init Web Speech API
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        setText(transcript);
        setStatus("Recognized: " + transcript);
        setListening(false);
      };
      rec.onend = () => setListening(false);
      rec.onerror = (e) => {
        console.error("SR error", e);
        setStatus("Speech recognition error: " + e.error);
        setListening(false);
      };
      recognitionRef.current = rec;
    } else {
      recognitionRef.current = null;
      setStatus("SpeechRecognition not supported in this browser. Use typing.");
    }
  }, []);

  useEffect(() => {
    const p = Math.round(((index) / QUESTIONS.length) * 100);
    if (progressRef.current) progressRef.current.style.width = p + "%";
  }, [index]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus("SpeechRecognition not available in this browser.");
      return;
    }
    try {
      recognitionRef.current.start();
      setListening(true);
      setStatus("Listening...");
    } catch (err) {
      console.error(err);
      setStatus("Error starting microphone: " + err.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  const handleSubmitAnswer = async () => {
    const q = QUESTIONS[index];
    const val = text.trim();
    if (val === "") {
      setStatus("Please enter an answer (voice or text).");
      return;
    }
    // set value into state path
    const newState = JSON.parse(JSON.stringify(state || {}));
    setAtPath(newState, q.key, val);
    setState(newState);
    setText("");
    setStatus("");
    // move next
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else setIndex(QUESTIONS.length);

    // optional LLM sanity-check
    try {
      const llmResp = await askLLM({ messages: [{ role: "user", content: `validate: ${q.label} -> ${val}` }] });
      console.log('LLM validation', llmResp);
    } catch (e) {
      console.warn('LLM check failed', e);
    }
  };

  const handleSkip = () => {
    // Move to next question without setting a value
    if (index < QUESTIONS.length - 1) setIndex(index + 1);
    else setIndex(QUESTIONS.length);
    setText("");
    setStatus("Skipped");
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleSave = async () => {
    try {
      setStatus("Preparing payload...");
      const payload = preparePayloadForSave(state);
      setStatus("Saving to database...");
      const resp = await saveFir(payload);
      setStatus("Saved! ID: " + resp.id);
      setFirId(resp.id);
    } catch (err) {
      console.error(err);
      setStatus("Save error: " + (err?.response?.data?.error || err.message));
    }
  };
  // Sync prediction input with FIR state
  useEffect(() => {
    setSectionPredictText(getAtPath(state, "firstInformationContents") || "");
  }, [state]);

  const handleDownloadPdf = async () => {
    if (!firId) {
      setStatus("Please save FIR first.");
      return;
    }
    setStatus("Generating PDF...");
    try {
      console.log("Requesting FIR PDF for", firId); 
      const response = await getFirPdf(firId); 
      const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" })); 
      const link = document.createElement("a"); 
      link.href = url; 
      link.setAttribute("download", `FIR_${firId}.pdf`); 
      document.body.appendChild(link); 
      link.click(); 
      link.remove(); 
      setStatus("PDF generated and downloaded."); 
    } catch (err) {
      setStatus("PDF generation failed: " + (err?.response?.data || err.message));
    }
  };

  const currentQ = QUESTIONS[index];

  return (
    <div style={{display:'flex', gap:20}}>
      <div style={{flex:1}}>
        <div className="question-card" style={{padding:16, border:'1px solid #e6eef8', borderRadius:8}}>
          <div className="small">Question {Math.min(index+1, QUESTIONS.length)} / {QUESTIONS.length}</div>
          <h2>{currentQ ? currentQ.label : "All questions complete"}</h2>
          {currentQ && (
            <>
              <div className="small">Current value (from defaults / previous): {String(getAtPath(state, currentQ.key) ?? "")}</div>

              <div style={{marginTop:10}}>
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your answer or press mic and speak"
                  style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #e6eef8"}}
                />
                <div className="controls" style={{marginTop:8, display:'flex', gap:8}}>
                  <button className="button" onClick={listening ? stopListening : startListening}>
                    {listening ? "Stop mic" : "Start mic"}
                  </button>
                  <button className="button secondary" onClick={handleSubmitAnswer}>Submit Answer</button>
                  <button className="button secondary" onClick={handleSkip}>Skip</button>
                  <button className="button secondary" onClick={handleBack}>Back</button>
                </div>
                <div className="small" style={{marginTop:8}}>{status}</div>
              </div>
            </>
          )}

          {!currentQ && (
            <div>
              <div className="small">All questions asked. You can review below and submit to DB.</div>
              <div className="controls" style={{marginTop:12}}>
                <button className="button" onClick={handleSave}>Save to MongoDB</button>
              </div>
            </div>
          )}

          <div className="progress" style={{marginTop:12, height:8, background:'#f0f4fb', borderRadius:4}}>
            <div ref={progressRef} style={{width: `${Math.round((index/QUESTIONS.length)*100)}%`, height:'100%', background:'#bfe0ff', borderRadius:4}}></div>
          </div>
        </div>
        {/* Persistent PDF download section */}
        <div className="pdf-download" style={{marginTop:24, padding:16, border:'1px solid #e6eef8', borderRadius:8, background:'#f8f9fb'}}>
          <h3>Download FIR PDF</h3>
          <div className="small">You can download/print the FIR PDF for the last saved FIR at any time.</div>
          <button className="button" onClick={handleDownloadPdf} disabled={!firId}>Download/Print FIR PDF</button>
          {!firId && <div className="small" style={{color:'#888', marginTop:8}}>Save a FIR first to enable PDF download.</div>}
        </div>
        {/* Section prediction feature (always visible below PDF download) */}
        <div className="section-predict" style={{marginTop:24, padding:16, border:'1px solid #e6eef8', borderRadius:8, background:'#f8f9fb'}}>
          <h3>Predict Section Number (BNS)</h3>
          <div className="small">Enter the first information contents below to predict the relevant BNS section number(s).</div>
          <input
            type="text"
            value={sectionPredictText}
            onChange={e => setSectionPredictText(e.target.value)}
            placeholder="Type firstInformationContents here..."
            style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #e6eef8", marginTop:8}}
          />
          <button className="button" style={{marginTop:8}} onClick={handlePredictSection} disabled={!sectionPredictText.trim()}>Predict Section</button>
          {sectionPredictLoading && <div className="small" style={{marginTop:8}}>Predicting...</div>}
          {sectionPredictResult && (
            <div className="small" style={{marginTop:8}}>
              <b>Predicted Section(s):</b> {sectionPredictResult}
            </div>
          )}
          {sectionPredictError && <div className="small" style={{marginTop:8, color:"red"}}>{sectionPredictError}</div>}
        </div>
      </div>

      <div className="preview" style={{flex:1}}>
        <h3>Preview — Current FIR object (editable via steps)</h3>
        <pre style={{whiteSpace:"pre-wrap", fontSize:13, background:'#f8f9fb', padding:12, borderRadius:8}}>{JSON.stringify(state, null, 2)}</pre>
      </div>
    </div>
  );
}
