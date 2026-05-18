import React from 'react';
import { useParams, Link } from 'react-router-dom';

const ProductDetail = () => {
  const { id } = useParams();
  
  return (
    <div className="max-w-7xl mx-auto py-8 w-full">
      <div className="mb-4">
        <Link to="/home" className="text-blue-600 hover:underline">&larr; Quay lại cửa hàng</Link>
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-1/2">
          <img src={`https://via.placeholder.com/500?text=San+Pham+${id}`} alt="Sản phẩm" className="w-full h-96 object-cover rounded-lg" />
        </div>
        
        <div className="w-full md:w-1/2 flex flex-col">
          <span className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">Cá Nước Ngọt</span>
          <h1 className="text-3xl font-bold text-gray-800 mb-4">Cá Diêu Hồng Tươi Sống</h1>
          <p className="text-3xl font-bold text-blue-600 mb-6">75.000đ <span className="text-lg text-gray-500 font-normal">/ kg</span></p>
          
          <p className="text-gray-600 mb-8 leading-relaxed">
            Cá diêu hồng tươi sống được đánh bắt và vận chuyển trong ngày, đảm bảo chất lượng thịt chắc, ngọt và không bị bở. Phù hợp làm các món hấp xì dầu, chiên xù, hoặc nấu canh chua.
          </p>
          
          <div className="flex items-center gap-4 mb-8">
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100">-</button>
              <input type="text" value="1" readOnly className="w-12 text-center border-x border-gray-300 py-2 focus:outline-none" />
              <button className="px-4 py-2 text-gray-600 hover:bg-gray-100">+</button>
            </div>
            <span className="text-sm text-gray-500">Còn 120 kg trong kho</span>
          </div>
          
          <div className="flex gap-4 mt-auto">
            <button className="flex-1 bg-white border border-blue-600 text-blue-600 py-3 rounded-lg font-bold hover:bg-blue-50 transition">
              Thêm vào giỏ
            </button>
            <Link to="/checkout" className="flex-1 bg-blue-600 text-white text-center py-3 rounded-lg font-bold hover:bg-blue-700 transition">
              Mua ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;