import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const THANHTOAN_STATUS = {
    "CHUA_THANH_TOAN": { label: "Chưa thanh toán", badge: "bg-orange-50 text-orange-700 border-orange-200" },
    "DA_THANH_TOAN":   { label: "Đã thanh toán",   badge: "bg-green-50 text-green-700 border-green-200"  },
};

const formatCurrency = (value) => new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";

function SortTh({ label, sortKey, current, onSort, className = "" }) {
    return (
        <th
            className={`p-4 cursor-pointer hover:bg-slate-100 transition-colors select-none ${className}`}
            onClick={() => onSort(sortKey)}
        >
            {label} {current.key === sortKey && (current.direction === "asc" ? "↑" : "↓")}
        </th>
    );
}

export default function LichSuPhieuNhap() {
    const { showToast } = useToast();

    const [phieus, setPhieus] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sort, setSort] = useState({ key: "ngaynhap", direction: "desc" });
    const [confirmId, setConfirmId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [expandedId, setExpandedId] = useState(null);
    const pageSize = 10;

    const fetchPhieus = () => {
        setLoading(true);
        api.get("/Phieunhaps")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải lịch sử phiếu nhập!", "error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchPhieus(); }, []);
    useEffect(() => { setCurrentPage(1); }, [searchTerm]);

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
            const va = a[sort.key], vb = b[sort.key];
            if (typeof va === "string" && typeof vb === "string")
                return sort.direction === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
            if (va < vb) return sort.direction === "asc" ? -1 : 1;
            if (va > vb) return sort.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [phieus, searchTerm, sort]);

    const paginated = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedPhieus.slice(start, start + pageSize);
    }, [processedPhieus, currentPage]);

    const totalPages = Math.ceil(processedPhieus.length / pageSize);

    const requestSort = (key) => {
        setSort(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
        setCurrentPage(1);
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

    const toggleExpand = (id) => setExpandedId(prev => prev === id ? null : id);

    return (
        <AdminLayout title="Lịch Sử Phiếu Nhập Hàng">
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
                        placeholder="Tìm theo nhà cung cấp, loại cá, người tạo..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white"
                    />
                </div>
                <p className="text-sm text-slate-500 shrink-0">{processedPhieus.length} phiếu nhập</p>
            </div>

            {/* BẢNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1060px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4 w-8"></th>
                                <SortTh label="Ngày nhập"      sortKey="ngaynhap"         current={sort} onSort={requestSort} />
                                <SortTh label="Nhà cung cấp"   sortKey="tenNhaCungCap"    current={sort} onSort={requestSort} />
                                <SortTh label="Loại cá"        sortKey="tenLoaiCa"        current={sort} onSort={requestSort} />
                                <SortTh label="Người tạo"      sortKey="tenNguoiTaoPhieu" current={sort} onSort={requestSort} />
                                <th className="p-4 text-right">Tổng SL (kg)</th>
                                <th className="p-4 text-right">Tổng tiền</th>
                                <SortTh label="Thanh toán" sortKey="trangthaithanhtoan" current={sort} onSort={requestSort} />
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
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
                                                            onClick={() => toggleExpand(p.idphieunhap)}
                                                            className="text-slate-400 hover:text-slate-700 transition-colors"
                                                            title={isExpanded ? "Thu gọn" : "Xem chi tiết sizes"}
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
                                                    {p.trangthaithanhtoan === "CHUA_THANH_TOAN" ? (
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

                                            {/* EXPANDED: Chi tiết sizes */}
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

                {/* PHÂN TRANG */}
                {processedPhieus.length > pageSize && (
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
