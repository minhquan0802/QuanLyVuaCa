import React from 'react';

const AccountManagement = () => {
  const accounts = [
    { username: 'admin', fullname: 'Quản trị viên', role: 'Admin', phone: '0901234567', status: 'Hoạt động' },
    { username: 'nhanvien1', fullname: 'Lê Văn Bán Hàng', role: 'Nhân viên', phone: '0912233445', status: 'Hoạt động' },
    { username: 'khachhang_biendong', fullname: 'Nhà hàng Biển Đông', role: 'Khách sỉ', phone: '0988777666', status: 'Hoạt động' },
    { username: 'nguyenvana', fullname: 'Nguyễn Văn A', role: 'Khách lẻ', phone: '0933444555', status: 'Khóa' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Tài khoản</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          <span>+</span> Thêm tài khoản
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600 text-sm">Tài khoản</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Họ và Tên</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Vai trò</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Số điện thoại</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((acc, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{acc.username}</td>
                <td className="p-4 text-gray-700">{acc.fullname}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    acc.role === 'Admin' ? 'bg-purple-100 text-purple-700' :
                    acc.role === 'Nhân viên' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {acc.role}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{acc.phone}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    acc.status === 'Hoạt động' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {acc.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  <button className="text-blue-600 hover:underline text-sm">Sửa</button>
                  <button className="text-red-600 hover:underline text-sm ml-2">
                    {acc.status === 'Hoạt động' ? 'Khóa' : 'Mở khóa'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AccountManagement;
