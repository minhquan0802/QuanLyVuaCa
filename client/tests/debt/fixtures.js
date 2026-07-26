import { expect } from '@playwright/test';

export const ADMIN = {
  idtaikhoan: 'ADMIN-1', email: 'admin@vuaca.vn', vaitro: 'ADMIN', ho: 'Quản', ten: 'Trị',
};

export const STAFF = {
  idtaikhoan: 'STAFF-1', email: 'staff@vuaca.vn', vaitro: 'STAFF', ho: 'Nhân', ten: 'Viên',
};

export const CUSTOMER = {
  idtaikhoan: 'CUSTOMER-1', email: 'customer@vuaca.vn', vaitro: 'CUSTOMER', ho: 'Khách', ten: 'Hàng',
};

export const DEBT_CUSTOMERS = [
  {
    idtaikhoan: 'KH-1', ho: 'Nguyễn', ten: 'An', email: 'an@example.com', sodienthoai: '0901111111',
    hanmuctindung: 10000000, congnohientai: 1000000, dangBiKhoa: false,
  },
  {
    idtaikhoan: 'KH-2', ho: 'Trần', ten: 'Bình', email: 'binh@example.com', sodienthoai: '0902222222',
    hanmuctindung: 10000000, congnohientai: 8000000, dangBiKhoa: false,
  },
  {
    idtaikhoan: 'KH-3', ho: 'Lê', ten: 'Chi', email: 'chi@example.com', sodienthoai: '0903333333',
    hanmuctindung: 10000000, congnohientai: 10000000, dangBiKhoa: false,
  },
  {
    idtaikhoan: 'KH-4', ho: 'Phạm', ten: 'Dũng', email: 'dung@example.com', sodienthoai: '0904444444',
    hanmuctindung: 10000000, congnohientai: 2000000, dangBiKhoa: true,
  },
  {
    idtaikhoan: 'KH-5', ho: 'Võ', ten: 'Em', email: 'em@example.com', sodienthoai: '0905555555',
    hanmuctindung: 5000000, congnohientai: -500000, dangBiKhoa: false,
  },
  {
    idtaikhoan: 'KH-6', ho: 'Đỗ', ten: 'Giang', email: 'giang@example.com', sodienthoai: null,
    hanmuctindung: null, congnohientai: 0, dangBiKhoa: false,
  },
];

export const ACCOUNTS = [
  { idtaikhoan: 'NEW-1', ho: 'Mai', ten: 'Hạnh', email: 'hanh@example.com', vaitro: 'CUSTOMER', hanmuctindung: null },
  { idtaikhoan: 'OPENED-1', ho: 'Đã', ten: 'Mở', email: 'opened@example.com', vaitro: 'CUSTOMER', hanmuctindung: 5000000 },
  { idtaikhoan: 'STAFF-2', ho: 'Một', ten: 'Nhân viên', email: 'staff2@example.com', vaitro: 'STAFF', hanmuctindung: null },
];

export const HISTORY = [
  {
    idlichsucongno: 'LS-1', ngaytao: '2026-07-20T08:00:00Z', loaithaydoi: 'TANG', sotien: 3000000,
    sodusaukhithaydoi: 3000000, tenNguoiThucHien: null, ghichu: 'Đơn hàng DH-001',
  },
  {
    idlichsucongno: 'LS-2', ngaytao: '2026-07-20T09:00:00Z', loaithaydoi: 'GIAM', sotien: 1000000,
    sodusaukhithaydoi: 2000000, tenNguoiThucHien: 'Quản Trị', ghichu: 'Thanh toán một phần',
  },
  {
    idlichsucongno: 'LS-3', ngaytao: '2026-07-20T10:00:00Z', loaithaydoi: 'DIEU_CHINH', sotien: 500000,
    sodusaukhithaydoi: 1500000, tenNguoiThucHien: 'Quản Trị', ghichu: null,
  },
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

export async function mockDebtApis(page, {
  user = ADMIN,
  customers = DEBT_CUSTOMERS,
  accounts = ACCOUNTS,
  history = HISTORY,
} = {}) {
  await mockSession(page, user);
  await page.route('**/CongNo', (route) => fulfillJson(route, { result: customers }));
  await page.route('**/tai-khoan', (route) => fulfillJson(route, { result: accounts }));
  await page.route('**/CongNo/*/lich-su', (route) => fulfillJson(route, { result: history }));
}

export async function openDebtPage(page, options = {}) {
  await mockDebtApis(page, options);
  await page.goto('/admin/QuanLyCongNo');
  await expect(page.getByText('Đang tải dữ liệu...')).toHaveCount(0);
}

export const modal = (page) => page.locator('.fixed.inset-0');

export const customerRow = (page, name = 'Nguyễn An') =>
  page.locator('tbody tr').filter({ hasText: name });

export function paginatedCustomers(total = 12) {
  return Array.from({ length: total }, (_, index) => ({
    idtaikhoan: `PAGE-${index + 1}`,
    ho: 'Khách',
    ten: String(index + 1).padStart(2, '0'),
    email: `khach${index + 1}@example.com`,
    sodienthoai: `091${String(index + 1).padStart(7, '0')}`,
    hanmuctindung: 10000000,
    congnohientai: index * 100000,
    dangBiKhoa: false,
  }));
}
