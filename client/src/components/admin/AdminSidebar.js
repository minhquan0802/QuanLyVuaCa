import { useNavigate, useLocation } from "react-router-dom";
import { DangXuat } from "../../utils/fetchAPI";

export default function AdminSidebar() {
    const navigate = useNavigate();
    const location = useLocation();

    // Danh sách menu theo yêu cầu của bạn
    const menuItems = [
        { icon: "dashboard", label: "Dashboard", path: "/admin" },
        { icon: "set_meal", label: "Quản lý Loại Cá", path: "/admin/QuanLyLoaiCa" },
        { icon: "manage_accounts", label: "Quản lý Tài Khoản", path: "/admin/QuanLyTaiKhoan" },
        { icon: "receipt_long", label: "Quản lý Đơn Hàng", path: "/admin/QuanLyDonHang" },
        { icon: "local_offer", label: "Quản lý Bảng Giá", path: "/admin/QuanLyBangGia" },
        { icon: "inventory_2", label: "Quản lý Kho Hàng", path: "/admin/QuanLyKho" },
    ];

    const isActive = (path) => {
        // Logic active đơn giản: nếu đường dẫn hiện tại bắt đầu bằng path của menu thì active
        if (path === "/admin" && location.pathname !== "/admin") return false;
        return location.pathname.startsWith(path);
    };

    const handleLogout = () => {
        // Xóa thông tin đăng nhập và chuyển về trang login
        DangXuat();
    }

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-50 shadow-sm font-body">
            {/* 1. Logo Area */}
            <div className="h-16 flex items-center px-6 border-b border-gray-100">
                <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
                    <div className="size-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-blue-200 shadow-md">
                        <span className="material-symbols-outlined text-xl">phishing</span>
                    </div>
                    <span className="font-display font-bold text-lg text-slate-800 tracking-tight">Vựa Cá Admin</span>
                </div>
            </div>

            {/* 2. Menu Navigation */}
            <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                {menuItems.map((item) => (
                    <button
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive(item.path)
                                ? "bg-blue-50 text-blue-600 shadow-sm" // Active style: Nền xanh nhạt, chữ xanh đậm
                                : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                        }`}
                    >
                        <span className={`material-symbols-outlined text-[22px] ${isActive(item.path) ? "fill-current" : ""}`}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </nav>

            {/* 3. User Profile & Logout (Bottom) */}
            <div className="p-4 border-t border-gray-100 bg-slate-50/50">
                <div className="flex items-center gap-3 px-2 mb-4">
                    <div className="size-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold ring-2 ring-white shadow-sm">
                        CV
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-slate-800 truncate">Chủ Vựa</p>
                        <p className="text-xs text-slate-500 truncate">admin@vuaca.vn</p>
                    </div>
                </div>
                
                <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                >
                    <span className="material-symbols-outlined text-[20px]">logout</span>
                    Đăng Xuất
                </button>
            </div>
        </aside>
    );
}