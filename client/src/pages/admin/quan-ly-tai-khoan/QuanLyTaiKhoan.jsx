import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangTaiKhoan from "./components/BangTaiKhoan";
import ThanhCongCuTaiKhoan from "./components/ThanhCongCuTaiKhoan";
import { locTaiKhoan } from "./utils";

export default function QuanLyTaiKhoan() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { result } } = await api.get("/tai-khoan");
            setAccounts(result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách tài khoản!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleAddNew = () => navigate("/admin/QuanLyTaiKhoan/them");
    const handleEdit = (user) => navigate(`/admin/QuanLyTaiKhoan/sua/${user.idtaikhoan}`, { state: { user } });

    const handleApprove = async (item) => {
        if (!window.confirm(`Phê duyệt tài khoản "${item.ho} ${item.ten}"?`)) return;
        try {
            await api.put(`/tai-khoan/duyet/${item.idtaikhoan}`);
            showToast("Phê duyệt tài khoản thành công!", "success");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.message || "Phê duyệt thất bại!", "error");
        }
    };

    return (
        <AdminLayout title="Quản Lý Tài Khoản">
            <ThanhCongCuTaiKhoan searchTerm={searchTerm} onSearchChange={setSearchTerm} onAddNew={handleAddNew} />
            <BangTaiKhoan loading={loading} accounts={locTaiKhoan(accounts, searchTerm)} onApprove={handleApprove} onEdit={handleEdit} />
        </AdminLayout>
    );
}

