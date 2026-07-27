import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext"; 

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const isAdmin = user.vaitro === "ADMIN";

    const menuItems = [
        { label: "Dashboard",          path: "/admin",                adminOnly: true  },
        { label: "Quản lý Loại Cá",   path: "/admin/QuanLyLoaiCa",  adminOnly: true  },
        { label: "Quản lý Bảng Giá",  path: "/admin/QuanLyBangGia",  adminOnly: true  },
        { label: "Quản lý Kho Hàng",  path: "/admin/QuanLyKho",      adminOnly: false },
        { label: "Quản lý Thanh Lý",  path: "/admin/QuanLyThanhLy", adminOnly: true  },
        { label: "Quản lý Tài Khoản", path: "/admin/QuanLyTaiKhoan", adminOnly: true  },
        { label: "Quản lý Đơn Hàng",  path: "/admin/QuanLyDonHang",  adminOnly: false },
        { label: "Quản lý Công Nợ",   path: "/admin/QuanLyCongNo",   adminOnly: false },
    ].filter(item => isAdmin || !item.adminOnly);

    const isActive = (path) => {
        if (path === "/admin" && location.pathname !== "/admin") return false;
        return location.pathname.startsWith(path);
    };

    return (
        <aside className="w-64 bg-cyan-600 border-r border-black flex flex-col h-screen fixed left-0 top-0 z-50 font-body text-cyan-50">
            <div className="h-20 flex items-center px-5 border-b border-black">
                <div className="flex items-center gap-3 cursor-pointer select-none">
                    <span className="font-display font-black text-lg leading-tight tracking-wide text-white uppercase">
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
                                    ? "bg-cyan-800 text-white border border-cyan-900 shadow-inner"
                                    : "text-cyan-50 hover:bg-cyan-700 hover:text-white"
                            }`}
                        >
                            <span className="truncate">{item.label}</span>
                        </button>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-black bg-cyan-600">
                <div className="flex items-center gap-3 px-1 mb-4">
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-white truncate">{user.ho}{user.ten}</p>
                        <p className="text-[11px] text-cyan-100 truncate">{user.email}</p>
                    </div>
                </div>
                
                <button 
                    onClick={logout}
                    className="w-full flex items-center justify-center py-2.5 rounded-lg text-xs font-bold text-white bg-cyan-700 hover:bg-cyan-800 hover:text-rose-100 border border-black transition-colors"
                >
                    ĐĂNG XUẤT
                </button>
            </div>
        </aside>
    );
}
