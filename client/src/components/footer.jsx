import { useNavigate } from "react-router-dom";

export default function Footer() {
    const navigate = useNavigate();

    return (
        <footer className="bg-cyan-900 text-white mt-auto">
            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">

                    {/* Brand */}
                    <div>
                        <h3
                            className="font-display text-lg font-bold text-white mb-2 cursor-pointer hover:text-cyan-300 transition-colors inline-block"
                            onClick={() => navigate("/home")}
                        >
                            Vựa cá Điêu Hồng
                        </h3>
                        <p className="text-cyan-200 text-sm leading-relaxed">
                            Chuyên cung cấp thủy sản tươi ngon, đảm bảo nguồn gốc sạch và an toàn vệ sinh thực phẩm.
                        </p>
                    </div>

                    {/* Quick links */}
                    <div>
                        <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">Liên kết nhanh</h4>
                        <ul className="space-y-2 text-sm text-cyan-200">
                            <li>
                                <button onClick={() => navigate("/home")} className="hover:text-white transition-colors cursor-pointer">
                                    Sản phẩm
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate("/cart")} className="hover:text-white transition-colors cursor-pointer">
                                    Giỏ hàng
                                </button>
                            </li>
                            <li>
                                <button onClick={() => navigate("/my-orders")} className="hover:text-white transition-colors cursor-pointer">
                                    Đơn hàng của tôi
                                </button>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-bold text-cyan-300 uppercase tracking-wider mb-3">Liên hệ</h4>
                        <ul className="space-y-2 text-sm text-cyan-200">
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">phone</span>
                                0909 123 456
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-base">mail</span>
                                vuacadieuong@gmail.com
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="material-symbols-outlined text-base mt-0.5">location_on</span>
                                <span>123 Đường Thủy Sản, TP. Hồ Chí Minh</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-cyan-800 mt-8 pt-6 text-center text-xs text-cyan-400">
                    © {new Date().getFullYear()} Vựa cá Điêu Hồng. Tất cả quyền được bảo lưu.
                </div>
            </div>
        </footer>
    );
}
