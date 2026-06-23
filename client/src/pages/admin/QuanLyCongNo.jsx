import React, { useState, useEffect } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

function trangThaiCongNo(khach) {
    if (khach.dangBiKhoa) return { label: "Bị khóa", badge: "bg-slate-800 text-white border-slate-800" };
    const congno = Number(khach.congnohientai || 0);
    const hanmuc = Number(khach.hanmuctindung || 0);
    if (hanmuc <= 0) return { label: "Bình thường", badge: "bg-slate-50 text-slate-500 border-slate-200" };
    const phanTram = (congno / hanmuc) * 100;
    if (phanTram >= 100) return { label: "Nguy hiểm", badge: "bg-red-50 text-red-700 border-red-200" };
    if (phanTram >= 80) return { label: "Cảnh báo", badge: "bg-yellow-50 text-yellow-700 border-yellow-200" };
    return { label: "Bình thường", badge: "bg-green-50 text-green-700 border-green-200" };
}

export default function QuanLyCongNo() {
    const { showToast } = useToast();

    const [danhSach, setDanhSach] = useState([]);
    const [loading, setLoading] = useState(true);
    const [khachChuaMoCongNo, setKhachChuaMoCongNo] = useState([]);

    const [hanMucModal, setHanMucModal] = useState(null); // { idtaikhoan, ten, hanmuctindung, laMoMoi }
    const [hanMucInput, setHanMucInput] = useState("");

    const [dieuChinhModal, setDieuChinhModal] = useState(null); // { idtaikhoan, ten }
    const [dieuChinhForm, setDieuChinhForm] = useState({ sotien: "", tang: true, ghichu: "" });

    const [moKhoaModal, setMoKhoaModal] = useState(null); // { idtaikhoan, ten }
    const [moKhoaGhiChu, setMoKhoaGhiChu] = useState("");

    const [lichSuModal, setLichSuModal] = useState(null); // { idtaikhoan, ten }
    const [lichSuData, setLichSuData] = useState([]);
    const [loadingLichSu, setLoadingLichSu] = useState(false);

    const [submitting, setSubmitting] = useState(false);

    const fetchDanhSach = () => {
        setLoading(true);
        api.get("/CongNo")
            .then(res => setDanhSach(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách công nợ!", "error"))
            .finally(() => setLoading(false));
    };

    const fetchKhachChuaMoCongNo = () => {
        api.get("/tai-khoan")
            .then(res => {
                const all = res.data.result || [];
                setKhachChuaMoCongNo(all.filter(t => t.vaitro === "CUSTOMER" && t.hanmuctindung == null));
            })
            .catch(() => {});
    };

    useEffect(() => {
        fetchDanhSach();
        fetchKhachChuaMoCongNo();
    }, []);

    const openMoCongNoMoi = () => {
        setHanMucModal({ idtaikhoan: "", ten: "", laMoMoi: true });
        setHanMucInput("");
    };

    const openSuaHanMuc = (khach) => {
        setHanMucModal({ idtaikhoan: khach.idtaikhoan, ten: `${khach.ho} ${khach.ten}`, laMoMoi: false });
        setHanMucInput(String(khach.hanmuctindung ?? ""));
    };

    const handleSubmitHanMuc = async () => {
        if (!hanMucModal.idtaikhoan) { showToast("Vui lòng chọn khách hàng!", "error"); return; }
        const han = Number(hanMucInput);
        if (!han || han <= 0) { showToast("Hạn mức tín dụng phải lớn hơn 0!", "error"); return; }

        setSubmitting(true);
        try {
            await api.put(`/CongNo/${hanMucModal.idtaikhoan}/han-muc`, { hanmuctindung: han });
            showToast("Cập nhật hạn mức tín dụng thành công!", "success");
            setHanMucModal(null);
            fetchDanhSach();
            fetchKhachChuaMoCongNo();
        } catch (err) {
            showToast(err.response?.data?.message || "Thao tác thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openDieuChinh = (khach) => {
        setDieuChinhModal({ idtaikhoan: khach.idtaikhoan, ten: `${khach.ho} ${khach.ten}` });
        setDieuChinhForm({ sotien: "", tang: true, ghichu: "" });
    };

    const handleSubmitDieuChinh = async () => {
        const sotien = Number(dieuChinhForm.sotien);
        if (!sotien || sotien <= 0) { showToast("Số tiền phải lớn hơn 0!", "error"); return; }
        if (!dieuChinhForm.ghichu.trim()) { showToast("Vui lòng nhập lý do điều chỉnh!", "error"); return; }

        setSubmitting(true);
        try {
            await api.put(`/CongNo/${dieuChinhModal.idtaikhoan}/dieu-chinh`, {
                sotien, tang: dieuChinhForm.tang, ghichu: dieuChinhForm.ghichu.trim(),
            });
            showToast("Điều chỉnh công nợ thành công!", "success");
            setDieuChinhModal(null);
            fetchDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Thao tác thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openMoKhoa = (khach) => {
        setMoKhoaModal({ idtaikhoan: khach.idtaikhoan, ten: `${khach.ho} ${khach.ten}` });
        setMoKhoaGhiChu("");
    };

    const handleSubmitMoKhoa = async () => {
        if (!moKhoaGhiChu.trim()) { showToast("Vui lòng nhập lý do mở khóa!", "error"); return; }

        setSubmitting(true);
        try {
            await api.put(`/CongNo/${moKhoaModal.idtaikhoan}/mo-khoa`, { ghichu: moKhoaGhiChu.trim() });
            showToast("Mở khóa đặt hàng thành công!", "success");
            setMoKhoaModal(null);
            fetchDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Thao tác thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openLichSu = (khach) => {
        setLichSuModal({ idtaikhoan: khach.idtaikhoan, ten: `${khach.ho} ${khach.ten}` });
        setLoadingLichSu(true);
        api.get(`/CongNo/${khach.idtaikhoan}/lich-su`)
            .then(res => setLichSuData(res.data.result || []))
            .catch(() => showToast("Không thể tải lịch sử công nợ!", "error"))
            .finally(() => setLoadingLichSu(false));
    };

    const LOAI_LABEL = { TANG: "Tăng nợ", GIAM: "Giảm nợ", DIEU_CHINH: "Điều chỉnh" };

    return (
        <AdminLayout title="Quản Lý Công Nợ">
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-500 text-sm">Theo dõi công nợ khách sỉ mua hàng trả sau theo hạn mức tín dụng.</p>
                <button
                    onClick={openMoCongNoMoi}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl text-sm hover:bg-cyan-700"
                >
                    + Mở công nợ cho khách mới
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Khách hàng</th>
                                <th className="p-4">SĐT</th>
                                <th className="p-4 text-right">Hạn mức</th>
                                <th className="p-4 text-right">Công nợ hiện tại</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : danhSach.length > 0 ? (
                                danhSach.map((khach) => {
                                    const trangThai = trangThaiCongNo(khach);
                                    const congno = Number(khach.congnohientai || 0);
                                    return (
                                        <tr key={khach.idtaikhoan} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-bold text-slate-800">{khach.ho} {khach.ten}</p>
                                                <p className="text-xs text-slate-400">{khach.email}</p>
                                            </td>
                                            <td className="p-4 font-mono text-slate-500">{khach.sodienthoai || "-"}</td>
                                            <td className="p-4 text-right font-medium">{Number(khach.hanmuctindung).toLocaleString()}đ</td>
                                            <td className="p-4 text-right font-bold">
                                                {congno < 0 ? (
                                                    <span className="text-green-600">{Math.abs(congno).toLocaleString()}đ (dư trả trước)</span>
                                                ) : (
                                                    <span className="text-red-600">{congno.toLocaleString()}đ</span>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-md text-xs font-bold border inline-block ${trangThai.badge}`}>
                                                    {trangThai.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                                    <button onClick={() => openSuaHanMuc(khach)} className="text-cyan-600 font-semibold text-xs hover:underline">Sửa hạn mức</button>
                                                    <button onClick={() => openDieuChinh(khach)} className="text-slate-600 font-semibold text-xs hover:underline">Điều chỉnh nợ</button>
                                                    {khach.dangBiKhoa && (
                                                        <button onClick={() => openMoKhoa(khach)} className="text-red-600 font-semibold text-xs hover:underline">Mở khóa</button>
                                                    )}
                                                    <button onClick={() => openLichSu(khach)} className="text-slate-400 font-semibold text-xs hover:underline">Lịch sử</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Chưa có khách hàng nào mở công nợ.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL: Mở mới / Sửa hạn mức */}
            {hanMucModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {hanMucModal.laMoMoi ? "Mở công nợ cho khách mới" : `Sửa hạn mức — ${hanMucModal.ten}`}
                            </h3>
                        </div>
                        <div className="p-6 space-y-4">
                            {hanMucModal.laMoMoi && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Chọn khách hàng</label>
                                    <select
                                        className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                        value={hanMucModal.idtaikhoan}
                                        onChange={e => setHanMucModal({ ...hanMucModal, idtaikhoan: e.target.value })}
                                    >
                                        <option value="">-- Chọn khách hàng --</option>
                                        {khachChuaMoCongNo.map(k => (
                                            <option key={k.idtaikhoan} value={k.idtaikhoan}>{k.ho} {k.ten} — {k.email}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Hạn mức tín dụng (đ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                    value={hanMucInput}
                                    onChange={e => setHanMucInput(e.target.value)}
                                    placeholder="Ví dụ: 5000000"
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setHanMucModal(null)} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">Hủy</button>
                            <button onClick={handleSubmitHanMuc} disabled={submitting} className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}>
                                {submitting ? "Đang xử lý..." : "Lưu"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Điều chỉnh công nợ thủ công */}
            {dieuChinhModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Điều chỉnh công nợ — {dieuChinhModal.ten}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDieuChinhForm({ ...dieuChinhForm, tang: true })}
                                    className={`flex-1 p-2.5 rounded-xl border text-sm font-bold ${dieuChinhForm.tang ? "bg-red-600 text-white border-red-600" : "border-slate-200 text-slate-600"}`}
                                >
                                    Cộng nợ
                                </button>
                                <button
                                    onClick={() => setDieuChinhForm({ ...dieuChinhForm, tang: false })}
                                    className={`flex-1 p-2.5 rounded-xl border text-sm font-bold ${!dieuChinhForm.tang ? "bg-green-600 text-white border-green-600" : "border-slate-200 text-slate-600"}`}
                                >
                                    Trừ nợ
                                </button>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Số tiền (đ)</label>
                                <input
                                    type="number"
                                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-sm outline-none"
                                    value={dieuChinhForm.sotien}
                                    onChange={e => setDieuChinhForm({ ...dieuChinhForm, sotien: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lý do (bắt buộc)</label>
                                <textarea
                                    className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
                                    placeholder="Chiết khấu cuối tháng, bồi thường, làm tròn số lẻ..."
                                    value={dieuChinhForm.ghichu}
                                    onChange={e => setDieuChinhForm({ ...dieuChinhForm, ghichu: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setDieuChinhModal(null)} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">Hủy</button>
                            <button onClick={handleSubmitDieuChinh} disabled={submitting} className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}>
                                {submitting ? "Đang xử lý..." : "Xác nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Mở khóa thủ công */}
            {moKhoaModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Mở khóa đặt hàng — {moKhoaModal.ten}</h3>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Lý do (bắt buộc)</label>
                                <textarea
                                    className="w-full p-2.5 border border-slate-200 rounded-xl resize-none h-20 text-sm outline-none"
                                    placeholder="Khách đã hứa thanh toán, trường hợp đặc biệt..."
                                    value={moKhoaGhiChu}
                                    onChange={e => setMoKhoaGhiChu(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-200 flex justify-end gap-3">
                            <button onClick={() => setMoKhoaModal(null)} disabled={submitting} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 text-sm">Hủy</button>
                            <button onClick={handleSubmitMoKhoa} disabled={submitting} className={`px-6 py-2.5 font-bold rounded-xl text-sm ${submitting ? "bg-slate-200 text-slate-400" : "bg-cyan-600 text-white hover:bg-cyan-700"}`}>
                                {submitting ? "Đang xử lý..." : "Xác nhận mở khóa"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Lịch sử biến động công nợ */}
            {lichSuModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">Lịch sử công nợ — {lichSuModal.ten}</h3>
                            <button onClick={() => setLichSuModal(null)} className="text-slate-400 hover:text-red-500">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="overflow-y-auto flex-1">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-100 text-slate-500 font-bold text-xs uppercase sticky top-0">
                                    <tr>
                                        <th className="p-3">Thời gian</th>
                                        <th className="p-3">Loại</th>
                                        <th className="p-3 text-right">Số tiền</th>
                                        <th className="p-3 text-right">Số dư sau</th>
                                        <th className="p-3">Người thực hiện</th>
                                        <th className="p-3">Ghi chú</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingLichSu ? (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                                    ) : lichSuData.length > 0 ? (
                                        lichSuData.map(ls => (
                                            <tr key={ls.idlichsucongno} className="hover:bg-slate-50/50">
                                                <td className="p-3 text-slate-500 whitespace-nowrap">{new Date(ls.ngaytao).toLocaleString('vi-VN')}</td>
                                                <td className="p-3 font-bold">{LOAI_LABEL[ls.loaithaydoi] || ls.loaithaydoi}</td>
                                                <td className="p-3 text-right">{Number(ls.sotien).toLocaleString()}đ</td>
                                                <td className="p-3 text-right font-bold">{Number(ls.sodusaukhithaydoi).toLocaleString()}đ</td>
                                                <td className="p-3 text-slate-500">{ls.tenNguoiThucHien || "Hệ thống"}</td>
                                                <td className="p-3 text-slate-500">{ls.ghichu || "-"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Chưa có biến động nào.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
