import { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

const fmt = (val) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(val || 0);

const TIME_RANGES = [
    { key: "TODAY",      label: "Hôm nay" },
    { key: "THIS_WEEK",  label: "Tuần này" },
    { key: "THIS_MONTH", label: "Tháng này" },
];

const CHART_COLORS = { nhap: "#0891b2", xuat: "#16a34a", haohut: "#dc2626" };

function KpiCard({ label, value, sub, valueColor = "text-slate-800" }) {
    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{label}</p>
            <p className={`text-2xl font-bold ${valueColor}`}>{value}</p>
            {sub && <div className="mt-2 space-y-0.5">{sub}</div>}
        </div>
    );
}

export default function AdminDashboard() {
    const [timeRange, setTimeRange] = useState("TODAY");
    const [stats, setStats] = useState({
        doanhThu: 0, loiNhuan: 0, tongDonHang: 0,
        donThanhCong: 0, donHuy: 0, donVanChuyen: 0,
        tongGiaTriNhap: 0, tongGiaTriHaoHut: 0, tongSoLuongHaoHut: 0
    });
    const [chartData, setChartData] = useState([]);
    const [supplierReport, setSupplierReport] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get(`/Thongke?range=${timeRange}`)
            .then(({ data }) => {
                const r = data.result;
                setStats(r.tongQuan);
                setChartData(r.bieuDo);
                setSupplierReport(r.baoCaoNCC);
            })
            .catch(err => console.error("Lỗi tải thống kê:", err))
            .finally(() => setLoading(false));
    }, [timeRange]);

    return (
        <AdminLayout title="Bảng Điều Khiển">

            {/* ── BỘ LỌC THỜI GIAN ── */}
            <div className="flex items-center justify-between mb-6">
                <p className="text-slate-500 text-sm">Tổng quan hoạt động kinh doanh.</p>
                <div className="flex gap-1.5">
                    {TIME_RANGES.map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setTimeRange(key)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors border cursor-pointer ${
                                timeRange === key
                                    ? "bg-cyan-600 text-white border-cyan-600"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KPI CARDS ── */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6 transition-opacity ${loading ? "opacity-50" : ""}`}>
                <KpiCard
                    label="Tổng Doanh Thu"
                    value={fmt(stats.doanhThu)}
                    valueColor="text-cyan-600"
                />
                <KpiCard
                    label="Giá Trị Nhập Hàng"
                    value={fmt(stats.tongGiaTriNhap)}
                    valueColor="text-cyan-600"
                />
                <KpiCard
                    label="Giá Trị Hao Hụt"
                    value={fmt(stats.tongGiaTriHaoHut)}
                    valueColor="text-red-600"
                    sub={<p className="text-xs text-red-400 font-medium">Số lượng: {stats.tongSoLuongHaoHut} kg</p>}
                />
                <KpiCard
                    label="Tổng Đơn Hàng"
                    value={stats.tongDonHang}
                    sub={
                        <>
                            <p className="text-xs font-bold text-green-600">Thành công: {stats.donThanhCong}</p>
                            <p className="text-xs font-bold text-orange-500">Vận chuyển: {stats.donVanChuyen}</p>
                            <p className="text-xs font-bold text-red-500">Đã hủy: {stats.donHuy}</p>
                        </>
                    }
                />
            </div>

            {/* ── BIỂU ĐỒ + BẢNG NCC ── */}
            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-5 transition-opacity ${loading ? "opacity-50" : ""}`}>

                {/* Biểu đồ */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-700">Hoạt động kinh doanh (Kg)</p>
                    </div>
                    <div className="p-5 h-[320px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                                    formatter={(value) => [`${value} kg`]}
                                />
                                <Legend wrapperStyle={{ fontSize: "12px" }} />
                                <Bar dataKey="nhap" name="Nhập hàng" fill={CHART_COLORS.nhap} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="xuat" name="Xuất bán" fill={CHART_COLORS.xuat} radius={[4, 4, 0, 0]} />
                                <Bar dataKey="haohut" name="Hao hụt" fill={CHART_COLORS.haohut} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bảng nhà cung cấp */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                        <p className="font-bold text-slate-700">Nhập theo Nhà cung cấp</p>
                    </div>
                    <div className="overflow-auto max-h-[370px]">
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold sticky top-0">
                                <tr>
                                    <th className="p-4">Nhà cung cấp</th>
                                    <th className="p-4 text-right">SL (kg)</th>
                                    <th className="p-4 text-right">Giá trị</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {supplierReport.length > 0 ? supplierReport.map((item, i) => (
                                    <tr key={i} className="hover:bg-slate-50/50">
                                        <td className="p-4 font-bold text-slate-900">{item.tenNCC}</td>
                                        <td className="p-4 text-right font-bold text-cyan-600">{item.soLuong}</td>
                                        <td className="p-4 text-right text-slate-600">{fmt(item.giaTri)}</td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="3" className="p-8 text-center text-slate-400 italic">Không có dữ liệu.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </AdminLayout>
    );
}
