import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const PrivateAdminRoute = () => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user || user.vaitro !== "ADMIN") return <Navigate to="/" replace />;

    return <Outlet />;
};

export default PrivateAdminRoute;
