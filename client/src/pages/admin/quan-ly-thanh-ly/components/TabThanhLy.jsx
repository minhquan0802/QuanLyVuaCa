import React from "react";

export default function TabThanhLy({ tab, onChangeTab }) {
  return (
    <div className="inline-flex bg-slate-100 rounded-xl p-1 mb-5">
      <button
        onClick={() => onChangeTab("lo")}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "lo" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
        Lô hàng tồn
      </button>
      <button
        onClick={() => onChangeTab("phieu")}
        className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${tab === "phieu" ? "bg-white text-cyan-700 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
      >
        Phiếu thanh lý đã lập
      </button>
    </div>
  );
}
