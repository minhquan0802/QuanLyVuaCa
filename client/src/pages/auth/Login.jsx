import React from 'react';
import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-blue-600">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Đăng Nhập</h2>
      <form>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
            Tên đăng nhập / Email
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="username" 
            type="text" 
            placeholder="Nhập email hoặc tên đăng nhập" 
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
            Mật khẩu
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="password" 
            type="password" 
            placeholder="******************" 
          />
          <div className="mt-2 text-right">
            <Link to="#" className="text-sm text-blue-500 hover:text-blue-700">Quên mật khẩu?</Link>
          </div>
        </div>
        <div className="flex items-center justify-between mb-4">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300 shadow-md" 
            type="button"
          >
            Đăng Nhập
          </button>
        </div>
        <div className="text-center text-sm text-gray-600 mt-4">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="text-blue-600 hover:text-blue-800 font-semibold">
            Đăng ký ngay
          </Link>
        </div>
      </form>
    </div>
  );
}
