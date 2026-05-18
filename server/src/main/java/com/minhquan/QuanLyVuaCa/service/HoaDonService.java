package com.minhquan.QuanLyVuaCa.service;

import com.lowagie.text.*;
import com.lowagie.text.Font;
import com.lowagie.text.Rectangle;
import com.lowagie.text.pdf.*;
import com.minhquan.QuanLyVuaCa.configuration.HoaDonConfig;
import com.minhquan.QuanLyVuaCa.entity.*;
import com.minhquan.QuanLyVuaCa.repository.*;
import jakarta.annotation.PostConstruct;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.Security;
import java.security.cert.Certificate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HoaDonService {

    DonhangRepository donhangRepository;
    ChitietdonhangRepository chitietdonhangRepository;
    TaiKhoanRepository taikhoanRepository;
    HoaDonRepository hoaDonRepository;
    HoaDonConfig hoaDonConfig;

    @PostConstruct
    void registerBouncyCastle() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
    }

    // ─── Ký số PDF ────────────────────────────────────────────────────────────
    // Demo: dùng self-signed cert (.p12 tạo bằng keytool)
    // Thật: thay file .p12 bằng USB Token CA thật → không đổi code
    private byte[] kyHoaDon(byte[] pdfBytes) {
        if (!hoaDonConfig.getChuKySo().isEnabled()) {
            return pdfBytes;
        }
        try {
            HoaDonConfig.ChuKySo cfg = hoaDonConfig.getChuKySo();

            KeyStore ks = KeyStore.getInstance("PKCS12");
            // Hỗ trợ cả classpath: và đường dẫn file thường
            String path = cfg.getKeystorePath();
            try (InputStream is = path.startsWith("classpath:")
                    ? getClass().getClassLoader().getResourceAsStream(path.substring(10))
                    : new FileInputStream(path)) {
                ks.load(is, cfg.getKeystorePassword().toCharArray());
            }

            String alias = ks.aliases().nextElement();
            PrivateKey privateKey = (PrivateKey) ks.getKey(alias, cfg.getKeystorePassword().toCharArray());
            Certificate[] chain = ks.getCertificateChain(alias);

            PdfReader reader = new PdfReader(pdfBytes);
            ByteArrayOutputStream signedOut = new ByteArrayOutputStream();
            PdfStamper stamper = PdfStamper.createSignature(reader, signedOut, '\0');

            PdfSignatureAppearance sap = stamper.getSignatureAppearance();
            sap.setCrypto(privateKey, chain, null, PdfSignatureAppearance.WINCER_SIGNED);
            sap.setReason("Hóa đơn điện tử VAT");
            sap.setLocation("TP. Hồ Chí Minh");
            sap.setAcro6Layers(true);

            stamper.close();
            reader.close();
            return signedOut.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi ký số PDF: " + e.getMessage(), e);
        }
    }

    @Transactional
    public byte[] xuatHoaDonPdf(String iddonhang, float vatRate) {
        Donhang donhang = donhangRepository.findById(iddonhang)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng: " + iddonhang));

        List<Chitietdonhang> chiTiet = chitietdonhangRepository.findByIddonhang(donhang);

        // Tính tiền hàng (chưa VAT)
        BigDecimal tienHang = chiTiet.stream()
                .map(ct -> ct.getTongtienthucte() != null ? ct.getTongtienthucte() : ct.getTongtiendukien())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal vatRateBD = BigDecimal.valueOf(vatRate);
        BigDecimal tienThue = tienHang.multiply(vatRateBD).setScale(0, RoundingMode.HALF_UP);
        BigDecimal tongThanhToan = tienHang.add(tienThue);

        // Lấy hoặc tạo bản ghi HoaDon
        HoaDon hoaDon = hoaDonRepository.findByDonhang(donhang).orElseGet(() -> {
            // Số hóa đơn 8 chữ số theo TT78 (đếm tuần tự từ 00000001)
            long soThuTu = hoaDonRepository.count() + 1;
            String soHD = String.format("%08d", soThuTu);
            // Ký hiệu TT78: 1=GTGT, C=Có mã CQT, YY=năm, T=MST, AA=tự chọn
            String kyHieu = "1C" + (LocalDateTime.now().getYear() % 100) + "TAA";
            return HoaDon.builder()
                    .donhang(donhang)
                    .soHoaDon(soHD)
                    .kyHieu(kyHieu)
                    // maCqt để null — điền thật khi có kết nối TCT
                    .trangThaiHoaDon("CHUA_XUAT")
                    .build();
        });

        hoaDon.setVatRate(vatRate);
        hoaDon.setTienHang(tienHang);
        hoaDon.setTienThue(tienThue);
        hoaDon.setTongThanhToan(tongThanhToan);
        hoaDon.setTrangThaiHoaDon("DA_XUAT");
        hoaDon.setNgayXuat(LocalDateTime.now());
        hoaDonRepository.save(hoaDon);

        // Lấy thông tin khách hàng
        String tenKhach = "Khách lẻ";
        String sdtKhach = "";
        String diaChiKhach = "";
        if (donhang.getIdthongtinkhachhang() != null) {
            taikhoanRepository.findById(donhang.getIdthongtinkhachhang()).ifPresent(kh -> {
                // Không thể set local var trong lambda — dùng array trick
            });
            var khOpt = taikhoanRepository.findById(donhang.getIdthongtinkhachhang());
            if (khOpt.isPresent()) {
                Taikhoan kh = khOpt.get();
                tenKhach = kh.getHo() + " " + kh.getTen();
                sdtKhach = kh.getSodienthoai() != null ? kh.getSodienthoai() : "";
                diaChiKhach = kh.getDiachi() != null ? kh.getDiachi() : "";
            }
        }

        byte[] pdfBytes = buildPdf(hoaDon, chiTiet, tenKhach, sdtKhach, diaChiKhach, vatRate, tienHang, tienThue, tongThanhToan);
        return kyHoaDon(pdfBytes);
    }

    private byte[] buildPdf(HoaDon hoaDon, List<Chitietdonhang> chiTiet,
                             String tenKhach, String sdtKhach, String diaChiKhach,
                             float vatRate, BigDecimal tienHang, BigDecimal tienThue, BigDecimal tongThanhToan) {
        try (ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Document doc = new Document(PageSize.A4, 40, 40, 40, 40);
            PdfWriter.getInstance(doc, out);
            doc.open();

            // ── Font chữ hỗ trợ tiếng Việt (Arial Windows) ──────────────────
            BaseFont bf = BaseFont.createFont("C:/Windows/Fonts/arial.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);
            BaseFont bfBold = BaseFont.createFont("C:/Windows/Fonts/arialbd.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED);

            Font fontTitle   = new Font(bfBold, 16, Font.BOLD, new Color(0, 70, 127));
            Font fontSubtitle = new Font(bfBold, 10, Font.BOLD);
            Font fontNormal  = new Font(bf, 9);
            Font fontBold    = new Font(bfBold, 9, Font.BOLD);
            Font fontSmall   = new Font(bf, 8, Font.ITALIC, Color.GRAY);
            Font fontHeader  = new Font(bfBold, 9, Font.BOLD, Color.WHITE);
            Font fontRed     = new Font(bfBold, 8, Font.BOLD, new Color(180, 0, 0));

            // ── Tiêu đề ───────────────────────────────────────────────────────
            Paragraph quocHieu = new Paragraph("CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM", new Font(bfBold, 11, Font.BOLD));
            quocHieu.setAlignment(Element.ALIGN_CENTER);
            doc.add(quocHieu);

            Paragraph docLap = new Paragraph("Độc lập - Tự do - Hạnh phúc", fontSubtitle);
            docLap.setAlignment(Element.ALIGN_CENTER);
            doc.add(docLap);

            doc.add(new Paragraph(" "));

            Paragraph tieuDe = new Paragraph("HÓA ĐƠN GIÁ TRỊ GIA TĂNG", fontTitle);
            tieuDe.setAlignment(Element.ALIGN_CENTER);
            doc.add(tieuDe);

            Paragraph kyHieuP = new Paragraph("Ký hiệu mẫu số: " + hoaDon.getKyHieu() + "     Số: " + hoaDon.getSoHoaDon(), fontBold);
            kyHieuP.setAlignment(Element.ALIGN_CENTER);
            doc.add(kyHieuP);

            LocalDateTime ngay = hoaDon.getNgayXuat();
            String ngayStr = String.format("Ngày %02d tháng %02d năm %d", ngay.getDayOfMonth(), ngay.getMonthValue(), ngay.getYear());
            Paragraph ngayP = new Paragraph(ngayStr, fontNormal);
            ngayP.setAlignment(Element.ALIGN_CENTER);
            doc.add(ngayP);

            // ── Mã cơ quan thuế (bắt buộc theo TT78) ────────────────────────
            doc.add(new Paragraph(" "));
            PdfPTable maCqtTable = new PdfPTable(1);
            maCqtTable.setWidthPercentage(60);
            maCqtTable.setHorizontalAlignment(Element.ALIGN_CENTER);
            String maCqtText = (hoaDon.getMaCqt() != null && !hoaDon.getMaCqt().isEmpty())
                    ? hoaDon.getMaCqt()
                    : "DEMO - CHƯA CÓ MÃ CQT";
            PdfPCell maCqtCell = new PdfPCell(new Phrase("Mã của cơ quan thuế: " + maCqtText,
                    new Font(bfBold, 10, Font.BOLD, new Color(180, 0, 0))));
            maCqtCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            maCqtCell.setPadding(6);
            maCqtCell.setBorderColor(new Color(180, 0, 0));
            maCqtTable.addCell(maCqtCell);
            doc.add(maCqtTable);

            doc.add(new Paragraph(" "));

            // ── Thông tin người bán ───────────────────────────────────────────
            HoaDonConfig.NguoiBan nb = hoaDonConfig.getNguoiBan();
            addDongThongTin(doc, "Đơn vị bán hàng: ", nb.getTen(), fontBold, fontBold);
            addDongThongTin(doc, "Mã số thuế: ", nb.getMst(), fontBold, fontNormal);
            addDongThongTin(doc, "Địa chỉ: ", nb.getDiaChi(), fontBold, fontNormal);
            addDongThongTin(doc, "Điện thoại: ", nb.getDienThoai(), fontBold, fontNormal);
            if (nb.getTaiKhoanNganHang() != null && !nb.getTaiKhoanNganHang().isEmpty()) {
                addDongThongTin(doc, "Tài khoản ngân hàng: ", nb.getTaiKhoanNganHang(), fontBold, fontNormal);
            }

            doc.add(new Paragraph(" "));

            // ── Thông tin người mua ───────────────────────────────────────────
            addDongThongTin(doc, "Họ tên người mua hàng: ", tenKhach, fontBold, fontNormal);
            addDongThongTin(doc, "Điện thoại: ", sdtKhach.isEmpty() ? "—" : sdtKhach, fontBold, fontNormal);
            addDongThongTin(doc, "Địa chỉ: ", diaChiKhach.isEmpty() ? "—" : diaChiKhach, fontBold, fontNormal);
            addDongThongTin(doc, "Hình thức thanh toán: ", "Tiền mặt / Chuyển khoản", fontBold, fontNormal);

            doc.add(new Paragraph(" "));

            // ── Bảng hàng hóa ────────────────────────────────────────────────
            PdfPTable table = new PdfPTable(new float[]{0.5f, 3f, 1f, 1.2f, 1.5f, 1.8f});
            table.setWidthPercentage(100);

            String[] headers = {"STT", "Tên hàng hóa, dịch vụ", "ĐVT", "Số lượng (kg)", "Đơn giá (đ/kg)", "Thành tiền (đ)"};
            Color headerColor = new Color(0, 70, 127);
            for (String h : headers) {
                PdfPCell cell = new PdfPCell(new Phrase(h, fontHeader));
                cell.setBackgroundColor(headerColor);
                cell.setHorizontalAlignment(Element.ALIGN_CENTER);
                cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
                cell.setPadding(5);
                table.addCell(cell);
            }

            int stt = 1;
            for (Chitietdonhang ct : chiTiet) {
                BigDecimal kgThucTe = ct.getKhoiluongthucte() != null ? ct.getKhoiluongthucte() : ct.getKhoiluongdukien();
                BigDecimal thanhTien = ct.getTongtienthucte() != null ? ct.getTongtienthucte() : ct.getTongtiendukien();
                BigDecimal donGia = (kgThucTe != null && kgThucTe.compareTo(BigDecimal.ZERO) > 0 && thanhTien != null)
                        ? thanhTien.divide(kgThucTe, 0, RoundingMode.HALF_UP)
                        : BigDecimal.ZERO;

                String tenCa = ct.getIdchitietcaban().getIdloaica().getTenloaica();
                String size = ct.getIdchitietcaban().getIdsizeca().getSizeca();
                String tenHang = tenCa + " (" + size + ")";

                addRow(table, String.valueOf(stt++), tenHang,
                        "kg",
                        formatSo(kgThucTe),
                        formatTien(donGia),
                        formatTien(thanhTien),
                        fontNormal, stt % 2 == 0);
            }

            doc.add(table);
            doc.add(new Paragraph(" "));

            // ── Tổng tiền ─────────────────────────────────────────────────────
            PdfPTable tongTienTable = new PdfPTable(new float[]{4f, 2f});
            tongTienTable.setWidthPercentage(60);
            tongTienTable.setHorizontalAlignment(Element.ALIGN_RIGHT);

            addTongRow(tongTienTable, "Cộng tiền hàng:", formatTien(tienHang), fontBold, fontNormal);
            addTongRow(tongTienTable, "Thuế suất GTGT (" + Math.round(vatRate * 100) + "%):", formatTien(tienThue), fontBold, fontNormal);

            PdfPCell labelTong = new PdfPCell(new Phrase("TỔNG CỘNG TIỀN THANH TOÁN:", fontBold));
            labelTong.setBorder(Rectangle.TOP);
            labelTong.setPadding(4);
            tongTienTable.addCell(labelTong);

            PdfPCell valueTong = new PdfPCell(new Phrase(formatTien(tongThanhToan) + " đ", new Font(bfBold, 10, Font.BOLD, new Color(180, 0, 0))));
            valueTong.setBorder(Rectangle.TOP);
            valueTong.setHorizontalAlignment(Element.ALIGN_RIGHT);
            valueTong.setPadding(4);
            tongTienTable.addCell(valueTong);

            doc.add(tongTienTable);

            // ── Số tiền bằng chữ ─────────────────────────────────────────────
            Paragraph bangChu = new Paragraph("Số tiền bằng chữ: " + docTienBangChu(tongThanhToan) + " đồng.", fontBold);
            doc.add(bangChu);

            // ── Chữ ký điện tử (TT78 - không dùng ký tay) ───────────────────
            doc.add(new Paragraph(" "));
            doc.add(new Paragraph(" "));
            PdfPTable kyTable = new PdfPTable(2);
            kyTable.setWidthPercentage(100);

            // Cột người mua
            PdfPCell kyNguoiMua = new PdfPCell();
            kyNguoiMua.setBorder(Rectangle.BOX);
            kyNguoiMua.setPadding(8);
            kyNguoiMua.setMinimumHeight(70);
            Paragraph pMua = new Paragraph();
            pMua.add(new Chunk("NGƯỜI MUA HÀNG\n", fontBold));
            pMua.add(new Chunk("Người mua chưa ký điện tử", new Font(bf, 8, Font.ITALIC, Color.GRAY)));
            pMua.setAlignment(Element.ALIGN_CENTER);
            kyNguoiMua.addElement(pMua);
            kyTable.addCell(kyNguoiMua);

            // Cột người bán — hiển thị theo trạng thái chữ ký số
            String ngayKy = String.format("%02d/%02d/%d", ngay.getDayOfMonth(), ngay.getMonthValue(), ngay.getYear());
            PdfPCell kyNguoiBan = new PdfPCell();
            kyNguoiBan.setBorder(Rectangle.BOX);
            kyNguoiBan.setPadding(8);
            kyNguoiBan.setMinimumHeight(70);
            Paragraph pBan = new Paragraph();
            pBan.add(new Chunk("NGƯỜI BÁN HÀNG\n", fontBold));
            if (hoaDonConfig.getChuKySo().isEnabled()) {
                // Có chữ ký số → hiện thông tin ký điện tử
                kyNguoiBan.setBackgroundColor(new Color(240, 248, 240));
                pBan.add(new Chunk("Được ký điện tử bởi:\n", new Font(bf, 8)));
                pBan.add(new Chunk(hoaDonConfig.getNguoiBan().getTen() + "\n", new Font(bfBold, 9, Font.BOLD, new Color(0, 100, 0))));
                pBan.add(new Chunk("Ngày ký: " + ngayKy, new Font(bf, 8)));
            } else {
                // Chưa có chữ ký số → ô ký tay truyền thống
                pBan.add(new Chunk("(Ký, đóng dấu, ghi rõ họ tên)", new Font(bf, 8, Font.ITALIC, Color.GRAY)));
            }
            pBan.setAlignment(Element.ALIGN_CENTER);
            kyNguoiBan.addElement(pBan);
            kyTable.addCell(kyNguoiBan);

            doc.add(kyTable);

            // Ghi chú demo
            doc.add(new Paragraph(" "));
            if (hoaDon.getMaCqt() == null || hoaDon.getMaCqt().isEmpty()) {
                Paragraph demoNote = new Paragraph("* DEMO - Hóa đơn chưa có mã cơ quan thuế. Không có giá trị pháp lý.", fontRed);
                doc.add(demoNote);
            }

            doc.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("Lỗi tạo PDF hóa đơn: " + e.getMessage(), e);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void addDongThongTin(Document doc, String label, String value, Font fontLabel, Font fontValue) throws DocumentException {
        Paragraph p = new Paragraph();
        p.add(new Chunk(label, fontLabel));
        p.add(new Chunk(value, fontValue));
        p.setSpacingAfter(2);
        doc.add(p);
    }

    private void addRow(PdfPTable table, String stt, String tenHang, String dvt,
                        String soLuong, String donGia, String thanhTien,
                        Font font, boolean shaded) {
        Color bg = shaded ? new Color(240, 245, 255) : Color.WHITE;
        String[] vals = {stt, tenHang, dvt, soLuong, donGia, thanhTien};
        int[] aligns = {Element.ALIGN_CENTER, Element.ALIGN_LEFT, Element.ALIGN_CENTER,
                Element.ALIGN_RIGHT, Element.ALIGN_RIGHT, Element.ALIGN_RIGHT};
        for (int i = 0; i < vals.length; i++) {
            PdfPCell cell = new PdfPCell(new Phrase(vals[i], font));
            cell.setBackgroundColor(bg);
            cell.setHorizontalAlignment(aligns[i]);
            cell.setPadding(4);
            table.addCell(cell);
        }
    }

    private void addTongRow(PdfPTable table, String label, String value, Font fontLabel, Font fontValue) {
        PdfPCell lCell = new PdfPCell(new Phrase(label, fontLabel));
        lCell.setBorder(Rectangle.NO_BORDER);
        lCell.setPadding(3);
        table.addCell(lCell);

        PdfPCell vCell = new PdfPCell(new Phrase(value + " đ", fontValue));
        vCell.setBorder(Rectangle.NO_BORDER);
        vCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        vCell.setPadding(3);
        table.addCell(vCell);
    }

    private String formatTien(BigDecimal amount) {
        if (amount == null) return "0";
        return String.format("%,.0f", amount);
    }

    private String formatSo(BigDecimal so) {
        if (so == null) return "0";
        return String.format("%.2f", so);
    }

    // ── Đọc tiền bằng chữ (Tiếng Việt) ──────────────────────────────────────
    private static final String[] donVi = {"", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"};
    private static final String[] hang  = {"", "nghìn", "triệu", "tỷ"};

    private String docTienBangChu(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) == 0) return "Không";
        long so = amount.setScale(0, RoundingMode.HALF_UP).longValue();
        if (so == 0) return "Không";
        String ket = docSo(so).trim();
        return Character.toUpperCase(ket.charAt(0)) + ket.substring(1);
    }

    private String docSo(long so) {
        if (so == 0) return "";
        if (so < 0) return "âm " + docSo(-so);

        StringBuilder sb = new StringBuilder();
        int nhom = 0;
        long[] parts = new long[4];
        long temp = so;
        for (int i = 0; i < 4 && temp > 0; i++) {
            parts[i] = temp % 1000;
            temp /= 1000;
        }
        for (int i = 3; i >= 0; i--) {
            if (parts[i] > 0) {
                sb.append(docBachu(parts[i])).append(" ").append(hang[i]).append(" ");
            }
        }
        return sb.toString().trim();
    }

    private String docBachu(long so) {
        long tram = so / 100;
        long chuc = (so % 100) / 10;
        long donvi = so % 10;
        StringBuilder sb = new StringBuilder();
        if (tram > 0) sb.append(donVi[(int) tram]).append(" trăm ");
        if (chuc == 0 && donvi > 0 && tram > 0) {
            sb.append("lẻ ").append(donVi[(int) donvi]);
        } else if (chuc == 1) {
            sb.append("mười ");
            if (donvi > 0) sb.append(donvi == 5 ? "lăm" : donVi[(int) donvi]);
        } else if (chuc > 1) {
            sb.append(donVi[(int) chuc]).append(" mươi ");
            if (donvi == 1) sb.append("mốt");
            else if (donvi == 5) sb.append("lăm");
            else if (donvi > 0) sb.append(donVi[(int) donvi]);
        } else {
            if (donvi > 0) sb.append(donVi[(int) donvi]);
        }
        return sb.toString().trim();
    }
}
