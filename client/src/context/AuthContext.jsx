import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
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

    // Khi app khởi động: nếu có token thì fetch lại user info
    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) { setLoading(false); return; }

        api.get("/tai-khoan/my-info")
            .then(({ data }) => setUser(data.result))
            .catch((err) => {
                // Chỉ xóa token khi server xác nhận token không hợp lệ (401/403)
                // Không xóa khi mất mạng hoặc lỗi server tạm thời
                if (err.response?.status === 401 || err.response?.status === 403) {
                    Cookies.remove("token", { path: "/" });
                }
            })
            .finally(() => setLoading(false));
    }, []);

    const role = ROLE_MAP[user?.vaitro] ?? null;

    const logout = async () => {
        const token = Cookies.get("token");
        try {
            if (token) await api.post("/auth/logout", { token });
        } catch { /* bỏ qua */ }
        Cookies.remove("token", { path: "/" });
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
