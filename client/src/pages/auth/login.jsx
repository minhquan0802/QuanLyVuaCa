import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";

export default function Login() {
    const navigate = useNavigate();
    const { setUser } = useAuth();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        if (e) e.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Vui lòng nhập đầy đủ email và mật khẩu.");
            return;
        }

        setLoading(true);
        try {
            const { data } = await api.post("/auth/token", { email, password });
            const result = data.result;

            if (!result?.authenticated) throw new Error("Đăng nhập thất bại");

            const { data: infoData } = await api.get("/tai-khoan/my-info");
            const userInfo = infoData.result;
            
            setUser(userInfo);
            navigate(userInfo?.vaitro === "ADMIN" ? '/admin' : '/home');

        } catch (err) {
            const status = err.response?.status;
            const code = err.response?.data?.code;
            if (status === 403 || code === 1028) {
                setError("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            } else if (status === 401) {
                setError("Email hoặc mật khẩu không chính xác.");
            } else {
                setError("Có lỗi xảy ra, vui lòng thử lại.");
            }
        } finally {
            setLoading(false);
        }
    }

    const handleRegister = () => { navigate('/register'); }

    return (
        <div className="font-body min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-900">
            <style>{`
                input::-ms-reveal, input::-ms-clear { display: none; }
            `}</style>

            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/10 blur-[120px]"></div>

            <div className="w-full max-w-[420px] p-4 relative z-10">
                <div className="flex flex-col items-center p-8 bg-white shadow-xl shadow-cyan-100/30 rounded-2xl ring-1 ring-slate-200">

                    <div className="mb-6 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                        <h2 className="font-display text-2xl font-bold text-cyan-950 tracking-tight">
                            <span className="text-cyan-600">Vựa cá Điêu Hồng</span>
                        </h2>
                    </div>

                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-slate-700">Đăng nhập hệ thống</h1>
                    </div>

                    {error && (
                        <div className="w-full mb-5 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm font-medium">
                            {error}
                        </div>
                    )}

                    <form className="w-full flex flex-col gap-4" onSubmit={handleLogin}>
                        <div className="group">
                            <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Email</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ví dụ: quanly@fish.com"
                                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Mật khẩu</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-11 pl-4 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="Nhập mật khẩu"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="text-[11px] text-slate-400 text-center cursor-pointer hover:text-cyan-600 mt-1" onClick={() => {setEmail('admin@gmail.com'); setPassword('123456789')}}>
                            (Click điền nhanh: admin@gmail.com / 123456789)
                        </div>

                        <div className="flex justify-end -mt-2">
                            <a href="#" className="text-sm font-medium text-cyan-600 hover:text-cyan-800 transition-colors">
                                Quên mật khẩu?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-11 mt-2 flex items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-base transition-all duration-300 shadow-md shadow-cyan-100 hover:bg-cyan-700 hover:shadow-cyan-200 transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Đăng nhập"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Chưa có tài khoản? <a href="#" onClick={handleRegister} className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors">Đăng ký ngay</a>
                    </div>

                </div>
            </div>
        </div>
    )
}