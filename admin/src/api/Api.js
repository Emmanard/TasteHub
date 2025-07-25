import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Interceptor to attach token automatically
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("foodeli-app-token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;
