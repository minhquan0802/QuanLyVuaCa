import React from "react";
import { NEW_SIZE_SENTINEL } from "../constants";

export default function DanhSachSizeQuyDoi({
  isEditing,
  sizeRows,
  allGlobalSizes,
  onAddRow,
  onRemoveRow,
  onUpdateRow,
}) {
  if (isEditing) return null;
  return (
    <div className="pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-bold text-slate-700">
          Kích cỡ &amp; Quy đổi kg
        </label>
        <span className="text-xs text-slate-400 italic">
          Không bắt buộc, có thể thêm sau
        </span>
      </div>
      <div className="space-y-2">
        {sizeRows.map((row, index) => (
          <div key={index} className="flex gap-2 items-center">
            {row.sizeId === NEW_SIZE_SENTINEL ? (
              <input
                type="text"
                value={row.newSizeName}
                onChange={(e) =>
                  onUpdateRow(index, "newSizeName", e.target.value)
                }
                placeholder="Tên size mới..."
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-cyan-300 focus:border-cyan-500 outline-none"
                autoFocus
              />
            ) : (
              <select
                value={row.sizeId}
                onChange={(e) => onUpdateRow(index, "sizeId", e.target.value)}
                className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 outline-none bg-white"
              >
                <option value="">-- Chọn size --</option>
                {allGlobalSizes.map((s) => (
                  <option key={s.idsizeca} value={s.idsizeca}>
                    {s.sizeca}
                  </option>
                ))}
                <option value={NEW_SIZE_SENTINEL}>+ Tạo size mới...</option>
              </select>
            )}
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={row.kg}
              onChange={(e) => onUpdateRow(index, "kg", e.target.value)}
              placeholder="kg/con"
              className="w-24 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 outline-none text-center"
            />
            {row.sizeId === NEW_SIZE_SENTINEL && (
              <button
                type="button"
                onClick={() => onUpdateRow(index, "sizeId", "")}
                title="Quay về danh sách"
                className="text-xs text-slate-400 hover:text-cyan-600 px-1"
              >
                ←
              </button>
            )}
            {sizeRows.length > 1 && (
              <button
                type="button"
                onClick={() => onRemoveRow(index)}
                className="size-7 flex items-center justify-center rounded-full text-slate-300 hover:text-red-500 hover:bg-red-50 transition-all"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={onAddRow}
        className="mt-3 text-xs text-cyan-600 hover:text-cyan-800 font-bold flex items-center gap-1"
      >
        + Thêm size
      </button>
    </div>
  );
}
