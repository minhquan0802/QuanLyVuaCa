import React from 'react';

export default function Footer() {
  return (
    <footer className="bg-blue-800 text-white p-4 mt-auto">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Quản Lý Vựa Cá. All rights reserved.</p>
        <p className="text-sm mt-1 text-blue-300">Hệ thống quản lý chuyên nghiệp cho vựa hải sản</p>
      </div>
    </footer>
  );
}
