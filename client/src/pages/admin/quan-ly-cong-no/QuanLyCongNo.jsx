import React, { useEffect, useState } from "react";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangCongNo from "./components/BangCongNo";
import ModalDieuChinh from "./components/ModalDieuChinh";
import ModalHanMuc from "./components/ModalHanMuc";
import ModalLichSuCongNo from "./components/ModalLichSuCongNo";
import ModalMoKhoa from "./components/ModalMoKhoa";

export default function QuanLyCongNo() {
    const { showToast } = useToast();

    const [danhSach, setDanhSach] = useState([]);
    const [loading, setLoading] = useState(true);
    const [khachChuaMoCongNo, setKhachChuaMoCongNo] = useState([]);

    const [hanMucModal, setHanMucModal] = useState(null); // { idtaikhoan, ten, laMoMoi }
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
        if (!hanMucModal.idtaikhoan) {
            showToast("Vui lòng chọn khách hàng!", "error");
            return;
        }

        const hanMuc = Number(hanMucInput);
        if (!hanMuc || hanMuc <= 0) {
            showToast("Hạn mức tín dụng phải lớn hơn 0!", "error");
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/CongNo/${hanMucModal.idtaikhoan}/han-muc`, { hanmuctindung: hanMuc });
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
        if (!sotien || sotien <= 0) {
            showToast("Số tiền phải lớn hơn 0!", "error");
            return;
        }

        if (!dieuChinhForm.ghichu.trim()) {
            showToast("Vui lòng nhập lý do điều chỉnh!", "error");
            return;
        }

        setSubmitting(true);
        try {
            await api.put(`/CongNo/${dieuChinhModal.idtaikhoan}/dieu-chinh`, {
                sotien,
                tang: dieuChinhForm.tang,
                ghichu: dieuChinhForm.ghichu.trim(),
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
        if (!moKhoaGhiChu.trim()) {
            showToast("Vui lòng nhập lý do mở khóa!", "error");
            return;
        }

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

            <BangCongNo
                loading={loading}
                danhSach={danhSach}
                onSuaHanMuc={openSuaHanMuc}
                onDieuChinh={openDieuChinh}
                onMoKhoa={openMoKhoa}
                onXemLichSu={openLichSu}
            />

            <ModalHanMuc
                modal={hanMucModal}
                hanMucInput={hanMucInput}
                khachChuaMoCongNo={khachChuaMoCongNo}
                submitting={submitting}
                onChangeModal={setHanMucModal}
                onChangeHanMucInput={setHanMucInput}
                onClose={() => setHanMucModal(null)}
                onSubmit={handleSubmitHanMuc}
            />

            <ModalDieuChinh
                modal={dieuChinhModal}
                form={dieuChinhForm}
                submitting={submitting}
                onChangeForm={setDieuChinhForm}
                onClose={() => setDieuChinhModal(null)}
                onSubmit={handleSubmitDieuChinh}
            />

            <ModalMoKhoa
                modal={moKhoaModal}
                ghiChu={moKhoaGhiChu}
                submitting={submitting}
                onChangeGhiChu={setMoKhoaGhiChu}
                onClose={() => setMoKhoaModal(null)}
                onSubmit={handleSubmitMoKhoa}
            />

            <ModalLichSuCongNo
                modal={lichSuModal}
                loading={loadingLichSu}
                lichSuData={lichSuData}
                onClose={() => setLichSuModal(null)}
            />
        </AdminLayout>
    );
}

