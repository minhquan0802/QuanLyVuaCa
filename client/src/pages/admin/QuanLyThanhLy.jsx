import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const THANHLY_STATUS = {
    "DA_TIEU_HUY": { label: "Đã tiêu hủy", badge: "bg-red-50 text-red-700 border-red-200" },
    "DA_BAN_THANH_LY": { label: "Đã bán thanh lý", badge: "bg-green-50 text-green-700 border-green-200" },
};

const formatDate = (value) => value ? new Date(value).toLocaleDateString("vi-VN") : "";

function ColumnFilter({ label, options, selectedValues, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const buttonRef = useRef(null);
    const popoverRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleClickOutside = (event) => {
            if (!buttonRef.current?.contains(event.target)
                && !popoverRef.current?.contains(event.target)) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === "Escape") setIsOpen(false);
        };
        const handleResize = () => setIsOpen(false);

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleEscape);
        window.addEventListener("resize", handleResize);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleEscape);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    const togglePopover = () => {
        if (!isOpen && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const width = 256;
            const padding = 12;
            setPosition({
                top: rect.bottom + 8,
                left: Math.max(
                    padding,
                    Math.min(rect.right - width, window.innerWidth - width - padding)
                )
            });
        }
        setIsOpen(previous => !previous);
    };

    const toggleValue = (value) => {
        onChange(
            selectedValues.includes(value)
                ? selectedValues.filter(item => item !== value)
                : [...selectedValues, value]
        );
    };

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={togglePopover}
                title={`Lọc theo ${label.toLowerCase()}`}
                aria-label={`Lọc theo ${label.toLowerCase()}`}
                aria-expanded={isOpen}
                className={`relative size-8 shrink-0 inline-flex items-center justify-center rounded-lg border transition-colors ${
                    selectedValues.length > 0
                        ? "border-cyan-300 bg-cyan-100 text-cyan-700"
                        : "border-slate-200 bg-white text-slate-500 hover:border-cyan-300 hover:text-cyan-700"
                }`}
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6.75 9.75h10.5M10.5 15h3M12 15v4.5" />
                </svg>
                {selectedValues.length > 0 && (
                    <span className="absolute -right-2 -top-2 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-cyan-600 text-[10px] font-bold text-white shadow-sm">
                        {selectedValues.length}
                    </span>
                )}
            </button>

            {isOpen && typeof document !== "undefined" && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed z-50 w-64 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden normal-case"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="flex items-center justify-between gap-2 p-3 border-b border-slate-100 bg-slate-50">
                        <span className="text-xs font-bold text-slate-700">{label}</span>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => onChange(options.map(option => option.value))}
                                className="text-xs font-bold text-cyan-700 hover:text-cyan-900"
                            >
                                Tất cả
                            </button>
                            <button
                                type="button"
                                onClick={() => onChange([])}
                                disabled={selectedValues.length === 0}
                                className="text-xs font-bold text-slate-500 hover:text-slate-700 disabled:opacity-40"
                            >
                                Bỏ chọn
                            </button>
                        </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto p-2">
                        {options.map(option => (
                            <label
                                key={String(option.value)}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-cyan-50"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedValues.includes(option.value)}
                                    onChange={() => toggleValue(option.value)}
                                    className="size-4 accent-cyan-600"
                                />
                                <span className="min-w-0 flex-1 truncate text-sm font-medium text-slate-700">
                                    {option.label}
                                </span>
                            </label>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}

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

    // --- STATE BỘ LỌC & PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;
    const [selectedLotFishNames, setSelectedLotFishNames] = useState([]);
    const [selectedLotSizes, setSelectedLotSizes] = useState([]);
    const [selectedPhieuDates, setSelectedPhieuDates] = useState([]);
    const [selectedPhieuFishNames, setSelectedPhieuFishNames] = useState([]);
    const [selectedPhieuStatuses, setSelectedPhieuStatuses] = useState([]);
    const [selectedLotIds, setSelectedLotIds] = useState([]);

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
        setLoadingOverdue(true);
        Promise.all([
            api.get("/Phieuthanhlys/tat-ca-lo-con-hang"),
            api.get("/Phieuthanhlys/lo-qua-han"),
        ])
            .then(([allLotsResponse, overdueLotsResponse]) => {
                const allLots = allLotsResponse.data.result || [];
                const overdue = overdueLotsResponse.data.result || [];
                const overdueIds = new Set(overdue.map(lot => lot.idchitietphieunhap));

                setLots(allLots.filter(lot => !overdueIds.has(lot.idchitietphieunhap)));
                setOverdueLots(overdue);
            })
            .catch(() => showToast("Không thể tải danh sách lô hàng!", "error"))
            .finally(() => {
                setLoadingLots(false);
                setLoadingOverdue(false);
            });
    };

    useEffect(() => {
        fetchPhieus();
        fetchLots();
    }, []);

    // Reset về trang 1 mỗi khi đổi tab
    useEffect(() => {
        setCurrentPage(1);
    }, [tab]);

    // --- CÁC HÀM TIỆN ÍCH CHO PHIẾU ---
    const tinhTongSoLuong = (listChiTiet) => (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.soluongthanhly), 0);
    const tinhTongTien = (listChiTiet) => (listChiTiet || []).reduce((sum, ct) => sum + Number(ct.thanhtien), 0);
    const tenSanPham = (listChiTiet) => {
        const ten = [...new Set((listChiTiet || []).map(ct => `${ct.tenLoaiCa} (${ct.tenSize})`))];
        return ten.join(", ");
    };

    // --- XỬ LÝ DỮ LIỆU: LỌC & PHÂN TRANG CHO LÔ HÀNG ---
    const processedLots = useMemo(() => {
        let filtered = lots;
        if (selectedLotFishNames.length > 0) {
            filtered = filtered.filter(lot => selectedLotFishNames.includes(lot.tenLoaiCa));
        }
        if (selectedLotSizes.length > 0) {
            filtered = filtered.filter(lot => selectedLotSizes.includes(lot.tenSize));
        }
        return filtered;
    }, [lots, selectedLotFishNames, selectedLotSizes]);

    const paginatedLots = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedLots.slice(start, start + pageSize);
    }, [processedLots, currentPage]);

    const totalLotPages = Math.ceil(processedLots.length / pageSize);

    // --- XỬ LÝ DỮ LIỆU: LỌC & PHÂN TRANG CHO LÔ QUÁ HẠN ---
    const processedOverdueLots = useMemo(() => {
        let filtered = overdueLots;
        if (selectedLotFishNames.length > 0) {
            filtered = filtered.filter(lot => selectedLotFishNames.includes(lot.tenLoaiCa));
        }
        if (selectedLotSizes.length > 0) {
            filtered = filtered.filter(lot => selectedLotSizes.includes(lot.tenSize));
        }
        return filtered;
    }, [overdueLots, selectedLotFishNames, selectedLotSizes]);

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

    // --- XỬ LÝ DỮ LIỆU: LỌC & PHÂN TRANG CHO PHIẾU ĐÃ LẬP ---
    const processedPhieus = useMemo(() => {
        let filtered = phieus;
        if (selectedPhieuDates.length > 0) {
            filtered = filtered.filter(phieu => selectedPhieuDates.includes(formatDate(phieu.ngaythanhly)));
        }
        if (selectedPhieuFishNames.length > 0) {
            filtered = filtered.filter(phieu =>
                (phieu.listChiTiet || []).some(detail => selectedPhieuFishNames.includes(detail.tenLoaiCa))
            );
        }
        if (selectedPhieuStatuses.length > 0) {
            filtered = filtered.filter(phieu => selectedPhieuStatuses.includes(phieu.trangthai));
        }
        return filtered;
    }, [phieus, selectedPhieuDates, selectedPhieuFishNames, selectedPhieuStatuses]);

    const lotFilterSource = useMemo(() => [...lots, ...overdueLots], [lots, overdueLots]);

    const lotFishOptions = useMemo(() =>
        [...new Set(lotFilterSource.map(lot => lot.tenLoaiCa).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [lotFilterSource]);

    const lotSizeOptions = useMemo(() =>
        [...new Set(lotFilterSource.map(lot => lot.tenSize).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [lotFilterSource]);

    const phieuDateOptions = useMemo(() =>
        [...new Set(phieus.map(phieu => formatDate(phieu.ngaythanhly)).filter(Boolean))]
            .map(value => ({ value, label: value })), [phieus]);

    const phieuFishOptions = useMemo(() =>
        [...new Set(phieus.flatMap(phieu =>
            (phieu.listChiTiet || []).map(detail => detail.tenLoaiCa).filter(Boolean)
        ))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [phieus]);

    const phieuStatusOptions = useMemo(() =>
        [...new Set(phieus.map(phieu => phieu.trangthai).filter(Boolean))]
            .map(value => ({ value, label: THANHLY_STATUS[value]?.label || value })), [phieus]);

    const paginatedPhieus = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return processedPhieus.slice(start, start + pageSize);
    }, [processedPhieus, currentPage]);

    const totalPhieuPages = Math.ceil(processedPhieus.length / pageSize);

    // Lấy thông số phân trang của Tab hiện tại
    const currentTotalPages = tab === "lo" ? totalLotPages : tab === "quahan" ? totalOverduePages : totalPhieuPages;
    const currentTotalRecords = tab === "lo" ? processedLots.length : tab === "quahan" ? processedOverdueLots.length : processedPhieus.length;

    const updateFilter = (setter, values) => {
        setter(values);
        setCurrentPage(1);
    };

    const toggleLotSelection = (lotId) => {
        setSelectedLotIds(previous =>
            previous.includes(lotId)
                ? previous.filter(id => id !== lotId)
                : [...previous, lotId]
        );
    };

    const toggleVisibleLots = (visibleLots) => {
        const visibleIds = visibleLots.map(lot => lot.idchitietphieunhap);
        const allVisibleSelected = visibleIds.length > 0
            && visibleIds.every(id => selectedLotIds.includes(id));

        setSelectedLotIds(previous => allVisibleSelected
            ? previous.filter(id => !visibleIds.includes(id))
            : [...new Set([...previous, ...visibleIds])]
        );
    };

    const selectedLots = useMemo(() => {
        const lotsById = new Map(
            [...lots, ...overdueLots].map(lot => [lot.idchitietphieunhap, lot])
        );
        return selectedLotIds.map(id => lotsById.get(id)).filter(Boolean);
    }, [lots, overdueLots, selectedLotIds]);

    const selectedTotalKg = selectedLots.reduce(
        (sum, lot) => sum + Number(lot.soluongconlai || 0),
        0
    );

    const openMultiLotForm = () => {
        navigate("/admin/QuanLyThanhLy/tao-phieu", {
            state: { selectedLotIds }
        });
    };

    return (
        <AdminLayout title="Quản Lý Thanh Lý">
            {/* TABS */}
            <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
                <button
                    onClick={() => setTab("lo")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${tab === "lo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Lô hàng còn hạn
                </button>
                <button
                    onClick={() => setTab("quahan")}
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${tab === "quahan" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
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
                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors cursor-pointer whitespace-nowrap ${tab === "phieu" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
                >
                    Phiếu thanh lý đã lập
                </button>
            </div>

            {selectedLotIds.length > 0 && (
                <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-black bg-cyan-50 px-4 py-3">
                    <div className="text-sm text-cyan-900">
                        Đã chọn <strong>{selectedLotIds.length} lô</strong>
                        <span className="mx-2 text-cyan-300">•</span>
                        Tổng tồn <strong>{selectedTotalKg.toLocaleString("vi-VN")} kg</strong>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedLotIds([])}
                            className="px-3 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-white transition-colors cursor-pointer"
                        >
                            Bỏ chọn
                        </button>
                        <button
                            type="button"
                            onClick={openMultiLotForm}
                            className="admin-primary-action"
                        >
                            Lập phiếu cho {selectedLotIds.length} lô
                        </button>
                    </div>
                </div>
            )}

            {/* KHUNG HIỂN THỊ BẢNG */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
                
                {tab === "lo" ? (
                    // --- BẢNG LÔ HÀNG CÒN HẠN ---
                    <div className="overflow-x-auto">
                        <table className="w-full text-left min-w-[900px] border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                                <tr>
                                    <th className="p-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={paginatedLots.length > 0 && paginatedLots.every(lot => selectedLotIds.includes(lot.idchitietphieunhap))}
                                            onChange={() => toggleVisibleLots(paginatedLots)}
                                            aria-label="Chọn tất cả lô còn hạn trên trang"
                                            className="size-4 accent-cyan-600"
                                        />
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tên loại cá</span>
                                            <ColumnFilter
                                                label="Tên loại cá"
                                                options={lotFishOptions}
                                                selectedValues={selectedLotFishNames}
                                                onChange={values => updateFilter(setSelectedLotFishNames, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Kích thước</span>
                                            <ColumnFilter
                                                label="Kích thước"
                                                options={lotSizeOptions}
                                                selectedValues={selectedLotSizes}
                                                onChange={values => updateFilter(setSelectedLotSizes, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Ngày nhập</th>
                                    <th className="p-4 text-right">SL nhập (kg)</th>
                                    <th className="p-4 text-right">Còn lại (kg)</th>
                                    <th className="p-4 text-center w-36">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingLots ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginatedLots.length > 0 ? (
                                    paginatedLots.map((lot) => (
                                            <tr key={lot.idchitietphieunhap} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="p-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLotIds.includes(lot.idchitietphieunhap)}
                                                        onChange={() => toggleLotSelection(lot.idchitietphieunhap)}
                                                        aria-label={`Chọn lô ${lot.tenLoaiCa} ${lot.tenSize}`}
                                                        className="size-4 accent-cyan-600"
                                                    />
                                                </td>
                                                <td className="p-4 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                                <td className="p-4">{lot.tenSize}</td>
                                                <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                                                <td className="p-4 text-right">{lot.soluongnhap}</td>
                                                <td className="p-4 text-right font-bold text-cyan-700">{lot.soluongconlai}</td>
                                                <td className="p-4">
                                                    <div className="flex flex-col items-stretch gap-2">
                                                        <button
                                                            onClick={() => navigate(`/admin/QuanLyThanhLy/thanh-ly/${lot.idchitietphieunhap}`)}
                                                            className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 transition-colors text-xs cursor-pointer"
                                                        >
                                                            Thanh lý
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="7" className="p-10">
                                            <div className="flex flex-col items-center gap-4 text-center">
                                                <div>
                                                    <p className="font-bold text-slate-700">Không có lô hàng còn hạn.</p>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Kiểm tra kho tồn để nhập thêm hoặc xem các lô hàng đã quá hạn.
                                                    </p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => navigate("/admin/QuanLyKho")}
                                                    className="inline-flex items-center justify-center px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-sm cursor-pointer"
                                                >
                                                    Đi đến quản lý kho
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
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
                                    <th className="p-4 w-12 text-center">
                                        <input
                                            type="checkbox"
                                            checked={paginatedOverdueLots.length > 0 && paginatedOverdueLots.every(lot => selectedLotIds.includes(lot.idchitietphieunhap))}
                                            onChange={() => toggleVisibleLots(paginatedOverdueLots)}
                                            aria-label="Chọn tất cả lô quá hạn trên trang"
                                            className="size-4 accent-cyan-600"
                                        />
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tên loại cá</span>
                                            <ColumnFilter
                                                label="Tên loại cá"
                                                options={lotFishOptions}
                                                selectedValues={selectedLotFishNames}
                                                onChange={values => updateFilter(setSelectedLotFishNames, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Kích thước</span>
                                            <ColumnFilter
                                                label="Kích thước"
                                                options={lotSizeOptions}
                                                selectedValues={selectedLotSizes}
                                                onChange={values => updateFilter(setSelectedLotSizes, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Ngày nhập</th>
                                    <th className="p-4 text-center text-red-600">Quá hạn (ngày)</th>
                                    <th className="p-4 text-right">Còn lại (kg)</th>
                                    <th className="p-4 text-center w-36">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                                {loadingOverdue ? (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                                ) : paginatedOverdueLots.length > 0 ? (
                                    paginatedOverdueLots.map((lot) => (
                                        <tr key={lot.idchitietphieunhap} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedLotIds.includes(lot.idchitietphieunhap)}
                                                    onChange={() => toggleLotSelection(lot.idchitietphieunhap)}
                                                    aria-label={`Chọn lô quá hạn ${lot.tenLoaiCa} ${lot.tenSize}`}
                                                    className="size-4 accent-cyan-600"
                                                />
                                            </td>
                                            <td className="p-4 font-bold text-slate-800">{lot.tenLoaiCa}</td>
                                            <td className="p-4">{lot.tenSize}</td>
                                            <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                                            <td className="p-4 text-center font-bold text-red-600">{tinhSoNgayQuaHan(lot.ngaynhap)}</td>
                                            <td className="p-4 text-right font-bold text-cyan-700">{lot.soluongconlai}</td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    <button
                                                        onClick={() => navigate(`/admin/QuanLyThanhLy/thanh-ly/${lot.idchitietphieunhap}`)}
                                                        className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 transition-colors text-xs cursor-pointer"
                                                    >
                                                        Thanh lý
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Không có lô hàng nào quá hạn.</td></tr>
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
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Ngày thanh lý</span>
                                            <ColumnFilter
                                                label="Ngày thanh lý"
                                                options={phieuDateOptions}
                                                selectedValues={selectedPhieuDates}
                                                onChange={values => updateFilter(setSelectedPhieuDates, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Người tạo</th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Tên loại cá</span>
                                            <ColumnFilter
                                                label="Tên loại cá"
                                                options={phieuFishOptions}
                                                selectedValues={selectedPhieuFishNames}
                                                onChange={values => updateFilter(setSelectedPhieuFishNames, values)}
                                            />
                                        </div>
                                    </th>
                                    <th className="p-4">Lý do</th>
                                    <th className="p-4 text-right">Tổng SL (kg)</th>
                                    <th className="p-4 text-right">Tổng tiền</th>
                                    <th className="p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <span className="flex-1">Trạng thái</span>
                                            <ColumnFilter
                                                label="Trạng thái"
                                                options={phieuStatusOptions}
                                                selectedValues={selectedPhieuStatuses}
                                                onChange={values => updateFilter(setSelectedPhieuStatuses, values)}
                                            />
                                        </div>
                                    </th>
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
