import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { fetchCoXacThuc } from "../../utils/fetchAPI";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState("TODAY"); // TODAY, WEEK, MONTH, YEAR
    const [stats, setStats] = useState({
        doanhThu: 0,
        loiNhuan: 0, // Tạm tính = Doanh thu - Giá vốn nhập - Giá trị hao hụt
        tongDonHang: 0,
        donThanhCong: 0,
        donHuy: 0,
        donVanChuyen: 0,
        tongGiaTriNhap: 0,
        tongGiaTriHaoHut: 0,
        tongSoLuongHaoHut: 0
    });
    const [chartData, setChartData] = useState([]); // Dữ liệu biểu đồ Nhập/Xuất/Hao hụt
    const [supplierReport, setSupplierReport] = useState([]); // Báo cáo nhà cung cấp
    const [loading, setLoading] = useState(false);

    // --- CẤU HÌNH MÀU SẮC ---
    const COLORS = {
        nhap: "#3b82f6",   // Xanh dương (Blue)
        xuat: "#22c55e",   // Xanh lá (Green - Bán được)
        haohut: "#ef4444", // Đỏ (Red - Mất mát)
        ton: "#a855f7"     // Tím (Purple)
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            // Gọi API thống kê từ Backend (Sẽ viết ở Phần 2)
            // query param: ?range=TODAY hoặc ?range=MONTH...
            const res = await fetchCoXacThuc(`/Thongke?range=${timeRange}`);
            
            if (res.ok) {
                const data = await res.json();
                const result = data.result;

                setStats(result.tongQuan);
                setChartData(result.bieuDo);
                setSupplierReport(result.baoCaoNCC);
            }
        } catch (error) {
            console.error("Lỗi tải thống kê:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    // Format tiền tệ
    const formatCurrency = (value) => 
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    return (
        <AdminLayout title="Bảng Điều Khiển & Thống Kê">
            
            {/* --- 1. BỘ LỌC THỜI GIAN --- */}
            <div className="flex justify-end mb-6">
                <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
                    {[
                        { id: 'TODAY', label: 'Hôm nay' },
                        { id: 'WEEK', label: 'Tuần này' },
                        { id: 'MONTH', label: 'Tháng này' },
                        { id: 'YEAR', label: 'Năm nay' }
                    ].map((t) => (
                        <button
                            key={t.id}
                            onClick={() => setTimeRange(t.id)}
                            className={`px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                                timeRange === t.id 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-slate-500 hover:bg-slate-50'
                            }`}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* --- 2. CÁC THẺ KPI (Tổng quan) --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Doanh Thu */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase">Tổng Doanh Thu</p>
                            <h3 className="text-2xl font-bold text-slate-800 mt-2">{formatCurrency(stats.doanhThu)}</h3>
                        </div>
                        <div className="p-3 bg-green-100 text-green-600 rounded-xl">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                </div>

                {/* Nhập hàng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase">Giá Trị Nhập</p>
                            <h3 className="text-2xl font-bold text-blue-800 mt-2">{formatCurrency(stats.tongGiaTriNhap)}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <span className="material-symbols-outlined">input</span>
                        </div>
                    </div>
                </div>

                {/* Hao hụt (Mất mát) */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase">Giá Trị Hao Hụt</p>
                            <h3 className="text-2xl font-bold text-red-600 mt-2">{formatCurrency(stats.tongGiaTriHaoHut)}</h3>
                            <p className="text-xs text-red-400 mt-1">SL: {stats.tongSoLuongHaoHut} kg</p>
                        </div>
                        <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                            <span className="material-symbols-outlined">trending_down</span>
                        </div>
                    </div>
                </div>

                {/* Đơn hàng */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-slate-500 text-sm font-bold uppercase">Tổng Đơn Hàng</p>
                            <h3 className="text-2xl font-bold text-purple-800 mt-2">{stats.tongDonHang}</h3>
                            <div className="flex gap-2 mt-2 text-xs font-medium">
                                <span className="text-green-600">✔ {stats.donThanhCong}</span>
                                <span className="text-orange-500">✈ {stats.donVanChuyen}</span>
                                <span className="text-red-500">✖ {stats.donHuy}</span>
                            </div>
                        </div>
                        <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- 3. BIỂU ĐỒ & BÁO CÁO CHI TIẾT --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* BIỂU ĐỒ HOẠT ĐỘNG KINH DOANH (Cột Nhập/Xuất/Tồn/Hao hụt) */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-600">bar_chart</span>
                        Hoạt động kinh doanh (Kg)
                    </h3>
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip formatter={(value) => `${value} kg`} />
                                <Legend />
                                <Bar dataKey="nhap" name="Nhập hàng" fill={COLORS.nhap} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="xuat" name="Xuất bán" fill={COLORS.xuat} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="haohut" name="Hao hụt" fill={COLORS.haohut} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* BÁO CÁO NHẬP HÀNG THEO NHÀ CUNG CẤP */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-orange-600">local_shipping</span>
                        Nhập theo Nhà cung cấp
                    </h3>
                    <div className="overflow-y-auto max-h-[350px] pr-2">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                <tr>
                                    <th className="py-3 px-2">NCC</th>
                                    <th className="py-3 px-2 text-right">SL (Kg)</th>
                                    <th className="py-3 px-2 text-right">Giá trị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplierReport.length > 0 ? supplierReport.map((item, index) => (
                                    <tr key={index}>
                                        <td className="py-3 px-2 font-medium text-slate-700">{item.tenNCC}</td>
                                        <td className="py-3 px-2 text-right text-blue-600 font-bold">{item.soLuong}</td>
                                        <td className="py-3 px-2 text-right text-slate-600">{formatCurrency(item.giaTri)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="text-center py-4 text-slate-400">Không có dữ liệu nhập</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}