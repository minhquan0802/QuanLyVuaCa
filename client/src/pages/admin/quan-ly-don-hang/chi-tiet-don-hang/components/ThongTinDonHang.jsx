import React from "react";

export default function ThongTinDonHang({
  order,
  statusConfig,
  isEditingMode,
  isEdited,
  onSaveRealWeight,
  onUpdateStatus,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs">
        <h4 className="font-bold mb-2.5 text-cyan-900 uppercase text-xs tracking-wider">
          Thông tin người mua
        </h4>
        <p className="text-slate-600 text-sm">
          <span className="font-medium text-slate-400">Họ tên:</span>{" "}
          {order.tenKhachHang || "Khách lẻ vãng lai"}
        </p>
        <p className="text-slate-600 text-sm mt-1">
          <span className="font-medium text-slate-400">SĐT:</span>{" "}
          {order.sdtKhachHang || "..."}
        </p>
      </div>
      <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-bold text-slate-500 uppercase">
            Trạng thái:
          </span>
          <span
            className={`px-2.5 py-1 rounded-md text-xs font-bold border ${statusConfig.color}`}
          >
            {statusConfig.label}
          </span>
        </div>
        {isEditingMode && (
          <button
            onClick={onSaveRealWeight}
            disabled={!isEdited}
            className={`w-full py-2 rounded-lg font-bold text-xs mb-3 ${isEdited ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-sm cursor-pointer" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
          >
            {isEdited ? "Xác nhận & Lưu Kg thực tế" : "Cân nặng đã đồng bộ"}
          </button>
        )}
        <div className="flex gap-2 flex-wrap">
          {order.trangthaidonhang === "CHO_XAC_NHAN" && (
            <button
              onClick={() => onUpdateStatus("DANG_DONG_HANG")}
              className="flex-1 py-1.5 bg-cyan-600 text-white rounded-lg font-bold text-xs hover:bg-cyan-700 cursor-pointer"
            >
              Bắt đầu đóng hàng
            </button>
          )}
          {order.trangthaidonhang === "DANG_DONG_HANG" && (
            <button
              onClick={() => onUpdateStatus("DANG_VAN_CHUYEN")}
              className="flex-1 py-1.5 bg-purple-600 text-white rounded-lg font-bold text-xs hover:bg-purple-700 cursor-pointer"
            >
              Giao đơn vị vận chuyển
            </button>
          )}
          {order.trangthaidonhang === "DANG_VAN_CHUYEN" && (
            <button
              onClick={() => onUpdateStatus("GIAO_HANG_THANH_CONG")}
              className="flex-1 py-1.5 bg-green-600 text-white rounded-lg font-bold text-xs hover:bg-green-700 cursor-pointer"
            >
              Xác nhận giao thành công
            </button>
          )}
          {["CHO_XAC_NHAN", "DANG_DONG_HANG"].includes(
            order.trangthaidonhang,
          ) && (
            <button
              onClick={() => onUpdateStatus("HUY")}
              className="px-4 py-1.5 border border-red-200 text-red-600 rounded-lg font-bold text-xs hover:bg-red-50 cursor-pointer"
            >
              Hủy đơn
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
