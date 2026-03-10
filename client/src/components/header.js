import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    
    // --- STATE QUẢN LÝ USER ---
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef(null); 

    // --- STATE QUẢN LÝ SỐ LƯỢNG GIỎ HÀNG ---
    const [cartCount, setCartCount] = useState(0);

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { label: "Trang chủ", path: "/home" },
        { label: "Sản phẩm", path: "/home" }, 
    ];

    // --- 1. LOGIC GIẢI MÃ TOKEN ---
    const parseJwt = (token) => {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    };

    // --- HÀM CẬP NHẬT GIỎ HÀNG ---
    const updateCartCount = () => {
        const storedCart = localStorage.getItem("cart");
        if (storedCart) {
            const cartItems = JSON.parse(storedCart);
            setCartCount(cartItems.length);
        } else {
            setCartCount(0);
        }
    };

    useEffect(() => {
        // Xử lý User Token
        const token = localStorage.getItem("token");
        if (token) {
            const decoded = parseJwt(token);
            if (decoded) {
                setUser({
                    email: decoded.sub, 
                    role: decoded.role  
                });
            }
        }

        // Xử lý Click Outside Dropdown
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);

        // --- KHỞI TẠO & LẮNG NGHE SỰ KIỆN GIỎ HÀNG ---
        updateCartCount(); 
        window.addEventListener("storage", updateCartCount);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("storage", updateCartCount); 
        };

    }, []);

    const handleNavigation = (path) => {
        navigate(path);
        setIsMobileMenuOpen(false);
        setIsDropdownOpen(false);
    };

    const handleLogout = () => {
        localStorage.clear(); 
        setUser(null);
        setIsDropdownOpen(false);
        setCartCount(0); 
        navigate("/");
    };

    return (
        <>
            <header className="sticky top-4 z-50 w-full px-4">

                <div className="mx-auto max-w-7xl">
                    <div className="relative flex items-center justify-between rounded-xl bg-blue-600 shadow-lg shadow-blue-200 ring-1 ring-white/10 transition-all duration-300 px-4 py-2">                        {/* 1. LOGO SECTION */}
                        
                        {/* 1. LOGO SECTION */}
                        <div
                            onClick={() => handleNavigation('/home')}
                            className="flex items-center gap-2 cursor-pointer group"
                        >
                            <div className="relative flex items-center justify-center size-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                                <span className="material-symbols-outlined text-xl text-white">phishing</span>
                            </div>
                            <h2 className="font-display text-lg md:text-xl font-bold text-white tracking-tight">
                                Minh Quân Fresh
                            </h2>
                        </div>

                        {/* 2. DESKTOP NAVIGATION */}
                        <nav className="hidden md:flex items-center gap-8">
                            {navItems.map((item) => (
                                <button
                                    key={item.path}
                                    onClick={() => handleNavigation(item.path)}
                                    className={`relative text-sm font-medium transition-colors duration-300 ${isActive(item.path)
                                        ? "text-white font-bold"
                                        : "text-blue-100 hover:text-white"
                                        }`}
                                >
                                    {item.label}
                                </button>
                            ))}
                        </nav>

                        {/* 3. ACTIONS */}
                        <div className="flex items-center gap-3">

                            {/* --- USER BUTTON --- */}
                            <div className="relative" ref={dropdownRef}>
                                {user ? (
                                    <>
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className="hidden md:flex items-center justify-center size-10 rounded-full bg-white/20 text-white hover:bg-white/30 transition-all duration-300 ring-2 ring-transparent hover:ring-white/50"
                                            title={`Xin chào, ${user.email}`}
                                        >
                                            <span className="material-symbols-outlined">person</span>
                                        </button>

                                        {/* Dropdown Menu (Desktop) */}
                                        {isDropdownOpen && (
                                            <div className="absolute right-0 top-full mt-3 w-56 bg-white rounded-xl shadow-2xl ring-1 ring-black/5 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right">
                                                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                                                    <p className="text-xs text-gray-500 font-medium">Đang đăng nhập:</p>
                                                    <p className="text-sm font-bold text-blue-900 truncate">{user.email}</p>
                                                </div>
                                                
                                                <div className="py-1">
                                                    <button 
                                                        onClick={() => handleNavigation('/profile')}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                                    >
                                                        <span className="material-symbols-outlined text-lg">account_circle</span>
                                                        Hồ sơ cá nhân
                                                    </button>

                                                    {/* --- [MỚI] THEO DÕI ĐƠN HÀNG (Ẩn với Admin) --- */}
                                                    {user.role !== 'admin' && (
                                                        <button 
                                                            onClick={() => handleNavigation('/my-orders')}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">receipt_long</span>
                                                            Theo dõi đơn hàng
                                                        </button>
                                                    )}

                                                    {user.role === 'admin' && (
                                                        <button 
                                                            onClick={() => handleNavigation('/admin')}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-2"
                                                        >
                                                            <span className="material-symbols-outlined text-lg">dashboard</span>
                                                            Trang quản trị
                                                        </button>
                                                    )}
                                                    
                                                    <div className="border-t border-gray-100 my-1"></div>

                                                    <button 
                                                        onClick={handleLogout}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
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
                                        onClick={() => handleNavigation('/')}
                                        className="hidden md:flex items-center justify-center size-10 rounded-full text-white hover:bg-white/20 transition-all duration-300"
                                        title="Đăng nhập"
                                    >
                                        <span className="material-symbols-outlined">login</span>
                                    </button>
                                )}
                            </div>

                            {/* --- CART BUTTON --- */}
                            <button
                                onClick={() => handleNavigation('/cart')}
                                className="relative flex items-center justify-center size-10 rounded-full bg-white text-blue-600 shadow-md hover:bg-blue-50 hover:text-blue-700 hover:-translate-y-0.5 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                                
                                {cartCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-blue-600 animate-in zoom-in duration-300">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </button>

                            {/* Mobile Hamburger Button */}
                            <button
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                                className="md:hidden flex items-center justify-center size-10 rounded-full text-white hover:bg-white/10 transition-colors"
                            >
                                <span className="material-symbols-outlined">
                                    {isMobileMenuOpen ? 'close' : 'menu'}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* --- MOBILE MENU --- */}
                    {isMobileMenuOpen && (
                        <div className="md:hidden mx-4 mt-2 bg-white rounded-2xl shadow-xl ring-1 ring-black/5 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                            <div className="p-4 space-y-2">
                                {navItems.map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => handleNavigation(item.path)}
                                        className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors flex items-center gap-3 ${
                                            isActive(item.path) 
                                            ? "bg-blue-50 text-blue-600 font-bold" 
                                            : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                ))}

                                <div className="border-t border-gray-100 my-2 pt-2">
                                    {user ? (
                                        <>
                                            <div className="px-4 py-2 text-xs text-gray-500">
                                                Xin chào, <span className="font-bold text-blue-900">{user.email}</span>
                                            </div>
                                            
                                            <button
                                                onClick={() => handleNavigation('/profile')}
                                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3"
                                            >
                                                <span className="material-symbols-outlined text-lg">account_circle</span>
                                                Hồ sơ cá nhân
                                            </button>

                                            {/* --- [MỚI] THEO DÕI ĐƠN HÀNG MOBILE (Ẩn với Admin) --- */}
                                            {user.role !== 'admin' && (
                                                <button
                                                    onClick={() => handleNavigation('/my-orders')}
                                                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3"
                                                >
                                                    <span className="material-symbols-outlined text-lg">receipt_long</span>
                                                    Theo dõi đơn hàng
                                                </button>
                                            )}

                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={() => handleNavigation('/admin')}
                                                    className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-3"
                                                >
                                                    <span className="material-symbols-outlined text-lg">dashboard</span>
                                                    Trang quản trị
                                                </button>
                                            )}
                                            <button
                                                onClick={handleLogout}
                                                className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-3"
                                            >
                                                <span className="material-symbols-outlined text-lg">logout</span>
                                                Đăng xuất
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => handleNavigation('/')}
                                            className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 flex items-center gap-3 font-bold"
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