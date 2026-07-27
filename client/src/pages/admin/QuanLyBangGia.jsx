import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

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

export default function QuanLyBangGia() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [selectedFishTypeIds, setSelectedFishTypeIds] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Cố định 10 dòng mỗi trang

    // --- 3. GỌI API ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/Banggias/history");
            setPriceList(data.result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải dữ liệu bảng giá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { 
        fetchData(); 
    }, []);

    // --- 4. XỬ LÝ LỌC ---
    const processedPriceList = useMemo(() => {
        let filtered = priceList;
        if (selectedFishTypeIds.length > 0) {
            filtered = filtered.filter(item => selectedFishTypeIds.includes(item.idLoaiCa));
        }
        if (selectedSizes.length > 0) {
            filtered = filtered.filter(item => selectedSizes.includes(item.tenSize));
        }
        if (selectedStatuses.length > 0) {
            filtered = filtered.filter(item => selectedStatuses.includes(item.trangThai));
        }

        return filtered;
    }, [priceList, selectedFishTypeIds, selectedSizes, selectedStatuses]);

    const fishTypeOptions = useMemo(() => {
        const uniqueFishTypes = new Map();
        priceList.forEach(item => {
            if (item.idLoaiCa != null) uniqueFishTypes.set(item.idLoaiCa, item.tenLoaiCa);
        });
        return [...uniqueFishTypes.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => (a.label || "").localeCompare(b.label || "", "vi"));
    }, [priceList]);

    const sizeOptions = useMemo(() =>
        [...new Set(priceList.map(item => item.tenSize).filter(Boolean))]
            .sort((a, b) => a.localeCompare(b, "vi"))
            .map(value => ({ value, label: value })), [priceList]);

    const statusOptions = useMemo(() =>
        [...new Set(priceList.map(item => item.trangThai).filter(Boolean))]
            .map(value => ({ value, label: value })), [priceList]);

    // --- 5. XỬ LÝ PHÂN TRANG ---
    const paginatedPriceList = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedPriceList.slice(startIndex, startIndex + pageSize);
    }, [processedPriceList, currentPage, pageSize]);

    const totalPages = Math.ceil(processedPriceList.length / pageSize);

    // --- 6. HÀM BẮT SỰ KIỆN ---
    const updateFilter = (setter, values) => {
        setter(values);
        setCurrentPage(1);
    };

    // Helper: Component Badge trạng thái
    const renderStatusBadge = (status) => {
        if (status === "Đang áp dụng") {
            return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-green-500"></span>Đang áp dụng</span>;
        }
        if (status === "Sắp áp dụng") {
            return <span className="bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-cyan-500"></span>Sắp áp dụng</span>;
        }
        return <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-slate-400"></span>Đã hết hạn</span>;
    };

    return (
        <AdminLayout title="Quản Lý Bảng Giá">
            {/* BẢNG DANH SÁCH GIÁ */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[980px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 text-left">Tên loại cá</span>
                                        <ColumnFilter
                                            label="Tên loại cá"
                                            options={fishTypeOptions}
                                            selectedValues={selectedFishTypeIds}
                                            onChange={values => updateFilter(setSelectedFishTypeIds, values)}
                                        />
                                    </div>
                                </th>
                                <th className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 text-left">Kích thước</span>
                                        <ColumnFilter
                                            label="Kích thước"
                                            options={sizeOptions}
                                            selectedValues={selectedSizes}
                                            onChange={values => updateFilter(setSelectedSizes, values)}
                                        />
                                    </div>
                                </th>
                                <th className="p-4 text-right">Giá Bán Lẻ (vnđ)</th>
                                <th className="p-4 text-right">Giá Bán Sỉ (vnđ)</th>
                                <th className="p-4 text-center">Hiệu lực</th>
                                <th className="p-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 text-center">Trạng thái</span>
                                        <ColumnFilter
                                            label="Trạng thái"
                                            options={statusOptions}
                                            selectedValues={selectedStatuses}
                                            onChange={values => updateFilter(setSelectedStatuses, values)}
                                        />
                                    </div>
                                </th>
                                <th className="p-4 text-center w-44">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : paginatedPriceList.length > 0 ? (
                                paginatedPriceList.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.trangThai === "Đang áp dụng" ? "bg-cyan-50/10" : ""}`}>
                                        <td className="p-4 font-bold text-cyan-950">{item.tenLoaiCa}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 whitespace-nowrap">{item.tenSize}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanLe).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanSi).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-500">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span>Từ: <span className="font-medium text-slate-700">{new Date(item.ngayBatDau).toLocaleDateString('vi-VN')}</span></span>
                                                {item.ngayKetThuc ? (
                                                    <span>Đến: <span className="font-medium text-slate-700">{new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')}</span></span>
                                                ) : (
                                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-0.5">Hiện tại</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderStatusBadge(item.trangThai)}
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                type="button"
                                                onClick={() => navigate("/admin/QuanLyBangGia/them", {
                                                    state: { idchitietcaban: item.idChitietcaban }
                                                })}
                                                className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer"
                                            >
                                                Thiết lập giá mới
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Không tìm thấy kết quả phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* KHỐI ĐIỀU HƯỚNG PHÂN TRANG */}
                {!loading && processedPriceList.length > 0 && (
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
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                    <button
                                        key={page}
                                        onClick={() => setCurrentPage(page)}
                                        className={`size-8 flex items-center justify-center rounded-lg text-sm font-bold transition-colors ${
                                            currentPage === page 
                                                ? "bg-cyan-600 text-white shadow-sm" 
                                                : "text-slate-600 hover:bg-slate-200"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button 
                                onClick={() => setCurrentPage(prev => prev + 1)} 
                                disabled={currentPage === totalPages}
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
