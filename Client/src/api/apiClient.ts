import axios from "axios";

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const API_BASE_URL= process.env.VITE_API_BASE_URL || "https://flexforms-production.up.railway.app"
// const API_BASE_URL = "https://flexforms-production.up.railway.app";

if (!API_BASE_URL) {
  console.warn('VITE_API_BASE_URL is not set in environment variables');
}

console.log('API_BASE_URL:', API_BASE_URL);


const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
