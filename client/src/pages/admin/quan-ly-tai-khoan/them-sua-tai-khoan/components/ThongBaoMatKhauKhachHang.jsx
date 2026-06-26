import React from "react";

export default function ThongBaoMatKhauKhachHang({ isEditing, vaitro }) {
  if (isEditing || vaitro !== "CUSTOMER") return null;

  return (
    <div className="md:col-span-2 flex items-start gap-2.5 p-3.5 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-800 text-sm">
      <span>
        Hệ thống sẽ tự gửi email thông báo đến khách hàng kèm link để tự đặt mật
        khẩu. Mật khẩu bên dưới chỉ là tạm thời.
      </span>
    </div>
  );
}
