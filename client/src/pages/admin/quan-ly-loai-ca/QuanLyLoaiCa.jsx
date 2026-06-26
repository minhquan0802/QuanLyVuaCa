import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangLoaiCa from "./components/BangLoaiCa";
import ThanhCongCuLoaiCa from "./components/ThanhCongCuLoaiCa";

export default function QuanLyLoaiCa() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const {
          data: { result },
        } = await api.get("/Loaicas");
        setCategories(result || []);
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
        showToast("Không thể tải danh sách loại cá!", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AdminLayout title="Quản Lý Loại Cá & Kích Thước">
      <ThanhCongCuLoaiCa
        onAddNew={() => navigate("/admin/QuanLyLoaiCa/them")}
      />
      <BangLoaiCa
        loading={loading}
        categories={categories}
        onEdit={(category) =>
          navigate(`/admin/QuanLyLoaiCa/sua/${category.id}`, {
            state: { category },
          })
        }
        onOpenSize={(fish) =>
          navigate(`/admin/QuanLyLoaiCa/kich-co/${fish.id}`)
        }
      />
    </AdminLayout>
  );
}
