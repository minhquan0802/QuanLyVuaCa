import React from "react";
import { LOAI_THAY_DOI_LABEL } from "../constants";

export default function ModalLichSuCongNo({
  modal,
  loading,
  lichSuData,
  onClose,
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            Lịch sử công nợ — {modal.ten}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase sticky top-0">
              <tr>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Loại</th>
                <th className="p-3 text-right">Số tiền</th>
                <th className="p-3 text-right">Số dư sau</th>
                <th className="p-3">Người thực hiện</th>
                <th className="p-3">Ghi chú</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400">
                    Đang tải...
                  </td>
                </tr>
              ) : lichSuData.length > 0 ? (
                lichSuData.map((ls) => (
                  <tr key={ls.idlichsucongno} className="hover:bg-slate-50/50">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(ls.ngaytao).toLocaleString("vi-VN")}
                    </td>
                    <td className="p-3 font-bold">
                      {LOAI_THAY_DOI_LABEL[ls.loaithaydoi] || ls.loaithaydoi}
                    </td>
                    <td className="p-3 text-right">
                      {Number(ls.sotien).toLocaleString()}đ
                    </td>
                    <td className="p-3 text-right font-bold">
                      {Number(ls.sodusaukhithaydoi).toLocaleString()}đ
                    </td>
                    <td className="p-3 text-slate-500">
                      {ls.tenNguoiThucHien || "Hệ thống"}
                    </td>
                    <td className="p-3 text-slate-500">{ls.ghichu || "-"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan="6"
                    className="p-8 text-center text-slate-400 italic"
                  >
                    Chưa có biến động nào.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
