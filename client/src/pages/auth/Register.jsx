import React from 'react';
import { Link } from 'react-router-dom';

export default function Register() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-blue-600">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Đăng Ký Tài Khoản</h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullname">
            Họ và tên
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="fullname" 
            type="text" 
            placeholder="Nguyễn Văn A" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="email" 
            type="email" 
            placeholder="Nhập địa chỉ email" 
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Mật khẩu
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="password" 
            type="password" 
            placeholder="******************" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirm-password">
            Xác nhận mật khẩu
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="confirm-password" 
            type="password" 
            placeholder="******************" 
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300 shadow-md" 
            type="button"
          >
            Đăng Ký
          </button>
        </div>
        <div className="text-center text-sm text-gray-600 mt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}
