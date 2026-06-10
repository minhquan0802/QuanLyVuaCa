import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyLoaiCa() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data: { result } } = await api.get("/Loaicas");
            setCategories(result || []);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải danh sách loại cá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleEdit = (category) => {
        navigate(`/admin/QuanLyLoaiCa/sua/${category.id}`, { state: { category } });
    };

    const handleOpenSize = (fish) => {
        navigate(`/admin/QuanLyLoaiCa/kich-co/${fish.id}`);
    };

    return (
        <AdminLayout title="Quản Lý Loại Cá & Kích Thước">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 text-slate-400 flex items-center justify-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    <input type="text" placeholder="Tìm kiếm loại cá..." className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm shadow-2xs transition-all bg-white" />
                </div>
                <button onClick={() => navigate("/admin/QuanLyLoaiCa/them")} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-100 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thêm Loại Cá
                </button>
            </div>

            {/* BẢNG DANH SÁCH LOẠI CÁ */}
            <div className="bg-white rounded-2xl shadow-2xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[750px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4 w-20 text-center">ID</th>
                                <th className="p-4 w-24">Hình ảnh</th>
                                <th className="p-4">Tên Loại Cá</th>
                                <th className="p-4">Miêu tả</th>
                                <th className="p-4 text-center w-40">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                            {loading ? (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : categories.length > 0 ? (
                                categories.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-4 text-center font-mono text-slate-400">#{item.id}</td>
                                        <td className="p-4">
                                            <div className="size-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-2xs">
                                                <img
                                                    src={item.hinhanhurl}
                                                    className="w-full h-full object-cover"
                                                    alt={item.tenloaica}
                                                    onError={(e) => { e.target.src = 'https://placehold.co/100x100?text=Error' }}
                                                />
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-cyan-950">{item.tenloaica}</td>
                                        <td className="p-4 text-slate-500 max-w-xs truncate">{item.mieuta || "---"}</td>
                                        <td className="p-4 flex items-center justify-center gap-3">
                                            <button onClick={() => handleOpenSize(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-600 font-bold hover:bg-cyan-100 transition-colors text-xs cursor-pointer" title="Cấu hình kích thước">
                                                Kích cỡ
                                            </button>
                                            <button onClick={() => handleEdit(item)} className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 transition-colors text-xs cursor-pointer" title="Chỉnh sửa loại cá">
                                                Sửa
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="5" className="p-8 text-center text-slate-400 italic">Không tìm thấy loại cá nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}