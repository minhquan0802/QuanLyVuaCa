export function trangThaiCongNo(khach) {
  if (khach.dangBiKhoa) {
    return {
      label: "Bị khóa",
      badge: "bg-slate-800 text-white border-slate-800",
    };
  }

  const congNo = Number(khach.congnohientai || 0);
  const hanMuc = Number(khach.hanmuctindung || 0);

  if (hanMuc <= 0) {
    return {
      label: "Bình thường",
      badge: "bg-slate-50 text-slate-500 border-slate-200",
    };
  }

  const phanTram = (congNo / hanMuc) * 100;

  if (phanTram >= 100) {
    return {
      label: "Nguy hiểm",
      badge: "bg-red-50 text-red-700 border-red-200",
    };
  }

  if (phanTram >= 80) {
    return {
      label: "Cảnh báo",
      badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
    };
  }

  return {
    label: "Bình thường",
    badge: "bg-green-50 text-green-700 border-green-200",
  };
}
