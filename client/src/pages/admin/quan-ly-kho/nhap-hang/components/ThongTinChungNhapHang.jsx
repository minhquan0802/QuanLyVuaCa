import React from "react";

export default function ThongTinChungNhapHang({
  importForm,
  suppliers,
  fishTypes,
  onChangeForm,
  onSelectFish,
}) {
  return (
    <div className="lg:col-span-4 space-y-5 bg-white rounded-2xl ring-1 ring-slate-200 p-5">
      <h4 className="font-bold text-slate-700 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
        <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">
          1
        </span>
        Thông tin chung
      </h4>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
          Nhà cung cấp
        </label>
        <select
          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
          value={importForm.idncc}
          onChange={(e) =>
            onChangeForm({ ...importForm, idncc: e.target.value })
          }
        >
          <option value="">-- Chọn NCC --</option>
          {suppliers.map((s) => (
            <option key={s.idncc || s.id} value={s.idncc || s.id}>
              {s.tenncc}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
          Loại cá nhập
        </label>
        <select
          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
          value={importForm.idloaica}
          onChange={(e) => onSelectFish(e.target.value)}
        >
          <option value="">-- Chọn Loại Cá --</option>
          {fishTypes.map((f) => (
            <option key={f.id} value={f.id}>
              {f.tenloaica}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
            Ngày nhập
          </label>
          <input
            type="date"
            className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none"
            value={importForm.ngaynhap}
            onChange={(e) =>
              onChangeForm({ ...importForm, ngaynhap: e.target.value })
            }
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
            Thanh toán
          </label>
          <select
            className={`w-full p-2.5 border rounded-xl text-sm font-bold outline-none ${importForm.trangthaithanhtoan === "DA_THANH_TOAN" ? "text-green-600 bg-green-50 border-green-200" : "text-orange-600 bg-orange-50 border-orange-200"}`}
            value={importForm.trangthaithanhtoan}
            onChange={(e) =>
              onChangeForm({
                ...importForm,
                trangthaithanhtoan: e.target.value,
              })
            }
          >
            <option value="CHUA_THANH_TOAN">Chưa TT</option>
            <option value="DA_THANH_TOAN">Đã xong</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
          Ghi chú
        </label>
        <textarea
          className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
          placeholder="Ghi chú nhập hàng..."
          value={importForm.ghichu}
          onChange={(e) =>
            onChangeForm({ ...importForm, ghichu: e.target.value })
          }
        />
      </div>
    </div>
  );
}
