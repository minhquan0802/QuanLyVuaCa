import React from "react";
import { ROLES } from "../constants";
import InputMatKhau from "./InputMatKhau";
import ThongBaoMatKhauKhachHang from "./ThongBaoMatKhauKhachHang";

export default function FormTaiKhoan({
  isEditing,
  currentUser,
  showPassword,
  onChangeUser,
  onTogglePassword,
  onSubmit,
  onCancel,
}) {
  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
    >
      <div>
        <label className="label-text">Họ</label>
        <input
          type="text"
          required
          className="input-field"
          value={currentUser.ho}
          onChange={(e) => onChangeUser({ ...currentUser, ho: e.target.value })}
        />
      </div>
      <div>
        <label className="label-text">Tên</label>
        <input
          type="text"
          required
          className="input-field"
          value={currentUser.ten}
          onChange={(e) =>
            onChangeUser({ ...currentUser, ten: e.target.value })
          }
        />
      </div>

      <div className="md:col-span-2">
        <label className="label-text">Email</label>
        <input
          type="email"
          required
          className="input-field"
          value={currentUser.email}
          onChange={(e) =>
            onChangeUser({ ...currentUser, email: e.target.value })
          }
        />
      </div>

      <ThongBaoMatKhauKhachHang
        isEditing={isEditing}
        vaitro={currentUser.vaitro}
      />

      <InputMatKhau
        isEditing={isEditing}
        currentUser={currentUser}
        showPassword={showPassword}
        onTogglePassword={onTogglePassword}
        onChangeUser={onChangeUser}
      />

      <div>
        <label className="label-text">Số điện thoại</label>
        <input
          type="text"
          className="input-field"
          value={currentUser.sodienthoai || ""}
          onChange={(e) =>
            onChangeUser({ ...currentUser, sodienthoai: e.target.value })
          }
        />
      </div>
      <div>
        <label className="label-text">Địa chỉ</label>
        <input
          type="text"
          className="input-field"
          value={currentUser.diachi || ""}
          onChange={(e) =>
            onChangeUser({ ...currentUser, diachi: e.target.value })
          }
        />
      </div>

      <div>
        <label className="label-text">Vai trò</label>
        <select
          className="input-field bg-white"
          value={currentUser.vaitro}
          onChange={(e) =>
            onChangeUser({ ...currentUser, vaitro: e.target.value })
          }
        >
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      {isEditing && (
        <div>
          <label className="label-text">Trạng thái</label>
          <select
            className="input-field bg-white"
            value={currentUser.trangthaitk}
            onChange={(e) =>
              onChangeUser({ ...currentUser, trangthaitk: e.target.value })
            }
          >
            <option value="HOAT_DONG">Hoạt động</option>
            <option value="KHOA">Khóa</option>
          </select>
        </div>
      )}

      <div className="md:col-span-2 flex justify-end gap-3 pt-4 border-t mt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 font-medium cursor-pointer text-sm"
        >
          Hủy
        </button>
        <button
          type="submit"
          className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white font-bold hover:bg-cyan-700 shadow-md shadow-cyan-100 cursor-pointer text-sm"
        >
          {isEditing ? "Lưu thay đổi" : "Thêm mới"}
        </button>
      </div>
    </form>
  );
}
