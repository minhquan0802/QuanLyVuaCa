import React from 'react';
import { Link } from 'react-router-dom';

const OrderTracking = () => {
  const orders = [
    { id: 'DH123456', date: '18/05/2026', items: 3, total: '280.000đ', status: 'Đang giao' },
    { id: 'DH123440', date: '10/05/2026', items: 1, total: '150.000đ', status: 'Đã giao' },
    { id: 'DH123412', date: '01/05/2026', items: 5, total: '850.000đ', status: 'Đã hủy' },
  ];

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Đang giao': return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-xs font-bold">Đang giao</span>;
      case 'Đã giao': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Đã giao</span>;
      case 'Đã hủy': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Đã hủy</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Lịch sử đơn hàng</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="p-4 font-semibold text-gray-600">Đơn hàng #</th>
                <th className="p-4 font-semibold text-gray-600">Ngày đặt</th>
                <th className="p-4 font-semibold text-gray-600">Số lượng SP</th>
                <th className="p-4 font-semibold text-gray-600">Tổng tiền</th>
                <th className="p-4 font-semibold text-gray-600">Trạng thái</th>
                <th className="p-4 font-semibold text-gray-600 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i} className="border-b border-gray-100 last:border-0 hover:bg-gray-50">
                  <td className="p-4 font-medium text-blue-600">{order.id}</td>
                  <td className="p-4 text-gray-600">{order.date}</td>
                  <td className="p-4 text-gray-600">{order.items} sản phẩm</td>
                  <td className="p-4 font-medium text-gray-800">{order.total}</td>
                  <td className="p-4">{getStatusBadge(order.status)}</td>
                  <td className="p-4 text-right">
                    <Link to="#" className="text-sm font-medium text-blue-600 hover:underline">Xem</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;