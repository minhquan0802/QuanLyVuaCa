import React from 'react';

const InventoryManagement = () => {
  const inventory = [
    { id: 'SP01', name: 'Cá Basa Phi lê', category: 'Cá Biển/Đông Lạnh', stock: '2500', unit: 'kg', minStock: '500', status: 'Bình thường' },
    { id: 'SP02', name: 'Cá Diêu Hồng', category: 'Cá Nước Ngọt', stock: '120', unit: 'kg', minStock: '200', status: 'Sắp hết' },
    { id: 'SP03', name: 'Mực ống', category: 'Hải Sản', stock: '800', unit: 'kg', minStock: '300', status: 'Bình thường' },
    { id: 'SP04', name: 'Cá Hú', category: 'Cá Nước Ngọt', stock: '45', unit: 'kg', minStock: '100', status: 'Thiếu hụt' },
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý Tồn kho</h2>
        <button className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 flex items-center gap-2">
          <span>+</span> Nhập kho mới
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="p-4 font-semibold text-gray-600 text-sm">Mã SP</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tên sản phẩm</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Danh mục</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tồn kho</th>
              <th className="p-4 font-semibold text-gray-600 text-sm">Tình trạng</th>
              <th className="p-4 font-semibold text-gray-600 text-sm text-center">Hành động</th>
            </tr>
          </thead>
          <tbody>
            {inventory.map((item, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="p-4 font-medium text-gray-800">{item.id}</td>
                <td className="p-4 font-medium text-gray-800">{item.name}</td>
                <td className="p-4 text-gray-600">{item.category}</td>
                <td className="p-4">
                  <span className="font-bold">{item.stock}</span> {item.unit}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'Bình thường' ? 'bg-green-100 text-green-700' :
                    item.status === 'Sắp hết' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-4 flex gap-2 justify-center">
                  <button className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 rounded text-sm">Nhập</button>
                  <button className="text-yellow-600 hover:text-yellow-800 p-1 bg-yellow-50 rounded text-sm">Xuất</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryManagement;
