import { Navigate, Outlet } from "react-router-dom";

const PrivateAdminRoute = () => {
    // 1. Lấy token và role từ localStorage (đã lưu lúc Login)
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role"); 

    // 2. Kiểm tra điều kiện: Phải có Token VÀ Role phải là admin
    // Lưu ý: Đảm bảo string 'admin' khớp với những gì bạn lưu lúc login
    if (!token || role !== "admin") {
        // Nếu không thỏa mãn -> Đá về trang Login
        return <Navigate to="/" replace />;
    }

    // 3. Nếu thỏa mãn -> Cho phép hiển thị các Route con (Outlet)
    return <Outlet />;
};

export default PrivateAdminRoute;