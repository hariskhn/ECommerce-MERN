import axios from "axios";

const axiosInstance = axios.create({
	baseURL: import.meta.mode === "development" ? "http://localhost:5000/api/v1" : import.meta.env.VITE_BACKEND_URL,
	withCredentials: true,
});

export default axiosInstance;