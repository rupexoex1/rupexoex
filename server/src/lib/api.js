// src/lib/api.js
import axios from "axios";

export const api = axios.create({
  baseURL: "https://rupexo-backend.vercel.app",
  headers: { "Content-Type": "application/json" },
});

// auto-attach token from localStorage to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// helpers
export function setToken(token) {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}
