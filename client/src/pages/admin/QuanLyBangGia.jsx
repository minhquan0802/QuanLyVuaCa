import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import ColumnFilter from "../../components/admin/ColumnFilter";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyBangGia() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [selectedFishTypeIds, setSelectedFishTypeIds] = useState([]);
    const [selectedSizes, setSelectedSizes] = useState([]);
    const [selectedStatuses, setSelectedStatuses] = useState(["Đang áp dụng"]);
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
            return <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-green-200 inline-flex items-center justify-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-green-500"></span>Đang áp dụng</span>;
        }
        if (status === "Sắp áp dụng") {
            return <span className="bg-cyan-50 text-cyan-700 px-2.5 py-1 rounded-lg text-xs font-bold border border-cyan-200 inline-flex items-center justify-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-cyan-500"></span>Sắp áp dụng</span>;
        }
        return <span className="bg-slate-50 text-slate-500 px-2.5 py-1 rounded-lg text-xs font-bold border border-slate-200 inline-flex items-center justify-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-slate-400"></span>Đã hết hạn</span>;
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
                                <th className="p-4 text-right">Giá Bán Lẻ</th>
                                <th className="p-4 text-right">Giá Bán Sỉ</th>
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
                                    <tr key={item.id} className="bg-white hover:bg-slate-50/80 transition-colors">
                                        <td className="p-4 font-semibold text-slate-800">{item.tenLoaiCa}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 whitespace-nowrap">{item.tenSize}</span>
                                        </td>
                                        <td className="p-4 text-right font-semibold tabular-nums text-slate-700">
                                            {Number(item.giaBanLe).toLocaleString('vi-VN')} VNĐ
                                        </td>
                                        <td className="p-4 text-right font-semibold tabular-nums text-slate-700">
                                            {Number(item.giaBanSi).toLocaleString('vi-VN')} VNĐ
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
                                            {item.trangThai !== "Đã hết hạn" ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate("/admin/QuanLyBangGia/them", {
                                                        state: {
                                                            idchitietcaban: item.idChitietcaban,
                                                            giaBanLe: item.giaBanLe,
                                                            giaBanSi: item.giaBanSi
                                                        }
                                                    })}
                                                    className="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 border border-cyan-200 transition-colors text-xs cursor-pointer"
                                                >
                                                    Thiết lập giá mới
                                                </button>
                                            ) : (
                                                <span className="text-xs text-slate-300">—</span>
                                            )}
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
