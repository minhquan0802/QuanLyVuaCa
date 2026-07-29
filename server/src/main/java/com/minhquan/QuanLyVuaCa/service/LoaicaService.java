package com.minhquan.QuanLyVuaCa.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
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

        MultipartFile newFile = request.getHinhanh();
        String oldImageUrl = loaica.getHinhanhurl();
        String newImageUrl = null;
        if (newFile != null && !newFile.isEmpty()) {
            kiemTraAnh(newFile);
            newImageUrl = saveImage(newFile, taoTenFileAnh(tenLoaiCa, newFile));
        }

        loaica.setTenloaica(tenLoaiCa);
        loaica.setMieuta(chuanHoaChuoi(request.getMieuta()));
        if (newImageUrl != null) {
            loaica.setHinhanhurl(newImageUrl);
        }

        Loaica updated;
        try {
            updated = loaicaRepository.saveAndFlush(loaica);
        } catch (RuntimeException exception) {
            if (newImageUrl != null) {
                xoaFile(newImageUrl);
            }
            throw exception;
        }

        if (newImageUrl != null && oldImageUrl != null && !oldImageUrl.equals(newImageUrl)) {
            xoaFile(oldImageUrl);
        }
        return mapper.toLoaicaResponse(updated);
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
    public void khoiPhucLoaica(Integer id) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.LOAICA_NOT_EXISTED));
        List<Chitietcaban> danhSachKho = chitietcabanRepository.findByIdloaica(loaica);
        danhSachKho.forEach(chitiet -> chitiet.setDeleted(false));
        chitietcabanRepository.saveAll(danhSachKho);
        loaica.setDeleted(false);
        loaicaRepository.save(loaica);
    }

    public LoaicaResponse taoLoaica(LoaicaCeationRequest request) {
        String tenLoaiCa = request.getTenloaica().trim();
        if (loaicaRepository.existsByTenloaicaIgnoreCase(tenLoaiCa)) {
            throw new AppExceptions(ErrorCode.DATA_EXISTED);
        }

        Loaica loaica = new Loaica();
        loaica.setTenloaica(tenLoaiCa);
        loaica.setMieuta(chuanHoaChuoi(request.getMieuta()));

        MultipartFile file = request.getHinhanh();
        String imageUrl = null;
        if (file != null && !file.isEmpty()) {
            kiemTraAnh(file);
            imageUrl = saveImage(file, taoTenFileAnh(tenLoaiCa, file));
            loaica.setHinhanhurl(imageUrl);
        }

        try {
            return mapper.toLoaicaResponse(loaicaRepository.saveAndFlush(loaica));
        } catch (RuntimeException exception) {
            if (imageUrl != null) {
                xoaFile(imageUrl);
            }
            throw exception;
        }
    }

    private String chuanHoaChuoi(String value) {
        return value == null ? null : value.trim();
    }

    private void kiemTraAnh(MultipartFile file) {
        Set<String> allowedContentTypes = Set.of("image/jpeg", "image/png", "image/webp");
        String contentType = file.getContentType();
        if (file.isEmpty() || contentType == null
                || !allowedContentTypes.contains(contentType.toLowerCase())) {
            throw new AppExceptions(ErrorCode.LOAICA_IMAGE_INVALID);
        }
    }

    private String taoTenFileAnh(String tenLoaiCa, MultipartFile file) {
        String extension = switch (Objects.requireNonNull(file.getContentType()).toLowerCase()) {
            case "image/jpeg" -> ".jpg";
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> throw new AppExceptions(ErrorCode.LOAICA_IMAGE_INVALID);
        };
        return slugify(tenLoaiCa) + "-" + UUID.randomUUID() + extension;
    }

    private String slugify(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .replaceAll("(^-|-$)", "")
                .toLowerCase();
    }

    public String saveImage(MultipartFile file, String fileName) {
        try {
            String publicIdName = fileName.replaceAll("\\.[^.]+$", "");
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", "loaica/" + publicIdName,
                            "overwrite", false
                    )
            );
            return (String) result.get("secure_url");
        } catch (IOException exception) {
            throw new AppExceptions(
                    ErrorCode.UPLOAD_ANH_THAT_BAI,
                    "Không thể upload ảnh: " + exception.getMessage(),
                    exception
            );
        }
    }

    private void xoaFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank() || !imageUrl.contains("/loaica/")) {
            return;
        }
        try {
            String publicId = imageUrl
                    .substring(imageUrl.indexOf("/loaica/") + 1)
                    .replaceAll("\\.[^.]+$", "");
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception exception) {
            log.error("Không thể xóa ảnh Cloudinary cũ: {}", exception.getMessage());
        }
    }
}
