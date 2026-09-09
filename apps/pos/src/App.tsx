import { useEffect } from 'react';
import { NavLink, Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import BangDongHang from './pages/BangDongHang.js';
import BangGia from './pages/BangGia.js';
import DatHang from './pages/DatHang.js';
import DonHang from './pages/DonHang.js';
import KhachHang from './pages/KhachHang.js';
import ThongKe from './pages/ThongKe.js';

const TAB = [
  { to: '/dat-hang', nhan: 'Đặt hàng', phim: 'F1' },
  { to: '/dong-hang', nhan: 'Đóng hàng', phim: 'F2' },
  { to: '/don-hang', nhan: 'Đơn hàng', phim: 'F3' },
  { to: '/thong-ke', nhan: 'Thống kê', phim: 'F4' },
  { to: '/bang-gia', nhan: 'Bảng giá', phim: 'F6' },
  { to: '/khach-hang', nhan: 'Khách hàng', phim: 'F7' },
];

export default function App() {
  const dieuHuong = useNavigate();

  // Phím tắt F1–F7. Máy quầy có thể dùng cảm ứng, nhưng bàn phím vật lý luôn
  // nhanh hơn và không bị nước làm loạn — nên giữ song song cả hai.
  useEffect(() => {
    function bam(e: KeyboardEvent) {
      const tab = TAB.find((t) => t.phim === e.key);
      if (!tab) return;
      e.preventDefault();
      dieuHuong(tab.to);
    }
    window.addEventListener('keydown', bam);
    return () => window.removeEventListener('keydown', bam);
  }, [dieuHuong]);

  return (
    <div className="flex h-full flex-col">
      <header className="flex shrink-0 flex-wrap items-center gap-1 border-b border-slate-300 bg-white px-4">
        <span className="mr-4 py-3 text-base font-bold tracking-tight text-slate-900">
          POS Vựa Cá
        </span>

        {TAB.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              [
                'border-b-2 px-4 py-3 text-sm font-semibold transition',
                isActive
                  ? 'border-cyan-600 text-cyan-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800',
              ].join(' ')
            }
          >
            {t.nhan}
            <span className="ml-2 text-[11px] font-normal text-slate-400">{t.phim}</span>
          </NavLink>
        ))}

        <span className="ml-auto rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
          Dữ liệu mẫu trong bộ nhớ — chưa nối SQLite
        </span>
      </header>

      <main className="min-h-0 flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<Navigate to="/dat-hang" replace />} />
          <Route path="/dat-hang" element={<DatHang />} />
          <Route path="/dong-hang" element={<BangDongHang />} />
          <Route path="/don-hang" element={<DonHang />} />
          <Route path="/thong-ke" element={<ThongKe />} />
          <Route path="/bang-gia" element={<BangGia />} />
          <Route path="/khach-hang" element={<KhachHang />} />
        </Routes>
      </main>
    </div>
  );
}
