import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000",
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // for cookies if needed
});

// Optional: Add interceptors for auth, logging, etc.
// axiosClient.interceptors.response.use(
//   (response) => response,
//   (error) => Promise.reject(error)
// );

export default axiosClient;
