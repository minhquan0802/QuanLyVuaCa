import React from "react";
import { LO_TRANG_THAI } from "../constants";

export default function BangLoHangTon({ loading, lots, onThanhLy }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Loại cá</th>
              <th className="p-4">Size</th>
              <th className="p-4">Ngày nhập</th>
              <th className="p-4 text-right">SL nhập (kg)</th>
              <th className="p-4 text-right">Còn lại (kg)</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : lots.length > 0 ? (
              lots.map((lot) => {
                const statusConfig = LO_TRANG_THAI[lot.trangthaica] || {
                  label: lot.trangthaica,
                  badge: "bg-gray-50 text-gray-600 border-slate-200",
                };
                return (
                  <tr
                    key={lot.idchitietphieunhap}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-slate-800">
                      {lot.tenLoaiCa}
                    </td>
                    <td className="p-4">{lot.tenSize}</td>
                    <td className="p-4 text-slate-500">{lot.ngaynhap}</td>
                    <td className="p-4 text-right">{lot.soluongnhap}</td>
                    <td className="p-4 text-right font-bold text-cyan-700">
                      {lot.soluongconlai}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}
                      >
                        {statusConfig.label}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => onThanhLy(lot)}
                        className="px-3.5 py-1.5 bg-red-50 text-red-600 border border-red-200 font-bold rounded-lg text-xs hover:bg-red-100"
                      >
                        Thanh lý
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Không có lô hàng nào còn tồn.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
