import React from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';

const AdminLayout = () => {
  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <AdminSidebar />
      <div className="flex-1 ml-64 p-8">
        <header className="bg-white px-8 py-4 rounded-xl shadow-sm mb-8 flex justify-between items-center border border-gray-100">
          <div className="text-gray-600 font-medium">Bảng điều khiển quản trị</div>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
              AD
            </div>
            <div>
              <p className="font-semibold text-gray-800">Quản trị viên</p>
              <p className="text-sm text-gray-500">admin@vuaca.com</p>
            </div>
          </div>
        </header>
        <main className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[calc(100vh-160px)]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
