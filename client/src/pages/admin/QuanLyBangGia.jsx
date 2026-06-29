import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

export default function QuanLyBangGia() {
    const navigate = useNavigate();
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const { showToast } = useToast();

    const fetchData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get("/Banggias");
            const sortedData = (data.result || []).sort((a, b) => {
                if (a.trangThai === "Đang áp dụng") return -1;
                if (b.trangThai === "Đang áp dụng") return 1;
                return new Date(b.ngayBatDau) - new Date(a.ngayBatDau);
            });
            setPriceList(sortedData);
        } catch (error) {
            console.error("Lỗi tải dữ liệu:", error);
            showToast("Không thể tải dữ liệu bảng giá!", "error");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    // Logic lọc danh sách bảng giá theo từ khóa tìm kiếm (Tên cá hoặc Kích thước)
    const filteredPriceList = priceList.filter(item => {
        const fishName = (item.tenLoaiCa || "").toLowerCase();
        const sizeName = (item.tenSize || "").toLowerCase();
        const search = searchTerm.toLowerCase();
        return fishName.includes(search) || sizeName.includes(search);
    });

    // Helper: Badge trạng thái
    const renderStatusBadge = (status) => {
        if (status === "Đang áp dụng") {
            return <span className="bg-green-50 text-green-600 px-3 py-1 rounded-full text-xs font-bold border border-green-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-green-500"></span>Đang áp dụng</span>;
        }
        if (status === "Sắp áp dụng") {
            return <span className="bg-cyan-50 text-cyan-600 px-3 py-1 rounded-full text-xs font-bold border border-cyan-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-cyan-500"></span>Sắp áp dụng</span>;
        }
        return <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 w-fit mx-auto"><span className="size-1.5 rounded-full bg-slate-400"></span>Đã hết hạn</span>;
    };

    return (
        <AdminLayout title="Quản Lý Bảng Giá">
            {/* TOOLBAR */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="relative w-full sm:max-w-md flex items-center">
                    <div className="absolute left-3.5 pointer-events-none text-slate-400 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.604 10.604Z" />
                        </svg>
                    </div>
                    {/* Bổ sung value và onChange kết nối với state searchTerm */}
                    <input 
                        type="text" 
                        placeholder="Tìm theo tên cá..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 placeholder-slate-400 shadow-xs transition-all text-sm bg-white" 
                    />
                </div>
                <button onClick={() => navigate("/admin/QuanLyBangGia/them")} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 shadow-md shadow-cyan-200 transition-all active:scale-95 w-full sm:w-auto text-sm cursor-pointer">
                    Thiết lập giá mới
                </button>
            </div>

            {/* BẢNG DANH SÁCH GIÁ */}
            <div className="bg-white rounded-2xl shadow-xs ring-1 ring-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-xs">
                            <tr>
                                <th className="p-4">Sản phẩm</th>
                                <th className="p-4">Kích thước</th>
                                <th className="p-4 text-right">Giá Bán Lẻ (vnđ)</th>
                                <th className="p-4 text-right">Giá Bán Sỉ (vnđ)</th>
                                <th className="p-4 text-center">Hiệu lực</th>
                                <th className="p-4 text-center">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-6 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : filteredPriceList.length > 0 ? (
                                // Render dựa trên mảng đã được lọc filteredPriceList
                                filteredPriceList.map((item) => (
                                    <tr key={item.id} className={`hover:bg-slate-50/80 transition-colors ${item.trangThai === "Đang áp dụng" ? "bg-cyan-50/10" : ""}`}>
                                        <td className="p-4 font-bold text-cyan-950">{item.tenLoaiCa}</td>
                                        <td className="p-4">
                                            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-xs font-bold border border-slate-200 whitespace-nowrap">{item.tenSize}</span>
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanLe).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-right font-mono font-medium text-slate-700">
                                            {Number(item.giaBanSi).toLocaleString('vi-VN')}
                                        </td>
                                        <td className="p-4 text-center text-xs text-slate-500">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span>Từ: <span className="font-medium text-slate-700">{new Date(item.ngayBatDau).toLocaleDateString('vi-VN')}</span></span>
                                                {item.ngayKetThuc ? (
                                                    <span>Đến: <span className="font-medium text-slate-700">{new Date(item.ngayKetThuc).toLocaleDateString('vi-VN')}</span></span>
                                                ) : (
                                                    <span className="text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-0.5">Hiện tại</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {renderStatusBadge(item.trangThai)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Không tìm thấy kết quả phù hợp.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

        </AdminLayout>
    );
}