import React from 'react';
import { Link } from 'react-router-dom';

const PaymentSuccess = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Đặt hàng thành công!</h1>
        <p className="text-gray-600 mb-6">Cảm ơn bạn đã mua sắm tại Vựa Cá Điêu Hồng. Mã đơn hàng của bạn là <strong>#DH123456</strong>.</p>
        
        <div className="flex flex-col gap-3">
          <Link to="/orders" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            Theo dõi đơn hàng
          </Link>
          <Link to="/home" className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition">
            Tiếp tục mua hàng
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;