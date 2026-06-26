export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN").format(value || 0) + "đ";
