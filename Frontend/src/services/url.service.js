import axios from "axios";

export const apiUrl = "https://whatsapp-1-cfu7.onrender.com";

const axiosInstance = axios.create({
    baseURL: apiUrl,
});

axiosInstance.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

export default axiosInstance;