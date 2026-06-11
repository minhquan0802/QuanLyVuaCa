import { useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import api from "../../config/axios";

export default function DatLaiMatKhau() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [matkhauMoi, setMatkhauMoi] = useState("");
    const [xacNhanMatKhau, setXacNhanMatKhau] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [errorMsg, setErrorMsg] = useState("");

    if (!token) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                    <div className="size-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-7 text-red-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-slate-800 mb-2">Link không hợp lệ</h2>
                    <p className="text-sm text-slate-500 mb-6">Link đặt lại mật khẩu không hợp lệ.</p>
                    <Link to="/quen-mat-khau" className="text-sm font-bold text-cyan-600 hover:text-cyan-800">
                        Yêu cầu link mới
                    </Link>
                </div>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (matkhauMoi !== xacNhanMatKhau) {
            setErrorMsg("Mật khẩu xác nhận không khớp.");
            return;
        }

        setStatus("loading");
        setErrorMsg("");
        try {
            await api.post("/tai-khoan/dat-lai-mat-khau", { token, matkhauMoi });
            setStatus("success");
        } catch (err) {
            const code = err.response?.data?.code;
            if (code === 1032) {
                setErrorMsg("Link đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.");
            } else if (code === 1010) {
                setErrorMsg("Mật khẩu phải từ 8 đến 50 ký tự.");
            } else {
                setErrorMsg("Có lỗi xảy ra. Vui lòng thử lại.");
            }
            setStatus("error");
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-400/10 blur-[120px] animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-300/10 blur-[120px]" />

            <div className="w-full max-w-[420px] relative z-10">
                <div className="bg-white rounded-2xl shadow-xl shadow-cyan-100/30 border border-slate-200 p-8">

                    {status === "success" ? (
                        <div className="text-center">
                            <div className="size-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-7 text-green-500">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-bold text-slate-800 mb-2">Đặt lại thành công!</h2>
                            <p className="text-sm text-slate-500 mb-6">Mật khẩu mới của bạn đã được cập nhật.</p>
                            <button
                                onClick={() => navigate("/login")}
                                className="px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors text-sm"
                            >
                                Đăng nhập ngay
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-7">
                                <div className="size-14 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 text-cyan-600">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 0 1 21.75 8.25Z" />
                                    </svg>
                                </div>
                                <h1 className="text-xl font-bold text-slate-800">Đặt lại mật khẩu</h1>
                                <p className="text-sm text-slate-500 mt-1">Nhập mật khẩu mới cho tài khoản của bạn.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                {status === "error" && (
                                    <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm">
                                        {errorMsg}
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Mật khẩu mới</label>
                                    <div className="relative">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={matkhauMoi}
                                            onChange={(e) => setMatkhauMoi(e.target.value)}
                                            placeholder="Tối thiểu 8 ký tự"
                                            required
                                            className="w-full h-11 pl-4 pr-11 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors"
                                        >
                                            <span className="material-symbols-outlined text-[20px]">
                                                {showPassword ? "visibility_off" : "visibility"}
                                            </span>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-slate-600 mb-1.5 ml-1">Xác nhận mật khẩu</label>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={xacNhanMatKhau}
                                        onChange={(e) => setXacNhanMatKhau(e.target.value)}
                                        placeholder="Nhập lại mật khẩu mới"
                                        required
                                        className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:bg-white transition-all"
                                    />
                                </div>

                                {matkhauMoi && xacNhanMatKhau && matkhauMoi !== xacNhanMatKhau && (
                                    <p className="text-xs text-red-500 -mt-2 ml-1">Mật khẩu xác nhận không khớp.</p>
                                )}

                                <button
                                    type="submit"
                                    disabled={status === "loading" || !matkhauMoi || !xacNhanMatKhau}
                                    className="w-full h-11 flex items-center justify-center rounded-xl bg-cyan-600 text-white font-bold text-sm hover:bg-cyan-700 transition-colors disabled:opacity-50 mt-1"
                                >
                                    {status === "loading" ? (
                                        <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        "Cập nhật mật khẩu"
                                    )}
                                </button>

                                <div className="text-center">
                                    <Link to="/login" className="text-sm text-slate-500 hover:text-cyan-600 transition-colors">
                                        ← Quay lại đăng nhập
                                    </Link>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
