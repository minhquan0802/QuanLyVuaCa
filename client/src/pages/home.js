import Header from "../components/header"
import Footer from "../components/footer"
import ProductList from "../components/product-list"
import { useState } from "react" // [1] Import useState

export default function Home() {
    // [2] Khởi tạo state lưu từ khóa tìm kiếm
    const [searchTerm, setSearchTerm] = useState("");

    return (
        <div className="bg-slate-50 min-h-screen flex flex-col font-body">
            <Header />

            <main className="flex-grow">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 md:py-12">

                    {/* 1. SECTION HEADER & TOOLBAR */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">

                        {/* Title & Description */}
                        <div>
                            <h1 className="font-display text-4xl md:text-5xl font-bold text-blue-900 leading-tight">
                                Sản Phẩm Nổi Bật
                            </h1>
                            <p className="mt-2 text-slate-500 max-w-lg text-lg">
                                Tuyển chọn những loại <span className="font-medium text-blue-800">thủy sản</span> tươi ngon nhất, cam kết nguồn gốc sạch và an toàn vệ sinh thực phẩm.
                            </p>
                        </div>

                        {/* Search Bar */}
                        <div className="w-full md:w-96">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                                    <span className="material-symbols-outlined text-blue-400 group-focus-within:text-blue-600 transition-colors">search</span>
                                </div>
                                <input
                                    type="text"
                                    className="block w-full pl-11 pr-4 py-3 rounded-xl border-none bg-white text-blue-900 shadow-sm ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-300 ease-in-out"
                                    placeholder="Tìm kiếm loại cá, thủy sản..."
                                    // [3] Gắn state và sự kiện nhập liệu
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 2. PRODUCT GRID */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 lg:gap-8">
                        {/* [4] Truyền từ khóa xuống component con để lọc hiển thị */}
                        <ProductList searchTerm={searchTerm} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    )
}