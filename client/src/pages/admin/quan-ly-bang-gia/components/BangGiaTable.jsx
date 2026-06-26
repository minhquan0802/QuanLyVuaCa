import React from "react";
import TrangThaiBangGia from "./TrangThaiBangGia";

export default function BangGiaTable({ loading, priceList }) {
  return (
    <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
            <tr>
              <th className="p-4">Sản phẩm</th>
              <th className="p-4">Kích thước</th>
              <th className="p-4 text-right">Giá Bán Lẻ (vnđ)</th>
              <th className="p-4 text-right">Giá Bán Sỉ (vnđ)</th>
              <th className="p-4 text-center">Hiệu lực</th>
              <th className="p-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-6 text-center text-slate-400">
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : priceList.length > 0 ? (
              priceList.map((item) => (
                <tr
                  key={item.id}
                  className={`hover:bg-slate-50/80 transition-colors ${item.trangThai === "Đang áp dụng" ? "bg-cyan-50/10" : ""}`}
                >
                  <td className="p-4 font-bold text-cyan-950">
                    {item.tenLoaiCa}
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 whitespace-nowrap">
                      {item.tenSize}
                    </span>
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-slate-700">
                    {Number(item.giaBanLe).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-4 text-right font-mono font-medium text-slate-700">
                    {Number(item.giaBanSi).toLocaleString("vi-VN")}
                  </td>
                  <td className="p-4 text-center text-xs text-slate-500">
                    <div className="flex flex-col gap-0.5 items-center">
                      <span>
                        Từ:{" "}
                        <span className="font-medium text-slate-700">
                          {new Date(item.ngayBatDau).toLocaleDateString(
                            "vi-VN",
                          )}
                        </span>
                      </span>
                      {item.ngayKetThuc ? (
                        <span>
                          Đến:{" "}
                          <span className="font-medium text-slate-700">
                            {new Date(item.ngayKetThuc).toLocaleDateString(
                              "vi-VN",
                            )}
                          </span>
                        </span>
                      ) : (
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-0.5">
                          Hiện tại
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <TrangThaiBangGia status={item.trangThai} />
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="6"
                  className="p-8 text-center text-slate-400 italic"
                >
                  Không tìm thấy kết quả phù hợp.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
