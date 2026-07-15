import { useState, useEffect, useRef } from "react";
import AdminSidebar from "./AdminSidebar";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";

// Nhãn hiển thị cho từng loại thông báo (loai lưu dạng mã ngắn trong DB).
// Loại nào chưa có trong map thì hiện thẳng mã gốc - không cần cập nhật map liên tục.
const LOAI_LABELS = {
    DON_HANG_MOI: "Đơn hàng mới",
    GIAO_THIEU_HANG: "Giao thiếu hàng",
    LO_QUA_HAN: "Lô hàng quá hạn",
    CONG_NO_BI_KHOA: "Công nợ bị khóa",
    CONG_NO_NGUY_HIEM: "Công nợ nguy hiểm",
    CONG_NO_CANH_BAO: "Công nợ cảnh báo",
};

export default function AdminLayout({ children, title = "" }) {
    const navigate = useNavigate();

    const [thongBaoList, setThongBaoList] = useState([]);
    const [soChuaXem, setSoChuaXem] = useState(0);
    const [openDropdown, setOpenDropdown] = useState(false);
    const [filterLoai, setFilterLoai] = useState("");
    const dropdownRef = useRef(null);

    const cacLoaiCoSan = [...new Set(thongBaoList.map(tb => tb.loai).filter(Boolean))];
    const dsThongBaoLoc = filterLoai ? thongBaoList.filter(tb => tb.loai === filterLoai) : thongBaoList;

    useEffect(() => {
        api.get("/ThongBao").then(res => setThongBaoList(res.data.result || [])).catch(() => {});
        api.get("/ThongBao/chua-xem").then(res => setSoChuaXem(res.data.result || 0)).catch(() => {});

        const eventSource = new EventSource(`${import.meta.env.VITE_BE_URL}/ThongBao/subscribe`, { withCredentials: true });
        eventSource.addEventListener("thongbao", (e) => {
            const thongBaoMoi = JSON.parse(e.data);
            setThongBaoList(prev => [thongBaoMoi, ...prev]);
            setSoChuaXem(prev => prev + 1);
        });

        return () => eventSource.close();
    }, []);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setOpenDropdown(false);
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleClickThongBao = async (thongBao) => {
        if (!thongBao.daxem) {
            try {
                await api.put(`/ThongBao/${thongBao.idthongbao}/da-xem`);
                setThongBaoList(prev => prev.map(tb => tb.idthongbao === thongBao.idthongbao ? { ...tb, daxem: true } : tb));
                setSoChuaXem(prev => Math.max(0, prev - 1));
            } catch { /* bỏ qua, vẫn cho điều hướng */ }
        }
        setOpenDropdown(false);
        if (thongBao.link) navigate(thongBao.link);
    };

    const handleDanhDauTatCa = async () => {
        try {
            await api.put("/ThongBao/da-xem-tat-ca");
            setThongBaoList(prev => prev.map(tb => ({ ...tb, daxem: true })));
            setSoChuaXem(0);
        } catch { /* ignore */ }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-body flex selection:bg-cyan-500/20 selection:text-cyan-700">
            <AdminSidebar/>

            <div className="flex-1 flex flex-col transition-all duration-300 ml-64">
                <header className="h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/60 flex items-center justify-between px-8 sticky top-0 z-40">
                    <div className="flex items-center gap-3">
                        <h2 className="text-sm font-bold text-slate-800 tracking-tight uppercase border-l-2 border-cyan-500 pl-3">{title}</h2>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setOpenDropdown(prev => !prev)}
                                className="relative size-9 rounded-xl bg-slate-50 hover:bg-cyan-50 flex items-center justify-center text-slate-500 hover:text-cyan-600 transition-colors ring-1 ring-slate-200 border-none shadow-sm"
                            >
                                <span className="material-symbols-outlined text-lg">notifications</span>
                                {soChuaXem > 0 && (
                                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                                        {soChuaXem > 9 ? "9+" : soChuaXem}
                                    </span>
                                )}
                            </button>

                            {openDropdown && (
                                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 overflow-hidden z-50">
                                    <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                                        <span className="font-bold text-sm text-slate-800">Thông báo</span>
                                        {soChuaXem > 0 && (
                                            <button onClick={handleDanhDauTatCa} className="text-xs font-semibold text-cyan-600 hover:underline">
                                                Đánh dấu đã xem tất cả
                                            </button>
                                        )}
                                    </div>
                                    {cacLoaiCoSan.length > 0 && (
                                        <div className="px-4 py-2 border-b border-slate-100">
                                            <select
                                                value={filterLoai}
                                                onChange={e => setFilterLoai(e.target.value)}
                                                className="w-full text-xs rounded-lg border border-slate-200 py-1.5 px-2 text-slate-600 outline-none focus:ring-2 focus:ring-cyan-500/20"
                                            >
                                                <option value="">Tất cả loại thông báo</option>
                                                {cacLoaiCoSan.map(loai => (
                                                    <option key={loai} value={loai}>{LOAI_LABELS[loai] || loai}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                    <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                                        {dsThongBaoLoc.length > 0 ? (
                                            dsThongBaoLoc.map(tb => (
                                                <button
                                                    key={tb.idthongbao}
                                                    onClick={() => handleClickThongBao(tb)}
                                                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${!tb.daxem ? "bg-cyan-50/40" : ""}`}
                                                >
                                                    <div className="flex items-start gap-2">
                                                        {!tb.daxem && <span className="mt-1.5 size-1.5 rounded-full bg-cyan-500 shrink-0" />}
                                                        <div className="flex-1">
                                                            <p className="text-sm text-slate-700 leading-snug">{tb.noidung}</p>
                                                            <p className="text-xs text-slate-400 mt-1">{new Date(tb.thoigiantao).toLocaleString('vi-VN')}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-sm text-slate-400 italic">
                                                {filterLoai ? "Không có thông báo loại này." : "Chưa có thông báo nào."}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="p-8 flex-1 bg-slate-50/50 text-slate-700">
                    {children}
                </main>
            </div>
        </div>
    );
}
