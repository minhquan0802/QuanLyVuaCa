import React from "react";
import { ORDER_STATUS } from "../constants";

export default function BangDonHang({ loading, orders, onOpenOrder }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[800px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Mã Đơn</th>
              <th className="p-4">Khách Hàng</th>
              <th className="p-4">Ngày Đặt</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : orders.length > 0 ? (
              orders.map((item) => {
                const statusConfig = ORDER_STATUS[item.trangthaidonhang] || {
                  label: item.trangthaidonhang,
                  badge: "bg-gray-50 text-gray-600 border-slate-200",
                };
                return (
                  <tr
                    key={item.iddonhang}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 font-mono font-medium text-cyan-700">
                      #{item.iddonhang.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {item.tenKhachHang || "Khách vãng lai"}
                    </td>
                    <td className="p-4 text-slate-500">
                      {new Date(item.ngaydat).toLocaleString("vi-VN")}
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
                        onClick={() => onOpenOrder(item)}
                        className="px-4 py-2 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs"
                      >
                        Xử lý đơn
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Không tìm thấy đơn hàng nào phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
