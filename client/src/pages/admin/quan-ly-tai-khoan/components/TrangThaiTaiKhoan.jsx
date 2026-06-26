import React from "react";

export default function TrangThaiTaiKhoan({ trangthai }) {
  if (trangthai === "HOAT_DONG")
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-green-50 text-green-700 border-green-200">
        <span className="size-1.5 rounded-full bg-green-500"></span>Hoạt động
      </span>
    );
  if (trangthai === "KHOA")
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-red-50 text-red-700 border-red-200">
        <span className="size-1.5 rounded-full bg-red-500"></span>Đã khóa
      </span>
    );
  if (trangthai === "CHO_DUYET")
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-yellow-50 text-yellow-700 border-yellow-200">
        <span className="size-1.5 rounded-full bg-yellow-500"></span>Chờ duyệt
      </span>
    );
  if (trangthai === "CHO_XAC_THUC_EMAIL")
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 w-fit bg-slate-50 text-slate-500 border-slate-200">
        <span className="size-1.5 rounded-full bg-slate-400"></span>Chờ xác thực
        email
      </span>
    );
  return <span className="text-xs text-slate-400">{trangthai || "-"}</span>;
}
