import axios from "axios";

// Get API base URL from environment variable
let API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
  if (import.meta.env.MODE === "development") {
    // Default to localhost in development
    API_BASE_URL = "http://localhost:3101";
  } else {
    // In production, VITE_API_BASE_URL must be set
    throw new Error(
      "VITE_API_BASE_URL environment variable is required in production. " +
      "Please set it in your deployment platform (Vercel, Netlify, etc.)"
    );
  }
}

console.log("VITE_API_BASE_URL:", import.meta.env.VITE_API_BASE_URL);
console.log("MODE:", import.meta.env.MODE);
console.log("API_BASE_URL:", API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// Add a request interceptor to attach the token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default apiClient;
