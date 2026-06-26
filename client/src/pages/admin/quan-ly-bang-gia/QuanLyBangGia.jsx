import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangGiaTable from "./components/BangGiaTable";
import ThanhCongCuBangGia from "./components/ThanhCongCuBangGia";
import { locBangGia, sapXepBangGia } from "./utils";

export default function QuanLyBangGia() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [priceList, setPriceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/Banggias");
        setPriceList(sapXepBangGia(data.result || []));
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        showToast("Không thể tải dữ liệu bảng giá!", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout title="Quản Lý Bảng Giá">
      <ThanhCongCuBangGia
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onAddNew={() => navigate("/admin/QuanLyBangGia/them")}
      />
      <BangGiaTable
        loading={loading}
        priceList={locBangGia(priceList, searchTerm)}
      />
    </AdminLayout>
  );
}
