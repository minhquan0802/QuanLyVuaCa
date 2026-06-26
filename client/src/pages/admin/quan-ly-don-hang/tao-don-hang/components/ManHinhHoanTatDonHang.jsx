import React from "react";
import { formatCurrency } from "../utils/dinhDangTien.js";
import { laKhachSi } from "../utils/xuLyDonHang.js";

export default function ManHinhHoanTatDonHang({
  customerType,
  completedOrderTotal,
  onGoToOrderManagement,
}) {
  const isSi = laKhachSi(customerType);

  return (
    <div className="max-w-sm mx-auto bg-white rounded-2xl border border-slate-200 text-center p-6">
      <h3 className="font-bold text-lg text-emerald-700">
        {isSi ? "Đặt đơn hàng thành công!" : "Đơn hàng thành công!"}
      </h3>
      <p className="text-sm text-slate-600 font-semibold mt-2">
        {isSi ? "Tổng tiền đơn hàng: " : "Tổng thu: "}
        {formatCurrency(completedOrderTotal)}
      </p>
      {isSi ? (
        <>
          <p className="text-xs text-slate-400 mt-2">
            Đơn đã chuyển sang "Đang đóng hàng" — khách thanh toán sau.
          </p>
          <button
            onClick={onGoToOrderManagement}
            className="w-full mt-6 p-4 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700"
          >
            Về Quản lý Đơn hàng
          </button>
        </>
      ) : (
        <div className="grid grid-cols-2 gap-4 my-6">
          <button
            onClick={onGoToOrderManagement}
            className="p-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-sm"
          >
            Tiền mặt
          </button>
          <button
            onClick={onGoToOrderManagement}
            className="p-4 rounded-xl border border-slate-200 font-bold hover:bg-slate-50 text-sm"
          >
            Quét QR
          </button>
        </div>
      )}
    </div>
  );
}
