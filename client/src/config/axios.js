import axios from 'axios';
import Cookies from 'js-cookie';

const COOKIE_OPTS = { expires: 1, path: '/', sameSite: 'Lax' };

const api = axios.create({
    baseURL: import.meta.env.VITE_BE_URL,
    withCredentials: true,
});

api.interceptors.request.use((config) => {
    const token = Cookies.get('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, newToken = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(newToken);
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
            }).then((newToken) => {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return api(originalRequest);
            });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
            const token = Cookies.get('token');
            const { data } = await axios.post(
                `${import.meta.env.VITE_BE_URL}/auth/refresh`,
                { token },
                { withCredentials: true }
            );
            const newToken = data.result.token;

            Cookies.set('token', newToken, COOKIE_OPTS);
            api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
            processQueue(null, newToken);

            originalRequest.headers.Authorization = `Bearer ${newToken}`;
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
    const token = Cookies.get('token');
    try {
        if (token) {
            await axios.post(
                `${import.meta.env.VITE_BE_URL}/auth/logout`,
                { token },
                { headers: { Authorization: `Bearer ${token}` }, withCredentials: true }
            );
        }
    } catch { /* ignore */ }
    Cookies.remove('token', { path: '/' });
    Cookies.remove('authenticated', { path: '/' });
    Cookies.remove('role', { path: '/' });
    window.location.href = '/';
};

export const COOKIE_OPTS_EXPORT = COOKIE_OPTS;

export default api;
