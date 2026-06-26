export const ORDER_STATUS = {
  CHO_XAC_NHAN: {
    label: "Chờ xác nhận",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 text-yellow-700 border-yellow-200",
  },
  DA_THANH_TOAN: {
    label: "Đã thanh toán",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700 border-teal-200",
  },
  DANG_DONG_HANG: {
    label: "Đang đóng hàng",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  DANG_VAN_CHUYEN: {
    label: "Đang vận chuyển",
    dot: "bg-purple-500",
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
  GIAO_HANG_THANH_CONG: {
    label: "Giao thành công",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 border-green-200",
  },
  HUY: {
    label: "Đã hủy",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 border-red-200",
  },
};

export const STATUS_PRIORITY = {
  CHO_XAC_NHAN: 1,
  DANG_DONG_HANG: 2,
  DANG_VAN_CHUYEN: 3,
  GIAO_HANG_THANH_CONG: 4,
  DA_THANH_TOAN: 5,
  HUY: 6,
};
