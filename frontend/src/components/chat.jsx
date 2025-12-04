import React, { useEffect, useState, useRef, createContext, useContext } from "react";
import { saveFir, predictSection, getFirPdf, getNearestPoliceStation /*, askLLM */ } from "../api";

// Navbar component
// function Navbar({ theme, setTheme }) {
//   return (
//     <nav style={{
//       background: theme === "dark" ? "#1a1d24" : "#fff",
//       borderBottom: `1px solid ${theme === "dark" ? "#2c313a" : "#e6eef8"}`,
//       padding: "0 20px",
//       position: "sticky",
//       top: 0,
//       zIndex: 100,
//       boxShadow: theme === "dark" ? "0 2px 8px rgba(0,0,0,0.3)" : "0 2px 8px rgba(0,0,0,0.05)",
//       transition: "background 0.3s, border-color 0.3s"
//     }}>
//       <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", height: 64 }}>
//         {/* Logo + Title */}
//         <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
//           <div style={{
//             width: 32, height: 32, background: "linear-gradient(135deg, #1976d2, #0d47a1)",
//             borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
//             color: "#fff", fontWeight: 700, fontSize: 18
//           }}>
//             📋
//           </div>
//           <div>
//             <div style={{ fontWeight: 700, fontSize: 18, color: theme === "dark" ? "#bfe0ff" : "#1976d2" }}>FIR System</div>
//             <div style={{ fontSize: 12, color: theme === "dark" ? "#888" : "#999" }}>Digital Generation</div>
//           </div>
//         </div>

//         {/* Nav Links */}
//         <div style={{ display: "flex", gap: 32, alignItems: "center" }}>
//           <a href="#" style={{ textDecoration: "none", fontWeight: 500, color: theme === "dark" ? "#bfe0ff" : "#222", fontSize: 14 }}>Home</a>
//           <a href="#" style={{ textDecoration: "none", fontWeight: 500, color: theme === "dark" ? "#bfe0ff" : "#222", fontSize: 14 }}>About</a>
//           <a href="#" style={{ textDecoration: "none", fontWeight: 500, color: theme === "dark" ? "#bfe0ff" : "#222", fontSize: 14 }}>Contact</a>
//         </div>

//         {/* Theme Toggle + Auth */}
//         <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
//           <button
//             onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//             style={{
//               background: theme === "dark" ? "#23272f" : "#f0f7ff",
//               color: theme === "dark" ? "#bfe0ff" : "#1976d2",
//               border: "none", borderRadius: 8, padding: "8px 12px", fontWeight: 600,
//               cursor: "pointer", fontSize: 13, transition: "all 0.2s"
//             }}
//           >
//             {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
//           </button>
//           <button style={{
//             background: theme === "dark" ? "#e6e6e6" : "#f0f0f0",
//             color: "#222", border: "none", borderRadius: 8, padding: "8px 16px",
//             fontWeight: 600, cursor: "pointer", fontSize: 13
//           }}>
//             Login
//           </button>
//           <button style={{
//             background: "#1976d2", color: "#fff", border: "none", borderRadius: 8,
//             padding: "8px 16px", fontWeight: 600, cursor: "pointer", fontSize: 13
//           }}>
//             Register
//           </button>
//         </div>
//       </div>
//     </nav>
//   );
// }

// Nearest Police Station component
function NearestPoliceStation() {
  const [location, setLocation] = useState(null);
  const [station, setStation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDetect = () => {
    setLoading(true);
    setError("");
    setStation(null);
    if (!navigator.geolocation) {
      setError("Geolocation is not supported by your browser.");
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        getNearestPoliceStation(latitude, longitude)
          .then(result => {
            setStation(result);
            setLoading(false);
          })
          .catch(err => {
            setError("Could not find police station: " + (err?.response?.data?.error || err.message));
            setLoading(false);
          });
      },
      (err) => {
        setError("Location error: " + err.message);
        setLoading(false);
      }
    );
  };

  return (
    <div className="nearest-police" style={{marginTop:24, padding:16, border:'1px solid #1e1f20ff', borderRadius:8, background:'#f8f9fb'}}>
      <h3>Detect Nearest Police Station</h3>
      <button className="button" onClick={handleDetect} disabled={loading} style={{marginTop:8}}>
        {loading ? "Detecting..." : "Detect Nearest Police Station"}
      </button>
      {error && <div className="small" style={{marginTop:8, color:"red"}}>{error}</div>}
      {station && (
        <div className="small" style={{marginTop:8}}>
          <b>Nearest Police Station:</b><br />
          <span>{station.name}</span><br />
          <span>{station.address}</span>
        </div>
      )}
    </div>
  );
}

// Minimal FIR question list based on your provided content
const QUESTIONS = [
  { key: "meta.district", label: "District (जिल्हा)", default: "Brihanmumbai City" },
  { key: "meta.policeStation", label: "P.S. (पोलीस ठाणे)", default: "Agripada" },
  { key: "meta.year", label: "Year (वर्ष)", default: 2025 },

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

// Dark mode context
const ThemeContext = createContext();

function useTheme() {
  return useContext(ThemeContext);
}

// Theme toggle integrated into Navbar component

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
  // Theme state
  const [theme, setTheme] = useState(() => window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  useEffect(() => {
    document.body.style.background = theme === "dark" ? "#181a1b" : "#f6f8fa";
    document.body.style.color = theme === "dark" ? "#e6e6e6" : "#222";
  }, [theme]);

  // Inject responsive CSS once
  useEffect(() => {
    if (document.getElementById('chat-responsive-styles')) return;
    const css = `
      .chat-grid {
        display: grid;
        grid-template-columns: 1fr 380px;
        gap: 24px;
        width: 100%;
        box-sizing: border-box;
        padding: 0 16px;
      }
      @media (max-width: 960px) {
        .chat-grid { grid-template-columns: 1fr; padding: 0 12px; }
      }
      .chat-side { position: sticky; top: 20px; align-self: start; }
      .preview-box { white-space: pre-wrap; font-size: 13px; padding: 12px; border-radius: 8px; }
    `;
    const style = document.createElement('style');
    style.id = 'chat-responsive-styles';
    style.appendChild(document.createTextNode(css));
    document.head.appendChild(style);
  }, []);
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
  const [previewHtml, setPreviewHtml] = useState("");
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

  // Build FIR HTML preview from state
  function buildFirHtml(data) {
    const safe = (p) => (p !== undefined && p !== null) ? String(p) : "";
    const district = safe(getAtPath(data, 'meta.district')) || '---';
    const ps = safe(getAtPath(data, 'meta.policeStation')) || '---';
    const year = safe(getAtPath(data, 'meta.year')) || new Date().getFullYear();
    const day = safe(getAtPath(data, 'occurrence.day'));
    const dateFrom = safe(getAtPath(data, 'occurrence.dateFrom'));
    const dateTo = safe(getAtPath(data, 'occurrence.dateTo'));
    const timeFrom = safe(getAtPath(data, 'occurrence.timeFrom'));
    const timeTo = safe(getAtPath(data, 'occurrence.timeTo'));
    const infoDate = safe(getAtPath(data, 'occurrence.infoReceivedAtPS.date'));
    const infoTime = safe(getAtPath(data, 'occurrence.infoReceivedAtPS.time'));
    const typeOfInfo = safe(getAtPath(data, 'typeOfInfo'));
    const direction = safe(getAtPath(data, 'placeOfOccurrence.directionDistanceFromPS'));
    const address = safe(getAtPath(data, 'placeOfOccurrence.address'));
    const complainant = safe(getAtPath(data, 'complainant.name'));
    const currentAddress = safe(getAtPath(data, 'complainant.currentAddress'));
    const permanentAddress = safe(getAtPath(data, 'complainant.permanentAddress'));
    const totalValue = safe(data.totalValueOfProperty || getAtPath(data, 'totalValueOfProperty'));
    const firstInfo = safe(getAtPath(data, 'firstInformationContents'));

    return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>FIR Preview</title><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{font-family:Arial,Helvetica,sans-serif;color:#222;background:#fff;padding:18px} .fir-container{max-width:900px;margin:0 auto;border:1px solid #e6e6e6;padding:20px;border-radius:8px} h1,h2,h3{margin:6px 0} .section-title{background:#f6f9ff;padding:8px;border-radius:6px;margin-top:14px;font-weight:700} .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:8px}.col{flex:1;min-width:140px}.label{font-weight:700}.small{font-size:13px;color:#555}</style></head><body><div class="fir-container"><h2>N.C.R.B</h2><h1>FIRST INFORMATION REPORT</h1><div class="section-title">1. District / P.S. / Year</div><div class="row"><div class="col"><div class="label">District:</div><div>${district}</div></div><div class="col"><div class="label">P.S.:</div><div>${ps}</div></div><div class="col"><div class="label">Year:</div><div>${year}</div></div></div><div class="section-title">3. Occurrence of Offence</div><div class="row"><div class="col"><div class="label">Day:</div><div>${day}</div></div><div class="col"><div class="label">Date From:</div><div>${dateFrom}</div></div><div class="col"><div class="label">Date To:</div><div>${dateTo}</div></div></div><div class="row"><div class="col"><div class="label">Time From:</div><div>${timeFrom}</div></div><div class="col"><div class="label">Time To:</div><div>${timeTo}</div></div><div class="col"><div class="label">Info Received Date:</div><div>${infoDate}</div></div><div class="col"><div class="label">Info Received Time:</div><div>${infoTime}</div></div></div><div class="section-title">4. Type of Information</div><div class="row"><div class="col">${typeOfInfo}</div></div><div class="section-title">5. Place of Occurrence</div><div class="row"><div class="col"><div class="label">Direction & Distance:</div><div>${direction}</div></div><div class="col"><div class="label">Address:</div><div>${address}</div></div></div><div class="section-title">Complainant / Informant</div><div class="row"><div class="col"><div class="label">Name:</div><div>${complainant}</div></div><div class="col"><div class="label">Current Address:</div><div>${currentAddress}</div></div><div class="col"><div class="label">Permanent Address:</div><div>${permanentAddress}</div></div></div><div class="section-title">Other Details</div><div class="row"><div class="col"><div class="label">Total Value of Property:</div><div>${totalValue}</div></div></div><div class="row" style="margin-top:12px"><div class="col"><div class="label">First Information Contents:</div><div>${firstInfo}</div></div></div></div></body></html>`;
  }

  // Update preview when state changes
  useEffect(() => {
    try {
      const html = buildFirHtml(state || {});
      setPreviewHtml(html);
    } catch (e) {
      console.warn('Failed to build preview HTML', e);
    }
  }, [state]);

  const [selectedLanguage, setSelectedLanguage] = useState("en-IN");
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlayingConfirmation, setIsPlayingConfirmation] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Language options for voice input
  const languageOptions = [
    { code: "en-IN", name: "English (India)" },
    { code: "hi-IN", name: "Hindi (हिंदी)" },
    { code: "mr-IN", name: "Marathi (मराठी)" },
    { code: "gu-IN", name: "Gujarati (ગુજરાતી)" },
    { code: "ta-IN", name: "Tamil (தமிழ்)" },
    { code: "te-IN", name: "Telugu (తెలుగు)" },
    { code: "kn-IN", name: "Kannada (ಕನ್ನಡ)" },
    { code: "ml-IN", name: "Malayalam (മലയാളം)" },
  ];

  useEffect(() => {
    // init Web Speech API with language support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.lang = selectedLanguage;
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
  }, [selectedLanguage]);

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
      // Reset audio
      setAudioBlob(null);
      audioChunksRef.current = [];
      
      // Start recording audio
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          audioChunksRef.current = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunksRef.current.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
            setAudioBlob(blob);
          };

          mediaRecorder.start();
          recognitionRef.current.start();
          setListening(true);
          setStatus("🎤 Recording & Listening in " + (languageOptions.find(l => l.code === selectedLanguage)?.name || selectedLanguage) + "...");
        })
        .catch((err) => {
          setStatus("Microphone access denied: " + err.message);
        });
    } catch (err) {
      console.error(err);
      setStatus("Error starting microphone: " + err.message);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
    setListening(false);
  };

  const playbackConfirmation = () => {
    if (!audioBlob) {
      setStatus("No audio recorded");
      return;
    }
    setIsPlayingConfirmation(true);
    const audio = new Audio(URL.createObjectURL(audioBlob));
    audio.onended = () => setIsPlayingConfirmation(false);
    audio.play();
  };

  const confirmVoiceInput = () => {
    if (!text.trim()) {
      setStatus("No speech was recognized. Please try again.");
      setAudioBlob(null);
      return;
    }
    // Input confirmed - proceed with normal flow
    setStatus("✓ Voice input confirmed: " + text);
    setAudioBlob(null);
    // Continue with submission or allow user to edit
  };

  const rejectVoiceInput = () => {
    setText("");
    setAudioBlob(null);
    setStatus("Voice input rejected. Please try again.");
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
    <ThemeContext.Provider value={{ theme, setTheme }}>
      <div
        style={{
          minHeight: "100vh",
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          background: theme === "dark" ? "#181a1b" : "#f6f8fa",
          color: theme === "dark" ? "#e6e6e6" : "#222",
          transition: "background 0.3s, color 0.3s"
        }}
      >
        {/* <Navbar theme={theme} setTheme={setTheme} /> */}
        <div style={{ padding: '28px 20px', maxWidth: '1400px', margin: '0 auto' }}>
          <div className="chat-grid">
            {/* Left: main form */}
            <div style={{ padding: 12 }}>
              <div style={{
                width: '100%',
                marginBottom: 18,
                background: theme === "dark" ? "#23272f" : "#fff",
                border: theme === "dark" ? "1px solid #2c313a" : "1px solid #e6eef8",
                borderRadius: 14, boxShadow: theme === "dark" ? "0 2px 16px #0002" : "0 2px 16px #bfe0ff22",
                padding: 20, position: 'relative', transition: "background 0.3s, border 0.3s"
              }}>
                <div className="small" style={{ fontSize: 13, color: theme === "dark" ? "#bfe0ff" : "#555" }}>
                  Question {Math.min(index + 1, QUESTIONS.length)} / {QUESTIONS.length}
                </div>
                <h2 style={{ fontWeight: 700, fontSize: 22, margin: '12px 0 8px', color: theme === "dark" ? "#bfe0ff" : "#222" }}>
                  {currentQ ? currentQ.label : "All questions complete"}
                </h2>
                {currentQ && (
                  <>
                    <div className="small" style={{ fontSize: 13, marginBottom: 8, color: theme === "dark" ? "#bfe0ff" : "#555" }}>
                      Current value: {String(getAtPath(state, currentQ.key) ?? "")}
                    </div>
                    {/* Language selector + input */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 12, alignItems: 'start' }}>
                      <div>
                        <div style={{ marginTop: 6, marginBottom: 6 }}>
                          <input
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder="Type your answer or press mic and speak"
                            style={{
                              width: "100%",
                              padding: 12,
                              borderRadius: 10,
                              border: theme === "dark" ? "1px solid #444" : "1px solid #e6eef8",
                              background: theme === "dark" ? "#23272f" : "#fff",
                              color: theme === "dark" ? "#bfe0ff" : "#222",
                              fontSize: 15,
                              transition: "background 0.3s, color 0.3s"
                            }}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                          <button onClick={listening ? stopListening : startListening} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: listening ? (theme === 'dark' ? '#dc3545' : '#ffcdd2') : (theme === 'dark' ? '#bfe0ff' : '#1976d2'), color: listening ? '#fff' : (theme === 'dark' ? '#222' : '#fff'), fontWeight: 600, cursor: 'pointer' }}>{listening ? '⏹️ Stop' : '🎤 Record'}</button>
                          <button onClick={handleSubmitAnswer} disabled={!text.trim()} style={{ padding: 10, borderRadius: 8, border: 'none', background: theme === 'dark' ? '#23272f' : '#e6eef8', color: theme === 'dark' ? '#bfe0ff' : '#1976d2', fontWeight: 600, cursor: !text.trim() ? 'not-allowed' : 'pointer' }}>Submit</button>
                        </div>
                      </div>
                      <div>
                        <select value={selectedLanguage} onChange={(e) => setSelectedLanguage(e.target.value)} style={{ width: '100%', padding: 10, borderRadius: 8, border: theme === 'dark' ? '1px solid #444' : '1px solid #ccc', background: theme === 'dark' ? '#23272f' : '#fff', color: theme === 'dark' ? '#bfe0ff' : '#222' }}>
                          {languageOptions.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
                        </select>
                        <div style={{ marginTop: 8, fontSize: 12, color: theme === 'dark' ? '#bfe0ff' : '#666' }}>{languageOptions.find(l => l.code === selectedLanguage)?.name}</div>
                      </div>
                    </div>

                    {/* confirmation panel */}
                    {audioBlob && text && (
                      <div style={{ marginTop: 14, padding: 12, borderRadius: 10, background: theme === 'dark' ? '#2c313a' : '#fff8e1', border: '1px solid #ffc107' }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>📢 Voice Input Detected</div>
                        <div style={{ marginBottom: 8, padding: 8, borderRadius: 6, background: theme === 'dark' ? '#23272f' : '#fff' }}>
                          <strong>Recognized:</strong> {text}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={playbackConfirmation} disabled={isPlayingConfirmation} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: theme === 'dark' ? '#1976d2' : '#ffc107', color: theme === 'dark' ? '#fff' : '#222' }}>{isPlayingConfirmation ? '🔊 Playing' : '🔊 Play'}</button>
                          <button onClick={confirmVoiceInput} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#28a745', color: '#fff' }}>Confirm</button>
                          <button onClick={rejectVoiceInput} style={{ flex: 1, padding: 10, borderRadius: 8, border: 'none', background: '#dc3545', color: '#fff' }}>Reject</button>
                        </div>
                      </div>
                    )}

                    <div style={{ marginTop: 12, color: theme === 'dark' ? '#ffc107' : '#666' }}>{status}</div>
                  </>
                )}
                {!currentQ && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ color: theme === 'dark' ? '#bfe0ff' : '#666' }}>All questions asked. Review and submit to DB.</div>
                    <div style={{ marginTop: 12 }}>
                      <button onClick={handleSave} style={{ padding: '10px 20px', borderRadius: 8, border: 'none', background: theme === 'dark' ? '#28a745' : '#1976d2', color: '#fff', fontWeight: 700 }}>Save FIR</button>
                    </div>
                  </div>
                )}

                <div className="progress" style={{ marginTop: 12, height: 8, background: theme === 'dark' ? '#23272f' : '#f0f4fb', borderRadius: 4 }}>
                  <div ref={progressRef} style={{ width: `${Math.round((index / QUESTIONS.length) * 100)}%`, height: '100%', background: theme === 'dark' ? '#bfe0ff' : '#1976d2', borderRadius: 4, transition: 'width 0.3s' }} />
                </div>
              </div>

              <div>
                <div style={{ padding: 12, borderRadius: 12, background: theme === 'dark' ? '#101214' : '#fff', border: theme === 'dark' ? '1px solid #222' : '1px solid #e6eef8' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: theme === 'dark' ? '#bfe0ff' : '#222' }}>Preview</div>
                      <div>
                        <button onClick={() => { const w = window.open(); w.document.write(previewHtml); w.document.close(); }} style={{ marginRight: 8, padding: '6px 10px', borderRadius: 8, background: theme === 'dark' ? '#1976d2' : '#1976d2', color: '#fff', border: 'none' }}>Open in new tab</button>
                        <button onClick={() => { const blob = new Blob([previewHtml], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'fir_preview.html'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); }} style={{ padding: '6px 10px', borderRadius: 8, background: theme === 'dark' ? '#28a745' : '#28a745', color: '#fff', border: 'none' }}>Download HTML</button>
                      </div>
                    </div>
                    <div style={{ marginTop: 8, borderRadius: 8, overflow: 'hidden', border: theme === 'dark' ? '1px solid #1b1e22' : '1px solid #e9eef6' }}>
                      <iframe title="FIR Preview" srcDoc={previewHtml} style={{ width: '100%', height: 340, border: 'none', display: 'block', background: '#fff' }} />
                    </div>
                  </div>
              </div>
            </div>

            {/* Right: side panel */}
            <div className="chat-side" style={{ padding: 12 }}>
              <div style={{ marginBottom: 18, borderRadius: 12 }}>
                <div style={{ padding: 16, borderRadius: 12, background: theme === 'dark' ? '#23272f' : '#f8f9fb', border: theme === 'dark' ? '1px solid #2c313a' : '1px solid #e6eef8' }}>
                  <h3 style={{ margin: 0, color: theme === 'dark' ? '#bfe0ff' : '#1976d2' }}>Download FIR PDF</h3>
                  <div style={{ fontSize: 13, color: theme === 'dark' ? '#bfe0ff' : '#666', marginTop: 8 }}>Download the FIR PDF for the last saved FIR.</div>
                  <button onClick={handleDownloadPdf} disabled={!firId} style={{ marginTop: 12, padding: 10, borderRadius: 8, border: 'none', background: theme === 'dark' ? '#1976d2' : '#28a745', color: '#fff', width: '100%' }}>{!firId ? 'Save FIR first' : 'Download/Print FIR PDF'}</button>
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ padding: 16, borderRadius: 12, background: theme === 'dark' ? '#23272f' : '#f8f9fb', border: theme === 'dark' ? '1px solid #2c313a' : '1px solid #e6eef8' }}>
                  <h3 style={{ margin: 0, color: theme === 'dark' ? '#bfe0ff' : '#1976d2' }}>Predict Section (BNS)</h3>
                  <div style={{ fontSize: 13, color: theme === 'dark' ? '#bfe0ff' : '#666', marginTop: 8 }}>Enter FIR contents to predict BNS sections.</div>
                  <input type="text" value={sectionPredictText} onChange={e => setSectionPredictText(e.target.value)} placeholder="First information contents" style={{ marginTop: 10, width: '100%', padding: 10, borderRadius: 8, border: theme === 'dark' ? '1px solid #444' : '1px solid #e6eef8', background: theme === 'dark' ? '#23272f' : '#fff', color: theme === 'dark' ? '#bfe0ff' : '#222' }} />
                  <button onClick={handlePredictSection} disabled={!sectionPredictText.trim()} style={{ marginTop: 10, padding: 10, borderRadius: 8, border: 'none', background: theme === 'dark' ? '#1976d2' : '#28a745', color: '#fff', width: '100%' }}>Predict Section</button>
                  {sectionPredictLoading && <div style={{ marginTop: 8, color: theme === 'dark' ? '#ffc107' : '#666' }}>Predicting...</div>}
                  {sectionPredictResult && <div style={{ marginTop: 8, color: theme === 'dark' ? '#bfe0ff' : '#1976d2' }}>{sectionPredictResult}</div>}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ padding: 16, borderRadius: 12, background: theme === 'dark' ? '#23272f' : '#f8f9fb', border: theme === 'dark' ? '1px solid #2c313a' : '1px solid #e6eef8' }}>
                  <NearestPoliceStation />
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}
