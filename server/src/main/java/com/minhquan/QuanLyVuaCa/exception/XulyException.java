package com.minhquan.QuanLyVuaCa.exception;

import com.minhquan.QuanLyVuaCa.dto.response.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.async.AsyncRequestTimeoutException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

@ControllerAdvice
@Slf4j
public class XulyException {

    // Kết nối SSE (/ThongBao/subscribe) hết hạn timeout là bình thường (client tự reconnect).
    // AsyncRequestTimeoutException kế thừa RuntimeException nên nếu không chặn riêng ở đây, nó sẽ
    // rơi vào handler RuntimeException bên dưới và cố ghi JSON vào response — nhưng response đã bị
    // khóa Content-Type ở text/event-stream từ trước, gây thêm HttpMessageNotWritableException chồng lên.
    @ExceptionHandler(value = AsyncRequestTimeoutException.class)
    void xulyAsyncTimeout(AsyncRequestTimeoutException exception) {
        log.debug("Ket noi bat dong bo (SSE) het han - tu dong dong, client se tu ket noi lai.");
    }

    // SỬA LẠI HÀM NÀY
    @ExceptionHandler(value = RuntimeException.class)
    ResponseEntity<ApiResponse> xulyRuntimeException (RuntimeException exception)
    {
        // In lỗi ra console để bạn biết nó chết ở đâu (Quan trọng!)
        log.error("Exception occurred: ", exception);

        ApiResponse apiResponse = new ApiResponse();

        // Thay vì UNAUTHORIZED, hãy dùng UNCATEGORIZED (9999)
        apiResponse.setCode(ErrorCode.UNCATEGORIZED.getCode());

        // Lấy message lỗi chính
        String message = exception.getMessage();

        // NẾU CÓ NGUYÊN NHÂN SÂU XA (ROOT CAUSE), NỐI THÊM VÀO ĐỂ DỄ ĐỌC LỖI
        if (exception.getCause() != null) {
            message += " -> Caused by: " + exception.getCause().getMessage();
            // Đào sâu thêm 1 lớp nữa nếu có (thường là lỗi SQL nằm ở đây)
            if (exception.getCause().getCause() != null) {
                message += " -> Root: " + exception.getCause().getCause().getMessage();
            }
        }

        // Kèm theo message thực tế của lỗi để debug
        apiResponse.setMessage(ErrorCode.UNCATEGORIZED.getMessage() + ": " + exception.getMessage());

        return ResponseEntity.badRequest().body(apiResponse);
    }

    @ExceptionHandler(value = AppExceptions.class)
    ResponseEntity<ApiResponse> xulyAppexception (AppExceptions exception)
    {
        log.warn("AppException: {}", exception.getMessage());
        ErrorCode errorCode=exception.getErrorCode();
        return ResponseEntity.status(errorCode.getStatus()).body(
                ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(exception.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(value = MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse> xulyValidation (MethodArgumentNotValidException exception){
        String enumKey = exception.getFieldError().getDefaultMessage();
        ErrorCode errorCode=ErrorCode.valueOf(enumKey);

        return ResponseEntity.status(errorCode.getStatus()).body(
                ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse> handleMaxSizeException(MaxUploadSizeExceededException ex) {
        ErrorCode errorCode = ErrorCode.PAYLOAD_TOO_LARGE;

        return ResponseEntity.status(errorCode.getStatus()).body(
                ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build()
        );
    }

    @ExceptionHandler(value = AuthorizationDeniedException.class)
    public ResponseEntity<ApiResponse> xuLyXacThuc(AuthorizationDeniedException exception) {
        // Lấy error code cố định cho lỗi phân quyền
        ErrorCode errorCode = ErrorCode.ACCESS_DENIED;

        return ResponseEntity.status(errorCode.getStatus()).body(
                ApiResponse.builder()
                        .code(errorCode.getCode())
                        .message(errorCode.getMessage())
                        .build()
        );
    }


}