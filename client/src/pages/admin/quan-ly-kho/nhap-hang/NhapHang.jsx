import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import ChiTietNhapHang from "./components/ChiTietNhapHang";
import ThongTinChungNhapHang from "./components/ThongTinChungNhapHang";
import { layLoaiCaTuKho, laySizeTheoLoaiCa } from "./utils/tinhNhapHang";

export default function NhapHang() {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [inventory, setInventory] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [priceList, setPriceList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [importForm, setImportForm] = useState({
    idloaica: location.state?.initialLoaicaId || "",
    idncc: "",
    ngaynhap: new Date().toISOString().split("T")[0],
    trangthaithanhtoan: "CHUA_THANH_TOAN",
    ghichu: "",
  });

  const [currentDetail, setCurrentDetail] = useState({
    idsizeca: location.state?.initialSizeId || "",
    sizeName: location.state?.initialSizeName || "",
    soluongnhap: 10,
    gianhap: 0,
    giabanledukien: location.state?.initialAutoLe || 0,
    giabansidukien: location.state?.initialAutoSi || 0,
  });

  const [addedDetails, setAddedDetails] = useState([]);

  useEffect(() => {
    Promise.all([
      api.get("/Chitietcabans"),
      api.get("/Nhacungcaps"),
      api.get("/Banggias"),
    ])
      .then(([resInventory, resSuppliers, resPrices]) => {
        setInventory(resInventory.data.result || []);
        setSuppliers(resSuppliers.data.result || []);
        setPriceList(
          (resPrices.data.result || []).filter(
            (p) => p.trangThai === "Đang áp dụng",
          ),
        );
      })
      .catch(() => showToast("Không thể tải dữ liệu!", "error"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (priceList.length > 0 && location.state?.id) {
      const matchPrice = priceList.find(
        (p) => Number(p.idChitietcaban) === Number(location.state.id),
      );
      if (matchPrice) {
        setCurrentDetail((prev) => ({
          ...prev,
          giabanledukien: matchPrice.giaBanLe || 0,
          giabansidukien: matchPrice.giaBanSi || 0,
        }));
      }
    }
  }, [priceList, location.state]);

  const fishTypes = layLoaiCaTuKho(inventory);
  const availableSizes = laySizeTheoLoaiCa(inventory, importForm.idloaica);

  const handleSelectFishImport = (fishId) => {
    setImportForm((prev) => ({ ...prev, idloaica: fishId }));
    setCurrentDetail((prev) => ({
      ...prev,
      idsizeca: "",
      sizeName: "",
      giabanledukien: 0,
      giabansidukien: 0,
    }));
  };

  const handleSelectSize = (e) => {
    const sizeId = e.target.value;
    const sizeObj = availableSizes.find((s) => s.id == sizeId);
    const invItem = inventory.find(
      (i) => i.idLoaiCa == importForm.idloaica && i.idSizeCa == sizeId,
    );
    const matchPrice = invItem
      ? priceList.find((p) => Number(p.idChitietcaban) === Number(invItem.id))
      : null;

    setCurrentDetail((prev) => ({
      ...prev,
      idsizeca: sizeId,
      sizeName: sizeObj ? sizeObj.sizeca : "",
      giabanledukien: matchPrice ? matchPrice.giaBanLe : 0,
      giabansidukien: matchPrice ? matchPrice.giaBanSi : 0,
    }));
  };

  const handleAddDetail = () => {
    if (!currentDetail.idsizeca) {
      showToast("Vui lòng chọn Size!", "error");
      return;
    }
    if (currentDetail.soluongnhap <= 0) {
      showToast("Số lượng nhập phải > 0", "error");
      return;
    }
    if (currentDetail.gianhap <= 0) {
      showToast("Giá nhập phải > 0", "error");
      return;
    }

    const finalLe = Number(currentDetail.giabanledukien);
    const finalSi = Number(currentDetail.giabansidukien);

    if (finalLe > 0 && finalLe <= Number(currentDetail.gianhap)) {
      showToast("Giá Bán Lẻ phải lớn hơn Giá Nhập!", "error");
      return;
    }
    if (finalSi > 0 && finalSi <= Number(currentDetail.gianhap)) {
      showToast("Giá Bán Sỉ phải lớn hơn Giá Nhập!", "error");
      return;
    }

    setAddedDetails((prev) => [
      ...prev,
      {
        ...currentDetail,
        giabanledukien: finalLe,
        giabansidukien: finalSi,
        idTemp: Date.now(),
      },
    ]);
    setCurrentDetail((prev) => ({
      ...prev,
      idsizeca: "",
      sizeName: "",
      giabanledukien: 0,
      giabansidukien: 0,
    }));
  };

  const handleRemoveDetail = (idTemp) =>
    setAddedDetails((prev) => prev.filter((item) => item.idTemp !== idTemp));

  const handleSubmitImport = async () => {
    if (!importForm.idloaica || !importForm.idncc) {
      showToast("Vui lòng chọn Loại cá và Nhà cung cấp!", "error");
      return;
    }
    if (addedDetails.length === 0) {
      showToast("Phiếu nhập chưa có chi tiết lô hàng nào!", "error");
      return;
    }

    const payload = {
      idloaica: parseInt(importForm.idloaica),
      idncc: parseInt(importForm.idncc),
      ngaynhap: importForm.ngaynhap,
      trangthaithanhtoan: importForm.trangthaithanhtoan,
      ghichu: importForm.ghichu,
      listChiTiet: addedDetails.map((d) => ({
        idsizeca: parseInt(d.idsizeca),
        soluongnhap: parseFloat(d.soluongnhap),
        gianhap: parseFloat(d.gianhap),
        giabanletaithoidiemnhap: parseFloat(d.giabanledukien),
        giabansitaithoidiemnhap: parseFloat(d.giabansidukien),
      })),
    };

    try {
      await api.post("/Phieunhaps", payload);
      showToast("Nhập hàng thành công!", "success");
      navigate("/admin/QuanLyKho");
    } catch {
      showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Tạo Phiếu Nhập Hàng">
        <div className="p-8 text-center text-slate-400">
          Đang tải dữ liệu...
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tạo Phiếu Nhập Hàng">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <ThongTinChungNhapHang
          importForm={importForm}
          suppliers={suppliers}
          fishTypes={fishTypes}
          onChangeForm={setImportForm}
          onSelectFish={handleSelectFishImport}
        />

        <ChiTietNhapHang
          importForm={importForm}
          currentDetail={currentDetail}
          availableSizes={availableSizes}
          addedDetails={addedDetails}
          onSelectSize={handleSelectSize}
          onChangeDetail={setCurrentDetail}
          onAddDetail={handleAddDetail}
          onRemoveDetail={handleRemoveDetail}
          onCancel={() => navigate("/admin/QuanLyKho")}
          onSubmit={handleSubmitImport}
        />
      </div>
    </AdminLayout>
  );
}
