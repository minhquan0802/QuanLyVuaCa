import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api, { dangXuat } from "../config/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Dùng axios thuần để tránh interceptor redirect khi guest chưa đăng nhập
        axios.get(`${import.meta.env.VITE_BE_URL}/tai-khoan/my-info`, { withCredentials: true })
            .then(({ data }) => setUser(data.result))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const logout = async () => {
        await dangXuat();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, setUser, loading, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}