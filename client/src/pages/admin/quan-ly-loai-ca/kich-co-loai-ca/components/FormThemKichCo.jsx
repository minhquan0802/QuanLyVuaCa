import React from "react";

export default function FormThemKichCo({
  isCreatingNew,
  newSizeName,
  selectedSizeId,
  allGlobalSizes,
  sokgtuongung,
  onChangeNewSizeName,
  onChangeSelectedSizeId,
  onChangeKg,
  onAddSize,
  onToggleCreateNew,
}) {
  return (
    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70 space-y-3">
      <label className="block text-xs font-bold text-slate-500 uppercase">
        Thêm size áp dụng
      </label>
      <div className="flex gap-2">
        {isCreatingNew ? (
          <input
            type="text"
            value={newSizeName}
            onChange={(e) => onChangeNewSizeName(e.target.value)}
            placeholder="VD: Size 2-3kg, Lớn..."
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-cyan-300 focus:ring-2 focus:ring-cyan-200 bg-white outline-none font-medium"
            autoFocus
          />
        ) : (
          <select
            className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 outline-none bg-white font-medium"
            value={selectedSizeId}
            onChange={(e) => onChangeSelectedSizeId(e.target.value)}
          >
            <option value="">-- Chọn kích cỡ --</option>
            {allGlobalSizes.map((size) => (
              <option key={size.idsizeca} value={size.idsizeca}>
                {size.sizeca}
              </option>
            ))}
          </select>
        )}
      </div>
      <div>
        <label className="text-xs text-slate-500 mb-1 block font-medium">
          Số kg quy đổi mỗi con/bao <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          step="0.01"
          min="0.01"
          value={sokgtuongung}
          onChange={(e) => onChangeKg(e.target.value)}
          placeholder="VD: 0.5 → mỗi con quy đổi = 0.5 kg"
          className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100 outline-none bg-white"
        />
      </div>
      <button
        onClick={onAddSize}
        className="w-full py-2 bg-cyan-600 text-white rounded-lg font-bold hover:bg-cyan-700 shadow-xs text-sm cursor-pointer"
      >
        {isCreatingNew ? "Lưu lại" : "Áp dụng"}
      </button>
      <div className="text-center">
        {isCreatingNew ? (
          <button
            onClick={() => onToggleCreateNew(false)}
            className="text-xs text-slate-500 hover:text-cyan-600 underline cursor-pointer"
          >
            « Quay lại danh mục có sẵn
          </button>
        ) : (
          <div className="flex items-center justify-center gap-1 text-xs text-slate-400 font-medium">
            <span>Kích thước bạn cần chưa tồn tại?</span>
            <button
              onClick={() => onToggleCreateNew(true)}
              className="font-bold text-cyan-600 hover:text-cyan-800 underline cursor-pointer"
            >
              Tạo mới
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
