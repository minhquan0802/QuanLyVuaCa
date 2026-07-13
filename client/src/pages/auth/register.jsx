import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function Register() {
    const navigate = useNavigate();

    const { showToast } = useToast();

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [address, setAddress] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [resending, setResending] = useState(false);

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        setError("");

        if (!fullName || !email || !phoneNumber || !address || !password || !confirmPassword) {
            const msg = "Vui lòng điền đầy đủ các thông tin bắt buộc (*).";
            setError(msg);
            showToast(msg, "error");
            return;
        }

        if (password !== confirmPassword) {
            const msg = "Mật khẩu xác nhận không trùng khớp.";
            setError(msg);
            showToast(msg, "error");
            return;
        }

        setLoading(true);

        try {
            const nameParts = fullName.trim().split(" ");
            const ten = nameParts.length > 0 ? nameParts.pop() : "";
            const ho = nameParts.join(" ");

            const newUser = {
                ho: ho,
                ten: ten,
                email: email,
                matkhau: password,
                sodienthoai: phoneNumber,
                diachi: address,
                vaitro: "CUSTOMER"
            };

            await api.post("/tai-khoan", newUser);
            setRegistered(true);

        } catch (err) {
            console.error(err);
            const status = err.response?.status;
            const message = err.response?.data?.message;
            let msg = "";

            if (status === 400 && message) {
                msg = message;
            } else if (err.message?.includes("Failed to fetch")) {
                msg = "Lỗi kết nối hệ thống (Network/CORS). Vui lòng thử lại sau.";
            } else {
                msg = message || "Có lỗi xảy ra trong quá trình đăng ký, vui lòng thử lại.";
            }

            setError(msg);
            showToast(msg, "error");
        } finally {
            setLoading(false);
        }
    }

    const handleLogin = () => {
        navigate('/');
    }

    return (
        <div className="font-body min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden selection:bg-cyan-500/20 selection:text-cyan-900">
            <style>{`
                input::-ms-reveal,
                input::-ms-clear {
                    display: none;
                }
            `}</style>

            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/20 blur-[120px] animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/20 blur-[120px]"></div>

            <div className="w-full max-w-md p-4 relative z-10 my-10">
                <div className="flex flex-col items-center p-8 sm:p-10 bg-white shadow-2xl shadow-cyan-100/40 rounded-3xl ring-1 ring-slate-200">

                    <div className="mb-6 flex flex-col items-center gap-2 cursor-pointer group" onClick={() => navigate('/')}>
                        <h2 className="font-display text-2xl font-bold text-cyan-900 tracking-tight">
                            <span className="text-cyan-600">Vựa cá Điêu Hồng</span>
                        </h2>
                    </div>

                    {registered ? (
                        <div className="w-full text-center py-4">
                            <div className="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-7 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mb-2">Đăng ký thành công!</h2>
                            <p className="text-sm text-slate-500 mb-4">
                                Chúng tôi đã gửi email xác thực đến <span className="font-bold text-slate-700">{email}</span>.<br />
                                Vui lòng kiểm tra hộp thư và click vào link xác thực.
                            </p>
                            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-xs text-cyan-700 mb-6">
                                Sau khi xác thực email, tài khoản sẽ chờ quản trị viên phê duyệt trước khi sử dụng được.
                            </div>
                            <button onClick={() => navigate('/login')} className="w-full h-11 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 transition-colors text-sm mb-3">
                                Về trang đăng nhập
                            </button>
                            <button
                                disabled={resending}
                                onClick={async () => {
                                    setResending(true);
                                    try {
                                        await api.post(`/tai-khoan/resend-verification?email=${encodeURIComponent(email)}`);
                                        showToast("Đã gửi lại email xác thực!", "success");
                                    } catch {
                                        showToast("Gửi lại thất bại, vui lòng thử lại sau.", "error");
                                    } finally {
                                        setResending(false);
                                    }
                                }}
                                className="w-full text-sm text-slate-400 hover:text-cyan-600 transition-colors disabled:opacity-50"
                            >
                                {resending ? "Đang gửi..." : "Không nhận được email? Gửi lại"}
                            </button>
                        </div>
                    ) : (
                    <>
                    <div className="text-center mb-6">
                        <h1 className="text-xl font-bold text-slate-800">Tạo tài khoản mới</h1>
                    </div>

                    {error && (
                        <div className="w-full mb-6 p-3 rounded-lg bg-red-50 border border-red-100 flex items-center gap-2 text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <form className="w-full flex flex-col gap-4" onSubmit={handleRegister}>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Họ và Tên <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Địa chỉ Email <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="email@example.com"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Số điện thoại <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    required
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="0909xxxxxx"
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Địa chỉ <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type="text"
                                    required
                                    value={address}
                                    onChange={(e) => setAddress(e.target.value)}
                                    className="w-full h-12 px-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="Số nhà, Tên đường..."
                                />
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Mật khẩu <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="group">
                            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Xác nhận Mật khẩu <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full h-12 mt-4 flex items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-base transition-all duration-300 shadow-lg shadow-cyan-100 hover:bg-cyan-700 hover:shadow-cyan-200 transform active:scale-[0.98] ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            {loading ? (
                                <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                "Đăng Ký"
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-slate-500">
                        Đã có tài khoản? <a href="#" onClick={handleLogin} className="font-bold text-cyan-600 hover:text-cyan-800 transition-colors">Đăng nhập ngay</a>
                    </div>
                    </>
                    )}

                </div>
            </div>
        </div>
    )
}