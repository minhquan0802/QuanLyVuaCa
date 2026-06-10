import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from '../../context/ToastContext';

export default function QuanLyTaiKhoan() {
    const ROLES = [
        { value: "ADMIN", label: "Quản trị viên" },
        { value: "STAFF", label: "Nhân viên" },
        { value: "CUSTOMER", label: "Khách hàng" },
    ];

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);
    const [searchTerm, setSearchTerm] = useState(""); // State cho ô tìm kiếm

    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await api.get("/tai-khoan");
            const data = res.data;
            let realAccounts = [];
            if (data.result && Array.isArray(data.result)) realAccounts = data.result;
            else if (Array.isArray(data)) realAccounts = data;
            else if (data.data) realAccounts = data.data;
            setAccounts(realAccounts);
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        idtaikhoan: "",
        ho: "",
        ten: "",
        email: "",
        matkhau: "",
        sodienthoai: "",
        diachi: "",
        vaitro: "CUSTOMER",
        trangthaitk: "HOAT_DONG"
    });

    const handleAddNew = () => {
        setIsEditing(false);
        setShowPassword(false);
        setCurrentUser({
            idtaikhoan: "",
            ho: "",
            ten: "",
            email: "",
            matkhau: "",
            sodienthoai: "",
            diachi: "",
            vaitro: "CUSTOMER",
            trangthaitk: "HOAT_DONG"
        });
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setShowPassword(false);
        setCurrentUser({
            ...user,
            vaitro: user.vaitro || "CUSTOMER",
            matkhau: ""
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            vaitro: currentUser.vaitro,
            ho: currentUser.ho,
            ten: currentUser.ten,
            matkhau: (isEditing && !currentUser.matkhau) ? null : currentUser.matkhau,
            email: currentUser.email,
            sodienthoai: currentUser.sodienthoai,
            diachi: currentUser.diachi,
            ...(isEditing && { trangthaitk: currentUser.trangthaitk })
        };

        try {
            const url = isEditing
                ? `/tai-khoan/${currentUser.idtaikhoan}`
                : `/tai-khoan`;

            if (isEditing) {
                await api.put(url, payload);
            } else {
                await api.post(url, payload);
            }

            showToast(isEditing ? "Cập nhật tài khoản thành công!" : "Thêm mới tài khoản thành công!", "success");
            setIsModalOpen(false);
            fetchData();

        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại";
            showToast(`Có lỗi xảy ra: ${errorMsg}`, "error");
        }
    };

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
                                        <td className="p-4 font-medium text-slate-800">
                                            {getRoleName(item.vaitro)}
                                        </td>
                                        <td className="p-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit ${item.trangthaitk === 'HOAT_DONG' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                <span className={`size-1.5 rounded-full ${item.trangthaitk === 'HOAT_DONG' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {item.trangthaitk === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khóa'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer">
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

            {/* MODAL FORM */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Cập nhật Tài khoản" : "Thêm Tài khoản mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 cursor-pointer flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Họ</label>
                                <input type="text" required className="input-field" value={currentUser.ho} onChange={e => setCurrentUser({ ...currentUser, ho: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Tên</label>
                                <input type="text" required className="input-field" value={currentUser.ten} onChange={e => setCurrentUser({ ...currentUser, ten: e.target.value })} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label-text">Email</label>
                                <input type="email" required className="input-field" value={currentUser.email} onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })} />
                            </div>
                            
                            <div className="md:col-span-2">
                                <label className="label-text">Mật khẩu</label>
                                <div className="relative flex items-center">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required={!isEditing} 
                                        className="input-field pr-10" 
                                        value={currentUser.matkhau} 
                                        onChange={e => setCurrentUser({ ...currentUser, matkhau: e.target.value })} 
                                        placeholder={isEditing ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu..."} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 text-slate-400 hover:text-cyan-600 flex items-center cursor-pointer"
                                    >
                                        {showPassword ? (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                            </svg>
                                        ) : (
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label-text">Số điện thoại</label>
                                <input type="text" className="input-field" value={currentUser.sodienthoai || ""} onChange={e => setCurrentUser({ ...currentUser, sodienthoai: e.target.value })} />
                            </div>
                            <div>
                                <label className="label-text">Địa chỉ</label>
                                <input type="text" className="input-field" value={currentUser.diachi || ""} onChange={e => setCurrentUser({ ...currentUser, diachi: e.target.value })} />
                            </div>

                            <div>
                                <label className="label-text">Vai trò</label>
                                <select className="input-field bg-white" value={currentUser.vaitro} onChange={e => setCurrentUser({ ...currentUser, vaitro: e.target.value })}>
                                    {ROLES.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>

                            {isEditing && (
                                <div>
                                    <label className="label-text">Trạng thái</label>
                                    <select className="input-field bg-white" value={currentUser.trangthaitk} onChange={e => setCurrentUser({ ...currentUser, trangthaitk: e.target.value })}>
                                        <option value="HOAT_DONG">Hoạt động</option>
                                        <option value="KHOA">Khóa</option>
                                    </select>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer text-sm">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 cursor-pointer text-sm">
                                    {isEditing ? "Lưu thay đổi" : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* STYLE UTILITIES FOR TAILWIND V4 COMPATIBILITY */}
            <style>{`
                .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.375rem; }
                .input-field { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 0.875rem; bg: #ffffff; }
                .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
            `}</style>
        </AdminLayout>
    );
}