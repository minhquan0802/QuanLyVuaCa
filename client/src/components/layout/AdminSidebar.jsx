import React from 'react';
import { NavLink } from 'react-router-dom';
import api from '../../config/axios';

const AdminSidebar = () => {
  const menuItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { path: '/admin/orders', label: 'Quản lý đơn hàng', icon: 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z' },
    { path: '/admin/inventory', label: 'Quản lý kho', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { path: '/admin/prices', label: 'Quản lý bảng giá', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
    { path: '/admin/accounts', label: 'Quản lý tài khoản', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
  ];

  function handleLocalLogout() {
    window.location.href = '/login'; 
  }

  const handleUserLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.log("Lỗi đăng xuất phía server:", e);
    } finally {
      handleLocalLogout();
    }
  };

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col fixed top-0 left-0 bottom-0 shadow-xl">
      <div className="p-6 border-b border-gray-800 flex items-center justify-center">
        <h2 className="text-2xl font-bold tracking-wider text-blue-400">VỰA CÁ ADMIN</h2>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 rounded-lg transition-colors duration-200 ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`
            }
          >
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
            </svg>
            <span className="font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800">
        <button className="flex items-center w-full px-4 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors duration-200">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
          </svg>
          <span className="font-medium" onClick={handleUserLogout}>Đăng xuất</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
