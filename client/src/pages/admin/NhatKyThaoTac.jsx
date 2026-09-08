import React, { useState, useEffect, useCallback } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/Pagination";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";

// Nhãn tiếng Việt cho hành động. Hành động chưa có trong map thì hiện thẳng mã gốc —
// không cần cập nhật map mỗi lần gắn @GhiNhatKy vào một service mới.
const HANH_DONG_LABELS = {
    SUA_KHOI_LUONG_THUC_TE: "Sửa khối lượng thực tế",
    DOI_TRANG_THAI_DON_HANG: "Đổi trạng thái đơn hàng",
    DIEU_CHINH_CONG_NO: "Điều chỉnh công nợ khách",
    DOI_HAN_MUC_TIN_DUNG: "Đổi hạn mức tín dụng",
    MO_KHOA_DAT_HANG: "Mở khóa đặt hàng",
    GHI_NHAN_THANH_TOAN_THU_CONG: "Ghi nhận thanh toán thủ công",
    XAC_NHAN_THANH_TOAN_THU_CONG: "Xác nhận thanh toán thủ công",
    XAC_NHAN_THANH_TOAN_PHIEU_NHAP: "Xác nhận trả đủ phiếu nhập",
    THANH_TOAN_NHA_CUNG_CAP: "Thanh toán nhà cung cấp",
    DIEU_CHINH_CONG_NO_NCC: "Điều chỉnh công nợ NCC",
    THEM_NHA_CUNG_CAP: "Thêm nhà cung cấp",
    SUA_NHA_CUNG_CAP: "Sửa nhà cung cấp",
    THEM_BANG_GIA: "Thêm bảng giá",
    XOA_BANG_GIA: "Xóa bảng giá",
};

const dinhDangJson = (chuoi) => {
    if (!chuoi) return null;
    try {
        return JSON.stringify(JSON.parse(chuoi), null, 2);
    } catch {
        return chuoi; // không phải JSON hợp lệ thì hiện nguyên văn, đừng nuốt mất dữ liệu
    }
};

export default function NhatKyThaoTac() {
    const { showToast } = useToast();

    const [duLieu, setDuLieu] = useState({ content: [], totalPages: 0, totalElements: 0 });
    const [loading, setLoading] = useState(true);
    const [boLoc, setBoLoc] = useState({ danhSachBang: [], danhSachHanhDong: [] });
    const [filter, setFilter] = useState({ tenbang: "", hanhdong: "", tuNgay: "", denNgay: "" });
    const [currentPage, setCurrentPage] = useState(1);
    const [dongMoRong, setDongMoRong] = useState(null);
    const pageSize = 20;

    useEffect(() => {
        api.get("/NhatKyThaoTac/bo-loc")
            .then(res => setBoLoc(res.data.result || { danhSachBang: [], danhSachHanhDong: [] }))
            .catch(() => {});
    }, []);

    const fetchDuLieu = useCallback(() => {
        setLoading(true);
        api.get("/NhatKyThaoTac", {
            params: {
                tenbang: filter.tenbang || undefined,
                hanhdong: filter.hanhdong || undefined,
                tuNgay: filter.tuNgay || undefined,
                denNgay: filter.denNgay || undefined,
                page: currentPage - 1,
                size: pageSize,
            },
        })
            .then(res => setDuLieu(res.data.result || { content: [], totalPages: 0, totalElements: 0 }))
            .catch(() => showToast("Không tải được nhật ký thao tác!", "error"))
            .finally(() => setLoading(false));
    }, [filter, currentPage, showToast]);

    useEffect(() => { fetchDuLieu(); }, [fetchDuLieu]);

    const doiFilter = (truong, giaTri) => {
        setFilter(prev => ({ ...prev, [truong]: giaTri }));
        setCurrentPage(1);
    };

    return (
        <AdminLayout title="Nhật ký thao tác">
            <div className="bg-cyan-50 border border-cyan-200 rounded-xl px-4 py-3 mb-6 text-xs text-cyan-900">
                Nhật ký chỉ ghi thêm — không có chức năng sửa hoặc xóa, kể cả với tài khoản quản trị.
                Ghi nhận các thao tác tác động trực tiếp tới tiền và quyền: sửa khối lượng thực tế,
                điều chỉnh công nợ, đổi hạn mức, xác nhận thanh toán, sửa bảng giá.
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Bảng</label>
                    <select
                        value={filter.tenbang}
                        onChange={e => doiFilter("tenbang", e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                    >
                        <option value="">Tất cả bảng</option>
                        {boLoc.danhSachBang.map(bang => <option key={bang} value={bang}>{bang}</option>)}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Hành động</label>
                    <select
                        value={filter.hanhdong}
                        onChange={e => doiFilter("hanhdong", e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                    >
                        <option value="">Tất cả hành động</option>
                        {boLoc.danhSachHanhDong.map(hd => (
                            <option key={hd} value={hd}>{HANH_DONG_LABELS[hd] || hd}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Từ ngày</label>
                    <input
                        type="date"
                        value={filter.tuNgay}
                        onChange={e => doiFilter("tuNgay", e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                </div>
                <div>
                    <label className="text-xs font-bold text-slate-600 uppercase">Đến ngày</label>
                    <input
                        type="date"
                        value={filter.denNgay}
                        onChange={e => doiFilter("denNgay", e.target.value)}
                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[900px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Thời gian</th>
                                <th className="p-4">Người thực hiện</th>
                                <th className="p-4">Hành động</th>
                                <th className="p-4">Đối tượng</th>
                                <th className="p-4">IP</th>
                                <th className="p-4 text-center w-24">Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400">Đang tải...</td></tr>
                            ) : duLieu.content.length > 0 ? (
                                duLieu.content.map(dong => (
                                    <React.Fragment key={dong.idnhatky}>
                                        <tr className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4 text-xs text-slate-500">
                                                {dong.thoigian ? new Date(dong.thoigian).toLocaleString("vi-VN") : "-"}
                                            </td>
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800">{dong.tenNguoiThucHien}</p>
                                                <p className="text-xs text-slate-400">{dong.emailNguoiThucHien || ""}</p>
                                            </td>
                                            <td className="p-4">
                                                <span className="px-2 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                                                    {HANH_DONG_LABELS[dong.hanhdong] || dong.hanhdong}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <p className="text-xs text-slate-600">{dong.tenbang}</p>
                                                <p className="text-xs font-mono text-slate-400">
                                                    {dong.idbanghi ? dong.idbanghi.slice(0, 12) : "-"}
                                                </p>
                                            </td>
                                            <td className="p-4 font-mono text-xs text-slate-400">{dong.diachiip || "-"}</td>
                                            <td className="p-4 text-center">
                                                <button
                                                    onClick={() => setDongMoRong(dongMoRong === dong.idnhatky ? null : dong.idnhatky)}
                                                    className="px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer"
                                                >
                                                    {dongMoRong === dong.idnhatky ? "Ẩn" : "Xem"}
                                                </button>
                                            </td>
                                        </tr>
                                        {dongMoRong === dong.idnhatky && (
                                            <tr className="bg-slate-50/60">
                                                <td colSpan="6" className="p-4">
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Giá trị cũ</p>
                                                            <pre className="text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                                                                {dinhDangJson(dong.giatricu) || "(không ghi nhận)"}
                                                            </pre>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Dữ liệu thao tác</p>
                                                            <pre className="text-xs bg-white border border-slate-200 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all">
                                                                {dinhDangJson(dong.giatrimoi) || "(không ghi nhận)"}
                                                            </pre>
                                                        </div>
                                                    </div>
                                                    {dong.ghichu && (
                                                        <p className="text-xs text-slate-500 mt-3">Ghi chú: {dong.ghichu}</p>
                                                    )}
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            ) : (
                                <tr><td colSpan="6" className="p-8 text-center text-slate-400 italic">Chưa có thao tác nào được ghi nhận.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && duLieu.totalPages > 1 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <span className="text-xs text-slate-500">Tổng {duLieu.totalElements} bản ghi</span>
                        <Pagination currentPage={currentPage} totalPages={duLieu.totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
