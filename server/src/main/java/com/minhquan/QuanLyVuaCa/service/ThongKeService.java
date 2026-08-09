package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.response.LuanChuyenHangHoaResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoHangResponse;
import com.minhquan.QuanLyVuaCa.dto.response.ThongKeTongQuanResponse;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiDonHang;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhLy;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToan;
import com.minhquan.QuanLyVuaCa.enums.TrangThaiThanhToanDonHang;
import com.minhquan.QuanLyVuaCa.repository.*;
import com.minhquan.QuanLyVuaCa.repository.projection.ThongKeLoaiCaProjection;
import com.minhquan.QuanLyVuaCa.scheduler.LoHangQuaHanScheduler;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.ss.util
        .CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

// Tính toán số liệu cho trang Dashboard admin (AdminDashboard.jsx)
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class ThongKeService {

    LoaicaRepository loaicaRepository;
    ChitietcabanRepository chitietcabanRepository;
    ChitietphieunhapRepository chitietphieunhapRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    ChitietphieuthanhlyRepository chitietphieuthanhlyRepository;
    DonhangRepository donhangRepository;
    TaiKhoanRepository taiKhoanRepository;
    PhieuthanhlyService phieuthanhlyService;

    // --- KHU VỰC 1: KPI TÀI CHÍNH VÀ VẬN HÀNH ---
    @Transactional(readOnly = true)
    public ThongKeTongQuanResponse tinhTongQuan(String range, LocalDate from, LocalDate to) {
        KhoangThoiGian khoang = xacDinhKhoangThoiGian(range, from, to);
        LocalDateTime tuNgay = khoang.tuNgay();
        LocalDateTime denNgay = khoang.denNgay();

        BigDecimal tongDoanhThu = chitietdonhangRepository.tongDoanhThuTrongKhoang(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

        BigDecimal chiPhiNhapHang = chitietphieunhapRepository.tongTienNhapTrongKhoang(
                tuNgay.toLocalDate(), denNgay.toLocalDate());
        BigDecimal chiPhiNhapDaThanhToan =
                chitietphieunhapRepository.tongTienNhapDaThanhToanTrongKhoang(
                        tuNgay.toLocalDate(),
                        denNgay.toLocalDate(),
                        TrangThaiThanhToan.DA_THANH_TOAN);

        BigDecimal thuTuBanThanhLy = chitietphieuthanhlyRepository.tongTienThanhLyTrongKhoang(
                toInstant(tuNgay), toInstant(denNgay));

        long donHoanThanh = donhangRepository.countByTrangthaidonhangAndNgaydatBetween(
                TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay);

        // Không phụ thuộc range (TODAY/THIS_WEEK/...) - đây là trạng thái tồn kho hiện tại,
        // không phải KPI phát sinh trong khoảng thời gian đang lọc.
        long soLoQuaHan = chitietphieunhapRepository.countBySoluongconlaiGreaterThanAndIdphieunhap_NgaynhapLessThan(
                BigDecimal.ZERO, LocalDate.now().minusDays(LoHangQuaHanScheduler.SO_NGAY_QUA_HAN));

        return ThongKeTongQuanResponse.builder()
                .tongDoanhThu(tongDoanhThu)
                .chiPhiNhapHang(chiPhiNhapHang)
                .chiPhiNhapDaThanhToan(chiPhiNhapDaThanhToan)
                .thuTuBanThanhLy(thuTuBanThanhLy)
                .donHoanThanh(donHoanThanh)
                .soLoQuaHan(soLoQuaHan)
                .build();
    }

    // --- KHU VỰC 2: BẢNG/BIỂU ĐỒ LUÂN CHUYỂN HÀNG HÓA (NHẬP - BÁN - HAO HỤT THEO LOẠI CÁ) ---
    @Transactional(readOnly = true)
    public List<LuanChuyenHangHoaResponse> tinhLuanChuyenHangHoa(String range, LocalDate from, LocalDate to) {
        KhoangThoiGian khoang = xacDinhKhoangThoiGian(range, from, to);
        LocalDateTime tuNgay = khoang.tuNgay();
        LocalDateTime denNgay = khoang.denNgay();

        Map<Integer, BigDecimal> imported = toMap(
                chitietphieunhapRepository.tongSoLuongNhapTheoTatCaLoaiCa(
                        tuNgay.toLocalDate(), denNgay.toLocalDate()));
        Map<Integer, BigDecimal> sold = toMap(
                chitietdonhangRepository.tongSoLuongBanTheoTatCaLoaiCa(
                        TrangThaiDonHang.GIAO_HANG_THANH_CONG, tuNgay, denNgay));
        Map<Integer, BigDecimal> liquidated = toMap(
                chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoTatCaLoaiCa(
                        TrangThaiThanhLy.DA_BAN_THANH_LY, toInstant(tuNgay), toInstant(denNgay)));
        Map<Integer, BigDecimal> destroyed = toMap(
                chitietphieuthanhlyRepository.tongSoLuongThanhLyTheoTatCaLoaiCa(
                        TrangThaiThanhLy.DA_TIEU_HUY, toInstant(tuNgay), toInstant(denNgay)));
        Map<Integer, BigDecimal> inventory = toMap(
                chitietcabanRepository.tongTonKhoTheoTatCaLoaiCaDangHoatDong());

        List<LuanChuyenHangHoaResponse> ketQua = new ArrayList<>();
        for (Loaica loaica : loaicaRepository.findAll()) {
            Integer fishTypeId = loaica.getId();
            boolean hasActivity = imported.containsKey(fishTypeId)
                    || sold.containsKey(fishTypeId)
                    || liquidated.containsKey(fishTypeId)
                    || destroyed.containsKey(fishTypeId);
            if (Boolean.TRUE.equals(loaica.getDeleted()) && !hasActivity) {
                continue;
            }

            BigDecimal nhap = imported.getOrDefault(fishTypeId, BigDecimal.ZERO);
            BigDecimal ban = sold.getOrDefault(fishTypeId, BigDecimal.ZERO);
            BigDecimal banThanhLy = liquidated.getOrDefault(fishTypeId, BigDecimal.ZERO);
            BigDecimal tieuHuy = destroyed.getOrDefault(fishTypeId, BigDecimal.ZERO);

            // Tồn kho là số lượng thực tế đang có tại thời điểm xem Dashboard,
            // không được suy ra từ nhập - bán - hao hụt trong khoảng thời gian lọc.
            BigDecimal tonKho = inventory.getOrDefault(fishTypeId, BigDecimal.ZERO);

            ketQua.add(LuanChuyenHangHoaResponse.builder()
                    .name(loaica.getTenloaica())
                    .nhap(nhap)
                    .ban(ban)
                    .banThanhLy(banThanhLy)
                    .tieuHuy(tieuHuy)
                    .tonKho(tonKho)
                    .build());
        }
        return ketQua;
    }

    // --- HÀM PHỤ ---

    private Map<Integer, BigDecimal> toMap(List<ThongKeLoaiCaProjection> values) {
        return values.stream().collect(Collectors.toMap(
                ThongKeLoaiCaProjection::getIdLoaiCa,
                value -> value.getTong() != null ? value.getTong() : BigDecimal.ZERO,
                BigDecimal::add));
    }

    // Quy đổi bộ lọc nhanh hoặc khoảng ngày tùy chọn thành mốc đầu/cuối đầy đủ.
    public KhoangThoiGian xacDinhKhoangThoiGian(String range, LocalDate from, LocalDate to) {
        LocalDate homNay = LocalDate.now();
        if ("CUSTOM".equals(range)) {
            if (from == null || to == null || from.isAfter(to)) {
                throw new IllegalArgumentException("Khoảng thời gian tùy chọn không hợp lệ");
            }
            return new KhoangThoiGian(from.atStartOfDay(), to.plusDays(1).atStartOfDay().minusNanos(1));
        }

        LocalDate ngayBatDau = switch (range) {
            case "TODAY" -> homNay;
            case "THIS_WEEK" -> homNay.minusDays(homNay.getDayOfWeek().getValue() - 1);
            case "THIS_QUARTER" -> homNay.withMonth(((homNay.getMonthValue() - 1) / 3) * 3 + 1).withDayOfMonth(1);
            case "THIS_YEAR" -> homNay.withDayOfYear(1);
            default -> homNay.withDayOfMonth(1); // THIS_MONTH
        };
        return new KhoangThoiGian(ngayBatDau.atStartOfDay(), LocalDateTime.now());
    }

    public record KhoangThoiGian(LocalDateTime tuNgay, LocalDateTime denNgay) {}

    @Transactional(readOnly = true)
    public TepBaoCaoExcel xuatBaoCao(String range, LocalDate from, LocalDate to) {
        KhoangThoiGian khoang = xacDinhKhoangThoiGian(range, from, to);
        ThongKeTongQuanResponse tongQuan = tinhTongQuan(range, from, to);
        List<LuanChuyenHangHoaResponse> luanChuyen = tinhLuanChuyenHangHoa(range, from, to);
        List<Donhang> donHangs = donhangRepository.findByNgaydatBetweenOrderByNgaydatDesc(
                khoang.tuNgay(), khoang.denNgay());
        List<LoHangResponse> loQuaHan = phieuthanhlyService.layDanhSachLoQuaHan();

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            DinhDangExcel styles = taoDinhDangExcel(workbook);
            LocalDateTime thoiDiemXuat = LocalDateTime.now();
            taoSheetTongQuan(workbook, styles, tongQuan, khoang, thoiDiemXuat);
            taoSheetLuanChuyen(workbook, styles, luanChuyen, khoang, thoiDiemXuat);
            taoSheetDonHang(workbook, styles, donHangs, khoang, thoiDiemXuat);
            taoSheetLoQuaHan(workbook, styles, loQuaHan, thoiDiemXuat);
            workbook.write(output);
            return new TepBaoCaoExcel(
                    "BaoCaoDashboard_%s_%s.xlsx".formatted(
                            khoang.tuNgay().toLocalDate(), khoang.denNgay().toLocalDate()),
                    output.toByteArray());
        } catch (IOException exception) {
            throw new IllegalStateException("Không thể tạo file Excel Dashboard", exception);
        }
    }

    private void taoSheetTongQuan(Workbook workbook, DinhDangExcel styles,
                                   ThongKeTongQuanResponse data, KhoangThoiGian khoang,
                                   LocalDateTime thoiDiemXuat) {
        Sheet sheet = workbook.createSheet("Tổng quan");
        taoTieuDeExcel(sheet, styles, "BÁO CÁO TỔNG QUAN DASHBOARD", 2);
        ghiThongTinExcel(sheet, styles, 2, "Từ ngày", khoang.tuNgay().toLocalDate(), styles.date());
        ghiThongTinExcel(sheet, styles, 3, "Đến ngày", khoang.denNgay().toLocalDate(), styles.date());
        ghiThongTinExcel(sheet, styles, 4, "Thời điểm xuất", thoiDiemXuat, styles.dateTime());
        ghiThongTinExcel(sheet, styles, 5, "Người xuất", layNguoiXuat(), styles.text());
        ghiHeaderExcel(sheet.createRow(7), styles, "Chỉ số", "Giá trị", "Ghi chú");

        BigDecimal chuaThanhToan = nz(data.getChiPhiNhapHang()).subtract(nz(data.getChiPhiNhapDaThanhToan()));
        List<List<Object>> rows = List.of(
                List.of("Doanh thu đơn hàng", nz(data.getTongDoanhThu()), "Chỉ tính đơn giao thành công"),
                List.of("Thu từ bán thanh lý", nz(data.getThuTuBanThanhLy()), "Không bao gồm tiêu hủy"),
                List.of("Chi phí nhập hàng", nz(data.getChiPhiNhapHang()), "Giá trị phiếu nhập phát sinh trong kỳ"),
                List.of("Chi phí nhập đã thanh toán", nz(data.getChiPhiNhapDaThanhToan()), "Phần đã xác nhận thanh toán"),
                List.of("Chi phí nhập chưa thanh toán", chuaThanhToan, "Chi phí nhập trừ phần đã thanh toán")
        );
        int rowIndex = 8;
        for (List<Object> values : rows) {
            Row row = sheet.createRow(rowIndex++);
            ghiOExcel(row, 0, values.get(0), styles.text());
            ghiOExcel(row, 1, values.get(1), styles.currency());
            ghiOExcel(row, 2, values.get(2), styles.text());
        }
        Row orders = sheet.createRow(rowIndex++);
        ghiOExcel(orders, 0, "Số đơn hoàn thành", styles.text());
        ghiOExcel(orders, 1, data.getDonHoanThanh(), styles.integer());
        ghiOExcel(orders, 2, "Đơn giao thành công trong kỳ", styles.text());
        Row lots = sheet.createRow(rowIndex);
        ghiOExcel(lots, 0, "Số lô quá hạn còn hàng", styles.text());
        ghiOExcel(lots, 1, data.getSoLoQuaHan(), styles.integer());
        ghiOExcel(lots, 2, "Số dư hiện tại, không phụ thuộc kỳ lọc", styles.text());
        hoanTatSheet(sheet, 7, rowIndex, new int[]{34, 24, 52});
    }

    private void taoSheetLuanChuyen(Workbook workbook, DinhDangExcel styles,
                                    List<LuanChuyenHangHoaResponse> data, KhoangThoiGian khoang,
                                    LocalDateTime thoiDiemXuat) {
        Sheet sheet = workbook.createSheet("Luân chuyển hàng hóa");
        taoTieuDeExcel(sheet, styles, "LUÂN CHUYỂN HÀNG HÓA THEO LOẠI CÁ", 8);
        ghiThongTinExcel(sheet, styles, 2, "Khoảng báo cáo",
                "%s đến %s".formatted(khoang.tuNgay().toLocalDate(), khoang.denNgay().toLocalDate()), styles.text());
        ghiThongTinExcel(sheet, styles, 3, "Ghi chú",
                "Phát sinh theo kỳ; tồn kho là số hiện tại lúc xuất " + thoiDiemXuat, styles.text());
        ghiHeaderExcel(sheet.createRow(5), styles, "Loại cá", "Nhập (kg)", "Bán (kg)",
                "Bán thanh lý (kg)", "Tiêu hủy (kg)", "Tồn hiện tại (kg)",
                "Tỷ lệ bán", "Tỷ lệ thanh lý", "Tỷ lệ hao hụt");
        int rowIndex = 6;
        for (LuanChuyenHangHoaResponse item : data) {
            Row row = sheet.createRow(rowIndex++);
            BigDecimal nhap = nz(item.getNhap());
            Object[] values = {item.getName(), nhap, item.getBan(), item.getBanThanhLy(), item.getTieuHuy(),
                    item.getTonKho(), tyLe(item.getBan(), nhap), tyLe(item.getBanThanhLy(), nhap),
                    tyLe(item.getTieuHuy(), nhap)};
            for (int i = 0; i < values.length; i++) {
                ghiOExcel(row, i, values[i], i == 0 ? styles.text() : i >= 6 ? styles.percent() : styles.decimal());
            }
        }
        hoanTatSheet(sheet, 5, Math.max(5, rowIndex - 1), new int[]{28, 20, 20, 22, 20, 22, 18, 20, 20});
    }

    private void taoSheetDonHang(Workbook workbook, DinhDangExcel styles,
                                 List<Donhang> donHangs, KhoangThoiGian khoang,
                                 LocalDateTime thoiDiemXuat) {
        Sheet sheet = workbook.createSheet("Chi tiết đơn hàng");
        taoTieuDeExcel(sheet, styles, "CHI TIẾT ĐƠN HÀNG TRONG KỲ", 14);
        ghiThongTinExcel(sheet, styles, 2, "Khoảng báo cáo",
                "%s đến %s".formatted(khoang.tuNgay().toLocalDate(), khoang.denNgay().toLocalDate()), styles.text());
        ghiThongTinExcel(sheet, styles, 3, "Thời điểm xuất", thoiDiemXuat, styles.dateTime());
        ghiHeaderExcel(sheet.createRow(5), styles, "Mã đơn", "Ngày đặt", "Khách hàng", "Số điện thoại",
                "Loại khách", "Loại cá", "Kích cỡ", "Đơn vị", "Số lượng", "Khối lượng (kg)",
                "Đơn giá/kg", "Thành tiền", "Tổng tiền đơn", "Trạng thái đơn", "Thanh toán");

        Map<String, Taikhoan> customers = taiKhoanRepository.findAllById(
                        donHangs.stream().map(Donhang::getIdthongtinkhachhang).filter(Objects::nonNull).toList())
                .stream().collect(Collectors.toMap(Taikhoan::getIdtaikhoan, Function.identity()));
        Map<String, List<Chitietdonhang>> details = donHangs.isEmpty() ? Map.of()
                : chitietdonhangRepository.findByIddonhangIn(donHangs).stream()
                .collect(Collectors.groupingBy(item -> item.getIddonhang().getIddonhang()));
        int rowIndex = 6;
        for (Donhang order : donHangs) {
            List<Chitietdonhang> items = details.getOrDefault(order.getIddonhang(), List.of());
            if (items.isEmpty()) items = Collections.singletonList(null);
            for (Chitietdonhang item : items) {
                rowIndex = ghiDongDonHangExcel(sheet, styles, rowIndex, order, item,
                        customers.get(order.getIdthongtinkhachhang()));
            }
        }
        hoanTatSheet(sheet, 5, Math.max(5, rowIndex - 1),
                new int[]{38, 20, 26, 17, 15, 24, 20, 15, 12, 18, 18, 20, 20, 24, 20});
    }

    private int ghiDongDonHangExcel(Sheet sheet, DinhDangExcel styles, int rowIndex,
                                    Donhang order, Chitietdonhang item, Taikhoan customer) {
        Row row = sheet.createRow(rowIndex);
        String tenKhach = customer == null ? giaTriHoac(order.getTenKhachLe(), "Khách vãng lai")
                : noiChuoi(customer.getHo(), customer.getTen());
        Object[] common = {order.getIddonhang(), order.getNgaydat(), tenKhach,
                customer == null ? order.getSdtKhachLe() : customer.getSodienthoai(),
                customer == null ? "Khách lẻ" : "Khách sỉ"};
        for (int i = 0; i < common.length; i++)
            ghiOExcel(row, i, common[i], i == 1 ? styles.dateTime() : styles.text());
        if (item != null) {
            BigDecimal kg = item.getKhoiluongthucte() != null ? item.getKhoiluongthucte() : item.getKhoiluongdukien();
            BigDecimal amount = item.getTongtienthucte() != null ? item.getTongtienthucte() : item.getTongtiendukien();
            BigDecimal price = nz(kg).signum() > 0 ? nz(amount).divide(kg, 2, RoundingMode.HALF_UP) : BigDecimal.ZERO;
            Object[] values = {item.getIdchitietcaban().getIdloaica().getTenloaica(),
                    item.getIdchitietcaban().getIdsizeca().getSizeca(), item.getIddonvitinh().getTendvt(),
                    item.getSoluong(), kg, price, amount};
            CellStyle[] cellStyles = {styles.text(), styles.text(), styles.text(), styles.integer(),
                    styles.decimal(), styles.currency(), styles.currency()};
            for (int i = 0; i < values.length; i++) ghiOExcel(row, i + 5, values[i], cellStyles[i]);
        }
        ghiOExcel(row, 12, order.getTongtien(), styles.currency());
        ghiOExcel(row, 13, nhanTrangThaiDonHang(order.getTrangthaidonhang()), styles.text());
        ghiOExcel(row, 14, nhanTrangThaiThanhToan(order.getTrangthaithanhtoan()), styles.text());
        return rowIndex + 1;
    }

    private void taoSheetLoQuaHan(Workbook workbook, DinhDangExcel styles,
                                  List<LoHangResponse> data, LocalDateTime thoiDiemXuat) {
        Sheet sheet = workbook.createSheet("Lô hàng quá hạn");
        taoTieuDeExcel(sheet, styles, "LÔ HÀNG QUÁ HẠN CÒN TỒN", 12);
        ghiThongTinExcel(sheet, styles, 2, "Thời điểm xuất", thoiDiemXuat, styles.dateTime());
        ghiThongTinExcel(sheet, styles, 3, "Điều kiện",
                "Còn hàng và ngày nhập cũ hơn " + LoHangQuaHanScheduler.SO_NGAY_QUA_HAN + " ngày", styles.text());
        ghiHeaderExcel(sheet.createRow(5), styles, "Mã lô", "Loại cá", "Kích cỡ", "Ngày nhập",
                "Số ngày lưu kho", "Số lượng nhập (kg)", "Còn lại (kg)", "Giá nhập", "Giá trị còn lại",
                "Giá bán lẻ hiện tại", "Giá bán sỉ hiện tại", "Ngày xử lý dự kiến", "Tình trạng");
        int rowIndex = 6;
        for (LoHangResponse item : data) {
            Row row = sheet.createRow(rowIndex++);
            Object[] values = {item.getIdchitietphieunhap(), item.getTenLoaiCa(), item.getTenSize(), item.getNgaynhap(),
                    item.getNgaynhap() == null ? 0 : ChronoUnit.DAYS.between(item.getNgaynhap(), thoiDiemXuat.toLocalDate()),
                    item.getSoluongnhap(), item.getSoluongconlai(), item.getGianhap(),
                    nz(item.getSoluongconlai()).multiply(nz(item.getGianhap())), item.getGiabanleHienTai(),
                    item.getGiabansiHienTai(), item.getNgaynhap() == null ? null
                    : item.getNgaynhap().plusDays(LoHangQuaHanScheduler.SO_NGAY_QUA_HAN), "Quá hạn"};
            for (int i = 0; i < values.length; i++) {
                CellStyle style = i <= 2 ? styles.text() : (i == 3 || i == 11) ? styles.date()
                        : (i == 4) ? styles.integer() : (i == 5 || i == 6) ? styles.decimal()
                        : (i >= 7 && i <= 10) ? styles.currency() : styles.warning();
                ghiOExcel(row, i, values[i], style);
            }
        }
        hoanTatSheet(sheet, 5, Math.max(5, rowIndex - 1),
                new int[]{38, 24, 20, 15, 18, 21, 18, 18, 20, 22, 22, 21, 15});
    }

    private DinhDangExcel taoDinhDangExcel(Workbook workbook) {
        DataFormat format = workbook.createDataFormat();
        Font titleFont = workbook.createFont(); titleFont.setBold(true); titleFont.setFontHeightInPoints((short) 16);
        titleFont.setColor(IndexedColors.WHITE.getIndex());
        CellStyle title = workbook.createCellStyle(); title.setFont(titleFont);
        title.setFillForegroundColor(IndexedColors.TEAL.getIndex()); title.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        title.setAlignment(HorizontalAlignment.CENTER);
        Font bold = workbook.createFont(); bold.setBold(true);
        CellStyle label = workbook.createCellStyle(); label.setFont(bold);
        label.setFillForegroundColor(IndexedColors.LIGHT_TURQUOISE.getIndex()); label.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        Font headerFont = workbook.createFont(); headerFont.setBold(true); headerFont.setColor(IndexedColors.WHITE.getIndex());
        CellStyle header = workbook.createCellStyle(); header.setFont(headerFont);
        header.setFillForegroundColor(IndexedColors.DARK_TEAL.getIndex()); header.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        header.setAlignment(HorizontalAlignment.CENTER); header.setWrapText(true); datVienExcel(header);
        CellStyle text = workbook.createCellStyle(); datVienExcel(text);
        CellStyle integer = taoStyleSo(workbook, text, format, "#,##0");
        CellStyle decimal = taoStyleSo(workbook, text, format, "#,##0.00");
        CellStyle currency = taoStyleSo(workbook, text, format, "#,##0 \"VNĐ\"");
        CellStyle percent = taoStyleSo(workbook, text, format, "0.00%");
        CellStyle date = taoStyleSo(workbook, text, format, "dd/mm/yyyy");
        CellStyle dateTime = taoStyleSo(workbook, text, format, "dd/mm/yyyy hh:mm");
        CellStyle warning = workbook.createCellStyle(); warning.cloneStyleFrom(text);
        warning.setFillForegroundColor(IndexedColors.ROSE.getIndex()); warning.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return new DinhDangExcel(title, label, header, text, integer, decimal, currency, percent, date, dateTime, warning);
    }

    private CellStyle taoStyleSo(Workbook workbook, CellStyle base, DataFormat format, String pattern) {
        CellStyle style = workbook.createCellStyle(); style.cloneStyleFrom(base); style.setDataFormat(format.getFormat(pattern));
        return style;
    }

    private void taoTieuDeExcel(Sheet sheet, DinhDangExcel styles, String value, int lastColumn) {
        Row row = sheet.createRow(0); row.setHeightInPoints(28);
        for (int i = 0; i <= lastColumn; i++) {
            Cell cell = row.createCell(i); cell.setCellStyle(styles.title());
            if (i == 0) cell.setCellValue(value);
        }
        sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, lastColumn));
    }

    private void ghiThongTinExcel(Sheet sheet, DinhDangExcel styles, int rowIndex,
                                  String label, Object value, CellStyle style) {
        Row row = sheet.createRow(rowIndex);
        ghiOExcel(row, 0, label, styles.label()); ghiOExcel(row, 1, value, style);
    }

    private void ghiHeaderExcel(Row row, DinhDangExcel styles, String... headers) {
        row.setHeightInPoints(32);
        for (int i = 0; i < headers.length; i++) ghiOExcel(row, i, headers[i], styles.header());
    }

    private void ghiOExcel(Row row, int column, Object value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value instanceof BigDecimal number) cell.setCellValue(number.doubleValue());
        else if (value instanceof Number number) cell.setCellValue(number.doubleValue());
        else if (value instanceof LocalDate date) cell.setCellValue(date);
        else if (value instanceof LocalDateTime dateTime) cell.setCellValue(dateTime);
        else if (value != null) cell.setCellValue(value.toString());
        cell.setCellStyle(style);
    }

    private void hoanTatSheet(Sheet sheet, int headerRow, int lastRow, int[] widths) {
        sheet.setAutoFilter(new CellRangeAddress(headerRow, lastRow, 0, widths.length - 1));
        sheet.createFreezePane(1, headerRow + 1);
        for (int i = 0; i < widths.length; i++) sheet.setColumnWidth(i, widths[i] * 256);
    }

    private void datVienExcel(CellStyle style) {
        style.setBorderTop(BorderStyle.THIN); style.setBorderRight(BorderStyle.THIN);
        style.setBorderBottom(BorderStyle.THIN); style.setBorderLeft(BorderStyle.THIN);
    }

    private String layNguoiXuat() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return taiKhoanRepository.findByEmail(email)
                .map(user -> "%s (%s)".formatted(noiChuoi(user.getHo(), user.getTen()), user.getEmail()))
                .orElse(email);
    }

    private String noiChuoi(String... values) {
        return Arrays.stream(values).filter(Objects::nonNull).map(String::trim).filter(v -> !v.isBlank())
                .collect(Collectors.joining(" "));
    }

    private String giaTriHoac(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }

    private BigDecimal nz(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }

    private double tyLe(BigDecimal value, BigDecimal total) {
        return nz(total).signum() <= 0 ? 0D : nz(value).divide(total, 6, RoundingMode.HALF_UP).doubleValue();
    }

    private String nhanTrangThaiDonHang(TrangThaiDonHang status) {
        if (status == null) return "Không xác định";
        return switch (status) {
            case CHO_XAC_NHAN -> "Chờ xác nhận";
            case DANG_DONG_HANG -> "Đang đóng hàng";
            case DANG_VAN_CHUYEN -> "Đang vận chuyển";
            case GIAO_HANG_THANH_CONG -> "Giao hàng thành công";
            case HUY -> "Đã hủy";
        };
    }

    private String nhanTrangThaiThanhToan(TrangThaiThanhToanDonHang status) {
        if (status == null) return "Không xác định";
        return status == TrangThaiThanhToanDonHang.DA_THANH_TOAN ? "Đã thanh toán" : "Chưa thanh toán";
    }

    public record TepBaoCaoExcel(String tenTep, byte[] noiDung) {}
    private record DinhDangExcel(CellStyle title, CellStyle label, CellStyle header, CellStyle text,
                                 CellStyle integer, CellStyle decimal, CellStyle currency, CellStyle percent,
                                 CellStyle date, CellStyle dateTime, CellStyle warning) {}

    private Instant toInstant(LocalDateTime thoiGian) {
        return thoiGian.atZone(ZoneId.of("Asia/Ho_Chi_Minh")).toInstant();
    }
}
