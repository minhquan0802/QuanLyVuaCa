export const layLoaiCaTuKho = (inventory) =>
  inventory.reduce((acc, item) => {
    if (!acc.some((f) => f.id === item.idLoaiCa))
      acc.push({ id: item.idLoaiCa, tenloaica: item.tenLoaiCa });
    return acc;
  }, []);

export const laySizeTheoLoaiCa = (inventory, idloaica) =>
  idloaica
    ? inventory
        .filter((item) => item.idLoaiCa == idloaica)
        .map((item) => ({ id: item.idSizeCa, sizeca: item.tenSize }))
    : [];

export const tinhTongSoLuong = (addedDetails) =>
  addedDetails.reduce((sum, item) => sum + Number(item.soluongthanhly), 0);
export const tinhTongTien = (addedDetails) =>
  addedDetails.reduce(
    (sum, item) => sum + item.soluongthanhly * item.dongia,
    0,
  );
