package com.minhquan.QuanLyVuaCa.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaCeationRequest;
import com.minhquan.QuanLyVuaCa.dto.request.LoaicaUpdateRequest;
import com.minhquan.QuanLyVuaCa.dto.response.LoaicaResponse;
import com.minhquan.QuanLyVuaCa.entity.Loaica;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.LoaicaMapper;
import com.minhquan.QuanLyVuaCa.repository.LoaicaRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE,makeFinal = true)
public class LoaicaService {
    LoaicaRepository loaicaRepository;
    LoaicaMapper mapper;
//    final String UPLOAD_DIR = "D:/SynologyDrive/Dev/Project_on_school/Nam_4_HK1/Do_An_HK1_Nam4/ThucTapChuyenNganh/sourceCode/BE/QuanLyVuaCa/images/loaica/";
    Cloudinary cloudinary; // inject thay vì UPLOAD_DIR

    public List<LoaicaResponse> getLoaiCa(){
        List<Loaica> Loaicas = loaicaRepository.findAll();
        List<LoaicaResponse> responses = new ArrayList<>();
        for (Loaica lc : Loaicas) {
            responses.add(mapper.toLoaicaResponse(lc));
        }
        return responses;
    }
    public LoaicaResponse timLoaica(Integer id){
        return mapper.toLoaicaResponse(loaicaRepository.findById(id).orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED)));
    }


    public LoaicaResponse capNhatLoaica(Integer id, LoaicaUpdateRequest request) {
        // Tìm loại cá cũ
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        loaica.setTenloaica(request.getTenloaica());
        loaica.setMieuta(request.getMieuta());

        // XỬ LÝ ẢNH
        MultipartFile newFile = request.getHinhanh();

        // Chỉ xử lý nếu có file mới được upload lên
        if (newFile != null && !newFile.isEmpty()) {
            // A. Xóa ảnh cũ đi (tránh rác bộ nhớ)
            String oldFileName = loaica.getHinhanhurl();
            deleteFile(oldFileName);

            // B. Tạo tên file mới (theo tên loại cá mới)
            String baseName = slugify(request.getTenloaica());
            String extension = Objects.requireNonNull(newFile.getOriginalFilename())
                    .substring(newFile.getOriginalFilename().lastIndexOf("."));
            String finalFileName = baseName + extension;

            // C. Upload lên Cloudinary và lấy URL
            String cloudinaryUrl = saveImage(newFile, finalFileName);

            // D. Cập nhật Cloudinary URL vào DB
            loaica.setHinhanhurl(cloudinaryUrl);
        }
        // Nếu không có file mới, giữ nguyên hinhanhurl cũ

        Loaica updated = loaicaRepository.save(loaica);
        return mapper.toLoaicaResponse(updated);
    }

    public void xoaLoaica(Integer id) {
        Loaica loaica = loaicaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.USER_NOT_EXISTED));

        deleteFile(loaica.getHinhanhurl());

        loaicaRepository.deleteById(id);
    }

    private String slugify(String input) {
        return Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-zA-Z0-9]+", "-")
                .toLowerCase();
    }

//    public String saveImage(MultipartFile file, String fileName) {
//        try {
//            String uploadDir = "D:/SynologyDrive/Dev/Project_on_school/Nam_4_HK1/Do_An_HK1_Nam4/ThucTapChuyenNganh/sourceCode/BE/QuanLyVuaCa/images/loaica/";
//
//            // Tạo folder nếu chưa tồn tại
//            Path uploadPath = Paths.get(uploadDir);
//            if (!Files.exists(uploadPath)) {
//                Files.createDirectories(uploadPath);
//            }
//            if (!Files.exists(uploadPath)) {
//                Files.createDirectories(uploadPath);
//            }
//
//            Path filePath = uploadPath.resolve(fileName);
//            file.transferTo(filePath.toFile());
//
//            System.out.println("Đã lưu file ảnh: " + filePath.toAbsolutePath());
//            return fileName;
//        } catch (IOException e) {
//            throw new RuntimeException("Không thể lưu ảnh: " + e.getMessage(), e);
//        }
//    }

//    private void deleteFile(String fileName) {
//        if (fileName == null || fileName.isEmpty()) return;
//        try {
//            Path filePath = Paths.get(UPLOAD_DIR).resolve(fileName);
//            Files.deleteIfExists(filePath);
//            System.out.println("Đã xóa ảnh cũ: " + filePath.toString());
//        } catch (IOException e) {
//            System.err.println("Không thể xóa ảnh cũ: " + e.getMessage());
//        }
//    }

    public String saveImage(MultipartFile file, String fileName) {
        try {
            // Bỏ extension khỏi public_id để Cloudinary quản lý format, và deleteFile strip đúng
            String publicIdName = fileName.replaceAll("\\.[^.]+$", ""); // "ca-tram.jpg" → "ca-tram"
            Map result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "public_id", "loaica/" + publicIdName,
                            "overwrite", true
                    )
            );
            return (String) result.get("secure_url");
        } catch (IOException e) {
            throw new RuntimeException("Không thể upload ảnh: " + e.getMessage(), e);
        }
    }

    private void deleteFile(String imageUrl) {
        if (imageUrl == null || imageUrl.isEmpty()) return;
        try {
            // Lấy public_id từ URL: .../loaica/ten-ca.jpg -> loaica/ten-ca
            String publicId = imageUrl
                    .substring(imageUrl.indexOf("/loaica/") + 1)
                    .replaceAll("\\.[^.]+$", "");
            cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (Exception e) {
            log.error("Không thể xóa ảnh cũ: {}", e.getMessage());
        }
    }



    public LoaicaResponse taoLoaica(LoaicaCeationRequest request) {

        if (loaicaRepository.existsByTenloaica(request.getTenloaica())) {
            throw new AppExceptions(ErrorCode.DATA_EXISTED);
        }

        Loaica loaica = new Loaica();
        loaica.setTenloaica(request.getTenloaica());
        loaica.setMieuta(request.getMieuta());

        MultipartFile file = request.getHinhanh(); // MultipartFile từ FE

        if (file != null && !file.isEmpty()) {
            String baseName = slugify(request.getTenloaica());
            String extension = Objects.requireNonNull(file.getOriginalFilename())
                    .substring(file.getOriginalFilename().lastIndexOf("."));
            String finalFileName = baseName + extension;

            String cloudinaryUrl = saveImage(file, finalFileName);
            loaica.setHinhanhurl(cloudinaryUrl);
        }

        Loaica saved = loaicaRepository.save(loaica);
        return mapper.toLoaicaResponse(saved);
    }
}
