import React from "react";

export default function BangKhoHang({ loading, inventory, onImport }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
          <tr>
            <th className="p-4">Tên sản phẩm</th>
            <th className="p-4">Size</th>
            <th className="p-4 text-center">Tồn kho</th>
            <th className="p-4 text-center"></th>
          </tr>
        </thead>
        <tbody className="text-sm divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan="4" className="p-8 text-center text-slate-400">
                Đang tải...
              </td>
            </tr>
          ) : (
            inventory.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">
                  {item.tenLoaiCa}
                </td>
                <td className="p-4 text-slate-600">{item.tenSize}</td>
                <td className="p-4 text-center font-bold text-cyan-600">
                  {item.soluongton} kg
                </td>
                <td className="p-4 text-center">
                  <button
                    onClick={() => onImport(item)}
                    className="px-3 py-1.5 bg-cyan-50 text-cyan-700 rounded-lg font-medium text-xs hover:bg-cyan-100"
                  >
                    Nhập hàng
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
