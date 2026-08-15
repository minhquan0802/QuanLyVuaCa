package com.minhquan.QuanLyVuaCa.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.CauHinhKichThuocVaGiaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.ChitietCabanCreationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.request.MoLaiLoaiCaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.SizecaRequest;
import com.minhquan.QuanLyVuaCa.dto.request.TaoLoaiCaHoanChinhRequest;
import com.minhquan.QuanLyVuaCa.dto.response.ChitietCabanResponse;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.entity.Banggia;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.LoaicaMapper;
import com.minhquan.QuanLyVuaCa.repository.BanggiaRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class LoaicaService {
    LoaicaRepository loaicaRepository;
    LoaicaMapper mapper;
    ChitietcabanRepository chitietcabanRepository;
    BanggiaRepository banggiaRepository;
    Cloudinary cloudinary;
    SizecaService sizecaService;
    ChitietCabanService chitietCabanService;
    BanggiaService banggiaService;

    @Transactional(readOnly = true)
    public List<LoaicaResponse> layLoaiCa() {
        return toResponses(loaicaRepository.findAllByDeletedFalse());
    }

    @Transactional(readOnly = true)
    public List<LoaicaResponse> layTatCaLoaiCa() {
        return toResponses(loaicaRepository.findAll());
    }

    private List<LoaicaResponse> toResponses(List<Loaica> entities) {
        List<LoaicaResponse> responses = new ArrayList<>();
        for (Loaica entity : entities) {
            responses.add(mapper.toLoaicaResponse(entity));
        }
        return responses;
    }

    @Transactional(readOnly = true)
    public LoaicaResponse timLoaica(Integer id) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));
        return mapper.toLoaicaResponse(loaica);
    }

    public LoaicaResponse capNhatLoaica(Integer id, LoaicaUpdateRequest request) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));
        String tenLoaiCa = request.getTenloaica().trim();
        if (loaicaRepository.existsByTenloaicaIgnoreCaseAndIdNot(tenLoaiCa, id)) {
            throw new AppExceptions(ErrorCode.DATA_EXISTED);
        }

        MultipartFile fileMoi = request.getHinhanh();
        String urlAnhCu = loaica.getHinhanhurl();
        String urlAnhMoi = null;
        if (fileMoi != null && !fileMoi.isEmpty()) {
            kiemTraAnh(fileMoi);
            urlAnhMoi = saveImage(fileMoi, taoTenFileAnh(tenLoaiCa, fileMoi));
        }

        loaica.setTenloaica(tenLoaiCa);
        loaica.setMieuta(chuanHoaChuoi(request.getMieuta()));
        if (urlAnhMoi != null) {
            loaica.setHinhanhurl(urlAnhMoi);
        }

        Loaica daCapNhat;
        try {
            daCapNhat = loaicaRepository.saveAndFlush(loaica);
        } catch (RuntimeException exception) {
            if (urlAnhMoi != null) {
                xoaFile(urlAnhMoi);
            }
            throw exception;
        }

        if (urlAnhMoi != null && urlAnhCu != null && !urlAnhCu.equals(urlAnhMoi)) {
            xoaFile(urlAnhCu);
        }
        return mapper.toLoaicaResponse(daCapNhat);
    }

    @Transactional
    public void xoaLoaica(Integer id) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));

        if (chitietcabanRepository.existsByIdloaicaAndSoluongtonGreaterThan(loaica, BigDecimal.ZERO)) {
            throw new AppExceptions(ErrorCode.LOAICA_CON_TON_KHO);
        }

        List<Chitietcaban> danhSachKho = chitietcabanRepository.findByIdloaica(loaica);
        List<Banggia> banggiaConHan =
                banggiaRepository.findByChitietcabanInAndNgayketthucIsNull(danhSachKho);
        banggiaConHan.forEach(banggia -> banggia.setNgayketthuc(LocalDate.now()));
        banggiaRepository.saveAll(banggiaConHan);

        danhSachKho.forEach(chitiet -> chitiet.setDeleted(true));
        chitietcabanRepository.saveAll(danhSachKho);
        loaica.setDeleted(true);
        loaicaRepository.save(loaica);
    }

    @Transactional
    public LoaicaResponse khoiPhucLoaica(Integer id, MoLaiLoaiCaRequest request) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));
        if (!Boolean.TRUE.equals(loaica.getDeleted())) {
            throw new AppExceptions(ErrorCode.LOAICA_ALREADY_ACTIVE);
        }

        List<CauHinhKichThuocVaGiaRequest> cauHinhs = request.getCauhinhkichthuoc();
        if (cauHinhs == null || cauHinhs.isEmpty()) {
            throw new AppExceptions(ErrorCode.CAUHINH_SIZE_EMPTY);
        }

        List<Chitietcaban> danhSachKho = chitietcabanRepository.findByIdloaica(loaica);
        List<Banggia> bangGiaConHan =
                banggiaRepository.findByChitietcabanInAndNgayketthucIsNull(danhSachKho);
        bangGiaConHan.forEach(bangGia -> bangGia.setNgayketthuc(LocalDate.now()));
        banggiaRepository.saveAll(bangGiaConHan);

        danhSachKho.forEach(chitiet -> chitiet.setDeleted(true));
        chitietcabanRepository.saveAll(danhSachKho);

        cauHinhKichThuocVaGia(id, cauHinhs);

        loaica.setDeleted(false);
        return mapper.toLoaicaResponse(loaicaRepository.save(loaica));
    }

    /**
     * Loại bỏ khoảng trắng thừa ở đầu và cuối chuỗi trước khi lưu xuống cơ sở dữ liệu.
     * Hàm vẫn giữ nguyên giá trị {@code null} để phân biệt với chuỗi rỗng.
     */
    private String chuanHoaChuoi(String value) {
        return value == null ? null : value.trim();
    }

    /**
     * Kiểm tra ảnh đại diện trước khi upload.
     * Chỉ chấp nhận tệp không rỗng thuộc một trong ba định dạng JPEG, PNG hoặc WebP.
     */
    private void kiemTraAnh(MultipartFile file) {
        Set<String> allowedContentTypes = Set.of("image/jpeg", "image/png", "image/webp");
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null
                || !allowedContentTypes.contains(contentType.toLowerCase())) {
            throw new AppExceptions(ErrorCode.LOAICA_IMAGE_INVALID);
        }
    }

    /**
     * Tạo tên ảnh duy nhất từ tên loại cá, UUID và phần mở rộng tương ứng với MIME type.
     * Cách đặt tên này giúp dễ nhận biết ảnh trên Cloudinary và tránh ghi đè ảnh đã tồn tại.
     */
    private String taoTenFileAnh(String tenLoaiCa, MultipartFile file) {
        String extension = switch (Objects.requireNonNull(file.getContentType()).toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new AppExceptions(ErrorCode.LOAICA_IMAGE_INVALID);
        };
        return slugify(tenLoaiCa) + "-" + UUID.randomUUID() + extension;
    }

    /**
     * Chuyển tên loại cá thành chuỗi an toàn để dùng làm một phần public ID của ảnh.
     * Ví dụ: "Cá Điêu Hồng" được chuyển thành "ca-dieu-hong".
     */
    private String slugify(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase();
    }

    /**
     * Upload ảnh vào thư mục {@code loaica} trên Cloudinary và trả về URL HTTPS của ảnh.
     * Nếu upload thất bại, lỗi kỹ thuật được chuyển thành lỗi nghiệp vụ của ứng dụng.
     */
    public String saveImage(MultipartFile file, String tenFile) {
        try {
            String publicId = tenFile.replaceAll("\\.[^.]+$", "");
            Map<?, ?> ketQua = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", "loaica/" + publicId,
                            "overwrite", false
                    )
            );
            return (String) ketQua.get("secure_url");
        } catch (IOException exception) {
            throw new AppExceptions(
                    ErrorCode.UPLOAD_ANH_THAT_BAI,
                    "Không thể upload ảnh: " + exception.getMessage(),
                    exception
            );
        }
    }

    /**
     * Xóa ảnh loại cá đã upload trên Cloudinary.
     * Hàm được dùng để dọn ảnh khi giao dịch tạo loại cá thất bại, tránh sinh tệp rác
     * vì giao dịch cơ sở dữ liệu không thể tự rollback dữ liệu đã gửi lên Cloudinary.
     */
    private void xoaFile(String urlAnh) {
        if (urlAnh == null || urlAnh.isBlank() || !urlAnh.contains("/loaica/")) {
            return;
        }
        try {
            String publicId = urlAnh
                    .substring(urlAnh.indexOf("/loaica/") + 1)
                    .replaceAll("\\.[^.]+$", "");
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception exception) {
            log.error("Không thể xóa ảnh Cloudinary cũ: {}", exception.getMessage());
        }
    }

//    Controller
//   ↓
//    taoLoaiCaHoanChinh()
//   ├─ chuanHoaChuoi()
//   ├─ Nếu có ảnh:
//            │    ├─ kiemTraAnh()
//   │    ├─ taoTenFileAnh()
//   │    │    └─ slugify()
//   │    └─ saveImage()
//   ├─ Lưu loại cá
//   └─ cauHinhKichThuocVaGia()
//        └─ Lặp qua từng kích cỡ:
//            ├─ resolveSizeId()
//             │    ├─ Dùng kích cỡ có sẵn
//             │    └─ Hoặc gọi SizecaService.taoSize()
//            ├─ ChitietCabanService.taoMoi()
//            └─ BanggiaService.taoMoi()
//
//    Nếu có lỗi:
//            └─ xoaFile() → xóa ảnh đã upload

    /**
     * Tạo hoàn chỉnh một loại cá cùng ảnh, danh sách kích cỡ, số kg quy đổi và bảng giá ban đầu.
     *
     * <p>Luồng xử lý:</p>
     * <ol>
     *     <li>Chuẩn hóa và kiểm tra tên loại cá không bị trùng.</li>
     *     <li>Kiểm tra, upload ảnh nếu người dùng có chọn ảnh.</li>
     *     <li>Lưu thông tin loại cá để lấy ID.</li>
     *     <li>Tạo từng mặt hàng loại cá-kích cỡ với tồn ban đầu bằng 0.</li>
     *     <li>Tạo bảng giá sỉ và lẻ ban đầu cho từng mặt hàng.</li>
     * </ol>
     *
     * <p>{@link Transactional} bảo đảm dữ liệu loại cá, kích cỡ kho và bảng giá cùng thành công
     * hoặc cùng rollback. Riêng ảnh Cloudinary được xóa thủ công trong khối catch nếu có lỗi.</p>
     */
    @Transactional
    public LoaicaResponse taoLoaiCaHoanChinh(
            TaoLoaiCaHoanChinhRequest request,
            MultipartFile hinhanh) {
        String tenLoaiCa = request.getTenloaica().trim();
        if (loaicaRepository.existsByTenloaicaIgnoreCase(tenLoaiCa)) {
            throw new AppExceptions(ErrorCode.DATA_EXISTED);
        }

        String urlAnh = null;
        try {
            Loaica entity = mapper.toLoaica(request);
            entity.setTenloaica(tenLoaiCa);
            entity.setMieuta(chuanHoaChuoi(request.getMieuta()));
            if (hinhanh != null && !hinhanh.isEmpty()) {
                kiemTraAnh(hinhanh);
                urlAnh = saveImage(hinhanh, taoTenFileAnh(tenLoaiCa, hinhanh));
                entity.setHinhanhurl(urlAnh);
            }

            LoaicaResponse loaiCa =
                    mapper.toLoaicaResponse(loaicaRepository.saveAndFlush(entity));
            List<CauHinhKichThuocVaGiaRequest> cauHinhs =
                    request.getCauhinhkichthuoc() == null
                            ? List.of()
                            : request.getCauhinhkichthuoc();

            cauHinhKichThuocVaGia(loaiCa.getId(), cauHinhs);

            return loaiCa;
        } catch (RuntimeException exception) {
            if (urlAnh != null) {
                xoaFile(urlAnh);
            }
            throw exception;
        }
    }

    /**
     * Xác định ID kích cỡ cho một dòng cấu hình.
     * Người dùng phải chọn đúng một trong hai cách: dùng kích cỡ có sẵn hoặc nhập tên kích cỡ mới.
     * Nếu nhập kích cỡ mới, hàm gọi {@link SizecaService} để tạo rồi trả về ID vừa sinh.
     */
    private Integer resolveSizeId(CauHinhKichThuocVaGiaRequest cauHinh) {
        boolean coSizeSan = cauHinh.getIdsizeca() != null;
        boolean coSizeMoi = cauHinh.getTensizemoi() != null
                && !cauHinh.getTensizemoi().isBlank();
        if (coSizeSan == coSizeMoi) {
            throw new AppExceptions(ErrorCode.CAUHINH_SIZE_INVALID);
        }

        if (coSizeSan) {
            return cauHinh.getIdsizeca();
        }

        return sizecaService.taoSize(
                        SizecaRequest.builder()
                                .sizeca(cauHinh.getTensizemoi())
                                .build())
                .getIdsizeca();
    }

    /**
     * Tạo cấu hình bán cho tất cả kích cỡ của loại cá vừa thêm.
     * Mỗi kích cỡ tạo một bản ghi kho {@code Chitietcaban} với tồn bằng 0 và một bảng giá hiện hành.
     * Danh sách ID đã xử lý được lưu trong Set để ngăn cấu hình trùng kích cỡ trong cùng yêu cầu.
     */
    private void cauHinhKichThuocVaGia(
            Integer idLoaiCa,
            List<CauHinhKichThuocVaGiaRequest> cauHinhs) {
        Set<Integer> sizeDaCauHinh = new HashSet<>();
        for (CauHinhKichThuocVaGiaRequest cauHinh : cauHinhs) {
            Integer idSize = resolveSizeId(cauHinh);
            if (!sizeDaCauHinh.add(idSize)) {
                throw new AppExceptions(ErrorCode.CAUHINH_SIZE_TRUNG);
            }

            ChitietCabanResponse chiTiet = chitietCabanService.taoMoi(
                    ChitietCabanCreationRequest.builder()
                            .idloaica(idLoaiCa)
                            .idsizeca(idSize)
                            .soluongton(BigDecimal.ZERO)
                            .sokgtuongung(cauHinh.getSokgtuongung())
                            .build());

            banggiaService.taoMoi(
                    BanggiaRequest.builder()
                            .idchitietcaban(chiTiet.getId())
                            .giabanle(cauHinh.getGiabanle())
                            .giabansi(cauHinh.getGiabansi())
                            .build());
        }
    }

}
