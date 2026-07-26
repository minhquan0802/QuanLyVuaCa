import { expect } from '@playwright/test';

export const ADMIN = { idtaikhoan: 'ADMIN-1', email: 'admin@vuaca.vn', vaitro: 'ADMIN', ho: 'Quản', ten: 'Trị' };
export const STAFF = { idtaikhoan: 'STAFF-1', email: 'staff@vuaca.vn', vaitro: 'STAFF', ho: 'Nhân', ten: 'Viên' };
export const CUSTOMER = { idtaikhoan: 'KH-1', email: 'khach@vuaca.vn', vaitro: 'CUSTOMER', ho: 'Khách', ten: 'Hàng' };

export const INVENTORY = [
  { id: 101, idLoaiCa: 1, tenLoaiCa: 'Cá điêu hồng', idSizeCa: 10, tenSize: '500g', soluongton: 30 },
  { id: 102, idLoaiCa: 1, tenLoaiCa: 'Cá điêu hồng', idSizeCa: 11, tenSize: '1kg', soluongton: 20 },
  { id: 201, idLoaiCa: 2, tenLoaiCa: 'Cá rô phi', idSizeCa: 20, tenSize: '700g', soluongton: 15 },
];

export const LOTS = [
  { idchitietphieunhap: 'LOT-OLD', idchitietcaban: 101, tenLoaiCa: 'Cá điêu hồng', tenSize: '500g', ngaynhap: '2026-07-01', soluongnhap: 20, soluongconlai: 10, trangthaica: 'CON_HANG' },
  { idchitietphieunhap: 'LOT-NEW', idchitietcaban: 101, tenLoaiCa: 'Cá điêu hồng', tenSize: '500g', ngaynhap: '2026-07-10', soluongnhap: 15, soluongconlai: 8, trangthaica: 'CON_HANG' },
];

export async function fulfillJson(route, body, status = 200) {
  await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

export async function mockSession(page, user = ADMIN) {
  await page.route('**/tai-khoan/my-info', (route) => fulfillJson(route, { result: user }));
  await page.route('**/gio-hang', (route) => fulfillJson(route, { result: { items: [], tongTien: 0 } }));
  await page.route('**/ThongBao/subscribe', (route) => route.abort());
  await page.route('**/ThongBao/chua-xem', (route) => fulfillJson(route, { result: 0 }));
  await page.route('**/ThongBao', (route) => fulfillJson(route, { result: [] }));
}

export async function mockMultiLotPage(page, { user = ADMIN, inventory = INVENTORY, lots = LOTS } = {}) {
  await mockSession(page, user);
  await page.route('**/Chitietcabans', (route) => fulfillJson(route, { result: inventory }));
  await page.route('**/Phieuthanhlys/lo-con-hang?**', (route) => fulfillJson(route, { result: lots }));
}

export async function openMultiLotPage(page, options = {}) {
  await mockMultiLotPage(page, options);
  await page.goto('/admin/QuanLyThanhLy/tao-phieu');
  await expect(page.getByText('Đang tải dữ liệu...')).toHaveCount(0);
}

export const selects = (page) => ({
  status: page.locator('select').nth(0),
  fish: page.locator('select').nth(1),
  size: page.locator('select').nth(2),
  lot: page.locator('select').nth(3),
});

export const detailInputs = (page) => ({
  quantity: page.locator('input[type="number"]').nth(0),
  price: page.locator('input[type="number"]').nth(1),
});

export async function chooseLot(page, lotId = 'LOT-OLD') {
  const fields = selects(page);
  await fields.fish.selectOption('1');
  await fields.size.selectOption('10');
  await expect(fields.lot.locator(`option[value="${lotId}"]`)).toHaveCount(1);
  await fields.lot.selectOption(lotId);
}

export async function addDetail(page, { lotId = 'LOT-OLD', quantity = '2', price = '50000' } = {}) {
  await chooseLot(page, lotId);
  const inputs = detailInputs(page);
  await inputs.quantity.fill(quantity);
  await inputs.price.fill(price);
  await page.getByRole('button', { name: 'Thêm dòng' }).click();
}

export async function mockSingleLotPage(page, { user = ADMIN, lots = LOTS } = {}) {
  await mockSession(page, user);
  await page.route('**/Phieuthanhlys/tat-ca-lo-con-hang', (route) => fulfillJson(route, { result: lots }));
}

export async function openSingleLotPage(page, { lotId = 'LOT-OLD', ...options } = {}) {
  await mockSingleLotPage(page, options);
  await page.goto(`/admin/QuanLyThanhLy/thanh-ly/${lotId}`);
  await expect(page.getByText('Đang tải dữ liệu...')).toHaveCount(0);
}
