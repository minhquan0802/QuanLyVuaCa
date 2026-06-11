import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import api from "../../config/axios";

export default function XacThucEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");
    const [resendEmail, setResendEmail] = useState("");
    const [resending, setResending] = useState(false);
    const [resendMsg, setResendMsg] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setMessage("Link xác thực không hợp lệ.");
            return;
        }

        api.get(`/tai-khoan/verify-email?token=${token}`)
            .then((res) => {
                setStatus("success");
                setMessage(res.data?.result || "Xác thực email thành công!");
            })
            .catch((err) => {
                setStatus("error");
                setMessage(
                    err.response?.data?.message ||
                    "Link xác thực không hợp lệ hoặc đã hết hạn."
                );
            });
    }, [token]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
                {status === "loading" && (
                    <>
                        <div className="size-16 rounded-full bg-cyan-50 flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-cyan-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">Đang xác thực...</h2>
                        <p className="text-slate-500 text-sm">Vui lòng chờ trong giây lát.</p>
                    </>
                )}

                {status === "success" && (
                    <>
                        <div className="size-16 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8 text-green-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Xác thực thành công!</h2>
                        <p className="text-slate-600 text-sm mb-6">{message}</p>
                        <div className="bg-cyan-50 rounded-xl p-4 text-sm text-cyan-700 border border-cyan-100 mb-6">
                            Tài khoản của bạn đang chờ quản trị viên phê duyệt. Chúng tôi sẽ thông báo khi tài khoản được kích hoạt.
                        </div>
                        <Link to="/login" className="inline-block px-6 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors text-sm">
                            Về trang đăng nhập
                        </Link>
                    </>
                )}

                {status === "error" && (
                    <>
                        <div className="size-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-8 text-red-500">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-3">Xác thực thất bại</h2>
                        <p className="text-slate-600 text-sm mb-6">{message}</p>

                        <div className="border-t border-slate-100 pt-5 mt-2">
                            <p className="text-xs text-slate-400 mb-3">Link hết hạn? Nhập email để nhận link mới:</p>
                            <input
                                type="email"
                                placeholder="Email đã đăng ký"
                                value={resendEmail}
                                onChange={e => setResendEmail(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-cyan-500 mb-2"
                            />
                            {resendMsg && <p className="text-xs text-cyan-600 mb-2">{resendMsg}</p>}
                            <button
                                disabled={resending || !resendEmail}
                                onClick={async () => {
                                    setResending(true);
                                    try {
                                        await api.post(`/tai-khoan/resend-verification?email=${encodeURIComponent(resendEmail)}`);
                                        setResendMsg("Đã gửi! Vui lòng kiểm tra hộp thư.");
                                    } catch {
                                        setResendMsg("Gửi thất bại. Email có thể không đúng hoặc đã xác thực rồi.");
                                    } finally {
                                        setResending(false);
                                    }
                                }}
                                className="w-full h-10 rounded-xl bg-cyan-600 text-white text-sm font-bold hover:bg-cyan-700 transition-colors disabled:opacity-50"
                            >
                                {resending ? "Đang gửi..." : "Gửi lại email xác thực"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
