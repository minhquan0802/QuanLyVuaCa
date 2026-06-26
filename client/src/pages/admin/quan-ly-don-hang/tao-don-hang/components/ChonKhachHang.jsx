import React from "react";

export default function ChonKhachHang({
  customerType,
  customerConfirmed,
  customers,
  newOrder,
  onChangeCustomerType,
  onChangeOrder,
  onConfirmCustomer,
}) {
  return (
    <div className="space-y-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
      <span className="text-xs font-bold text-slate-400 uppercase">
        1. Chọn loại khách
      </span>
      <div className="flex gap-4">
        <label className="flex items-center gap-1.5 font-medium">
          <input
            type="radio"
            checked={customerType === "LE"}
            disabled={customerConfirmed}
            onChange={() => onChangeCustomerType("LE")}
          />{" "}
          Khách lẻ
        </label>
        <label className="flex items-center gap-1.5 font-medium">
          <input
            type="radio"
            checked={customerType === "SI"}
            disabled={customerConfirmed}
            onChange={() => onChangeCustomerType("SI")}
          />{" "}
          Khách sỉ
        </label>
      </div>

      {customerType === "LE" ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Tên khách hàng"
            disabled={customerConfirmed}
            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            value={newOrder.tenKhachLe}
            onChange={(e) =>
              onChangeOrder({ ...newOrder, tenKhachLe: e.target.value })
            }
          />
          <input
            type="text"
            placeholder="Số điện thoại"
            disabled={customerConfirmed}
            className="w-full p-2 border border-slate-200 rounded-lg bg-white"
            value={newOrder.sdtKhachLe}
            onChange={(e) =>
              onChangeOrder({ ...newOrder, sdtKhachLe: e.target.value })
            }
          />
        </div>
      ) : (
        <select
          className="w-full p-2 border border-slate-200 rounded-lg bg-white"
          disabled={customerConfirmed}
          value={newOrder.idthongtinkhachhang}
          onChange={(e) =>
            onChangeOrder({ ...newOrder, idthongtinkhachhang: e.target.value })
          }
        >
          <option value="">-- Chọn khách sỉ từ hệ thống --</option>
          {customers.map((c) => (
            <option key={c.idtaikhoan} value={c.idtaikhoan}>
              {c.ho} {c.ten} ({c.sodienthoai || "Trống số"})
            </option>
          ))}
        </select>
      )}

      {!customerConfirmed ? (
        <button
          onClick={onConfirmCustomer}
          className="w-full py-2 bg-cyan-600 text-white font-bold rounded-lg text-xs"
        >
          Xác nhận khách hàng
        </button>
      ) : (
        <div className="text-center text-xs text-green-700 bg-green-50 py-1.5 border border-green-200 rounded-lg font-bold">
          Đã khóa
        </div>
      )}
    </div>
  );
}
