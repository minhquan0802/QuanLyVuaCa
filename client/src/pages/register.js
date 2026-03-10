import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
    const navigate = useNavigate();
    
    // State quản lý form
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState(""); // Thêm sđt
    const [address, setAddress] = useState("");         // Thêm địa chỉ
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    
    // State hiển thị mật khẩu
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // State xử lý lỗi/loading
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    // Cấu hình URL API
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa";

    const handleRegister = async (e) => {
        e.preventDefault();
        setError("");

        // 1. Validate các trường BẮT BUỘC (Tên, Email, Pass)
        if (!fullName || !email || !password || !confirmPassword) {
            setError("Vui lòng điền các thông tin bắt buộc (*).");
            return;
        }

        if (password !== confirmPassword) {
            setError("Mật khẩu xác nhận không khớp.");
            return;
        }

        setLoading(true);

        try {
            // 2. Xử lý dữ liệu
            const nameParts = fullName.trim().split(" ");
            const ten = nameParts.length > 0 ? nameParts.pop() : "";
            const ho = nameParts.join(" ");

            const newId = crypto.randomUUID();

            // Tạo object User với đầy đủ thông tin
            const newUser = {
                idtaikhoan: newId,
                ho: ho,
                ten: ten,
                email: email,
                matkhau: password,
                // Các trường không bắt buộc: gửi chuỗi rỗng hoặc null nếu không nhập
                sodienthoai: phoneNumber || null,
                diachi: address || null,
                idvaitro: 3, 
                trangthaitk: "HOAT_DONG"
            };

            // 3. Gọi API
            const res = await fetch(`${APP_BASE_URL}/TaiKhoans`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(newUser),
            });

            if (!res.ok) {
                throw new Error("Đăng ký thất bại. Email có thể đã tồn tại.");
            }

            alert("Đăng ký tài khoản thành công! Vui lòng đăng nhập.");
            navigate('/');

        } catch (err) {
            console.error("Lỗi đăng ký:", err);
            if (err.message.includes("Failed to fetch")) {
                setError("Lỗi kết nối Server (CORS/Network). Vui lòng kiểm tra Backend.");
            } else {
                setError("Có lỗi xảy ra: " + err.message);
            }
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = () => {
        navigate('/'); 
    }

    return (
        <div className="font-body min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-blue-200 selection:text-blue-900">
            {/* CSS Fix: Ẩn con mắt mặc định của trình duyệt (Edge/IE) để tránh bị 2 con mắt */}
            <style>{`
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
            `}</style>

            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px]"></div>

            {/* Main Content */}
            <div className="w-full max-w-md p-4 relative z-10 my-10">
                <div className="flex flex-col items-center p-8 sm:p-10 bg-white shadow-2xl shadow-blue-100 rounded-3xl ring-1 ring-slate-200">

                    {/* Logo Section */}
                    <div className="mb-6 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                        <div className="flex items-center justify-center size-12 rounded-full bg-blue-50 text-blue-600 mb-1 ring-1 ring-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <span className="material-symbols-outlined text-3xl">phishing</span>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-blue-900 tracking-tight">
                            Minh Quân <span className="text-blue-500">Fresh</span>
                        </h2>
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-slate-800">Tạo tài khoản mới</h1>
                    </div>

                    {error && (
                        <div className="w-full mb-6 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    <form className="w-full flex flex-col gap-4" onSubmit={handleRegister}>

                        {/* Full Name */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Họ và Tên <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">badge</span>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Địa chỉ Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">mail</span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        {/* Phone Number (Optional) */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Số điện thoại <span className="text-slate-400 font-normal text-xs">(Tùy chọn)</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">call</span>
                                <input
                                    type="tel"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="0909xxxxxx"
                                />
                            </div>
                        </div>

                        {/* Address (Optional) */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Địa chỉ <span className="text-slate-400 font-normal text-xs">(Tùy chọn)</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">home_pin</span>
                                <input
                                    type="text"
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="Số nhà, Tên đường..."
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-11 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Xác nhận Mật khẩu <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">lock_reset</span>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 pl-11 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-12 mt-4 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Đăng Ký"
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center text-sm text-slate-500">
                        Đã có tài khoản? <a href="#" onClick={handleLogin} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">Đăng nhập ngay</a>
                    </div>

                </div>
            </div>
        </div>
    )
}