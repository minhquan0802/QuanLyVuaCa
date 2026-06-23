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
    const [quydois, setQuydois] = useState([]);
    const [selectedSizeId, setSelectedSizeId] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newSizeName, setNewSizeName] = useState("");
    const [sokgtuongung, setSokgtuongung] = useState("");
    const [editingKg, setEditingKg] = useState({});

    const loadData = async (fish = selectedFish) => {
        try {
            const [resInventory, resAllSizes, resQuydois] = await Promise.all([
                api.get("/Chitietcabans"),
                api.get("/Sizecas"),
                api.get("/Quydois"),
            ]);
            const allItems = resInventory.data.result || [];
            if (fish) setFishInventory(allItems.filter(item => item.tenLoaiCa === fish.tenloaica));
            setAllGlobalSizes(resAllSizes.data.result || []);
            setQuydois(resQuydois.data.result || []);
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
        const kgValue = parseFloat(sokgtuongung);
        if (!sokgtuongung || isNaN(kgValue) || kgValue <= 0) {
            showToast("Vui lòng nhập số kg quy đổi hợp lệ (lớn hơn 0)!", "error");
            return;
        }

        try {
            let sizeIdToAdd = selectedSizeId;
            if (isCreatingNew) {
                if (!newSizeName.trim()) { showToast("Vui lòng nhập tên kích thước!", "error"); return; }
                const { data: sizeData } = await api.post("/Sizecas", { sizeca: newSizeName });
                sizeIdToAdd = sizeData.result.idsizeca;
            } else {
                if (!sizeIdToAdd) { showToast("Vui lòng chọn kích thước có sẵn!", "error"); return; }
            }

            // Bước 1: Tạo chitietcaban (size - loại cá)
            const { data: cbData } = await api.post("/Chitietcabans", {
                idloaica: Number(loaicaId),
                idsizeca: sizeIdToAdd,
                soluongton: 0
            });

            // Bước 2: Tạo quy đổi kg tương ứng
            await api.post("/Quydois", {
                idchitietcaban: cbData.result.id,
                sokgtuongung: kgValue
            });

            showToast("Liên kết kích thước và quy đổi thành công!", "success");
            setIsCreatingNew(false);
            setNewSizeName("");
            setSelectedSizeId("");
            setSokgtuongung("");
            loadData();
        } catch {
            showToast("Không thể thêm kích thước!", "error");
        }
    };

    const handleSaveKg = async (chitietcabanId) => {
        const kgValue = parseFloat(editingKg[chitietcabanId]);
        if (!kgValue || kgValue <= 0) {
            showToast("Vui lòng nhập số kg hợp lệ (lớn hơn 0)!", "error");
            return;
        }
        try {
            await api.post("/Quydois", {
                idchitietcaban: chitietcabanId,
                sokgtuongung: kgValue
            });
            showToast("Đã lưu quy đổi kg thành công!", "success");
            setEditingKg(prev => { const n = { ...prev }; delete n[chitietcabanId]; return n; });
            loadData();
        } catch {
            showToast("Lưu quy đổi thất bại!", "error");
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
            <div className="max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="p-6 space-y-5">

                    {/* FORM THÊM SIZE */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Thêm size áp dụng</label>

                        {/* Chọn / tạo mới size */}
                        <div className="flex gap-2">
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
                        </div>

                        {/* Nhập số kg quy đổi */}
                        <div>
                            <label className="text-xs text-slate-500 mb-1 block font-medium">
                                Số kg quy đổi mỗi con/bao <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                min="0.01"
                                value={sokgtuongung}
                                onChange={(e) => setSokgtuongung(e.target.value)}
                                placeholder="VD: 0.5 → mỗi con quy đổi = 0.5 kg"
                                className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none bg-white"
                            />
                        </div>

                        <button
                            onClick={handleAddSize}
                            className="w-full py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-xs text-sm cursor-pointer"
                        >
                            {isCreatingNew ? "Lưu lại" : "Áp dụng"}
                        </button>

                        <div className="text-center">
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

                    {/* DANH SÁCH CÁC SIZE ĐANG ÁP DỤNG */}
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2.5">Các size đang áp dụng thực tế</label>
                        {fishInventory.length > 0 ? (
                            <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
                                <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-medium">Size</th>
                                        <th className="text-center px-3 py-2 font-medium">Kg quy đổi / con</th>
                                        <th className="w-8"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fishInventory.map((item) => {
                                        const quy = quydois.find(q => q.idchitietcaban === item.id);
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/60">
                                                <td className="px-3 py-2.5 font-bold text-slate-700">{item.tenSize}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {quy ? (
                                                        <span className="text-cyan-700 font-bold">{quy.sokgtuongung} kg</span>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 justify-center">
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0.01"
                                                                value={editingKg[item.id] || ""}
                                                                onChange={(e) => setEditingKg(prev => ({ ...prev, [item.id]: e.target.value }))}
                                                                placeholder="0.00"
                                                                className="w-20 px-2 py-1 text-xs rounded border border-orange-300 focus:border-orange-500 outline-none text-center"
                                                            />
                                                            <button
                                                                onClick={() => handleSaveKg(item.id)}
                                                                className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold hover:bg-orange-600 cursor-pointer whitespace-nowrap"
                                                            >
                                                                Lưu
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-2 py-2.5 text-right">
                                                    <button
                                                        onClick={() => handleDeleteSize(item.id)}
                                                        className="size-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="size-3.5">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
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
