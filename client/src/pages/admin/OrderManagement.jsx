import React from 'react';

const OrderManagement = () => {
  const orders = [
    { id: 'DH0123', customer: 'Nguyễn Văn A', date: '18/05/2026', total: '15.000.000đ', status: 'Đã giao' },
    { id: 'DH0124', customer: 'Nhà hàng Biển Đông', date: '18/05/2026', total: '32.500.000đ', status: 'Đang xử lý' },
    { id: 'DH0125', customer: 'Trần Thị B', date: '17/05/2026', total: '8.200.000đ', status: 'Đã hủy' },
    { id: 'DH0126', customer: 'Quán ăn Cô Ba', date: '17/05/2026', total: '11.400.000đ', status: 'Đang giao' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã giao': return 'bg-green-100 text-green-700';
      case 'Đang xử lý': return 'bg-yellow-100 text-yellow-700';
      case 'Đang giao': return 'bg-blue-100 text-blue-700';
      case 'Đã hủy': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Đơn hàng</h2>
        <div className="flex gap-2">
          <input type="text" placeholder="Tìm mã đơn hàng..." className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500" />
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Tìm kiếm</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600 text-sm">Mã đơn</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Khách hàng</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Ngày đặt</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tổng tiền</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Trạng thái</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{order.id}</td>
                <td className="p-4 text-gray-600">{order.customer}</td>
                <td className="p-4 text-gray-600">{order.date}</td>
                <td className="p-4 font-medium text-gray-800">{order.total}</td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  <button className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded">Xem</button>
                  <button className="text-green-600 hover:text-green-800 p-1 bg-green-50 rounded">Duyệt</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderManagement;
