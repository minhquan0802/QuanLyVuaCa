import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

export default function Checkout() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cart, totalPrice, clearCart } = useCart();
    const { showToast } = useToast();

    const isWholesale = user?.vaitro === "CUSTOMER" || user?.vaitro === "WHOLESALE_CUSTOMER";

    const [paymentMethod, setPaymentMethod] = useState("vnpay");
    const [loading, setLoading] = useState(false);
    const [shipInfo, setShipInfo] = useState({ hoTen: "", sdt: "", diachi: "", ghichu: "" });

    useEffect(() => {
        if (!user) return;
        setShipInfo(prev => ({
            ...prev,
            hoTen: `${user.ho ?? ""} ${user.ten ?? ""}`.trim(),
            sdt: user.sodienthoai ?? "",
            diachi: user.diachi ?? "",
        }));
    }, [user]);

    useEffect(() => {
        if (!user) { navigate("/"); return; }
        if (cart.length === 0) { navigate("/cart"); }
    }, [cart, user]);

    const getImageUrl = (url) => {
        if (!url) return "https://placehold.co/400x300?text=No+Image";
        if (url.startsWith("http")) return url;
        return `${import.meta.env.VITE_BE_URL}${url.startsWith("/") ? url : `/images/loaica/${url}`}`;
    };

    const handlePlaceOrder = async () => {
        if (cart.length === 0) { navigate("/cart"); return; }
        if (!shipInfo.hoTen || !shipInfo.sdt || !shipInfo.diachi) {
            showToast("Vui lòng điền đầy đủ thông tin giao hàng!", "error");
            return;
        }

        setLoading(true);
        try {
            const paymentTag = paymentMethod === "later" ? "THANH_TOAN_SAU" : paymentMethod.toUpperCase();
            const payload = {
                idthongtinkhachhang: user.idtaikhoan || user.id,
                ghichu: `[${paymentTag}] ${shipInfo.diachi} - ${shipInfo.ghichu}`.trim(),
                chiTietDonHang: cart.map(item => ({
                    idchitietcaban: String(item.idchitietcaban),
                    soluong: item.soluong,
                    iddonvitinh: String(item.iddonvitinh),
                })),
            };

            const { data: orderData } = await api.post("/Donhangs", payload);
            if (!orderData.result) throw new Error(orderData.message || "Lỗi tạo đơn hàng");

            const newOrderId = orderData.result.iddonhang;

            if (paymentMethod === "later") {
                await clearCart();
                showToast("Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận.", "success");
                navigate("/my-orders");
            } else if (paymentMethod === "vnpay") {
                const { data: paymentData } = await api.post("/payment/create-payment", {
                    orderId: newOrderId,
                    bankCode: "NCB",
                    language: "vn",
                });
                if (paymentData.paymentUrl) {
                    await clearCart();
                    window.location.href = paymentData.paymentUrl;
                } else {
                    throw new Error(paymentData.message || "Lỗi tạo cổng thanh toán");
                }
            }
        } catch (error) {
            showToast("Có lỗi xảy ra: " + (error.response?.data?.message || error.message), "error");
        } finally {
            setLoading(false);
        }
    };

    if (!user || cart.length === 0) return null;

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <h1 className="font-display text-3xl font-bold text-blue-900 mb-8 text-center md:text-left">Thanh toán</h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        {/* Form nhập liệu */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
                                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">person_pin_circle</span>
                                    Thông tin nhận hàng
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Họ tên</label>
                                        <input value={shipInfo.hoTen} onChange={e => setShipInfo({ ...shipInfo, hoTen: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập họ tên" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Số điện thoại</label>
                                        <input value={shipInfo.sdt} onChange={e => setShipInfo({ ...shipInfo, sdt: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập SĐT" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Địa chỉ</label>
                                        <input value={shipInfo.diachi} onChange={e => setShipInfo({ ...shipInfo, diachi: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Địa chỉ nhận hàng" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Ghi chú</label>
                                        <textarea value={shipInfo.ghichu} onChange={e => setShipInfo({ ...shipInfo, ghichu: e.target.value })} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" placeholder="Ghi chú giao hàng (tùy chọn)" />
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
                                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">payments</span>
                                    Phương thức thanh toán
                                </h2>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "vnpay" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600" : "border-slate-200 hover:bg-slate-50"}`}>
                                        <input type="radio" name="payment" value="vnpay" checked={paymentMethod === "vnpay"} onChange={() => setPaymentMethod("vnpay")} className="size-5 text-blue-600" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="block font-bold text-blue-900">Thanh toán qua VNPAY</span>
                                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">Tại shop</span>
                                            </div>
                                            <span className="text-sm text-slate-500">Quét mã QR, Ví VNPAY, Thẻ ATM/Nội địa</span>
                                        </div>
                                        <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" alt="VNPAY" className="h-8 object-contain" />
                                    </label>

                                    {isWholesale && (
                                        <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === "later" ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500" : "border-slate-200 hover:bg-slate-50"}`}>
                                            <input type="radio" name="payment" value="later" checked={paymentMethod === "later"} onChange={() => setPaymentMethod("later")} className="size-5 text-orange-500" />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="block font-bold text-orange-700">Thanh toán sau</span>
                                                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-600 text-[10px] font-bold">KHÔNG PHÍ SHIP</span>
                                                </div>
                                                <span className="text-sm text-slate-500">Thanh toán sau khi nhận hàng hoặc theo kỳ hạn thỏa thuận</span>
                                            </div>
                                            <span className="material-symbols-outlined text-3xl text-orange-400">handshake</span>
                                        </label>
                                    )}
                                </div>
                            </section>
                        </div>

                        {/* Tóm tắt đơn hàng */}
                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-lg ring-1 ring-slate-200 border-t-4 border-blue-600">
                                <h3 className="font-bold text-blue-900 text-lg mb-4">Đơn hàng ({cart.length} món)</h3>
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1">
                                    {cart.map(item => (
                                        <div key={item.idchitietgiohang} className="flex gap-3 py-2 border-b border-slate-50">
                                            <img src={getImageUrl(item.hinhAnhUrl)} alt="" className="size-12 rounded-lg object-cover bg-slate-100" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <p className="text-sm font-bold text-blue-900 truncate pr-2">{item.tenLoaiCa}</p>
                                                    <p className="text-sm font-bold text-blue-600">{Number(item.thanhTien).toLocaleString()}đ</p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    {item.tenSize} • x{item.soluong} {item.tenDonViTinh}
                                                    {item.khoiluongDuKien > 0 && <span className="ml-1 text-blue-500 font-medium">(~{item.khoiluongDuKien.toFixed(1)}kg)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Tạm tính</span>
                                        <span>{Number(totalPrice).toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-slate-100 mt-2">
                                        <span>Tổng cộng</span>
                                        <span className="text-blue-600">{Number(totalPrice).toLocaleString()}đ</span>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePlaceOrder}
                                    disabled={loading}
                                    className={`w-full mt-6 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${
                                        loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        paymentMethod === "vnpay" ? "Thanh Toán VNPAY"
                                        : paymentMethod === "later" ? "Xác Nhận (Thanh Toán Sau)"
                                        : "Xác Nhận Đặt Hàng"
                                    )}
                                </button>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>
        </div>
    );
}
