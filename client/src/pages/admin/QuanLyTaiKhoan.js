import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI"; 

export default function QuanLyTaiKhoan() {
    // Bảng dịch từ mã trong DB sang Tiếng Việt hiển thị
    const ROLE_TRANSLATION = {
        "admin": "Chủ vựa cá",
        "nhanvienkho": "Nhân viên kho",
        "nhanvienbanhang": "Nhân viên bán hàng",
        "nhanvien": "Nhân viên",
        "khachsi": "Khách hàng sỉ",
        "khachle": "Khách hàng lẻ"
    };


    const [accounts, setAccounts] = useState([]);
    const [roles, setRoles] = useState([]); // FIX 1: State lưu danh sách vai trò từ API
    const [loading, setLoading] = useState(true);
    
    // FIX 4: State ẩn/hiện mật khẩu
    const [showPassword, setShowPassword] = useState(false);

    // --- 1. Fetch Data (Tài khoản & Vai trò) ---
    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Gọi song song 2 API để tiết kiệm thời gian
            const [resAcc, resRoles] = await Promise.all([
                fetchCoXacThuc("/TaiKhoans"),
                fetchCoXacThuc("/vaitro") // FIX 1: Gọi API vai trò
            ]);
            
            if (!resAcc.ok || !resRoles.ok) {
                throw new Error("Lỗi kết nối server");
            }
            
            const dataAcc = await resAcc.json();
            const dataRoles = await resRoles.json(); // Data vai trò
            
            // Xử lý data Tài khoản
            let realAccounts = [];
            if (dataAcc.result && Array.isArray(dataAcc.result)) realAccounts = dataAcc.result;
            else if (Array.isArray(dataAcc)) realAccounts = dataAcc;
            else if (dataAcc.data) realAccounts = dataAcc.data;

            // Xử lý data Vai trò
            let realRoles = [];
            if (dataRoles.result) realRoles = dataRoles.result;
            else if (Array.isArray(dataRoles)) realRoles = dataRoles;

            setAccounts(realAccounts);
            setRoles(realRoles); // Lưu vào state

        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // --- 2. Modal Logic ---
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
        idvaitro: "", // Để rỗng ban đầu, sẽ set default khi mở modal
        trangthaitk: "HOAT_DONG"
    });

    const handleAddNew = () => {
        setIsEditing(false);
        setShowPassword(false); // Reset mắt mật khẩu
        setCurrentUser({
            idtaikhoan: "", 
            ho: "",
            ten: "",
            email: "",
            matkhau: "",
            sodienthoai: "",
            diachi: "",
            // Lấy vai trò đầu tiên trong list làm default hoặc 6 (Khách lẻ) nếu list rỗng
            idvaitro: roles.length > 0 ? roles[0].id : 6, 
            trangthaitk: "HOAT_DONG"
        });
        setIsModalOpen(true);
    };

    const handleEdit = (user) => {
        setIsEditing(true);
        setShowPassword(false);
        // Lấy ID vai trò an toàn (vì user.idvaitro có thể là object {id, tenvaitro} hoặc số)
        const roleId = user.idvaitro?.id || user.idvaitro || (roles.length > 0 ? roles[0].id : 3);
        
        setCurrentUser({
            ...user,
            idvaitro: roleId,
            matkhau: "" // Reset mật khẩu khi sửa
        });
        setIsModalOpen(true);
    };

    // --- 3. CRUD Actions ---
    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa tài khoản này?")) {
            try {
                const res = await fetchCoXacThuc(`/TaiKhoans/${id}`, { method: "DELETE" });
                if (!res.ok) throw new Error("Lỗi khi xóa từ server");
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
            idvaitro: parseInt(currentUser.idvaitro), 
            ho: currentUser.ho,
            ten: currentUser.ten,
            // Logic mật khẩu: Nếu sửa và để trống -> gửi null để BE không update pass
            matkhau: (isEditing && !currentUser.matkhau) ? null : currentUser.matkhau,
            email: currentUser.email,
            sodienthoai: currentUser.sodienthoai,
            diachi: currentUser.diachi,
            trangthaitk: currentUser.trangthaitk // FIX 2: Đảm bảo gửi đúng chuỗi "HOAT_DONG" hoặc "KHOA"
        };

        try {
            const url = isEditing 
                ? `/TaiKhoans/${currentUser.idtaikhoan}`
                : `/TaiKhoans`; 
            const method = isEditing ? "PUT" : "POST";

            console.log("Payload:", payload); 

            const res = await fetchCoXacThuc(url, {
                method: method,
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                let errorMsg = `Lỗi server (${res.status})`;
                try {
                    const errData = await res.json();
                    errorMsg = errData.message || errorMsg;
                } catch {
                    errorMsg = await res.text();
                }
                throw new Error(errorMsg);
            }

            alert(isEditing ? "Cập nhật thành công!" : "Thêm mới thành công!");
            setIsModalOpen(false);
            fetchData(); // Reload lại để cập nhật list mới nhất từ server

        } catch (error) {
            alert("Có lỗi xảy ra: " + error.message);
        }
    };

    // FIX 3: Helper lấy tên vai trò chính xác từ list roles đã fetch
    const getRoleName = (roleInput) => {
        if (!roleInput) return "Chưa phân quyền";
        
        let tenGoc = "";

        // Trường hợp backend trả về nguyên object role (khi get list user)
        if (typeof roleInput === 'object' && roleInput.tenvaitro) {
            tenGoc = roleInput.tenvaitro;
        }

        // Trường hợp backend trả về ID
        const roleId = roleInput;
        const role = roles.find(r => r.id === Number(roleId));
        if (role) tenGoc = role.tenvaitro;

        return ROLE_TRANSLATION[tenGoc] || tenGoc || "Tên vai trò không xác định";
    };

    const getRoleColor = (roleInput) => {
        const roleId = roleInput?.id || roleInput;
        // Logic màu sắc đơn giản hóa
        if (Number(roleId) === 1) return "bg-red-100 text-red-700"; // Admin (ví dụ ID 1 là Admin)
        if (Number(roleId) === 6) return "bg-purple-100 text-purple-700"; 
        return "bg-blue-100 text-blue-700";
    };

    return (
        <AdminLayout title="Quản Lý Tài Khoản">
            
            {/* Toolbar */}
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

            {/* Table */}
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
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${getRoleColor(item.idvaitro)}`}>
                                            {getRoleName(item.idvaitro)}
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

            {/* Modal Form */}
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
                            
                            {/* FIX 4: Ô mật khẩu có mắt xem */}
                            <div className="md:col-span-2 relative">
                                <label className="label-text">Mật khẩu</label>
                                <div className="relative">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        required={!isEditing} 
                                        className="input-field pr-10" // Padding right để tránh đè icon
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

                            {/* FIX 1: Combobox Vai trò động từ API */}
                            <div>
                                <label className="label-text">Vai trò</label>
                                <select className="input-field" value={currentUser.idvaitro} onChange={e => setCurrentUser({...currentUser, idvaitro: e.target.value})}>
                                    {roles.length > 0 ? (
                                        roles.map(role => (
                                            <option key={role.id} value={role.id}>{role.tenvaitro}</option>
                                        ))
                                    ) : (
                                        <option value="">Đang tải vai trò...</option>
                                    )}
                                </select>
                            </div>

                            {/* FIX 2: Combobox Trạng thái */}
                            <div>
                                <label className="label-text">Trạng thái</label>
                                <select className="input-field" value={currentUser.trangthaitk} onChange={e => setCurrentUser({...currentUser, trangthaitk: e.target.value})}>
                                    <option value="HOAT_DONG">Hoạt động</option>
                                    <option value="KHOA">Khóa</option>
                                </select>
                            </div>

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