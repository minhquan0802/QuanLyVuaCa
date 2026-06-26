import React from "react";
import { ORDER_STATUS } from "../constants";

export default function BoLocDonHang({
  filterStatus,
  onChangeStatus,
  onCreateOrder,
}) {
  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
      <div className="flex flex-wrap gap-1.5 w-full xl:w-auto">
        <button
          onClick={() => onChangeStatus("ALL")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border shadow-2xs ${filterStatus === "ALL" ? "bg-slate-800 text-white border-slate-800" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}
        >
          Tất cả
        </button>
        {Object.keys(ORDER_STATUS).map((status) => {
          const isCurrent = filterStatus === status;
          return (
            <button
              key={status}
              onClick={() => onChangeStatus(status)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 border ${isCurrent ? "bg-white border-cyan-500 text-cyan-700 ring-2 ring-cyan-500/20 shadow-2xs" : "bg-white text-slate-600 border-slate-100 hover:bg-slate-50"}`}
            >
              <span
                className={`size-2 rounded-full ${ORDER_STATUS[status].dot}`}
              ></span>
              {ORDER_STATUS[status].label}
            </button>
          );
        })}
      </div>
      <button
        onClick={onCreateOrder}
        className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md transition-all active:scale-95 text-sm"
      >
        Tạo đơn hàng
      </button>
    </div>
  );
}
