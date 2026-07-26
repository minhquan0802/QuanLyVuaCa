import { expect } from '@playwright/test';

export const CUSTOMER = {
  id: 7,
  idtaikhoan: 7,
  email: 'customer@example.com',
  vaitro: 'CUSTOMER',
  ho: 'Nguyễn',
  ten: 'An',
  sodienthoai: '0901234567',
  diachi: '12 Nguyễn Huệ, TP.HCM',
};

export const ITEM_ONE = {
  idchitietgiohang: 1,
  idchitietcaban: 101,
  iddonvitinh: 1,
  soluong: 2,
  tenLoaiCa: 'Cá điêu hồng',
  tenSize: '500g',
  tenDonViTinh: 'Con',
  giaBan: 100000,
  khoiluongDuKien: 1,
  thanhTien: 100000,
  hinhAnhUrl: null,
};

export const ITEM_TWO = {
  idchitietgiohang: 2,
  idchitietcaban: 102,
  iddonvitinh: 1,
  soluong: 1,
  tenLoaiCa: 'Cá rô phi',
  tenSize: '1kg',
  tenDonViTinh: 'Con',
  giaBan: 80000,
  khoiluongDuKien: 1,
  thanhTien: 80000,
  hinhAnhUrl: null,
};

export const cartResult = (items = [ITEM_ONE]) => ({
  items,
  tongTien: items.reduce((sum, item) => sum + item.thanhTien, 0),
});

export async function fulfillJson(route, body, status = 200) {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

export async function mockAuthenticatedSession(page, items = [ITEM_ONE], user = CUSTOMER) {
  await page.route('**/tai-khoan/my-info', (route) =>
    fulfillJson(route, { result: user }));

  await page.route('**/gio-hang', (route) => {
    if (route.request().method() === 'DELETE') {
      return fulfillJson(route, { result: cartResult([]) });
    }
    return fulfillJson(route, { result: cartResult(items) });
  });
}

export async function mockGuestSession(page) {
  await page.route('**/tai-khoan/my-info', (route) =>
    fulfillJson(route, { message: 'Unauthenticated' }, 500));
  await page.route('**/gio-hang', (route) =>
    fulfillJson(route, { result: cartResult([]) }));
}

export async function mockProductDetail(page, { stock = 10, prices } = {}) {
  const priceList = prices ?? [
    {
      id: 201,
      idLoaiCa: 1,
      tenLoaiCa: 'Cá điêu hồng',
      tenSize: '500g',
      idChitietcaban: 101,
      giaBanSi: 90000,
      giaBanLe: 100000,
      trangThai: 'Đang áp dụng',
    },
  ];

  await page.route('**/Loaicas/1', (route) => fulfillJson(route, {
    result: { id: 1, tenloaica: 'Cá điêu hồng', mieuta: 'Cá tươi', hinhanhurl: null },
  }));
  await page.route('**/Banggias', (route) => fulfillJson(route, { result: priceList }));
  await page.route('**/Quydois', (route) => fulfillJson(route, {
    result: priceList.map((price) => ({ idchitietcaban: price.idChitietcaban, sokgtuongung: price.tenSize === '1kg' ? 1 : 0.5 })),
  }));
  await page.route('**/Chitietcabans', (route) => fulfillJson(route, {
    result: priceList.map((price) => ({ id: price.idChitietcaban, soluongton: stock })),
  }));
  await page.route('**/Donvitinhs', (route) => fulfillJson(route, {
    result: [{ id: 1, tendvt: 'Con', hesokg: 0 }, { id: 2, tendvt: 'Thùng', hesokg: 10 }],
  }));
}

export async function openCart(page, items = [ITEM_ONE]) {
  await mockAuthenticatedSession(page, items);
  await page.goto('/cart');
  await expect(page.getByRole('heading', { name: 'Giỏ hàng của bạn' })).toBeVisible();
  if (items.length > 0) await expect(page.getByText(items[0].tenLoaiCa, { exact: true })).toBeVisible();
}

export async function openCheckout(page, items = [ITEM_ONE]) {
  await openCart(page, items);
  await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
  await expect(page).toHaveURL('/checkout');
  await expect(page.getByRole('heading', { name: 'Thanh toán', exact: true })).toBeVisible();
}

export async function fillShipping(page, {
  name = 'Nguyễn An',
  phone = '0901234567',
  address = '12 Nguyễn Huệ, TP.HCM',
  note = 'Giao giờ hành chính',
} = {}) {
  await page.getByPlaceholder('Nhập họ tên').fill(name);
  await page.getByPlaceholder('Nhập SĐT').fill(phone);
  await page.getByPlaceholder('Địa chỉ nhận hàng').fill(address);
  await page.getByPlaceholder('Ghi chú giao hàng (tùy chọn)').fill(note);
}

export async function selectPayLater(page) {
  await page.locator('input[name="payment"][value="later"]').check();
}

export async function mockOrderSuccess(page, order = { iddonhang: 'ORDER-001', trangthaidonhang: 'CHO_XAC_NHAN' }) {
  await page.route('**/Donhangs', (route) => {
    if (route.request().method() === 'POST') return fulfillJson(route, { result: order });
    return route.fallback();
  });
  await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));
}
