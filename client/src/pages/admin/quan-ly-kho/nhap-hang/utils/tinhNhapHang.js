export const layLoaiCaTuKho = (inventory) =>
  inventory.reduce((acc, item) => {
    if (!acc.some((f) => f.id === item.idLoaiCa)) {
      acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
    }
    return acc;
  }, []);

export const laySizeTheoLoaiCa = (inventory, idLoaiCa) =>
  idLoaiCa
    ? inventory
        .filter((item) => item.idLoaiCa == idLoaiCa)
        .map((item) => ({ id: item.idSizeCa, sizeca: item.tenSize }))
    : [];

export const tinhTongTienNhap = (addedDetails) =>
  addedDetails.reduce((sum, item) => sum + item.soluongnhap * item.gianhap, 0);

export const tinhTongKhoiLuong = (addedDetails) =>
  addedDetails.reduce((sum, item) => sum + Number(item.soluongnhap), 0);
