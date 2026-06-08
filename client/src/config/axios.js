import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BE_URL,
  withCredentials: true 
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach(prom => {
    if (error) prom.reject(error);
    else prom.resolve(); 
  });
  failedQueue = [];
};

// CHỈ CẦN RESPONSE INTERCEPTOR
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Bắt lỗi 401 (Hết hạn Access Token)
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // Nếu đang có một request khác đang refresh rồi thì đưa vào hàng đợi
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
        .then(() => {
          // Khi refresh xong, tự động gọi lại request bị lỗi. Trình duyệt tự nhét Cookie mới.
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API gia hạn mã. Trình duyệt tự gửi refreshToken từ Cookie lên.
        await api.post('/auth/refresh'); 
        // 🚀 Backend đã set thành công 2 Cookie mới! Không cần lấy data gì từ đây cả.

        isRefreshing = false;
        processQueue(null);

        // Chạy lại request ban đầu với Cookie mới
        return api(originalRequest);

      } catch (refreshError) {
        // Lỗi refresh (Cookie chết hẳn) -> Đăng xuất
        isRefreshing = false;
        processQueue(refreshError);
        // Ngăn chặn vòng lặp nếu đang ở trang login / register
        if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
          window.location.href = '/login'; 
        }
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export default api;