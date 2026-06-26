import React from "react";

export default function BangLoNhapDaThem({ addedDetails, onRemoveDetail }) {
  return (
    <div className="flex-1 overflow-y-auto">
      <table className="w-full text-sm text-left">
        <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase shadow-xs">
          <tr>
            <th className="p-3">Size</th>
            <th className="p-3 text-right">SL (kg)</th>
            <th className="p-3 text-right">Giá nhập</th>
            <th className="p-3 text-right">Thành tiền</th>
            <th className="p-3 text-right text-cyan-600">Giá Bán Lẻ</th>
            <th className="p-3 text-right text-cyan-600">Giá Bán Sỉ</th>
            <th className="p-3 text-center">Xóa</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {addedDetails.map((item) => (
            <tr key={item.idTemp} className="hover:bg-slate-50/50">
              <td className="p-3 font-bold text-slate-700">{item.sizeName}</td>
              <td className="p-3 text-right font-medium">{item.soluongnhap}</td>
              <td className="p-3 text-right text-slate-500">
                {Number(item.gianhap).toLocaleString()}
              </td>
              <td className="p-3 text-right font-bold text-slate-800">
                {(item.soluongnhap * item.gianhap).toLocaleString()}
              </td>
              <td className="p-3 text-right text-cyan-600 font-bold">
                {Number(item.giabanledukien).toLocaleString()}
              </td>
              <td className="p-3 text-right text-cyan-600 font-bold">
                {Number(item.giabansidukien).toLocaleString()}
              </td>
              <td className="p-3 text-center">
                <button
                  onClick={() => onRemoveDetail(item.idTemp)}
                  className="text-slate-400 hover:text-red-600 p-1.5 rounded-md mx-auto flex items-center justify-center"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="size-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m14.74 9-.34 6m-4.74 0-.34-6M4.5 6.75h15m-1.5 0a2.25 2.25 0 0 1-2.25 2.25h-7.5a2.25 2.25 0 0 1-2.25-2.25"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
          {addedDetails.length === 0 && (
            <tr>
              <td
                colSpan="7"
                className="p-12 text-center text-slate-400 italic"
              >
                Chưa có chi tiết lô hàng nào được phân bổ.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
