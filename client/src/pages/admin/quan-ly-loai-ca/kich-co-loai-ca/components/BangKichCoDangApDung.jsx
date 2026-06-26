import React from "react";

export default function BangKichCoDangApDung({
  fishInventory,
  quydois,
  editingKg,
  onChangeEditingKg,
  onSaveKg,
  onDeleteSize,
}) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-400 uppercase mb-2.5">
        Các size đang áp dụng thực tế
      </label>
      {fishInventory.length > 0 ? (
        <table className="w-full text-sm border border-slate-100 rounded-xl overflow-hidden">
          <thead className="bg-slate-50 text-xs text-slate-400 uppercase">
            <tr>
              <th className="text-left px-3 py-2 font-medium">Size</th>
              <th className="text-center px-3 py-2 font-medium">
                Kg quy đổi / con
              </th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {fishInventory.map((item) => {
              const quy = quydois.find((q) => q.idchitietcaban === item.id);
              return (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 font-bold text-slate-700">
                    {item.tenSize}
                  </td>
                  <td className="px-3 py-2 text-center">
                    {quy ? (
                      <span className="text-cyan-700 font-bold">
                        {quy.sokgtuongung} kg
                      </span>
                    ) : (
                      <div className="flex items-center gap-1.5 justify-center">
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editingKg[item.id] || ""}
                          onChange={(e) =>
                            onChangeEditingKg((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="0.00"
                          className="w-20 px-2 py-1 text-xs rounded border border-orange-300 focus:border-orange-500 outline-none text-center"
                        />
                        <button
                          onClick={() => onSaveKg(item.id)}
                          className="px-2 py-1 bg-orange-500 text-white text-xs rounded font-bold hover:bg-orange-600 cursor-pointer whitespace-nowrap"
                        >
                          Lưu
                        </button>
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2.5 text-right">
                    <button
                      onClick={() => onDeleteSize(item.id)}
                      className="size-6 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <div className="text-center py-6 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <p className="text-xs font-semibold text-slate-400">
            Chưa liên kết size nào.
          </p>
        </div>
      )}
    </div>
  );
}
