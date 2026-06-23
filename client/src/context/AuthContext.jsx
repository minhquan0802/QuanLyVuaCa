import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import api, { dangXuat } from "../config/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                // Dùng axios thuần để tránh interceptor redirect khi guest chưa đăng nhập
                const { data } = await axios.get(
                    `${import.meta.env.VITE_BE_URL}/tai-khoan/my-info`,
                    { withCredentials: true }
                );
                setUser(data.result);
            } catch (err) {
                if (err.response?.status === 401) {
                    // Token hết hạn — thử refresh thủ công, không dùng interceptor
                    try {
                        await axios.post(
                            `${import.meta.env.VITE_BE_URL}/auth/refresh`,
                            {},
                            { withCredentials: true }
                        );
                        // Refresh thành công, gọi lại my-info
                        const { data } = await axios.get(
                            `${import.meta.env.VITE_BE_URL}/tai-khoan/my-info`,
                            { withCredentials: true }
                        );
                        setUser(data.result);
                    } catch {
                        // Refresh token cũng hết hạn → guest
                        setUser(null);
                    }
                } else {
                    setUser(null);
                }
            } finally {
                setLoading(false);
            }
        };
        checkAuth();
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