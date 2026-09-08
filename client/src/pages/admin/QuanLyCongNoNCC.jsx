import React, { useState, useEffect, useMemo } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import Pagination from "../../components/Pagination";
import api from "../../config/axios";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../context/AuthContext";
import { useConfirm } from "../../context/ConfirmContext";

const dinhDangTien = (giaTri) => Number(giaTri || 0).toLocaleString("vi-VN");
const dinhDangNgay = (giaTri) => (giaTri ? new Date(giaTri).toLocaleDateString("vi-VN") : "-");

// Ngược với phía khách hàng: ở đây số dương nghĩa là VỰA đang nợ nhà cung cấp.
function trangThaiNo(ncc) {
    const congNo = Number(ncc.congnophaitra || 0);
    if (congNo < 0) return { label: "Trả dư", badge: "bg-blue-50 text-blue-700 border-blue-200" };
    if (congNo === 0) return { label: "Không nợ", badge: "bg-slate-100 text-slate-500 border-slate-300" };
    if (ncc.daQuaHan) return { label: "Quá hạn", badge: "bg-red-50 text-red-700 border-red-200" };
    return { label: "Đang nợ", badge: "bg-amber-50 text-amber-700 border-amber-200" };
}

export default function QuanLyCongNoNCC() {
    const { showToast } = useToast();
    const { confirm } = useConfirm();
    const { user } = useAuth();
    const isAdmin = user?.vaitro === "ADMIN";

    const [danhSach, setDanhSach] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;
    const [submitting, setSubmitting] = useState(false);

    const [thanhToanModal, setThanhToanModal] = useState(null);
    const [phieuNhapList, setPhieuNhapList] = useState([]);
    const [thanhToanForm, setThanhToanForm] = useState({ sotien: "", idphieunhap: "", hinhthuc: "TIEN_MAT", ghichu: "" });

    const [dieuChinhModal, setDieuChinhModal] = useState(null);
    const [dieuChinhForm, setDieuChinhForm] = useState({ sotien: "", tang: true, ghichu: "" });

    const [thongTinModal, setThongTinModal] = useState(null);
    const [thongTinForm, setThongTinForm] = useState({});

    const [lichSuModal, setLichSuModal] = useState(null);
    const [lichSuData, setLichSuData] = useState([]);
    const [loadingLichSu, setLoadingLichSu] = useState(false);

    const fetchDanhSach = () => {
        setLoading(true);
        api.get("/CongNoNCC")
            .then(res => setDanhSach(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách công nợ nhà cung cấp!", "error"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchDanhSach(); }, []);

    const processedDanhSach = useMemo(() => {
        const tuKhoa = searchTerm.trim().toLowerCase();
        if (!tuKhoa) return danhSach;
        return danhSach.filter(ncc =>
            [ncc.tenncc, ncc.sodienthoai, ncc.email, ncc.nguoilienhe]
                .some(truong => (truong || "").toLowerCase().includes(tuKhoa))
        );
    }, [danhSach, searchTerm]);

    const totalPages = Math.ceil(processedDanhSach.length / pageSize);
    const paginated = processedDanhSach.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const tongCongNo = useMemo(
        () => danhSach.reduce((tong, ncc) => tong + Number(ncc.congnophaitra || 0), 0),
        [danhSach]
    );
    const soNccQuaHan = useMemo(() => danhSach.filter(ncc => ncc.daQuaHan).length, [danhSach]);

    const openThanhToan = (ncc) => {
        setThanhToanModal(ncc);
        setThanhToanForm({ sotien: "", idphieunhap: "", hinhthuc: "TIEN_MAT", ghichu: "" });
        setPhieuNhapList([]);
        api.get(`/CongNoNCC/${ncc.idncc}/phieu-nhap`)
            .then(res => setPhieuNhapList((res.data.result || []).filter(p => Number(p.conNo) > 0)))
            .catch(() => showToast("Không tải được danh sách phiếu nhập!", "error"));
    };

    // Chọn một phiếu cụ thể thì mặc định điền đúng số còn nợ của phiếu đó — trường hợp phổ biến nhất.
    const chonPhieu = (idphieunhap) => {
        const phieu = phieuNhapList.find(p => p.idphieunhap === idphieunhap);
        setThanhToanForm(prev => ({
            ...prev,
            idphieunhap,
            sotien: phieu ? String(phieu.conNo) : prev.sotien,
        }));
    };

    const submitThanhToan = async () => {
        const soTien = Number(thanhToanForm.sotien);
        if (!soTien || soTien <= 0) return showToast("Vui lòng nhập số tiền hợp lệ!", "error");

        const accepted = await confirm({
            title: "Ghi nhận thanh toán",
            message: `Ghi nhận đã trả ${dinhDangTien(soTien)} VNĐ cho ${thanhToanModal.tenncc}?`,
            confirmText: "Ghi nhận",
            variant: "primary",
        });
        if (!accepted) return;

        setSubmitting(true);
        try {
            await api.post(`/CongNoNCC/${thanhToanModal.idncc}/thanh-toan`, {
                sotien: soTien,
                idphieunhap: thanhToanForm.idphieunhap || null,
                hinhthuc: thanhToanForm.hinhthuc,
                ghichu: thanhToanForm.ghichu,
            });
            showToast("Đã ghi nhận thanh toán!", "success");
            setThanhToanModal(null);
            fetchDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Ghi nhận thanh toán thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openDieuChinh = (ncc) => {
        setDieuChinhModal(ncc);
        setDieuChinhForm({ sotien: "", tang: true, ghichu: "" });
    };

    const submitDieuChinh = async () => {
        const soTien = Number(dieuChinhForm.sotien);
        if (!soTien || soTien <= 0) return showToast("Vui lòng nhập số tiền hợp lệ!", "error");
        if (!dieuChinhForm.ghichu.trim()) return showToast("Vui lòng nhập lý do điều chỉnh!", "error");

        setSubmitting(true);
        try {
            await api.put(`/CongNoNCC/${dieuChinhModal.idncc}/dieu-chinh`, {
                sotien: soTien,
                tang: dieuChinhForm.tang,
                ghichu: dieuChinhForm.ghichu,
            });
            showToast("Đã điều chỉnh công nợ!", "success");
            setDieuChinhModal(null);
            fetchDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Điều chỉnh thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openThongTin = (ncc) => {
        setThongTinModal(ncc);
        setThongTinForm({
            tenncc: ncc.tenncc || "",
            sodienthoai: ncc.sodienthoai || "",
            diachi: ncc.diachi || "",
            email: ncc.email || "",
            masothue: ncc.masothue || "",
            nguoilienhe: ncc.nguoilienhe || "",
            hantramacdinh: ncc.hantramacdinh ?? "",
        });
    };

    const submitThongTin = async () => {
        setSubmitting(true);
        try {
            await api.put(`/Nhacungcaps/${thongTinModal.idncc}`, {
                ...thongTinForm,
                email: thongTinForm.email || null,
                hantramacdinh: thongTinForm.hantramacdinh === "" ? null : Number(thongTinForm.hantramacdinh),
            });
            showToast("Đã cập nhật thông tin nhà cung cấp!", "success");
            setThongTinModal(null);
            fetchDanhSach();
        } catch (err) {
            showToast(err.response?.data?.message || "Cập nhật thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const openLichSu = (ncc) => {
        setLichSuModal(ncc);
        setLoadingLichSu(true);
        api.get(`/CongNoNCC/${ncc.idncc}/lich-su`)
            .then(res => setLichSuData(res.data.result || []))
            .catch(() => showToast("Không tải được lịch sử!", "error"))
            .finally(() => setLoadingLichSu(false));
    };

    return (
        <AdminLayout title="Quản lý công nợ nhà cung cấp">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs uppercase font-bold text-slate-500">Tổng đang nợ nhà cung cấp</p>
                    <p className="text-2xl font-bold text-red-600 mt-1 tabular-nums">{dinhDangTien(tongCongNo)} VNĐ</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs uppercase font-bold text-slate-500">Nhà cung cấp quá hạn</p>
                    <p className="text-2xl font-bold text-amber-600 mt-1 tabular-nums">{soNccQuaHan}</p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-5">
                    <p className="text-xs uppercase font-bold text-slate-500">Tổng nhà cung cấp</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1 tabular-nums">{danhSach.length}</p>
                </div>
            </div>

            <div className="mb-6">
                <input
                    type="text"
                    placeholder="Tìm theo tên, số điện thoại, email, người liên hệ..."
                    value={searchTerm}
                    onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    className="w-full max-w-lg px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 text-sm bg-white"
                />
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[1000px] border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase text-slate-500 font-bold">
                            <tr>
                                <th className="p-4">Nhà cung cấp</th>
                                <th className="p-4">Liên hệ</th>
                                <th className="p-4 text-center">Hạn trả</th>
                                <th className="p-4 text-right">Đang nợ</th>
                                <th className="p-4 text-center">Phiếu còn nợ</th>
                                <th className="p-4">Trạng thái</th>
                                <th className="p-4 text-center w-44">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                            {loading ? (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400">Đang tải dữ liệu...</td></tr>
                            ) : paginated.length > 0 ? (
                                paginated.map(ncc => {
                                    const trangThai = trangThaiNo(ncc);
                                    const congNo = Number(ncc.congnophaitra || 0);
                                    return (
                                        <tr key={ncc.idncc} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="p-4">
                                                <p className="font-semibold text-slate-800">{ncc.tenncc}</p>
                                                <p className="text-xs text-slate-400">{ncc.diachi || "Chưa có địa chỉ"}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="font-mono text-slate-500">{ncc.sodienthoai || "-"}</p>
                                                <p className="text-xs text-slate-400">{ncc.nguoilienhe || ncc.email || ""}</p>
                                            </td>
                                            <td className="p-4 text-center text-xs">
                                                <p className="text-slate-600">
                                                    {ncc.hanTraApDung === 0
                                                        ? "Trả ngay khi nhập"
                                                        : `Nợ ${ncc.hanTraApDung} ngày`}
                                                    {ncc.hantramacdinh == null && (
                                                        <span className="text-slate-400"> (mặc định)</span>
                                                    )}
                                                </p>
                                                {ncc.hanTraGanNhat && (
                                                    <p className={ncc.daQuaHan ? "text-red-600 font-bold" : "text-slate-400"}>
                                                        Gần nhất: {dinhDangNgay(ncc.hanTraGanNhat)}
                                                    </p>
                                                )}
                                            </td>
                                            <td className="p-4 text-right font-bold tabular-nums">
                                                {congNo < 0 ? (
                                                    <span className="text-blue-600">{dinhDangTien(Math.abs(congNo))} VNĐ (trả dư)</span>
                                                ) : (
                                                    <span className={congNo > 0 ? "text-red-600" : "text-slate-400"}>{dinhDangTien(congNo)} VNĐ</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-center tabular-nums">{ncc.soPhieuConNo}</td>
                                            <td className="p-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border inline-flex ${trangThai.badge}`}>
                                                    {trangThai.label}
                                                </span>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex flex-col items-stretch gap-2">
                                                    {isAdmin && (
                                                        <button onClick={() => openThanhToan(ncc)} className="w-full px-2.5 py-1.5 rounded-lg bg-cyan-50 text-cyan-700 font-bold hover:bg-cyan-100 border border-cyan-200 text-xs cursor-pointer">Thanh toán</button>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => openDieuChinh(ncc)} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer">Điều chỉnh nợ</button>
                                                    )}
                                                    {isAdmin && (
                                                        <button onClick={() => openThongTin(ncc)} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer">Sửa thông tin</button>
                                                    )}
                                                    <button onClick={() => openLichSu(ncc)} className="w-full px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-600 font-bold hover:bg-slate-100 border border-slate-200 text-xs cursor-pointer">Lịch sử</button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="p-8 text-center text-slate-400 italic">Chưa có nhà cung cấp nào.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {!loading && processedDanhSach.length > 0 && (
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </div>

            {/* MODAL: Thanh toán */}
            {thanhToanModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-black shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-black bg-cyan-600">
                            <h3 className="font-bold text-lg text-white">Thanh toán — {thanhToanModal.tenncc}</h3>
                            <p className="text-xs text-cyan-50">Đang nợ {dinhDangTien(thanhToanModal.congnophaitra)} VNĐ. Có thể trả từng phần.</p>
                        </div>
                        <div className="p-5 space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Phiếu nhập</label>
                                <select
                                    value={thanhToanForm.idphieunhap}
                                    onChange={e => chonPhieu(e.target.value)}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="">Trả gộp (không gắn phiếu cụ thể)</option>
                                    {phieuNhapList.map(phieu => (
                                        <option key={phieu.idphieunhap} value={phieu.idphieunhap}>
                                            {dinhDangNgay(phieu.ngaynhap)} — {phieu.tenLoaiCa} — còn nợ {dinhDangTien(phieu.conNo)}đ
                                            {phieu.daQuaHan ? " (quá hạn)" : ""}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Số tiền trả</label>
                                <input
                                    type="number"
                                    value={thanhToanForm.sotien}
                                    onChange={e => setThanhToanForm(prev => ({ ...prev, sotien: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    placeholder="Nhập số tiền"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Hình thức</label>
                                <select
                                    value={thanhToanForm.hinhthuc}
                                    onChange={e => setThanhToanForm(prev => ({ ...prev, hinhthuc: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                >
                                    <option value="TIEN_MAT">Tiền mặt</option>
                                    <option value="CHUYEN_KHOAN">Chuyển khoản</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-600 uppercase">Ghi chú</label>
                                <input
                                    type="text"
                                    value={thanhToanForm.ghichu}
                                    onChange={e => setThanhToanForm(prev => ({ ...prev, ghichu: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setThanhToanModal(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer">Hủy</button>
                            <button onClick={submitThanhToan} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 cursor-pointer">
                                {submitting ? "Đang lưu..." : "Ghi nhận"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Điều chỉnh nợ */}
            {dieuChinhModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-black shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-black bg-cyan-600">
                            <h3 className="font-bold text-lg text-white">Điều chỉnh công nợ — {dieuChinhModal.tenncc}</h3>
                        </div>
                        <div className="p-5 space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setDieuChinhForm(prev => ({ ...prev, tang: true }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border cursor-pointer ${dieuChinhForm.tang ? "bg-red-50 text-red-700 border-red-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                                >Tăng nợ</button>
                                <button
                                    onClick={() => setDieuChinhForm(prev => ({ ...prev, tang: false }))}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold border cursor-pointer ${!dieuChinhForm.tang ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-500 border-slate-200"}`}
                                >Giảm nợ</button>
                            </div>
                            <input
                                type="number"
                                value={dieuChinhForm.sotien}
                                onChange={e => setDieuChinhForm(prev => ({ ...prev, sotien: e.target.value }))}
                                placeholder="Số tiền"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                            />
                            <input
                                type="text"
                                value={dieuChinhForm.ghichu}
                                onChange={e => setDieuChinhForm(prev => ({ ...prev, ghichu: e.target.value }))}
                                placeholder="Lý do điều chỉnh (bắt buộc)"
                                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                            />
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setDieuChinhModal(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer">Hủy</button>
                            <button onClick={submitDieuChinh} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 cursor-pointer">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Sửa thông tin nhà cung cấp */}
            {thongTinModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-black shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-black bg-cyan-600">
                            <h3 className="font-bold text-lg text-white">Thông tin nhà cung cấp</h3>
                            <p className="text-xs text-cyan-50">
                                Hạn trả mặc định dùng để tính hạn trả cho phiếu nhập mới. Để trống thì áp dụng
                                mặc định của hệ thống; nhập 0 nghĩa là phải trả ngay trong ngày nhập.
                            </p>
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {[
                                { key: "tenncc", label: "Tên nhà cung cấp" },
                                { key: "sodienthoai", label: "Số điện thoại" },
                                { key: "nguoilienhe", label: "Người liên hệ" },
                                { key: "email", label: "Email" },
                                { key: "masothue", label: "Mã số thuế" },
                                { key: "hantramacdinh", label: "Hạn trả mặc định (ngày)", type: "number" },
                            ].map(truong => (
                                <div key={truong.key}>
                                    <label className="text-xs font-bold text-slate-600 uppercase">{truong.label}</label>
                                    <input
                                        type={truong.type || "text"}
                                        value={thongTinForm[truong.key] ?? ""}
                                        onChange={e => setThongTinForm(prev => ({ ...prev, [truong.key]: e.target.value }))}
                                        className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                    />
                                </div>
                            ))}
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-slate-600 uppercase">Địa chỉ</label>
                                <input
                                    type="text"
                                    value={thongTinForm.diachi ?? ""}
                                    onChange={e => setThongTinForm(prev => ({ ...prev, diachi: e.target.value }))}
                                    className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-cyan-500/20"
                                />
                            </div>
                        </div>
                        <div className="px-5 py-4 border-t border-slate-200 flex justify-end gap-2 bg-slate-50">
                            <button onClick={() => setThongTinModal(null)} className="px-4 py-2 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer">Hủy</button>
                            <button onClick={submitThongTin} disabled={submitting} className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 cursor-pointer">Lưu</button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL: Lịch sử sổ cái */}
            {lichSuModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl border border-black shadow-2xl w-full max-w-3xl overflow-hidden">
                        <div className="px-6 py-4 border-b border-black bg-cyan-600 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-white">Lịch sử công nợ — {lichSuModal.tenncc}</h3>
                            <button onClick={() => setLichSuModal(null)} className="text-white text-sm font-bold cursor-pointer">Đóng</button>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-xs uppercase text-slate-500 font-bold sticky top-0">
                                    <tr>
                                        <th className="p-3">Thời gian</th>
                                        <th className="p-3">Loại</th>
                                        <th className="p-3 text-right">Số tiền</th>
                                        <th className="p-3 text-right">Dư sau</th>
                                        <th className="p-3">Ghi chú</th>
                                        <th className="p-3">Người thực hiện</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {loadingLichSu ? (
                                        <tr><td colSpan="6" className="p-6 text-center text-slate-400">Đang tải...</td></tr>
                                    ) : lichSuData.length > 0 ? (
                                        lichSuData.map(ls => (
                                            <tr key={ls.idlichsucongnoncc}>
                                                <td className="p-3 text-slate-500 text-xs">{new Date(ls.ngaytao).toLocaleString("vi-VN")}</td>
                                                <td className="p-3">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                                        ls.loaithaydoi === "TANG" ? "bg-red-50 text-red-700"
                                                            : ls.loaithaydoi === "GIAM" ? "bg-green-50 text-green-700"
                                                            : "bg-slate-100 text-slate-600"}`}>
                                                        {ls.loaithaydoi}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-right tabular-nums">{dinhDangTien(ls.sotien)}</td>
                                                <td className="p-3 text-right tabular-nums font-semibold">{dinhDangTien(ls.sodusaukhithaydoi)}</td>
                                                <td className="p-3 text-slate-600 text-xs">{ls.ghichu || "-"}</td>
                                                <td className="p-3 text-slate-500 text-xs">{ls.tenNguoiThucHien || "Hệ thống"}</td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr><td colSpan="6" className="p-6 text-center text-slate-400 italic">Chưa có biến động công nợ nào.</td></tr>
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
