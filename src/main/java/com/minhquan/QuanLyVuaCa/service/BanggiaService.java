package com.minhquan.QuanLyVuaCa.service;

import com.minhquan.QuanLyVuaCa.dto.request.BanggiaRequest;
import com.minhquan.QuanLyVuaCa.dto.response.BanggiaResponse;
import com.minhquan.QuanLyVuaCa.entity.Banggia;
import com.minhquan.QuanLyVuaCa.entity.Chitietcaban;
import com.minhquan.QuanLyVuaCa.mapper.BanggiaMapper;
import com.minhquan.QuanLyVuaCa.repository.BanggiaRepository;
import com.minhquan.QuanLyVuaCa.repository.ChitietcabanRepository;
import jakarta.transaction.Transactional;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class BanggiaService {

    BanggiaRepository banggiaRepository;
    ChitietcabanRepository chitietcabanRepository;
    BanggiaMapper banggiaMapper;

    // Lấy danh sách
    public List<BanggiaResponse> getAll() {
        return banggiaRepository.findAll().stream()
                .map(this::enrichStatus)
                .collect(Collectors.toList());
    }

    // --- LOGIC TẠO GIÁ MỚI ---
    @Transactional // Quan trọng: Để đảm bảo cả update cái cũ và insert cái mới cùng thành công
    public BanggiaResponse create(BanggiaRequest request) {

        // 1. Tìm sản phẩm trong kho
        Chitietcaban sp = chitietcabanRepository.findById(request.getIdchitietcaban())
                .orElseThrow(() -> new RuntimeException("Sản phẩm không tồn tại trong kho"));

        // 2. XỬ LÝ BẢNG GIÁ CŨ (Nếu có)
        // Tìm xem sản phẩm này có giá nào đang chạy không (ngayketthuc = null)
        Optional<Banggia> oldPriceOpt = banggiaRepository.findByChitietcabanAndNgayketthucIsNull(sp);

        if (oldPriceOpt.isPresent()) {
            Banggia oldPrice = oldPriceOpt.get();

            // Chốt ngày kết thúc cho giá cũ là "Hôm qua" 
            // (Để giá mới bắt đầu từ "Hôm nay" không bị trùng lắp)
            oldPrice.setNgayketthuc(LocalDate.now().minusDays(1));

            banggiaRepository.save(oldPrice);
        }

        // 3. TẠO BẢNG GIÁ MỚI
        Banggia newPrice = new Banggia();
        newPrice.setChitietcaban(sp);
        newPrice.setGiabanle(request.getGiabanle());
        newPrice.setGiabansi(request.getGiabansi());

        // Logic theo yêu cầu: Ngày bắt đầu = Hiện tại, Ngày kết thúc = Null
        newPrice.setNgaybatdau(LocalDate.now());
        newPrice.setNgayketthuc(null);

        return enrichStatus(banggiaRepository.save(newPrice));
    }

    // Hàm phụ để hiển thị trạng thái cho đẹp
    private BanggiaResponse enrichStatus(Banggia entity) {
        BanggiaResponse res = banggiaMapper.toResponse(entity);
        LocalDate now = LocalDate.now();

        if (entity.getNgayketthuc() == null) {
            // Nếu start <= now -> Đang áp dụng
            if (!entity.getNgaybatdau().isAfter(now)) {
                res.setTrangThai("Đang áp dụng");
            } else {
                res.setTrangThai("Sắp áp dụng"); // Trường hợp set cho tương lai
            }
        } else {
            // Đã có ngày kết thúc -> Đã hết hạn (Lịch sử)
            res.setTrangThai("Đã hết hạn");
        }
        return res;
    }

    public void delete(Integer id) {
        if(!banggiaRepository.existsById(id)) throw new RuntimeException("Không tìm thấy");
        banggiaRepository.deleteById(id);
    }
}