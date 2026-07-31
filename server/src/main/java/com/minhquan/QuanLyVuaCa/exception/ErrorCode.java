package com.minhquan.QuanLyVuaCa.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public enum ErrorCode {

    // ===== CHUNG / HỆ THỐNG =====
    DATA_EXISTED(1012, "Dữ liệu đã tồn tại", HttpStatus.CONFLICT),
    PAYLOAD_TOO_LARGE(1013, "Dung lượng file vượt quá giới hạn cho phép", HttpStatus.PAYLOAD_TOO_LARGE),
    CANNOT_DELETE_DATA_IN_USE(1023, "Không thể xóa vì sản phẩm đã có phát sinh giao dịch (Liên kết khóa ngoại)", HttpStatus.CONFLICT),
    UPLOAD_ANH_THAT_BAI(1051, "Không thể upload ảnh", HttpStatus.INTERNAL_SERVER_ERROR),
    RATE_LIMIT_EXCEEDED(1086, "Quá nhiều yêu cầu, vui lòng thử lại sau", HttpStatus.TOO_MANY_REQUESTS),
    INVALID_KEY(9122, "Khóa không hợp lệ", HttpStatus.BAD_REQUEST),
    UNCATEGORIZED(9999, "Lỗi không xác định", HttpStatus.INTERNAL_SERVER_ERROR),

    // ===== TÀI KHOẢN / XÁC THỰC =====
    USER_NOT_EXISTED(1005, "Người dùng không tồn tại", HttpStatus.NOT_FOUND),
    UNAUTHENTICATED(1006, "Bạn chưa đăng nhập", HttpStatus.UNAUTHORIZED),
    UNAUTHORIZED(1007, "Bạn không có quyền thực hiện hành động này", HttpStatus.UNAUTHORIZED),
    FULL_NAME_INVALID(1008, "Họ và tên không được để trống", HttpStatus.BAD_REQUEST),
    EMAIL_INVALID(1009, "Email không hợp lệ", HttpStatus.BAD_REQUEST),
    BLACKLIST(1009, "Token nằm trong danh sách đen", HttpStatus.UNAUTHORIZED),
    PASSWORD_INVALID(1010, "Mật khẩu phải từ 8 đến 50 ký tự", HttpStatus.BAD_REQUEST),
    ACCESS_DENIED(1014, "Không có quyền truy cập tài nguyên", HttpStatus.FORBIDDEN),
    PHONE_INVALID(1015, "Số điện thoại không hợp lệ (Phải có 10 số, bắt đầu bằng số 0)", HttpStatus.BAD_REQUEST),
    ADDRESS_INVALID(1016, "Địa chỉ không được để trống", HttpStatus.BAD_REQUEST),
    VAITRO_INVALID(1017, "Vai trò không được để trống", HttpStatus.BAD_REQUEST),
    TRANGTHAI_INVALID(1018, "Trạng thái hoạt động không được để trống", HttpStatus.BAD_REQUEST),
    IDVAITRO_EMPTY(1019, "Trạng thái hoạt động không được để trống", HttpStatus.BAD_REQUEST),
    ACCOUNT_LOCKED(1028, "Tài khoản đã bị khóa", HttpStatus.FORBIDDEN),
    EMAIL_TOKEN_INVALID(1029, "Token xác thực email không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    ACCOUNT_PENDING_EMAIL(1030, "Tài khoản chưa xác thực email", HttpStatus.FORBIDDEN),
    ACCOUNT_PENDING_APPROVAL(1031, "Tài khoản đang chờ admin phê duyệt", HttpStatus.FORBIDDEN),
    RESET_TOKEN_INVALID(1032, "Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn", HttpStatus.BAD_REQUEST),
    WRONG_PASSWORD(1033, "Mật khẩu hiện tại không đúng", HttpStatus.BAD_REQUEST),
    PASSWORD_PWNED(1034, "Mật khẩu này đã từng bị lộ trong các vụ rò rỉ dữ liệu. Vui lòng chọn mật khẩu khác.", HttpStatus.BAD_REQUEST),
    NEW_PASSWORD_SAME_AS_OLD(1035, "Mật khẩu mới không được trùng mật khẩu hiện tại", HttpStatus.BAD_REQUEST),
    TOKEN_CREATION_FAILED(1057, "Không thể tạo token xác thực", HttpStatus.INTERNAL_SERVER_ERROR),
    USER_EXISTED(9998, "Người dùng đã tồn tại", HttpStatus.CONFLICT),

    // ===== LOẠI CÁ =====
    LOAICA_NOT_EXISTED(1011, "Loại cá không tồn tại", HttpStatus.NOT_FOUND),
    LOAICA_CON_TON_KHO(1060, "Loại cá vẫn còn tồn kho, không thể ngừng bán", HttpStatus.CONFLICT),
    LOAICA_NAME_INVALID(1065, "Tên loại cá không hợp lệ", HttpStatus.BAD_REQUEST),
    LOAICA_DESCRIPTION_INVALID(1066, "Miêu tả loại cá không hợp lệ", HttpStatus.BAD_REQUEST),
    LOAICA_IMAGE_INVALID(1067, "Ảnh loại cá không hợp lệ", HttpStatus.BAD_REQUEST),
    LOAICA_NOT_ACTIVE(1068, "Loại cá đã ngừng kinh doanh", HttpStatus.CONFLICT),

    // ===== SIZE CÁ / CHI TIẾT CÁ BÁN / KHO =====
    SIZECA_NOT_EXISTED(1020, "Size cá không tồn tại", HttpStatus.NOT_FOUND),
    CHITIET_CABAN_EXISTED(1021, "Sản phẩm (Loại + Size) này đã tồn tại trong kho", HttpStatus.CONFLICT),
    CHITIET_CABAN_NOT_EXISTED(1022, "Sản phẩm không tồn tại", HttpStatus.NOT_FOUND),
    CHITIET_CABAN_CON_TON_KHO(1088, "Kích cỡ vẫn còn tồn kho, không thể xóa", HttpStatus.CONFLICT),
    INVENTORY_NOT_ENOUGH(1027, "Số lượng tồn kho không đủ để thực hiện giao dịch", HttpStatus.CONFLICT),
    THIEU_ID_CHITIET_CABAN(1046, "Thiếu ID chi tiết cá bán (sản phẩm kho)", HttpStatus.BAD_REQUEST),
    QUYDOI_NOT_EXISTED(1047, "Sản phẩm chưa cấu hình quy đổi kg", HttpStatus.NOT_FOUND),
    LO_KHONG_KHOP_TON_KHO(1049, "Dữ liệu lô hàng không khớp với tồn kho tổng", HttpStatus.CONFLICT),
    QUYDOI_INVALID(1084, "Số kg quy đổi phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    CAUHINH_SIZE_INVALID(1089, "Mỗi cấu hình phải chọn một size có sẵn hoặc nhập một size mới", HttpStatus.BAD_REQUEST),
    CAUHINH_SIZE_TRUNG(1090, "Không thể cấu hình cùng một kích cỡ nhiều lần cho một loại cá", HttpStatus.CONFLICT),

    // ===== ĐƠN VỊ TÍNH =====
    DONVITINH_NOT_EXISTED(1053, "Đơn vị tính không tồn tại", HttpStatus.NOT_FOUND),
    DONVITINH_EXISTED(1069, "Đơn vị tính đã tồn tại", HttpStatus.CONFLICT),
    DONVITINH_NAME_INVALID(1070, "Tên đơn vị tính không hợp lệ", HttpStatus.BAD_REQUEST),
    HESOKG_INVALID(1071, "Hệ số kg không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== BẢNG GIÁ =====
    BANGGIA_CHUA_AP_DUNG(1048, "Sản phẩm chưa có bảng giá áp dụng", HttpStatus.NOT_FOUND),
    BANGGIA_NOT_EXISTED(1052, "Bảng giá không tồn tại", HttpStatus.NOT_FOUND),
    GIABANLE_INVALID(1072, "Giá bán lẻ phải lớn hơn 1.000đ", HttpStatus.BAD_REQUEST),
    GIABANSI_INVALID(1073, "Giá bán sỉ phải lớn hơn 1.000đ", HttpStatus.BAD_REQUEST),
    BANGGIA_RELATION_INVALID(1074, "Giá bán sỉ không được lớn hơn giá bán lẻ", HttpStatus.BAD_REQUEST),
    BANGGIA_FOR_DELETED_PRODUCT(1075, "Không thể lập giá cho sản phẩm đã ngừng kinh doanh", HttpStatus.CONFLICT),
    BANGGIA_BOTH_PRICES_REQUIRED(1076, "Phải nhập đầy đủ giá bán lẻ và giá bán sỉ", HttpStatus.BAD_REQUEST),
    BANGGIA_TRUNG_GIA_CU(1087, "Giá mới không được trùng với giá hiện tại", HttpStatus.BAD_REQUEST),

    // ===== GIỎ HÀNG =====
    CHITIET_GIOHANG_NOT_EXISTED(1054, "Sản phẩm không tồn tại trong giỏ hàng", HttpStatus.NOT_FOUND),

    // ===== ĐƠN HÀNG =====
    DONHANG_NOT_EXISTED(1024, "Đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    CHITIET_DONHANG_NOT_EXISTED(1025, "Chi tiết đơn hàng không tồn tại", HttpStatus.NOT_FOUND),
    ORDER_STATUS_INVALID(1026, "Trạng thái đơn hàng không hợp lệ để thực hiện hành động này", HttpStatus.BAD_REQUEST),

    // ===== NHÀ CUNG CẤP =====
    NHACUNGCAP_NOT_EXISTED(1055, "Nhà cung cấp không tồn tại", HttpStatus.NOT_FOUND),
    NHACUNGCAP_EXISTED(1080, "Nhà cung cấp đã tồn tại", HttpStatus.CONFLICT),
    NHACUNGCAP_NAME_INVALID(1081, "Tên nhà cung cấp không hợp lệ", HttpStatus.BAD_REQUEST),
    NHACUNGCAP_PHONE_INVALID(1082, "Số điện thoại nhà cung cấp không hợp lệ", HttpStatus.BAD_REQUEST),

    // ===== PHIẾU NHẬP =====
    PHIEUNHAP_NOT_EXISTED(1058, "Phiếu nhập hàng không tồn tại", HttpStatus.NOT_FOUND),
    CHITIET_PHIEUNHAP_EMPTY(1077, "Danh sách chi tiết phiếu nhập không được rỗng", HttpStatus.BAD_REQUEST),
    SOLUONG_NHAP_INVALID(1078, "Số lượng nhập phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    GIANHAP_INVALID(1079, "Giá nhập phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    NGAY_NHAP_INVALID(1085, "Ngày nhập không được nằm trong quá khứ", HttpStatus.BAD_REQUEST),

    // ===== PHIẾU THANH LÝ =====
    CHITIETPHIEUNHAP_NOT_EXISTED(1040, "Lô hàng (chi tiết phiếu nhập) không tồn tại", HttpStatus.NOT_FOUND),
    SOLUONG_THANHLY_VUOT_QUA_TON_LO(1041, "Số lượng thanh lý vượt quá số lượng còn lại của lô", HttpStatus.CONFLICT),
    CHITIET_THANHLY_EMPTY(1061, "Danh sách chi tiết thanh lý không được rỗng", HttpStatus.BAD_REQUEST),
    SOLUONG_THANHLY_INVALID(1062, "Số lượng thanh lý phải lớn hơn 0", HttpStatus.BAD_REQUEST),
    DONGIA_THANHLY_INVALID(1063, "Đơn giá thanh lý không hợp lệ", HttpStatus.BAD_REQUEST),
    TRANGTHAI_THANHLY_INVALID(1064, "Trạng thái thanh lý không hợp lệ", HttpStatus.BAD_REQUEST),
    LYDO_THANHLY_EMPTY(1083, "Lý do thanh lý không được để trống", HttpStatus.BAD_REQUEST),

    // ===== THANH TOÁN =====
    SOTIEN_THANH_TOAN_KHONG_HOP_LE(1050, "Số tiền thanh toán không hợp lệ", HttpStatus.BAD_REQUEST),
    THANHTOAN_NOT_EXISTED(1056, "Bản ghi thanh toán không tồn tại", HttpStatus.NOT_FOUND),

    // ===== CÔNG NỢ =====
    CONGNO_DA_KHOI_TAO(1043, "Tài khoản này đã được khởi tạo công nợ trước đó", HttpStatus.CONFLICT),
    VUOT_HAN_MUC_TIN_DUNG(1044, "Đơn hàng dự kiến sẽ vượt hạn mức tín dụng", HttpStatus.CONFLICT),
    TAIKHOAN_BI_KHOA_DAT_HANG(1045, "Tài khoản đang bị khóa đặt hàng do quá hạn công nợ", HttpStatus.FORBIDDEN),

    // ===== THÔNG BÁO =====
    THONGBAO_NOT_EXISTED(1042, "Thông báo không tồn tại", HttpStatus.NOT_FOUND);

    private final int code;
    private final String message;
    private final HttpStatus status;

    ErrorCode(int code, String message, HttpStatus status) {
        this.code = code;
        this.message = message;
        this.status = status;
    }
}
