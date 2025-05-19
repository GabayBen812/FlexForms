import axios from "axios";

let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  // fallback for dev/prod
  API_BASE_URL = import.meta.env.MODE === "development"
    ? "http://localhost:3101"
    : "https://flexforms-production.up.railway.app";
}

console.log("API_BASE_URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

export default apiClient;
