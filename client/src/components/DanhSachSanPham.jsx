import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axios";
import { useAuth } from "../context/AuthContext";
import { getPageList } from "./Pagination";

// [1] Nhận prop searchTerm truyền từ Home.js
const SO_SAN_PHAM_MOI_TRANG = 12;

const BO_LOC_RONG = { sizes: [], giaTu: "", giaDen: "", chiConHang: false, sapXep: "MAC_DINH" };

export default function ProductList({ searchTerm, boLoc = BO_LOC_RONG, onDuLieu }) {
    const [productList, setProductList] = useState([]);
    const [priceList, setPriceList] = useState([]);
    const [stockList, setStockList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [trangHienTai, setTrangHienTai] = useState(1);
    const { user } = useAuth();

    const navigate = useNavigate();

    // Trang cha cần danh mục size và tên loại cá để dựng bộ lọc + gợi ý tìm kiếm. Báo ngược lên
    // đây thay vì để trang cha gọi lại /Chitietcabans và /Loaicas một lần nữa.
    const onDuLieuRef = useRef(onDuLieu);
    onDuLieuRef.current = onDuLieu;

    const handleProductDetail = (product_id) => {
        navigate(`/product-detail/${product_id}`);
    }

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [resProducts, resPrices, resStocks] = await Promise.all([
                    api.get("/Loaicas"),
                    api.get("/Banggias"),
                    api.get("/Chitietcabans")
                ]);

                const productData = resProducts.data;
                setProductList(Array.isArray(productData) ? productData : (productData.result || []));

                const prices = resPrices.data.result || [];
                setPriceList(prices.filter(p => p.trangThai === "Đang áp dụng" || !p.ngayKetThuc));

                const stocks = resStocks.data.result || [];
                setStockList(stocks);

                const dsSize = [];
                stocks.forEach(s => {
                    if (s.tenSize && !dsSize.some(x => x.idSizeCa === s.idSizeCa)) {
                        dsSize.push({ idSizeCa: s.idSizeCa, tenSize: s.tenSize });
                    }
                });
                onDuLieuRef.current?.({
                    sizes: dsSize,
                    tenLoaiCas: (Array.isArray(productData) ? productData : (productData.result || []))
                        .map(sp => (sp.result || sp))
                        .filter(sp => !sp.deleted)
                        .map(sp => ({ id: sp.id, ten: sp.tenloaica })),
                });

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
        if (urlFromDb.startsWith('/')) return `${import.meta.env.VITE_BE_URL}${urlFromDb}`;
        return `${import.meta.env.VITE_BE_URL}/images/loaica/${urlFromDb}`;
    };

    const getDisplayPrice = (fishId) => {
        const fishIdNum = Number(fishId);
        const pricesForFish = priceList.filter(p => Number(p.idLoaiCa) === fishIdNum);
        if (pricesForFish.length === 0) return null;

        if (user?.vaitro === "CUSTOMER") {
            const validPrices = pricesForFish.map(p => Number(p.giaBanSi)).filter(v => v > 0);
            if (validPrices.length === 0) return null;
            return { price: Math.min(...validPrices), label: "Giá sỉ từ" };
        }

        // khachle hoặc guest đều thấy giá lẻ
        const validPrices = pricesForFish.map(p => Number(p.giaBanLe)).filter(v => v > 0);
        if (validPrices.length === 0) return null;
        return { price: Math.min(...validPrices), label: "Giá lẻ từ" };
    };

    const getTotalStock = (fishId) => {
        const fishIdNum = Number(fishId);
        const stocks = stockList.filter(s => {
            return Number(s.idLoaiCa) === fishIdNum;
        });
        const total = stocks.reduce((sum, item) => sum + Number(item.soluongton || 0), 0);
        return total;
    };

    // Các size mà một loại cá đang có hàng bán, dùng cho bộ lọc size.
    const getSizesCuaLoaiCa = (fishId) => stockList
        .filter(s => Number(s.idLoaiCa) === Number(fishId))
        .map(s => s.idSizeCa);

    // [2] Lọc theo từ khóa + bộ lọc nâng cao, rồi sắp xếp.
    // Toàn bộ làm ở client vì ba API phía trên đã tải sẵn trọn danh mục: một vựa cá có vài chục
    // loại cá, thêm endpoint lọc phía server chỉ đổi một vòng lặp lấy một vòng mạng.
    const filteredList = useMemo(() => {
        const search = (searchTerm || "").trim().toLowerCase();
        const giaTu = boLoc.giaTu !== "" && boLoc.giaTu != null ? Number(boLoc.giaTu) : null;
        const giaDen = boLoc.giaDen !== "" && boLoc.giaDen != null ? Number(boLoc.giaDen) : null;
        const sizesChon = boLoc.sizes || [];

        const ketQua = productList.filter((product) => {
            const item = product.result || product;
            if (item.deleted) return false;

            if (search) {
                const name = (item.tenloaica || "").toLowerCase();
                const moTa = (item.mieuta || "").toLowerCase();
                if (!name.includes(search) && !moTa.includes(search)) return false;
            }

            if (sizesChon.length > 0) {
                const sizesCoSan = getSizesCuaLoaiCa(item.id);
                if (!sizesChon.some(idSize => sizesCoSan.includes(idSize))) return false;
            }

            if (boLoc.chiConHang && getTotalStock(item.id) <= 0) return false;

            if (giaTu != null || giaDen != null) {
                const gia = getDisplayPrice(item.id)?.price;
                // Hàng "Liên hệ báo giá" không có giá để so, nên bị loại khi khách đặt khoảng giá —
                // giữ lại sẽ là câu trả lời sai cho câu hỏi "cá nào dưới 100k".
                if (gia == null) return false;
                if (giaTu != null && gia < giaTu) return false;
                if (giaDen != null && gia > giaDen) return false;
            }

            return true;
        });

        // Sản phẩm chưa có giá luôn xuống cuối khi sắp theo giá: xếp chúng như giá 0 sẽ đẩy toàn bộ
        // hàng "liên hệ báo giá" lên đầu danh sách giá tăng dần.
        const theoGia = (chieu) => (a, b) => {
            const ga = getDisplayPrice((a.result || a).id)?.price;
            const gb = getDisplayPrice((b.result || b).id)?.price;
            if (ga == null && gb == null) return 0;
            if (ga == null) return 1;
            if (gb == null) return -1;
            return chieu * (ga - gb);
        };

        switch (boLoc.sapXep) {
            case "GIA_TANG":
                return [...ketQua].sort(theoGia(1));
            case "GIA_GIAM":
                return [...ketQua].sort(theoGia(-1));
            case "TEN_AZ":
                return [...ketQua].sort((a, b) =>
                    ((a.result || a).tenloaica || "").localeCompare((b.result || b).tenloaica || "", "vi"));
            case "TON_GIAM":
                return [...ketQua].sort((a, b) =>
                    getTotalStock((b.result || b).id) - getTotalStock((a.result || a).id));
            default:
                return ketQua;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [productList, priceList, stockList, searchTerm, boLoc, user]);

    // Đổi từ khóa hoặc bộ lọc -> quay về trang 1, tránh đứng ở trang trống
    useEffect(() => {
        setTrangHienTai(1);
    }, [searchTerm, boLoc]);

    const tongSoTrang = Math.max(1, Math.ceil(filteredList.length / SO_SAN_PHAM_MOI_TRANG));
    const trangDangXem = Math.min(trangHienTai, tongSoTrang);
    const danhSachTrangNay = filteredList.slice(
        (trangDangXem - 1) * SO_SAN_PHAM_MOI_TRANG,
        trangDangXem * SO_SAN_PHAM_MOI_TRANG
    );

    return (
        <>
            {!loading && (
                <div className="col-span-full -mt-2 mb-1 text-sm text-slate-500">
                    Tìm thấy <strong className="text-slate-700">{filteredList.length}</strong> sản phẩm
                </div>
            )}

            {/* [3] Sử dụng danhSachTrangNay (đã lọc + cắt theo trang) thay vì productList để render */}
            {danhSachTrangNay.length > 0 ? (
                danhSachTrangNay.map((product) => {
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
                                                        {Number(priceInfo.price).toLocaleString('vi-VN')} VNĐ
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

            {tongSoTrang > 1 && (
                <div className="col-span-full flex items-center justify-center gap-2 mt-4">
                    <button
                        onClick={() => setTrangHienTai(p => Math.max(1, p - 1))}
                        disabled={trangDangXem === 1}
                        className="size-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_left</span>
                    </button>

                    {getPageList(trangDangXem, tongSoTrang).map((soTrang, index) =>
                        soTrang === "..." ? (
                            <span key={`dots-${index}`} className="size-9 flex items-center justify-center text-slate-400 select-none">
                                ...
                            </span>
                        ) : (
                            <button
                                key={soTrang}
                                onClick={() => setTrangHienTai(soTrang)}
                                className={`size-9 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                    soTrang === trangDangXem
                                        ? "bg-blue-600 text-white"
                                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                }`}
                            >
                                {soTrang}
                            </button>
                        )
                    )}

                    <button
                        onClick={() => setTrangHienTai(p => Math.min(tongSoTrang, p + 1))}
                        disabled={trangDangXem === tongSoTrang}
                        className="size-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <span className="material-symbols-outlined text-lg">chevron_right</span>
                    </button>
                </div>
            )}
        </>
    )
}
