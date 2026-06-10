import React, { useState, useEffect, useRef } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyLoaiCa() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATES CHO MODAL SIZE ---
    const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
    const [selectedFish, setSelectedFish] = useState(null); 
    const [fishInventory, setFishInventory] = useState([]); // List size của cá hiện tại
    
    // LOGIC COMBOBOX ---
    const [allGlobalSizes, setAllGlobalSizes] = useState([]); // Tất cả size trong DB (để đổ vào Select)
    const [selectedSizeId, setSelectedSizeId] = useState(""); // ID size được chọn từ Select
    const [isCreatingNew, setIsCreatingNew] = useState(false); // Chế độ: false=Chọn có sẵn, true=Tạo mới
    const [newSizeName, setNewSizeName] = useState("");       // Input tên size mới

    const { showToast } = useToast();

    // 1. Fetch Data Loại Cá
    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/Loaicas");
            
            let realData = [];
            if (Array.isArray(data)) realData = data;
            else if (data.result && Array.isArray(data.result)) realData = data.result;
            else if (data.data && Array.isArray(data.data)) realData = data.data;

            setCategories(realData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách loại cá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getImageUrl = (imageName) => {
        if (!imageName) return 'https://placehold.co/100x100?text=No+Image';
        if (imageName.startsWith('http')) return imageName;
        if (imageName.startsWith('/')) return `${import.meta.env.VITE_BE_URL}${imageName}`;
        return `${import.meta.env.VITE_BE_URL}/images/loaica/${imageName}`;
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [currentCategory, setCurrentCategory] = useState({ id: null, tenloaica: "", mieuta: "", hinhanhurl: "" });
    const [imagePreview, setImagePreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleMoTabThemMoi = () => {
        setIsEditing(false);
        setCurrentCategory({ id: null, tenloaica: "", mieuta: "", hinhanhurl: "" });
        setImagePreview(null);
        setIsModalOpen(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setCurrentCategory(prev => ({ ...prev, hinhanhFile: file }));
        setImagePreview(URL.createObjectURL(file));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("tenloaica", currentCategory.tenloaica);
            formData.append("mieuta", currentCategory.mieuta || "");
            if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);

            const { data } = await api.post("/Loaicas", formData);
            setCategories(prev => [...prev, data.result]);
            showToast("Thêm mới loại cá thành công!", "success");
            setIsModalOpen(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại";
            showToast(`Lỗi: ${errorMsg}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const formData = new FormData();
            formData.append("tenloaica", currentCategory.tenloaica);
            formData.append("mieuta", currentCategory.mieuta || "");
            if (currentCategory.hinhanhFile) formData.append("hinhanh", currentCategory.hinhanhFile);

            const { data } = await api.put(`/Loaicas/${currentCategory.id}`, formData);
            setCategories(prev => prev.map(item => item.id === data.result.id ? data.result : item));
            showToast("Cập nhật thông tin thành công!", "success");
            setIsModalOpen(false);
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Thao tác thất bại";
            showToast(`Lỗi: ${errorMsg}`, "error");
        } finally {
            setIsSaving(false);
        }
    };

    const handleEdit = (category) => {
        setIsEditing(true);
        setCurrentCategory({ ...category, hinhanhFile: null });
        setImagePreview(null);
        setIsModalOpen(true);
    };

    // --- LOGIC QUẢN LÝ SIZE ---
    const handleOpenSize = async (fish) => {
        setSelectedFish(fish);
        setIsSizeModalOpen(true);
        setFishInventory([]);
        setAllGlobalSizes([]);
        
        setIsCreatingNew(false);
        setNewSizeName("");
        setSelectedSizeId("");

        try {
            const [resInventory, resAllSizes] = await Promise.all([
                api.get(`/Chitietcabans`), 
                api.get(`/Sizecas`)       
            ]);

            const allItems = resInventory.data.result || [];
            const itemsForThisFish = allItems.filter(item => item.tenLoaiCa === fish.tenloaica);
            setFishInventory(itemsForThisFish);
            setAllGlobalSizes(resAllSizes.data.result || []);
        } catch (error) {
            console.error("Lỗi load dữ liệu:", error);
            showToast("Không thể tải danh sách kích thước!", "error");
        }
    };

    const handleAddSize = async () => {
        try {
            let sizeIdToAdd = selectedSizeId;

            if (isCreatingNew) {
                if (!newSizeName.trim()) { showToast("Vui lòng nhập tên kích thước!", "error"); return; }
                const { data: sizeData } = await api.post("/Sizecas", { sizeca: newSizeName });
                sizeIdToAdd = sizeData.result.idsizeca;
            } else {
                if (!sizeIdToAdd) { showToast("Vui lòng chọn kích thước có sẵn!", "error"); return; }
            }

            const chitietPayload = {
                idloaica: selectedFish.id,
                idsizeca: sizeIdToAdd,
                soluongton: 0
            };

            await api.post("/Chitietcabans", chitietPayload);
            showToast("Liên kết kích thước thành công!", "success");
            handleOpenSize(selectedFish); 
        } catch (error) {
            console.error(error);
            showToast("Không thể thêm kích thước!", "error");
        }
    };

    const handleDeleteSize = async (chitietId) => {
        if (!window.confirm("Xóa kích thước này khỏi loại cá?")) return;
        try {
            await api.delete(`/Chitietcabans/${chitietId}`);
            setFishInventory(fishInventory.filter(s => s.id !== chitietId));
            showToast("Đã gỡ bỏ kích thước thành công!", "success");
        } catch (error) { 
            console.error(error); 
            showToast("Gỡ bỏ kích thước thất bại!", "error");
        }
    };

    return (
        <AdminLayout title="Quản Lý Loại Cá & Kích Thước">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input type="text" placeholder="Tìm kiếm loại cá..." className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white" />
                </div>
                {/* Thay đổi màu nền nút sang Cyan */}
                <button onClick={handleMoTabThemMoi} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thêm Loại Cá
                </button>
            </div>

            {/* BẢNG DANH SÁCH LOẠI CÁ */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[750px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4 w-20 text-center">ID</th>
                                <th className="p-4 w-24">Hình ảnh</th>
                                <th className="p-4">Tên Loại Cá</th>
                                <th className="p-4">Miêu tả</th>
                                <th className="p-4 text-center w-40">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : categories.length > 0 ? (
                                categories.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-center font-mono text-slate-400">#{item.id}</td>
                                        <td className="p-4">
                                            <div className="size-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
                                                <img src={getImageUrl(item.hinhanhurl)} className="w-full h-full object-cover" alt={item.tenloaica} onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error' }} />
                                            </div>
                                        </td>
                                        {/* Đổi màu chữ highlight sang Cyan */}
                                        <td className="p-4 font-bold text-cyan-950">{item.tenloaica}</td>
                                        <td className="p-4 text-slate-500 max-w-xs truncate">{item.mieuta || "---"}</td>
                                        <td className="p-4 flex items-center justify-center gap-3">
                                            {/* Đổi màu nút Kích cỡ sang Cyan */}
                                            <button onClick={() => handleOpenSize(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer" title="Cấu hình kích thước">
                                                Kích cỡ
                                            </button>
                                            <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 font-bold hover:bg-blue-100 transition-colors text-xs cursor-pointer" title="Chỉnh sửa loại cá">
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không tìm thấy loại cá nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CẤU HÌNH KÍCH THƯỚC */}
            {isSizeModalOpen && selectedFish && (
                <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
                        {/* Đổi màu nền Header Modal kích thước sang Cyan */}
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-cyan-50">
                            <div>
                                <h3 className="font-bold text-lg text-cyan-900">Quản lý kích thước</h3>
                                <p className="text-xs text-cyan-600 mt-0.5">Loại cá: <strong className="text-cyan-800">{selectedFish.tenloaica}</strong></p>
                            </div>
                            <button onClick={() => setIsSizeModalOpen(false)} className="text-slate-400 hover:text-red-500 cursor-pointer flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Thêm size áp dụng</label>
                                <div className="flex gap-2 mb-2">
                                    {isCreatingNew ? (
                                        <input 
                                            type="text" 
                                            value={newSizeName}
                                            onChange={(e) => setNewSizeName(e.target.value)}
                                            placeholder="VD: Size 2-3kg, Lớn..."
                                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-cyan-300 focus:ring-2 focus:ring-cyan-200 bg-white outline-none font-medium"
                                            autoFocus
                                        />
                                    ) : (
                                        <select 
                                            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 outline-none bg-white font-medium"
                                            value={selectedSizeId}
                                            onChange={(e) => setSelectedSizeId(e.target.value)}
                                        >
                                            <option value="">-- Chọn kích cỡ --</option>
                                            {allGlobalSizes.map(size => (
                                                <option key={size.idsizeca} value={size.idsizeca}>{size.sizeca}</option>
                                            ))}
                                        </select>
                                    )}

                                    {/* Đổi màu nút Thêm bên trong modal sang Cyan */}
                                    <button onClick={handleAddSize} className="px-4 py-1.5 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-xs whitespace-nowrap text-sm cursor-pointer">
                                        {isCreatingNew ? "Lưu lại" : "Áp dụng"}
                                    </button>
                                </div>

                                <div className="text-center mt-2.5">
                                    {isCreatingNew ? (
                                        <button onClick={() => setIsCreatingNew(false)} className="text-xs text-slate-500 hover:text-cyan-600 underline cursor-pointer">
                                            « Quay lại danh mục có sẵn
                                        </button>
                                    ) : (
                                        <div className="flex items-center justify-center gap-1 text-xs text-slate-400 font-medium">
                                            <span>Kích thước bạn cần chưa tồn tại?</span>
                                            <button onClick={() => setIsCreatingNew(true)} className="font-bold text-cyan-600 hover:text-cyan-800 underline cursor-pointer">
                                                Tạo mới
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* DANH SÁCH SIZE HIỆN CÓ CỦA CÁ */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2.5">Các size đang áp dụng thực tế</label>
                                {fishInventory.length > 0 ? (
                                    <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-1">
                                        {fishInventory.map((item) => (
                                            <div key={item.id} className="flex items-center gap-1.5 pl-3 pr-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-xs font-bold shadow-2xs">
                                                <span>{item.tenSize}</span>
                                                <button onClick={() => handleDeleteSize(item.id)} className="size-5 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer">
                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-7 text-slate-300">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                        </svg>
                                        <p className="text-xs font-semibold text-slate-400 mt-1">Chưa liên kết size nào.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL FORM THÊM / SỬA LOẠI CÁ */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in zoom-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">{isEditing ? "Cập nhật Loại Cá" : "Thêm Loại Cá Mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="text-slate-400 hover:text-slate-600 cursor-pointer flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <form onSubmit={isEditing ? handleUpdate : handleSave} className="p-6 space-y-4">
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

                                <div onClick={() => fileInputRef.current?.click()} className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/10 transition-all overflow-hidden group">
                                    {(imagePreview || (isEditing && currentCategory.hinhanhurl)) ? (
                                        <>
                                            <img src={imagePreview || getImageUrl(currentCategory.hinhanhurl)} alt="preview" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6 text-white">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
                                                </svg>
                                                <span className="text-white text-xs font-bold">Thay đổi ảnh</span>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-1.5 text-slate-400 pointer-events-none text-center px-4">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75Z" />
                                            </svg>
                                            <p className="text-sm font-bold">Click để tải ảnh lên</p>
                                            <p className="text-xs text-slate-400">Định dạng hỗ trợ: JPG, PNG, WEBP</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-1.5">Miêu tả ngắn</label>
                                <textarea rows="3" value={currentCategory.mieuta || ""} onChange={(e) => setCurrentCategory({ ...currentCategory, mieuta: e.target.value })} className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none resize-none bg-white" placeholder="Thông tin chi tiết về loại cá..." />
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSaving} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50 text-sm cursor-pointer">Hủy</button>
                                {/* Đổi nút Lưu sang Cyan */}
                                <button type="submit" disabled={isSaving} className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 disabled:opacity-60 flex items-center gap-2 text-sm cursor-pointer">
                                    {isSaving && <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                                    {isSaving ? "Đang lưu..." : (isEditing ? "Lưu thay đổi" : "Thêm mới")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}