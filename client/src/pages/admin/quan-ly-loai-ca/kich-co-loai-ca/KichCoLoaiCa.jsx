import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import BangKichCoDangApDung from "./components/BangKichCoDangApDung";
import FormThemKichCo from "./components/FormThemKichCo";

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
      if (fish)
        setFishInventory(
          allItems.filter((item) => item.tenLoaiCa === fish.tenloaica),
        );
      setAllGlobalSizes(resAllSizes.data.result || []);
      setQuydois(resQuydois.data.result || []);
    } catch {
      showToast("Không thể tải dữ liệu kích thước!", "error");
    }
  };

  useEffect(() => {
    api
      .get("/Loaicas")
      .then(({ data }) => {
        const list =
          data.result || data.data || (Array.isArray(data) ? data : []);
        const fish = list.find((c) => String(c.id) === String(loaicaId));
        if (fish) {
          setSelectedFish(fish);
          loadData(fish);
        } else showToast("Không tìm thấy loại cá!", "error");
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
        if (!newSizeName.trim()) {
          showToast("Vui lòng nhập tên kích thước!", "error");
          return;
        }
        const { data: sizeData } = await api.post("/Sizecas", {
          sizeca: newSizeName,
        });
        sizeIdToAdd = sizeData.result.idsizeca;
      } else if (!sizeIdToAdd) {
        showToast("Vui lòng chọn kích thước có sẵn!", "error");
        return;
      }

      const { data: cbData } = await api.post("/Chitietcabans", {
        idloaica: Number(loaicaId),
        idsizeca: sizeIdToAdd,
        soluongton: 0,
      });
      await api.post("/Quydois", {
        idchitietcaban: cbData.result.id,
        sokgtuongung: kgValue,
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
        sokgtuongung: kgValue,
      });
      showToast("Đã lưu quy đổi kg thành công!", "success");
      setEditingKg((prev) => {
        const n = { ...prev };
        delete n[chitietcabanId];
        return n;
      });
      loadData();
    } catch {
      showToast("Lưu quy đổi thất bại!", "error");
    }
  };

  const handleDeleteSize = async (chitietId) => {
    if (!window.confirm("Xóa kích thước này khỏi loại cá?")) return;
    try {
      await api.delete(`/Chitietcabans/${chitietId}`);
      setFishInventory((prev) => prev.filter((s) => s.id !== chitietId));
      showToast("Đã gỡ bỏ kích thước thành công!", "success");
    } catch {
      showToast("Gỡ bỏ kích thước thất bại!", "error");
    }
  };

  return (
    <AdminLayout
      title={`Quản lý kích thước${selectedFish ? ` — ${selectedFish.tenloaica}` : ""}`}
    >
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
        <div className="p-6 space-y-5">
          <FormThemKichCo
            isCreatingNew={isCreatingNew}
            newSizeName={newSizeName}
            selectedSizeId={selectedSizeId}
            allGlobalSizes={allGlobalSizes}
            sokgtuongung={sokgtuongung}
            onChangeNewSizeName={setNewSizeName}
            onChangeSelectedSizeId={setSelectedSizeId}
            onChangeKg={setSokgtuongung}
            onAddSize={handleAddSize}
            onToggleCreateNew={setIsCreatingNew}
          />
          <BangKichCoDangApDung
            fishInventory={fishInventory}
            quydois={quydois}
            editingKg={editingKg}
            onChangeEditingKg={setEditingKg}
            onSaveKg={handleSaveKg}
            onDeleteSize={handleDeleteSize}
          />
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={() => navigate("/admin/QuanLyLoaiCa")}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm cursor-pointer"
            >
              ← Quay lại danh sách
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
