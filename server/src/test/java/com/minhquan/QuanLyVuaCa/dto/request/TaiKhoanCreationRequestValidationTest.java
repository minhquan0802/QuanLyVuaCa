package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class TaiKhoanCreationRequestValidationTest {
    private final Validator validator =
            Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void choPhepHoTrongKhiNguoiDungChiCoTenMotTu() {
        TaiKhoanCreationRequest request = TaiKhoanCreationRequest.builder()
                .ho("")
                .ten("Prince")
                .matkhau("safe-password")
                .email("prince@example.com")
                .sodienthoai("0901234567")
                .diachi("TP HCM")
                .vaitro("CUSTOMER")
                .build();

        assertTrue(validator.validate(request).isEmpty());
    }
}
