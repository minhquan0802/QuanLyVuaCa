import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Checkout = () => {
  const navigate = useNavigate();

  const handleCheckout = (e) => {
    e.preventDefault();
    // Giả lập thanh toán thành công
    navigate('/payment-success');
  };

  return (
    <div className="max-w-5xl mx-auto py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Thanh toán</h1>
      
      <form onSubmit={handleCheckout} className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Thông tin giao hàng</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết</label>
                <input type="text" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none" required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú cho đơn vị vận chuyển (tùy chọn)</label>
                <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"></textarea>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-800 mb-4">Phương thức thanh toán</h2>
            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="cod" defaultChecked className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Thanh toán khi nhận hàng (COD)</span>
              </label>
              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="radio" name="payment" value="bank" className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-gray-700">Chuyển khoản ngân hàng</span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sticky top-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Đơn hàng (2 sản phẩm)</h3>
            
            <div className="space-y-4 mb-6 border-b border-gray-100 pb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Cá Basa Phi lê (x2)</span>
                <span className="font-medium text-gray-800">100.000đ</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Mực ống (x1)</span>
                <span className="font-medium text-gray-800">150.000đ</span>
              </div>
            </div>
            
            <div className="flex justify-between mb-3 text-gray-600 text-sm">
              <span>Tạm tính:</span>
              <span>250.000đ</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-600 text-sm border-b border-gray-100 pb-4">
              <span>Phí vận chuyển:</span>
              <span>30.000đ</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-bold text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-xl text-blue-600">280.000đ</span>
            </div>
            <button type="submit" className="w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Đặt Hàng
            </button>
            <div className="mt-4 text-center">
              <Link to="/cart" className="text-sm text-blue-600 hover:underline">Quay lại giỏ hàng</Link>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default Checkout;