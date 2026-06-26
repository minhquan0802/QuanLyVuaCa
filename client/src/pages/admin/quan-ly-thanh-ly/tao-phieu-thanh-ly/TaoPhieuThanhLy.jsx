import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import ChiTietPhieuThanhLy from "./components/ChiTietPhieuThanhLy";
import ThongTinChungThanhLy from "./components/ThongTinChungThanhLy";
import { layLoaiCaTuKho, laySizeTheoLoaiCa } from "./utils/tinhPhieuThanhLy";

export default function TaoPhieuThanhLy() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState([]);

  const [headerForm, setHeaderForm] = useState({
    lydothanhly: "",
    trangthai: "DA_TIEU_HUY",
    ghichu: "",
  });

  const [idloaica, setIdloaica] = useState("");
  const [idsizeca, setIdsizeca] = useState("");
  const [currentDetail, setCurrentDetail] = useState({
    idchitietphieunhap: "",
    soluongthanhly: 0,
    dongia: 0,
  });
  const [addedDetails, setAddedDetails] = useState([]);

  useEffect(() => {
    api
      .get("/Chitietcabans")
      .then((res) => setInventory(res.data.result || []))
      .catch(() => showToast("Không thể tải danh sách sản phẩm kho!", "error"))
      .finally(() => setLoading(false));
  }, []);

  const fishTypes = layLoaiCaTuKho(inventory);
  const availableSizes = laySizeTheoLoaiCa(inventory, idloaica);
  const selectedProduct = inventory.find(
    (i) => i.idLoaiCa == idloaica && i.idSizeCa == idsizeca,
  );
  const productId = selectedProduct?.id || "";

  useEffect(() => {
    if (!productId) {
      setLots([]);
      return;
    }

    api
      .get(`/Phieuthanhlys/lo-con-hang?idchitietcaban=${productId}`)
      .then((res) => setLots(res.data.result || []))
      .catch(() => showToast("Không thể tải danh sách lô!", "error"));
  }, [productId]);

  const handleSelectFish = (fishId) => {
    setIdloaica(fishId);
    setIdsizeca("");
    setCurrentDetail((prev) => ({ ...prev, idchitietphieunhap: "" }));
  };

  const handleSelectSize = (sizeId) => {
    setIdsizeca(sizeId);
    setCurrentDetail((prev) => ({ ...prev, idchitietphieunhap: "" }));
  };

  const selectedLot = lots.find(
    (l) => l.idchitietphieunhap === currentDetail.idchitietphieunhap,
  );

  const handleAddDetail = () => {
    if (!selectedProduct) {
      showToast("Vui lòng chọn Loại cá và Size!", "error");
      return;
    }
    if (!selectedLot) {
      showToast("Vui lòng chọn lô hàng!", "error");
      return;
    }

    const soLuong = Number(currentDetail.soluongthanhly);
    if (soLuong <= 0) {
      showToast("Số lượng thanh lý phải > 0", "error");
      return;
    }
    if (soLuong > Number(selectedLot.soluongconlai)) {
      showToast(`Lô này chỉ còn ${selectedLot.soluongconlai}kg!`, "error");
      return;
    }
    if (Number(currentDetail.dongia) < 0) {
      showToast("Đơn giá không được âm", "error");
      return;
    }

    setAddedDetails((prev) => [
      ...prev,
      {
        idTemp: Date.now(),
        idchitietphieunhap: selectedLot.idchitietphieunhap,
        tenLoaiCa: selectedProduct.tenLoaiCa,
        tenSize: selectedProduct.tenSize,
        ngaynhap: selectedLot.ngaynhap,
        soluongthanhly: soLuong,
        dongia: Number(currentDetail.dongia),
      },
    ]);

    setCurrentDetail({ idchitietphieunhap: "", soluongthanhly: 0, dongia: 0 });
  };

  const handleRemoveDetail = (idTemp) =>
    setAddedDetails((prev) => prev.filter((item) => item.idTemp !== idTemp));

  const handleSubmit = async () => {
    if (!headerForm.lydothanhly.trim()) {
      showToast("Vui lòng nhập lý do thanh lý!", "error");
      return;
    }
    if (addedDetails.length === 0) {
      showToast("Phiếu thanh lý chưa có chi tiết lô hàng nào!", "error");
      return;
    }

    const payload = {
      lydothanhly: headerForm.lydothanhly,
      trangthai: headerForm.trangthai,
      ghichu: headerForm.ghichu,
      listChiTiet: addedDetails.map((d) => ({
        idchitietphieunhap: d.idchitietphieunhap,
        soluongthanhly: parseFloat(d.soluongthanhly),
        dongia: parseFloat(d.dongia),
      })),
    };

    try {
      await api.post("/Phieuthanhlys", payload);
      showToast("Lập phiếu thanh lý thành công!", "success");
      navigate("/admin/QuanLyThanhLy");
    } catch {
      showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Lập Phiếu Thanh Lý">
        <div className="p-8 text-center text-slate-400">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Lập Phiếu Thanh Lý">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ThongTinChungThanhLy
          headerForm={headerForm}
          onChangeForm={setHeaderForm}
        />
        <ChiTietPhieuThanhLy
          idloaica={idloaica}
          idsizeca={idsizeca}
          productId={productId}
          fishTypes={fishTypes}
          availableSizes={availableSizes}
          lots={lots}
          currentDetail={currentDetail}
          addedDetails={addedDetails}
          onSelectFish={handleSelectFish}
          onSelectSize={handleSelectSize}
          onChangeDetail={setCurrentDetail}
          onAddDetail={handleAddDetail}
          onRemoveDetail={handleRemoveDetail}
          onCancel={() => navigate("/admin/QuanLyThanhLy")}
          onSubmit={handleSubmit}
        />
      </div>
    </AdminLayout>
  );
}
