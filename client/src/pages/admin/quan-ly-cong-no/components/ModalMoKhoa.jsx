import React from "react";

export default function ModalMoKhoa({
  modal,
  ghiChu,
  submitting,
  onChangeGhiChu,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            Mở khóa đặt hàng — {modal.ten}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Lý do (bắt buộc)
            </label>
            <textarea
              className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
              placeholder="Khách đã hứa thanh toán, trường hợp đặc biệt..."
              value={ghiChu}
              onChange={(e) => onChangeGhiChu(e.target.value)}
            />
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
            className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}
          >
            {submitting ? "Đang xử lý..." : "Xác nhận mở khóa"}
          </button>
        </div>
      </div>
    </div>
  );
}
