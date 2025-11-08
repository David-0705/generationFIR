import React, { useEffect, useState, useRef } from "react";
import { saveFir, askLLM } from "../api";

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
  { key: "propertiesOfInterest.0.category", label: "Property Category", default: "Drugs/Narcotics" },
  { key: "propertiesOfInterest.0.type", label: "Property Type", default: "Cannabis" },
  { key: "propertiesOfInterest.0.description", label: "Property Description", default: "Total of 135 grams of cannabis narcotic substance" },
  { key: "propertiesOfInterest.0.value", label: "Property Value (Rs)", default: 1900 },
  { key: "totalValueOfProperty", label: "Total value of property (In Rs/-)", default: 1900 },
  { key: "firstInformationContents", label: "First Information contents", default: "" }
];

// function setAtPath(obj, path, value) {
//   const parts = path.split(".");
//   let cur = obj;

//   for (let i = 0; i < parts.length; i++) {
//     const p = parts[i];
//     const isLast = i === parts.length - 1;
//     const isIndex = /^\d+$/.test(p);            // whether current part is numeric (array index)
//     const next = parts[i + 1];
//     const nextIsIndex = next !== undefined && /^\d+$/.test(next);

//     // If current part is a numeric index, ensure `cur` is an array
//     if (isIndex) {
//       const idx = parseInt(p, 10);
//       if (!Array.isArray(cur)) {
//         // Convert current container to array if it isn't one.
//         // This can happen if the parent created an object but the path expects an array.
//         // We replace the reference on the parent object/array accordingly.
//         throw new Error(`Attempting to use numeric index '${p}' on a non-array container. Ensure parent path is an array.`);
//       }

//       // If this is the last part, set value at the index
//       if (isLast) {
//         cur[idx] = value;
//         return;
//       }

//       // Ensure the array has an object (or array) at idx
//       while (cur.length <= idx) cur.push(nextIsIndex ? [] : {});
//       // Move cursor to that element
//       cur = cur[idx];
//     } else {
//       // current part is a non-numeric key (object property)
//       if (isLast) {
//         // last key -> set value
//         cur[p] = value;
//         return;
//       }

//       // if the property doesn't exist, create it as object or array depending on next part
//       if (cur[p] === undefined || cur[p] === null) {
//         cur[p] = nextIsIndex ? [] : {};
//       } else {
//         // If something exists but its type mismatches the expected type, try to convert safely
//         if (nextIsIndex && !Array.isArray(cur[p])) {
//           // replace object with array to satisfy numeric index next
//           cur[p] = [];
//         } else if (!nextIsIndex && Array.isArray(cur[p])) {
//           // replace array with object if next is not index
//           cur[p] = {};
//         }
//       }

//       cur = cur[p];
//     }
//   }
// }


// simple getAtPath

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
        // Walk from root using parts up to i-1
        let parent = obj;
        for (let j = 0; j < i - 1; j++) {
          const part = parts[j];
          parent = parent ? parent[part] : undefined;
        }
        const parentKey = parts[i - 1];
        if (parent && parentKey !== undefined) {
          if (!Array.isArray(parent[parentKey])) parent[parentKey] = [];
          cur = parent[parentKey];
        } else {
          // fallback: if root isn't an object, create array root (rare)
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

export default function ChatForm(){
  const [state, setState] = useState({});
  const [index, setIndex] = useState(0);
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);
  const [status, setStatus] = useState("");
  const recognitionRef = useRef(null);
  const progressRef = useRef(null);

  useEffect(()=> {
    // initialize defaults
    const s = {};
    QUESTIONS.forEach(q=>{
      if (q.default !== undefined && q.default !== "") {
        setAtPath(s, q.key, q.default);
      }
    });
    setState(s);
  }, []);

  useEffect(()=>{
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

  useEffect(()=>{
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

    // optional: you could ask LLM to sanity-check or produce a follow-up prompt here by calling /api/llm/ask-llm
    // Example (commented out):
    const llmResp = await askLLM({ messages: [{role:"user", content:`validate: ${q.label} -> ${val}`}]} );
    console.log(llmResp);
  };

  const handleBack = () => {
    if (index > 0) setIndex(index - 1);
  };

  const handleSave = async () => {
    try {
      setStatus("Saving to database...");
      const resp = await saveFir(state);
      setStatus("Saved! ID: " + resp.id);
    } catch (err) {
      console.error(err);
      setStatus("Save error: " + (err?.response?.data?.error || err.message));
    }
  };

  const currentQ = QUESTIONS[index];

  return (
    <div>
      <div className="question-card">
        <div className="small">Question {Math.min(index+1, QUESTIONS.length)} / {QUESTIONS.length}</div>
        <h2>{currentQ ? currentQ.label : "All questions complete"}</h2>
        {currentQ && (
          <>
            <div className="small">Current value (from defaults / previous): {String(getAtPath(state, currentQ.key) ?? "")}</div>

            <div style={{marginTop:10}}>
              <input
                value={text}
                onChange={(e)=>setText(e.target.value)}
                placeholder="Type your answer or press mic and speak"
                style={{width:"100%", padding:10, borderRadius:8, border:"1px solid #e6eef8"}}
              />
              <div className="controls">
                <button className="button" onClick={listening ? stopListening : startListening}>
                  {listening ? "Stop mic" : "Start mic"}
                </button>
                <button className="button secondary" onClick={handleSubmitAnswer}>Submit Answer</button>
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

        <div className="progress" style={{marginTop:12}}>
          <div ref={progressRef} style={{width: `${Math.round((index/QUESTIONS.length)*100)}%`}}></div>
        </div>
      </div>

      <div className="preview">
        <h3>Preview — Current FIR object (editable via steps)</h3>
        <pre style={{whiteSpace:"pre-wrap", fontSize:13}}>{JSON.stringify(state, null, 2)}</pre>
      </div>

    </div>
  );
}
