import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from '../../config/axios';

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ho: '',
    ten: '',
    email: '',
    sodienthoai: '',
    diachi: '',
    matkhau: '',
    confirmPassword: ''
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.matkhau !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      const payload = {
        ho: formData.ho,
        ten: formData.ten,
        email: formData.email,
        sodienthoai: formData.sodienthoai,
        diachi: formData.diachi,
        matkhau: formData.matkhau,
        vaitro: 'INDIVIDUAL_CUSTOMER' 
      };

      const response = await axios.post('/tai-khoan', payload);
      
      if (response.status === 200) {
        setSuccess('Đăng ký thành công!');
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      if (err.response && err.response.data) {
        // Tùy thuộc vào cấu trúc lỗi trả về từ Spring Boot
        setError(err.response.data.message || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.');
      } else {
        setError('Có lỗi xảy ra khi kết nối đến máy chủ.');
      }
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md border-t-4 border-blue-600">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">Đăng Ký Tài Khoản</h2>
      {error && <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert"><span className="block sm:inline">{error}</span></div>}
      {success && <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert"><span className="block sm:inline">{success}</span></div>}
      <form onSubmit={handleSubmit}>
        <div className="flex gap-4 mb-4">
          <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ho">
              Họ
            </label>
            <input 
              className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
              id="ho" 
              type="text" 
              placeholder="Nguyễn Văn" 
              value={formData.ho}
              onChange={handleChange}
              required
            />
          </div>
          <div className="w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="ten">
              Tên
            </label>
            <input 
              className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
              id="ten" 
              type="text" 
              placeholder="A" 
              value={formData.ten}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
            Email
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="email" 
            type="email" 
            placeholder="Nhập địa chỉ email" 
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="sodienthoai">
            Số điện thoại
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="sodienthoai" 
            type="text" 
            placeholder="0xxxxxxxxx" 
            pattern="^0\d{9}$"
            title="Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số"
            value={formData.sodienthoai}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="diachi">
            Địa chỉ
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="diachi" 
            type="text" 
            placeholder="Nhập địa chỉ của bạn" 
            value={formData.diachi}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="matkhau">
            Mật khẩu
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="matkhau" 
            type="password" 
            placeholder="******************" 
            minLength="8"
            maxLength="50"
            value={formData.matkhau}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="confirmPassword">
            Xác nhận mật khẩu
          </label>
          <input 
            className="shadow-sm border border-gray-300 rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition" 
            id="confirmPassword" 
            type="password" 
            placeholder="******************" 
            minLength="8"
            maxLength="50"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <div className="flex items-center justify-between mb-4">
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full transition duration-300 shadow-md" 
            type="submit"
          >
            Đăng Ký
          </button>
        </div>
        <div className="text-center text-sm text-gray-600 mt-4">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-semibold">
            Đăng nhập
          </Link>
        </div>
      </form>
    </div>
  );
}
