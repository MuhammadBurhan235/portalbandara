import axios from "axios";

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() ||
  "https://api-portalbandara.overthinkingku.com/api";

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
