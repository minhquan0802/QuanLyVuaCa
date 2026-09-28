import { useEffect, useRef, useState } from "react";
import api from "../config/axios";

const STORAGE_KEY = "chatbot-tin-nhan";
const DO_DAI_TOI_DA = 1000;
const LOI_CHAO = {
    vaiTro: "bot",
    noiDung: "Xin chào! Em là trợ lý ảo của Vựa cá Điêu Hồng. Anh/chị cần hỏi giá, size hay món ăn phù hợp với loại cá nào ạ?",
};
const GOI_Y = [
    "Cá lóc giá bao nhiêu?",
    "Cá nào nấu lẩu ngon?",
    "Cá basa còn hàng không?",
];

// Lịch sử chat chỉ giữ trong tab hiện tại; storage có thể bị chặn nên luôn bọc try/catch
const docLichSu = () => {
    try {
        const duLieu = JSON.parse(sessionStorage.getItem(STORAGE_KEY));
        return Array.isArray(duLieu) && duLieu.length > 0 ? duLieu : [LOI_CHAO];
    } catch {
        return [LOI_CHAO];
    }
};

// Gemini trả về markdown đơn giản (**đậm**, gạch đầu dòng "* "). Tự dựng phần tử React
// thay vì dangerouslySetInnerHTML để không chèn HTML lạ vào trang.
const hienThiInDam = (dong) =>
    dong.split(/\*\*(.+?)\*\*/g).map((doan, i) =>
        i % 2 === 1 ? <strong key={i}>{doan}</strong> : doan
    );

function NoiDungTinNhan({ noiDung }) {
    return noiDung.split("\n").map((dong, i) => {
        if (!dong.trim()) return <div key={i} className="h-2" />;
        const gachDauDong = dong.match(/^\s*[*-]\s+(.*)$/);
        if (gachDauDong) {
            return (
                <div key={i} className="flex gap-2 pl-1">
                    <span className="text-cyan-600">•</span>
                    <span>{hienThiInDam(gachDauDong[1])}</span>
                </div>
            );
        }
        return <p key={i}>{hienThiInDam(dong)}</p>;
    });
}

export default function ChatBot() {
    const [isOpen, setIsOpen] = useState(false);
    const [tinNhan, setTinNhan] = useState(docLichSu);
    const [cauHoi, setCauHoi] = useState("");
    const [dangGui, setDangGui] = useState(false);
    const cuoiDanhSachRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(tinNhan));
        } catch {
            // Không lưu được thì chỉ mất lịch sử khi tải lại trang
        }
    }, [tinNhan]);

    useEffect(() => {
        if (!isOpen) return;
        cuoiDanhSachRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [tinNhan, dangGui, isOpen]);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    const guiCauHoi = async (noiDung) => {
        const message = noiDung.trim();
        if (!message || dangGui) return;

        setTinNhan((prev) => [...prev, { vaiTro: "khach", noiDung: message }]);
        setCauHoi("");
        setDangGui(true);

        try {
            const res = await api.post("/chat", { message }, { skipAuthRefresh: true });
            setTinNhan((prev) => [...prev, { vaiTro: "bot", noiDung: res.data.result.reply }]);
        } catch (err) {
            setTinNhan((prev) => [...prev, {
                vaiTro: "bot",
                noiDung: err.response?.data?.message || "Không kết nối được trợ lý ảo, vui lòng thử lại sau.",
                loi: true,
            }]);
        } finally {
            setDangGui(false);
            inputRef.current?.focus();
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        guiCauHoi(cauHoi);
    };

    const handleKeyDown = (e) => {
        // Enter để gửi, Shift+Enter để xuống dòng
        if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            guiCauHoi(cauHoi);
        }
    };

    const lamMoi = () => {
        setTinNhan([LOI_CHAO]);
        setCauHoi("");
    };

    const chiCoLoiChao = tinNhan.length === 1;

    return (
        <>
            {isOpen && (
                <div
                    role="dialog"
                    aria-label="Trợ lý ảo"
                    className="fixed bottom-24 left-4 right-4 z-40 flex h-[min(560px,calc(100dvh-11rem))] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:left-auto sm:right-6 sm:w-96"
                >
                    {/* Tiêu đề */}
                    <div className="flex items-center gap-3 bg-cyan-700 px-4 py-3 text-white">
                        <span className="material-symbols-outlined flex h-9 w-9 items-center justify-center rounded-full bg-cyan-600">
                            support_agent
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className="font-bold leading-tight">Trợ lý Vựa cá</p>
                            <p className="text-xs text-cyan-100">Hỏi giá, size, tình trạng hàng</p>
                        </div>
                        <button
                            type="button"
                            onClick={lamMoi}
                            title="Cuộc trò chuyện mới"
                            aria-label="Cuộc trò chuyện mới"
                            className="rounded-lg p-1.5 hover:bg-cyan-600 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">refresh</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            title="Đóng"
                            aria-label="Đóng trợ lý ảo"
                            className="rounded-lg p-1.5 hover:bg-cyan-600 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>

                    {/* Danh sách tin nhắn */}
                    <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 px-4 py-4" aria-live="polite">
                        {tinNhan.map((tn, i) => (
                            <div key={i} className={`flex ${tn.vaiTro === "khach" ? "justify-end" : "justify-start"}`}>
                                <div
                                    className={`max-w-[85%] space-y-1 whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                                        tn.vaiTro === "khach"
                                            ? "rounded-br-sm bg-cyan-600 text-white"
                                            : tn.loi
                                                ? "rounded-bl-sm border border-red-200 bg-red-50 text-red-700"
                                                : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                                    }`}
                                >
                                    {tn.vaiTro === "khach" ? tn.noiDung : <NoiDungTinNhan noiDung={tn.noiDung} />}
                                </div>
                            </div>
                        ))}

                        {dangGui && (
                            <div className="flex justify-start">
                                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3">
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                                    <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                                </div>
                            </div>
                        )}

                        {chiCoLoiChao && !dangGui && (
                            <div className="flex flex-wrap gap-2 pt-1">
                                {GOI_Y.map((goiY) => (
                                    <button
                                        key={goiY}
                                        type="button"
                                        onClick={() => guiCauHoi(goiY)}
                                        className="rounded-full border border-cyan-200 bg-white px-3 py-1.5 text-xs text-cyan-800 hover:bg-cyan-50 cursor-pointer"
                                    >
                                        {goiY}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div ref={cuoiDanhSachRef} />
                    </div>

                    {/* Ô nhập */}
                    <form onSubmit={handleSubmit} className="flex items-end gap-2 border-t border-slate-200 bg-white p-3">
                        <textarea
                            ref={inputRef}
                            rows={1}
                            value={cauHoi}
                            maxLength={DO_DAI_TOI_DA}
                            onChange={(e) => setCauHoi(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Nhập câu hỏi..."
                            aria-label="Câu hỏi"
                            className="max-h-28 min-h-10 flex-1 resize-none rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                        />
                        <button
                            type="submit"
                            disabled={!cauHoi.trim() || dangGui}
                            aria-label="Gửi"
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-cyan-600 text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-slate-300 cursor-pointer"
                        >
                            <span className="material-symbols-outlined text-xl">send</span>
                        </button>
                    </form>
                </div>
            )}

            {/* Nút mở/đóng */}
            <button
                type="button"
                onClick={() => setIsOpen((v) => !v)}
                aria-label={isOpen ? "Đóng trợ lý ảo" : "Mở trợ lý ảo"}
                aria-expanded={isOpen}
                className="fixed bottom-6 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-600 text-white shadow-lg transition hover:scale-105 hover:bg-cyan-700 sm:right-6 cursor-pointer"
            >
                <span className="material-symbols-outlined text-3xl">{isOpen ? "close" : "chat"}</span>
            </button>
        </>
    );
}
