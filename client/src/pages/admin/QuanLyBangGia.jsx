import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyBangGia() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "trangThai", direction: "asc" }); // Mặc định xếp theo Trạng thái
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Cố định 10 dòng mỗi trang

    // --- 3. GỌI API ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/Banggias");
            // Lưu dữ liệu gốc, việc sắp xếp sẽ nhường lại cho useMemo bên dưới
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

    // --- 4. XỬ LÝ LỌC & SẮP XẾP ---
    const processedPriceList = useMemo(() => {
        // Bước 1: Lọc theo tìm kiếm
        let filtered = priceList;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = priceList.filter(item => 
                (item.tenLoaiCa || "").toLowerCase().includes(search) || 
                (item.tenSize || "").toLowerCase().includes(search)
            );
        }

        // Bước 2: Sắp xếp
        const sorted = [...filtered].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            // Kịch bản A: Sắp xếp theo Trạng Thái (Ưu tiên: Đang áp dụng -> Sắp áp dụng -> Hết hạn)
            if (sortConfig.key === "trangThai") {
                const weight = { "Đang áp dụng": 1, "Sắp áp dụng": 2, "Đã hết hạn": 3 };
                const wA = weight[valA] || 4;
                const wB = weight[valB] || 4;
                
                // Nếu trùng trạng thái, xếp theo ngày bắt đầu mới nhất
                if (wA === wB) {
                    return new Date(b.ngayBatDau) - new Date(a.ngayBatDau);
                }
                
                if (wA < wB) return sortConfig.direction === "asc" ? -1 : 1;
                if (wA > wB) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            }

            // Kịch bản B: Sắp xếp theo Thời gian (Hiệu lực)
            if (sortConfig.key === "ngayBatDau") {
                const dateA = new Date(valA || 0).getTime();
                const dateB = new Date(valB || 0).getTime();
                if (dateA < dateB) return sortConfig.direction === "asc" ? -1 : 1;
                if (dateA > dateB) return sortConfig.direction === "asc" ? 1 : -1;
                return 0;
            }

            // Kịch bản C: Sắp xếp chuỗi (Tên cá, Size)
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            // Kịch bản D: Sắp xếp số (Giá bán lẻ, Giá bán sỉ)
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [priceList, searchTerm, sortConfig]);

    // --- 5. XỬ LÝ PHÂN TRANG ---
    const paginatedPriceList = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedPriceList.slice(startIndex, startIndex + pageSize);
    }, [processedPriceList, currentPage, pageSize]);

    const totalPages = Math.ceil(processedPriceList.length / pageSize);

    // --- 6. HÀM BẮT SỰ KIỆN ---
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi tìm kiếm
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset về trang 1 khi đổi sắp xếp
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
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên cá hoặc kích thước..." 
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 shadow-xs transition-all text-sm bg-white" 
                    />
                </div>
                <button onClick={() => navigate("/admin/QuanLyBangGia/them")} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thiết lập giá mới
                </button>
            </div>

            {/* BẢNG DANH SÁCH GIÁ */}
            <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("tenLoaiCa")}>
                                    Sản phẩm {sortConfig.key === "tenLoaiCa" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("tenSize")}>
                                    Kích thước {sortConfig.key === "tenSize" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("giaBanLe")}>
                                    Giá Bán Lẻ (vnđ) {sortConfig.key === "giaBanLe" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-right cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("giaBanSi")}>
                                    Giá Bán Sỉ (vnđ) {sortConfig.key === "giaBanSi" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("ngayBatDau")}>
                                    Hiệu lực {sortConfig.key === "ngayBatDau" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort("trangThai")}>
                                    Trạng thái {sortConfig.key === "trangThai" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
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
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy kết quả phù hợp.</td></tr>
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