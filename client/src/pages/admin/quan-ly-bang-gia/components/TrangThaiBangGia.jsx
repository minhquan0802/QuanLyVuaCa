import React from "react";

export default function TrangThaiBangGia({ status }) {
  if (status === "Đang áp dụng")
    return (
      <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto">
        <span className="size-1.5 rounded-full bg-green-500"></span>Đang áp dụng
      </span>
    );
  if (status === "Sắp áp dụng")
    return (
      <span className="bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto">
        <span className="size-1.5 rounded-full bg-cyan-500"></span>Sắp áp dụng
      </span>
    );
  return (
    <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto">
      <span className="size-1.5 rounded-full bg-slate-400"></span>Đã hết hạn
    </span>
  );
}
