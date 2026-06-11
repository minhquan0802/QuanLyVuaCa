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

    ACCOUNT_LOCKED(1028, "Tai khoan da bi khoa", HttpStatus.FORBIDDEN),
    UNAUTHENTICATED(1006, "Ban chua dang nhap", HttpStatus.UNAUTHORIZED),
    LOAICA_NOT_EXISTED(1011, "Loai ca khong ton tai", HttpStatus.NOT_FOUND),
    DATA_EXISTED(1012, "Da ton tai data", HttpStatus.CONFLICT),
    PAYLOAD_TOO_LARGE(1013, "Dung luong file vuot qua gioi han cho phep", HttpStatus.PAYLOAD_TOO_LARGE),
    ACCESS_DENIED(1014, "Khong co quyen truy cap tai nguyen", HttpStatus.FORBIDDEN),
    UNAUTHORIZED(1007, "Ban khong co quyen thuc hien hanh dong nay", HttpStatus.UNAUTHORIZED),
    BLACKLIST(1009, "Token nam trong danh sach den", HttpStatus.UNAUTHORIZED),

    // ---SIZE CA & CHI TIET CA BAN---
    SIZECA_NOT_EXISTED(1020, "Size ca khong ton tai", HttpStatus.NOT_FOUND),
    CHITIET_CABAN_EXISTED(1021, "San pham (Loai + Size) nay da ton tai trong kho", HttpStatus.CONFLICT),
    CHITIET_CABAN_NOT_EXISTED(1022, "San pham khong ton tai", HttpStatus.NOT_FOUND),
    CANNOT_DELETE_DATA_IN_USE(1023, "Khong the xoa vi san pham da co phat sinh giao dich (Lien ket khoa ngoai)", HttpStatus.CONFLICT),

    // DON HANG & KHO ---
    DONHANG_NOT_EXISTED(1024, "Don hang khong ton tai", HttpStatus.NOT_FOUND),
    CHITIET_DONHANG_NOT_EXISTED(1025, "Chi tiet don hang khong ton tai", HttpStatus.NOT_FOUND),
    ORDER_STATUS_INVALID(1026, "Trang thai don hang khong hop le de thuc hien hanh dong nay", HttpStatus.BAD_REQUEST),
    INVENTORY_NOT_ENOUGH(1027, "So luong ton kho khong du de thuc hien giao dich", HttpStatus.CONFLICT),
    EMAIL_TOKEN_INVALID(1029, "Token xac thuc email khong hop le hoac da het han", HttpStatus.BAD_REQUEST),
    ACCOUNT_PENDING_EMAIL(1030, "Tai khoan chua xac thuc email", HttpStatus.FORBIDDEN),
    ACCOUNT_PENDING_APPROVAL(1031, "Tai khoan dang cho admin phe duyet", HttpStatus.FORBIDDEN),
    RESET_TOKEN_INVALID(1032, "Link dat lai mat khau khong hop le hoac da het han", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(1033, "Mat khau hien tai khong dung", HttpStatus.BAD_REQUEST);

    private final int code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(int code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}
