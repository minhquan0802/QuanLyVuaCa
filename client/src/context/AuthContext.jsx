import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import axios from "axios";
import api from "../config/axios";

// vaitro (String từ VaiTro enum) → tên role dùng trong app
const ROLE_MAP = {
    "ADMIN": "admin",
    "WHOLESALE_CUSTOMER": "khachsi",
    "INDIVIDUAL_CUSTOMER": "khachle",
    "STAFF": "staff",
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Khi app khởi động: dùng axios thuần (bypass interceptor) để check session.
    // Nếu 401 → chỉ đơn giản là guest, KHÔNG redirect — tránh vòng lặp chuyển trang.
    useEffect(() => {
        axios.get(`${import.meta.env.VITE_BE_URL}/tai-khoan/my-info`, { withCredentials: true })
            .then(({ data }) => setUser(data.result))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const role = ROLE_MAP[user?.vaitro] ?? null;

    // const logout = async () => {
    //     const token = Cookies.get("token");
    //     try {
    //         if (token) await api.post("/auth/logout", { token });
    //     } catch { /* bỏ qua */ }
    //     Cookies.remove("token", { path: "/" });
    //     setUser(null);
    //     window.location.href = "/";
    // };

    const logout = async () => {
    try {
        // console.log("1. Bắt đầu gọi API đăng xuất...");
        
        // Gọi API không cần biến token, trình duyệt tự gửi HttpOnly cookie đi
        const res = await api.post("/auth/logout"); 
        
        // console.log("2. Server xóa Cookie thành công!", res);
    } catch (error) {
        console.error("2. Lỗi khi gọi API:", error);
    }

    // Xóa các state rác ở Frontend
    Cookies.remove("authenticated", { path: "/" });
    Cookies.remove("role", { path: "/" });
    setUser(null);
    
    window.location.href = "/"; 
};
    

    return (
        <AuthContext.Provider value={{ user, setUser, role, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
