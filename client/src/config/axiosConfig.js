import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:8080',
    headers: { 'Content-Type': 'application/json' }
});

// 1. Request Interceptor: Luôn đính kèm Access Token vào mọi request cần bảo mật
api.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem('accessToken');
        if (accessToken) {
            config.headers['Authorization'] = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Biến cờ ngăn chặn việc gọi nhiều API Refresh cùng lúc khi nhiều request 401 đồng thời sập
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) prom.reject(error);
        else prom.resolve(token);
    });
    failedQueue = [];
};

// 2. Response Interceptor: Đón chặn lỗi 401 để tự động Refresh Token
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Unauthorized) và request này chưa từng được retry
        if (error.response && error.response.status === 401 && !originalRequest._retry) {
            
            if (isRefreshing) {
                // Nếu đang có một tiến trình refresh chạy rồi, xếp hàng request này lại
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                .then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token;
                    return api(originalRequest);
                })
                .catch(err => Promise.reject(err));
            }

            originalRequest._retry = true;
            isRefreshing = true;

            const refreshToken = localStorage.getItem('refreshToken');
            
            if (!refreshToken) {
                // Không có refresh token cục bộ -> Thực hiện hành động Logout luôn
                handleLocalLogout();
                return Promise.reject(error);
            }

            try {
                // Gọi API refresh token lên Backend
                const res = await axios.post('http://localhost:8080/auth/refresh-token', {
                    token: refreshToken
                });

                if (res.status === 200 && res.data.accessToken) {
                    const { accessToken, refreshToken: newRefreshToken } = res.data;
                    
                    // Lưu bộ đôi token mới vào storage
                    localStorage.setItem('accessToken', accessToken);
                    localStorage.setItem('refreshToken', newRefreshToken);

                    isRefreshing = false;
                    processQueue(null, accessToken);

                    // Thực thi lại request bị lỗi ban đầu với token mới
                    originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;
                    return api(originalRequest);
                }
            } catch (refreshError) {
                // Nếu ngay cả Refresh Token cũng hết hạn hoặc bị lỗi, xóa hết và bắt đăng nhập lại
                isRefreshing = false;
                processQueue(refreshError, null);
                handleLocalLogout();
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

// Hàm xử lý Logout khi Token chết hoàn toàn
function handleLocalLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login'; // Đẩy về trang đăng nhập
}

// Hàm sử dụng khi User chủ động bấm nút "Đăng xuất" trên giao diện
export const handleUserLogout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    try {
        // Báo cho Backend hủy token trong cơ sở dữ liệu
        await api.post('/auth/logout', { 
            token: accessToken,
            refresh_token: refreshToken 
        });
    } catch (e) {
        console.log("Xóa token phía server thất bại hoặc đã hết hạn trước đó");
    } finally {
        // Dù API server có lỗi hay thành công thì client vẫn phải xóa sạch dữ liệu cục bộ
        handleLocalLogout();
    }
};

export default api;