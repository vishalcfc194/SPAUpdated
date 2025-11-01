import axios from "axios";
import { toast } from "react-toastify";

const API_BASE = process.env.REACT_APP_API_URL || "https://spabackend-359c.onrender.com/api";

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for success toasts on mutating requests
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const msg =
      error.response && error.response.data && error.response.data.message
        ? error.response.data.message
        : error.message;
    toast.error(msg || "API request failed");
    return Promise.reject(error);
  }
);

export default api;
