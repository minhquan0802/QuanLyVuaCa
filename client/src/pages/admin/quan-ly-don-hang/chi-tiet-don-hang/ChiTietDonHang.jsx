import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import BangChiTietMatHang from "./components/BangChiTietMatHang";
import ThongTinDonHang from "./components/ThongTinDonHang";
import { ORDER_STATUS } from "./constants";

export default function ChiTietDonHang() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [order, setOrder] = useState(null);
  const [viewDetails, setViewDetails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEdited, setIsEdited] = useState(false);

  useEffect(() => {
    Promise.all([api.get("/Donhangs"), api.get(`/Donhangs/${id}/chitiet`)])
      .then(([resOrders, resDetails]) => {
        const list = resOrders.data?.result || [];
        const found = list.find((o) => o.iddonhang === id);
        if (found) setOrder(found);
        setViewDetails(
          (resDetails.data?.result || []).map((d) => ({
            ...d,
            editWeight: d.soluongkgthucte || d.soluongkgthuctequydoi || 0,
          })),
        );
      })
      .catch(() => showToast("Không thể tải thông tin đơn hàng!", "error"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleWeightInputChange = useCallback((idDetail, newVal) => {
    const val = parseFloat(newVal) || 0;
    setViewDetails((prev) =>
      prev.map((item) =>
        item.idchitietdonhang === idDetail
          ? { ...item, editWeight: val, tongtienthucte: val * item.dongia }
          : item,
      ),
    );
    setIsEdited(true);
  }, []);

  const handleSaveRealWeight = async () => {
    const payload = viewDetails.map((item) => ({
      idChitietdonhang: item.idchitietdonhang,
      soluongkgthucte: item.editWeight,
    }));
    try {
      await api.put(`/Donhangs/${id}/cap-nhat-can-nang`, payload);
      showToast("Đã cập nhật cân nặng thực tế!", "success");
      setIsEdited(false);
    } catch {
      showToast("Cập nhật cân nặng thất bại!", "error");
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    if (
      isEdited &&
      !window.confirm("Bạn chưa lưu cân nặng đã sửa. Tiếp tục đổi trạng thái?")
    )
      return;
    if (
      !window.confirm(
        `Xác nhận chuyển trạng thái sang: ${ORDER_STATUS[newStatus].label}?`,
      )
    )
      return;
    try {
      await api.put(`/Donhangs/${id}/status`, { trangthaidonhang: newStatus });
      setOrder((prev) => ({ ...prev, trangthaidonhang: newStatus }));
      showToast("Chuyển trạng thái thành công!", "success");
    } catch {
      showToast("Lỗi thao tác thất bại!", "error");
    }
  };

  const calculateTotal = () =>
    viewDetails.reduce(
      (sum, item) => sum + (item.tongtienthucte || item.tongtiendukien || 0),
      0,
    );

  if (loading)
    return (
      <AdminLayout title="Chi tiết đơn hàng">
        <div className="text-center py-20 text-slate-400">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  if (!order)
    return (
      <AdminLayout title="Chi tiết đơn hàng">
        <div className="text-center py-20 text-slate-400">
          Không tìm thấy đơn hàng.
        </div>
      </AdminLayout>
    );

  const statusConfig = ORDER_STATUS[order.trangthaidonhang] || {
    label: order.trangthaidonhang,
    color: "bg-gray-50 text-gray-600 border-slate-200",
  };
  const isEditingMode = order.trangthaidonhang === "DANG_DONG_HANG";

  return (
    <AdminLayout
      title={`${isEditingMode ? "Cân & Đóng Hàng" : "Chi tiết đơn"} — #${id.substring(0, 8).toUpperCase()}`}
    >
      <div className="space-y-6">
        <ThongTinDonHang
          order={order}
          statusConfig={statusConfig}
          isEditingMode={isEditingMode}
          isEdited={isEdited}
          onSaveRealWeight={handleSaveRealWeight}
          onUpdateStatus={handleUpdateStatus}
        />
        <BangChiTietMatHang
          viewDetails={viewDetails}
          isEditingMode={isEditingMode}
          total={calculateTotal()}
          onWeightChange={handleWeightInputChange}
        />
        <div className="flex justify-start">
          <button
            onClick={() => navigate("/admin/QuanLyDonHang")}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm cursor-pointer"
          >
            ← Quay lại danh sách
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
