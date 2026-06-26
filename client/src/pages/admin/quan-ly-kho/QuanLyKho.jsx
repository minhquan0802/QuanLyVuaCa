import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangKhoHang from "./components/BangKhoHang";

export default function QuanLyKho() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/Chitietcabans")
      .then((res) => setInventory(res.data.result || []))
      .catch(() => showToast("Không thể tải dữ liệu!", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleImport = (item) =>
    navigate("/admin/QuanLyKho/nhap-hang", {
      state: {
        id: item.id,
        initialLoaicaId: item.idLoaiCa,
        initialSizeId: item.idSizeCa,
        initialSizeName: item.tenSize,
      },
    });

  return (
    <AdminLayout title="Quản Lý Kho Hàng">
      <div className="flex justify-between items-center mb-6">
        <p className="text-slate-500 text-sm">Theo dõi tồn kho và nhập hàng.</p>
        <button
          onClick={() => navigate("/admin/QuanLyKho/nhap-hang")}
          className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl text-sm"
        >
          Tạo Phiếu Nhập
        </button>
      </div>
      <BangKhoHang
        loading={loading}
        inventory={inventory}
        onImport={handleImport}
      />
    </AdminLayout>
  );
}
