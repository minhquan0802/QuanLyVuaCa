import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
    // 1. Lấy token từ localStorage
    const token = localStorage.getItem("token");

    // 2. Kiểm tra: Nếu không có token -> Đá về trang Login
    if (!token) {
        // replace: true để người dùng không thể bấm Back quay lại trang này
        return <Navigate to="/" replace />;
    }

    // 3. Nếu có token -> Cho phép hiển thị các Route con bên trong
    return <Outlet />;
};

export default ProtectedRoute;