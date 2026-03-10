// Cấu hình URL gốc
const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa";

// Hàm này thay thế cho fetch thông thường
export const fetchCoXacThuc = async (endpoint, options = {}) => {
    
    // 1. Lấy token hiện tại từ localStorage
    let token = localStorage.getItem("token");

    // 2. Chuẩn bị Header (Gắn vé vào cổng)
    let headers = options.headers || {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        // headers["Content-Type"] = "application/json";
        // --- SỬA ĐOẠN NÀY ---
        // Chỉ thêm application/json nếu body KHÔNG PHẢI là FormData
        // Nếu là FormData (upload ảnh), để trình duyệt tự lo
        if (!(options.body instanceof FormData)) {
            headers["Content-Type"] = "application/json";
        }
    }

    // 3. Gửi request lần 1 (Cố gắng đi vào cổng)
    let response = await fetch(`${APP_BASE_URL}${endpoint}`, {
        ...options,
        headers: headers
    });

    // 4. KHOẢNH KHẮC SỰ THẬT: Kiểm tra xem có bị đuổi về (Lỗi 401) không?
    if (response.status === 401) {
        console.log("⚠️ Token hết hạn! Đang cố gắng xin cấp lại...");

        // --- BẮT ĐẦU QUY TRÌNH CẤP CỨU THỦ CÔNG ---
        
        // Bước A: Gọi API Refresh (Dùng chính cái token vừa bị lỗi để xin mới)
        try {
            const refreshResponse = await fetch(`${APP_BASE_URL}/auth/refresh`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token: token }) // Gửi token cũ lên
            });

            const refreshData = await refreshResponse.json();

            // Bước B: Kiểm tra xem xin mới có thành công không
            if (refreshResponse.ok && refreshData.result) {
                console.log("✅ Đã refresh token thành công!");

                // 1. Lưu token mới vào túi ngay
                const newToken = refreshData.result.token;
                localStorage.setItem("token", newToken);

                // 2. Cập nhật lại cái vé (Header) với token mới
                headers["Authorization"] = `Bearer ${newToken}`;

                // 3. QUAN TRỌNG NHẤT: Gửi lại request ban nãy (Replay)
                // Gọi lại chính hàm fetch ban đầu với header mới
                const retryResponse = await fetch(`${APP_BASE_URL}${endpoint}`, {
                    ...options,
                    headers: headers
                });

                return retryResponse; // Trả về kết quả của lần thử lại
            } else {
                // Refresh cũng thất bại (Hết hạn quá lâu rồi) -> Chấp nhận số phận
                console.error("❌ Refresh thất bại. Đăng xuất!");
                DangXuat();
                return response; // Trả về lỗi 401 gốc
            }
        } catch (err) {
            console.error("Lỗi khi gọi refresh:", err);
            DangXuat();
            return response;
        }
    }

    // Nếu không lỗi 401 (thành công hoặc lỗi khác), trả về bình thường
    return response;
};

// Hàm phụ để đá người dùng ra
export const DangXuat  = async () => {
    const token = localStorage.getItem("token");

    try {
        if (token) {
            // Gọi API logout
            await fetch(`${APP_BASE_URL}/auth/logout`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ token })
            });
        }
    } catch (error) {
        console.error("Lỗi khi gọi API logout:", error);
    }

    // Xóa dữ liệu FE
    localStorage.removeItem("token");
    localStorage.removeItem("authenticated");
    localStorage.removeItem("role");

    // Chuyển về login
    window.location.href = "/";
};