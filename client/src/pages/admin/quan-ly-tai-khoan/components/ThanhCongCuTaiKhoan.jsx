import React from "react";

export default function ThanhCongCuTaiKhoan({
  searchTerm,
  onSearchChange,
  onAddNew,
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div className="relative w-full sm:max-w-md flex items-center">
        <div className="absolute left-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
          🔎
        </div>
        <input
          type="text"
          placeholder="Tìm theo tên, email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white"
        />
      </div>
      <button
        onClick={onAddNew}
        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer"
      >
        Thêm Tài Khoản
      </button>
    </div>
  );
}
