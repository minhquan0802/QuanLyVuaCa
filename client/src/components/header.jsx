import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import api from "../config/axios";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const { totalItems } = useCart();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    // --- THÔNG BÁO ---
    const [thongBaoList, setThongBaoList] = useState([]);
    const [soChuaXem, setSoChuaXem] = useState(0);
    const [isThongBaoOpen, setIsThongBaoOpen] = useState(false);
    const thongBaoRef = useRef(null);

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
            if (thongBaoRef.current && !thongBaoRef.current.contains(event.target)) {
                setIsThongBaoOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Chỉ tải & lắng nghe thông báo khi đã đăng nhập
    useEffect(() => {
        if (!user) return;

        api.get("/ThongBao").then(res => setThongBaoList(res.data.result || [])).catch(() => {});
        api.get("/ThongBao/chua-xem").then(res => setSoChuaXem(res.data.result || 0)).catch(() => {});

        const eventSource = new EventSource(`${import.meta.env.VITE_BE_URL}/ThongBao/subscribe`, { withCredentials: true });
        eventSource.addEventListener("thongbao", (e) => {
            const thongBaoMoi = JSON.parse(e.data);
            setThongBaoList(prev => [thongBaoMoi, ...prev]);
            setSoChuaXem(prev => prev + 1);
        });

        return () => eventSource.close();
    }, [user]);

    const handleClickThongBao = async (thongBao) => {
        if (!thongBao.daxem) {
            try {
                await api.put(`/ThongBao/${thongBao.idthongbao}/da-xem`);
                setThongBaoList(prev => prev.map(tb => tb.idthongbao === thongBao.idthongbao ? { ...tb, daxem: true } : tb));
                setSoChuaXem(prev => Math.max(0, prev - 1));
            } catch { /* bỏ qua, vẫn cho điều hướng */ }
        }
        setIsThongBaoOpen(false);
        if (thongBao.link) navigate(thongBao.link);
    };

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsDropdownOpen(false);
    };

    const handleLogout = () => {
        setIsDropdownOpen(false);
        logout();
    };

    return (
        <>
            {/* Đưa sát lên đỉnh bằng top-0, loại bỏ padding px-4 dư thừa */}
            <header className="sticky top-0 z-50 w-full">
                <div className="w-full">
                    {/* Bỏ rounded-xl để full màn hình, shadow phủ đều bên dưới */}
                    <div className="relative flex items-center justify-between bg-cyan-600 shadow-md shadow-cyan-200/40 ring-1 ring-white/10 transition-all duration-300 px-6 py-3">

                        {/* 1. LOGO SECTION */}
                        <div
                            onClick={() => handleNavigation('/home')}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <h2 className="font-display text-lg md:text-xl font-bold text-white tracking-tight">
                                Vựa cá Điêu Hồng
                            </h2>
                        </div>

                        {/* 2. ACTIONS */}
                        <div className="flex items-center gap-3">

                            {/* --- USER BUTTON --- */}
                            <div className="relative" ref={dropdownRef}>
                                {user ? (
                                    <>
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="hidden md:flex items-center justify-center size-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300 ring-2 ring-transparent hover:ring-white/50 cursor-pointer"
                                            title={`Xin chào, ${user.email}`}
                                        >
                                            <span className="material-symbols-outlined">person</span>
                                        </button>

                                        {/* Dropdown Menu (Desktop) */}
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                                <div className="py-1">
                                                    <button
                                                        onClick={() => handleNavigation('/profile')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">account_circle</span>
                                                        Hồ sơ cá nhân
                                                    </button>

                                                    <button
                                                        onClick={() => handleNavigation('/my-orders')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-cyan-50 hover:text-cyan-600 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">receipt_long</span>
                                                        Theo dõi đơn hàng
                                                    </button>


                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">logout</span>
                                                        Đăng xuất
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <button
                                        onClick={() => handleNavigation('/login')}
                                        className="hidden md:flex items-center justify-center size-10 rounded-full text-white hover:bg-white/20 transition-all duration-300 cursor-pointer"
                                        title="Đăng nhập"
                                    >
                                        <span className="material-symbols-outlined">login</span>
                                    </button>
                                )}
                            </div>

                            {/* --- NÚT THÔNG BÁO --- */}
                            {user && (
                                <div className="relative" ref={thongBaoRef}>
                                    <button
                                        onClick={() => setIsThongBaoOpen(prev => !prev)}
                                        className="relative flex items-center justify-center size-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300 cursor-pointer"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                                        {soChuaXem > 0 && (
                                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-cyan-600">
                                                {soChuaXem > 9 ? "9+" : soChuaXem}
                                            </span>
                                        )}
                                    </button>

                                    {isThongBaoOpen && (
                                        <div className="absolute right-0 top-full mt-3 w-80 max-w-[90vw] bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden z-50">
                                            <div className="px-4 py-3 border-b border-slate-100 font-bold text-sm text-slate-800">
                                                Thông báo
                                            </div>
                                            <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                                                {thongBaoList.length > 0 ? (
                                                    thongBaoList.map(tb => (
                                                        <button
                                                            key={tb.idthongbao}
                                                            onClick={() => handleClickThongBao(tb)}
                                                            className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!tb.daxem ? "bg-cyan-50/40" : ""}`}
                                                        >
                                                            <p className="text-sm text-slate-700 leading-snug">{tb.noidung}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{new Date(tb.thoigiantao).toLocaleString('vi-VN')}</p>
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-8 text-center text-sm text-slate-400 italic">Chưa có thông báo nào.</div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- CART BUTTON --- */}
                            <button
                                onClick={() => handleNavigation('/cart')}
                                className="relative flex items-center justify-center size-10 rounded-full bg-white text-cyan-600 shadow-md hover:bg-cyan-50 hover:text-cyan-700 hover:-translate-y-0.5 transition-all duration-300 cursor-pointer"
                            >
                                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>

                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-cyan-600 animate-in zoom-in duration-300">
                                        {totalItems > 99 ? '99+' : totalItems}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Hamburger Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden flex items-center justify-center size-10 rounded-full text-white hover:bg-white/10 transition-colors cursor-pointer"
                            >
                                <span className="material-symbols-outlined">
                                    {isMobileMenuOpen ? 'close' : 'menu'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* --- MOBILE MENU --- */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden w-full bg-white shadow-xl border-t border-slate-100 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 space-y-2">
                                <div className="pt-1">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-2 text-xs text-gray-500">
                                                Xin chào, <span className="font-bold text-cyan-900">{user.email}</span>
                                            </div>

                                            <button
                                                onClick={() => handleNavigation('/profile')}
                                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">account_circle</span>
                                                Hồ sơ cá nhân
                                            </button>

                                            {user?.vaitro === 'CUSTOMER' && (
                                                <button
                                                    onClick={() => handleNavigation('/my-orders')}
                                                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                                                    Theo dõi đơn hàng
                                                </button>
                                            )}

                                            {(user?.vaitro === 'ADMIN' || user?.vaitro === 'STAFF') && (
                                                <button
                                                    onClick={() => handleNavigation('/admin')}
                                                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3 cursor-pointer"
                                                >
                                                    <span className="material-symbols-outlined text-lg">dashboard</span>
                                                    Trang quản trị
                                                </button>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3 cursor-pointer"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                Đăng xuất
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleNavigation('/')}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-cyan-600 bg-cyan-50 hover:bg-cyan-100 flex items-center gap-3 font-bold cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-lg">login</span>
                                            Đăng nhập ngay
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </>
    );
}