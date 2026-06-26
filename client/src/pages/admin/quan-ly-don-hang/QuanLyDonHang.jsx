import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangDonHang from "./components/BangDonHang";
import BoLocDonHang from "./components/BoLocDonHang";
import { locDonHangTheoTrangThai, sapXepDonHang } from "./utils";

export default function QuanLyDonHang() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    api
      .get("/Donhangs")
      .then((res) => setOrders(sapXepDonHang(res.data.result || [])))
      .catch(() => showToast("Không thể tải danh sách đơn hàng!", "error"))
      .finally(() => setLoading(false));
  }, []);

  const filteredOrders = useMemo(
    () => locDonHangTheoTrangThai(orders, filterStatus),
    [orders, filterStatus],
  );

  return (
    <AdminLayout title="Quản Lý Đơn Hàng">
      <BoLocDonHang
        filterStatus={filterStatus}
        onChangeStatus={setFilterStatus}
        onCreateOrder={() => navigate("/admin/QuanLyDonHang/tao-don")}
      />
      <BangDonHang
        loading={loading}
        orders={filteredOrders}
        onOpenOrder={(item) =>
          navigate(`/admin/QuanLyDonHang/chi-tiet/${item.iddonhang}`)
        }
      />
    </AdminLayout>
  );
}
