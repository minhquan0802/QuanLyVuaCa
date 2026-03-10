import Header from "../components/header"
import Footer from "../components/footer"
import { useState, useEffect } from "react"
import { useParams } from "react-router-dom";

export default function ProductDetail() {
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState(1);
    
    // --- STATE DỮ LIỆU ---
    const [priceList, setPriceList] = useState([]); 
    const [stockList, setStockList] = useState([]); 
    const [selectedOption, setSelectedOption] = useState(null); 
    const [conversionList, setConversionList] = useState([]); 
    const [userRole, setUserRole] = useState(null); 
    
    // [MỚI] State cho Đơn vị tính (chỉ dùng cho khách sỉ)
    const [unitList, setUnitList] = useState([]);
    const [selectedUnit, setSelectedUnit] = useState(null);
    // -----------------

    const { product_id } = useParams();
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa";

    useEffect(() => {
        let roleStored = localStorage.getItem("role");
        if (roleStored) {
            roleStored = roleStored.replace(/^"|"$/g, '');
            setUserRole(roleStored);
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                // [CẬP NHẬT] Gọi thêm API /Donvitinhs
                const [resProduct, resPrices, resConversions, resStocks, resUnits] = await Promise.all([
                    fetch(`${APP_BASE_URL}/Loaicas/${product_id}`),
                    fetch(`${APP_BASE_URL}/Banggias`),
                    fetch(`${APP_BASE_URL}/Quydois`),
                    fetch(`${APP_BASE_URL}/Chitietcabans`),
                    fetch(`${APP_BASE_URL}/Donvitinhs`) // [MỚI]
                ]);

                if (!resProduct.ok) throw new Error("Lỗi kết nối server");

                const dataProd = await resProduct.json();
                const productObj = dataProd.result || dataProd;
                setProduct(productObj);

                if (resConversions.ok) {
                    const dataConv = await resConversions.json();
                    setConversionList(dataConv.result || dataConv.data || []);
                }
                
                if (resStocks.ok) {
                    const dataStock = await resStocks.json();
                    setStockList(dataStock.result || []);
                }

                // [MỚI] Xử lý Đơn vị tính
                if (resUnits.ok) {
                    const dataUnits = await resUnits.json();
                    const units = dataUnits.result || [];
                    setUnitList(units);
                    
                    // Mặc định chọn đơn vị "Con" (hoặc đơn vị đầu tiên)
                    const defaultUnit = units.find(u => u.hesokg === 0) || units[0];
                    setSelectedUnit(defaultUnit);
                }

                if (resPrices.ok) {
                    const dataPrice = await resPrices.json();
                    const allPrices = dataPrice.result || [];
                    
                    const relevantPrices = allPrices.filter(p => {
                        const matchId = Number(p.idLoaiCa || (p.chitietcaban && p.chitietcaban.idloaica && p.chitietcaban.idloaica.id) || 0) === Number(product_id); 
                        const matchName = p.tenLoaiCa === productObj.tenloaica;
                        return (matchId || matchName) && (p.trangThai === "Đang áp dụng" || !p.ngayKetThuc);
                    });

                    setPriceList(relevantPrices);

                    if (relevantPrices.length > 0) {
                        setSelectedOption(relevantPrices[0]);
                    }
                }

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
        if (!urlFromDb) return 'https://placehold.co/400x300?text=No+Image';
        if (urlFromDb.startsWith('http')) return urlFromDb;
        let relativePath = urlFromDb;
        if (!relativePath.includes('images/loaica')) {
            const cleanFileName = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
            relativePath = `/images/loaica/${cleanFileName}`;
        } else {
            relativePath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
        }
        return `${APP_BASE_URL}${relativePath}`;
    };

    // Hàm lấy trọng lượng quy đổi từ "Con" (Logic cũ)
    const getBaseWeightFromConversion = () => {
        if (!selectedOption) return 0;
        const idKho = selectedOption.idChitietcaban || (selectedOption.chitietcaban && selectedOption.chitietcaban.id);
        
        const conversion = conversionList.find(c => {
            const cRepoId = c.idchitietcaban?.id || c.idchitietcaban;
            return Number(cRepoId) === Number(idKho);
        });
        return conversion ? conversion.sokgtuongung : 0;
    };

    // [CẬP NHẬT] Tính trọng lượng trên 1 đơn vị (Tùy thuộc vào Role và ĐVT đã chọn)
    const getFinalWeightPerUnit = () => {
        // 1. Khách lẻ hoặc chưa chọn ĐVT: Mặc định theo logic cũ (theo Con/Quy đổi)
        if (userRole !== 'khachsi' || !selectedUnit) {
            return getBaseWeightFromConversion();
        }

        // 2. Khách sỉ: Tính theo ĐVT đã chọn
        // Nếu hệ số > 0 (VD: Bao = 10kg) -> Lấy hệ số
        if (selectedUnit.hesokg > 0) {
            return selectedUnit.hesokg;
        }
        
        // Nếu hệ số = 0 (VD: Con) -> Lấy từ bảng quy đổi
        return getBaseWeightFromConversion();
    };

    const currentPricePerKg = (() => {
        if (!userRole || !selectedOption) return 0;
        if (userRole === "khachsi") return selectedOption.giaBanSi || selectedOption.giabansi;
        if (userRole === "khachle") return selectedOption.giaBanLe || selectedOption.giabanle;
        return 0;
    })();

    const currentStock = (() => {
        if (!selectedOption) return 0;
        const inventoryId = selectedOption.idChitietcaban || (selectedOption.chitietcaban && selectedOption.chitietcaban.id);
        if (!inventoryId) return 0;
        const stockRecord = stockList.find(s => Number(s.id) === Number(inventoryId));
        return stockRecord ? Number(stockRecord.soluongton) : 0;
    })();

    // Sử dụng hàm tính toán mới
    const weightPerUnit = getFinalWeightPerUnit(); 
    const totalWeight = weightPerUnit > 0 ? weightPerUnit * quantity : 0; 
    const totalPrice = currentPricePerKg * (weightPerUnit > 0 ? totalWeight : 0);

    const handleAddToCart = () => {
        if (!selectedOption) {
            alert("Vui lòng chọn kích thước cá!");
            return;
        }
        
        // Kiểm tra tồn kho (tính theo tổng kg)
        // Nếu là khách sỉ mua theo bao, phải nhân ra kg để so sánh với kho
        if (currentStock <= 0) {
            alert("Sản phẩm này hiện đang hết hàng!");
            return;
        }
        
        // Kiểm tra đủ hàng không
        if (totalWeight > currentStock) {
            alert(`Kho không đủ hàng! Bạn mua ${totalWeight}kg nhưng kho chỉ còn ${currentStock}kg.`);
            return;
        }

        const inventoryId = selectedOption.idChitietcaban || (selectedOption.chitietcaban && selectedOption.chitietcaban.id);
        if (!inventoryId) {
            alert("Lỗi dữ liệu: Không tìm thấy ID sản phẩm.");
            return;
        }

        // Xác định Unit ID và Name để lưu vào giỏ
        const unitIdToSave = (userRole === 'khachsi' && selectedUnit) ? (selectedUnit.id || selectedUnit.iddvt) : null; 
        // Nếu là khách lẻ, có thể để null hoặc tìm unit mặc định "Con" nếu muốn chặt chẽ

        const newItem = {
            // Tạo cartId unique: sp + size + dvt (để khách sỉ mua Bao và Con không bị gộp sai)
            cartId: `${product.id}_${inventoryId}_${unitIdToSave || 'default'}`,
            productId: product.id,
            name: product.tenloaica,
            image: product.hinhanhurl,
            sizeId: inventoryId, 
            sizeName: selectedOption.tenSize,
            price: currentPricePerKg, 
            weightPerUnit: weightPerUnit,
            quantity: quantity,
            roleApplied: userRole,
            // [MỚI] Lưu thông tin ĐVT
            unitId: unitIdToSave,
            unitName: (userRole === 'khachsi' && selectedUnit) ? selectedUnit.tendvt : 'Con' 
        };

        const storedCart = localStorage.getItem("cart");
        let cart = storedCart ? JSON.parse(storedCart) : [];
        const existingItemIndex = cart.findIndex(item => item.cartId === newItem.cartId);

        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity += quantity;
        } else {
            cart.push(newItem);
        }

        localStorage.setItem("cart", JSON.stringify(cart));
        alert("Đã thêm vào giỏ hàng thành công!");
        setQuantity(1); 
        window.dispatchEvent(new Event("storage")); 
    };

    if (loading) {
        return (
            <div className="bg-slate-50 min-h-screen flex flex-col">
                <Header />
                <div className="flex-grow flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div></div>
                <Footer />
            </div>
        );
    }

    const productData = product; 
    if (!productData) return null; 
    const imageUrl = getImageUrl(productData.hinhanhurl);

    return (
        <div className="bg-slate-50 font-body text-slate-600 min-h-screen flex flex-col">
            <Header />

            <main className="flex-grow">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
                    <nav className="flex items-center gap-2 text-sm text-slate-400 mb-6">
                        <a href="/home" className="hover:text-blue-600 transition-colors">Trang chủ</a>
                        <span>/</span>
                        <span className="font-medium text-blue-900 truncate max-w-[200px]">{productData.tenloaica}</span>
                    </nav>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        <div className="flex flex-col gap-4">
                            <div className="group relative w-full aspect-square overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                                <div className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url("${imageUrl}")` }}></div>
                                {productData.id && <div className="absolute top-3 left-3 bg-white/90 backdrop-blur px-2 py-0.5 rounded text-xs font-bold text-blue-900 shadow">#{productData.id}</div>}
                                
                                {currentStock <= 0 && selectedOption && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                        <span className="px-6 py-3 bg-red-600 text-white font-bold text-xl rounded-2xl shadow-xl transform -rotate-12 border-4 border-white">
                                            HẾT HÀNG
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col h-full">
                            <div className="mb-4">
                                <h1 className="font-display text-2xl md:text-3xl font-bold text-blue-900 leading-tight mb-2">
                                    {productData.tenloaica}
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
                                        <span className="text-sm text-slate-400">Vui lòng chọn size để xem kho</span>
                                    )}
                                </div>
                            </div>

                            <div className="mb-5 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                {userRole && currentPricePerKg > 0 ? (
                                    <>
                                        <p className="text-xs font-bold text-blue-800 uppercase mb-1">
                                            Giá {userRole === 'khachsi' ? 'bán sỉ' : 'bán lẻ'}:
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-blue-600">
                                                {Number(currentPricePerKg).toLocaleString('vi-VN')}đ
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

                            <div className="mb-6">
                                <h3 className="text-xs font-bold text-slate-800 uppercase mb-2">Chọn kích thước:</h3>
                                {priceList.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {priceList.map((option) => {
                                            const optIdKho = option.idChitietcaban || (option.chitietcaban && option.chitietcaban.id);
                                            const stockRec = stockList.find(s => Number(s.id) === Number(optIdKho));
                                            const stock = stockRec ? Number(stockRec.soluongton) : 0;
                                            const isOutOfStock = stock <= 0;

                                            return (
                                                <button
                                                    key={option.id}
                                                    onClick={() => {
                                                        setSelectedOption(option);
                                                        setQuantity(1);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-lg border text-sm font-bold transition-all relative ${
                                                        selectedOption?.id === option.id
                                                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                                                            : "border-slate-200 bg-white text-slate-500 hover:border-blue-300"
                                                    } ${isOutOfStock ? "opacity-60 bg-slate-50" : ""}`}
                                                >
                                                    {option.tenSize}
                                                    {isOutOfStock && <span className="ml-1 text-[10px] text-red-500 font-normal">(Hết)</span>}
                                                </button>
                                            )
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400 italic">Chưa có size niêm yết.</p>
                                )}
                            </div>

                             <p className="text-slate-500 text-sm leading-relaxed mb-6 border-t border-slate-100 pt-4">
                                {productData.mieuta || "Sản phẩm tươi ngon, chất lượng cao từ Minh Quân Fresh."}
                            </p>

                            {/* KHU VỰC THAO TÁC MUA HÀNG */}
                            <div className="flex flex-col gap-3 mb-6">
                                <div className="flex items-center gap-4">
                                    
                                    {/* --- [MỚI] DROPDOWN CHỌN ĐVT CHO KHÁCH SỈ --- */}
                                    {userRole === 'khachsi' && (
                                        <div className="flex items-center">
                                            <select
                                                className="h-9 px-2 rounded-lg border border-slate-200 text-sm bg-white font-bold text-slate-700 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                                                value={selectedUnit ? (selectedUnit.id || selectedUnit.iddvt) : ""}
                                                onChange={(e) => {
                                                    const unitId = e.target.value;
                                                    const unit = unitList.find(u => (u.id || u.iddvt) == unitId);
                                                    setSelectedUnit(unit);
                                                }}
                                            >
                                                {unitList.map(u => (
                                                    <option key={u.id || u.iddvt} value={u.id || u.iddvt}>
                                                        {u.tendvt} {u.hesokg > 0 ? `(${u.hesokg}kg)` : ""}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    {/* ------------------------------------------- */}

                                    <div className={`flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm w-fit ${currentStock <= 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                                        <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-9 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 transition-colors">
                                            <span className="material-symbols-outlined text-xs">remove</span>
                                        </button>
                                        <input type="text" value={quantity} readOnly className="w-10 text-center bg-transparent border-none text-blue-900 font-bold focus:ring-0 text-sm" />
                                        <button onClick={() => setQuantity(quantity + 1)} className="size-9 flex items-center justify-center rounded hover:bg-slate-100 text-slate-600 transition-colors">
                                            <span className="material-symbols-outlined text-xs">add</span>
                                        </button>
                                    </div>
                                    
                                    {currentPricePerKg > 0 && (
                                        <div className="text-right flex-grow">
                                            {weightPerUnit > 0 ? (
                                                <>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase mb-0.5">
                                                        Ước lượng: <span className="text-blue-600">{totalWeight.toFixed(1)}kg</span>
                                                    </p>
                                                    <p className="text-xl font-bold text-blue-700">
                                                        {Number(totalPrice).toLocaleString('vi-VN')}đ
                                                    </p>
                                                </>
                                            ) : (
                                                <p className="text-sm italic text-orange-500">Chưa có thông tin trọng lượng</p>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    onClick={handleAddToCart}
                                    disabled={!selectedOption || currentStock <= 0 || currentPricePerKg === 0}
                                    className={`w-full h-11 flex items-center justify-center gap-2 rounded-xl font-bold text-base shadow-lg transition-all duration-300 ${
                                        !selectedOption || currentStock <= 0 || currentPricePerKg === 0 
                                        ? "bg-slate-200 text-slate-400 cursor-not-allowed shadow-none"
                                        : "bg-blue-600 text-white shadow-blue-200 hover:bg-blue-700 hover:shadow-blue-300 hover:-translate-y-0.5"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-[20px]">
                                        {currentStock <= 0 ? "remove_shopping_cart" : "add_shopping_cart"}
                                    </span>
                                    {currentStock <= 0 ? "Hết hàng" : (selectedOption ? "Thêm vào giỏ hàng" : "Vui lòng chọn size")}
                                </button>
                            </div>

                        </div>
                    </div>
                    
                    <div className="mt-12">
                        <div className="border-b border-slate-200 mb-4">
                            <div className="flex gap-8 overflow-x-auto pb-px">
                                <button className="pb-3 text-sm font-bold text-blue-900 border-b-2 border-blue-600">Mô tả chi tiết</button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl p-6 shadow-sm ring-1 ring-slate-100">
                            <ul className="list-none space-y-3 text-sm text-slate-600">
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">check_circle</span>
                                    <span><strong>Đặc điểm: </strong>{productData.mieuta || "Thịt chắc, ngọt, không bở."}</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">ac_unit</span>
                                    <span><strong>Bảo quản: </strong>{productData.cachbaoquan || "Bảo quản ngăn đông tủ lạnh (-18 độ C)."}</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                </div>
            </main>
            <Footer />
        </div>
    )
}