import React from "react";

export default function BangLoaiCa({
  loading,
  categories,
  onEdit,
  onOpenSize,
}) {
  return (
    <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[750px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
            <tr>
              <th className="p-4 w-20 text-center">ID</th>
              <th className="p-4 w-24">Hình ảnh</th>
              <th className="p-4">Tên Loại Cá</th>
              <th className="p-4">Miêu tả</th>
              <th className="p-4 text-center w-40">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : categories.length > 0 ? (
              categories.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="p-4 text-center font-mono text-slate-400">
                    #{item.id}
                  </td>
                  <td className="p-4">
                    <div className="size-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
                      <img
                        src={item.hinhanhurl}
                        className="w-full h-full object-cover"
                        alt={item.tenloaica}
                        onError={(e) => {
                          e.target.src =
                            "https://placehold.co/100x100?text=Error";
                        }}
                      />
                    </div>
                  </td>
                  <td className="p-4 font-bold text-cyan-950">
                    {item.tenloaica}
                  </td>
                  <td className="p-4 text-slate-500 max-w-xs truncate">
                    {item.mieuta || "---"}
                  </td>
                  <td className="p-4 flex items-center justify-center gap-3">
                    <button
                      onClick={() => onOpenSize(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer"
                    >
                      Kích cỡ
                    </button>
                    <button
                      onClick={() => onEdit(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 transition-colors text-xs cursor-pointer"
                    >
                      Sửa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="5"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Không tìm thấy loại cá nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
