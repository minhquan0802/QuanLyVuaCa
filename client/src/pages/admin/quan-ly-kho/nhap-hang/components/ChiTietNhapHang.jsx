import React from "react";
import { tinhTongKhoiLuong, tinhTongTienNhap } from "../utils/tinhNhapHang";
import BangLoNhapDaThem from "./BangLoNhapDaThem";
import FormThemLoNhap from "./FormThemLoNhap";

export default function ChiTietNhapHang({
  importForm,
  currentDetail,
  availableSizes,
  addedDetails,
  onSelectSize,
  onChangeDetail,
  onAddDetail,
  onRemoveDetail,
  onCancel,
  onSubmit,
}) {
  return (
    <div className="lg:col-span-8 flex flex-col bg-white rounded-2xl ring-1 ring-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h4 className="font-bold text-slate-700 text-sm flex items-center gap-2">
          <span className="size-5 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold text-xs">
            2
          </span>
          Phân Bổ Chi Tiết (Lô)
        </h4>
        <div className="text-sm font-bold text-cyan-700 bg-cyan-50 px-3 py-1.5 rounded-lg border border-cyan-100">
          Tổng:{" "}
          <span className="text-lg ml-1">
            {tinhTongKhoiLuong(addedDetails)}
          </span>{" "}
          kg
        </div>
      </div>

      <FormThemLoNhap
        importForm={importForm}
        currentDetail={currentDetail}
        availableSizes={availableSizes}
        onSelectSize={onSelectSize}
        onChangeDetail={onChangeDetail}
        onAddDetail={onAddDetail}
      />

      <BangLoNhapDaThem
        addedDetails={addedDetails}
        onRemoveDetail={onRemoveDetail}
      />

      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="text-slate-500 font-medium text-sm">
          Tổng tiền nhập phiếu:{" "}
          <span className="text-xl font-bold text-slate-800 ml-1">
            {tinhTongTienNhap(addedDetails).toLocaleString()} VNĐ
          </span>
        </div>
        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm"
          >
            Hủy
          </button>
          <button
            onClick={onSubmit}
            disabled={addedDetails.length === 0}
            className={`px-6 py-3 font-bold rounded-xl shadow-md text-sm ${addedDetails.length > 0 ? "bg-cyan-600 text-white hover:bg-cyan-700" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            Hoàn tất nhập kho
          </button>
        </div>
      </div>
    </div>
  );
}
