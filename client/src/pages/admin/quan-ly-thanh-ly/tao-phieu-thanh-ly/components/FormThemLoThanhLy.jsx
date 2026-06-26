import React from "react";

export default function FormThemLoThanhLy({
  idloaica,
  idsizeca,
  productId,
  fishTypes,
  availableSizes,
  lots,
  currentDetail,
  onSelectFish,
  onSelectSize,
  onChangeDetail,
  onAddDetail,
}) {
  return (
    <div className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-4">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Loại cá
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={idloaica}
            onChange={(e) => onSelectFish(e.target.value)}
          >
            <option value="">-- Chọn Loại Cá --</option>
            {fishTypes.map((f) => (
              <option key={f.id} value={f.id}>
                {f.tenloaica}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-3">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Size
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={idsizeca}
            onChange={(e) => onSelectSize(e.target.value)}
            disabled={!idloaica}
          >
            <option value="">
              {!idloaica ? "Chọn cá trước" : "Chọn Size"}
            </option>
            {availableSizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sizeca}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-5">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Lô hàng
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={currentDetail.idchitietphieunhap}
            onChange={(e) =>
              onChangeDetail({
                ...currentDetail,
                idchitietphieunhap: e.target.value,
              })
            }
            disabled={!productId}
          >
            <option value="">
              {!productId
                ? "Chọn sản phẩm trước"
                : lots.length > 0
                  ? "Chọn lô"
                  : "Không có lô còn hàng"}
            </option>
            {lots.map((l) => (
              <option key={l.idchitietphieunhap} value={l.idchitietphieunhap}>
                Nhập ngày {l.ngaynhap} — còn {l.soluongconlai}kg
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-4">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            SL Thanh Lý (kg)
          </label>
          <input
            type="number"
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={currentDetail.soluongthanhly}
            onChange={(e) =>
              onChangeDetail({
                ...currentDetail,
                soluongthanhly: e.target.value,
              })
            }
          />
        </div>
        <div className="col-span-4">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Đơn giá (0 nếu tiêu hủy)
          </label>
          <input
            type="number"
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={currentDetail.dongia}
            onChange={(e) =>
              onChangeDetail({ ...currentDetail, dongia: e.target.value })
            }
          />
        </div>
        <div className="col-span-4">
          <button
            onClick={onAddDetail}
            className="w-full p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex justify-center items-center gap-1.5 cursor-pointer text-sm font-bold"
          >
            + Thêm dòng
          </button>
        </div>
      </div>
    </div>
  );
}
