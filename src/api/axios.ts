import axios from "axios";

export const apiClient = axios.create({
  baseURL: "https://api-portalbandara.overthinkingku.com/api", // Arahkan ke URL local Laravel Anda
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
