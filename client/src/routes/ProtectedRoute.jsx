import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles = ["ADMIN", "STAFF"] }) => {
    const { user, loading } = useAuth();

    if (loading) return null;
    if (!user) return <Navigate to="/" replace />;
    if (!allowedRoles.includes(user.vaitro)) {
        const fallbackPath = user.vaitro === "STAFF" ? "/admin/QuanLyDonHang" : "/";
        return <Navigate to={fallbackPath} replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
