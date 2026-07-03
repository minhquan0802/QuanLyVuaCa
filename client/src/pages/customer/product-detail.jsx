import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";

export default function ProductDetail() {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    const { user } = useAuth();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    const isWholesale = user?.vaitro === "CUSTOMER" || user?.vaitro === "WHOLESALE_CUSTOMER";

    const [priceList, setPriceList] = useState([]);
    const [stockList, setStockList] = useState([]);
    const [selectedOption, setSelectedOption] = useState(null);
    const [conversionList, setConversionList] = useState([]);
    const [unitList, setUnitList] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);

    const { product_id } = useParams();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [resProduct, resPrices, resConversions, resStocks, resUnits] = await Promise.all([
                    api.get(`/Loaicas/${product_id}`),
                    api.get("/Banggias"),
                    api.get("/Quydois"),
                    api.get("/Chitietcabans"),
                    api.get("/Donvitinhs"),
                ]);

                const productObj = resProduct.data.result || resProduct.data;
                setProduct(productObj);
                setConversionList(resConversions.data.result || []);
                setStockList(resStocks.data.result || []);

                const units = resUnits.data.result || [];
                setUnitList(units);
                setSelectedUnit(units.find(u => u.hesokg === 0) || units[0]);

                const allPrices = resPrices.data.result || [];
                const relevantPrices = allPrices.filter(p => {
                    const matchId = Number(p.idLoaiCa || (p.chitietcaban?.idloaica?.id) || 0) === Number(product_id);
                    const matchName = p.tenLoaiCa === productObj.tenloaica;
                    return (matchId || matchName) && (p.trangThai === "Đang áp dụng" || !p.ngayKetThuc);
                });
                setPriceList(relevantPrices);
                if (relevantPrices.length > 0) setSelectedOption(relevantPrices[0]);
            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
                setProduct(null);
            } finally {
                setLoading(false);
            }
        };

        if (product_id) {
            fetchData();
            setQuantity(1);
        }
    }, [product_id]);

    const getImageUrl = (urlFromDb) => {
        if (!urlFromDb) return "https://placehold.co/400x300?text=No+Image";
        if (urlFromDb.startsWith("http")) return urlFromDb;
        let path = urlFromDb.startsWith("/") ? urlFromDb : `/images/loaica/${urlFromDb}`;
        return `${import.meta.env.VITE_BE_URL}${path}`;
    };

    const getBaseWeight = () => {
        if (!selectedOption) return 0;
        const idKho = selectedOption.idChitietcaban || selectedOption.chitietcaban?.id;
        const conv = conversionList.find(c => Number(c.idchitietcaban?.id || c.idchitietcaban) === Number(idKho));
        return conv ? conv.sokgtuongung : 0;
    };

    const weightPerUnit = (() => {
        if (!isWholesale || !selectedUnit) return getBaseWeight();
        return selectedUnit.hesokg > 0 ? selectedUnit.hesokg : getBaseWeight();
    })();

    const currentPricePerKg = (() => {
        if (!selectedOption) return 0;
        if (isWholesale) return Number(selectedOption.giaBanSi) || 0;
        return Number(selectedOption.giaBanLe) || 0;
    })();

    const currentStock = (() => {
        if (!selectedOption) return 0;
        const invId = selectedOption.idChitietcaban || selectedOption.chitietcaban?.id;
        if (!invId) return 0;
        const rec = stockList.find(s => Number(s.id) === Number(invId));
        return rec ? Number(rec.soluongton) : 0;
    })();

    const totalWeight = weightPerUnit > 0 ? weightPerUnit * quantity : 0;
    const totalPrice = currentPricePerKg * totalWeight;

    const handleAddToCart = async () => {
        if (!selectedOption) { showToast("Vui lòng chọn kích thước cá!", "error"); return; }
        if (currentStock <= 0) { showToast("Sản phẩm này hiện đang hết hàng!", "error"); return; }

        const idchitietcaban = selectedOption.idChitietcaban || selectedOption.chitietcaban?.id;
        if (!idchitietcaban) { showToast("Lỗi dữ liệu sản phẩm!", "error"); return; }

        const iddonvitinh = isWholesale && selectedUnit ? (selectedUnit.id || selectedUnit.iddvt) : 1;

        setAdding(true);
        await addToCart({
            idchitietcaban: Number(idchitietcaban),
            iddonvitinh: Number(iddonvitinh),
            soluong: quantity,
            tenSanPham: product.tenloaica,
        });
        setAdding(false);
        setQuantity(1);
    };

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!product || product.deleted) return (
        <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center gap-4 text-slate-500">
            <span className="material-symbols-outlined text-5xl text-slate-300">remove_shopping_cart</span>
            <p className="text-lg font-bold text-slate-600">Sản phẩm này không còn kinh doanh</p>
            <a href="/home" className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">Quay lại trang chủ</a>
        </div>
    );

    const imageUrl = getImageUrl(product.hinhanhurl);

    return (
        <div className="bg-slate-50 font-body text-slate-600 min-h-screen flex flex-col">
            <main className="flex-grow">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                        <a href="/home" className="hover:text-blue-600 transition-colors">Trang chủ</a>
                        <span>/</span>
                        <span className="font-medium text-blue-900 truncate max-w-[200px]">{product.tenloaica}</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Ảnh sản phẩm */}
                        <div className="flex flex-col gap-4">
                            <div className="group relative w-full aspect-square overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${imageUrl}")` }}></div>
                                {product.id && (
                                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-blue-900 shadow">
                                        #{product.id}
                                    </div>
                                )}
                                {currentStock <= 0 && selectedOption && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <span className="px-6 py-3 bg-red-600 text-white font-bold text-xl rounded-2xl shadow-xl transform -rotate-12 border-4 border-white">HẾT HÀNG</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Thông tin sản phẩm */}
                        <div className="flex flex-col h-full">
                            <div className="mb-4">
                                <h1 className="font-display text-2xl md:text-3xl font-bold text-blue-900 leading-tight mb-2">
                                    {product.tenloaica}
                                </h1>
                                <div className="flex items-center gap-2">
                                    {selectedOption ? (
                                        currentStock > 0 ? (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-bold border border-green-200">
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                                                </span>
                                                Còn {currentStock} kg
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 text-red-700 text-sm font-bold border border-red-200">
                                                <span className="material-symbols-outlined text-sm">remove_shopping_cart</span>
                                                Hết hàng
                                            </span>
                                        )
                                    ) : (
                                        <span className="text-sm text-slate-400">Chọn size để xem kho</span>
                                    )}
                                </div>
                            </div>

                            {/* Giá */}
                            <div className="mb-5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                {currentPricePerKg > 0 ? (
                                    <>
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">
                                            Giá {isWholesale ? "bán sỉ" : "bán lẻ"}:
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-blue-600">
                                                {Number(currentPricePerKg).toLocaleString("vi-VN")}đ
                                            </span>
                                            <span className="text-base text-slate-400">/ kg</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center gap-2 text-blue-600">
                                        <span className="material-symbols-outlined text-lg">call</span>
                                        <span className="text-lg font-bold">Liên hệ giá tốt</span>
                                    </div>
                                )}
                            </div>

                            {/* Chọn size */}
                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Chọn kích thước:</h3>
                                {priceList.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {priceList.map((option) => {
                                            const optIdKho = option.idChitietcaban || option.chitietcaban?.id;
                                            const stockRec = stockList.find(s => Number(s.id) === Number(optIdKho));
                                            const isOutOfStock = !stockRec || Number(stockRec.soluongton) <= 0;
                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => { setSelectedOption(option); setQuantity(1); }}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all ${
                                                        selectedOption?.id === option.id
                                                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
                                                    } ${isOutOfStock ? "opacity-60 bg-slate-50" : ""}`}
                                                >
                                                    {option.tenSize}
                                                    {isOutOfStock && <span className="ml-1 text-[10px] text-red-500 font-normal">(Hết)</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Chưa có size niêm yết.</p>
                                )}
                            </div>

                            <p className="text-slate-500 text-sm leading-relaxed mb-6 border-t border-slate-100 pt-4">
                                {product.mieuta || "Sản phẩm tươi ngon, chất lượng cao từ Minh Quân Fresh."}
                            </p>

                            {/* Khu vực mua hàng */}
                            <div className="flex flex-col gap-3 mb-6">
                                <div className="flex items-center gap-4">
                                    {/* ĐVT cho khách sỉ */}
                                    {isWholesale && (
                                        <select
                                            className="h-9 px-2 rounded-lg border border-slate-200 text-sm bg-white font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                            value={selectedUnit ? (selectedUnit.id || selectedUnit.iddvt) : ""}
                                            onChange={(e) => {
                                                const unit = unitList.find(u => (u.id || u.iddvt) == e.target.value);
                                                setSelectedUnit(unit);
                                            }}
                                        >
                                            {unitList.map(u => (
                                                <option key={u.id || u.iddvt} value={u.id || u.iddvt}>
                                                    {u.tendvt}{u.hesokg > 0 ? ` (${u.hesokg}kg)` : ""}
                                                </option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Số lượng */}
                                    <div className={`flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm w-fit ${currentStock <= 0 ? "opacity-50 pointer-events-none" : ""}`}>
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-9 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 transition-colors">
                                            <span className="material-symbols-outlined text-xs">remove</span>
                                        </button>
                                        <input type="text" value={quantity} readOnly className="w-10 text-center bg-transparent border-none text-blue-900 font-bold focus:ring-0 text-sm" />
                                        <button onClick={() => setQuantity(quantity + 1)} className="size-9 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 transition-colors">
                                            <span className="material-symbols-outlined text-xs">add</span>
                                        </button>
                                    </div>

                                    {currentPricePerKg > 0 && weightPerUnit > 0 && (
                                        <div className="text-right flex-grow">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                                                Ước lượng: <span className="text-blue-600">{totalWeight.toFixed(1)}kg</span>
                                            </p>
                                            <p className="text-xl font-bold text-blue-700">
                                                {Number(totalPrice).toLocaleString("vi-VN")}đ
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {user ? (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={adding || !selectedOption || currentStock <= 0 || currentPricePerKg === 0}
                                        className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-base shadow-lg transition-all duration-300 ${
                                            adding || !selectedOption || currentStock <= 0 || currentPricePerKg === 0
                                                ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                                : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5"
                                        }`}
                                    >
                                        {adding ? (
                                            <div className="size-5 border-2 border-slate-400/30 border-t-slate-400 rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-[20px]">
                                                {currentStock <= 0 ? "remove_shopping_cart" : "add_shopping_cart"}
                                            </span>
                                        )}
                                        {adding ? "Đang thêm..." : currentStock <= 0 ? "Hết hàng" : selectedOption ? "Thêm vào giỏ hàng" : "Vui lòng chọn size"}
                                    </button>
                                ) : (
                                    <a href="/" className="w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-base bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 transition-all">
                                        <span className="material-symbols-outlined text-[20px]">login</span>
                                        Đăng nhập để đặt hàng
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="mt-12">
                        <div className="border-b border-slate-200 mb-4">
                            <button className="pb-3 text-sm font-bold text-blue-900 border-b-2 border-blue-600">Mô tả chi tiết</button>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
                            <ul className="list-none space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">check_circle</span>
                                    <span><strong>Đặc điểm: </strong>{product.mieuta || "Thịt chắc, ngọt, không bở."}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">ac_unit</span>
                                    <span><strong>Bảo quản: </strong>{product.cachbaoquan || "Bảo quản ngăn đông tủ lạnh (-18 độ C)."}</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
