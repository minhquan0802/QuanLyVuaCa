import React from "react";
import { THANH_LY_STATUS } from "../constants";
import {
  tenSanPham,
  tinhTongSoLuong,
  tinhTongTien,
} from "../utils/tinhThanhLy";

export default function BangPhieuThanhLy({ loading, phieus }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[900px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Ngày thanh lý</th>
              <th className="p-4">Người tạo</th>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Lý do</th>
              <th className="p-4 text-right">Tổng SL (kg)</th>
              <th className="p-4 text-right">Tổng tiền</th>
              <th className="p-4">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="7" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : phieus.length > 0 ? (
              phieus.map((item) => {
                const statusConfig = THANH_LY_STATUS[item.trangthai] || {
                  label: item.trangthai,
                  badge: "bg-gray-50 text-gray-600 border-slate-200",
                };
                return (
                  <tr
                    key={item.idphieuthanhly}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4 text-slate-500">
                      {new Date(item.ngaythanhly).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {item.tenNguoiTaoPhieu}
                    </td>
                    <td className="p-4">{tenSanPham(item.listChiTiet)}</td>
                    <td className="p-4">{item.lydothanhly}</td>
                    <td className="p-4 text-right font-medium">
                      {tinhTongSoLuong(item.listChiTiet)}
                    </td>
                    <td className="p-4 text-right font-bold text-slate-800">
                      {tinhTongTien(item.listChiTiet).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${statusConfig.badge}`}
                      >
                        {statusConfig.label}
                      </span>
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
                  Chưa có phiếu thanh lý nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
