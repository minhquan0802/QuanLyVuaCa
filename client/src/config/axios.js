import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_BE_URL,
    withCredentials: true, // Bắt buộc để trình duyệt tự đính kèm HttpOnly Cookie
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(); // Giải phóng hàng đợi khi làm mới thành công
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

        // Tình huống 1: Đang có một request khác đi Refresh Token, ngâm các request sau vào hàng đợi
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then(() => {
                    originalRequest._retry = true;
                    return api(originalRequest);
                })
                .catch((err) => Promise.reject(err));
        }

        // Tình huống 2: Request đầu tiên phát hiện lỗi 401, tiến hành đi gọi API đổi token mới
        originalRequest._retry = true;
        isRefreshing = true;

        try {
            // Gọi API làm mới token sang một thực thể axios độc lập
            await axios.post(
                `${import.meta.env.VITE_BE_URL}/auth/refresh`,
                {},
                { withCredentials: true }
            );

            // Trì hoãn một khoảng vài mili-giây cực ngắn (Xử lý bất đồng bộ hệ thống)
            // Việc này giúp trình duyệt kịp ghi đè Set-Cookie mới vào header trước khi xả hàng đợi
            await new Promise((resolve) => setTimeout(resolve, 50));

            processQueue(null);
            return api(originalRequest);

        } catch (refreshError) {
            processQueue(refreshError);
            dangXuat(); // Hàm đẩy người dùng về trang login nếu Refresh Token cũng hết hạn
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