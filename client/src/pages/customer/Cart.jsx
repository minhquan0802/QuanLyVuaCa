import React from 'react';
import { Link } from 'react-router-dom';

const Cart = () => {
  return (
    <div className="max-w-5xl mx-auto py-8 w-full">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Giỏ hàng của bạn</h1>
      
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          {/* Cart Item */}
          <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
            <img src="https://via.placeholder.com/100?text=Ca" alt="Cá Basa" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">Cá Basa Phi lê</h3>
              <p className="text-blue-600 font-medium">50.000đ</p>
            </div>
            <div className="flex items-center border border-gray-300 rounded">
              <button className="px-3 py-1 hover:bg-gray-100">-</button>
              <input type="text" value="2" readOnly className="w-10 text-center text-sm focus:outline-none border-x border-gray-300" />
              <button className="px-3 py-1 hover:bg-gray-100">+</button>
            </div>
            <div className="text-right ml-4">
              <p className="font-bold text-gray-800">100.000đ</p>
              <button className="text-red-500 text-sm hover:underline mt-1">Xóa</button>
            </div>
          </div>
          
          {/* Cart Item 2 */}
          <div className="flex items-center gap-4 py-6 border-b border-gray-100">
            <img src="https://via.placeholder.com/100?text=Muc" alt="Mực ống" className="w-20 h-20 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-800">Mực ống</h3>
              <p className="text-blue-600 font-medium">150.000đ</p>
            </div>
            <div className="flex items-center border border-gray-300 rounded">
              <button className="px-3 py-1 hover:bg-gray-100">-</button>
              <input type="text" value="1" readOnly className="w-10 text-center text-sm focus:outline-none border-x border-gray-300" />
              <button className="px-3 py-1 hover:bg-gray-100">+</button>
            </div>
            <div className="text-right ml-4">
              <p className="font-bold text-gray-800">150.000đ</p>
              <button className="text-red-500 text-sm hover:underline mt-1">Xóa</button>
            </div>
          </div>
        </div>
        
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-4">Tóm tắt đơn hàng</h3>
            <div className="flex justify-between mb-3 text-gray-600">
              <span>Tạm tính (3 kg):</span>
              <span>250.000đ</span>
            </div>
            <div className="flex justify-between mb-4 text-gray-600 border-b border-gray-100 pb-4">
              <span>Phí vận chuyển:</span>
              <span>30.000đ</span>
            </div>
            <div className="flex justify-between mb-6">
              <span className="font-bold text-gray-800">Tổng cộng:</span>
              <span className="font-bold text-xl text-blue-600">280.000đ</span>
            </div>
            <Link to="/checkout" className="block w-full bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Tiến hành thanh toán
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;