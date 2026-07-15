import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import AdminLayout from "../../components/admin/AdminLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../config/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
    DollarSign, CheckCircle2, ShoppingCart,
    PackagePlus, AlertCircle, TableProperties, BarChart2, Table
} from "lucide-react";

export default function SalesDashboard() {
    const { user } = useAuth() || {};
    const navigate = useNavigate();
    const [timeRange, setTimeRange] = useState("THIS_MONTH");
    const [viewMode, setViewMode] = useState("TABLE"); // "TABLE" hoặc "CHART"

    // --- CHỈ SỐ TÀI CHÍNH & BÁN HÀNG ---
    const [stats, setStats] = useState({ tongDoanhThu: 0, chiPhiNhapHang: 0, chiPhiPhatSinh: 0, donHoanThanh: 0, soLoQuaHan: 0 });

    // --- KHỐI LƯỢNG NHẬP - BÁN - HAO HỤT THEO LOẠI CÁ ---
    const [fishVolumeData, setFishVolumeData] = useState([]);

    // --- GỢI Ý NHẬP HÀNG ---
    const [restockSuggestions, setRestockSuggestions] = useState([]);

    // KPI và bảng luân chuyển phụ thuộc khoảng thời gian đang chọn, tải lại mỗi khi đổi
    useEffect(() => {
        api.get(`/Thongke/tong-quan?range=${timeRange}`)
            .then(res => setStats(res.data.result))
            .catch(() => {});

        api.get(`/Thongke/luan-chuyen-hang-hoa?range=${timeRange}`)
            .then(res => setFishVolumeData(res.data.result || []))
            .catch(() => {});
    }, [timeRange]);

    // Gợi ý nhập hàng luôn tính theo 30 ngày gần nhất, không phụ thuộc timeRange, chỉ cần tải 1 lần
    useEffect(() => {
        api.get("/Thongke/de-xuat-nhap-hang")
            .then(res => setRestockSuggestions(res.data.result || []))
            .catch(() => {});
    }, []);

    // Xử lý dữ liệu: Tự động tính Tồn kho cho cả Bảng và Biểu đồ
    const processedFishData = fishVolumeData.map(item => ({
        ...item,
        tonKho: item.nhap - item.ban - item.haohut
    })).sort((a, b) => b.ban - a.ban); // Ưu tiên xếp theo loại cá bán chạy nhất

    const formatCurrency = (value) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    // Custom Tooltip cho Biểu đồ Cột (Cập nhật thêm Tồn kho)
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-lg border border-slate-100 min-w-[200px]">
                    <p className="font-bold text-slate-800 mb-3 border-b pb-2">{label}</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-blue-500"></span> Đã nhập:</span>
                            <span className="font-bold text-slate-800">{payload[0].value.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-green-500"></span> Đã bán:</span>
                            <span className="font-bold text-slate-800">{payload[1].value.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-red-500"></span> Hao hụt:</span>
                            <span className="font-bold text-slate-800">{payload[2].value.toLocaleString()} kg</span>
                        </div>
                        <div className="flex justify-between items-center text-sm pt-1 mt-1 border-t border-slate-50">
                            <span className="flex items-center gap-1.5 text-slate-600"><span className="w-3 h-3 rounded-sm bg-purple-500"></span> Tồn kho:</span>
                            <span className="font-bold text-purple-700">{payload[3].value.toLocaleString()} kg</span>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <AdminLayout title="Báo Cáo Bán Hàng (Sales Dashboard)">
            
            {/* --- HEADER LỌC THỜI GIAN --- */}
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-bold text-slate-800">Tổng kết Kinh doanh</h2>
                <select 
                    value={timeRange} 
                    onChange={(e) => setTimeRange(e.target.value)}
                    className="border-slate-300 rounded-xl text-sm font-medium focus:ring-blue-500 focus:border-blue-500 p-2.5 border bg-white shadow-sm outline-none cursor-pointer"
                >
                    <option value="TODAY">Hôm nay</option>
                    <option value="THIS_WEEK">Tuần này</option>
                    <option value="THIS_MONTH">Tháng này</option>
                    <option value="THIS_YEAR">Năm nay</option>
                </select>
            </div>

            {/* --- KHU VỰC 1: 4 THẺ KPI TÀI CHÍNH --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-6 rounded-3xl shadow-lg text-white flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl"><DollarSign size={28} className="text-white" /></div></div>
                    <div>
                        <p className="text-blue-100 text-xs font-bold uppercase tracking-wider mb-1">Tổng Doanh Thu</p>
                        <h3 className="text-2xl lg:text-3xl font-black">{formatCurrency(stats.tongDoanhThu)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-orange-50 rounded-2xl"><ShoppingCart size={28} className="text-orange-600" /></div></div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Chi Phí Nhập Hàng</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{formatCurrency(stats.chiPhiNhapHang)}</h3>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={() => navigate("/admin/QuanLyThanhLy?tab=quahan")}
                    className={`text-left p-6 rounded-3xl shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                        stats.soLoQuaHan > 0 ? "bg-red-50 border-red-200" : "bg-white border-slate-200"
                    }`}
                >
                    <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${stats.soLoQuaHan > 0 ? "bg-red-100" : "bg-slate-50"}`}>
                            <AlertCircle size={28} className={stats.soLoQuaHan > 0 ? "text-red-600" : "text-slate-400"} />
                        </div>
                    </div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Lô Hàng Quá Hạn</p>
                        <h3 className={`text-2xl lg:text-3xl font-black ${stats.soLoQuaHan > 0 ? "text-red-600" : "text-slate-800"}`}>
                            {stats.soLoQuaHan} <span className="text-lg font-semibold text-slate-400">lô</span>
                        </h3>
                    </div>
                </button>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-green-50 rounded-2xl"><CheckCircle2 size={28} className="text-green-600" /></div></div>
                    <div>
                        <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Đơn Hoàn Thành</p>
                        <h3 className="text-2xl lg:text-3xl font-black text-slate-800">{stats.donHoanThanh} <span className="text-lg font-semibold text-slate-400">đơn</span></h3>
                    </div>
                </div>
            </div>

            {/* --- KHU VỰC 2: THỐNG KÊ (CÓ NÚT CHUYỂN ĐỔI BẢNG/BIỂU ĐỒ) --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <div className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            {viewMode === "TABLE" ? <TableProperties size={24} className="text-blue-600" /> : <BarChart2 size={24} className="text-blue-600" />}
                            Thống kê luân chuyển hàng hóa
                        </h3>
                        <p className="text-slate-500 mt-1 text-sm">Hiển thị chi tiết số lượng (kg) Nhập - Bán - Hao hụt - Tồn kho</p>
                    </div>
                    
                    {/* Nút Toggle Switch */}
                    <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/60">
                        <button
                            onClick={() => setViewMode("TABLE")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === "TABLE" 
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            }`}
                        >
                            <Table size={16} /> Bảng dữ liệu
                        </button>
                        <button
                            onClick={() => setViewMode("CHART")}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                viewMode === "CHART" 
                                ? "bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/50" 
                                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            }`}
                        >
                            <BarChart2 size={16} /> Biểu đồ cột
                        </button>
                    </div>
                </div>
                
                {/* HIỂN THỊ DẠNG BẢNG */}
                {viewMode === "TABLE" && (
                    <div className="overflow-x-auto max-h-[400px] animate-in fade-in duration-300"> 
                        <table className="w-full text-sm text-left whitespace-nowrap">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0 z-10">
                                <tr>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 rounded-tl-xl">Tên loại cá</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-blue-600">Đã nhập (kg)</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-green-600">Đã bán (kg)</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-red-500">Hao hụt (kg)</th>
                                    <th className="py-4 px-6 font-semibold border-b border-slate-200 text-right text-purple-600 bg-purple-50 rounded-tr-xl">Tồn kho (kg)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {processedFishData.map((row, index) => (
                                    <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-4 px-6 font-bold text-slate-700">{row.name}</td>
                                        <td className="py-4 px-6 text-right font-medium text-slate-600">{row.nhap.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-bold text-slate-800">{row.ban.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-medium text-slate-500">{row.haohut.toLocaleString()}</td>
                                        <td className="py-4 px-6 text-right font-bold text-purple-700 bg-purple-50/30">{row.tonKho.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* HIỂN THỊ DẠNG BIỂU ĐỒ */}
                {viewMode === "CHART" && (
                    <div className="h-[400px] w-full animate-in fade-in duration-300">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={processedFishData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#475569', fontSize: 13, fontWeight: 500 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontWeight: 500 }} />
                                <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#f1f5f9' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                
                                <Bar dataKey="nhap" name="Đã nhập" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="ban" name="Đã bán" fill="#10b981" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="haohut" name="Hao hụt" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={12} />
                                <Bar dataKey="tonKho" name="Tồn kho" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={12} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                )}
            </div>

            {/* --- KHU VỰC 3: GỢI Ý NHẬP HÀNG --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
                <div className="mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h3 className="font-bold text-xl text-slate-800 flex items-center gap-2">
                            <PackagePlus size={24} className="text-blue-600" />
                            Cảnh báo & Đề xuất nhập hàng
                        </h3>
                        <p className="text-slate-500 mt-1 text-sm">Danh sách các mặt hàng đang bán chạy nhưng tồn kho ở mức thấp</p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-5 rounded-xl transition-colors shadow-sm text-sm">
                        Lập phiếu nhập kho hàng loạt
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    {restockSuggestions.map((item, index) => (
                        <div key={index} className={`p-5 border rounded-2xl transition-all hover:shadow-md ${item.mucDo === 'GAP' ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-slate-50'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h4 className="font-bold text-slate-800 text-lg">{item.name}</h4>
                                {item.mucDo === 'GAP' && (
                                    <span className="flex items-center gap-1 text-[10px] uppercase font-bold px-2 py-1 bg-red-100 text-red-600 rounded-full">
                                        <AlertCircle size={12} /> Nhập Gấp
                                    </span>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Tồn hiện tại</p>
                                    <p className="font-semibold text-slate-700">{item.tonKho} kg</p>
                                </div>
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Tốc độ bán</p>
                                    <p className="font-semibold text-slate-700">{item.tocDoBan} kg/ngày</p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-200/60 flex items-end justify-between">
                                <div>
                                    <p className="text-slate-500 text-xs mb-1">Đề xuất nhập</p>
                                    <p className="font-black text-blue-600 text-xl">+{item.deXuatNhap} kg</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-slate-400 text-[10px] uppercase mb-1">Dự toán</p>
                                    <p className="font-bold text-slate-800 text-sm">{formatCurrency(item.giaDapUng)}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </AdminLayout>
    );
}