import React from "react";
import { getRoleName } from "../utils";
import TrangThaiTaiKhoan from "./TrangThaiTaiKhoan";

export default function BangTaiKhoan({ loading, accounts, onApprove, onEdit }) {
  return (
    <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[850px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Họ và Tên</th>
              <th className="p-4">Email</th>
              <th className="p-4">SĐT</th>
              <th className="p-4">Vai Trò</th>
              <th className="p-4">Trạng Thái</th>
              <th className="p-4 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : accounts.length > 0 ? (
              accounts.map((item) => (
                <tr
                  key={item.idtaikhoan}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 font-bold text-cyan-950">
                    {item.ho} {item.ten}
                  </td>
                  <td className="p-4 text-slate-600">{item.email}</td>
                  <td className="p-4 font-mono text-slate-500">
                    {item.sodienthoai || "-"}
                  </td>
                  <td className="p-4 text-slate-700 font-medium">
                    {getRoleName(item.vaitro)}
                  </td>
                  <td className="p-4">
                    <TrangThaiTaiKhoan trangthai={item.trangthaitk} />
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-3">
                      {item.trangthaitk === "CHO_DUYET" && (
                        <button
                          onClick={() => onApprove(item)}
                          className="text-green-600 font-semibold text-xs hover:underline cursor-pointer"
                        >
                          Duyệt
                        </button>
                      )}
                      <button
                        onClick={() => onEdit(item)}
                        className="text-cyan-600 font-semibold text-xs hover:underline cursor-pointer"
                      >
                        Sửa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Không tìm thấy tài khoản nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
