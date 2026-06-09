import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";

export default function QuanLyTaiKhoan() {
    const ROLES = [
        { value: "ADMIN", label: "Quản trị viên" },
        { value: "STAFF", label: "Nhân viên" },
        { value: "CUSTOMER", label: "Khách hàng" },
    ];

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPassword, setShowPassword] = useState(false);

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

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
            try {
                await api.delete(`/tai-khoan/${id}`);
                setAccounts(accounts.filter(item => item.idtaikhoan !== id));
                alert("Đã xóa thành công!");
            } catch (error) {
                alert(error.message);
            }
        }
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

            alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
            setIsModalOpen(false);
            fetchData();

        } catch (error) {
            alert("Có lỗi xảy ra: " + error.message);
        }
    };

    const getRoleName = (vaitro) => {
        if (!vaitro) return "Chưa phân quyền";
        const found = ROLES.find(r => r.value === vaitro);
        return found ? found.label : vaitro;
    };

    const getRoleColor = (vaitro) => {
        if (vaitro === "ADMIN") return "bg-red-100 text-red-700";
        if (vaitro === "STAFF") return "bg-blue-100 text-blue-700";
        if (vaitro === "CUSTOMER") return "bg-green-100 text-green-700";
        return "bg-slate-100 text-slate-600";
    };

    return (
        <AdminLayout title="Quản Lý Tài Khoản">
            
            <div className="flex justify-between items-center mb-6">
                <div className="relative w-96">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">search</span>
                    <input type="text" placeholder="Tìm theo tên, email..." className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <button onClick={handleAddNew} className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95">
                    <span className="material-symbols-outlined">person_add</span>
                    Thêm Tài Khoản
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Họ và Tên</th>
                                <th className="p-4">Email</th>
                                <th className="p-4">SĐT</th>
                                <th className="p-4">Vai Trò</th>
                                <th className="p-4">Trạng Thái</th>
                                <th className="p-4 text-center">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center">Đang tải...</td></tr>
                            ) : accounts.map((item) => (
                                <tr key={item.idtaikhoan} className="hover:bg-slate-50/80">
                                    <td className="p-4 font-bold text-blue-900">{item.ho} {item.ten}</td>
                                    <td className="p-4">{item.email}</td>
                                    <td className="p-4">{item.sodienthoai || "-"}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(item.vaitro)}`}>
                                            {getRoleName(item.vaitro)}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${item.trangthaitk === 'HOAT_DONG' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {item.trangthaitk === 'HOAT_DONG' ? 'Hoạt động' : 'Đã khóa'}
                                        </span>
                                    </td>
                                    <td className="p-4 flex justify-center gap-2">
                                        <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><span className="material-symbols-outlined text-[20px]">edit</span></button>
                                        <button onClick={() => handleDelete(item.idtaikhoan)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><span className="material-symbols-outlined text-[20px]">delete</span></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Cập nhật Tài khoản" : "Thêm Tài khoản mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Họ</label>
                                <input type="text" required className="input-field" value={currentUser.ho} onChange={e => setCurrentUser({...currentUser, ho: e.target.value})} />
                            </div>
                            <div>
                                <label className="label-text">Tên</label>
                                <input type="text" required className="input-field" value={currentUser.ten} onChange={e => setCurrentUser({...currentUser, ten: e.target.value})} />
                            </div>

                            <div className="md:col-span-2">
                                <label className="label-text">Email</label>
                                <input type="email" required className="input-field" value={currentUser.email} onChange={e => setCurrentUser({...currentUser, email: e.target.value})} />
                            </div>
                            
                            <div className="md:col-span-2 relative">
                                <label className="label-text">Mật khẩu</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required={!isEditing} 
                                        className="input-field pr-10" 
                                        value={currentUser.matkhau} 
                                        onChange={e => setCurrentUser({...currentUser, matkhau: e.target.value})} 
                                        placeholder={isEditing ? "Để trống nếu không muốn đổi mật khẩu" : "Nhập mật khẩu..."} 
                                    />
                                    <button 
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-600"
                                    >
                                        <span className="material-symbols-outlined text-[20px]">
                                            {showPassword ? 'visibility_off' : 'visibility'}
                                        </span>
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label-text">Số điện thoại</label>
                                <input type="text" className="input-field" value={currentUser.sodienthoai} onChange={e => setCurrentUser({...currentUser, sodienthoai: e.target.value})} />
                            </div>
                            <div>
                                <label className="label-text">Địa chỉ</label>
                                <input type="text" className="input-field" value={currentUser.diachi} onChange={e => setCurrentUser({...currentUser, diachi: e.target.value})} />
                            </div>

                            <div>
                                <label className="label-text">Vai trò</label>
                                <select className="input-field" value={currentUser.vaitro} onChange={e => setCurrentUser({...currentUser, vaitro: e.target.value})}>
                                    ={ROLES.map(role => (
                                        <option key={role.value} value={role.value}>{role.label}</option>
                                    ))}
                                </select>
                            </div>

                            {isEditing && (
                                <div>
                                    <label className="label-text">Trạng thái</label>
                                    <select className="input-field" value={currentUser.trangthaitk} onChange={e => setCurrentUser({...currentUser, trangthaitk: e.target.value})}>
                                        <option value="HOAT_DONG">Hoạt động</option>
                                        <option value="KHOA">Khóa</option>
                                    </select>
                                </div>
                            )}

                            <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium">Hủy</button>
                                <button type="submit" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg">
                                    {isEditing ? "Lưu thay đổi" : "Thêm mới"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.25rem; }
                .input-field { width: 100%; padding: 0.5rem 1rem; border-radius: 0.5rem; border: 1px solid #e2e8f0; outline: none; transition: all; }
                .input-field:focus { border-color: #3b82f6; ring: 1px solid #3b82f6; }
            `}</style>
        </AdminLayout>
    );
}