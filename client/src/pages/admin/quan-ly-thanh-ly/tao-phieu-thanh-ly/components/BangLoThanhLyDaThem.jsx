import React from "react";

export default function BangLoThanhLyDaThem({ addedDetails, onRemoveDetail }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase shadow-xs">
          <tr>
            <th className="p-3">Sản phẩm</th>
            <th className="p-3">Lô (ngày nhập)</th>
            <th className="p-3 text-right">SL (kg)</th>
            <th className="p-3 text-right">Đơn giá</th>
            <th className="p-3 text-right">Thành tiền</th>
            <th className="p-3 text-center">Xóa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {addedDetails.map((item) => (
            <tr key={item.idTemp} className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700">
                {item.tenLoaiCa} ({item.tenSize})
              </td>
              <td className="p-3 text-slate-500">{item.ngaynhap}</td>
              <td className="p-3 text-right font-medium">
                {item.soluongthanhly}
              </td>
              <td className="p-3 text-right text-slate-500">
                {Number(item.dongia).toLocaleString()}
              </td>
              <td className="p-3 text-right font-bold text-slate-800">
                {(item.soluongthanhly * item.dongia).toLocaleString()}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onRemoveDetail(item.idTemp)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-md mx-auto flex items-center justify-center"
                >
                  Xóa
                </button>
              </td>
            </tr>
          ))}
          {addedDetails.length === 0 && (
            <tr>
              <td
                colSpan="6"
                className="p-12 text-center text-slate-400 italic"
              >
                Chưa có chi tiết lô hàng nào được thêm.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
