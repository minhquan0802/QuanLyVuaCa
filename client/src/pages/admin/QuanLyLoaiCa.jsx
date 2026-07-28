import React, { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

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

export default function QuanLyLoaiCa() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    // --- STATE DỮ LIỆU GỐC ---
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Số lượng loại cá hiển thị trên 1 trang

    // --- GỌI API ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { result } } = await api.get("/Loaicas/admin/all");
            setCategories(result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách loại cá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- XỬ LÝ DỮ LIỆU LỌC ---
    const processedData = useMemo(() => {
        if (selectedCategoryIds.length > 0) {
            return categories.filter(item => selectedCategoryIds.includes(item.id));
        }

        return categories;
    }, [categories, selectedCategoryIds]);

    const categoryFilterOptions = useMemo(() =>
        [...categories]
            .sort((a, b) => (a.tenloaica || "").localeCompare(b.tenloaica || "", "vi"))
            .map(item => ({
                value: item.id,
                label: item.deleted ? `${item.tenloaica} (Ngừng bán)` : item.tenloaica
            })), [categories]);

    // --- XỬ LÝ PHÂN TRANG (PAGINATION) ---
    const paginatedCategories = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedData.slice(startIndex, startIndex + pageSize);
    }, [processedData, currentPage, pageSize]);

    const totalPages = Math.ceil(processedData.length / pageSize);

    // --- HANDLERS (HÀM BẮT SỰ KIỆN) ---
    const updateCategoryFilter = (values) => {
        setSelectedCategoryIds(values);
        setCurrentPage(1);
    };

    const handleEdit = (category) => {
        navigate(`/admin/QuanLyLoaiCa/sua/${category.id}`, { state: { category } });
    };

    const handleOpenSize = (fish) => {
        navigate(`/admin/QuanLyLoaiCa/kich-co/${fish.id}`);
    };

    const handleNgungBan = async (item) => {
        const accepted = await confirm({
            title: "Ngừng bán loại cá",
            message: `Ngừng bán “${item.tenloaica}”? Bảng giá sẽ hết hiệu lực ngay.`,
            confirmText: "Ngừng bán",
            variant: "danger",
        });
        if (!accepted) return;
        try {
            await api.delete(`/Loaicas/${item.id}`);
            setCategories(prev => prev.map(c => c.id === item.id ? { ...c, deleted: true } : c));
            showToast("Đã ngừng bán loại cá!", "success");
        } catch (err) {
            const msg = err.response?.data?.message;
            showToast(msg?.includes("ton kho") ? "Loại cá này còn tồn kho, không thể ngừng bán!" : "Thao tác thất bại!", "error");
        }
    };

    const handleMoLai = async (item) => {
        try {
            await api.patch(`/Loaicas/${item.id}/khoi-phuc`);
            setCategories(prev => prev.map(c => c.id === item.id ? { ...c, deleted: false } : c));
            showToast("Đã mở lại loại cá!", "success");
        } catch { showToast("Thao tác thất bại!", "error"); }
    };

    return (
        <AdminLayout title="Quản Lý Loại Cá & Kích Thước">
            {/* TOOLBAR */}
            <div className="flex justify-end mb-6">
                <button onClick={() => navigate("/admin/QuanLyLoaiCa/them")} className="admin-primary-action">
                    Thêm loại cá
                </button>
            </div>

            {/* BẢNG DANH SÁCH LOẠI CÁ */}
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[750px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4 w-24 text-center">ID</th>
                                <th className="p-4 w-24">Hình ảnh</th>
                                <th className="p-4 w-56">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="flex-1 text-left">Tên Loại Cá</span>
                                        <ColumnFilter
                                            label="Tên loại cá"
                                            options={categoryFilterOptions}
                                            selectedValues={selectedCategoryIds}
                                            onChange={updateCategoryFilter}
                                        />
                                    </div>
                                </th>
                                <th className="p-4">Miêu tả</th>
                                <th className="p-4 text-center w-36">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : paginatedCategories.length > 0 ? (
                                paginatedCategories.map((item) => (
                                    <tr key={item.id} className={`transition-colors ${item.deleted ? "bg-slate-50 opacity-60" : "hover:bg-slate-50/50"}`}>
                                        <td className="p-4 text-center font-mono text-slate-400">#{item.id}</td>
                                        <td className="p-4">
                                            <div className="size-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
                                                <img
                                                    src={item.hinhanhurl}
                                                    className="w-full h-full object-cover"
                                                    alt={item.tenloaica}
                                                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error' }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 font-semibold text-slate-800 w-56">
                                            {item.tenloaica}
                                            {item.deleted && <span className="ml-2 px-1.5 py-0.5 rounded text-xs bg-slate-200 text-slate-500 font-normal">Ngừng bán</span>}
                                        </td>
                                        <td className="p-4 text-slate-500 whitespace-normal break-words leading-relaxed">{item.mieuta || "---"}</td>
                                        <td className="p-4">
                                            <div className="flex flex-col items-stretch gap-2">
                                                {!item.deleted && (
                                                    <button onClick={() => handleOpenSize(item)} className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 border border-cyan-200 transition-colors text-xs cursor-pointer">
                                                        Kích cỡ
                                                    </button>
                                                )}
                                                {!item.deleted && (
                                                    <button onClick={() => handleEdit(item)} className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 transition-colors text-xs cursor-pointer">
                                                        Sửa
                                                    </button>
                                                )}
                                                {!item.deleted ? (
                                                    <button onClick={() => handleNgungBan(item)} className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 font-bold hover:bg-red-100 border border-red-200 transition-colors text-xs cursor-pointer">
                                                        Ngừng bán
                                                    </button>
                                                ) : (
                                                    <button onClick={() => handleMoLai(item)} className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 font-bold hover:bg-emerald-100 border border-emerald-200 transition-colors text-xs cursor-pointer">
                                                        Mở lại
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không tìm thấy loại cá nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* KHỐI ĐIỀU HƯỚNG PHÂN TRANG */}
                {!loading && processedData.length > 0 && (
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
