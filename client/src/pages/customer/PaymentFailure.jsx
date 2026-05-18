import React from 'react';
import { Link } from 'react-router-dom';

const PaymentFailure = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center max-w-md w-full">
        <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Thanh toán thất bại!</h1>
        <p className="text-gray-600 mb-6">Đã có lỗi xảy ra trong quá trình xử lý thanh toán của bạn. Vui lòng thử lại hoặc chọn phương thức thanh toán khác.</p>
        
        <div className="flex flex-col gap-3">
          <Link to="/checkout" className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
            Thử lại thanh toán
          </Link>
          <Link to="/home" className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold hover:bg-gray-50 transition">
            Trở về trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;