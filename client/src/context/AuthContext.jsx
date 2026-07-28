import { createContext, useContext, useState, useEffect } from "react";
import api, { dangXuat, refreshSession } from "../config/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const { data } = await api.get("/tai-khoan/my-info", {
                    skipAuthRefresh: true,
                });
                setUser(data.result);
            } catch (err) {
                if (err.response?.status === 401) {
                    try {
                        await refreshSession();
                        const { data } = await api.get("/tai-khoan/my-info", {
                            skipAuthRefresh: true,
                        });
                        setUser(data.result);
                    } catch {
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
