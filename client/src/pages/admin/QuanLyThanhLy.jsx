import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const THANHLY_STATUS = {
    "DA_TIEU_HUY": { label: "Đã tiêu hủy", badge: "bg-red-50 text-red-700 border-red-200" },
    "DA_BAN_THANH_LY": { label: "Đã bán thanh lý", badge: "bg-green-50 text-green-700 border-green-200" },
};

const LO_TRANGTHAI = {
    "CON_HANG": { label: "Còn hàng", badge: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    "HET_HANG": { label: "Hết hàng", badge: "bg-gray-50 text-gray-600 border-slate-200" },
    "THANH_LY": { label: "Đã thanh lý", badge: "bg-slate-100 text-slate-500 border-slate-200" },
};

export default function QuanLyThanhLy() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [searchParams] = useSearchParams();

    // --- STATE GIAO DIỆN & DỮ LIỆU ---
    // Cho phép nhảy thẳng vào tab qua URL (?tab=quahan) - dùng khi bấm từ thông báo/Dashboard
    const tabHopLe = ["lo", "quahan", "phieu"];
    const tabTuUrl = searchParams.get("tab");
    const [tab, setTab] = useState(tabHopLe.includes(tabTuUrl) ? tabTuUrl : "lo"); // "lo" | "quahan" | "phieu"
    const [phieus, setPhieus] = useState([]);
    const [loadingPhieus, setLoadingPhieus] = useState(true);
    const [lots, setLots] = useState([]);
    const [loadingLots, setLoadingLots] = useState(true);
    const [overdueLots, setOverdueLots] = useState([]);
    const [loadingOverdue, setLoadingOverdue] = useState(true);

    // --- STATE TÌM KIẾM, SẮP XẾP & PHÂN TRANG ---
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    
    const [sortLot, setSortLot] = useState({ key: "ngaynhap", direction: "desc" });
    const [sortPhieu, setSortPhieu] = useState({ key: "ngaythanhly", direction: "desc" });

    // --- GỌI API ---
    const fetchPhieus = () => {
        setLoadingPhieus(true);
        api.get("/Phieuthanhlys")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách phiếu thanh lý!", "error"))
            .finally(() => setLoadingPhieus(false));
    };

    const fetchLots = () => {
        setLoadingLots(true);
        api.get("/Phieuthanhlys/tat-ca-lo-con-hang")
            .then(res => setLots(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách lô hàng!", "error"))
            .finally(() => setLoadingLots(false));
    };

    const fetchOverdueLots = () => {
        setLoadingOverdue(true);
        api.get("/Phieuthanhlys/lo-qua-han")
            .then(res => setOverdueLots(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách lô quá hạn!", "error"))
            .finally(() => setLoadingOverdue(false));
    };

    useEffect(() => {
        fetchPhieus();
        fetchLots();
        fetchOverdueLots();
    }, []);

    // Reset về trang 1 mỗi khi đổi tab hoặc gõ tìm kiếm
    useEffect(() => {
        setCurrentPage(1);
    }, [tab, searchTerm]);

    // --- CÁC HÀM TIỆN ÍCH CHO PHIẾU ---
    const tinhTongSoLuong = (listChiTiet) => (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.soluongthanhly), 0);
    const tinhTongTien = (listChiTiet) => (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.thanhtien), 0);
    const tenSanPham = (listChiTiet) => {
        const ten = [...new Set((listChiTiet || []).map(ct => `${ct.tenLoaiCa} (${ct.tenSize})`))];
        return ten.join(", ");
    };

    // --- XỬ LÝ DỮ LIỆU: TÌM KIẾM, SẮP XẾP, PHÂN TRANG CHO LÔ HÀNG ---
    const processedLots = useMemo(() => {
        let filtered = lots;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = lots.filter(l => 
                (l.tenLoaiCa || "").toLowerCase().includes(search) || 
                (l.tenSize || "").toLowerCase().includes(search)
            );
        }

        return [...filtered].sort((a, b) => {
            const valA = a[sortLot.key];
            const valB = b[sortLot.key];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortLot.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (valA < valB) return sortLot.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortLot.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [lots, searchTerm, sortLot]);

    const paginatedLots = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedLots.slice(start, start + pageSize);
    }, [processedLots, currentPage]);

    const totalLotPages = Math.ceil(processedLots.length / pageSize);

    // --- XỬ LÝ DỮ LIỆU: TÌM KIẾM, SẮP XẾP, PHÂN TRANG CHO LÔ QUÁ HẠN (dùng chung sortLot với tab "lo") ---
    const processedOverdueLots = useMemo(() => {
        let filtered = overdueLots;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = overdueLots.filter(l =>
                (l.tenLoaiCa || "").toLowerCase().includes(search) ||
                (l.tenSize || "").toLowerCase().includes(search)
            );
        }

        return [...filtered].sort((a, b) => {
            const valA = a[sortLot.key];
            const valB = b[sortLot.key];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortLot.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (valA < valB) return sortLot.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortLot.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [overdueLots, searchTerm, sortLot]);

    const paginatedOverdueLots = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedOverdueLots.slice(start, start + pageSize);
    }, [processedOverdueLots, currentPage]);

    const totalOverduePages = Math.ceil(processedOverdueLots.length / pageSize);

    const tinhSoNgayQuaHan = (ngaynhap) => {
        const ngayNhapDate = new Date(ngaynhap);
        const homNay = new Date();
        const soMs = homNay.setHours(0, 0, 0, 0) - ngayNhapDate.setHours(0, 0, 0, 0);
        return Math.floor(soMs / (1000 * 60 * 60 * 24));
    };

    // --- XỬ LÝ DỮ LIỆU: TÌM KIẾM, SẮP XẾP, PHÂN TRANG CHO PHIẾU ĐÃ LẬP ---
    const processedPhieus = useMemo(() => {
        let filtered = phieus;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = phieus.filter(p => 
                (p.tenNguoiTaoPhieu || "").toLowerCase().includes(search) ||
                (p.lydothanhly || "").toLowerCase().includes(search)
            );
        }

        return [...filtered].sort((a, b) => {
            const valA = a[sortPhieu.key];
            const valB = b[sortPhieu.key];
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortPhieu.direction === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
            }
            if (valA < valB) return sortPhieu.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortPhieu.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [phieus, searchTerm, sortPhieu]);

    const paginatedPhieus = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedPhieus.slice(start, start + pageSize);
    }, [processedPhieus, currentPage]);

    const totalPhieuPages = Math.ceil(processedPhieus.length / pageSize);

    // Lấy thông số phân trang của Tab hiện tại
    const currentTotalPages = tab === "lo" ? totalLotPages : tab === "quahan" ? totalOverduePages : totalPhieuPages;
    const currentTotalRecords = tab === "lo" ? processedLots.length : tab === "quahan" ? processedOverdueLots.length : processedPhieus.length;

    // --- CÁC HÀM SỰ KIỆN SẮP XẾP ---
    const requestSortLot = (key) => {
        let direction = "asc";
        if (sortLot.key === key && sortLot.direction === "asc") direction = "desc";
        setSortLot({ key, direction });
        setCurrentPage(1);
    };

    const requestSortPhieu = (key) => {
        let direction = "asc";
        if (sortPhieu.key === key && sortPhieu.direction === "asc") direction = "desc";
        setSortPhieu({ key, direction });
        setCurrentPage(1);
    };

    return (
        <AdminLayout title="Quản Lý Thanh Lý">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder={`Tìm kiếm ${tab === 'phieu' ? 'phiếu (người tạo, lý do)' : 'lô hàng (tên cá, size)'}...`}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white"
                    />
                </div>
                <button
                    onClick={() => navigate("/admin/QuanLyThanhLy/tao-phieu")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl text-sm hover:bg-cyan-700 shadow-md transition-all active:scale-95 w-full sm:w-auto"
                >
                    Lập phiếu nhiều lô
                </button>
            </div>

            {/* TABS */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
                <button
                    onClick={() => setTab("lo")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "lo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lô hàng tồn
                </button>
                <button
                    onClick={() => setTab("quahan")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 ${tab === "quahan" ? "bg-white text-red-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lô hàng đã quá hạn
                    {overdueLots.length > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {overdueLots.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("phieu")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "phieu" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Phiếu thanh lý đã lập
                </button>
            </div>

            {/* KHUNG HIỂN THỊ BẢNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                
                {tab === "lo" ? (
                    // --- BẢNG LÔ HÀNG TỒN ---
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("tenLoaiCa")}>
                                        Loại cá {sortLot.key === "tenLoaiCa" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("tenSize")}>
                                        Size {sortLot.key === "tenSize" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("ngaynhap")}>
                                        Ngày nhập {sortLot.key === "ngaynhap" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("soluongnhap")}>
                                        SL nhập (kg) {sortLot.key === "soluongnhap" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("soluongconlai")}>
                                        Còn lại (kg) {sortLot.key === "soluongconlai" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4">Trạng thái</th>
                                    <th className="p-4 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingLots ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginatedLots.length > 0 ? (
                                    paginatedLots.map((lot) => {
                                        const statusConfig = LO_TRANGTHAI[lot.trangthaica] || { label: lot.trangthaica, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        return (
                                            <tr key={lot.idchitietphieunhap} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                                <td className="p-4">{lot.tenSize}</td>
                                                <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                                                <td className="p-4 text-right">{lot.soluongnhap}</td>
                                                <td className="p-4 text-right font-bold text-cyan-700">{lot.soluongconlai}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <button
                                                        onClick={() => navigate(`/admin/QuanLyThanhLy/thanh-ly/${lot.idchitietphieunhap}`)}
                                                        className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg text-xs hover:bg-red-100"
                                                    >
                                                        Thanh lý
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Không có lô hàng nào hiển thị.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : tab === "quahan" ? (
                    // --- BẢNG LÔ HÀNG ĐÃ QUÁ HẠN ---
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("tenLoaiCa")}>
                                        Loại cá {sortLot.key === "tenLoaiCa" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("tenSize")}>
                                        Size {sortLot.key === "tenSize" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("ngaynhap")}>
                                        Ngày nhập {sortLot.key === "ngaynhap" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-center text-red-600 bg-red-50">Quá hạn (ngày)</th>
                                    <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortLot("soluongconlai")}>
                                        Còn lại (kg) {sortLot.key === "soluongconlai" && (sortLot.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingOverdue ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginatedOverdueLots.length > 0 ? (
                                    paginatedOverdueLots.map((lot) => (
                                        <tr key={lot.idchitietphieunhap} className="hover:bg-red-50/30 transition-colors">
                                            <td className="p-4 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                            <td className="p-4">{lot.tenSize}</td>
                                            <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                                            <td className="p-4 text-center font-bold text-red-600 bg-red-50/50">{tinhSoNgayQuaHan(lot.ngaynhap)}</td>
                                            <td className="p-4 text-right font-bold text-cyan-700">{lot.soluongconlai}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/admin/QuanLyThanhLy/thanh-ly/${lot.idchitietphieunhap}`)}
                                                    className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg text-xs hover:bg-red-100"
                                                >
                                                    Thanh lý
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không có lô hàng nào quá hạn.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // --- BẢNG PHIẾU THANH LÝ ---
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortPhieu("ngaythanhly")}>
                                        Ngày thanh lý {sortPhieu.key === "ngaythanhly" && (sortPhieu.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortPhieu("tenNguoiTaoPhieu")}>
                                        Người tạo {sortPhieu.key === "tenNguoiTaoPhieu" && (sortPhieu.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4">Sản phẩm</th>
                                    <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSortPhieu("lydothanhly")}>
                                        Lý do {sortPhieu.key === "lydothanhly" && (sortPhieu.direction === "asc" ? "↑" : "↓")}
                                    </th>
                                    <th className="p-4 text-right">Tổng SL (kg)</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingPhieus ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginatedPhieus.length > 0 ? (
                                    paginatedPhieus.map((item) => {
                                        const statusConfig = THANHLY_STATUS[item.trangthai] || { label: item.trangthai, badge: "bg-gray-50 text-gray-600 border-slate-200" };
                                        return (
                                            <tr key={item.idphieuthanhly} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-slate-500">{new Date(item.ngaythanhly).toLocaleString('vi-VN')}</td>
                                                <td className="p-4 font-bold text-slate-800">{item.tenNguoiTaoPhieu}</td>
                                                <td className="p-4">{tenSanPham(item.listChiTiet)}</td>
                                                <td className="p-4">{item.lydothanhly}</td>
                                                <td className="p-4 text-right font-medium">{tinhTongSoLuong(item.listChiTiet)}</td>
                                                <td className="p-4 text-right font-bold text-slate-800">{tinhTongTien(item.listChiTiet).toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}>
                                                        {statusConfig.label}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có phiếu thanh lý nào hiển thị.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* --- COMPONENT ĐIỀU HƯỚNG PHÂN TRANG CHUNG --- */}
                {currentTotalRecords > 0 && (
                    <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-50/50">
                        
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setCurrentPage(prev => prev - 1)} 
                                disabled={currentPage === 1}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Trước
                            </button>
                            
                            <div className="flex items-center gap-1">
                                {Array.from({ length: currentTotalPages }, (_, i) => i + 1).map(page => (
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
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                disabled={currentPage === currentTotalPages}
                                className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm font-medium hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}