import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  const products = [
    { id: '1', name: 'Cá Basa Phi lê', price: '50.000đ', image: 'https://via.placeholder.com/300?text=Ca+Basa' },
    { id: '2', name: 'Cá Diêu Hồng', price: '75.000đ', image: 'https://via.placeholder.com/300?text=Ca+Dieu+Hong' },
    { id: '3', name: 'Mực ống', price: '150.000đ', image: 'https://via.placeholder.com/300?text=Muc+Ong' },
    { id: '4', name: 'Tôm Sú', price: '200.000đ', image: 'https://via.placeholder.com/300?text=Tom+Su' },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 w-full">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Vựa Cá Khang</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">Chuyên cung cấp các loại cá và hải sản tươi sống, chất lượng cao với giá sỉ và lẻ tốt nhất thị trường.</p>
      </div>

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Sản phẩm nổi bật</h2>
        <div className="flex gap-2">
          <select className="border border-gray-300 rounded px-3 py-1">
            <option>Mới nhất</option>
            <option>Giá: Thấp đến Cao</option>
            <option>Giá: Cao đến Thấp</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="font-semibold text-lg text-gray-800 mb-1">{product.name}</h3>
              <p className="text-blue-600 font-bold mb-4">{product.price} / kg</p>
              <div className="flex gap-2">
                <Link to={`/product/${product.id}`} className="flex-1 bg-gray-100 text-gray-800 text-center py-2 rounded-lg font-medium hover:bg-gray-200 transition">Chi tiết</Link>
                <button className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 transition">Thêm vào giỏ</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;