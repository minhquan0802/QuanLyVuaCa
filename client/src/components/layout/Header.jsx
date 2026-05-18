import React from 'react';
import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-white text-gray-800 p-4 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="container mx-auto max-w-7xl flex flex-wrap justify-between items-center gap-4">
        {/* Logo */}
        <Link to="/home" className="flex items-center gap-2 text-blue-600">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-2xl font-bold tracking-tight">Vựa Cá Khang</span>
        </Link>

        {/* Actions: Search, Cart, Profile */}
        <div className="flex items-center gap-4 lg:gap-6">
          {/* Search form (optional/placeholder) */}


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

          {/* Profile Dropdown / Link */}
          <Link to="/profile" className="flex items-center gap-2 text-gray-600 hover:text-blue-600 transition p-1 hover:bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex justify-center items-center font-bold border border-blue-200">
              N
            </div>
            <span className="hidden sm:block font-medium text-sm">Tài khoản</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
