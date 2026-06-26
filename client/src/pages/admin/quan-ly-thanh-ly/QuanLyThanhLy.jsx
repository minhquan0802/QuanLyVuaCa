import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../../components/admin/AdminLayout";
import api from "../../../config/axios";
import { useToast } from "../../../context/ToastContext";
import BangLoHangTon from "./components/BangLoHangTon";
import BangPhieuThanhLy from "./components/BangPhieuThanhLy";
import ModalThanhLyLoHang from "./components/ModalThanhLyLoHang";
import TabThanhLy from "./components/TabThanhLy";

export default function QuanLyThanhLy() {
    const navigate = useNavigate();
    const { showToast } = useToast();

    const [tab, setTab] = useState("lo"); // "lo" | "phieu"

    const [phieus, setPhieus] = useState([]);
    const [loadingPhieus, setLoadingPhieus] = useState(true);

    const [lots, setLots] = useState([]);
    const [loadingLots, setLoadingLots] = useState(true);

    const [selectedLot, setSelectedLot] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        kieu: "toanbo", // "toanbo" | "motphan"
        soluongthanhly: 0,
        dongia: 0,
        lydothanhly: "",
        trangthai: "DA_TIEU_HUY",
        ghichu: "",
    });

    const fetchPhieus = () => {
        setLoadingPhieus(true);
        api.get("/Phieuthanhlys")
            .then(res => setPhieus(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách phiếu thanh lý!", "error"))
            .finally(() => setLoadingPhieus(false));
    };

    const fetchLots = () => {
        setLoadingLots(true);
        api.get("/Phieuthanhlys/tat-ca-lo-con-hang")
            .then(res => setLots(res.data.result || []))
            .catch(() => showToast("Không thể tải danh sách lô hàng!", "error"))
            .finally(() => setLoadingLots(false));
    };

    useEffect(() => {
        fetchPhieus();
        fetchLots();
    }, []);

    const openThanhLyModal = (lot) => {
        setSelectedLot(lot);
        setForm({
            kieu: "toanbo",
            soluongthanhly: lot.soluongconlai,
            dongia: 0,
            lydothanhly: "",
            trangthai: "DA_TIEU_HUY",
            ghichu: "",
        });
    };

    const closeModal = () => {
        if (submitting) return;
        setSelectedLot(null);
    };

    const handleKieuChange = (kieu) => {
        setForm(prev => ({
            ...prev,
            kieu,
            soluongthanhly: kieu === "toanbo" ? selectedLot.soluongconlai : prev.soluongthanhly,
        }));
    };

    const handleSubmitThanhLy = async () => {
        if (!selectedLot) return;
        if (!form.lydothanhly.trim()) {
            showToast("Vui lòng nhập lý do thanh lý!", "error");
            return;
        }

        const soLuong = Number(form.soluongthanhly);
        if (soLuong <= 0) {
            showToast("Số lượng thanh lý phải > 0!", "error");
            return;
        }

        if (soLuong > Number(selectedLot.soluongconlai)) {
            showToast(`Lô này chỉ còn ${selectedLot.soluongconlai}kg!`, "error");
            return;
        }

        if (Number(form.dongia) < 0) {
            showToast("Đơn giá không được âm!", "error");
            return;
        }

        const payload = {
            lydothanhly: form.lydothanhly,
            trangthai: form.trangthai,
            ghichu: form.ghichu,
            listChiTiet: [{
                idchitietphieunhap: selectedLot.idchitietphieunhap,
                soluongthanhly: soLuong,
                dongia: Number(form.dongia),
            }],
        };

        setSubmitting(true);
        try {
            await api.post("/Phieuthanhlys", payload);
            showToast("Thanh lý lô hàng thành công!", "success");
            setSelectedLot(null);
            fetchLots();
            fetchPhieus();
        } catch {
            showToast("Lỗi hệ thống hoặc kết nối thất bại!", "error");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <AdminLayout title="Quản Lý Thanh Lý">
            <div className="flex justify-between items-center mb-6">
                <p className="text-slate-500 text-sm">Theo dõi các phiếu thanh lý do hao hụt (cá chết, hao hụt lúc nhập, sự cố...).</p>
                <button
                    onClick={() => navigate("/admin/QuanLyThanhLy/tao-phieu")}
                    className="px-5 py-2.5 bg-cyan-600 text-white font-bold rounded-xl text-sm hover:bg-cyan-700"
                >
                    Lập phiếu nhiều lô
                </button>
            </div>

            <TabThanhLy tab={tab} onChangeTab={setTab} />

            {tab === "lo" ? (
                <BangLoHangTon loading={loadingLots} lots={lots} onThanhLy={openThanhLyModal} />
            ) : (
                <BangPhieuThanhLy loading={loadingPhieus} phieus={phieus} />
            )}

            <ModalThanhLyLoHang
                selectedLot={selectedLot}
                form={form}
                submitting={submitting}
                onChangeForm={setForm}
                onChangeKieu={handleKieuChange}
                onClose={closeModal}
                onSubmit={handleSubmitThanhLy}
            />
        </AdminLayout>
    );
}

