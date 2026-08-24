package com.minhquan.QuanLyVuaCa.aspect;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.minhquan.QuanLyVuaCa.annotation.GhiNhatKy;
import com.minhquan.QuanLyVuaCa.service.NhatKyThaoTacService;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Aspect ghi nhật ký cho các method gắn @GhiNhatKy.
 *
 * Dùng @Around chứ không @Before: chỉ ghi khi nghiệp vụ đã chạy xong thành công, tránh nhật ký
 * đầy những thao tác thực ra đã bị validate chặn lại.
 *
 * Aspect chỉ chụp được tham số đầu vào (ghi vào giatrimoi). Nơi nào cần cả giá trị cũ thì gọi
 * thẳng NhatKyThaoTacService.ghi(...) trong service — chỗ đó mới biết giá trị trước khi sửa.
 */
@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class NhatKyThaoTacAspect {

    NhatKyThaoTacService nhatKyThaoTacService;
    ObjectMapper objectMapper;

    @Around("@annotation(ghiNhatKy)")
    public Object ghiNhatKy(ProceedingJoinPoint joinPoint, GhiNhatKy ghiNhatKy) throws Throwable {
        Object ketQua = joinPoint.proceed();

        try {
            Object[] thamSo = joinPoint.getArgs();
            String idBanGhi = layIdBanGhi(thamSo, ghiNhatKy.thamSoId());
            String giaTriMoi = chuyenThanhJson(joinPoint, thamSo);

            nhatKyThaoTacService.ghi(
                    ghiNhatKy.bang(),
                    idBanGhi,
                    ghiNhatKy.hanhDong(),
                    null,
                    giaTriMoi,
                    ghiNhatKy.ghiChu().isBlank() ? null : ghiNhatKy.ghiChu());
        } catch (Exception e) {
            log.warn("Aspect nhật ký lỗi tại {}: {}", joinPoint.getSignature().toShortString(), e.getMessage());
        }

        return ketQua;
    }

    private String layIdBanGhi(Object[] thamSo, int viTri) {
        if (viTri < 0 || thamSo == null || viTri >= thamSo.length || thamSo[viTri] == null) {
            return null;
        }
        return String.valueOf(thamSo[viTri]);
    }

    /**
     * Serialize tham số đầu vào. Đối tượng nào Jackson không xử lý được (proxy lazy của Hibernate,
     * MultipartFile...) thì hạ xuống toString thay vì làm hỏng cả bản ghi nhật ký.
     */
    private String chuyenThanhJson(ProceedingJoinPoint joinPoint, Object[] thamSo) {
        if (thamSo == null || thamSo.length == 0) return null;

        String[] tenThamSo = ((MethodSignature) joinPoint.getSignature()).getParameterNames();
        Map<String, Object> duLieu = new LinkedHashMap<>();

        for (int i = 0; i < thamSo.length; i++) {
            String ten = (tenThamSo != null && i < tenThamSo.length && tenThamSo[i] != null)
                    ? tenThamSo[i] : ("thamSo" + i);
            duLieu.put(ten, chuyenGiaTriAnToan(thamSo[i]));
        }

        try {
            return objectMapper.writeValueAsString(duLieu);
        } catch (Exception e) {
            return String.valueOf(duLieu);
        }
    }

    private Object chuyenGiaTriAnToan(Object giaTri) {
        if (giaTri == null) return null;
        try {
            objectMapper.writeValueAsString(giaTri);
            return giaTri;
        } catch (Exception e) {
            return String.valueOf(giaTri);
        }
    }
}
