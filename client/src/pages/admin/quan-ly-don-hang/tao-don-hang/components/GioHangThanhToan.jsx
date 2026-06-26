import React from "react";
import { layNhanNutTaoDon } from "../utils/xuLyDonHang";
import { formatCurrency } from "../utils/dinhDangTien";
import BangSanPhamDaChon from "./BangSanPhamDaChon";

export default function GioHangThanhToan({
  items,
  total,
  customerType,
  onRemoveItem,
  onCancel,
  onSubmitOrder,
}) {
  return (
    <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <h4 className="font-bold text-slate-700">Giỏ hàng thanh toán</h4>
        <span className="bg-cyan-50 text-cyan-700 border border-cyan-200 px-3 py-0.5 rounded-md text-xs font-bold">
          {items.length} món
        </span>
      </div>
      <BangSanPhamDaChon items={items} onRemoveItem={onRemoveItem} />
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-slate-500 font-medium">Tổng tiền cần thu:</span>
          <span className="text-2xl font-bold text-cyan-700">
            {formatCurrency(total)}
          </span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
          >
            Hủy
          </button>
          <button
            onClick={onSubmitOrder}
            disabled={items.length === 0}
            className={`flex-1 py-3.5 font-bold rounded-xl text-center ${items.length > 0 ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            {layNhanNutTaoDon(customerType)}
          </button>
        </div>
      </div>
    </div>
  );
}
