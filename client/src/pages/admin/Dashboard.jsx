import React from 'react';
import { handleUserLogout } from '../../config/axiosConfig';

const Dashboard = () => {
  const stats = [
    { label: 'Tổng doanh thu', value: '124.500.000đ', color: 'bg-green-100 text-green-600' },
    { label: 'Đơn hàng mới', value: '+35', color: 'bg-blue-100 text-blue-600' },
    { label: 'Cá trong kho (Tấn)', value: '12.4', color: 'bg-yellow-100 text-yellow-600' },
    { label: 'Khách hàng', value: '428', color: 'bg-purple-100 text-purple-600' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Tổng quan</h2>
        <button 
          onClick={handleUserLogout}
          className="px-4 py-2 bg-red-600 text-white font-medium rounded-lg hover:bg-red-700 transition-colors shadow-sm"
        >
          Đăng xuất
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`w-14 h-14 rounded-full flex justify-center items-center font-bold text-xl ${stat.color}`}>
              $
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">{stat.label}</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Hoạt động gần đây</h3>
          <ul className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <li key={i} className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-gray-800 font-medium text-sm">Đơn hàng #DH0{i}12 đã được giao thành công</p>
                  <p className="text-gray-400 text-xs mt-1">10 phút trước</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="border border-gray-100 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg text-gray-800 mb-4">Sản phẩm bán chạy</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Cá Basa Phi lê</span>
              <span className="text-green-600 font-bold">2.4 Tấn</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Cá Diêu Hồng nguyên con</span>
              <span className="text-green-600 font-bold">1.8 Tấn</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="font-medium text-gray-700">Cá Lóc đồng</span>
              <span className="text-green-600 font-bold">1.2 Tấn</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
