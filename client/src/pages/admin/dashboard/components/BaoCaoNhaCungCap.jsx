import React from "react";
import { formatCurrency } from "../utils";

export default function BaoCaoNhaCungCap({ supplierReport }) {
  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
      <h3 className="font-bold text-lg text-slate-800 mb-6">
        Nhập theo Nhà cung cấp
      </h3>
      <div className="overflow-y-auto max-h-[350px] pr-2">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
            <tr>
              <th className="py-3 px-2">NCC</th>
              <th className="py-3 px-2 text-right">SL (Kg)</th>
              <th className="py-3 px-2 text-right">Giá trị</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {supplierReport.length > 0 ? (
              supplierReport.map((item, index) => (
                <tr key={index}>
                  <td className="py-3 px-2 font-medium text-slate-700">
                    {item.tenNCC}
                  </td>
                  <td className="py-3 px-2 text-right text-blue-600 font-bold">
                    {item.soLuong}
                  </td>
                  <td className="py-3 px-2 text-right text-slate-600">
                    {formatCurrency(item.giaTri)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="3" className="text-center py-4 text-slate-400">
                  Không có dữ liệu nhập
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
