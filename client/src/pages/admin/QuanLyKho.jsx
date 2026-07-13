import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";

const THANHTOAN_STATUS = {
    "CHUA_THANH_TOAN": { label: "Chưa thanh toán", badge: "bg-orange-50 text-orange-700 border-orange-200" },
    "DA_THANH_TOAN":   { label: "Đã thanh toán",   badge: "bg-green-50 text-green-700 border-green-200"  },
};

export default function QuanLyKho() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const isAdmin = user?.vaitro === "ADMIN";
    const { showToast } = useToast();

    const [tab, setTab] = useState("kho"); // "kho" | "nhap"
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    // --- STATE KHO HÀNG ---
    const [inventory, setInventory] = useState([]);
    const [loadingKho, setLoadingKho] = useState(true);
    const [sortKho, setSortKho] = useState({ key: "tenLoaiCa", direction: "asc" });

    // --- STATE PHIẾU NHẬP ---
    const [phieus, setPhieus] = useState([]);
    const [loadingNhap, setLoadingNhap] = useState(true);
    const [sortNhap, setSortNhap] = useState({ key: "ngaynhap", direction: "desc" });
    const [confirmId, setConfirmId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);

    // --- GỌI API ---
    useEffect(() => {
        api.get("/Chitietcabans")
            .then(res => setInventory(res.data.result || []))
            .catch(() => showToast("Không thể tải dữ liệu kho!", "error"))
            .finally(() => setLoadingKho(false));
    }, []);

    const fetchPhieus = () => {
        setLoadingNhap(true);
        api.get("/Phieunhaps")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải lịch sử phiếu nhập!", "error"))
            .finally(() => setLoadingNhap(false));
    };

    useEffect(() => { fetchPhieus(); }, []);

    // Reset trang khi đổi tab hoặc tìm kiếm
    useEffect(() => { setCurrentPage(1); }, [tab, searchTerm]);

    // --- XỬ LÝ KHO HÀNG ---
    const processedInventory = useMemo(() => {
        let filtered = inventory;
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            filtered = inventory.filter(item =>
                (item.tenLoaiCa || "").toLowerCase().includes(s) ||
                (item.tenSize || "").toLowerCase().includes(s)
            );
        }
        return [...filtered].sort((a, b) => {
            const va = a[sortKho.key], vb = b[sortKho.key];
            if (typeof va === "string" && typeof vb === "string")
                return sortKho.direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            if (va < vb) return sortKho.direction === "asc" ? -1 : 1;
            if (va > vb) return sortKho.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [inventory, searchTerm, sortKho]);

    // --- XỬ LÝ PHIẾU NHẬP ---
    const processedPhieus = useMemo(() => {
        let filtered = phieus;
        if (searchTerm.trim()) {
            const s = searchTerm.toLowerCase();
            filtered = phieus.filter(p =>
                (p.tenNhaCungCap || "").toLowerCase().includes(s) ||
                (p.tenLoaiCa || "").toLowerCase().includes(s) ||
                (p.tenNguoiTaoPhieu || "").toLowerCase().includes(s)
            );
        }
        return [...filtered].sort((a, b) => {
            const va = a[sortNhap.key], vb = b[sortNhap.key];
            if (typeof va === "string" && typeof vb === "string")
                return sortNhap.direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            if (va < vb) return sortNhap.direction === "asc" ? -1 : 1;
            if (va > vb) return sortNhap.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [phieus, searchTerm, sortNhap]);

    // --- PHÂN TRANG CHUNG ---
    const currentData = tab === "kho" ? processedInventory : processedPhieus;
    const totalPages = Math.ceil(currentData.length / pageSize);
    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return currentData.slice(start, start + pageSize);
    }, [currentData, currentPage]);

    const requestSortKho = (key) => {
        setSortKho(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
        setCurrentPage(1);
    };
    const requestSortNhap = (key) => {
        setSortNhap(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
        setCurrentPage(1);
    };

    const handleImport = (item) => {
        navigate("/admin/QuanLyKho/nhap-hang", {
            state: {
                id: item.id,
                initialLoaicaId: item.idLoaiCa,
                initialSizeId: item.idSizeCa,
                initialSizeName: item.tenSize,
            },
        });
    };

    const handleMarkPaid = async (id) => {
        setSubmitting(true);
        try {
            await api.patch(`/Phieunhaps/${id}/thanh-toan`);
            showToast("Đã cập nhật trạng thái thanh toán!", "success");
            setConfirmId(null);
            fetchPhieus();
        } catch {
            showToast("Có lỗi xảy ra, vui lòng thử lại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const SortTh = ({ label, sortKey, current, onSort, className = "" }) => (
        <th
            className={`p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
            onClick={() => onSort(sortKey)}
        >
            {label} {current.key === sortKey && (current.direction === "asc" ? "↑" : "↓")}
        </th>
    );

    return (
        <AdminLayout title="Quản Lý Kho Hàng">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md">
                    <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={tab === "kho" ? "Tìm theo tên sản phẩm, size..." : "Tìm theo nhà cung cấp, loại cá, người tạo..."}
                        value={searchTerm}
                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white"
                    />
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyKho/nhap-hang")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer"
                >
                    Tạo Phiếu Nhập
                </button>
            </div>

            {/* TABS */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
                <button
                    onClick={() => setTab("kho")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "kho" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Kho hàng tồn
                </button>
                <button
                    onClick={() => setTab("nhap")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "nhap" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lịch sử nhập hàng
                </button>
            </div>

            {/* BẢNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                {tab === "kho" ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[600px]">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortKho("tenLoaiCa")}>
                                        Tên sản phẩm {sortKho.key === "tenLoaiCa" && (sortKho.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortKho("tenSize")}>
                                        Size {sortKho.key === "tenSize" && (sortKho.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortKho("soluongton")}>
                                        Tồn kho {sortKho.key === "soluongton" && (sortKho.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm divide-y divide-slate-100">
                                {loadingKho ? (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map(item => (
                                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 font-bold text-slate-900">{item.tenLoaiCa}</td>
                                            <td className="p-4 text-slate-600">{item.tenSize}</td>
                                            <td className="p-4 text-center font-bold text-cyan-600">{item.soluongton} kg</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => handleImport(item)}
                                                    className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg font-medium text-xs hover:bg-cyan-100 transition-colors cursor-pointer"
                                                >
                                                    Nhập hàng
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="4" className="p-8 text-center text-slate-400 italic">Không tìm thấy dữ liệu.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[1060px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 w-8"></th>
                                    <SortTh label="Ngày nhập"    sortKey="ngaynhap"         current={sortNhap} onSort={requestSortNhap} />
                                    <SortTh label="Nhà cung cấp" sortKey="tenNhaCungCap"    current={sortNhap} onSort={requestSortNhap} />
                                    <SortTh label="Loại cá"      sortKey="tenLoaiCa"        current={sortNhap} onSort={requestSortNhap} />
                                    <SortTh label="Người tạo"    sortKey="tenNguoiTaoPhieu" current={sortNhap} onSort={requestSortNhap} />
                                    <th className="p-4 text-right">Tổng SL (kg)</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <SortTh label="Thanh toán"   sortKey="trangthaithanhtoan" current={sortNhap} onSort={requestSortNhap} />
                                    <th className="p-4 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingNhap ? (
                                    <tr><td colSpan="9" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginated.length > 0 ? (
                                    paginated.map(p => {
                                        const status = THANHTOAN_STATUS[p.trangthaithanhtoan] || { label: p.trangthaithanhtoan, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        const isConfirming = confirmId === p.idphieunhap;
                                        const isExpanded = expandedId === p.idphieunhap;
                                        const hasDetail = p.listChiTiet && p.listChiTiet.length > 0;
                                        return (
                                            <React.Fragment key={p.idphieunhap}>
                                                <tr className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="p-4 text-center">
                                                        {hasDetail && (
                                                            <button
                                                                onClick={() => setExpandedId(prev => prev === p.idphieunhap ? null : p.idphieunhap)}
                                                                className="text-slate-400 hover:text-slate-700 transition-colors"
                                                            >
                                                                {isExpanded ? "▾" : "▸"}
                                                            </button>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-slate-500">{p.ngaynhap}</td>
                                                    <td className="p-4 font-bold text-slate-800">{p.tenNhaCungCap}</td>
                                                    <td className="p-4">{p.tenLoaiCa}</td>
                                                    <td className="p-4 text-slate-600">{p.tenNguoiTaoPhieu || "—"}</td>
                                                    <td className="p-4 text-right font-medium">{Number(p.tongsoluong || 0).toLocaleString()}</td>
                                                    <td className="p-4 text-right font-bold text-cyan-700">{formatCurrency(p.tongtien)}</td>
                                                    <td className="p-4">
                                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${status.badge}`}>
                                                            {status.label}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        {isAdmin && p.trangthaithanhtoan === "CHUA_THANH_TOAN" ? (
                                                            isConfirming ? (
                                                                <div className="flex items-center justify-center gap-2">
                                                                    <button
                                                                        onClick={() => handleMarkPaid(p.idphieunhap)}
                                                                        disabled={submitting}
                                                                        className="px-3 py-1.5 bg-green-600 text-white font-bold rounded-lg text-xs hover:bg-green-700 disabled:opacity-50 transition-colors"
                                                                    >
                                                                        {submitting ? "..." : "Xác nhận"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmId(null)}
                                                                        disabled={submitting}
                                                                        className="px-3 py-1.5 border border-slate-200 text-slate-600 font-bold rounded-lg text-xs hover:bg-slate-50 transition-colors"
                                                                    >
                                                                        Hủy
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={() => setConfirmId(p.idphieunhap)}
                                                                    className="px-3.5 py-1.5 bg-orange-50 text-orange-600 border border-orange-200 font-bold rounded-lg text-xs hover:bg-orange-100 transition-colors"
                                                                >
                                                                    Đánh dấu đã TT
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="text-xs text-slate-400">—</span>
                                                        )}
                                                    </td>
                                                </tr>

                                                {isExpanded && hasDetail && (
                                                    <tr className="bg-cyan-50/40">
                                                        <td colSpan="9" className="px-8 py-3">
                                                            <table className="w-full text-xs border-collapse">
                                                                <thead>
                                                                    <tr className="text-slate-500 uppercase font-bold border-b border-slate-200">
                                                                        <th className="py-1.5 text-left">Size</th>
                                                                        <th className="py-1.5 text-right">Số lượng (kg)</th>
                                                                        <th className="py-1.5 text-right">Giá nhập/kg</th>
                                                                        <th className="py-1.5 text-right">Thành tiền</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100">
                                                                    {p.listChiTiet.map((ct, idx) => (
                                                                        <tr key={idx} className="text-slate-700">
                                                                            <td className="py-1.5 font-semibold">{ct.tenSize}</td>
                                                                            <td className="py-1.5 text-right">{Number(ct.soluongnhap || 0).toLocaleString()}</td>
                                                                            <td className="py-1.5 text-right">{formatCurrency(ct.gianhap)}</td>
                                                                            <td className="py-1.5 text-right font-bold text-cyan-700">{formatCurrency(ct.thanhtien)}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="9" className="p-8 text-center text-slate-400 italic">Chưa có phiếu nhập nào.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* PHÂN TRANG CHUNG */}
                {currentData.length > pageSize && (
                    <div className="p-4 border-t border-slate-200 flex items-center gap-2 bg-slate-50/50">
                        <button
                            onClick={() => setCurrentPage(p => p - 1)}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Trước
                        </button>
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={`size-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                    currentPage === page ? "bg-cyan-600 text-white shadow-sm" : "text-slate-600 hover:bg-slate-200"
                                }`}
                            >
                                {page}
                            </button>
                        ))}
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
