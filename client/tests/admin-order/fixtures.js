import { expect } from '@playwright/test';

export const ADMIN = { id: 1, idtaikhoan: 1, email: 'admin@example.com', vaitro: 'ADMIN', ho: 'Quản', ten: 'Trị' };
export const STAFF = { id: 2, idtaikhoan: 2, email: 'staff@example.com', vaitro: 'STAFF', ho: 'Nhân', ten: 'Viên' };
export const CUSTOMER = { id: 3, idtaikhoan: 3, email: 'customer@example.com', vaitro: 'CUSTOMER', ho: 'Khách', ten: 'Hàng' };

export const ORDER_ID = 'ORDER-0001';

export const orderData = (status = 'CHO_XAC_NHAN', overrides = {}) => ({
  iddonhang: ORDER_ID,
  tenKhachHang: 'Nguyễn Văn A',
  sdtKhachHang: '0901234567',
  trangthaidonhang: status,
  trangthaithanhtoan: 'CHUA_THANH_TOAN',
  tongtien: 280000,
  ...overrides,
});

export const DETAIL_ONE = {
  idchitietdonhang: 'DETAIL-1',
  tenLoaiCa: 'Cá điêu hồng',
  tenSize: '500g',
  soluong: 2,
  tenDonViTinh: 'Con',
  soluongkgthuctequydoi: 2,
  soluongkgthucte: 2,
  dongia: 100000,
  tongtiendukien: 200000,
  tongtienthucte: 200000,
  soluongton: 10,
  tongKgDonKhacDangCho: 0,
};

export const DETAIL_TWO = {
  idchitietdonhang: 'DETAIL-2',
  tenLoaiCa: 'Cá rô phi',
  tenSize: '1kg',
  soluong: 1,
  tenDonViTinh: 'Con',
  soluongkgthuctequydoi: 1,
  soluongkgthucte: 1,
  dongia: 80000,
  tongtiendukien: 80000,
  tongtienthucte: 80000,
  soluongton: 5,
  tongKgDonKhacDangCho: 0,
};

export const detailsData = (overrides = []) => {
  const defaults = [DETAIL_ONE, DETAIL_TWO];
  return defaults.map((detail, index) => ({ ...detail, ...(overrides[index] || {}) }));
};

export async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockUser(page, user = ADMIN) {
  await page.route('**/tai-khoan/my-info', (route) => fulfillJson(route, { result: user }));
  await page.route('**/gio-hang', (route) => fulfillJson(route, { result: { items: [], tongTien: 0 } }));
  await page.route('**/ThongBao/**', (route) => fulfillJson(route, { result: [] }));
}

export async function mockOrderDetail(page, {
  status = 'CHO_XAC_NHAN',
  user = ADMIN,
  orderOverrides = {},
  details = detailsData(),
} = {}) {
  await mockUser(page, user);
  await page.route(`**/Donhangs/${ORDER_ID}`, (route) =>
    fulfillJson(route, { result: orderData(status, orderOverrides) }));
  await page.route(`**/Donhangs/${ORDER_ID}/chitiet`, (route) =>
    fulfillJson(route, { result: details }));
}

export async function openOrderDetail(page, options = {}) {
  await mockOrderDetail(page, options);
  await page.goto(`/admin/QuanLyDonHang/chi-tiet/${ORDER_ID}`);
  await expect(page.getByText('Thông tin người mua')).toBeVisible();
}

export async function acceptAllDialogs(page) {
  page.on('dialog', (dialog) => dialog.accept());
}

export async function mockStatusSuccess(page, newStatus, result = {}) {
  await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
    fulfillJson(route, { result: { trangthaidonhang: newStatus, ...result } }));
}

export async function mockWeightSave(page, refreshedDetails = detailsData()) {
  let payload;
  await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, async (route) => {
    payload = route.request().postDataJSON();
    await fulfillJson(route, { result: true });
  });
  await page.route(`**/Donhangs/${ORDER_ID}/chitiet`, (route) =>
    fulfillJson(route, { result: refreshedDetails }));
  return () => payload;
}
