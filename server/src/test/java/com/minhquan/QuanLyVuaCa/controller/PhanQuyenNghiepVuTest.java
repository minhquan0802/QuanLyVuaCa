package com.minhquan.QuanLyVuaCa.controller;

import com.minhquan.QuanLyVuaCa.dto.request.PhieuthanhlyRequest;
import org.junit.jupiter.api.Test;
import org.springframework.security.access.prepost.PreAuthorize;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

/**
 * Bao ve khai bao phan quyen cua cac thao tac lam thay doi tien va ton kho.
 * Day la test hop dong annotation; viec Spring chan HTTP 403 can duoc kiem tra
 * rieng bang integration test khi du an co profile test va JWT test fixture.
 */
class PhanQuyenNghiepVuTest {

    @Test
    void chiAdminDuocLapPhieuThanhLy() throws Exception {
        assertQuyen(PhieuthanhlyController.class,
                "taoPhieuThanhly",
                new Class<?>[]{PhieuthanhlyRequest.class},
                "hasRole('ADMIN')");
    }

    @Test
    void adminVaStaffDuocXacNhanChuyenKhoan() throws Exception {
        assertQuyen(ThanhtoanController.class,
                "xacNhanThanhToan",
                new Class<?>[]{String.class},
                "hasAnyRole('ADMIN', 'STAFF')");
    }

    @Test
    void chiAdminDuocGhiNhanThanhToanTienMat() throws Exception {
        assertQuyen(ThanhtoanController.class,
                "ghiNhanThanhToanThuCong",
                new Class<?>[]{String.class},
                "hasRole('ADMIN')");
    }

    private void assertQuyen(Class<?> controller, String methodName,
                             Class<?>[] parameterTypes, String expectedExpression) throws Exception {
        Method method = controller.getMethod(methodName, parameterTypes);
        PreAuthorize annotation = method.getAnnotation(PreAuthorize.class);

        assertNotNull(annotation, "Thao tac nhay cam phai khai bao @PreAuthorize");
        assertEquals(expectedExpression, annotation.value());
    }
}
