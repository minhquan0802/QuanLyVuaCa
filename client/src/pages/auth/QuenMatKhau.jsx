import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../../config/axios";

export default function QuenMatKhau() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        setStatus("loading");
        setErrorMsg("");
        try {
            await api.post(`/tai-khoan/quen-mat-khau?email=${encodeURIComponent(email)}`);
            setStatus("success");
        } catch (err) {
            const code = err.response?.data?.code;
            if (code === 1028) {
                setErrorMsg("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
            } else if (code === 1030) {
                setErrorMsg("Tài khoản chưa xác thực email. Vui lòng xác thực trước.");
            } else if (code === 1005) {
                setErrorMsg("Không tìm thấy tài khoản với email này.");
            } else {
                setErrorMsg("Có lỗi xảy ra. Vui lòng thử lại sau.");
            }
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/10 blur-[120px]" />

            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white rounded-2xl shadow-xl shadow-cyan-100/30 ring-1 ring-slate-200 p-8">

                    <div className="text-center mb-7">
                        <div className="size-14 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 text-cyan-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-slate-800">Quên mật khẩu?</h1>
                        <p className="text-sm text-slate-500 mt-1">Nhập email và chúng tôi sẽ gửi link đặt lại mật khẩu.</p>
                    </div>

                    {status === "success" ? (
                        <div className="text-center">
                            <div className="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-7 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-base font-bold text-slate-800 mb-2">Đã gửi email!</h2>
                            <p className="text-sm text-slate-500 mb-1">
                                Kiểm tra hộp thư của <span className="font-semibold text-slate-700">{email}</span>
                            </p>
                            <p className="text-sm text-slate-500 mb-6">Link có hiệu lực trong <strong>1 giờ</strong>.</p>
                            <Link to="/login" className="text-sm font-bold text-cyan-600 hover:text-cyan-800 transition-colors">
                                ← Quay lại đăng nhập
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {status === "error" && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                    {errorMsg}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Email</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Nhập email đã đăng ký"
                                    required
                                    className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === "loading" || !email}
                                className="w-full h-11 flex items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50"
                            >
                                {status === "loading" ? (
                                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    "Gửi link đặt lại mật khẩu"
                                )}
                            </button>

                            <div className="text-center">
                                <Link to="/login" className="text-sm text-slate-500 hover:text-cyan-600 transition-colors">
                                    ← Quay lại đăng nhập
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
