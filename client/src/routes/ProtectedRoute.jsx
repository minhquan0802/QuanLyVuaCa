import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user || (user.vaitro !== "ADMIN" && user.vaitro !== "STAFF")) return <Navigate to="/" replace />;

    return <Outlet />;
};

export default ProtectedRoute;
