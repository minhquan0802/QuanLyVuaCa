import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyTaiKhoan() {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast } = useToast();

    const ROLES = [
        { value: "ADMIN", label: "Quản trị viên" },
        { value: "STAFF", label: "Nhân viên" },
        { value: "CUSTOMER", label: "Khách hàng" },
    ];

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

    const handleAddNew = () => navigate("/admin/QuanLyTaiKhoan/them");

    const handleEdit = (user) => navigate(`/admin/QuanLyTaiKhoan/sua/${user.idtaikhoan}`, { state: { user } });

    const getRoleName = (vaitro) => {
        if (!vaitro) return "Chưa phân quyền";
        const found = ROLES.find(r => r.value === vaitro);
        return found ? found.label : vaitro;
    };

    // Logic bộ lọc tìm kiếm tài khoản theo tên, họ, hoặc email
    const filteredAccounts = accounts.filter(account => {
        const fullName = `${account.ho || ""} ${account.ten || ""}`.toLowerCase();
        const email = (account.email || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return fullName.includes(search) || email.includes(search);
    });

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
                        placeholder="Tìm theo tên, email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                                <th className="p-4">Họ và Tên</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">SĐT</th>
                                <th className="p-4">Vai Trò</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 text-center"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredAccounts.length > 0 ? (
                                filteredAccounts.map((item) => (
                                    <tr key={item.idtaikhoan} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 font-bold text-cyan-950">{item.ho} {item.ten}</td>
                                        <td className="p-4 text-slate-600">{item.email}</td>
                                        <td className="p-4 font-mono text-slate-500">{item.sodienthoai || "-"}</td>
                                        {/* Gỡ bọc badge -> Hiển thị text trơn thông thường */}
                                        <td className="p-4 text-slate-700 font-medium">
                                            {getRoleName(item.vaitro)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${item.trangthaitk === 'HOAT_DONG' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                <span className={`size-1.5 rounded-full ${item.trangthaitk === 'HOAT_DONG' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {item.trangthaitk === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        {/* Đơn giản hóa nút Sửa thành văn bản trơn có hover gạch chân */}
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="text-cyan-600 font-semibold text-xs hover:underline cursor-pointer"
                                            >
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy tài khoản nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </AdminLayout>
    );
}