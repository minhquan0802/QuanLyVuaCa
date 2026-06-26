import React from "react";
import { formatCurrency } from "../utils/dinhDangTien";

export default function FormThemMatHang({
  customerConfirmed,
  fishTypes,
  sizes,
  units,
  currentItem,
  onFishChange,
  onSizeChange,
  onUnitChange,
  onQuantityChange,
  onChangeItem,
  onAddItem,
}) {
  return (
    <div
      className={`space-y-4 ${!customerConfirmed ? "opacity-30 pointer-events-none" : ""}`}
    >
      <span className="text-xs font-bold text-slate-400 uppercase block border-b pb-1">
        2. Thêm mặt hàng
      </span>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">
            Loại cá
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            value={currentItem.fishId}
            onChange={(e) => onFishChange(e.target.value)}
          >
            <option value="">-- Chọn --</option>
            {fishTypes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.tenloaica}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">
            Size
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            value={currentItem.sizeId}
            onChange={(e) => onSizeChange(e.target.value)}
          >
            <option value="">-- Chọn --</option>
            {sizes.map((s) => (
              <option key={s.idsizeca} value={s.idsizeca}>
                {s.sizeca}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-3">
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">
            Đơn vị tính
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            value={currentItem.unitId}
            onChange={(e) => onUnitChange(e.target.value)}
          >
            <option value="">-- Chọn ĐVT --</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.tendvt}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">
              Số lượng
            </label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold"
              value={currentItem.quantity}
              onChange={(e) => onQuantityChange(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 block mb-1">
              Cân nặng (Kg)
            </label>
            <input
              type="number"
              disabled={currentItem.factor > 0}
              className="w-full p-2 border border-slate-200 rounded-lg text-center font-bold bg-white disabled:bg-slate-100"
              value={currentItem.estimatedKg}
              onChange={(e) =>
                onChangeItem({
                  ...currentItem,
                  estimatedKg: parseFloat(e.target.value) || 0,
                })
              }
            />
          </div>
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 block mb-1">
            Đơn giá áp dụng
          </label>
          <div className="p-2 border border-slate-200 rounded-lg bg-slate-100 font-bold text-slate-700">
            {formatCurrency(currentItem.pricePerKg)}
          </div>
        </div>
      </div>

      <button
        onClick={onAddItem}
        className="w-full py-2.5 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700"
      >
        Thêm vào giỏ
      </button>
    </div>
  );
}
