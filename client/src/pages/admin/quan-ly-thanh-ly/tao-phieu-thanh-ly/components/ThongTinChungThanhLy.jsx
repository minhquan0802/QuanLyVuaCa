import React from "react";

export default function ThongTinChungThanhLy({ headerForm, onChangeForm }) {
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
          Lý do thanh lý
        </label>
        <input
          type="text"
          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
          placeholder="Cá chết, hao hụt lúc nhập, sự cố..."
          value={headerForm.lydothanhly}
          onChange={(e) =>
            onChangeForm({ ...headerForm, lydothanhly: e.target.value })
          }
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
          Trạng thái xử lý
        </label>
        <select
          className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
          value={headerForm.trangthai}
          onChange={(e) =>
            onChangeForm({ ...headerForm, trangthai: e.target.value })
          }
        >
          <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
          <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
          Ghi chú
        </label>
        <textarea
          className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
          placeholder="Ghi chú thêm..."
          value={headerForm.ghichu}
          onChange={(e) =>
            onChangeForm({ ...headerForm, ghichu: e.target.value })
          }
        />
      </div>
    </div>
  );
}
