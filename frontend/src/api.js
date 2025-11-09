import axios from "axios";
const API = import.meta.env.VITE_API_URL || "http://localhost:5000"; 
export const saveFir = (data) => axios.post(`${API}/api/fir/save`, data).then(r=>r.data); 

export const getFirPdf = (id) =>
	axios.get(`${API}/api/fir/${id}/pdf_html`, { responseType: "blob" });

export const predictSection = (firstInformationContents) =>
	axios.post(`${API}/api/bns/predict-section`, { firstInformationContents })
		.then(r => r.data);
