import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

const ROLES = [
    { value: "ADMIN", label: "Quản trị viên" },
    { value: "STAFF", label: "Nhân viên" },
    { value: "CUSTOMER", label: "Khách hàng" },
];

export default function ThemSuaTaiKhoan() {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [showPassword, setShowPassword] = useState(false);
    const [currentUser, setCurrentUser] = useState({
        ho: "", ten: "", email: "", matkhau: "",
        sodienthoai: "", diachi: "", vaitro: "CUSTOMER", trangthaitk: "HOAT_DONG",
    });

    useEffect(() => {
        if (!isEditing) return;
        if (location.state?.user) {
            setCurrentUser({ ...location.state.user, matkhau: "" });
            return;
        }
        api.get("/tai-khoan")
            .then(({ data }) => {
                const list = data.result || (Array.isArray(data) ? data : []);
                const user = list.find(u => u.idtaikhoan === id);
                if (user) setCurrentUser({ ...user, matkhau: "" });
                else showToast("Không tìm thấy tài khoản!", "error");
            })
            .catch(() => showToast("Không thể tải thông tin tài khoản!", "error"));
    }, [id]);

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
            ...(isEditing && { trangthaitk: currentUser.trangthaitk }),
        };
        try {
            if (isEditing) {
                await api.put(`/tai-khoan/${id}`, payload);
            } else {
                await api.post("/tai-khoan", payload);
            }
            showToast(isEditing ? "Cập nhật tài khoản thành công!" : "Thêm mới tài khoản thành công!", "success");
            navigate("/admin/QuanLyTaiKhoan");
        } catch (error) {
            showToast(`Có lỗi xảy ra: ${error.response?.data?.message || "Thao tác thất bại"}`, "error");
        }
    };

    return (
        <AdminLayout title={isEditing ? "Cập nhật Tài khoản" : "Thêm Tài khoản mới"}>
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
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

                    {!isEditing && currentUser.vaitro === "CUSTOMER" && (
                        <div className="md:col-span-2 flex items-start gap-2.5 p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" className="size-4.5 mt-0.5 shrink-0 text-cyan-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                            </svg>
                            <span>Hệ thống sẽ tự gửi email thông báo đến khách hàng kèm link để tự đặt mật khẩu. Mật khẩu bên dưới chỉ là tạm thời.</span>
                        </div>
                    )}

                    <div className="md:col-span-2">
                        <label className="label-text">Mật khẩu</label>
                        <div className="relative flex items-center">
                            <input
                                type={showPassword ? "text" : "password"}
                                required={!isEditing}
                                className="input-field pr-10"
                                value={currentUser.matkhau}
                                onChange={e => setCurrentUser({ ...currentUser, matkhau: e.target.value })}
                                placeholder={isEditing ? "Để trống nếu không muốn đổi mật khẩu" : (!isEditing && currentUser.vaitro === "CUSTOMER" ? "Mật khẩu tạm thời (tối thiểu 8 ký tự)" : "Nhập mật khẩu...")}
                            />
                            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 text-slate-400 hover:text-cyan-600 flex items-center cursor-pointer">
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
                            {ROLES.map(role => <option key={role.value} value={role.value}>{role.label}</option>)}
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
                        <button type="button" onClick={() => navigate("/admin/QuanLyTaiKhoan")} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer text-sm">Hủy</button>
                        <button type="submit" className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 cursor-pointer text-sm">
                            {isEditing ? "Lưu thay đổi" : "Thêm mới"}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
                .label-text { display: block; font-size: 0.875rem; font-weight: 700; color: #334155; margin-bottom: 0.375rem; }
                .input-field { width: 100%; padding: 0.625rem 1rem; border-radius: 0.75rem; border: 1px solid #e2e8f0; outline: none; transition: all 0.2s; font-size: 0.875rem; }
                .input-field:focus { border-color: #0891b2; box-shadow: 0 0 0 2px rgba(6, 182, 212, 0.2); }
            `}</style>
        </AdminLayout>
    );
}
