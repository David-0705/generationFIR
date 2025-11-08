import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
export const saveFir = (data) => axios.post(`${API}/api/fir/save`, data).then(r=>r.data); 
// export const askLLM = (payload) => axios.post(`${API}/api/llm/ask-llm`, payload).then(r=>r.data); // commented out 
export const getFirPdf = (id) => axios.get(`${API}/api/fir/${id}/pdf_html`, { responseType: 'blob' });
