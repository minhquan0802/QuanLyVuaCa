import React from "react";

export default function FormThemLoNhap({
  importForm,
  currentDetail,
  availableSizes,
  onSelectSize,
  onChangeDetail,
  onAddDetail,
}) {
  return (
    <div className="p-4 bg-slate-50 border-b border-slate-200">
      <div className="grid grid-cols-12 gap-3 items-end">
        <div className="col-span-3">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Size
          </label>
          <select
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={currentDetail.idsizeca}
            onChange={onSelectSize}
            disabled={!importForm.idloaica}
          >
            <option value="">
              {!importForm.idloaica
                ? "Chọn cá trước"
                : availableSizes.length > 0
                  ? "Chọn Size"
                  : "Chưa có size"}
            </option>
            {availableSizes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.sizeca}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            SL Nhập
          </label>
          <input
            type="number"
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            value={currentDetail.soluongnhap}
            onChange={(e) =>
              onChangeDetail({ ...currentDetail, soluongnhap: e.target.value })
            }
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-slate-500 block mb-1.5">
            Giá Nhập
          </label>
          <input
            type="number"
            className="w-full p-2 border border-slate-200 rounded-lg text-sm bg-white outline-none"
            placeholder="đ"
            value={currentDetail.gianhap}
            onChange={(e) =>
              onChangeDetail({ ...currentDetail, gianhap: e.target.value })
            }
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-cyan-600 block mb-1.5">
            Giá Bán Lẻ
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none"
            placeholder="Dự kiến"
            value={currentDetail.giabanledukien}
            onChange={(e) =>
              onChangeDetail({
                ...currentDetail,
                giabanledukien: e.target.value,
              })
            }
          />
        </div>
        <div className="col-span-2">
          <label className="text-xs font-bold text-cyan-600 block mb-1.5">
            Giá Bán Sỉ
          </label>
          <input
            type="number"
            className="w-full p-2 border rounded-lg text-sm border-cyan-200 bg-cyan-50/50 text-cyan-700 outline-none"
            placeholder="Dự kiến"
            value={currentDetail.giabansidukien}
            onChange={(e) =>
              onChangeDetail({
                ...currentDetail,
                giabansidukien: e.target.value,
              })
            }
          />
        </div>
        <div className="col-span-1">
          <button
            onClick={onAddDetail}
            className="w-full p-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 flex justify-center cursor-pointer"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="size-4.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
