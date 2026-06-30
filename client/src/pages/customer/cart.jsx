import { useNavigate } from "react-router-dom";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

export default function Cart() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { cart, updateQuantity, removeFromCart, clearCart, totalPrice } = useCart();
    const { showToast } = useToast();

    const getImageUrl = (url) => {
        if (!url) return "https://placehold.co/400x300?text=No+Image";
        if (url.startsWith("http")) return url;
        return `${import.meta.env.VITE_BE_URL}${url.startsWith("/") ? url : `/images/loaica/${url}`}`;
    };

    const handleCheckout = () => {
        if (cart.length === 0) { showToast("Giỏ hàng của bạn đang trống!", "error"); return; }
        navigate("/checkout");
    };

    const handleRemove = (item) => removeFromCart(item.idchitietgiohang, item.tenLoaiCa);

    const handleUpdateQty = (item, delta) => {
        const newQty = item.soluong + delta;
        if (newQty <= 0) {
            handleRemove(item);
        } else {
            updateQuantity(item.idchitietgiohang, newQty);
        }
    };

    if (!user) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-500 mb-4">Vui lòng đăng nhập để xem giỏ hàng.</p>
                    <a href="/" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">Đăng nhập</a>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">
                    <div className="mb-10">
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-blue-900 leading-tight">Giỏ hàng của bạn</h1>
                        <p className="mt-2 text-slate-500">
                            Bạn có <span className="font-bold text-blue-600">{cart.length} sản phẩm</span> trong giỏ hàng.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">
                        {/* Danh sách sản phẩm */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            {cart.length > 0 && (
                                <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-slate-200 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="col-span-5">Sản phẩm</div>
                                    <div className="col-span-2 text-center">Số lượng</div>
                                    <div className="col-span-2 text-right">Đơn giá</div>
                                    <div className="col-span-3 text-right pr-4">Thành tiền</div>
                                </div>
                            )}

                            <div className="flex flex-col gap-4">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                                        <p className="text-slate-500">Giỏ hàng của bạn đang trống</p>
                                        <button onClick={() => navigate("/home")} className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                                            Mua sắm ngay
                                        </button>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={item.idchitietgiohang} className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all duration-300">
                                            {/* Thông tin sản phẩm */}
                                            <div className="col-span-5 flex items-center gap-4">
                                                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                                                    <img src={getImageUrl(item.hinhAnhUrl)} alt={item.tenLoaiCa} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h3 className="font-display font-bold text-blue-900 text-lg leading-tight">{item.tenLoaiCa}</h3>
                                                    <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                                                        <p>Size: {item.tenSize}</p>
                                                        <p>Đơn vị: {item.tenDonViTinh}</p>
                                                        {item.khoiluongDuKien > 0 && (
                                                            <p className="text-blue-600 text-xs font-bold bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                                                                ~{item.khoiluongDuKien.toFixed(2)} kg
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Số lượng */}
                                            <div className="col-span-2 flex items-center justify-center">
                                                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
                                                    <button onClick={() => handleUpdateQty(item, -1)} className="size-8 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold text-blue-900">{item.soluong}</span>
                                                    <button onClick={() => handleUpdateQty(item, 1)} className="size-8 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Đơn giá */}
                                            <div className="hidden md:block col-span-2 text-right text-sm text-slate-500">
                                                <div className="font-medium text-slate-700">{Number(item.thanhTien / item.soluong).toLocaleString("vi-VN")}đ</div>
                                                <div className="text-xs text-slate-400">/{item.tenDonViTinh}</div>
                                            </div>

                                            {/* Thành tiền + Xóa */}
                                            <div className="col-span-3 flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                                                <div className="text-right">
                                                    <span className="font-bold text-blue-600 text-lg block">{Number(item.thanhTien).toLocaleString("vi-VN")}đ</span>
                                                    {item.khoiluongDuKien > 0 && (
                                                        <span className="text-[10px] text-slate-400">(~{item.khoiluongDuKien.toFixed(1)} kg)</span>
                                                    )}
                                                </div>
                                                <button onClick={() => handleRemove(item)} className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Tóm tắt đơn hàng */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                                <h2 className="font-display text-xl font-bold text-blue-900 mb-6">Tóm tắt đơn hàng</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Tạm tính</span>
                                        <span className="font-medium text-slate-700">{Number(totalPrice).toLocaleString("vi-VN")}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Phí vận chuyển</span>
                                        <span className="font-medium text-slate-700 italic">Tính khi thanh toán</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-blue-900">Tổng cộng</span>
                                            <span className="font-display text-2xl font-bold text-blue-600">{Number(totalPrice).toLocaleString("vi-VN")}đ</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 text-right">(Chưa bao gồm phí vận chuyển)</p>
                                    </div>
                                </div>
                                <div className="mt-8 space-y-3">
                                    <button
                                        onClick={handleCheckout}
                                        className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all duration-300 ${
                                            cart.length === 0
                                                ? "bg-slate-300 cursor-not-allowed shadow-none"
                                                : "bg-blue-600 shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5"
                                        }`}
                                    >
                                        Tiến hành thanh toán
                                    </button>
                                    <button onClick={() => navigate("/home")} className="w-full py-3.5 rounded-xl border border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
