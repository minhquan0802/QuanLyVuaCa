import React from "react";

export default function FormThemBangGia({
  products,
  formData,
  onChangeForm,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 space-y-5"
    >
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Chọn sản phẩm (Cá + Size)
        </label>
        <select
          required
          className="w-full p-3 border border-slate-200 rounded-xl bg-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none shadow-xs text-sm transition-all"
          value={formData.idchitietcaban}
          onChange={(e) =>
            onChangeForm({ ...formData, idchitietcaban: e.target.value })
          }
        >
          <option value="">-- Chọn sản phẩm --</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.tenLoaiCa} - {p.tenSize} (Mã kho: #{p.id})
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Giá Bán Lẻ
          </label>
          <input
            type="number"
            required
            min="0"
            placeholder="0"
            className="w-full p-3 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
            value={formData.giabanle}
            onChange={(e) =>
              onChangeForm({ ...formData, giabanle: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">
            Giá Bán Sỉ
          </label>
          <input
            type="number"
            required
            min="0"
            placeholder="0"
            className="w-full p-3 border border-slate-200 rounded-xl focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none font-mono font-bold text-slate-700 shadow-xs text-sm transition-all"
            value={formData.gibansi}
            onChange={(e) =>
              onChangeForm({ ...formData, gibansi: e.target.value })
            }
          />
        </div>
      </div>
      <div className="bg-cyan-50/70 p-4 rounded-xl border border-cyan-100 text-sm text-cyan-800 leading-relaxed">
        <strong>Lưu ý:</strong> Giá mới sẽ có hiệu lực ngay từ{" "}
        <strong>Hôm nay</strong>. Nếu sản phẩm này đang có giá cũ, hệ thống sẽ
        tự động đóng lại.
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium text-sm cursor-pointer"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-6 py-3 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 cursor-pointer text-sm"
        >
          Xác nhận & Lưu Giá
        </button>
      </div>
    </form>
  );
}
