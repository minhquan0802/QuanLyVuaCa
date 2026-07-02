import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyKho() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [inventory, setInventory] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN TÍNH NĂNG ---
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "tenLoaiCa", direction: "asc" }); // Mặc định xếp theo Tên A-Z
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10; // Cố định 10 dòng mỗi trang

    // --- 3. GỌI API ---
    useEffect(() => {
        api.get("/Chitietcabans")
            .then(res => setInventory(res.data.result || []))
            .catch(() => showToast("Không thể tải dữ liệu!", "error"))
            .finally(() => setLoading(false));
    }, []);

    // --- 4. XỬ LÝ LỌC & SẮP XẾP ---
    const processedInventory = useMemo(() => {
        // Bước 1: Lọc theo tìm kiếm
        let filtered = inventory;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = inventory.filter(item => 
                (item.tenLoaiCa || "").toLowerCase().includes(search) ||
                (item.tenSize || "").toLowerCase().includes(search)
            );
        }

        // Bước 2: Sắp xếp
        const sorted = [...filtered].sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];

            // So sánh chuỗi tiếng Việt (Tên loại cá, Size)
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            // So sánh số (Tồn kho)
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [inventory, searchTerm, sortConfig]);

    // --- 5. XỬ LÝ PHÂN TRANG ---
    const paginatedInventory = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedInventory.slice(startIndex, startIndex + pageSize);
    }, [processedInventory, currentPage, pageSize]);

    const totalPages = Math.ceil(processedInventory.length / pageSize);

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

    const handleImport = (item) => {
        navigate('/admin/QuanLyKho/nhap-hang', {
            state: {
                id: item.id,
                initialLoaicaId: item.idLoaiCa,
                initialSizeId: item.idSizeCa,
                initialSizeName: item.tenSize
            }
        });
    };

    return (
        <AdminLayout title="Quản Lý Kho Hàng">
            
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
                        placeholder="Tìm theo tên sản phẩm, size..."
                        value={searchTerm}
                        onChange={handleSearch}
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

            {/* BẢNG DỮ LIỆU */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("tenLoaiCa")}
                                >
                                    Tên sản phẩm {sortConfig.key === "tenLoaiCa" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("tenSize")}
                                >
                                    Size {sortConfig.key === "tenSize" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th 
                                    className="p-4 text-center cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("soluongton")}
                                >
                                    Tồn kho {sortConfig.key === "soluongton" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="4" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                            ) : paginatedInventory.length > 0 ? (
                                paginatedInventory.map((item) => (
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

                {/* ĐIỀU HƯỚNG PHÂN TRANG */}
                {!loading && processedInventory.length > 0 && (
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