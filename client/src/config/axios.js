import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_BE_URL,
    withCredentials: true,
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve();
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status !== 401 || originalRequest._retry) {
            return Promise.reject(error);
        }

        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            }).then(() => {
                return api(originalRequest);
            }).catch((err) => {
                return Promise.reject(err);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            await axios.post(
                `${import.meta.env.VITE_BE_URL}/auth/refresh`,
                {},
                { withCredentials: true }
            );
            
            processQueue(null);
            return api(originalRequest);
        } catch (refreshError) {
            processQueue(refreshError);
            dangXuat();
            return Promise.reject(refreshError);
        } finally {
            isRefreshing = false;
        }
    }
);

export const dangXuat = async () => {
    try {
        await axios.post(
            `${import.meta.env.VITE_BE_URL}/auth/logout`,
            {},
            { withCredentials: true }
        );
    } catch { 
        /* ignore */ 
    }
    
    if (window.location.pathname !== '/') {
        window.location.href = '/';
    }
};

export default api;