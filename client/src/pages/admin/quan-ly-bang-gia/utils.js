export const sapXepBangGia = (list) =>
  [...(list || [])].sort((a, b) => {
    if (a.trangThai === "Đang áp dụng") return -1;
    if (b.trangThai === "Đang áp dụng") return 1;
    return new Date(b.ngayBatDau) - new Date(a.ngayBatDau);
  });

export const locBangGia = (list, searchTerm) =>
  list.filter((item) => {
    const fishName = (item.tenLoaiCa || "").toLowerCase();
    const sizeName = (item.tenSize || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return fishName.includes(search) || sizeName.includes(search);
  });
