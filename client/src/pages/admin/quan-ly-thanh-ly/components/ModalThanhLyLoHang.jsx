import React from "react";

export default function ModalThanhLyLoHang({
  selectedLot,
  form,
  submitting,
  onChangeForm,
  onChangeKieu,
  onClose,
  onSubmit,
}) {
  if (!selectedLot) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-lg text-slate-800">
              Thanh lý lô hàng
            </h3>
            <p className="text-xs text-slate-500">
              {selectedLot.tenLoaiCa} ({selectedLot.tenSize}) — nhập ngày{" "}
              {selectedLot.ngaynhap}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-red-500 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <div className="flex justify-between items-center bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-sm">
            <span className="text-slate-600">Số lượng còn lại trong lô</span>
            <span className="font-bold text-cyan-700 text-lg">
              {selectedLot.soluongconlai} kg
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Phạm vi thanh lý
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onChangeKieu("toanbo")}
                className={`flex-1 p-2.5 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "toanbo" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Toàn bộ lô
              </button>
              <button
                type="button"
                onClick={() => onChangeKieu("motphan")}
                className={`flex-1 p-2.5 rounded-xl border text-sm font-bold transition-colors ${form.kieu === "motphan" ? "bg-cyan-600 text-white border-cyan-600" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
              >
                Một phần
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Số lượng thanh lý (kg)
            </label>
            <input
              type="number"
              disabled={form.kieu === "toanbo"}
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none disabled:bg-slate-100 disabled:text-slate-500"
              value={form.soluongthanhly}
              onChange={(e) =>
                onChangeForm({ ...form, soluongthanhly: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Đơn giá (0 nếu tiêu hủy)
            </label>
            <input
              type="number"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
              value={form.dongia}
              onChange={(e) =>
                onChangeForm({ ...form, dongia: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Trạng thái xử lý
            </label>
            <select
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
              value={form.trangthai}
              onChange={(e) =>
                onChangeForm({ ...form, trangthai: e.target.value })
              }
            >
              <option value="DA_TIEU_HUY">Đã tiêu hủy</option>
              <option value="DA_BAN_THANH_LY">Đã bán thanh lý</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Lý do thanh lý
            </label>
            <input
              type="text"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
              placeholder="Cá chết, hao hụt lúc nhập, sự cố..."
              value={form.lydothanhly}
              onChange={(e) =>
                onChangeForm({ ...form, lydothanhly: e.target.value })
              }
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Ghi chú
            </label>
            <textarea
              className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
              placeholder="Ghi chú thêm..."
              value={form.ghichu}
              onChange={(e) =>
                onChangeForm({ ...form, ghichu: e.target.value })
              }
            />
          </div>

          <div className="flex justify-between items-center bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm">
            <span className="text-slate-500">Thành tiền</span>
            <span className="font-bold text-slate-800 text-lg">
              {(
                Number(form.soluongthanhly || 0) * Number(form.dongia || 0)
              ).toLocaleString()}{" "}
              VNĐ
            </span>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting}
            className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400 cursor-not-allowed" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}
          >
            {submitting ? "Đang xử lý..." : "Xác nhận thanh lý"}
          </button>
        </div>
      </div>
    </div>
  );
}
