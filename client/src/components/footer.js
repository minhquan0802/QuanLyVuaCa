export default function Footer() {

    // Danh sách link mạng xã hội và icon SVG tương ứng
    const socialLinks = [
        {
            name: 'Facebook',
            href: 'https://www.facebook.com/vuacadieuhongminhquan',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            name: 'YouTube',
            href: 'https://youtube.com',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M19.812 5.418c.861.23 1.538.907 1.768 1.768C21.998 8.746 22 12 22 12s0 3.255-.418 4.814a2.504 2.504 0 0 1-1.768 1.768c-1.56.419-7.814.419-7.814.419s-6.255 0-7.814-.419a2.505 2.505 0 0 1-1.768-1.768C2 15.255 2 12 2 12s0-3.255.418-4.814a2.507 2.507 0 0 1 1.768-1.768C5.745 5 11.998 5 11.998 5s6.255 0 7.814.418zM15.194 12 10 15V9l5.194 3z" clipRule="evenodd" />
                </svg>
            )
        },
        {
            name: 'Instagram',
            href: 'https://instagram.com',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 0 1 1.772 1.153 4.902 4.902 0 0 1 1.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 0 1-1.153 1.772 4.902 4.902 0 0 1-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 0 1-1.772-1.153 4.902 4.902 0 0 1-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 0 1 1.153-1.772A4.902 4.902 0 0 1 5.451 4.635c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.821-.049.975-.045 1.504-.207 1.857-.344.467-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.049-3.821-.045-.975-.207-1.504-.344-1.857-.182-.466-.398-.8-.748-1.15-.35-.35-.683-.566-1.15-.748-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" clipRule="evenodd" />
                </svg>
            )
        }
    ];

    return (
        // Thay đổi: Chuyển sang bg-slate-900 (Xanh đen đậm) giống hình mẫu "Vựa Cá" mới
        // Kết hợp text-gray-300 để tạo độ tương phản nhẹ nhàng, sang trọng
        <footer className="w-full bg-[#0f172a] text-white border-t border-white/10 mt-auto">

            {/* Newsletter Section */}
            <div className="w-full border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="text-center md:text-left">
                        <h3 className="font-display text-2xl font-bold text-white">Đăng ký nhận tin</h3>
                        <p className="text-sm text-slate-400 mt-1">Nhận ưu đãi độc quyền và cập nhật mới nhất từ Minh Quân Fresh.</p>
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <input
                            type="email"
                            placeholder="Email của bạn..."
                            // Thay đổi: Input nền trong suốt nhẹ (white/5) để chìm vào nền tối
                            className="w-full md:w-80 px-4 py-2.5 rounded-lg border border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        />
                        {/* Button giữ màu xanh chủ đạo của thương hiệu để tạo điểm nhấn trên nền tối */}
                        <button className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-500 transition-colors duration-300 shadow-lg">
                            Đăng ký
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-7xl mx-auto px-6 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8">

                    {/* Brand Column */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            {/* Logo Icon nền xanh nổi bật giống hình mẫu */}
                            <div className="flex items-center justify-center size-10 rounded-lg bg-blue-600 text-white">
                                <span className="material-symbols-outlined text-2xl">phishing</span>
                            </div>
                            <h2 className="font-display text-2xl font-bold text-white tracking-tight">
                                Minh Quân <span className="text-blue-500">Fresh</span>
                            </h2>
                        </div>
                        <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                            Chuyên cung cấp cá tươi sống chất lượng cao với giá cả phải chăng.
                        </p>
                    </div>

                    {/* Links Column 1 */}
                    <div>
                        <h4 className="font-display font-bold text-lg text-white mb-4">Về Minh Quân</h4>
                        <ul className="space-y-3">
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Câu chuyện thương hiệu</a></li>
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Tuyển dụng</a></li>
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Hệ thống cửa hàng</a></li>
                        </ul>
                    </div>

                    {/* Links Column 2 */}
                    <div>
                        <h4 className="font-display font-bold text-lg text-white mb-4">Hỗ trợ khách hàng</h4>
                        <ul className="space-y-3">
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Trung tâm trợ giúp</a></li>
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Chính sách vận chuyển</a></li>
                            <li><a className="text-sm text-slate-400 hover:text-blue-400 hover:translate-x-1 transition-all inline-block" href="#">Chính sách đổi trả</a></li>
                        </ul>
                    </div>

                    {/* Socials / Contact Column */}
                    <div>
                        <h4 className="font-display font-bold text-lg text-white mb-4">Liên hệ</h4>
                        <div className="space-y-3 mb-6">
                            <p className="flex items-start gap-3 text-sm text-slate-400">
                                <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">location_on</span>
                                123 Đường Vựa Cá, Q.1, TP.HCM
                            </p>
                            <p className="flex items-center gap-3 text-sm text-slate-400">
                                <span className="material-symbols-outlined text-blue-500 text-lg">call</span>
                                <strong className="text-white">0901 234 567</strong>
                            </p>
                            <p className="flex items-center gap-3 text-sm text-slate-400">
                                <span className="material-symbols-outlined text-blue-500 text-lg">mail</span>
                                contact@minhquanfresh.com
                            </p>
                        </div>
                        
                        {/* Social Media Icons (SVG) */}
                        <div className="flex gap-3">
                            {socialLinks.map((item, index) => (
                                <a 
                                    key={index} 
                                    href={item.href} 
                                    target="_blank" 
                                    rel="noreferrer" // Bảo mật khi mở tab mới
                                    className="flex items-center justify-center size-9 rounded-full bg-white/10 text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-300"
                                    title={item.name}
                                >
                                    {item.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Copyright - Nền tối hơn 1 chút để phân cách */}
            <div className="border-t border-white/10 bg-[#020617]">
                <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
                    <p className="text-xs text-slate-500">
                        © 2025 Minh Quân Fresh. Tất cả quyền được bảo lưu.
                    </p>
                    <div className="flex gap-6">
                        <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Điều khoản</a>
                        <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Bảo mật</a>
                        <a href="#" className="text-xs text-slate-500 hover:text-blue-400 transition-colors">Cookie</a>
                    </div>
                </div>
            </div>
        </footer>
    )
}