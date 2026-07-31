/**
 *
 * Yêu cầu: backend đang chạy (mặc định http://localhost:8080/quan-ly-vua-ca),
 * đã có sẵn danh mục (loại cá / size / giá đang áp dụng / nhà cung cấp).
 *
 * Cách chạy (PowerShell):
 *   $env:ADMIN_EMAIL="admin@gmail.com"; 
 *   $env:ADMIN_PASSWORD="123456789"; 
 *   node "D:\SynologyDrive\Dev\Project_on_school\Nam_4_HK2\Do_an_tot_nghiep\source_code\QuanLyVuaCa\scripts\seed-dashboard-demo.mjs"
 * Tuỳ chọn thêm:
 *   $env:KHACHSI_EMAIL="nguyenhongquan20042005@gmail.com"   (để tạo đơn công nợ)
 *   $env:API_BASE="http://localhost:8080/quan-ly-vua-ca"    (mặc định, đổi nếu khác)
 *
 * Toàn bộ dữ liệu tạo ra đều có ghi chú "[SEED-DEMO]" để dễ nhận diện/tra soát sau này.
 *
 * Ngoài số liệu cho Dashboard, script còn tạo thêm dữ liệu đa dạng trạng thái để demo trực tiếp
 * các luồng nghiệp vụ khác (không cần thao tác tay trước buổi bảo vệ):
 *   - Nhập hàng: 1 phiếu nhập cho MỖI loại cá đang có giá bán (không chỉ vài loại đầu tiên).
 *   - Đơn khách sỉ đi đúng luồng thật qua PUT /status: "Đang vận chuyển", "Đã giao + đã thanh toán đủ",
 *     "Đã giao + còn nợ kèm 1 khoản chuyển khoản đang chờ admin xác nhận".
 *   - Nếu khách sỉ (KHACHSI_EMAIL) đã được admin thiết lập hạn mức tín dụng từ trước, script sẽ cố
 *     đẩy công nợ của khách đó áp sát/vượt hạn mức để demo tính năng cảnh báo + chặn đặt hàng.
 *     Nếu khách chưa có hạn mức, bước này tự bỏ qua (không lỗi).
 */

const BASE = process.env.API_BASE || "http://localhost:8080/quan-ly-vua-ca";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const KHACHSI_EMAIL = process.env.KHACHSI_EMAIL || "";

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Thiếu biến môi trường ADMIN_EMAIL / ADMIN_PASSWORD.");
    process.exit(1);
}

// Cookie jar thủ công: server bật CSRF cho MỌI request đổi dữ liệu (kể cả chính /auth/token),
// nên phải giữ cookie XSRF-TOKEN xuyên suốt và gửi lại giá trị đó qua header X-XSRF-TOKEN.
const cookies = {};

function cookieHeader() {
    return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join("; ");
}

function mergeSetCookies(res) {
    const setCookies = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
    for (const sc of setCookies) {
        const pair = sc.split(";")[0];
        const idx = pair.indexOf("=");
        if (idx > -1) cookies[pair.slice(0, idx).trim()] = pair.slice(idx + 1).trim();
    }
}

async function call(method, path, body) {
    const headers = { "Content-Type": "application/json" };
    if (Object.keys(cookies).length) headers.Cookie = cookieHeader();
    if (cookies["XSRF-TOKEN"]) headers["X-XSRF-TOKEN"] = cookies["XSRF-TOKEN"];

    const res = await fetch(`${BASE}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    mergeSetCookies(res);
    const text = await res.text();
    let json = null;
    if (text) {
        try { json = JSON.parse(text); } catch { json = text; }
    }
    if (!res.ok) {
        throw new Error(`${method} ${path} -> HTTP ${res.status}: ${typeof json === "string" ? json : JSON.stringify(json)}`);
    }
    return json;
}

async function login() {
    // 1. Lấy cookie CSRF trước (server bắt buộc cho mọi POST, kể cả login).
    const csrfRes = await fetch(`${BASE}/auth/csrf`);
    mergeSetCookies(csrfRes);

    // 2. Đăng nhập, gửi kèm cookie CSRF vừa lấy + header X-XSRF-TOKEN tương ứng.
    const res = await fetch(`${BASE}/auth/token`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Cookie: cookieHeader(),
            "X-XSRF-TOKEN": cookies["XSRF-TOKEN"] || "",
        },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    });
    mergeSetCookies(res);
    if (!res.ok) throw new Error(`Đăng nhập thất bại: HTTP ${res.status}`);
    if (!cookies["token"]) throw new Error("Không nhận được cookie đăng nhập từ server.");
    console.log("Đăng nhập admin thành công.");
}

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function todayStr() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Xây chuỗi LocalDateTime thủ công (không qua toISOString) để tránh lệch múi giờ UTC.
function daysAgoLocalIso(days) {
    const d = new Date();
    d.setDate(d.getDate() - days);
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(randInt(8, 17)).padStart(2, "0");
    const mm = String(randInt(0, 59)).padStart(2, "0");
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}:00`;
}

const GUEST_NAMES = [
    ["Nguyễn Văn An", "0901234567"],
    ["Trần Thị Bích", "0912345678"],
    ["Lê Hoàng Cường", "0923456789"],
    ["Phạm Thị Duyên", "0934567890"],
    ["Võ Minh Đức", "0945678901"],
    ["Đặng Thị Hoa", "0956789012"],
    ["Bùi Văn Khoa", "0967890123"],
    ["Ngô Thị Lan", "0978901234"],
];

async function loadContext() {
    const [inv, prices, suppliers, accounts, units] = await Promise.all([
        call("GET", "/Chitietcabans"),
        call("GET", "/Banggias"),
        call("GET", "/Nhacungcaps"),
        call("GET", "/tai-khoan"),
        call("GET", "/Donvitinhs"),
    ]);

    const inventory = (inv.result || []).filter(i => !i.deleted);
    const activePrices = (prices.result || []).filter(p => p.trangThai === "Đang áp dụng");
    const priceByChitiet = new Map(activePrices.map(p => [Number(p.idChitietcaban), p]));

    const products = inventory
        .filter(i => priceByChitiet.has(Number(i.id)))
        .map(i => ({ ...i, price: priceByChitiet.get(Number(i.id)) }));

    if (products.length === 0) {
        throw new Error("Không có sản phẩm nào đang có giá bán áp dụng — hãy thiết lập giá trước khi chạy script.");
    }

    const supplier = (suppliers.result || [])[0];
    if (!supplier) throw new Error("Chưa có nhà cung cấp nào trong hệ thống.");

    const kgUnit = (units.result || []).find(u => Number(u.hesokg) === 1) || (units.result || [])[0];
    if (!kgUnit) throw new Error("Chưa có đơn vị tính nào trong hệ thống.");

    let khachSi = null;
    if (KHACHSI_EMAIL) {
        khachSi = (accounts.result || []).find(u => u.vaitro === "CUSTOMER" && u.email === KHACHSI_EMAIL);
        if (!khachSi) console.warn(`Không tìm thấy tài khoản khách sỉ email=${KHACHSI_EMAIL} (vaitro=CUSTOMER) — bỏ qua đơn công nợ.`);
    }

    console.log(`Tải context: ${products.length} sản phẩm có giá, NCC "${supplier.tenncc || supplier.id}", ĐVT "${kgUnit.tendvt}".`);
    return { products, supplier, kgUnit, khachSi };
}

// Gọi PUT /Donhangs/{id}/status — dùng chung cho các bước đẩy đơn khách sỉ qua từng trạng thái thật.
async function capNhatTrangThaiDon(idDonhang, trangthaidonhang) {
    return call("PUT", `/Donhangs/${idDonhang}/status`, { trangthaidonhang });
}

// --- 1. NHẬP HÀNG: 1 phiếu nhập cho MỖI loại cá đang có giá bán, để không loại cá nào bị bỏ sót ---
async function seedPhieuNhap(ctx) {
    const chosen = ctx.products;
    const byLoaiCa = new Map();
    for (const p of chosen) {
        if (!byLoaiCa.has(p.idLoaiCa)) byLoaiCa.set(p.idLoaiCa, []);
        byLoaiCa.get(p.idLoaiCa).push(p);
    }

    const stockAdded = new Map(); // idChitietcaban -> kg vừa nhập thêm, để tránh bán vượt tồn khi tạo đơn sau
    let idx = 0;
    for (const [idloaica, items] of byLoaiCa) {
        const trangthaithanhtoan = idx % 2 === 0 ? "DA_THANH_TOAN" : "CHUA_THANH_TOAN";
        const listChiTiet = items.map(p => {
            const soluongnhap = randInt(30, 60);
            const giaLe = Number(p.price.giaBanLe);
            const giaSi = Number(p.price.giaBanSi);
            stockAdded.set(p.id, (stockAdded.get(p.id) || 0) + soluongnhap);
            return {
                idsizeca: p.idSizeCa,
                soluongnhap,
                gianhap: Math.round(giaLe * 0.6),
                giabanletaithoidiemnhap: giaLe,
                giabansitaithoidiemnhap: giaSi,
            };
        });

        try {
            await call("POST", "/Phieunhaps", {
                idloaica,
                idncc: ctx.supplier.id,
                ngaynhap: todayStr(),
                trangthaithanhtoan,
                ghichu: "[SEED-DEMO] Phiếu nhập dữ liệu mẫu",
                listChiTiet,
            });
            idx++;
        } catch (err) {
            console.warn(`Bỏ qua 1 phiếu nhập do lỗi: ${err.message}`);
        }
    }
    console.log(`Đã tạo phiếu nhập cho ${byLoaiCa.size} loại cá (${chosen.length} dòng size).`);
    return stockAdded;
}

// --- 2. ĐƠN HÀNG KHÁCH LẺ (POS): giao thành công, thanh toán ngay, rải vài ngày gần đây ---
async function seedDonHangKhachLe(ctx, stockAdded) {
    const inStock = ctx.products.filter(p => Number(p.soluongton || 0) + (stockAdded.get(p.id) || 0) >= 1);
    if (inStock.length === 0) {
        console.warn("Không có sản phẩm nào còn tồn kho — bỏ qua bước tạo đơn khách lẻ.");
        return;
    }
    let created = 0;
    for (let i = 0; i < 10; i++) {
        const product = inStock[randInt(0, inStock.length - 1)];
        const available = Number(product.soluongton || 0) + (stockAdded.get(product.id) || 0);
        if (available < 1) continue;
        const soluong = Math.min(randInt(2, 8), Math.max(1, Math.floor(available * 0.3)), Math.floor(available));

        const [tenKhachLe, sdtKhachLe] = GUEST_NAMES[randInt(0, GUEST_NAMES.length - 1)];
        const donGia = Number(product.price.giaBanLe);
        const thanhTien = soluong * donGia;

        try {
            await call("POST", "/Donhangs", {
                idthongtinkhachhang: null,
                tenKhachLe,
                sdtKhachLe,
                trangthaidonhang: "GIAO_HANG_THANH_CONG",
                trangthaithanhtoan: "DA_THANH_TOAN",
                ngaydat: daysAgoLocalIso(randInt(0, 6)),
                ghichu: "[SEED-DEMO] Đơn khách lẻ dữ liệu mẫu",
                chiTietDonHang: [{
                    idchitietcaban: String(product.id),
                    iddonvitinh: String(ctx.kgUnit.id),
                    soluong,
                    soluongkgthucte: soluong,
                    soluongkgthuctequydoi: soluong,
                    tongtiendukien: thanhTien,
                    tongtienthucte: thanhTien,
                }],
            });
            stockAdded.set(product.id, (stockAdded.get(product.id) || 0) - soluong);
            created++;
        } catch (err) {
            console.warn(`Bỏ qua 1 đơn khách lẻ do lỗi: ${err.message}`);
        }
    }
    console.log(`Đã tạo ${created} đơn khách lẻ (POS).`);
}

// --- 3. ĐƠN HÀNG KHÁCH SỈ (thanh toán sau / công nợ), chỉ khi có KHACHSI_EMAIL hợp lệ ---
async function seedDonHangKhachSi(ctx, stockAdded) {
    if (!ctx.khachSi) return;
    const inStock = ctx.products.filter(p => Number(p.soluongton || 0) + (stockAdded.get(p.id) || 0) >= 1);
    if (inStock.length === 0) {
        console.warn("Không có sản phẩm nào còn tồn kho — bỏ qua bước tạo đơn khách sỉ.");
        return;
    }
    let created = 0;
    for (let i = 0; i < 4; i++) {
        const product = inStock[randInt(0, inStock.length - 1)];
        const available = Number(product.soluongton || 0) + (stockAdded.get(product.id) || 0);
        if (available < 1) continue;
        const soluong = Math.min(randInt(3, 10), Math.max(1, Math.floor(available * 0.2)), Math.floor(available));

        const donGia = Number(product.price.giaBanSi);
        const thanhTien = soluong * donGia;

        try {
            await call("POST", "/Donhangs", {
                idthongtinkhachhang: ctx.khachSi.idtaikhoan,
                trangthaidonhang: "DANG_DONG_HANG",
                trangthaithanhtoan: "CHUA_THANH_TOAN",
                ngaydat: daysAgoLocalIso(randInt(0, 4)),
                ghichu: "[SEED-DEMO] Đơn khách sỉ dữ liệu mẫu (thanh toán sau)",
                chiTietDonHang: [{
                    idchitietcaban: String(product.id),
                    iddonvitinh: String(ctx.kgUnit.id),
                    soluong,
                    soluongkgthucte: soluong,
                    soluongkgthuctequydoi: soluong,
                    tongtiendukien: thanhTien,
                    tongtienthucte: thanhTien,
                }],
            });
            stockAdded.set(product.id, (stockAdded.get(product.id) || 0) - soluong);
            created++;
        } catch (err) {
            console.warn(`Bỏ qua 1 đơn khách sỉ do lỗi (có thể do hạn mức công nợ): ${err.message}`);
        }
    }
    console.log(`Đã tạo ${created} đơn khách sỉ (công nợ).`);
}

// --- 3b. ĐA DẠNG TRẠNG THÁI + THANH TOÁN ĐƠN KHÁCH SỈ: đi đúng luồng thật qua PUT /status ---
// Khác với seedDonHangKhachSi() ở trên (tạo thẳng "Đang đóng hàng", công nợ chưa tăng vì đơn chưa
// giao xong), các đơn ở đây khởi tạo "Chờ xác nhận" rồi đi qua đúng API cập nhật trạng thái thật:
// trừ kho đúng lúc rời "Chờ xác nhận", tăng công nợ đúng lúc "Giao thành công", ghi lịch sử công nợ,
// gửi thông báo — để demo được đầy đủ các trạng thái và luồng thanh toán/công nợ liên quan.
async function seedDaDangTrangThaiKhachSi(ctx, stockAdded) {
    if (!ctx.khachSi) return;

    const layConSanPham = () => ctx.products.filter(p => {
        const available = Number(p.soluongton || 0) + (stockAdded.get(p.id) || 0);
        return available >= 1;
    });

    async function taoDonKhachSi(soNgayTruoc, ghichu) {
        const inStock = layConSanPham();
        if (inStock.length === 0) return null;
        const product = inStock[randInt(0, inStock.length - 1)];
        const available = Number(product.soluongton || 0) + (stockAdded.get(product.id) || 0);
        const soluong = Math.min(randInt(2, 5), Math.max(1, Math.floor(available)));
        if (soluong < 1) return null;

        const resp = await call("POST", "/Donhangs", {
            idthongtinkhachhang: ctx.khachSi.idtaikhoan,
            ngaydat: daysAgoLocalIso(soNgayTruoc),
            ghichu,
            chiTietDonHang: [{
                idchitietcaban: String(product.id),
                iddonvitinh: String(ctx.kgUnit.id),
                soluong,
            }],
        });
        stockAdded.set(product.id, (stockAdded.get(product.id) || 0) - soluong);
        return resp.result.iddonhang;
    }

    // (a) 1 đơn dừng ở "Đang vận chuyển" — demo tab "Đang giao" + nút khách tự xác nhận nhận hàng.
    try {
        const id = await taoDonKhachSi(3, "[SEED-DEMO] Đơn khách sỉ đang vận chuyển");
        if (id) {
            await capNhatTrangThaiDon(id, "DANG_DONG_HANG");
            await capNhatTrangThaiDon(id, "DANG_VAN_CHUYEN");
            console.log("Đã tạo 1 đơn khách sỉ ở trạng thái 'Đang vận chuyển'.");
        }
    } catch (err) {
        console.warn(`Bỏ qua đơn khách sỉ 'đang vận chuyển' do lỗi (có thể do hạn mức công nợ): ${err.message}`);
    }

    // (b) 1 đơn giao thành công + thanh toán đủ ngay — demo lịch sử công nợ có cả tăng lẫn giảm.
    try {
        const id = await taoDonKhachSi(2, "[SEED-DEMO] Đơn khách sỉ đã giao, đã thanh toán đủ");
        if (id) {
            await capNhatTrangThaiDon(id, "GIAO_HANG_THANH_CONG");
            await call("PUT", `/Thanhtoan/${id}/thanh-toan-thu-cong`);
            console.log("Đã tạo 1 đơn khách sỉ 'đã giao' và ghi nhận thanh toán đủ.");
        }
    } catch (err) {
        console.warn(`Bỏ qua đơn khách sỉ 'đã thanh toán đủ' do lỗi (có thể do hạn mức công nợ): ${err.message}`);
    }

    // (c) 1 đơn giao thành công nhưng còn nợ, kèm 1 khoản chuyển khoản "chờ xác nhận" một phần —
    // demo trang Quản lý công nợ (còn dư nợ) và màn hình admin xác nhận thanh toán thủ công.
    try {
        const id = await taoDonKhachSi(1, "[SEED-DEMO] Đơn khách sỉ đã giao, còn nợ");
        if (id) {
            await capNhatTrangThaiDon(id, "GIAO_HANG_THANH_CONG");
            const tinhTrang = await call("GET", `/Thanhtoan/${id}/tinh-trang`);
            const conNo = Number(tinhTrang.result?.conNo || 0);
            if (conNo > 0) {
                const soTienTra = Math.max(1000, Math.round(conNo * 0.4));
                await call("POST", "/Thanhtoan/chuyen-khoan", {
                    iddonhang: id,
                    sotien: soTienTra,
                    ghichu: "[SEED-DEMO] Khách chuyển khoản một phần, chờ admin xác nhận",
                });
            }
            console.log("Đã tạo 1 đơn khách sỉ còn nợ, kèm 1 khoản chuyển khoản đang chờ xác nhận.");
        }
    } catch (err) {
        console.warn(`Bỏ qua đơn khách sỉ 'còn nợ' do lỗi (có thể do hạn mức công nợ): ${err.message}`);
    }
}

// --- 4b. ĐẨY CÔNG NỢ KHÁCH SỈ ÁP SÁT/VƯỢT HẠN MỨC TÍN DỤNG (best-effort) ---
// Mục đích: có sẵn 1 khách sỉ đang ở trạng thái cảnh báo/vượt hạn mức để demo trực tiếp tính năng
// "chặn đặt hàng khi vượt hạn mức" mà không cần thao tác tay lúc bảo vệ. Chỉ chạy khi khách sỉ đã
// được admin thiết lập hạn mức tín dụng từ trước (qua trang Quản lý công nợ); nếu chưa, bỏ qua.
async function seedApSatHanMucCongNo(ctx, stockAdded) {
    if (!ctx.khachSi) return;

    let danhSachCongNo;
    try {
        danhSachCongNo = await call("GET", "/CongNo");
    } catch (err) {
        console.warn(`Không lấy được danh sách công nợ, bỏ qua bước đẩy hạn mức: ${err.message}`);
        return;
    }

    const khach = (danhSachCongNo.result || [])
        .find(k => String(k.idtaikhoan) === String(ctx.khachSi.idtaikhoan));
    if (!khach || khach.hanmuctindung == null) {
        console.warn("Khách sỉ chưa được thiết lập hạn mức tín dụng — bỏ qua bước đẩy công nợ áp sát hạn mức.");
        return;
    }

    const hanMuc = Number(khach.hanmuctindung);
    const congNoHienTai = Number(khach.congnohientai || 0);
    const conLai = hanMuc - congNoHienTai;

    if (conLai <= 0) {
        console.log("Khách sỉ đã vượt hạn mức tín dụng sẵn — phù hợp để demo cảnh báo/chặn đặt hàng, không cần đẩy thêm.");
        return;
    }

    const inStock = ctx.products.filter(p => {
        const available = Number(p.soluongton || 0) + (stockAdded.get(p.id) || 0);
        return available >= 1;
    });
    if (inStock.length === 0) {
        console.warn("Không còn sản phẩm tồn kho — bỏ qua bước đẩy công nợ áp sát hạn mức.");
        return;
    }

    // Chọn sản phẩm có giá sỉ cao nhất trong số còn tồn để cần ít kg hơn mà vẫn đạt số tiền mong muốn.
    const product = inStock.reduce((best, p) =>
        Number(p.price.giaBanSi) > Number(best.price.giaBanSi) ? p : best, inStock[0]);
    const available = Number(product.soluongton || 0) + (stockAdded.get(product.id) || 0);
    const donGia = Number(product.price.giaBanSi);
    const soTienMuonDat = Math.round(conLai * 1.15); // cố tình vượt ~15% để chắc chắn kích hoạt cảnh báo/chặn
    const soluong = Math.min(Math.max(1, Math.ceil(soTienMuonDat / donGia)), Math.floor(available));

    if (soluong < 1) {
        console.warn("Không đủ tồn kho để đẩy công nợ áp sát hạn mức — bỏ qua.");
        return;
    }

    try {
        const resp = await call("POST", "/Donhangs", {
            idthongtinkhachhang: ctx.khachSi.idtaikhoan,
            ngaydat: daysAgoLocalIso(0),
            ghichu: "[SEED-DEMO] Đơn khách sỉ đẩy công nợ áp sát/vượt hạn mức tín dụng",
            chiTietDonHang: [{
                idchitietcaban: String(product.id),
                iddonvitinh: String(ctx.kgUnit.id),
                soluong,
            }],
        });
        stockAdded.set(product.id, (stockAdded.get(product.id) || 0) - soluong);
        const idDonhang = resp.result.iddonhang;
        await capNhatTrangThaiDon(idDonhang, "GIAO_HANG_THANH_CONG");
        console.log(`Đã tạo và giao thành công 1 đơn khách sỉ trị giá ~${soluong * donGia} để đẩy công nợ áp sát/vượt hạn mức (còn lại trước khi đẩy: ${conLai}).`);
    } catch (err) {
        console.warn(`Không đẩy được công nợ áp sát hạn mức (có thể do cơ chế chặn hạn mức đã kích hoạt sớm hơn dự kiến — vẫn tốt để demo): ${err.message}`);
    }
}

// --- 4. 1 phiếu thanh lý mẫu (best-effort, không bắt buộc) ---
async function seedPhieuThanhLy(ctx) {
    try {
        const product = ctx.products[0];
        const res = await call("GET", `/Phieuthanhlys/lo-con-hang?idchitietcaban=${product.id}`);
        const lots = (res.result || []).filter(l => Number(l.soluongconlai) > 0);
        if (lots.length === 0) return;
        const lot = lots[0];
        const soluongthanhly = Math.min(2, Number(lot.soluongconlai));
        await call("POST", "/Phieuthanhlys", {
            lydothanhly: "[SEED-DEMO] Hao hụt mẫu để demo Dashboard",
            trangthai: "DA_BAN_THANH_LY",
            listChiTiet: [{
                idchitietphieunhap: lot.idchitietphieunhap,
                soluongthanhly,
                dongia: Math.round(Number(product.price.giaBanLe) * 0.4),
            }],
        });
        console.log("Đã tạo 1 phiếu thanh lý mẫu.");
    } catch (err) {
        console.warn(`Bỏ qua bước tạo phiếu thanh lý mẫu: ${err.message}`);
    }
}

async function main() {
    await login();
    const ctx = await loadContext();
    const stockAdded = await seedPhieuNhap(ctx);
    await seedDonHangKhachLe(ctx, stockAdded);
    await seedDonHangKhachSi(ctx, stockAdded);
    await seedDaDangTrangThaiKhachSi(ctx, stockAdded);
    await seedApSatHanMucCongNo(ctx, stockAdded);
    await seedPhieuThanhLy(ctx);
    console.log("\nXong. Vào lại trang Dashboard (admin) để kiểm tra số liệu.");
}

main().catch(err => {
    console.error("Lỗi:", err.message);
    process.exit(1);
});
