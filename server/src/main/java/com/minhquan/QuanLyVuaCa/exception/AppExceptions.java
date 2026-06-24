package com.minhquan.QuanLyVuaCa.exception;

public class AppExceptions extends RuntimeException {
    private ErrorCode errorCode;
    public AppExceptions(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    // Dùng khi cần kèm chi tiết động (tên sản phẩm, số lượng cụ thể...) vào message,
    // thay vì chỉ message tĩnh của errorCode.
    public AppExceptions(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
    }

    public AppExceptions(ErrorCode errorCode, String message, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public void setErrorCode(ErrorCode errorCode) {
        this.errorCode = errorCode;
    }
}
