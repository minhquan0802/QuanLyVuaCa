import React from "react";

export default function FormThongTinLoaiCa({
  currentCategory,
  imagePreview,
  isEditing,
  fileInputRef,
  onFileChange,
  onChangeCategory,
}) {
  return (
    <>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Tên loại cá <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          required
          value={currentCategory.tenloaica}
          onChange={(e) =>
            onChangeCategory({ ...currentCategory, tenloaica: e.target.value })
          }
          className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all bg-white"
          placeholder="VD: Cá Trắm, Cá Basa..."
        />
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Hình ảnh minh họa
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="hidden"
        />
        <div
          onClick={() => fileInputRef.current?.click()}
          className="relative w-full h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center cursor-pointer hover:border-cyan-400 hover:bg-cyan-50/10 transition-all overflow-hidden group"
        >
          {imagePreview || (isEditing && currentCategory.hinhanhurl) ? (
            <>
              <img
                src={imagePreview || currentCategory.hinhanhurl}
                alt="preview"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  Thay đổi ảnh
                </span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-slate-400 pointer-events-none text-center px-4">
              <p className="text-sm font-bold">Click để tải ảnh lên</p>
              <p className="text-xs">Định dạng hỗ trợ: JPG, PNG, WEBP</p>
            </div>
          )}
        </div>
      </div>
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-1.5">
          Miêu tả ngắn
        </label>
        <textarea
          rows="3"
          value={currentCategory.mieuta || ""}
          onChange={(e) =>
            onChangeCategory({ ...currentCategory, mieuta: e.target.value })
          }
          className="w-full px-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-cyan-500 outline-none resize-none bg-white"
          placeholder="Thông tin chi tiết về loại cá..."
        />
      </div>
    </>
  );
}
