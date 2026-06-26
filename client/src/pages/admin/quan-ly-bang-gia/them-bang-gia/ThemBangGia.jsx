import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import FormThemBangGia from "./components/FormThemBangGia";

export default function ThemBangGia() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    idchitietcaban: "",
    giabanle: "",
    gibansi: "",
  });

  useEffect(() => {
    api
      .get("/Chitietcabans")
      .then(({ data }) => setProducts(data.result || []))
      .catch(() => showToast("Không thể tải danh sách sản phẩm!", "error"));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.idchitietcaban) {
      showToast("Vui lòng chọn sản phẩm!", "error");
      return;
    }
    try {
      await api.post("/Banggias", {
        idchitietcaban: parseInt(formData.idchitietcaban),
        giabanle: parseFloat(formData.giabanle),
        giabansi: parseFloat(formData.gibansi),
      });
      showToast(
        "Thiết lập giá thành công! Giá cũ đã được lưu vào lịch sử.",
        "success",
      );
      navigate("/admin/QuanLyBangGia");
    } catch (error) {
      showToast(
        `Lỗi: ${error.response?.data?.message || "Không thể lưu giá"}`,
        "error",
      );
    }
  };

  return (
    <AdminLayout title="Thiết lập giá bán mới">
      <div className="max-w-lg mx-auto">
        <FormThemBangGia
          products={products}
          formData={formData}
          onChangeForm={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/QuanLyBangGia")}
        />
      </div>
    </AdminLayout>
  );
}
