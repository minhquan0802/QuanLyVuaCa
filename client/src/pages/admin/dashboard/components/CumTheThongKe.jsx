import React from "react";
import { formatCurrency } from "../utils";
import TheThongKe from "./TheThongKe";

export default function CumTheThongKe({ stats }) {
  return (
    <div className="flex flex-col gap-4 mb-8 max-w-sm">
      <TheThongKe
        title="Tổng Doanh Thu"
        value={formatCurrency(stats.doanhThu)}
      />
      <TheThongKe
        title="Giá Trị Nhập"
        value={formatCurrency(stats.tongGiaTriNhap)}
        color="text-blue-800"
      />
      <TheThongKe
        title="Giá Trị Hao Hụt"
        value={formatCurrency(stats.tongGiaTriHaoHut)}
        color="text-red-600"
      >
        <p className="text-xs text-red-400 mt-1 font-medium">
          Số lượng: {stats.tongSoLuongHaoHut} kg
        </p>
      </TheThongKe>
      <TheThongKe
        title="Tổng Đơn Hàng"
        value={stats.tongDonHang}
        color="text-purple-800"
      >
        <div className="flex flex-col gap-1 mt-2 text-xs font-semibold">
          <span className="text-green-600">
            Thành công: {stats.donThanhCong}
          </span>
          <span className="text-orange-500">
            Vận chuyển: {stats.donVanChuyen}
          </span>
          <span className="text-red-500">Hủy: {stats.donHuy}</span>
        </div>
      </TheThongKe>
    </div>
  );
}
