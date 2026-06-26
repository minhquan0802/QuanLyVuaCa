export const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(
    value,
  );

export const CHART_COLORS = {
  nhap: "#3b82f6",
  xuat: "#22c55e",
  haohut: "#ef4444",
  ton: "#a855f7",
};
