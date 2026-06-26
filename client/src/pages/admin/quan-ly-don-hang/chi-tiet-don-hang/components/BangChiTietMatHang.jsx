import React from "react";
import { formatCurrency } from "../utils";

export default function BangChiTietMatHang({
  viewDetails,
  isEditingMode,
  total,
  onWeightChange,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h4 className="font-bold text-slate-800 text-sm">
          Danh sách chi tiết mặt hàng
        </h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[700px] border-collapse">
          <thead className="bg-cyan-50/60 border-b border-slate-200 text-cyan-900 font-bold text-xs uppercase">
            <tr>
              <th className="p-3">Sản phẩm</th>
              <th className="p-3">Size</th>
              <th className="p-3 text-center">SL (Con)</th>
              <th className="p-3 text-center text-slate-400">Dự kiến (Kg)</th>
              <th className="p-3 text-center bg-yellow-50 text-yellow-800 border-x border-slate-200 w-[140px]">
                {isEditingMode ? "✏️ Gõ Số Kg Thật" : "Kg Thực tế"}
              </th>
              <th className="p-3 text-right">Đơn giá</th>
              <th className="p-3 text-right">Thành tiền</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {viewDetails.map((d) => (
              <tr key={d.idchitietdonhang} className="hover:bg-slate-50/30">
                <td className="p-3 font-bold text-slate-700">{d.tenLoaiCa}</td>
                <td className="p-3 text-slate-500 text-xs">{d.tenSize}</td>
                <td className="p-3 text-center font-bold text-slate-800">
                  {d.soluong}
                </td>
                <td className="p-3 text-center text-slate-400 font-medium">
                  {d.soluongkgthuctequydoi} kg
                </td>
                <td
                  className={`p-1 text-center border-x border-slate-200 ${isEditingMode ? "bg-yellow-50/50" : ""}`}
                >
                  {isEditingMode ? (
                    <input
                      type="number"
                      step="0.01"
                      className="w-full text-center font-bold text-cyan-700 bg-white border border-cyan-300 rounded-lg focus:ring-2 focus:ring-cyan-500/20 outline-none py-1 text-sm"
                      value={d.editWeight}
                      onChange={(e) =>
                        onWeightChange(d.idchitietdonhang, e.target.value)
                      }
                    />
                  ) : (
                    <span className="font-bold text-slate-800">
                      {d.soluongkgthucte} kg
                    </span>
                  )}
                </td>
                <td className="p-3 text-right text-slate-400 text-xs">
                  {formatCurrency(d.dongia)}
                </td>
                <td className="p-3 text-right font-bold text-slate-800">
                  {formatCurrency(d.tongtienthucte || d.tongtiendukien)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-50 font-bold border-t border-slate-200">
            <tr>
              <td
                colSpan="6"
                className="p-4 text-right text-slate-500 text-xs uppercase tracking-wider"
              >
                Tổng cộng hóa đơn thực tế:
              </td>
              <td className="p-4 text-right font-black text-cyan-600 text-xl">
                {formatCurrency(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
