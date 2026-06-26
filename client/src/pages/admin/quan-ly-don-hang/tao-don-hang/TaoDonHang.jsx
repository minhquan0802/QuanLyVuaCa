import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../../components/admin/AdminLayout";
import api from "../../../../config/axios";
import { useToast } from "../../../../context/ToastContext";
import ChonKhachHang from "./components/ChonKhachHang";
import FormThemMatHang from "./components/FormThemMatHang";
import GioHangThanhToan from "./components/GioHangThanhToan";
import ManHinhHoanTatDonHang from "./components/ManHinhHoanTatDonHang";
import { taoPayloadDonHang } from "./utils/xuLyDonHang";

export default function TaoDonHang() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [customerType, setCustomerType] = useState("LE");
  const [customerConfirmed, setCustomerConfirmed] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [fishes, setFishes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [units, setUnits] = useState([]);
  const [priceList, setPriceList] = useState([]);
  const [conversionList, setConversionList] = useState([]);
  const [newOrder, setNewOrder] = useState({
    idthongtinkhachhang: "",
    tenKhachLe: "",
    sdtKhachLe: "",
    items: [],
  });
  const [currentItem, setCurrentItem] = useState({
    fishId: "",
    sizeId: "",
    repoId: "",
    unitId: "",
    unitName: "",
    factor: 0,
    quantity: 1,
    estimatedKg: 0,
    pricePerKg: 0,
  });
  const [orderDone, setOrderDone] = useState(false);
  const [completedOrderTotal, setCompletedOrderTotal] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/tai-khoan"),
      api.get("/Chitietcabans"),
      api.get("/Donvitinhs"),
      api.get("/Banggias"),
      api.get("/Quydois"),
    ])
      .then(([resCust, resRepo, resUnits, resPrices, resConversions]) => {
        setCustomers(
          (resCust.data?.result || []).filter((u) => u.vaitro === "CUSTOMER"),
        );
        setFishes(resRepo.data?.result || []);
        setUnits(resUnits.data?.result || []);
        setPriceList(resPrices.data?.result || []);
        setConversionList(resConversions.data?.result || []);
      })
      .catch(() => showToast("Không thể tải dữ liệu!", "error"));
  }, []);

  const fishTypes = useMemo(
    () =>
      fishes.reduce((acc, item) => {
        if (!acc.some((f) => f.id === item.idLoaiCa))
          acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
        return acc;
      }, []),
    [fishes],
  );

  const getConversionFactor = useCallback(
    (repoId) => {
      const match = conversionList.find(
        (c) => Number(c.idchitietcaban?.id) === Number(repoId),
      );
      return match ? match.sokgtuongung : 0;
    },
    [conversionList],
  );

  const getAutoPrice = useCallback(
    (repoId, isWholesale) => {
      const activePrice = priceList.find(
        (p) =>
          Number(p.idChitietcaban) === Number(repoId) &&
          p.trangThai === "Đang áp dụng",
      );
      if (!activePrice) return 0;
      return isWholesale ? activePrice.giaBanSi : activePrice.giaBanLe;
    },
    [priceList],
  );

  const handleConfirmCustomer = () => {
    if (customerType === "LE" && !newOrder.tenKhachLe.trim()) {
      showToast("Vui lòng nhập tên khách lẻ!", "error");
      return;
    }
    if (customerType === "SI" && !newOrder.idthongtinkhachhang) {
      showToast("Vui lòng chọn khách sỉ!", "error");
      return;
    }
    setCustomerConfirmed(true);
  };

  const handleFishChange = (fishId) => {
    setCurrentItem((prev) => ({
      ...prev,
      fishId,
      sizeId: "",
      repoId: "",
      pricePerKg: 0,
    }));
    setSizes(
      fishes
        .filter((item) => Number(item.idLoaiCa) === Number(fishId))
        .map((item) => ({
          idsizeca: item.idSizeCa,
          sizeca: item.tenSize,
          repoId: item.id,
        })),
    );
  };

  const handleSizeChange = (selectedSizeId) => {
    const selectedSizeObj = sizes.find((s) => s.idsizeca == selectedSizeId);
    const repoId = selectedSizeObj ? selectedSizeObj.repoId : "";
    let factor = currentItem.factor;
    if (currentItem.unitId) {
      const selectedUnit = units.find((u) => u.id == currentItem.unitId);
      factor = selectedUnit?.hesokg || getConversionFactor(repoId) || 0;
    }
    setCurrentItem((prev) => ({
      ...prev,
      sizeId: selectedSizeId,
      repoId,
      pricePerKg: getAutoPrice(repoId, customerType === "SI"),
      factor,
      estimatedKg:
        factor > 0 ? parseFloat((currentItem.quantity * factor).toFixed(2)) : 0,
    }));
  };

  const handleUnitChange = (val) => {
    const selectedUnit = units.find((u) => u.id == Number(val));
    if (!selectedUnit) return;
    const factor =
      selectedUnit.hesokg || getConversionFactor(currentItem.repoId) || 0;
    setCurrentItem((prev) => ({
      ...prev,
      unitId: Number(val),
      unitName: selectedUnit.tendvt,
      factor,
      estimatedKg:
        factor > 0
          ? parseFloat((prev.quantity * factor).toFixed(2))
          : prev.estimatedKg,
    }));
  };

  const handleQuantityChange = (qty) => {
    const quantity = parseFloat(qty) || 0;
    setCurrentItem((prev) => ({
      ...prev,
      quantity,
      estimatedKg: prev.factor > 0 ? quantity * prev.factor : prev.estimatedKg,
    }));
  };

  const handleAddItem = () => {
    if (!currentItem.fishId || !currentItem.sizeId || !currentItem.unitId) {
      showToast("Điền thiếu thông tin!", "error");
      return;
    }
    if (currentItem.pricePerKg === 0) {
      showToast("Chưa có giá bán!", "error");
      return;
    }
    const fish = fishTypes.find((f) => f.id == currentItem.fishId);
    const size = sizes.find((s) => s.idsizeca == currentItem.sizeId);
    const newItem = {
      id: Date.now(),
      repoId: currentItem.repoId,
      unitId: currentItem.unitId,
      unitName: currentItem.unitName,
      fishName: fish?.tenloaica,
      sizeName: size?.sizeca,
      quantity: currentItem.quantity,
      estimatedKg: currentItem.estimatedKg,
      pricePerKg: currentItem.pricePerKg,
      total: currentItem.estimatedKg * currentItem.pricePerKg,
    };
    setNewOrder((prev) => ({ ...prev, items: [...prev.items, newItem] }));
    setCurrentItem((prev) => ({ ...prev, quantity: 1, estimatedKg: 0 }));
  };

  const handleRemoveItem = (id) =>
    setNewOrder((prev) => ({
      ...prev,
      items: prev.items.filter((i) => i.id !== id),
    }));
  const newOrderTotal = useMemo(
    () => newOrder.items.reduce((sum, i) => sum + i.total, 0),
    [newOrder.items],
  );

  const handleSubmitOrder = async () => {
    if (newOrder.items.length === 0) {
      showToast("Đơn hàng rỗng!", "error");
      return;
    }
    try {
      await api.post(
        "/Donhangs",
        taoPayloadDonHang({ customerType, newOrder, customers }),
      );
      showToast("Tạo đơn hàng thành công!", "success");
      setCompletedOrderTotal(newOrderTotal);
      setOrderDone(true);
    } catch {
      showToast("Lỗi tạo đơn hàng!", "error");
    }
  };

  if (orderDone) {
    return (
      <AdminLayout title="Don hang hoan tat">
        <ManHinhHoanTatDonHang
          customerType={customerType}
          completedOrderTotal={completedOrderTotal}
          onGoToOrderManagement={() => navigate("/admin/QuanLyDonHang")}
        />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Tạo Đơn hàng (POS)">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-sm">
        <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl border border-slate-200 p-5">
          <ChonKhachHang
            customerType={customerType}
            customerConfirmed={customerConfirmed}
            customers={customers}
            newOrder={newOrder}
            onChangeCustomerType={setCustomerType}
            onChangeOrder={setNewOrder}
            onConfirmCustomer={handleConfirmCustomer}
          />
          <FormThemMatHang
            customerConfirmed={customerConfirmed}
            fishTypes={fishTypes}
            sizes={sizes}
            units={units}
            currentItem={currentItem}
            onFishChange={handleFishChange}
            onSizeChange={handleSizeChange}
            onUnitChange={handleUnitChange}
            onQuantityChange={handleQuantityChange}
            onChangeItem={setCurrentItem}
            onAddItem={handleAddItem}
          />
        </div>
        <GioHangThanhToan
          items={newOrder.items}
          total={newOrderTotal}
          customerType={customerType}
          onRemoveItem={handleRemoveItem}
          onCancel={() => navigate("/admin/QuanLyDonHang")}
          onSubmitOrder={handleSubmitOrder}
        />
      </div>
    </AdminLayout>
  );
}
