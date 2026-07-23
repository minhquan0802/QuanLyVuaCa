import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles = ["ADMIN", "STAFF"] }) => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user || !allowedRoles.includes(user.vaitro)) return <Navigate to="/" replace />;

    return <Outlet />;
};

export default ProtectedRoute;
