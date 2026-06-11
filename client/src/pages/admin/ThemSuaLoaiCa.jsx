import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function ThemSuaLoaiCa() {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();

    const [isSaving, setIsSaving] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ tenloaica: "", mieuta: "", hinhanhurl: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!isEditing) return;
        if (location.state?.category) {
            setCurrentCategory({ ...location.state.category, hinhanhFile: null });
            return;
        }
        api.get("/Loaicas")
            .then(({ data }) => {
                const list = data.result || data.data || (Array.isArray(data) ? data : []);
                const item = list.find(c => String(c.id) === String(id));
                if (item) setCurrentCategory({ ...item, hinhanhFile: null });
                else showToast("Không tìm thấy loại cá!", "error");
            })
            .catch(() => showToast("Không thể tải thông tin loại cá!", "error"));
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCurrentCategory(prev => ({ ...prev, hinhanhFile: file }));
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("tenloaica", currentCategory.tenloaica);
            formData.append("mieuta", currentCategory.mieuta || "");
            if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);

            if (isEditing) {
                await api.put(`/Loaicas/${id}`, formData);
                showToast("Cập nhật thông tin thành công!", "success");
            } else {
                await api.post("/Loaicas", formData);
                showToast("Thêm mới loại cá thành công!", "success");
            }
            navigate("/admin/QuanLyLoaiCa");
        } catch (error) {
            showToast(`Lỗi: ${error.response?.data?.message || "Thao tác thất bại"}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout title={isEditing ? "Cập nhật Loại Cá" : "Thêm Loại Cá Mới"}>
            <div className="max-w-lg mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Tên loại cá <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={currentCategory.tenloaica}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, tenloaica: e.target.value })}
                            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all bg-white"
                            placeholder="VD: Cá Trắm, Cá Basa..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Hình ảnh minh họa</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/10 transition-all overflow-hidden group"
                        >
                            {(imagePreview || (isEditing && currentCategory.hinhanhurl)) ? (
                                <>
                                    <img src={imagePreview || currentCategory.hinhanhurl} alt="preview" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <span className="text-white text-xs font-bold">Thay đổi ảnh</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex flex-col items-center gap-1.5 text-slate-400 pointer-events-none text-center px-4">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                    </svg>
                                    <p className="text-sm font-bold">Click để tải ảnh lên</p>
                                    <p className="text-xs">Định dạng hỗ trợ: JPG, PNG, WEBP</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Miêu tả ngắn</label>
                        <textarea
                            rows="3"
                            value={currentCategory.mieuta || ""}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, mieuta: e.target.value })}
                            className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none resize-none bg-white"
                            placeholder="Thông tin chi tiết về loại cá..."
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button type="button" onClick={() => navigate("/admin/QuanLyLoaiCa")} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50 text-sm cursor-pointer">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 disabled:opacity-60 flex items-center gap-2 text-sm cursor-pointer">
                            {isSaving && <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                            {isSaving ? "Đang lưu..." : (isEditing ? "Lưu thay đổi" : "Thêm mới")}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
