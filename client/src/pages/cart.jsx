import Header from "../components/header"
import Footer from "../components/footer"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom";

export default function Cart() {

    const navigate = useNavigate();
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa"; 

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            alert("Giỏ hàng của bạn đang trống! Vui lòng thêm sản phẩm trước khi thanh toán.");
            return;
        }
        navigate('/checkout');
    }

    const handleHome = () => {
        navigate('/home')
    }

    const [cartItems, setCartItems] = useState(() => {
        try {
            const storedCart = localStorage.getItem("cart");
            return storedCart ? JSON.parse(storedCart) : [];
        } catch (error) {
            console.error("Lỗi đọc giỏ hàng:", error);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("cart", JSON.stringify(cartItems));
        window.dispatchEvent(new Event("storage")); 
    }, [cartItems]);

    const updateQuantity = (id, change) => {
        setCartItems(items => items.map(item =>
            item.cartId === id ? { ...item, quantity: Math.max(1, item.quantity + change) } : item
        ));
    };

    const removeItem = (id) => {
        if(window.confirm("Bạn có chắc muốn xóa sản phẩm này?")) {
            setCartItems(items => items.filter(item => item.cartId !== id));
        }
    };

    const getImageUrl = (urlFromDb) => {
        if (!urlFromDb) return 'https://placehold.co/400x300?text=No+Image';
        if (urlFromDb.startsWith('http')) return urlFromDb;
        if (urlFromDb.startsWith('/')) return `${APP_BASE_URL}${urlFromDb}`;
        return `${APP_BASE_URL}/images/loaica/${urlFromDb}`;
    };

    // --- HÀM TÍNH TIỀN (Giữ nguyên logic nhân trọng lượng) ---
    const calculateItemTotal = (item) => {
        const weight = item.weightPerUnit || 0; 
        if (weight > 0) {
            return item.price * weight * item.quantity;
        }
        return item.price * item.quantity;
    };

    // --- [SỬA] TÍNH TỔNG TIỀN ---
    const subtotal = cartItems.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    
    // [SỬA] Ở trang giỏ hàng chưa tính phí vận chuyển (để 0)
    const shipping = 0; 
    
    const total = subtotal + shipping;

    return (
        <div className="bg-slate-50 font-body text-slate-600 min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                    <div className="mb-10">
                        <h1 className="font-display text-3xl md:text-4xl font-bold text-blue-900 leading-tight">
                            Giỏ hàng của bạn
                        </h1>
                        <p className="mt-2 text-slate-500">
                            Bạn có <span className="font-bold text-blue-600">{cartItems.length} sản phẩm</span> trong giỏ hàng.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12 items-start">

                        {/* Cart List Section */}
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            
                            {/* Desktop Table Header */}
                            {cartItems.length > 0 && (
                                <div className="hidden md:grid grid-cols-12 gap-4 pb-4 border-b border-slate-200 text-sm font-bold text-slate-400 uppercase tracking-wider">
                                    <div className="col-span-5">Sản phẩm</div>
                                    <div className="col-span-2 text-center">Số lượng</div>
                                    <div className="col-span-2 text-right">Đơn giá</div>
                                    <div className="col-span-3 text-right pr-4">Thành tiền</div>
                                </div>
                            )}

                            {/* Cart Items List */}
                            <div className="flex flex-col gap-4">
                                {cartItems.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300">
                                        <p className="text-slate-500">Giỏ hàng của bạn đang trống</p>
                                        <button onClick={handleHome} className="mt-4 px-6 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors">
                                            Mua sắm ngay
                                        </button>
                                    </div>
                                ) : (
                                    cartItems.map((item) => (
                                        <div key={item.cartId} className="group relative flex flex-col md:grid md:grid-cols-12 gap-4 md:items-center bg-white rounded-2xl p-4 shadow-sm ring-1 ring-slate-200 hover:shadow-md transition-all duration-300">

                                            {/* Product Info */}
                                            <div className="col-span-5 flex items-center gap-4">
                                                <div className="w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-slate-100 ring-1 ring-slate-200">
                                                    <img src={getImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div>
                                                    <h3 className="font-display font-bold text-blue-900 text-lg leading-tight">{item.name}</h3>
                                                    <div className="text-sm text-slate-400 mt-1 space-y-0.5">
                                                        <p>Size: {item.sizeName}</p>
                                                        {item.weightPerUnit > 0 && (
                                                            <p className="text-blue-600 text-xs font-bold bg-blue-50 w-fit px-1.5 py-0.5 rounded">
                                                                ~{item.weightPerUnit} kg/con
                                                            </p>
                                                        )}
                                                    </div>
                                                    
                                                    <div className="md:hidden mt-2 font-bold text-blue-600">
                                                        {Number(item.price).toLocaleString('vi-VN')}đ
                                                        {item.weightPerUnit > 0 && <span className="text-xs font-normal text-slate-400"> /kg</span>}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quantity */}
                                            <div className="col-span-2 flex items-center justify-center md:justify-center">
                                                <div className="flex items-center rounded-lg border border-slate-200 bg-white p-1">
                                                    <button onClick={() => updateQuantity(item.cartId, -1)} className="size-8 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">remove</span>
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-bold text-blue-900">{item.quantity}</span>
                                                    <button onClick={() => updateQuantity(item.cartId, 1)} className="size-8 flex items-center justify-center rounded-md hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">add</span>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Unit Price */}
                                            <div className="hidden md:block col-span-2 text-right text-sm text-slate-500">
                                                <div className="font-medium text-slate-700">
                                                    {Number(item.price).toLocaleString('vi-VN')}đ
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {item.weightPerUnit > 0 ? "/kg" : "/con"}
                                                </div>
                                            </div>

                                            {/* Total & Remove */}
                                            <div className="col-span-3 flex items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0">
                                                <span className="md:hidden text-sm font-medium text-slate-500">Thành tiền:</span>
                                                
                                                <div className="text-right">
                                                    <span className="font-bold text-blue-600 text-lg block">
                                                        {calculateItemTotal(item).toLocaleString('vi-VN')}đ
                                                    </span>
                                                    {item.weightPerUnit > 0 && (
                                                        <span className="text-[10px] text-slate-400">
                                                            (~{(item.weightPerUnit * item.quantity).toFixed(1)} kg)
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <button onClick={() => removeItem(item.cartId)} className="size-9 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors">
                                                    <span className="material-symbols-outlined text-xl">delete</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-24 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                                <h2 className="font-display text-xl font-bold text-blue-900 mb-6">Tóm tắt đơn hàng</h2>

                                <div className="space-y-4">
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Tạm tính</span>
                                        <span className="font-medium text-slate-700">{subtotal.toLocaleString('vi-VN')}đ</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-slate-500">
                                        <span>Phí vận chuyển</span>
                                        {/* [SỬA] Hiển thị text thay vì số tiền */}
                                        <span className="font-medium text-slate-700 italic">Tính khi thanh toán</span>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100">
                                        <div className="flex justify-between items-end">
                                            <span className="font-bold text-blue-900">Tổng cộng</span>
                                            <span className="font-display text-2xl font-bold text-blue-600">{total.toLocaleString('vi-VN')}đ</span>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-2 text-right">(Chưa bao gồm phí vận chuyển)</p>
                                    </div>
                                </div>

                                <div className="mt-8 space-y-3">
                                    <button 
                                        onClick={handleCheckout} 
                                        className={`w-full py-3.5 rounded-xl text-white font-bold shadow-lg transition-all duration-300 ${
                                            cartItems.length === 0 
                                            ? "bg-slate-300 cursor-not-allowed shadow-none" 
                                            : "bg-blue-600 shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-0.5"
                                        }`}
                                    >
                                        Tiến hành thanh toán
                                    </button>
                                    <button onClick={handleHome} className="w-full py-3.5 rounded-xl border border-blue-200 text-blue-600 font-bold hover:bg-blue-50 transition-colors">
                                        Tiếp tục mua sắm
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>
            <Footer />
        </div>
    )
}