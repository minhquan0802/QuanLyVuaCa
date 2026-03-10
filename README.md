# 🐟 QuanLyVuaCa (Hệ Thống Quản Lý Vựa Cá)

## 📖 Giới Thiệu
**QuanLyVuaCa** là một ứng dụng phần mềm được xây dựng để hỗ trợ quản lý và vận hành các hoạt động kinh doanh tại vựa cá. 

Dự án được thiết kế theo mô hình Client-Server, sử dụng **Spring Boot** cho hệ thống Backend vững chắc và **JavaScript** cho giao diện Frontend linh hoạt, giúp số hóa quy trình quản lý thông tin xuất/nhập, kiểm soát kho bãi và theo dõi doanh thu một cách hiệu quả.

## 🚀 Công Nghệ Sử Dụng

Dự án được chia thành hai phần chính: Client và Server.

### Server (Backend)
- **Ngôn ngữ:** Java
- **Framework:** Spring Boot
- **Database:** MySQL
- Cung cấp các RESTful API phục vụ cho ứng dụng Client.

### Client (Frontend)
- **Ngôn ngữ:** JavaScript
- **Framework/Thư viện:** ReactJS
- Xử lý giao diện người dùng, gọi API từ Backend và hiển thị dữ liệu trực quan.

## 📂 Cấu Trúc Thư Mục
```bash
QuanLyVuaCa/
├── client/     # Chứa source code Frontend (Giao diện người dùng)
└── server/     # Chứa source code Backend (Spring Boot REST API)
