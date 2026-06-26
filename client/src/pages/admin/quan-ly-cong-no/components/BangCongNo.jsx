import React from "react";
import { trangThaiCongNo } from "../utils/trangThaiCongNo";

export default function BangCongNo({
  loading,
  danhSach,
  onSuaHanMuc,
  onDieuChinh,
  onMoKhoa,
  onXemLichSu,
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px] border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4">Khách hàng</th>
              <th className="p-4">SĐT</th>
              <th className="p-4 text-right">Hạn mức</th>
              <th className="p-4 text-right">Công nợ hiện tại</th>
              <th className="p-4">Trạng thái</th>
              <th className="p-4 text-center">Hành động</th>
            </tr>
          </thead>
          <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : danhSach.length > 0 ? (
              danhSach.map((khach) => {
                const trangThai = trangThaiCongNo(khach);
                const congNo = Number(khach.congnohientai || 0);

                return (
                  <tr
                    key={khach.idtaikhoan}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    <td className="p-4">
                      <p className="font-bold text-slate-800">
                        {khach.ho} {khach.ten}
                      </p>
                      <p className="text-xs text-slate-400">{khach.email}</p>
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      {khach.sodienthoai || "-"}
                    </td>
                    <td className="p-4 text-right font-medium">
                      {Number(khach.hanmuctindung).toLocaleString()}đ
                    </td>
                    <td className="p-4 text-right font-bold">
                      {congNo < 0 ? (
                        <span className="text-green-600">
                          {Math.abs(congNo).toLocaleString()}đ (dư trả trước)
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {congNo.toLocaleString()}đ
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${trangThai.badge}`}
                      >
                        {trangThai.label}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-3 flex-wrap">
                        <button
                          onClick={() => onSuaHanMuc(khach)}
                          className="text-cyan-600 font-semibold text-xs hover:underline"
                        >
                          Sửa hạn mức
                        </button>
                        <button
                          onClick={() => onDieuChinh(khach)}
                          className="text-slate-600 font-semibold text-xs hover:underline"
                        >
                          Điều chỉnh nợ
                        </button>
                        {khach.dangBiKhoa && (
                          <button
                            onClick={() => onMoKhoa(khach)}
                            className="text-red-600 font-semibold text-xs hover:underline"
                          >
                            Mở khóa
                          </button>
                        )}
                        <button
                          onClick={() => onXemLichSu(khach)}
                          className="text-slate-400 font-semibold text-xs hover:underline"
                        >
                          Lịch sử
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Chưa có khách hàng nào mở công nợ.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
