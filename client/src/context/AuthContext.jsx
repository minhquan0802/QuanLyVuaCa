import { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import api from "../config/axios";

// idvaitro → tên role dùng trong app
const ROLE_MAP = { 1: "admin", 5: "khachsi", 6: "khachle" };

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Khi app khởi động: nếu có token thì fetch lại user info
    useEffect(() => {
        const token = Cookies.get("token");
        if (!token) { setLoading(false); return; }

        api.get("/TaiKhoans/myinfo")
            .then(({ data }) => setUser(data.result))
            .catch(() => Cookies.remove("token", { path: "/" }))
            .finally(() => setLoading(false));
    }, []);

    const role = ROLE_MAP[user?.idvaitro] ?? null;

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
