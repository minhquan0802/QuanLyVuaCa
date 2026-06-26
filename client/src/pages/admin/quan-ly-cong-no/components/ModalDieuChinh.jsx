import React from "react";

export default function ModalDieuChinh({
  modal,
  form,
  submitting,
  onChangeForm,
  onClose,
  onSubmit,
}) {
  if (!modal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="font-bold text-lg text-slate-800">
            Điều chỉnh công nợ — {modal.ten}
          </h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex gap-2">
            <button
              onClick={() => onChangeForm({ ...form, tang: true })}
              className={`flex-1 p-2.5 rounded-xl border text-sm font-bold ${form.tang ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-600"}`}
            >
              Cộng nợ
            </button>
            <button
              onClick={() => onChangeForm({ ...form, tang: false })}
              className={`flex-1 p-2.5 rounded-xl border text-sm font-bold ${!form.tang ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-600"}`}
            >
              Trừ nợ
            </button>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Số tiền (đ)
            </label>
            <input
              type="number"
              className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
              value={form.sotien}
              onChange={(e) =>
                onChangeForm({ ...form, sotien: e.target.value })
              }
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">
              Lý do (bắt buộc)
            </label>
            <textarea
              className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
              placeholder="Chiết khấu cuối tháng, bồi thường, làm tròn số lẻ..."
              value={form.ghichu}
              onChange={(e) =>
                onChangeForm({ ...form, ghichu: e.target.value })
              }
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
            {submitting ? "Đang xử lý..." : "Xác nhận"}
          </button>
        </div>
      </div>
    </div>
  );
}
