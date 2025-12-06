package com.minhquan.QuanLyVuaCa.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TaiKhoanCreationRequest {

    // Họ không được để trống -> Map về lỗi FULL_NAME_INVALID
    @NotBlank(message = "FULL_NAME_INVALID")
    String ho;

    // Tên không được để trống -> Map về lỗi FULL_NAME_INVALID
    @NotBlank(message = "FULL_NAME_INVALID")
    String ten;

    // Độ dài từ 8 đến 50 -> Map về lỗi PASSWORD_INVALID
    @NotBlank(message = "PASSWORD_INVALID")
    @Size(min = 8, max = 50, message = "PASSWORD_INVALID")
    String matkhau;

    // Phải đúng định dạng email -> Map về lỗi EMAIL_INVALID
    @NotBlank(message = "EMAIL_INVALID") // Check trống trước
    @Email(message = "EMAIL_INVALID")    // Check định dạng
            String email;

    // Validate số điện thoại Việt Nam: Bắt đầu bằng 0, theo sau là 9 chữ số
    @Pattern(regexp = "^0\\d{9}$", message = "PHONE_INVALID")
    String sodienthoai;

    // Địa chỉ không được để trống
    @NotBlank(message = "ADDRESS_INVALID")
    String diachi;
}