import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../config/axios';

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.log("Lỗi đăng xuất phía server:", e);
    } finally {
      window.location.href = '/login';
    }
  };

  return (
    <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 text-blue-600">
          <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
            {/* Thân cá */}
            <path d="M22 12c0 0-4-6-11-5C7 7.5 4 9.5 4 12s3 4.5 7 5c7 1 11-5 11-5z" />
            {/* Đuôi cá */}
            <path d="M4 12L1 8v8l3-4z" />
            {/* Mắt cá */}
            <circle cx="16" cy="11" r="1" fill="white" />
          </svg>
          <span className="text-2xl font-bold tracking-tight">Vựa cá Điêu Hồng</span>
        </Link>

        {/* Actions: Search, Cart, Profile */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Cart */}
          <Link to="/cart" className="relative text-gray-600 hover:text-blue-600 transition p-1">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
            </svg>
            {/* Badge */}
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              3
            </span>
          </Link>

          {/* Account Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition p-1 hover:bg-gray-50 rounded-lg"
            >
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center font-bold border border-blue-200">
                N
              </div>
              <span className="hidden sm:block font-medium text-sm">Tài khoản</span>
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-44 bg-white border border-gray-100 rounded-lg shadow-lg py-1 z-50">
                <Link
                  to="/profile"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Hồ sơ
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-red-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
