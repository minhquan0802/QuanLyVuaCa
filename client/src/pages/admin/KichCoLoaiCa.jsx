import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function KichCoLoaiCa() {
    const { loaicaId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [selectedFish, setSelectedFish] = useState(null);
    const [fishInventory, setFishInventory] = useState([]);
    const [allGlobalSizes, setAllGlobalSizes] = useState([]);
    const [selectedSizeId, setSelectedSizeId] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newSizeName, setNewSizeName] = useState("");

    const loadData = async (fish = selectedFish) => {
        try {
            const [resInventory, resAllSizes] = await Promise.all([
                api.get("/Chitietcabans"),
                api.get("/Sizecas"),
            ]);
            const allItems = resInventory.data.result || [];
            if (fish) setFishInventory(allItems.filter(item => item.tenLoaiCa === fish.tenloaica));
            setAllGlobalSizes(resAllSizes.data.result || []);
        } catch {
            showToast("Không thể tải dữ liệu kích thước!", "error");
        }
    };

    useEffect(() => {
        api.get("/Loaicas")
            .then(({ data }) => {
                const list = data.result || data.data || (Array.isArray(data) ? data : []);
                const fish = list.find(c => String(c.id) === String(loaicaId));
                if (fish) {
                    setSelectedFish(fish);
                    loadData(fish);
                } else {
                    showToast("Không tìm thấy loại cá!", "error");
                }
            })
            .catch(() => showToast("Không thể tải thông tin loại cá!", "error"));
    }, [loaicaId]);

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
            await api.post("/Chitietcabans", { idloaica: Number(loaicaId), idsizeca: sizeIdToAdd, soluongton: 0 });
            showToast("Liên kết kích thước thành công!", "success");
            setIsCreatingNew(false);
            setNewSizeName("");
            setSelectedSizeId("");
            loadData();
        } catch {
            showToast("Không thể thêm kích thước!", "error");
        }
    };

    const handleDeleteSize = async (chitietId) => {
        if (!window.confirm("Xóa kích thước này khỏi loại cá?")) return;
        try {
            await api.delete(`/Chitietcabans/${chitietId}`);
            setFishInventory(prev => prev.filter(s => s.id !== chitietId));
            showToast("Đã gỡ bỏ kích thước thành công!", "success");
        } catch {
            showToast("Gỡ bỏ kích thước thất bại!", "error");
        }
    };

    return (
        <AdminLayout title={`Quản lý kích thước${selectedFish ? ` — ${selectedFish.tenloaica}` : ""}`}>
            <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                <div className="p-6 space-y-5">
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
                                    <button onClick={() => setIsCreatingNew(true)} className="font-bold text-cyan-600 hover:text-cyan-800 underline cursor-pointer">Tạo mới</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2.5">Các size đang áp dụng thực tế</label>
                        {fishInventory.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
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
                            <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                <p className="text-xs font-semibold text-slate-400">Chưa liên kết size nào.</p>
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-slate-100">
                        <button onClick={() => navigate("/admin/QuanLyLoaiCa")} className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm cursor-pointer">
                            ← Quay lại danh sách
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
