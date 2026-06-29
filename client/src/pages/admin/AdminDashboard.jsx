import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState("TODAY");
    const [stats, setStats] = useState({
        doanhThu: 0,
        loiNhuan: 0,
        tongDonHang: 0,
        donThanhCong: 0,
        donHuy: 0,
        donVanChuyen: 0,
        tongGiaTriNhap: 0,
        tongGiaTriHaoHut: 0,
        tongSoLuongHaoHut: 0
    });
    const [chartData, setChartData] = useState([]);
    const [supplierReport, setSupplierReport] = useState([]);
    const [loading, setLoading] = useState(false);

    const COLORS = {
        nhap: "#3b82f6",
        xuat: "#22c55e",
        haohut: "#ef4444",
        ton: "#a855f7"
    };

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/Thongke?range=${timeRange}`);
            const result = data.result;

            setStats(result.tongQuan);
            setChartData(result.bieuDo);
            setSupplierReport(result.baoCaoNCC);
        } catch (error) {
            console.error("Lỗi tải thống kê:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, [timeRange]);

    const formatCurrency = (value) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);

    return (
        <AdminLayout title="Bảng Điều Khiển & Thống Kê">

            {/* --- CÁC THẺ KPI (Xếp theo hàng dọc) --- */}
            <div className="flex flex-col gap-4 mb-8 max-w-sm"> {/* Bạn có thể chỉnh max-w-sm hoặc w-80 để kiểm soát độ rộng của cột dọc này */}

                {/* Doanh Thu */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng Doanh Thu</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1.5">{formatCurrency(stats.doanhThu)}</h3>
                </div>

                {/* Nhập hàng */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Giá Trị Nhập</p>
                    <h3 className="text-2xl font-bold text-blue-800 mt-1.5">{formatCurrency(stats.tongGiaTriNhap)}</h3>
                </div>

                {/* Hao hụt */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Giá Trị Hao Hụt</p>
                    <h3 className="text-2xl font-bold text-red-600 mt-1.5">{formatCurrency(stats.tongGiaTriHaoHut)}</h3>
                    <p className="text-xs text-red-400 mt-1 font-medium">Số lượng: {stats.tongSoLuongHaoHut} kg</p>
                </div>

                {/* Đơn hàng */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Tổng Đơn Hàng</p>
                    <h3 className="text-2xl font-bold text-purple-800 mt-1.5">{stats.tongDonHang}</h3>
                    <div className="flex flex-col gap-1 mt-2 text-xs font-semibold">
                        <span className="text-green-600">Thành công: {stats.donThanhCong}</span>
                        <span className="text-orange-500">Vận chuyển: {stats.donVanChuyen}</span>
                        <span className="text-red-500">Hủy: {stats.donHuy}</span>
                    </div>
                </div>

            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">
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

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800 mb-6">
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