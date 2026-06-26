import React from "react";

export default function ModalHanMuc({
  modal,
  hanMucInput,
  khachChuaMoCongNo,
  submitting,
  onChangeModal,
  onChangeHanMucInput,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            {modal.laMoMoi
              ? "Mở công nợ cho khách mới"
              : `Sửa hạn mức — ${modal.ten}`}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {modal.laMoMoi && (
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
                Chọn khách hàng
              </label>
              <select
                className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                value={modal.idtaikhoan}
                onChange={(e) =>
                  onChangeModal({ ...modal, idtaikhoan: e.target.value })
                }
              >
                <option value="">-- Chọn khách hàng --</option>
                {khachChuaMoCongNo.map((k) => (
                  <option key={k.idtaikhoan} value={k.idtaikhoan}>
                    {k.ho} {k.ten} — {k.email}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Hạn mức tín dụng (đ)
            </label>
            <input
              type="number"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
              value={hanMucInput}
              onChange={(e) => onChangeHanMucInput(e.target.value)}
              placeholder="Ví dụ: 5000000"
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
            {submitting ? "Đang xử lý..." : "Lưu"}
          </button>
        </div>
      </div>
    </div>
  );
}
