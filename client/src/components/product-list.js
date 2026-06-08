import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// [1] Nhận prop searchTerm truyền từ Home.js
export default function ProductList({ searchTerm }) {
    const [productList, setProductList] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [stockList, setStockList] = useState([]); 
    const [userRole, setUserRole] = useState(null); 
    const [loading, setLoading] = useState(true);
    
    const navigate = useNavigate();
    const APP_BASE_URL = "http://localhost:8080/QuanLyVuaCa";

    const handleProductDetail = (product_id) => {
        navigate(`/product-detail/${product_id}`);
    }

    useEffect(() => {
        let roleStored = localStorage.getItem("role");
        if (roleStored) {
            roleStored = roleStored.replace(/^"|"$/g, ''); 
            setUserRole(roleStored);
        }

        const fetchData = async () => {
            setLoading(true);
            try {
                const [resProducts, resPrices, resStocks] = await Promise.all([
                    fetch(`${APP_BASE_URL}/Loaicas`),
                    fetch(`${APP_BASE_URL}/Banggias`),
                    fetch(`${APP_BASE_URL}/Chitietcabans`)
                ]);

                if (resProducts.ok) {
                    const data = await resProducts.json();
                    let realData = Array.isArray(data) ? data : (data.result || []);
                    setProductList(realData);
                }

                if (resPrices.ok) {
                    const data = await resPrices.json();
                    const prices = data.result || [];
                    const activePrices = prices.filter(p => p.trangThai === "Đang áp dụng" || !p.ngayKetThuc);
                    setPriceList(activePrices);
                }

                if (resStocks.ok) {
                    const data = await resStocks.json();
                    setStockList(data.result || []);
                }

            } catch (error) {
                console.error("Lỗi tải dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const getImageUrl = (urlFromDb) => {
        if (!urlFromDb) return 'https://placehold.co/400x300?text=No+Image';
        if (urlFromDb.startsWith('http')) return urlFromDb;
        if (urlFromDb.startsWith('/')) return `${APP_BASE_URL}${urlFromDb}`;
        return `${APP_BASE_URL}/images/loaica/${urlFromDb}`;
    };

    const getDisplayPrice = (fishId) => {
        if (!userRole) return null;
        const fishIdNum = Number(fishId);
        
        const pricesForFish = priceList.filter(p => {
             const pIdLoaiCa = p.idLoaiCa || (p.chitietcaban && p.chitietcaban.idloaica) || (p.idchitietcaban && p.idchitietcaban.idloaica);
             if (pIdLoaiCa && typeof pIdLoaiCa === 'object') return Number(pIdLoaiCa.id) === fishIdNum;
             return Number(pIdLoaiCa) === fishIdNum;
        });

        if (pricesForFish.length === 0) return null;

        if (userRole === "khachsi") { 
            const minPrice = Math.min(...pricesForFish.map(p => p.giaBanSi || p.giabansi)); 
            return { price: minPrice, label: "Giá sỉ từ" };
        } 
        else if (userRole === "khachle") { 
            const minPrice = Math.min(...pricesForFish.map(p => p.giaBanLe || p.giabanle));
            return { price: minPrice, label: "Giá lẻ từ" };
        }
        return null; 
    };

    const getTotalStock = (fishId) => {
        const fishIdNum = Number(fishId);
        const stocks = stockList.filter(s => {
            return Number(s.idLoaiCa) === fishIdNum;
        });
        const total = stocks.reduce((sum, item) => sum + Number(item.soluongton || 0), 0);
        return total;
    };

    // [2] Logic lọc danh sách sản phẩm dựa trên searchTerm
    const filteredList = productList.filter((product) => {
        const item = product.result || product;
        // Nếu không có từ khóa, trả về true (lấy hết)
        if (!searchTerm) return true;
        
        // Kiểm tra tên sản phẩm có chứa từ khóa không (không phân biệt hoa thường)
        const name = item.tenloaica ? item.tenloaica.toLowerCase() : "";
        return name.includes(searchTerm.toLowerCase());
    });

    return (
        <>
            {/* [3] Sử dụng filteredList thay vì productList để render */}
            {filteredList.length > 0 ? (
                filteredList.map((product) => {
                    const item = product.result || product;
                    const imageUrl = getImageUrl(item.hinhanhurl);
                    const priceInfo = getDisplayPrice(item.id);
                    const totalStock = getTotalStock(item.id);

                    return (
                        <div
                            key={item.id || Math.random()} 
                            onClick={() => handleProductDetail(item.id)}
                            className="group relative flex flex-col bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 hover:shadow-xl hover:shadow-blue-100 hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
                        >
                            <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 relative">
                                <div
                                    className="w-full h-full bg-center bg-cover transition-transform duration-700 group-hover:scale-110"
                                    style={{ backgroundImage: `url("${imageUrl}")` }}
                                ></div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-blue-900/10 transition-colors duration-300"></div>
                                
                                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-bold text-blue-900 shadow-sm">
                                    #{item.id}
                                </div>

                                {totalStock <= 0 && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                            <span className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl shadow-lg transform -rotate-12 border-2 border-white">
                                                HẾT HÀNG
                                            </span>
                                    </div>
                                )}
                            </div>

                            <div className="p-5 flex flex-col flex-grow">
                                <div className="flex-grow">
                                    <h3 className="font-display text-lg font-bold text-blue-900 leading-tight mb-2 group-hover:text-blue-600 transition-colors line-clamp-1">
                                            {item.tenloaica || "Tên sản phẩm"}
                                    </h3>
                                    
                                    <div className="mb-2 flex items-center gap-2 text-xs">
                                            {totalStock > 0 ? (
                                                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">inventory_2</span>
                                                    Sẵn hàng: {totalStock}
                                                </span>
                                            ) : (
                                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 font-bold">
                                                    Tạm hết hàng
                                                </span>
                                            )}
                                    </div>

                                    <p className="text-sm text-slate-500 line-clamp-2 mb-3 h-10">
                                            {item.mieuta || "Mô tả đang cập nhật..."}
                                    </p>

                                    <div className="mt-2">
                                            {priceInfo ? (
                                                <div className="flex flex-col">
                                                    <span className="text-xs text-slate-400 font-medium uppercase">{priceInfo.label}:</span>
                                                    <p className="font-bold text-blue-600 text-xl">
                                                        {Number(priceInfo.price).toLocaleString('vi-VN')}đ 
                                                        <span className="text-sm font-normal text-slate-400 ml-1">/kg</span>
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-blue-500 text-sm">call</span>
                                                    <span className="text-base font-bold text-blue-500">Liên hệ báo giá</span>
                                                </div>
                                            )}
                                    </div>
                                </div>

                                <button className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-200 hover:bg-blue-700 hover:shadow-lg active:scale-95 transition-all duration-300">
                                    <span className="material-symbols-outlined text-[18px]">add_shopping_cart</span>
                                    Xem chi tiết
                                </button>
                            </div>
                        </div>
                    )
                })
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-slate-400 py-16">
                    <span className="material-symbols-outlined text-4xl mb-2">set_meal</span>
                    {/* Hiển thị thông báo khác nhau tùy thuộc việc đang tải hay tìm không thấy */}
                    <p>{loading ? "Đang tải dữ liệu..." : "Không tìm thấy sản phẩm nào."}</p>
                </div>
            )}
        </>
    )
}