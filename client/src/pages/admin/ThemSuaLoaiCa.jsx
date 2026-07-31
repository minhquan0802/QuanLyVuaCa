import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

const NEW_SIZE_SENTINEL = "__NEW__";

export default function ThemSuaLoaiCa() {
    const { id } = useParams();
    const isEditing = !!id;
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [isSaving, setIsSaving] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ tenloaica: "", mieuta: "", hinhanhurl: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    // Chỉ dùng khi CREATE
    const [allGlobalSizes, setAllGlobalSizes] = useState([]);
    const [sizeRows, setSizeRows] = useState([
        { sizeId: "", newSizeName: "", kg: "", giaBanLe: "", giaBanSi: "" }
    ]);

    useEffect(() => {
        if (isEditing) {
            if (location.state?.category) {
                setCurrentCategory({ ...location.state.category, hinhanhFile: null });
                return;
            }
            api.get("/Loaicas/admin/all")
                .then(({ data }) => {
                    const list = data.result || data.data || (Array.isArray(data) ? data : []);
                    const item = list.find(c => String(c.id) === String(id));
                    if (item) setCurrentCategory({ ...item, hinhanhFile: null });
                    else showToast("Không tìm thấy loại cá!", "error");
                })
                .catch(() => showToast("Không thể tải thông tin loại cá!", "error"));
        } else {
            api.get("/Sizecas")
                .then(({ data }) => setAllGlobalSizes(data.result || []))
                .catch(() => {});
        }
    }, [id]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCurrentCategory(prev => ({ ...prev, hinhanhFile: file }));
        setImagePreview(URL.createObjectURL(file));
    };

    const addSizeRow = () => {
        setSizeRows(prev => [
            ...prev,
            { sizeId: "", newSizeName: "", kg: "", giaBanLe: "", giaBanSi: "" }
        ]);
    };

    const removeSizeRow = (index) => {
        setSizeRows(prev => prev.filter((_, i) => i !== index));
    };

    const updateSizeRow = (index, field, value) => {
        setSizeRows(prev => prev.map((row, i) => i === index ? { ...row, [field]: value } : row));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let cauHinhKichThuoc = [];
        if (!isEditing) {
            const rowsDaNhap = sizeRows.filter(row =>
                row.sizeId
                || row.newSizeName.trim()
                || row.kg
                || row.giaBanLe
                || row.giaBanSi
            );
            if (rowsDaNhap.length === 0) {
                showToast("Vui lòng cấu hình ít nhất một kích cỡ và bảng giá!", "error");
                return;
            }

            for (const row of rowsDaNhap) {
                const hasSize = row.sizeId === NEW_SIZE_SENTINEL
                    ? row.newSizeName.trim()
                    : row.sizeId;
                const kg = Number(row.kg);
                const giaBanLe = Number(row.giaBanLe);
                const giaBanSi = Number(row.giaBanSi);

                if (!hasSize) {
                    showToast("Vui lòng chọn hoặc nhập đầy đủ tên kích cỡ!", "error");
                    return;
                }
                if (!Number.isFinite(kg) || kg <= 0) {
                    showToast("Số kg quy đổi phải lớn hơn 0!", "error");
                    return;
                }
                if (!Number.isFinite(giaBanLe) || giaBanLe <= 1000) {
                    showToast("Giá bán lẻ phải lớn hơn 1.000 VNĐ!", "error");
                    return;
                }
                if (!Number.isFinite(giaBanSi) || giaBanSi <= 1000) {
                    showToast("Giá bán sỉ phải lớn hơn 1.000 VNĐ!", "error");
                    return;
                }
                if (giaBanSi > giaBanLe) {
                    showToast("Giá bán sỉ không được lớn hơn giá bán lẻ!", "error");
                    return;
                }

                cauHinhKichThuoc.push({
                    idsizeca: row.sizeId === NEW_SIZE_SENTINEL ? null : Number(row.sizeId),
                    tensizemoi: row.sizeId === NEW_SIZE_SENTINEL ? row.newSizeName.trim() : null,
                    sokgtuongung: kg,
                    giabanle: giaBanLe,
                    giabansi: giaBanSi
                });
            }
        }

        const accepted = await confirm({
            title: isEditing ? "Cập nhật loại cá" : "Thêm loại cá mới",
            message: isEditing
                ? `Lưu các thay đổi của “${currentCategory.tenloaica}”?`
                : `Tạo loại cá “${currentCategory.tenloaica}” cùng các kích cỡ đã khai báo?`,
            confirmText: isEditing ? "Lưu thay đổi" : "Thêm loại cá",
            variant: "primary",
        });
        if (!accepted) return;
        setIsSaving(true);
        try {
            if (isEditing) {
                const formData = new FormData();
                formData.append("tenloaica", currentCategory.tenloaica);
                formData.append("mieuta", currentCategory.mieuta || "");
                if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);
                await api.put(`/Loaicas/${id}`, formData);
                showToast("Cập nhật thông tin thành công!", "success");
                navigate("/admin/QuanLyLoaiCa");
                return;
            }

            const formData = new FormData();
            formData.append(
                "request",
                new Blob([JSON.stringify({
                    tenloaica: currentCategory.tenloaica,
                    mieuta: currentCategory.mieuta || "",
                    cauhinhkichthuoc: cauHinhKichThuoc
                })], { type: "application/json" })
            );
            if (currentCategory.hinhanhFile) {
                formData.append("hinhanh", currentCategory.hinhanhFile);
            }
            await api.post("/Loaicas", formData);

            showToast("Đã thêm loại cá, kích cỡ và bảng giá thành công!", "success");
            navigate("/admin/QuanLyLoaiCa");
        } catch (error) {
            showToast(`Lỗi: ${error.response?.data?.message || "Thao tác thất bại"}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <AdminLayout title={isEditing ? "Cập nhật Loại Cá" : "Thêm Loại Cá Mới"}>
            <div className="max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-black overflow-hidden">
                    <div className="px-6 py-4 border-b border-black bg-cyan-600">
                        <h3 className="font-bold text-lg text-white">
                            {isEditing ? "Cập nhật thông tin loại cá" : "Thêm loại cá mới"}
                        </h3>
                        <p className="text-xs text-cyan-50">
                            {isEditing
                                ? "Điều chỉnh tên, hình ảnh và mô tả của loại cá."
                                : "Nhập thông tin loại cá và cấu hình kích cỡ ban đầu."}
                        </p>
                    </div>

                    <div className="p-5 space-y-3">
                    {/* Tên loại cá */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Tên loại cá <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            required
                            value={currentCategory.tenloaica}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, tenloaica: e.target.value })}
                            className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all bg-slate-50"
                            placeholder="VD: Cá Trắm, Cá Basa..."
                        />
                    </div>

                    {/* Hình ảnh */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Hình ảnh minh họa</label>
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative w-full h-44 rounded-xl border border-black bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:bg-cyan-50 transition-all overflow-hidden group"
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

                    {/* Miêu tả */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Miêu tả ngắn</label>
                        <textarea
                            rows="3"
                            value={currentCategory.mieuta || ""}
                            onChange={(e) => setCurrentCategory({ ...currentCategory, mieuta: e.target.value })}
                            className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none resize-none bg-slate-50"
                            placeholder="Thông tin chi tiết về loại cá..."
                        />
                    </div>

                    {/* SIZE + KG — chỉ hiện khi CREATE */}
                    {!isEditing && (
                        <div className="pt-3 border-t border-slate-200">
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-xs font-bold text-slate-500 uppercase">
                                    Kích cỡ, quy đổi kg &amp; bảng giá
                                </label>
                                <span className="text-xs text-slate-400 italic">
                                    Cần ít nhất một kích cỡ
                                </span>
                            </div>

                            <div className="space-y-2">
                                {sizeRows.map((row, index) => (
                                    <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                        <div className="flex gap-2 items-center">
                                            {row.sizeId === NEW_SIZE_SENTINEL ? (
                                                <input
                                                    type="text"
                                                    value={row.newSizeName}
                                                    onChange={(e) => updateSizeRow(index, "newSizeName", e.target.value)}
                                                    placeholder="Tên size mới..."
                                                    className="flex-1 p-2 text-sm rounded-xl border border-cyan-300 focus:border-cyan-500 outline-none bg-white"
                                                    autoFocus
                                                />
                                            ) : (
                                                <select
                                                    value={row.sizeId}
                                                    onChange={(e) => updateSizeRow(index, "sizeId", e.target.value)}
                                                    className="flex-1 p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
                                                >
                                                    <option value="">-- Chọn size --</option>
                                                    {allGlobalSizes.map(s => (
                                                        <option key={s.idsizeca} value={s.idsizeca}>{s.sizeca}</option>
                                                    ))}
                                                    <option value={NEW_SIZE_SENTINEL}>+ Tạo size mới...</option>
                                                </select>
                                            )}

                                            {row.sizeId === NEW_SIZE_SENTINEL && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        updateSizeRow(index, "sizeId", "");
                                                        updateSizeRow(index, "newSizeName", "");
                                                    }}
                                                    title="Quay về danh sách"
                                                    className="text-xs text-slate-400 hover:text-cyan-600 px-1"
                                                >
                                                    ←
                                                </button>
                                            )}

                                            {sizeRows.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeSizeRow(index)}
                                                    title="Xóa dòng kích cỡ"
                                                    className="size-7 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                            <label className="block">
                                                <span className="block text-[11px] font-bold text-slate-500 mb-1">
                                                    Kg/con
                                                </span>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    value={row.kg}
                                                    onChange={(e) => updateSizeRow(index, "kg", e.target.value)}
                                                    placeholder="0,00"
                                                    className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="block text-[11px] font-bold text-slate-500 mb-1">
                                                    Giá bán lẻ (VNĐ)
                                                </span>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1001"
                                                    value={row.giaBanLe}
                                                    onChange={(e) => updateSizeRow(index, "giaBanLe", e.target.value)}
                                                    placeholder="65.000"
                                                    className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
                                                />
                                            </label>

                                            <label className="block">
                                                <span className="block text-[11px] font-bold text-slate-500 mb-1">
                                                    Giá bán sỉ (VNĐ)
                                                </span>
                                                <input
                                                    type="number"
                                                    step="1"
                                                    min="1001"
                                                    value={row.giaBanSi}
                                                    onChange={(e) => updateSizeRow(index, "giaBanSi", e.target.value)}
                                                    placeholder="60.000"
                                                    className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white"
                                                />
                                            </label>
                                        </div>

                                    </div>
                                ))}
                            </div>

                            <button
                                type="button"
                                onClick={addSizeRow}
                                className="mt-3 text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                                Thêm size
                            </button>
                        </div>
                    )}
                    </div>

                    {/* Buttons */}
                    <div className="p-4 border-t border-black bg-cyan-600 flex justify-end gap-3">
                        <button type="button" onClick={() => navigate("/admin/QuanLyLoaiCa")} disabled={isSaving} className="px-5 py-2.5 rounded-xl border border-red-700 bg-red-50 text-red-700 font-bold hover:bg-red-100 disabled:opacity-50 text-sm cursor-pointer">
                            Hủy
                        </button>
                        <button type="submit" disabled={isSaving} className="px-6 py-2.5 rounded-xl border border-black bg-white text-cyan-800 font-bold hover:bg-cyan-50 shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:border-slate-300 flex items-center gap-2 text-sm cursor-pointer disabled:cursor-not-allowed">
                            {isSaving && <div className="size-3.5 border-2 border-cyan-200 border-t-cyan-700 rounded-full animate-spin" />}
                            {isSaving ? "Đang lưu..." : (isEditing ? "Lưu thay đổi" : "Thêm mới")}
                        </button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
