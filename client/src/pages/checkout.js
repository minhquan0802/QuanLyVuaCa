import Header from "../components/header"
import Footer from "../components/footer"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";
import { fetchCoXacThuc } from "../utils/fetchAPI";

export default function Checkout() {
    const navigate = useNavigate();
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa"; 

    // --- STATE ---
    const [cartItems, setCartItems] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState(null);

    // Thông tin giao hàng
    const [shipInfo, setShipInfo] = useState({ hoTen: "", sdt: "", diachi: "", ghichu: "" });

    // --- 1. LOAD DỮ LIỆU ---
    useEffect(() => {
        const storedCart = localStorage.getItem("cart");
        let items = [];
        if (storedCart) {
            items = JSON.parse(storedCart);
            setCartItems(items);
        }

        if (!items || items.length === 0) {
            alert("Giỏ hàng trống! Vui lòng chọn sản phẩm trước.");
            navigate("/cart"); 
            return; 
        }

        const fetchUserInfo = async () => {
            try {
                const res = await fetchCoXacThuc("/TaiKhoans/myinfo");
                if (res.ok) {
                    const data = await res.json();
                    const user = data.result;
                    setUserId(user.id || user.idtaikhoan); 
                    setShipInfo(prev => ({
                        ...prev,
                        hoTen: `${user.ho} ${user.ten}`,
                        sdt: user.sodienthoai || "",
                        diachi: user.diachi || ""
                    }));
                }
            } catch (error) { console.log("Khách chưa đăng nhập"); }
        };
        fetchUserInfo();
    }, [navigate]);

    // --- 2. TÍNH TOÁN (ĐÃ CẬP NHẬT) ---
    // [SỬA] Cập nhật công thức tính giống Cart.js (Nhân trọng lượng)
    const calculateItemTotal = (item) => {
        const weight = item.weightPerUnit || 0; 
        if (weight > 0) return item.price * weight * item.quantity;
        return item.price * item.quantity;
    };

    const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    // [SỬA] Phí vận chuyển: Chỉ tính 30k nếu chọn COD
    const shippingFee = paymentMethod === 'cod' ? 30000 : 0;
    
    const total = subtotal + shippingFee;

    const getImageUrl = (urlFromDb) => {
        if (!urlFromDb) return 'https://placehold.co/400x300?text=No+Image';
        if (urlFromDb.startsWith('http')) return urlFromDb;
        return `${APP_BASE_URL}/images/loaica/${urlFromDb}`;
    };

    // --- 3. XỬ LÝ ĐẶT HÀNG ---
    const handlePlaceOrder = async () => {
        if (cartItems.length === 0) { alert("Giỏ hàng trống!"); navigate("/cart"); return; }
        if (!shipInfo.hoTen || !shipInfo.sdt || !shipInfo.diachi) { alert("Vui lòng điền đầy đủ thông tin giao hàng!"); return; }
        if (!userId) { alert("Bạn cần đăng nhập để đặt hàng!"); navigate("/login"); return; }

        setLoading(true);
        try {
            // [BƯỚC 1] Tạo đơn hàng
            const payload = {
                idthongtinkhachhang: userId,
                ghichu: `[${paymentMethod.toUpperCase()}] - ${shipInfo.ghichu}`, 
                chiTietDonHang: cartItems.map(item => ({
                    idchitietcaban: item.sizeId, 
                    soluong: item.quantity,
                    // [SỬA] Gửi đúng tổng tiền của item (đã nhân trọng lượng)
                    tongtiendukien: calculateItemTotal(item), 
                    iddonvitinh: "1" 
                }))
            };

            const resOrder = await fetchCoXacThuc("/Donhangs", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const orderData = await resOrder.json();

            if (!resOrder.ok) throw new Error(orderData.message || "Lỗi tạo đơn hàng");

            const newOrderId = orderData.result.iddonhang; 

            // [BƯỚC 2] Xử lý thanh toán
            if (paymentMethod === 'cod') {
                alert("Đặt hàng thành công!");
                localStorage.removeItem("cart");
                window.dispatchEvent(new Event("storage")); 
                navigate("/my-orders"); 
            } 
            else if (paymentMethod === 'vnpay') {
                // Gửi số tiền TOTAL (đã bao gồm phí ship nếu có) sang VNPAY
                const paymentPayload = {
                    orderId: newOrderId,
                    bankCode: "NCB",
                    language: "vn"
                };

                const resPayment = await fetch(`${APP_BASE_URL}/payment/create-payment`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(paymentPayload)
                });

                const paymentData = await resPayment.json();

                if (resPayment.ok && paymentData.paymentUrl) {
                    localStorage.removeItem("cart");
                    window.dispatchEvent(new Event("storage")); 
                    window.location.href = paymentData.paymentUrl; 
                } else {
                    alert("Lỗi tạo cổng thanh toán: " + (paymentData.message || "Vui lòng thử lại"));
                    navigate("/my-orders"); 
                }
            }

        } catch (error) {
            console.error("Lỗi:", error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (cartItems.length === 0) return null;

    return (
        <div className="bg-slate-50 font-body text-slate-600 min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <h1 className="font-display text-3xl font-bold text-blue-900 mb-8 text-center md:text-left">
                        Thanh toán
                    </h1>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                        
                        {/* CỘT TRÁI: Form nhập liệu */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {/* Thông tin giao hàng (Giữ nguyên) */}
                            <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
                                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">person_pin_circle</span> 
                                    Thông tin nhận hàng
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Họ tên</label>
                                        <input value={shipInfo.hoTen} onChange={e => setShipInfo({...shipInfo, hoTen: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập họ tên" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Số điện thoại</label>
                                        <input value={shipInfo.sdt} onChange={e => setShipInfo({...shipInfo, sdt: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập SĐT" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Địa chỉ</label>
                                        <input value={shipInfo.diachi} onChange={e => setShipInfo({...shipInfo, diachi: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Địa chỉ nhận hàng" />
                                    </div>
                                    <div className="md:col-span-2 space-y-1">
                                        <label className="text-xs font-bold uppercase text-slate-500">Ghi chú</label>
                                        <textarea value={shipInfo.ghichu} onChange={e => setShipInfo({...shipInfo, ghichu: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none" placeholder="Ghi chú giao hàng (tùy chọn)" />
                                    </div>
                                </div>
                            </section>

                            {/* Phương thức thanh toán */}
                            <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-slate-200">
                                <h2 className="text-xl font-bold text-blue-900 mb-4 flex items-center gap-2">
                                    <span className="material-symbols-outlined">payments</span>
                                    Thanh toán
                                </h2>
                                <div className="space-y-3">
                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} className="size-5 text-blue-600 focus:ring-blue-600" />
                                        <div className="flex-1">
                                            <span className="block font-bold text-blue-900">Thanh toán khi nhận hàng (COD)</span>
                                            <span className="text-sm text-slate-500">Trả tiền mặt khi shipper giao tới (Phí ship: 30.000đ)</span>
                                        </div>
                                        <span className="material-symbols-outlined text-3xl text-slate-400">local_shipping</span>
                                    </label>

                                    <label className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${paymentMethod === 'vnpay' ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' : 'border-slate-200 hover:bg-slate-50'}`}>
                                        <input type="radio" name="payment" value="vnpay" checked={paymentMethod === 'vnpay'} onChange={() => setPaymentMethod('vnpay')} className="size-5 text-blue-600 focus:ring-blue-600" />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="block font-bold text-blue-900">Thanh toán qua VNPAY</span>
                                                {/* <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">MIỄN PHÍ SHIP</span> */}
                                                <span className="px-2 py-0.5 rounded bg-red-100 text-red-600 text-[10px] font-bold">Thanh toán tại shop</span>
                                            </div>
                                            <span className="text-sm text-slate-500">Quét mã QR, Ví VNPAY, Thẻ ATM/Nội địa</span>
                                        </div>
                                        <img src="https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png" alt="VNPAY" className="h-8 object-contain" />
                                    </label>
                                </div>
                            </section>
                        </div>

                        {/* CỘT PHẢI: Tóm tắt đơn hàng */}
                        <aside className="lg:col-span-1">
                            <div className="sticky top-24 bg-white p-6 rounded-2xl shadow-lg ring-1 ring-slate-200 border-t-4 border-blue-600">
                                <h3 className="font-bold text-blue-900 text-lg mb-4">Đơn hàng ({cartItems.length} món)</h3>
                                
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {cartItems.map(item => (
                                        <div key={item.cartId} className="flex gap-3 py-2 border-b border-slate-50">
                                            <img src={getImageUrl(item.image)} alt="" className="size-12 rounded-lg object-cover bg-slate-100" />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between">
                                                    <p className="text-sm font-bold text-blue-900 truncate pr-2">{item.name}</p>
                                                    {/* [SỬA] Hiển thị giá đúng */}
                                                    <p className="text-sm font-bold text-blue-600">{calculateItemTotal(item).toLocaleString()}đ</p>
                                                </div>
                                                <p className="text-xs text-slate-500 mt-0.5">
                                                    Size: {item.sizeName} <span className="mx-1">•</span> x{item.quantity}
                                                    {item.weightPerUnit > 0 && <span className="ml-1 text-blue-500 font-medium">(~{(item.weightPerUnit * item.quantity).toFixed(1)}kg)</span>}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="border-t border-dashed border-slate-300 pt-4 space-y-2">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Tạm tính</span>
                                        <span>{subtotal.toLocaleString()}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Phí vận chuyển</span>
                                        {/* [SỬA] Hiển thị phí ship động */}
                                        <span className={`font-medium ${shippingFee === 0 ? 'text-green-600' : 'text-slate-700'}`}>
                                            {shippingFee === 0 ? "Miễn phí" : `${shippingFee.toLocaleString()}đ`}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold text-blue-900 pt-2 border-t border-slate-100 mt-2">
                                        <span>Tổng cộng</span>
                                        <span className="text-blue-600">{total.toLocaleString()}đ</span>
                                    </div>
                                </div>

                                <button 
                                    onClick={handlePlaceOrder}
                                    disabled={loading || cartItems.length === 0}
                                    className={`w-full mt-6 py-3.5 rounded-xl text-white font-bold shadow-lg transition-all flex justify-center items-center gap-2 ${
                                        loading || cartItems.length === 0 
                                        ? 'bg-slate-400 cursor-not-allowed' 
                                        : 'bg-blue-600 hover:bg-blue-700 active:scale-95'
                                    }`}
                                >
                                    {loading ? (
                                        <>
                                            <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        paymentMethod === 'vnpay' ? 'Thanh Toán VNPAY' : 'Xác Nhận Đặt Hàng'
                                    )}
                                </button>
                            </div>
                        </aside>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}