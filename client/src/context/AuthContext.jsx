import { createContext, useContext, useState, useEffect } from 'react';
import api from '../config/axios'; // Đường dẫn tới cấu hình axios của bạn

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Hàm tự động kiểm tra xem user đã đăng nhập chưa bằng cookie (thay thế AutoCheckLogin cũ nếu cần)
  const checkLoginStatus = async () => {
    try {
      const response = await api.get('/tai-khoan/my-info');
      if (response.data.code === 0) {
        setUser(response.data.result); // Lưu thông tin user (gồm vaitro) vào state
      } else {
        setUser(null);
      }
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, checkLoginStatus }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);