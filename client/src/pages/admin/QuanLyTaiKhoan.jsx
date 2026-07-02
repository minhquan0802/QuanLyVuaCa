import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyTaiKhoan() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    // --- 1. STATE DỮ LIỆU GỐC ---
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- 2. STATE ĐIỀU KHIỂN BỘ LỌC, SẮP XẾP & PHÂN TRANG ---
    const [searchTerm, setSearchTerm] = useState("");
    const [sortConfig, setSortConfig] = useState({ key: "idtaikhoan", direction: "desc" });
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8; // Số tài khoản trên mỗi trang

    const ROLES = [
        { value: "ADMIN", label: "Quản trị viên" },
        { value: "STAFF", label: "Nhân viên" },
        { value: "CUSTOMER", label: "Khách hàng" },
    ];

    // --- 3. GỌI API ---
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { result } } = await api.get("/tai-khoan");
            setAccounts(result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách tài khoản!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- 4. XỬ LÝ DỮ LIỆU: TÌM KIẾM & SẮP XẾP ---
    const processedAccounts = useMemo(() => {
        // Bước 1: Lọc theo từ khóa (Tên hoặc Email)
        let filtered = accounts;
        if (searchTerm.trim() !== "") {
            const search = searchTerm.toLowerCase();
            filtered = accounts.filter(account => {
                const fullName = `${account.ho || ""} ${account.ten || ""}`.toLowerCase();
                const email = (account.email || "").toLowerCase();
                const phone = (account.sodienthoai || "").toLowerCase();
                return fullName.includes(search) || email.includes(search) || phone.includes(search);
            });
        }

        // Bước 2: Sắp xếp
        const sorted = [...filtered].sort((a, b) => {
            let valA = a[sortConfig.key] || "";
            let valB = b[sortConfig.key] || "";

            // Xử lý đặc biệt nếu đang sắp xếp theo "Họ và Tên" gộp chung
            if (sortConfig.key === "hoten") {
                valA = `${a.ho || ""} ${a.ten || ""}`;
                valB = `${b.ho || ""} ${b.ten || ""}`;
            }

            // Sắp xếp chuỗi tiếng Việt
            if (typeof valA === 'string' && typeof valB === 'string') {
                return sortConfig.direction === "asc"
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            }

            // Sắp xếp số
            if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
            if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });

        return sorted;
    }, [accounts, searchTerm, sortConfig]);

    // --- 5. XỬ LÝ DỮ LIỆU: CẮT PHÂN TRANG ---
    const paginatedAccounts = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return processedAccounts.slice(startIndex, startIndex + pageSize);
    }, [processedAccounts, currentPage, pageSize]);

    const totalPages = Math.ceil(processedAccounts.length / pageSize);

    // --- 6. HÀM BẮT SỰ KIỆN GIAO DIỆN ---
    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1); // Reset về trang 1 khi gõ tìm kiếm
    };

    const requestSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
        setCurrentPage(1); // Reset về trang 1 khi đổi tiêu chí sắp xếp
    };

    const handleAddNew = () => navigate("/admin/QuanLyTaiKhoan/them");
    const handleEdit = (user) => navigate(`/admin/QuanLyTaiKhoan/sua/${user.idtaikhoan}`, { state: { user } });

    const handleToggleLock = async (item) => {
        const isLocking = item.trangthaitk === "HOAT_DONG";
        const action = isLocking ? "khóa" : "mở khóa";
        if (!window.confirm(`Bạn chắc muốn ${action} tài khoản "${item.ho} ${item.ten}"?`)) return;
        try {
            await api.put(`/tai-khoan/${item.idtaikhoan}`, {
                ...item,
                matkhau: null,
                trangthaitk: isLocking ? "KHOA" : "HOAT_DONG",
            });
            showToast(`Đã ${action} tài khoản thành công!`, "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || `Thao tác thất bại!`, "error");
        }
    };

    const handleApprove = async (item) => {
        if (!window.confirm(`Phê duyệt tài khoản "${item.ho} ${item.ten}"?`)) return;
        try {
            await api.put(`/tai-khoan/duyet/${item.idtaikhoan}`);
            showToast("Phê duyệt tài khoản thành công!", "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Phê duyệt thất bại!", "error");
        }
    };

    const getRoleName = (vaitro) => {
        if (!vaitro) return "Chưa phân quyền";
        const found = ROLES.find(r => r.value === vaitro);
        return found ? found.label : vaitro;
    };

    return (
        <AdminLayout title="Quản Lý Tài Khoản">
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
                        placeholder="Tìm theo tên, email, sđt..."
                        value={searchTerm}
                        onChange={handleSearch}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white"
                    />
                </div>
                <button onClick={handleAddNew} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thêm Tài Khoản
                </button>
            </div>

            {/* DANH SÁCH BẢNG */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[850px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("hoten")}
                                >
                                    Họ và Tên {sortConfig.key === "hoten" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("email")}
                                >
                                    Email {sortConfig.key === "email" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4">SĐT</th>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("vaitro")}
                                >
                                    Vai Trò {sortConfig.key === "vaitro" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th 
                                    className="p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => requestSort("trangthaitk")}
                                >
                                    Trạng Thái {sortConfig.key === "trangthaitk" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                </th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : paginatedAccounts.length > 0 ? (
                                paginatedAccounts.map((item) => (
                                    <tr key={item.idtaikhoan} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-cyan-950">{item.ho} {item.ten}</td>
                                        <td className="p-4 text-slate-600">{item.email}</td>
                                        <td className="p-4 font-mono text-slate-500">{item.sodienthoai || "-"}</td>
                                        <td className="p-4 text-slate-700 font-medium">
                                            {getRoleName(item.vaitro)}
                                        </td>
                                        <td className="p-4">
                                            {item.trangthaitk === 'HOAT_DONG' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-green-50 text-green-700 border-green-200">
                                                    <span className="size-1.5 rounded-full bg-green-500"></span>Hoạt động
                                                </span>
                                            )}
                                            {item.trangthaitk === 'KHOA' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-red-50 text-red-700 border-red-200">
                                                    <span className="size-1.5 rounded-full bg-red-500"></span>Đã khóa
                                                </span>
                                            )}
                                            {item.trangthaitk === 'CHO_DUYET' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    <span className="size-1.5 rounded-full bg-yellow-500"></span>Chờ duyệt
                                                </span>
                                            )}
                                            {item.trangthaitk === 'CHO_XAC_THUC_EMAIL' && (
                                                <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-slate-50 text-slate-500 border-slate-200">
                                                    <span className="size-1.5 rounded-full bg-slate-400"></span>Chờ xác thực email
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex items-center justify-center gap-3">
                                                {item.trangthaitk === 'CHO_DUYET' && (
                                                    <button
                                                        onClick={() => handleApprove(item)}
                                                        className="text-green-600 font-semibold text-xs hover:underline cursor-pointer"
                                                    >
                                                        Duyệt
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="text-cyan-600 font-semibold text-xs hover:underline cursor-pointer"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => handleToggleLock(item)}
                                                    className={`${item.trangthaitk === 'HOAT_DONG' ? 'text-red-600' : 'text-green-600'} font-semibold text-xs hover:underline cursor-pointer`}
                                                >
                                                    {item.trangthaitk === 'HOAT_DONG' ? 'Khóa' : 'Mở khóa'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy tài khoản nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* ĐIỀU HƯỚNG PHÂN TRANG */}
                {!loading && processedAccounts.length > 0 && (
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