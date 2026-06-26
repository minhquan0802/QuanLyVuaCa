import React from "react";
import { formatCurrency } from "../utils/dinhDangTien.js";

export default function BangSanPhamDaChon({ items, onRemoveItem }) {
  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-100 border-b border-slate-200 text-xs font-bold uppercase text-slate-500">
          <tr>
            <th className="p-3">Sản phẩm</th>
            <th className="p-3">ĐVT</th>
            <th className="p-3 text-center">SL</th>
            <th className="p-3 text-center">Tổng Kg</th>
            <th className="p-3 text-right">Giá/Kg</th>
            <th className="p-3 text-right">Thành tiền</th>
            <th className="p-3 text-center">Xóa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50/50">
              <td className="p-3">
                <div className="font-bold text-slate-700">{item.fishName}</div>
                <div className="text-xs text-slate-400">{item.sizeName}</div>
              </td>
              <td className="p-3 font-medium text-slate-600">
                {item.unitName}
              </td>
              <td className="p-3 text-center font-bold">{item.quantity}</td>
              <td className="p-3 text-center text-cyan-600 font-bold">
                {item.estimatedKg} kg
              </td>
              <td className="p-3 text-right text-slate-500">
                {formatCurrency(item.pricePerKg)}
              </td>
              <td className="p-3 text-right font-bold text-slate-900">
                {formatCurrency(item.total)}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-500 font-bold hover:text-red-700"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr>
              <td
                colSpan="7"
                className="p-12 text-center text-slate-400 italic"
              >
                Giỏ hàng đang trống.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
