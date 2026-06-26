import React from "react";

export default function InputMatKhau({
  isEditing,
  currentUser,
  showPassword,
  onTogglePassword,
  onChangeUser,
}) {
  const placeholder = isEditing
    ? "Để trống nếu không muốn đổi mật khẩu"
    : currentUser.vaitro === "CUSTOMER"
      ? "Mật khẩu tạm thời (tối thiểu 8 ký tự)"
      : "Nhập mật khẩu...";

  return (
    <div className="md:col-span-2">
      <label className="label-text">Mật khẩu</label>
      <div className="relative flex items-center">
        <input
          type={showPassword ? "text" : "password"}
          required={!isEditing}
          className="input-field pr-10"
          value={currentUser.matkhau}
          onChange={(e) =>
            onChangeUser({ ...currentUser, matkhau: e.target.value })
          }
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={onTogglePassword}
          className="absolute right-3 text-slate-400 hover:text-cyan-600 flex items-center cursor-pointer"
        >
          {showPassword ? "Ẩn" : "Hiện"}
        </button>
      </div>
    </div>
  );
}
