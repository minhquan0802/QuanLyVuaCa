import { useSearchParams, useNavigate } from "react-router-dom";
import Header from "../components/header";
import Footer from "../components/footer";

export default function OrderSuccess() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const orderId = searchParams.get("orderId");
    const rawPrice = searchParams.get("totalPrice");
    const time = searchParams.get("time");

    const amount = rawPrice ? Number(rawPrice) / 100 : 0;

    // Optional: Bạn có thể gọi API lấy chi tiết đơn hàng để check lại status nếu muốn chắc chắn
    // useEffect(() => { ... fetch(`/Donhangs/${orderId}`) ... }, [orderId]);

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-body">
            <Header />
            <main className="flex-grow flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-xl text-center max-w-lg w-full">
                    <div className="size-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="material-symbols-outlined text-5xl text-green-600">check_circle</span>
                    </div>
                    <h1 className="text-3xl font-bold text-blue-900 mb-2">Thanh toán thành công!</h1>
                    <p className="text-slate-500 mb-6">Đơn hàng <span className="font-bold text-blue-600">#{orderId}</span> đã được thanh toán.</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl mb-6">
                        <p className="flex justify-between text-sm mb-2">
                            <span className="text-slate-500">Tổng tiền:</span>
                            <span className="font-bold text-blue-900">{amount.toLocaleString()}đ</span>
                        </p>
                        <p className="flex justify-between text-sm">
                            <span className="text-slate-500">Trạng thái:</span>
                            <span className="font-bold text-green-600">HOÀN TẤT</span>
                        </p>
                    </div>

                    <button onClick={() => navigate('/home')} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700">
                        Tiếp tục mua sắm
                    </button>
                </div>
            </main>
            <Footer />
        </div>
    );
}