import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import { NEW_SIZE_SENTINEL } from "./constants";
import DanhSachSizeQuyDoi from "./components/DanhSachSizeQuyDoi";
import FormThongTinLoaiCa from "./components/FormThongTinLoaiCa";

export default function ThemSuaLoaiCa() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [isSaving, setIsSaving] = useState(false);
  const [currentCategory, setCurrentCategory] = useState({
    tenloaica: "",
    mieuta: "",
    hinhanhurl: "",
  });
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [allGlobalSizes, setAllGlobalSizes] = useState([]);
  const [sizeRows, setSizeRows] = useState([
    { sizeId: "", newSizeName: "", kg: "" },
  ]);

  useEffect(() => {
    if (isEditing) {
      if (location.state?.category) {
        setCurrentCategory({ ...location.state.category, hinhanhFile: null });
        return;
      }
      api
        .get("/Loaicas")
        .then(({ data }) => {
          const list =
            data.result || data.data || (Array.isArray(data) ? data : []);
          const item = list.find((c) => String(c.id) === String(id));
          if (item) setCurrentCategory({ ...item, hinhanhFile: null });
          else showToast("Không tìm thấy loại cá!", "error");
        })
        .catch(() => showToast("Không thể tải thông tin loại cá!", "error"));
    } else {
      api
        .get("/Sizecas")
        .then(({ data }) => setAllGlobalSizes(data.result || []))
        .catch(() => {});
    }
  }, [id]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCurrentCategory((prev) => ({ ...prev, hinhanhFile: file }));
    setImagePreview(URL.createObjectURL(file));
  };

  const addSizeRow = () =>
    setSizeRows((prev) => [...prev, { sizeId: "", newSizeName: "", kg: "" }]);
  const removeSizeRow = (index) =>
    setSizeRows((prev) => prev.filter((_, i) => i !== index));
  const updateSizeRow = (index, field, value) =>
    setSizeRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
    );

  const taoSizeVaQuyDoi = async (newLoaicaId) => {
    const validRows = sizeRows.filter((row) => {
      const hasSize =
        row.sizeId === NEW_SIZE_SENTINEL ? row.newSizeName.trim() : row.sizeId;
      return hasSize && row.kg && parseFloat(row.kg) > 0;
    });

    for (const row of validRows) {
      let sizeIdToUse = row.sizeId;
      if (row.sizeId === NEW_SIZE_SENTINEL) {
        const { data: sizeData } = await api.post("/Sizecas", {
          sizeca: row.newSizeName.trim(),
        });
        sizeIdToUse = sizeData.result.idsizeca;
      }
      const { data: cbData } = await api.post("/Chitietcabans", {
        idloaica: newLoaicaId,
        idsizeca: sizeIdToUse,
        soluongton: 0,
      });
      await api.post("/Quydois", {
        idchitietcaban: cbData.result.id,
        sokgtuongung: parseFloat(row.kg),
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append("tenloaica", currentCategory.tenloaica);
      formData.append("mieuta", currentCategory.mieuta || "");
      if (currentCategory.hinhanhFile)
        formData.append("hinhanh", currentCategory.hinhanhFile);

      if (isEditing) {
        await api.put(`/Loaicas/${id}`, formData);
        showToast("Cập nhật thông tin thành công!", "success");
        navigate("/admin/QuanLyLoaiCa");
        return;
      }

      const { data: loaicaData } = await api.post("/Loaicas", formData);
      await taoSizeVaQuyDoi(loaicaData.result?.id);
      showToast("Thêm mới loại cá thành công!", "success");
      navigate("/admin/QuanLyLoaiCa");
    } catch (error) {
      showToast(
        `Lỗi: ${error.response?.data?.message || "Thao tác thất bại"}`,
        "error",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout title={isEditing ? "Cập nhật Loại Cá" : "Thêm Loại Cá Mới"}>
      <div className="max-w-lg mx-auto">
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 space-y-4"
        >
          <FormThongTinLoaiCa
            currentCategory={currentCategory}
            imagePreview={imagePreview}
            isEditing={isEditing}
            fileInputRef={fileInputRef}
            onFileChange={handleFileChange}
            onChangeCategory={setCurrentCategory}
          />
          <DanhSachSizeQuyDoi
            isEditing={isEditing}
            sizeRows={sizeRows}
            allGlobalSizes={allGlobalSizes}
            onAddRow={addSizeRow}
            onRemoveRow={removeSizeRow}
            onUpdateRow={updateSizeRow}
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => navigate("/admin/QuanLyLoaiCa")}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium disabled:opacity-50 text-sm cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 disabled:opacity-60 flex items-center gap-2 text-sm cursor-pointer"
            >
              {isSaving && (
                <div className="size-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {isSaving
                ? "Đang lưu..."
                : isEditing
                  ? "Lưu thay đổi"
                  : "Thêm mới"}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}
