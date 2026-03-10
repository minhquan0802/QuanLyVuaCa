import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

export default function OrderFailed() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // Lấy thông báo lỗi từ URL
    const errorMsg = searchParams.get("error") || "Giao dịch bị hủy hoặc lỗi hệ thống";

    return (
        <div className="bg-slate-50 font-body text-slate-600 min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow flex items-center justify-center p-4">
                <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl shadow-red-50 ring-1 ring-slate-200 p-8 md:p-12 text-center">
                    
                    {/* Icon Failed */}
                    <div className="mx-auto size-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-5xl text-red-500">error</span>
                    </div>

                    <h1 className="font-display text-3xl font-bold text-slate-800 mb-2">
                        Thanh toán thất bại
                    </h1>
                    <p className="text-slate-500 mb-8">
                        Rất tiếc, quá trình thanh toán không thành công. Vui lòng kiểm tra lại hoặc thử phương thức khác.
                    </p>

                    {/* Error Box */}
                    <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-8 text-red-600 text-sm font-medium">
                        Lỗi: {decodeURIComponent(errorMsg)}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={() => navigate('/checkout')} 
                            className="w-full py-3.5 rounded-xl bg-blue-600 text-white font-bold shadow-lg hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
                        >
                            Thử thanh toán lại
                        </button>
                        <button 
                            onClick={() => navigate('/cart')} 
                            className="w-full py-3.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                        >
                            Quay lại giỏ hàng
                        </button>
                    </div>

                </div>
            </main>

            <Footer />
        </div>
    );
}