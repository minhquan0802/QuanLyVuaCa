import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import FormTaiKhoan from "./components/FormTaiKhoan";
import StyleFormTaiKhoan from "./components/StyleFormTaiKhoan";

export default function ThemSuaTaiKhoan() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    ho: "",
    ten: "",
    email: "",
    matkhau: "",
    sodienthoai: "",
    diachi: "",
    vaitro: "CUSTOMER",
    trangthaitk: "HOAT_DONG",
  });

  useEffect(() => {
    if (!isEditing) return;

    if (location.state?.user) {
      setCurrentUser({ ...location.state.user, matkhau: "" });
      return;
    }

    api
      .get("/tai-khoan")
      .then(({ data }) => {
        const list = data.result || (Array.isArray(data) ? data : []);
        const user = list.find((u) => u.idtaikhoan === id);
        if (user) setCurrentUser({ ...user, matkhau: "" });
        else showToast("Không tìm thấy tài khoản!", "error");
      })
      .catch(() => showToast("Không thể tải thông tin tài khoản!", "error"));
  }, [id]);

  const taoPayload = () => ({
    vaitro: currentUser.vaitro,
    ho: currentUser.ho,
    ten: currentUser.ten,
    matkhau: isEditing && !currentUser.matkhau ? null : currentUser.matkhau,
    email: currentUser.email,
    sodienthoai: currentUser.sodienthoai,
    diachi: currentUser.diachi,
    ...(isEditing && { trangthaitk: currentUser.trangthaitk }),
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/tai-khoan/${id}`, taoPayload());
      } else {
        await api.post("/tai-khoan", taoPayload());
      }

      showToast(
        isEditing
          ? "Cập nhật tài khoản thành công!"
          : "Thêm mới tài khoản thành công!",
        "success",
      );
      navigate("/admin/QuanLyTaiKhoan");
    } catch (error) {
      showToast(
        `Có lỗi xảy ra: ${error.response?.data?.message || "Thao tác thất bại"}`,
        "error",
      );
    }
  };

  return (
    <AdminLayout
      title={isEditing ? "Cập nhật Tài khoản" : "Thêm Tài khoản mới"}
    >
      <div className="max-w-2xl mx-auto">
        <FormTaiKhoan
          isEditing={isEditing}
          currentUser={currentUser}
          showPassword={showPassword}
          onChangeUser={setCurrentUser}
          onTogglePassword={() => setShowPassword(!showPassword)}
          onSubmit={handleSubmit}
          onCancel={() => navigate("/admin/QuanLyTaiKhoan")}
        />
      </div>
      <StyleFormTaiKhoan />
    </AdminLayout>
  );
}
