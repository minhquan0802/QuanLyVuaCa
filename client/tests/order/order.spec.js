import { test, expect } from '@playwright/test';
import {
  CUSTOMER,
  ITEM_ONE,
  ITEM_TWO,
  cartResult,
  fillShipping,
  fulfillJson,
  mockAuthenticatedSession,
  mockGuestSession,
  mockOrderSuccess,
  mockProductDetail,
  openCart,
  openCheckout,
  selectPayLater,
} from './fixtures.js';

const payLaterButton = (page) => page.getByRole('button', { name: 'Xác Nhận (Thanh Toán Sau)' });

async function preparePayLaterCheckout(page, items = [ITEM_ONE]) {
  await openCheckout(page, items);
  await fillShipping(page);
  await selectPayLater(page);
}

async function mockOrdersPage(page, orders) {
  await mockAuthenticatedSession(page, []);
  await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: orders }));
  await page.goto('/my-orders');
  await expect(page.getByText('Tất cả', { exact: false }).first()).toBeVisible();
}

const pendingOrder = (overrides = {}) => ({
  iddonhang: 'ORDER-0001',
  ngaydat: '2026-07-21T08:00:00',
  trangthaidonhang: 'CHO_XAC_NHAN',
  trangthaithanhtoan: 'CHUA_THANH_TOAN',
  tongtien: 100000,
  listChitietdonhang: [{
    tenLoaiCa: 'Cá điêu hồng',
    tenSize: '500g',
    soluong: 2,
    tongtiendukien: 100000,
  }],
  ...overrides,
});

test.describe('Đặt hàng - Sản phẩm và giỏ hàng', () => {
  test('1. Thêm sản phẩm hợp lệ vào giỏ hàng', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page);
    let payload;
    await page.route('**/gio-hang/items', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: cartResult([ITEM_ONE]) });
    });

    await page.goto('/product-detail/1');
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();

    expect(payload).toEqual({ idchitietcaban: 101, iddonvitinh: 1, soluong: 1 });
    await expect(page.getByText(/Đã thêm Cá điêu hồng vào giỏ hàng/)).toBeVisible();
  });

  test('2. Thêm cùng sản phẩm nhiều lần', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page);
    let requestCount = 0;
    await page.route('**/gio-hang/items', async (route) => {
      requestCount += 1;
      await fulfillJson(route, { result: cartResult([{ ...ITEM_ONE, soluong: requestCount }]) });
    });

    await page.goto('/product-detail/1');
    const addButton = page.getByRole('button', { name: 'Thêm vào giỏ hàng' });
    await addButton.click();
    await addButton.click();

    expect(requestCount).toBe(2);
  });

  test('3. Thêm hai kích cỡ khác nhau của cùng sản phẩm', async ({ page }) => {
    const prices = [
      { id: 201, idLoaiCa: 1, tenLoaiCa: 'Cá điêu hồng', tenSize: '500g', idChitietcaban: 101, giaBanSi: 90000, giaBanLe: 100000, trangThai: 'Đang áp dụng' },
      { id: 202, idLoaiCa: 1, tenLoaiCa: 'Cá điêu hồng', tenSize: '1kg', idChitietcaban: 102, giaBanSi: 85000, giaBanLe: 95000, trangThai: 'Đang áp dụng' },
    ];
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page, { prices });
    const ids = [];
    await page.route('**/gio-hang/items', async (route) => {
      ids.push(route.request().postDataJSON().idchitietcaban);
      await fulfillJson(route, { result: cartResult([]) });
    });

    await page.goto('/product-detail/1');
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();
    await page.getByRole('button', { name: '1kg' }).click();
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();

    expect(ids).toEqual([101, 102]);
  });

  test('4. Thay đổi số lượng sản phẩm trong giỏ hàng', async ({ page }) => {
    await openCart(page);
    let quantity;
    await page.route('**/gio-hang/items/1', async (route) => {
      quantity = route.request().postDataJSON().soluong;
      await fulfillJson(route, { result: cartResult([{ ...ITEM_ONE, soluong: quantity }]) });
    });

    const itemCard = page.locator('.group.relative').first();
    await itemCard.locator('button').nth(1).click();
    expect(quantity).toBe(3);
    await expect(itemCard.getByText('3', { exact: true })).toBeVisible();
  });

  test('5. Xóa một sản phẩm khỏi giỏ hàng', async ({ page }) => {
    await openCart(page, [ITEM_ONE, ITEM_TWO]);
    await page.route('**/gio-hang/items/1', (route) =>
      fulfillJson(route, { result: cartResult([ITEM_TWO]) }));

    await page.locator('.group.relative').first().locator('button').nth(2).click();

    await expect(page.getByText('Cá điêu hồng', { exact: true })).toBeHidden();
    await expect(page.getByText('Cá rô phi', { exact: true })).toBeVisible();
  });

  test('6. Xóa toàn bộ sản phẩm khỏi giỏ hàng', async ({ page }) => {
    await openCart(page, [ITEM_ONE, ITEM_TWO]);
    await page.route('**/gio-hang/items/1', (route) =>
      fulfillJson(route, { result: cartResult([ITEM_TWO]) }));
    await page.route('**/gio-hang/items/2', (route) =>
      fulfillJson(route, { result: cartResult([]) }));

    await page.locator('.group.relative').first().locator('button').nth(2).click();
    await page.locator('.group.relative').first().locator('button').nth(2).click();

    await expect(page.getByText('Giỏ hàng của bạn đang trống', { exact: true })).toBeVisible();
  });

  test('7. Tính đúng thành tiền của từng sản phẩm', async ({ page }) => {
    await openCart(page);
    const itemCard = page.locator('.group.relative').first();
    await expect(itemCard.locator('.col-span-3 span.block')).toHaveText('100.000đ');
  });

  test('8. Tính đúng tổng tiền đơn hàng', async ({ page }) => {
    await openCart(page, [ITEM_ONE, ITEM_TWO]);
    await expect(page.getByText('180.000đ', { exact: true })).toHaveCount(2);
  });

  test('9. Không cho số lượng bằng 0, số âm hoặc không phải số', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page);
    await page.goto('/product-detail/1');

    const quantity = page.locator('input[readonly]').first();
    await expect(quantity).toHaveValue('1');
    await page.getByText('remove', { exact: true }).last().click();
    await expect(quantity).toHaveValue('1');
    await expect(quantity).toHaveAttribute('readonly', '');
  });

  test('10. Không cho đặt số lượng vượt quá tồn kho', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page, { stock: 1 });
    await page.route('**/gio-hang/items', (route) =>
      fulfillJson(route, { message: 'Số lượng vượt tồn kho' }, 409));
    await page.goto('/product-detail/1');

    await page.getByText('add', { exact: true }).last().click();
    await page.getByRole('button', { name: 'Thêm vào giỏ hàng' }).click();

    await expect(page.getByText('Không thể thêm vào giỏ hàng!')).toBeVisible();
  });

  test('11. Không cho đặt sản phẩm hết hàng', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await mockProductDetail(page, { stock: 0 });
    await page.goto('/product-detail/1');

    await expect(page.getByRole('button', { name: 'Hết hàng' })).toBeDisabled();
  });

  test('12. Yêu cầu đăng nhập trước khi xem và đặt hàng', async ({ page }) => {
    await mockGuestSession(page);
    await page.goto('/cart');
    await expect(page.getByText('Vui lòng đăng nhập để xem giỏ hàng.')).toBeVisible();
  });

  test('13. Không cho thanh toán khi giỏ hàng trống', async ({ page }) => {
    await openCart(page, []);
    await page.getByRole('button', { name: 'Tiến hành thanh toán' }).click();
    await expect(page.getByText('Giỏ hàng của bạn đang trống!')).toBeVisible();
    await expect(page).toHaveURL('/cart');
  });
});

test.describe('Đặt hàng - Checkout và tạo đơn', () => {
  test('14. Không cho đặt khi thiếu họ tên người nhận', async ({ page }) => {
    await openCheckout(page);
    await fillShipping(page, { name: '' });
    await selectPayLater(page);
    await payLaterButton(page).click();
    await expect(page.getByText('Vui lòng điền đầy đủ thông tin giao hàng!')).toBeVisible();
  });

  test('15. Không cho đặt khi thiếu số điện thoại', async ({ page }) => {
    await openCheckout(page);
    await fillShipping(page, { phone: '' });
    await selectPayLater(page);
    await payLaterButton(page).click();
    await expect(page.getByText('Vui lòng điền đầy đủ thông tin giao hàng!')).toBeVisible();
  });

  test('16. Không cho đặt khi số điện thoại sai định dạng', async ({ page }) => {
    await openCheckout(page);
    await fillShipping(page, { phone: '12345' });
    await selectPayLater(page);
    await payLaterButton(page).click();
    await expect(page.getByText('Số điện thoại không hợp lệ!')).toBeVisible();
  });

  test('17. Không cho đặt khi thiếu địa chỉ nhận hàng', async ({ page }) => {
    await openCheckout(page);
    await fillShipping(page, { address: '' });
    await selectPayLater(page);
    await payLaterButton(page).click();
    await expect(page.getByText('Vui lòng điền đầy đủ thông tin giao hàng!')).toBeVisible();
  });

  test('18. Tạo đơn thành công với thông tin hợp lệ', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await mockOrderSuccess(page);
    await payLaterButton(page).click();
    await expect(page).toHaveURL('/my-orders');
  });

  test('19. Gửi đúng danh sách sản phẩm và số lượng', async ({ page }) => {
    await preparePayLaterCheckout(page, [ITEM_ONE, ITEM_TWO]);
    let payload;
    await page.route('**/Donhangs', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: { iddonhang: 'ORDER-002' } });
    });
    await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));

    await payLaterButton(page).click();
    expect(payload.chiTietDonHang).toEqual([
      { idchitietcaban: '101', soluong: 2, iddonvitinh: '1' },
      { idchitietcaban: '102', soluong: 1, iddonvitinh: '1' },
    ]);
  });

  test('20. Hiển thị đúng tổng tiền tại thời điểm đặt hàng', async ({ page }) => {
    await openCheckout(page, [ITEM_ONE, ITEM_TWO]);
    await expect(page.getByText('180,000đ', { exact: true })).toHaveCount(2);
  });

  test('21. Gán đúng khách hàng cho đơn hàng', async ({ page }) => {
    await preparePayLaterCheckout(page);
    let payload;
    await page.route('**/Donhangs', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: { iddonhang: 'ORDER-003' } });
    });
    await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));
    await payLaterButton(page).click();
    expect(payload.idthongtinkhachhang).toBe(CUSTOMER.idtaikhoan);
  });

  test('22. Nhận đúng trạng thái ban đầu của đơn mới', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await mockOrderSuccess(page, { iddonhang: 'ORDER-004', trangthaidonhang: 'CHO_XAC_NHAN' });
    await payLaterButton(page).click();
    await expect(page).toHaveURL('/my-orders');
  });

  test('23. Gửi đúng chi tiết để backend cập nhật tồn kho', async ({ page }) => {
    await preparePayLaterCheckout(page);
    let requestedItem;
    await page.route('**/Donhangs', async (route) => {
      requestedItem = route.request().postDataJSON().chiTietDonHang[0];
      await fulfillJson(route, { result: { iddonhang: 'ORDER-005' } });
    });
    await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));
    await payLaterButton(page).click();
    expect(requestedItem).toEqual({ idchitietcaban: '101', soluong: 2, iddonvitinh: '1' });
  });

  test('24. Xóa giỏ hàng sau khi đặt thành công', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await mockOrderSuccess(page);
    let clearCount = 0;
    await page.route('**/gio-hang', async (route) => {
      if (route.request().method() === 'DELETE') clearCount += 1;
      await fulfillJson(route, { result: cartResult([]) });
    });
    await payLaterButton(page).click();
    await expect.poll(() => clearCount).toBe(1);
  });

  test('25. Hiển thị thông báo đặt hàng thành công', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await mockOrderSuccess(page);
    await payLaterButton(page).click();
    await expect(page.getByText('Đặt hàng thành công! Chúng tôi sẽ liên hệ xác nhận.')).toBeVisible();
  });

  test('26. Không tạo hai đơn khi nhấn nút liên tục', async ({ page }) => {
    await preparePayLaterCheckout(page);
    let requestCount = 0;
    await page.route('**/Donhangs', async (route) => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fulfillJson(route, { result: { iddonhang: 'ORDER-006' } });
    });
    await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));

    const button = page.locator('aside button');
    await button.click();
    await expect(button).toBeDisabled();
    await button.dispatchEvent('click');
    await expect.poll(() => requestCount).toBe(1);
  });

  test('27. Xử lý khi giá thay đổi trước lúc xác nhận', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await page.route('**/Donhangs', (route) =>
      fulfillJson(route, { message: 'Giá sản phẩm đã thay đổi' }, 409));
    await payLaterButton(page).click();
    await expect(page.getByText('Có lỗi xảy ra: Giá sản phẩm đã thay đổi')).toBeVisible();
  });

  test('28. Xử lý khi tồn kho thay đổi trong lúc thanh toán', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await page.route('**/Donhangs', (route) =>
      fulfillJson(route, { message: 'Sản phẩm không đủ tồn kho' }, 409));
    await payLaterButton(page).click();
    await expect(page.getByText('Có lỗi xảy ra: Sản phẩm không đủ tồn kho')).toBeVisible();
  });

  test('29. Xử lý xung đột khi hai khách cùng đặt lượng hàng còn lại', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await page.route('**/Donhangs', (route) =>
      fulfillJson(route, { message: 'Tồn kho vừa được khách hàng khác sử dụng' }, 409));
    await payLaterButton(page).click();
    await expect(page.getByText('Có lỗi xảy ra: Tồn kho vừa được khách hàng khác sử dụng')).toBeVisible();
  });

  test('30. Xử lý lỗi API tạo đơn', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await page.route('**/Donhangs', (route) =>
      fulfillJson(route, { message: 'Không thể tạo đơn hàng' }, 500));
    await payLaterButton(page).click();
    await expect(page.getByText('Có lỗi xảy ra: Không thể tạo đơn hàng')).toBeVisible();
  });

  test('31. Xử lý mất mạng khi tạo đơn', async ({ page }) => {
    await preparePayLaterCheckout(page);
    await page.context().setOffline(true);
    await payLaterButton(page).click();
    await expect(page.getByText(/Có lỗi xảy ra:/)).toBeVisible();
    await page.context().setOffline(false);
  });

  test('32. Không xóa giỏ hàng nếu tạo đơn thất bại', async ({ page }) => {
    await preparePayLaterCheckout(page);
    let clearCount = 0;
    await page.route('**/Donhangs', (route) =>
      fulfillJson(route, { message: 'Tạo đơn thất bại' }, 500));
    await page.route('**/gio-hang', async (route) => {
      if (route.request().method() === 'DELETE') clearCount += 1;
      await fulfillJson(route, { result: cartResult([ITEM_ONE]) });
    });
    await payLaterButton(page).click();
    await expect(page.getByText('Có lỗi xảy ra: Tạo đơn thất bại')).toBeVisible();
    expect(clearCount).toBe(0);
  });
});

test.describe('Đặt hàng - Lịch sử, hủy đơn và thanh toán', () => {
  test('33. Khách hàng chỉ tải danh sách đơn của chính mình', async ({ page }) => {
    let requestedUrl;
    await mockAuthenticatedSession(page, []);
    await page.route('**/Donhangs/my-orders', async (route) => {
      requestedUrl = route.request().url();
      await fulfillJson(route, { result: [pendingOrder()] });
    });
    await page.goto('/my-orders');
    await expect(page.getByText('Cá điêu hồng', { exact: true })).toBeVisible();
    expect(requestedUrl).toContain('/Donhangs/my-orders');
  });

  test('34. Cho phép hủy đơn đang chờ xác nhận', async ({ page }) => {
    await mockOrdersPage(page, [pendingOrder()]);
    page.on('dialog', (dialog) => dialog.accept());
    await page.route('**/Donhangs/ORDER-0001/huy', (route) => fulfillJson(route, { result: true }));

    await page.getByRole('button', { name: 'Hủy đơn' }).click();
    await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
  });

  test('35. Không cho hủy đơn đã giao', async ({ page }) => {
    await mockOrdersPage(page, [pendingOrder({ trangthaidonhang: 'GIAO_HANG_THANH_CONG' })]);
    await expect(page.getByRole('button', { name: 'Hủy đơn' })).toHaveCount(0);
  });

  test('36. Gửi yêu cầu hủy để backend hoàn lại tồn kho', async ({ page }) => {
    await mockOrdersPage(page, [pendingOrder()]);
    page.on('dialog', (dialog) => dialog.accept());
    let cancelRequestCount = 0;
    await page.route('**/Donhangs/ORDER-0001/huy', async (route) => {
      cancelRequestCount += 1;
      await fulfillJson(route, { result: { restoredInventory: true } });
    });
    await page.getByRole('button', { name: 'Hủy đơn' }).click();
    expect(cancelRequestCount).toBe(1);
    await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
  });

  test('37. Gửi đúng phương thức thanh toán sau để cập nhật công nợ', async ({ page }) => {
    await preparePayLaterCheckout(page);
    let note;
    await page.route('**/Donhangs', async (route) => {
      note = route.request().postDataJSON().ghichu;
      await fulfillJson(route, { result: { iddonhang: 'ORDER-DEBT' } });
    });
    await page.route('**/Donhangs/my-orders', (route) => fulfillJson(route, { result: [] }));
    await payLaterButton(page).click();
    expect(note).toContain('[THANH_TOAN_SAU]');
  });

  test('38. Điều hướng đúng tại trang thanh toán thành công và thất bại', async ({ page }) => {
    await mockAuthenticatedSession(page, []);
    await page.goto('/order-success?orderId=ORDER-008&totalPrice=10000000');
    await expect(page.getByRole('heading', { name: 'Thanh toán thành công!' })).toBeVisible();
    await expect(page.getByText('#ORDER-008')).toBeVisible();

    await page.goto('/order-failed?error=Giao%20dịch%20bị%20từ%20chối');
    await expect(page.getByRole('heading', { name: 'Thanh toán thất bại' })).toBeVisible();
    await expect(page.getByText('Lỗi: Giao dịch bị từ chối')).toBeVisible();
    await page.getByRole('button', { name: 'Quay lại giỏ hàng' }).click();
    await expect(page).toHaveURL('/cart');
  });
});
