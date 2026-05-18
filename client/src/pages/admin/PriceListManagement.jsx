import React from 'react';

const PriceListManagement = () => {
  const prices = [
    { id: 'SP01', name: 'Cá Basa Phi lê', basePrice: '45.000đ', salePrice: '50.000đ', wholesalePrice: '40.000đ', updated: '15/05/2026' },
    { id: 'SP02', name: 'Cá Diêu Hồng (sống)', basePrice: '60.000đ', salePrice: '75.000đ', wholesalePrice: '65.000đ', updated: '16/05/2026' },
    { id: 'SP03', name: 'Mực ống nhỏ', basePrice: '120.000đ', salePrice: '150.000đ', wholesalePrice: '135.000đ', updated: '10/05/2026' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Bảng giá (VNĐ/kg)</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2">
          Cập nhật giá hàng loạt
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600 text-sm">Mã SP</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tên sản phẩm</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Giá gốc</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-green-600">Giá bán lẻ</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-blue-600">Giá sỉ</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Cập nhật lúc</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {prices.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 text-gray-500">{item.id}</td>
                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-500">{item.basePrice}</td>
                <td className="p-4 font-bold text-green-700">{item.salePrice}</td>
                <td className="p-4 font-bold text-blue-700">{item.wholesalePrice}</td>
                <td className="p-4 text-sm text-gray-500">{item.updated}</td>
                <td className="p-4 flex gap-2 justify-center">
                  <button className="text-gray-600 hover:text-blue-600 border border-gray-300 hover:border-blue-600 px-3 py-1 rounded text-sm transition-colors">
                    Sửa giá
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PriceListManagement;
