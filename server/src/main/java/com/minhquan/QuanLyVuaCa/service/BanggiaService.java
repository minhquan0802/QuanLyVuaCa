package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.BanggiaResponse;
import com.minhquan.QuanLyVuaCa.entity.Banggia;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.exception.AppExceptions;
import com.minhquan.QuanLyVuaCa.exception.ErrorCode;
import com.minhquan.QuanLyVuaCa.mapper.BanggiaMapper;
import com.minhquan.QuanLyVuaCa.repository.BanggiaRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BanggiaService {

    BanggiaRepository banggiaRepository;
    ChitietcabanRepository chitietcabanRepository;
    BanggiaMapper banggiaMapper;

    @Transactional(readOnly = true)
    public List<BanggiaResponse> layTatCa() {
        return banggiaRepository.findAllByNgayketthucIsNull().stream()
                .map(this::themTrangThaiVaoResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BanggiaResponse> layLichSu() {
        return banggiaRepository.findAll().stream()
                .map(this::themTrangThaiVaoResponse)
                .toList();
    }

    @Transactional
    public BanggiaResponse taoMoi(BanggiaRequest request) {
        kiemTraGia(request.getGiabanle(), request.getGiabansi());

        Chitietcaban product = chitietcabanRepository.findById(request.getIdchitietcaban())
                .orElseThrow(() -> new AppExceptions(ErrorCode.CHITIET_CABAN_NOT_EXISTED));
        if (Boolean.TRUE.equals(product.getDeleted())) {
            throw new AppExceptions(ErrorCode.BANGGIA_FOR_DELETED_PRODUCT);
        }

        var currentPrice = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(product);
        if (currentPrice.isPresent()) {
            Banggia oldPrice = currentPrice.get();
            if (request.getGiabanle().compareTo(oldPrice.getGiabanle()) == 0
                    && request.getGiabansi().compareTo(oldPrice.getGiabansi()) == 0) {
                throw new AppExceptions(ErrorCode.BANGGIA_TRUNG_GIA_CU);
            }
            if (LocalDate.now().equals(oldPrice.getNgaybatdau())) {
                oldPrice.setGiabanle(request.getGiabanle());
                oldPrice.setGiabansi(request.getGiabansi());
                return themTrangThaiVaoResponse(banggiaRepository.save(oldPrice));
            }
            oldPrice.setNgayketthuc(LocalDate.now().minusDays(1));
            banggiaRepository.save(oldPrice);
        }

        Banggia newPrice = new Banggia();
        newPrice.setChitietcaban(product);
        newPrice.setGiabanle(request.getGiabanle());
        newPrice.setGiabansi(request.getGiabansi());
        newPrice.setNgaybatdau(LocalDate.now());
        newPrice.setNgayketthuc(null);
        return themTrangThaiVaoResponse(banggiaRepository.save(newPrice));
    }

    @Transactional
    public void xoa(Integer id) {
        Banggia price = banggiaRepository.findById(id)
                .orElseThrow(() -> new AppExceptions(ErrorCode.BANGGIA_NOT_EXISTED));
        if (price.getNgayketthuc() != null) {
            return;
        }

        LocalDate yesterday = LocalDate.now().minusDays(1);
        price.setNgayketthuc(
                price.getNgaybatdau() != null && price.getNgaybatdau().isAfter(yesterday)
                        ? price.getNgaybatdau()
                        : yesterday);
        banggiaRepository.save(price);
    }

    private static final BigDecimal GIA_TOI_THIEU = BigDecimal.valueOf(1000);

    private void kiemTraGia(BigDecimal retailPrice, BigDecimal wholesalePrice) {
        if (retailPrice == null || retailPrice.compareTo(GIA_TOI_THIEU) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANLE_INVALID);
        }
        if (wholesalePrice == null || wholesalePrice.compareTo(GIA_TOI_THIEU) <= 0) {
            throw new AppExceptions(ErrorCode.GIABANSI_INVALID);
        }
        if (wholesalePrice.compareTo(retailPrice) > 0) {
            throw new AppExceptions(ErrorCode.BANGGIA_RELATION_INVALID);
        }
    }

    private BanggiaResponse themTrangThaiVaoResponse(Banggia entity) {
        BanggiaResponse response = banggiaMapper.toResponse(entity);
        LocalDate today = LocalDate.now();
        if (entity.getNgayketthuc() == null) {
            response.setTrangThai(entity.getNgaybatdau() != null && entity.getNgaybatdau().isAfter(today)
                    ? "Sắp áp dụng"
                    : "Đang áp dụng");
        } else {
            response.setTrangThai("Đã hết hạn");
        }
        return response;
    }
}
