import { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import BaoCaoNhaCungCap from "./components/BaoCaoNhaCungCap";
import BieuDoKinhDoanh from "./components/BieuDoKinhDoanh";
import CumTheThongKe from "./components/CumTheThongKe";

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
    tongSoLuongHaoHut: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [supplierReport, setSupplierReport] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/Thongke?range=${timeRange}`);
        setStats(data.result.tongQuan);
        setChartData(data.result.bieuDo);
        setSupplierReport(data.result.baoCaoNCC);
      } catch (error) {
        console.error("Lỗi tải thống kê:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [timeRange]);

  return (
    <AdminLayout title="Bảng Điều Khiển & Thống Kê">
      <CumTheThongKe stats={stats} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <BieuDoKinhDoanh chartData={chartData} />
        <BaoCaoNhaCungCap supplierReport={supplierReport} />
      </div>
    </AdminLayout>
  );
}
