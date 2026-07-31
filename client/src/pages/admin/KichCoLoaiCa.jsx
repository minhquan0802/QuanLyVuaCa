import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useConfirm } from "../../context/ConfirmContext";

export default function KichCoLoaiCa() {
    const { loaicaId } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { confirm } = useConfirm();

    const [selectedFish, setSelectedFish] = useState(null);
    const [fishInventory, setFishInventory] = useState([]);
    const [allGlobalSizes, setAllGlobalSizes] = useState([]);
    const [selectedSizeId, setSelectedSizeId] = useState("");
    const [isCreatingNew, setIsCreatingNew] = useState(false);
    const [newSizeName, setNewSizeName] = useState("");
    const [sokgtuongung, setSokgtuongung] = useState("");
    const [editingKg, setEditingKg] = useState({});

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
        api.get("/Loaicas/admin/all")
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

        if (isCreatingNew) {
            if (!newSizeName.trim()) { showToast("Vui lòng nhập tên kích thước!", "error"); return; }
        } else if (!selectedSizeId) {
            showToast("Vui lòng chọn kích thước có sẵn!", "error");
            return;
        }

        const accepted = await confirm({
            title: isCreatingNew ? "Tạo kích cỡ mới" : "Áp dụng kích cỡ",
            message: isCreatingNew
                ? `Tạo kích cỡ “${newSizeName.trim()}” và áp dụng cho loại cá này?`
                : "Áp dụng kích cỡ đã chọn cùng số kg quy đổi?",
            confirmText: isCreatingNew ? "Tạo và áp dụng" : "Áp dụng",
            variant: "primary",
        });
        if (!accepted) return;

        try {
            let sizeIdToAdd = selectedSizeId;
            let sizeNameToAdd = allGlobalSizes.find(
                size => String(size.idsizeca) === String(selectedSizeId)
            )?.sizeca || "";

            if (isCreatingNew) {
                sizeNameToAdd = newSizeName.trim();
                const matchingSize = allGlobalSizes.find(
                    size => size.sizeca?.trim().toLocaleLowerCase("vi-VN")
                        === sizeNameToAdd.toLocaleLowerCase("vi-VN")
                );

                if (matchingSize) {
                    sizeIdToAdd = matchingSize.idsizeca;
                } else {
                    const { data: sizeData } = await api.post("/Sizecas", { sizeca: sizeNameToAdd });
                    sizeIdToAdd = sizeData.result.idsizeca;
                    sizeNameToAdd = sizeData.result.sizeca;
                }
            }

            // Bước 1: Tạo mới hoặc khôi phục liên kết loại cá - kích cỡ.
            const { data: productData } = await api.post("/Chitietcabans", {
                idloaica: Number(loaicaId),
                idsizeca: sizeIdToAdd,
                soluongton: 0,
                sokgtuongung: kgValue
            });
            const product = productData?.result;
            if (!product?.id) {
                throw new Error("API không trả về chi tiết sản phẩm vừa tạo");
            }

            showToast("Đã áp dụng kích thước. Vui lòng thiết lập giá bán!", "success");
            navigate("/admin/QuanLyBangGia/them", {
                state: {
                    idchitietcaban: product.id,
                    returnTo: `/admin/QuanLyLoaiCa/kich-co/${loaicaId}`,
                    source: "size-setup",
                    productName: `${selectedFish?.tenloaica || "Loại cá"} - ${sizeNameToAdd || "Kích cỡ"}`,
                },
            });
        } catch (error) {
            showToast(error.response?.data?.message || error.message || "Không thể thêm kích thước!", "error");
        }
    };

    const handleSaveKg = async (chitietcabanId) => {
        const kgValue = parseFloat(editingKg[chitietcabanId]);
        if (!kgValue || kgValue <= 0) {
            showToast("Vui lòng nhập số kg hợp lệ (lớn hơn 0)!", "error");
            return;
        }
        const accepted = await confirm({
            title: "Cập nhật kg quy đổi",
            message: `Lưu mức quy đổi mới là ${kgValue} kg?`,
            confirmText: "Lưu thay đổi",
            variant: "primary",
        });
        if (!accepted) return;
        try {
            await api.put(`/Chitietcabans/${chitietcabanId}/so-kg-tuong-ung`, {
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
        const accepted = await confirm({
            title: "Xóa kích thước",
            message: "Bạn có chắc muốn xóa kích thước này khỏi loại cá?",
            confirmText: "Xóa",
            variant: "danger",
        });
        if (!accepted) return;
        try {
            await api.delete(`/Chitietcabans/${chitietId}`);
            setFishInventory(prev => prev.filter(s => s.id !== chitietId));
            showToast("Đã gỡ bỏ kích thước thành công!", "success");
        } catch (error) {
            showToast(
                error.response?.data?.message || "Gỡ bỏ kích thước thất bại!",
                "error"
            );
        }
    };

    return (
        <AdminLayout title={`Quản lý kích thước${selectedFish ? ` — ${selectedFish.tenloaica}` : ""}`}>
            <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-black overflow-hidden">
                <div className="px-6 py-4 border-b border-black bg-cyan-600">
                    <h3 className="font-bold text-lg text-white">
                        {selectedFish?.tenloaica || "Quản lý kích cỡ loại cá"}
                    </h3>
                    <p className="text-xs text-cyan-50">Thêm kích cỡ và điều chỉnh khối lượng quy đổi.</p>
                </div>

                <div className="p-5 space-y-3">

                    {/* FORM THÊM SIZE */}
                    <div className="bg-cyan-50 p-4 rounded-xl border border-black space-y-3">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                                Tên loại cá
                            </label>
                            <div className="w-full p-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-cyan-950">
                                {selectedFish?.tenloaica || "Đang tải..."}
                            </div>
                        </div>

                        <label className="block text-xs font-bold text-slate-500 uppercase">Thêm size áp dụng</label>

                        {/* Chọn / tạo mới size */}
                        <div className="flex gap-2">
                            {isCreatingNew ? (
                                <input
                                    type="text"
                                    value={newSizeName}
                                    onChange={(e) => setNewSizeName(e.target.value)}
                                    placeholder="VD: Size 2-3kg, Lớn..."
                                    className="flex-1 p-2 text-sm rounded-xl border border-cyan-300 focus:ring-2 focus:ring-cyan-200 bg-white outline-none font-medium"
                                    autoFocus
                                />
                            ) : (
                                <select
                                    className="flex-1 p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none bg-white font-medium"
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
                                className="w-full p-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none bg-white"
                            />
                        </div>

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
                            <table className="w-full text-sm border border-black rounded-xl overflow-hidden">
                                <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
                                    <tr>
                                        <th className="text-left px-3 py-2 font-medium">Size</th>
                                        <th className="text-center px-3 py-2 font-medium">Kg quy đổi / con</th>
                                        <th className="w-24 px-3 py-2 text-center font-medium">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {fishInventory.map((item) => {
                                        return (
                                            <tr key={item.id} className="hover:bg-slate-50/60">
                                                <td className="px-3 py-2.5 font-semibold text-slate-800">{item.tenSize}</td>
                                                <td className="px-3 py-2 text-center">
                                                    {item.sokgtuongung ? (
                                                        <span className="text-slate-700 font-semibold tabular-nums">{item.sokgtuongung} kg</span>
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
                                                <td className="px-2 py-2.5 text-center">
                                                    <button
                                                        onClick={() => handleDeleteSize(item.id)}
                                                        className="w-full inline-flex items-center justify-center px-2.5 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-bold hover:bg-red-100 transition-colors text-xs cursor-pointer"
                                                    >
                                                        Xóa
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

                </div>

                <div className="p-4 border-t border-black bg-cyan-600 flex justify-end gap-3">
                    <button onClick={() => navigate("/admin/QuanLyLoaiCa")} className="px-5 py-2.5 rounded-xl border border-red-700 bg-red-50 text-red-700 font-bold hover:bg-red-100 text-sm cursor-pointer">
                        Hủy
                    </button>
                    <button onClick={handleAddSize} className="px-6 py-2.5 rounded-xl border border-black bg-white text-cyan-800 font-bold hover:bg-cyan-50 shadow-sm text-sm cursor-pointer">
                        {isCreatingNew ? "Lưu kích cỡ mới" : "Áp dụng kích cỡ"}
                    </button>
                </div>
            </div>
        </AdminLayout>
    );
}
