import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Cookies from "js-cookie";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";

const COOKIE_OPTS = { expires: 1, path: "/", sameSite: "Lax" };

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Vui lòng nhập đầy đủ Email và Mật khẩu.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/token", { email, password });
            const result = data.result;

            if (!result?.authenticated) throw new Error("Đăng nhập thất bại");

            // Lưu token vào cookie để axios interceptor tự gắn header
            Cookies.set("token", result.token, COOKIE_OPTS);

            // Lấy thông tin user từ server
            const { data: infoData } = await api.get("/tai-khoan/my-info");
            const userInfo = infoData.result;
            console.log("User Info:", userInfo);

            // Lưu vào React Context
            setUser(userInfo);

            // idvaitro: 1 = Admin, 5 = Khách Sỉ, 6 = Khách Lẻ
            navigate(userInfo?.vaitro === "ADMIN" ? '/admin' : '/home');

        } catch (err) {
            console.error(err);
            setError(err.message || "Email hoặc mật khẩu không chính xác.");
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = () => { navigate('/register'); }

    return (
        <div className="font-body min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-blue-200 selection:text-blue-900">
            <style>{`
                input::-ms-reveal, input::-ms-clear { display: none; }
            `}</style>

            {/* Background Decoration */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-400/10 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px]"></div>

            {/* Main Content: Tăng max-w lên 420px (Cỡ trung bình) */}
            <div className="w-full max-w-[420px] p-4 relative z-10">
                
                {/* Login Card: Tăng padding lên p-8 */}
                <div className="flex flex-col items-center p-8 bg-white shadow-xl shadow-blue-100/50 rounded-2xl ring-1 ring-slate-200">

                    {/* Logo Section */}
                    <div className="mb-6 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                        {/* Icon to hơn một chút: size-14 */}
                        <div className="flex items-center justify-center size-14 rounded-full bg-blue-50 text-blue-600 mb-1 ring-1 ring-blue-100 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                            <span className="material-symbols-outlined text-3xl">phishing</span>
                        </div>
                        <h2 className="font-display text-2xl font-bold text-blue-900 tracking-tight">
                            Minh Quân <span className="text-blue-500">Fresh</span>
                        </h2>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-slate-700">Đăng nhập hệ thống</h1>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="w-full mb-5 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm font-medium">
                            <span className="material-symbols-outlined text-lg">error</span>
                            {error}
                        </div>
                    )}

                    {/* Login Form: Tăng gap lên 4 */}
                    <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
                    
                        {/* Email Input: Tăng chiều cao lên h-11 (44px) */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <span className="material-symbols-outlined text-[20px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">mail</span>
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ví dụ: quanly@fish.com"
                                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        {/* Password Input: h-11 */}
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Mật khẩu</label>
                            <div className="relative">
                                <span className="material-symbols-outlined text-[20px] absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors">lock</span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 pl-11 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:bg-white transition-all"
                                    placeholder="Nhập mật khẩu"
                                    onKeyDown={(e) => e.key === 'Enter' && handleLogin(e)}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Text admin demo */}
                        <div className="text-[11px] text-slate-400 text-center cursor-pointer hover:text-blue-500 mt-1" onClick={() => {setEmail('admin@gmail.com'); setPassword('123456789')}}>
                            (Click điền nhanh: admin@gmail.com / 123456789)
                        </div>

                        {/* Forgot Password */}
                        <div className="flex justify-end -mt-2">
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                Quên mật khẩu?
                            </a>
                        </div>

                        {/* Submit Button: h-11 */}
                        <button
                            onClick={handleLogin}
                            disabled={loading}
                            className={`w-full h-11 mt-2 flex items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base transition-all duration-300 shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    {/* Register Link */}
                    <div className="mt-6 text-center text-sm text-slate-500">
                        Chưa có tài khoản? <a href="#" onClick={handleRegister} className="font-bold text-blue-600 hover:text-blue-800 transition-colors">Đăng ký ngay</a>
                    </div>

                </div>
            </div>
        </div>
    )
}