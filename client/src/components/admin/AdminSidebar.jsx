import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const menuItems = [
        { label: "Dashboard", path: "/admin" },
        { label: "Quản lý Loại Cá", path: "/admin/QuanLyLoaiCa" },
        { label: "Quản lý Tài Khoản", path: "/admin/QuanLyTaiKhoan" },
        { label: "Quản lý Đơn Hàng", path: "/admin/QuanLyDonHang" },
        { label: "Quản lý Bảng Giá", path: "/admin/QuanLyBangGia" },
        { label: "Quản lý Kho Hàng", path: "/admin/QuanLyKho" },
    ];

    const isActive = (path) => {
        if (path === "/admin" && location.pathname !== "/admin") return false;
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-cyan-950 border-r border-cyan-900 flex flex-col h-screen fixed left-0 top-0 z-50 font-body text-cyan-300">
            <div className="h-16 flex items-center px-6 border-b border-cyan-900">
                <div className="flex items-center gap-3 cursor-pointer select-none">
                    <span className="font-display font-extrabold text-xs tracking-widest text-cyan-100 uppercase">
                        Vựa cá Điêu Hồng
                    </span>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <button
                            key={item.path}
                            onClick={() => navigate(item.path)}
                            className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                                active
                                    ? "bg-cyan-900/60 text-cyan-200 border border-cyan-800 shadow-inner" 
                                    : "text-cyan-400 hover:bg-cyan-900/30 hover:text-cyan-100"
                            }`}
                        >
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-cyan-900 bg-cyan-950">
                <div className="flex items-center gap-3 px-1 mb-4">
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-cyan-100 truncate">{user.ho}{user.ten}</p>
                        <p className="text-[11px] text-cyan-400 truncate">{user.email}</p>
                    </div>
                </div>
                
                <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold text-cyan-500 hover:bg-cyan-900 hover:text-rose-400 border border-cyan-900 hover:border-cyan-800 transition-colors"
                >
                    ĐĂNG XUẤT
                </button>
            </div>
        </aside>
    );
}