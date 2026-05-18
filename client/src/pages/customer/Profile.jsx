import React from 'react';

const Profile = () => {
  return (
    <div className="max-w-4xl mx-auto py-8 w-full">
      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl mx-auto mb-4">
              N
            </div>
            <h2 className="text-xl font-bold text-gray-800">Nguyễn Văn A</h2>
            <p className="text-gray-500 mb-6">nguyenvana@example.com</p>
            
            <div className="flex flex-col gap-2 text-left">
              <a href="#info" className="p-3 bg-blue-50 text-blue-700 rounded-lg font-medium">Thông tin cá nhân</a>
              <a href="/orders" className="p-3 hover:bg-gray-50 text-gray-700 rounded-lg">Đơn hàng của tôi</a>
            </div>
          </div>
        </div>
        
        <div className="w-full md:w-2/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Thông tin cá nhân</h2>
            <form className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                  <input type="text" defaultValue="Nguyễn Văn A" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                  <input type="text" defaultValue="0912345678" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" defaultValue="nguyenvana@example.com" disabled className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg px-4 py-2 outline-none" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ mặc định</label>
                  <input type="text" defaultValue="123 Đường ABC, Quận X, TP.HCM" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>
              <div className="pt-4">
                <button type="button" className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700">Lưu thay đổi</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;