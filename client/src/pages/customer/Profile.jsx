import React, { useState } from "react";
import api from "../../config/axios";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";

export default function Profile() {
    const { user, setUser, loading } = useAuth();
    const { showToast } = useToast();

    // State cho chế độ chỉnh sửa
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        ho: "",
        ten: "",
        sodienthoai: "",
        diachi: "",
        matkhau: "", // Thêm trường mật khẩu vào state
        idvaitro: ""
    });
    const [isSaving, setIsSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false); // State ẩn/hiện mật khẩu

    // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
    const handleEditClick = () => {
        setFormData({
            ho: user?.ho || "",
            ten: user?.ten || "",
            sodienthoai: user?.sodienthoai || "",
            diachi: user?.diachi || "",
            matkhau: "", // Để trống khi bắt đầu sửa, người dùng chỉ nhập khi muốn đổi
            idvaitro: user?.idvaitro || ""
        });
        setIsEditing(true);
        setShowPassword(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!formData.ho.trim() || !formData.ten.trim()) {
            showToast("Họ và tên không được để trống", "error");
            return;
        }

        // Kiểm tra nếu người dùng nhập mật khẩu quá ngắn (Ví dụ: dưới 6 ký tự)
        if (formData.matkhau && formData.matkhau.length < 6) {
            showToast("Mật khẩu mới phải có ít nhất 6 ký tự", "error");
            return;
        }

        setIsSaving(true);
        try {
            // Tạo object payload để gửi lên API
            const updateData = {
                ho: formData.ho.trim(),
                ten: formData.ten.trim(),
                sodienthoai: formData.sodienthoai.trim(),
                diachi: formData.diachi.trim(),
                idvaitro: formData.idvaitro
            };

            // Chỉ gửi mật khẩu lên nếu người dùng có nhập mật khẩu mới
            if (formData.matkhau) {
                updateData.matkhau = formData.matkhau;
            }

            const { data } = await api.put(`/tai-khoan/${user.idtaikhoan}`, updateData);
            setUser(data.result);
            setIsEditing(false);
            showToast("Cập nhật hồ sơ thành công!", "success");
        } catch (error) {
            console.error("Lỗi khi lưu thông tin:", error);
            const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại";
            showToast(`Có lỗi xảy ra: ${errorMsg}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-2">
                    <div className="size-8 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 font-medium text-sm">Đang tải hồ sơ...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-sm">Không thể tải thông tin hồ sơ.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            <main className="flex-grow py-8 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl mx-auto">
                    
                    <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 sm:p-8 space-y-6">
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                                Thông tin tài khoản
                            </h3>
                            <div>
                                {!isEditing ? (
                                    <button 
                                        onClick={handleEditClick}
                                        className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 flex items-center gap-1.5 text-xs cursor-pointer"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="size-3.5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" />
                                        </svg>
                                        Chỉnh sửa hồ sơ
                                    </button>
                                ) : (
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={handleCancel}
                                            className="px-4 py-2 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-all text-xs cursor-pointer"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-4 py-2 rounded-xl bg-green-600 text-white font-bold hover:bg-green-700 shadow-md shadow-green-100 transition-all active:scale-95 flex items-center gap-1.5 text-xs disabled:opacity-60 cursor-pointer"
                                        >
                                            {isSaving ? (
                                                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.2} stroke="currentColor" className="size-3.5">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                </svg>
                                            )}
                                            {isSaving ? "Đang lưu..." : "Lưu lại"}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Họ & Tên đệm</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="ho" value={formData.ho} onChange={handleChange}
                                            className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors"
                                        />
                                    ) : (
                                        <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center">{user.ho}</div>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Tên</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" name="ten" value={formData.ten} onChange={handleChange}
                                            className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors"
                                        />
                                    ) : (
                                        <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center">{user.ten}</div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ Email</label>
                                <div className="text-slate-600 font-medium text-sm border-b border-slate-100 pb-1.5 flex justify-between items-center min-h-[30px]">
                                    <span>{user.email}</span>
                                    {isEditing && <span className="text-[10px] text-slate-400 font-normal normal-case">(Không thể sửa đổi)</span>}
                                </div>
                            </div>

                            {/* Trường MẬT KHẨU mới thêm vào */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Mật khẩu</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <input 
                                            type={showPassword ? "text" : "password"} 
                                            name="matkhau" 
                                            value={formData.matkhau} 
                                            onChange={handleChange}
                                            placeholder="Nhập mật khẩu mới (để trống nếu không đổi)"
                                            className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 pl-2 pr-10 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors placeholder:text-slate-400 placeholder:font-normal placeholder:italic"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                                        >
                                            {showPassword ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                                                </svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                                </svg>
                                            )}
                                        </button>
                                    </div>
                                ) : (
                                    <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center tracking-widest text-xs">
                                        ••••••••
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Số điện thoại</label>
                                {isEditing ? (
                                    <input 
                                        type="text" name="sodienthoai" value={formData.sodienthoai} onChange={handleChange}
                                        className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors"
                                    />
                                ) : (
                                    <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center">
                                        {user.sodienthoai || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Địa chỉ giao hàng</label>
                                {isEditing ? (
                                    <input 
                                        type="text" name="diachi" value={formData.diachi} onChange={handleChange}
                                        className="w-full border-b-2 border-cyan-500 bg-cyan-50/30 px-2 py-1.5 text-slate-800 font-medium focus:outline-none rounded-t-md text-sm transition-colors"
                                    />
                                ) : (
                                    <div className="text-slate-800 font-medium text-sm border-b border-slate-100 pb-1.5 min-h-[30px] flex items-center">
                                        {user.diachi || <span className="text-slate-400 italic font-normal">Chưa cập nhật</span>}
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </main>
        </div>
    );
}