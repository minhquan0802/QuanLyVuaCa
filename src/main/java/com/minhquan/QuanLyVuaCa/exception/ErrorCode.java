package com.minhquan.QuanLyVuaCa.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {
    UNCATEGORIZED(9999,"UNCATEGORIZED", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_EXISTED(9998,"Da ton tai user",HttpStatus.CONFLICT),
    INVALID_KEY(9122,"KEY NOT VALID",HttpStatus.BAD_REQUEST),
    USER_NOT_EXISTED(1005, "User khong ton tai", HttpStatus.NOT_FOUND),
    IDVAITRO_EMPTY(1019, "Trang thai hoat dong khong duoc de trong", HttpStatus.BAD_REQUEST),

    // Validate du lieu dau vao
    FULL_NAME_INVALID(1008, "Ho va ten khong duoc de trong", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1009, "Email khong hop le", HttpStatus.BAD_REQUEST),
    PASSWORD_INVALID(1010, "Mat khau phai tu 8 den 50 ky tu", HttpStatus.BAD_REQUEST),
    VAITRO_INVALID(1017, "Vai tro khong duoc de trong", HttpStatus.BAD_REQUEST),
    TRANGTHAI_INVALID(1018, "Trang thai hoat dong khong duoc de trong", HttpStatus.BAD_REQUEST),


    // --- THEM MOI ---
    PHONE_INVALID(1015, "So dien thoai khong hop le (Phai co 10 so, bat dau bang so 0)", HttpStatus.BAD_REQUEST),
    ADDRESS_INVALID(1016, "Dia chi khong duoc de trong", HttpStatus.BAD_REQUEST),
// ----------------

    UNAUTHENTICATED(1006, "Ban chua dang nhap", HttpStatus.UNAUTHORIZED),
    LOAICA_NOT_EXISTED(1011, "Loai ca khong ton tai", HttpStatus.NOT_FOUND),
    DATA_EXISTED(1012, "Da ton tai data", HttpStatus.CONFLICT),
    PAYLOAD_TOO_LARGE(1013, "Dung luong file vuot qua gioi han cho phep", HttpStatus.PAYLOAD_TOO_LARGE),
    ACCESS_DENIED(1014, "Khong co quyen truy cap tai nguyen", HttpStatus.FORBIDDEN),
    UNAUTHORIZED(1007, "Ban khong co quyen thuc hien hanh dong nay", HttpStatus.UNAUTHORIZED);

    private int code;
    private String message;
    private HttpStatus status;
    ErrorCode(int code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}
