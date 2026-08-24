import ProductList from "../../components/DanhSachSanPham"
import { useState, useRef, useEffect, useMemo } from "react"
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const CAC_KIEU_SAP_XEP = [
    { value: "MAC_DINH", nhan: "Mặc định" },
    { value: "GIA_TANG", nhan: "Giá thấp → cao" },
    { value: "GIA_GIAM", nhan: "Giá cao → thấp" },
    { value: "TEN_AZ", nhan: "Tên A → Z" },
    { value: "TON_GIAM", nhan: "Còn nhiều hàng nhất" },
];

const BO_LOC_RONG = { sizes: [], giaTu: "", giaDen: "", chiConHang: false, sapXep: "MAC_DINH" };

export default function Home() {
    const [searchTerm, setSearchTerm] = useState("");
    const [boLoc, setBoLoc] = useState(BO_LOC_RONG);
    const [moBoLoc, setMoBoLoc] = useState(false);

    // Danh mục size và tên loại cá do ProductList báo lên sau khi nó tải xong — tránh gọi lại
    // /Chitietcabans và /Loaicas thêm một lần nữa chỉ để dựng dropdown.
    const [danhMuc, setDanhMuc] = useState({ sizes: [], tenLoaiCas: [] });

    const [moGoiY, setMoGoiY] = useState(false);
    const khungTimKiemRef = useRef(null);

    const { user, loading } = useAuth();

    // Click ra ngoài thì đóng gợi ý. Không có cái này, dropdown sẽ nằm lì trên màn hình sau khi
    // khách chuyển sang thao tác khác.
    useEffect(() => {
        const dongKhiClickNgoai = (e) => {
            if (khungTimKiemRef.current && !khungTimKiemRef.current.contains(e.target)) {
                setMoGoiY(false);
            }
        };
        document.addEventListener("mousedown", dongKhiClickNgoai);
        return () => document.removeEventListener("mousedown", dongKhiClickNgoai);
    }, []);

    const goiY = useMemo(() => {
        const tuKhoa = searchTerm.trim().toLowerCase();
        if (!tuKhoa) return [];
        return danhMuc.tenLoaiCas
            .filter(sp => (sp.ten || "").toLowerCase().includes(tuKhoa))
            .slice(0, 6);
    }, [searchTerm, danhMuc.tenLoaiCas]);

    const soBoLocDangBat =
        boLoc.sizes.length
        + (boLoc.giaTu !== "" ? 1 : 0)
        + (boLoc.giaDen !== "" ? 1 : 0)
        + (boLoc.chiConHang ? 1 : 0)
        + (boLoc.sapXep !== "MAC_DINH" ? 1 : 0);

    const doiSize = (idSizeCa) => {
        setBoLoc(prev => ({
            ...prev,
            sizes: prev.sizes.includes(idSizeCa)
                ? prev.sizes.filter(id => id !== idSizeCa)
                : [...prev.sizes, idSizeCa],
        }));
    };

    // Admin/Staff vào "/" hoặc "/home" thì đưa thẳng qua trang quản trị
    if (loading) return null;
    if (user?.vaitro === "ADMIN" || user?.vaitro === "STAFF") {
        return <Navigate to="/admin" replace />;
    }

    return (
        <div className="bg-slate-50 font-body">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                {/* 1. SECTION HEADER & TOOLBAR */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-6">

                    <div>
                        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-800 leading-tight">
                            Sản Phẩm Nổi Bật
                        </h1>
                        <p className="mt-2 text-slate-500 max-w-lg text-lg">
                            Tuyển chọn những loại <span className="font-medium text-cyan-700">thủy sản</span> tươi ngon nhất, cam kết nguồn gốc sạch và an toàn vệ sinh thực phẩm.
                        </p>
                    </div>

                    {/* Search Bar + gợi ý */}
                    <div className="w-full md:w-96" ref={khungTimKiemRef}>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                <span className="material-symbols-outlined text-cyan-500 group-focus-within:text-cyan-600 transition-colors">search</span>
                            </div>
                            <input
                                type="text"
                                className="block w-full pl-11 pr-10 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-cyan-500 focus:bg-white transition-all duration-300 ease-in-out"
                                placeholder="Tìm kiếm loại cá, thủy sản..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setMoGoiY(true); }}
                                onFocus={() => setMoGoiY(true)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => { setSearchTerm(""); setMoGoiY(false); }}
                                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-[20px]">close</span>
                                </button>
                            )}

                            {moGoiY && goiY.length > 0 && (
                                <div className="absolute z-20 top-full mt-2 w-full bg-white rounded-xl shadow-xl ring-1 ring-slate-200 overflow-hidden">
                                    {goiY.map(sp => (
                                        <button
                                            key={sp.id}
                                            onClick={() => { setSearchTerm(sp.ten); setMoGoiY(false); }}
                                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-700 flex items-center gap-2 cursor-pointer"
                                        >
                                            <span className="material-symbols-outlined text-[18px] text-slate-300">set_meal</span>
                                            {sp.ten}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* 2. BỘ LỌC NÂNG CAO */}
                <div className="mb-8">
                    <div className="flex items-center gap-3 flex-wrap">
                        <button
                            onClick={() => setMoBoLoc(v => !v)}
                            className={`px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 border transition-colors cursor-pointer ${
                                moBoLoc || soBoLocDangBat > 0
                                    ? "bg-cyan-600 text-white border-cyan-700"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            <span className="material-symbols-outlined text-[20px]">tune</span>
                            Bộ lọc
                            {soBoLocDangBat > 0 && (
                                <span className="size-5 rounded-full bg-white text-cyan-700 text-xs flex items-center justify-center font-black">
                                    {soBoLocDangBat}
                                </span>
                            )}
                        </button>

                        <select
                            value={boLoc.sapXep}
                            onChange={e => setBoLoc(p => ({ ...p, sapXep: e.target.value }))}
                            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
                        >
                            {CAC_KIEU_SAP_XEP.map(kieu => (
                                <option key={kieu.value} value={kieu.value}>{kieu.nhan}</option>
                            ))}
                        </select>

                        <label className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 flex items-center gap-2 cursor-pointer hover:bg-slate-50 transition-colors">
                            <input
                                type="checkbox"
                                checked={boLoc.chiConHang}
                                onChange={e => setBoLoc(p => ({ ...p, chiConHang: e.target.checked }))}
                                className="size-4 accent-cyan-600 cursor-pointer"
                            />
                            Chỉ hàng còn bán
                        </label>

                        {soBoLocDangBat > 0 && (
                            <button
                                onClick={() => setBoLoc(BO_LOC_RONG)}
                                className="px-3 py-2.5 text-sm font-bold text-slate-500 hover:text-red-600 transition-colors cursor-pointer"
                            >
                                Xóa bộ lọc
                            </button>
                        )}
                    </div>

                    {moBoLoc && (
                        <div className="mt-3 bg-white rounded-2xl border border-slate-200 p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-2">Size cá</p>
                                {danhMuc.sizes.length === 0 ? (
                                    <p className="text-sm text-slate-400 italic">Đang tải danh mục size...</p>
                                ) : (
                                    <div className="flex gap-2 flex-wrap">
                                        {danhMuc.sizes.map(size => (
                                            <button
                                                key={size.idSizeCa}
                                                onClick={() => doiSize(size.idSizeCa)}
                                                className={`px-3.5 py-1.5 rounded-lg text-sm font-bold border transition-colors cursor-pointer ${
                                                    boLoc.sizes.includes(size.idSizeCa)
                                                        ? "bg-cyan-600 text-white border-cyan-700"
                                                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                                                }`}
                                            >
                                                {size.tenSize}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <p className="text-sm font-bold text-slate-700 mb-2">Khoảng giá (VNĐ/kg)</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Từ"
                                        value={boLoc.giaTu}
                                        onChange={e => setBoLoc(p => ({ ...p, giaTu: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                    <span className="text-slate-400">—</span>
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Đến"
                                        value={boLoc.giaDen}
                                        onChange={e => setBoLoc(p => ({ ...p, giaDen: e.target.value }))}
                                        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                                <p className="text-xs text-slate-400 mt-2">
                                    So theo mức giá thấp nhất của mỗi loại cá — đúng con số hiện trên thẻ sản phẩm.
                                    Hàng chưa niêm yết giá sẽ không hiện khi bạn đặt khoảng giá.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* 3. PRODUCT GRID */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                    <ProductList
                        searchTerm={searchTerm}
                        boLoc={boLoc}
                        onDuLieu={setDanhMuc}
                    />
                </div>
            </div>
        </div>
    );
}
