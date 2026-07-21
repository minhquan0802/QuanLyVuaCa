import { test, expect } from '@playwright/test';
import {
  ADMIN,
  CUSTOMER,
  DETAIL_ONE,
  ORDER_ID,
  STAFF,
  acceptAllDialogs,
  detailsData,
  fulfillJson,
  mockOrderDetail,
  mockStatusSuccess,
  mockUser,
  openOrderDetail,
} from './fixtures.js';

const beginPackingButton = (page) => page.getByRole('button', { name: 'Bắt đầu đóng hàng' });
const cancelButton = (page) => page.getByRole('button', { name: 'Hủy đơn' });
const weightInputs = (page) => page.locator('input[type="number"]');

test.describe('Quản lý đơn hàng - Xác nhận đơn', () => {
  test('1. Hiển thị đầy đủ thông tin đơn chờ xác nhận', async ({ page }) => {
    await openOrderDetail(page);
    await expect(page.getByText('Nguyễn Văn A')).toBeVisible();
    await expect(page.getByText('0901234567')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Cá điêu hồng' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Cá rô phi' })).toBeVisible();
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });

  test('2. Hiển thị đúng thao tác cho đơn CHO_XAC_NHAN', async ({ page }) => {
    await openOrderDetail(page);
    await expect(beginPackingButton(page)).toBeVisible();
    await expect(cancelButton(page)).toBeVisible();
  });

  test('3. Yêu cầu xác nhận trước khi bắt đầu đóng hàng', async ({ page }) => {
    await openOrderDetail(page);
    let dialogMessage;
    page.on('dialog', async (dialog) => {
      dialogMessage = dialog.message();
      await dialog.dismiss();
    });
    await beginPackingButton(page).click();
    expect(dialogMessage).toContain('Đang đóng hàng');
  });

  test('4. Đóng hộp thoại thì không cập nhật trạng thái', async ({ page }) => {
    await openOrderDetail(page);
    let statusRequests = 0;
    await page.route(`**/Donhangs/${ORDER_ID}/status`, async (route) => {
      statusRequests += 1;
      await fulfillJson(route, { result: true });
    });
    page.on('dialog', (dialog) => dialog.dismiss());
    await beginPackingButton(page).click();
    expect(statusRequests).toBe(0);
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });

  test('5. Gửi trạng thái DANG_DONG_HANG khi admin xác nhận', async ({ page }) => {
    await openOrderDetail(page);
    let payload;
    await page.route(`**/Donhangs/${ORDER_ID}/status`, async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: { trangthaidonhang: 'DANG_DONG_HANG' } });
    });
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    expect(payload).toEqual({ trangthaidonhang: 'DANG_DONG_HANG' });
  });

  test('6. Cập nhật giao diện sang Đang đóng hàng', async ({ page }) => {
    await openOrderDetail(page);
    await mockStatusSuccess(page, 'DANG_DONG_HANG');
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Đang đóng hàng', { exact: true })).toBeVisible();
  });

  test('7. Hiển thị thông báo xác nhận thành công', async ({ page }) => {
    await openOrderDetail(page);
    await mockStatusSuccess(page, 'DANG_DONG_HANG');
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Chuyển trạng thái thành công!')).toBeVisible();
  });

  test('8. Tải lại chi tiết sản phẩm sau khi xác nhận', async ({ page }) => {
    await openOrderDetail(page);
    await mockStatusSuccess(page, 'DANG_DONG_HANG');
    let detailReloads = 0;
    await page.route(`**/Donhangs/${ORDER_ID}/chitiet`, async (route) => {
      detailReloads += 1;
      await fulfillJson(route, { result: detailsData() });
    });
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect.poll(() => detailReloads).toBe(1);
  });

  test('9. Không gửi nhiều request xác nhận liên tục', async ({ page }) => {
    await openOrderDetail(page);
    let requestCount = 0;
    await page.route(`**/Donhangs/${ORDER_ID}/status`, async (route) => {
      requestCount += 1;
      await new Promise((resolve) => setTimeout(resolve, 500));
      await fulfillJson(route, { result: { trangthaidonhang: 'DANG_DONG_HANG' } });
    });
    acceptAllDialogs(page);
    const button = beginPackingButton(page);
    await button.click();
    await expect(button).toBeDisabled();
    await button.dispatchEvent('click');
    await expect.poll(() => requestCount).toBe(1);
  });

  test('10. Không hiển thị nút xác nhận cho đơn đã xác nhận', async ({ page }) => {
    await openOrderDetail(page, { status: 'DANG_DONG_HANG' });
    await expect(beginPackingButton(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Giao đơn vị vận chuyển' })).toBeVisible();
  });

  test('11. Không cho xác nhận lại đơn đã hủy', async ({ page }) => {
    await openOrderDetail(page, { status: 'HUY' });
    await expect(beginPackingButton(page)).toHaveCount(0);
    await expect(cancelButton(page)).toHaveCount(0);
  });

  test('12. Không cho đưa đơn đang vận chuyển về đóng hàng', async ({ page }) => {
    await openOrderDetail(page, { status: 'DANG_VAN_CHUYEN' });
    await expect(beginPackingButton(page)).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Xác nhận giao thành công' })).toBeVisible();
  });

  test('13. Hiển thị cảnh báo giao thiếu khi kho không đủ', async ({ page }) => {
    await openOrderDetail(page);
    await mockStatusSuccess(page, 'DANG_DONG_HANG', { canhBaoGiaoThieu: ['Cá điêu hồng thiếu 1kg'] });
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText(/Kho không đủ, đã tự điều chỉnh giao thiếu/)).toBeVisible();
  });

  test('14. Hiển thị lại chi tiết đã điều chỉnh giao thiếu', async ({ page }) => {
    await openOrderDetail(page);
    await mockStatusSuccess(page, 'DANG_DONG_HANG', { canhBaoGiaoThieu: ['Điều chỉnh'] });
    const adjusted = detailsData([{ soluongkgthucte: 1, tongtienthucte: 100000 }]);
    await page.route(`**/Donhangs/${ORDER_ID}/chitiet`, (route) => fulfillJson(route, { result: adjusted }));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(weightInputs(page).first()).toHaveValue('1');
    await expect(page.getByText('100.000đ', { exact: true })).toBeVisible();
  });

  test('15. Giữ nguyên trạng thái khi backend từ chối nghiệp vụ', async ({ page }) => {
    await openOrderDetail(page);
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Đơn hàng không đủ điều kiện xác nhận' }, 400));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Đơn hàng không đủ điều kiện xác nhận')).toBeVisible();
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });

  test('16. Xử lý lỗi không đủ quyền 403', async ({ page }) => {
    await openOrderDetail(page);
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Bạn không có quyền xác nhận đơn' }, 403));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Bạn không có quyền xác nhận đơn')).toBeVisible();
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });

  test('17. Xử lý khi đơn hàng không tồn tại', async ({ page }) => {
    await openOrderDetail(page);
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Không tìm thấy đơn hàng' }, 404));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Không tìm thấy đơn hàng')).toBeVisible();
  });

  test('18. Xử lý xung đột trạng thái 409', async ({ page }) => {
    await openOrderDetail(page);
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Đơn hàng đã được xử lý' }, 409));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Đơn hàng đã được xử lý')).toBeVisible();
  });

  test('19. Xử lý lỗi máy chủ khi xác nhận', async ({ page }) => {
    await openOrderDetail(page);
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Lỗi hệ thống' }, 500));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Lỗi hệ thống')).toBeVisible();
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });

  test('20. Xử lý khi hai nhân viên cùng xác nhận một đơn', async ({ page }) => {
    await openOrderDetail(page, { user: STAFF });
    await page.route(`**/Donhangs/${ORDER_ID}/status`, (route) =>
      fulfillJson(route, { message: 'Đơn đã được nhân viên khác xác nhận' }, 409));
    acceptAllDialogs(page);
    await beginPackingButton(page).click();
    await expect(page.getByText('Đơn đã được nhân viên khác xác nhận')).toBeVisible();
  });

  test('21. Customer không được truy cập trang xác nhận', async ({ page }) => {
    await mockUser(page, CUSTOMER);
    await page.goto(`/admin/QuanLyDonHang/chi-tiet/${ORDER_ID}`);
    await expect(page).toHaveURL('/');
  });

  test('22. Staff được phép mở và xác nhận đơn', async ({ page }) => {
    await openOrderDetail(page, { user: STAFF });
    await expect(beginPackingButton(page)).toBeVisible();
  });

  test('23. Yêu cầu xác nhận trước khi hủy đơn', async ({ page }) => {
    await openOrderDetail(page);
    let message;
    page.on('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await cancelButton(page).click();
    expect(message).toContain('Đã hủy');
  });

  test('24. Chuyển trạng thái sang HUY khi đồng ý hủy', async ({ page }) => {
    await openOrderDetail(page);
    let payload;
    await page.route(`**/Donhangs/${ORDER_ID}/status`, async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: { trangthaidonhang: 'HUY' } });
    });
    acceptAllDialogs(page);
    await cancelButton(page).click();
    expect(payload).toEqual({ trangthaidonhang: 'HUY' });
    await expect(page.getByText('Đã hủy', { exact: true })).toBeVisible();
  });

  test('25. Đóng hộp thoại hủy thì giữ nguyên đơn', async ({ page }) => {
    await openOrderDetail(page);
    let requestCount = 0;
    await page.route(`**/Donhangs/${ORDER_ID}/status`, async (route) => {
      requestCount += 1;
      await fulfillJson(route, { result: true });
    });
    page.on('dialog', (dialog) => dialog.dismiss());
    await cancelButton(page).click();
    expect(requestCount).toBe(0);
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
  });
});

test.describe('Quản lý đơn hàng - Cân và đóng hàng', () => {
  test.beforeEach(async ({ page }) => {
    await openOrderDetail(page, { status: 'DANG_DONG_HANG' });
  });

  test('26. Hiển thị ô nhập cân nặng cho từng sản phẩm', async ({ page }) => {
    await expect(weightInputs(page)).toHaveCount(2);
    await expect(weightInputs(page).nth(0)).toHaveValue('2');
    await expect(weightInputs(page).nth(1)).toHaveValue('1');
  });

  test('27. Cập nhật cân nặng thực tế của từng sản phẩm', async ({ page }) => {
    await weightInputs(page).nth(0).fill('2.5');
    await weightInputs(page).nth(1).fill('1.25');
    await expect(weightInputs(page).nth(0)).toHaveValue('2.5');
    await expect(weightInputs(page).nth(1)).toHaveValue('1.25');
  });

  test('28. Tính lại thành tiền ngay khi thay đổi cân nặng', async ({ page }) => {
    await weightInputs(page).first().fill('2.5');
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.getByText('250.000đ', { exact: true })).toBeVisible();
  });

  test('29. Gửi đúng danh sách cân nặng khi lưu', async ({ page }) => {
    let payload;
    await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await weightInputs(page).nth(0).fill('2.5');
    await weightInputs(page).nth(1).fill('1.25');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    expect(payload).toEqual([
      { idChitietdonhang: 'DETAIL-1', soluongkgthucte: 2.5 },
      { idChitietdonhang: 'DETAIL-2', soluongkgthucte: 1.25 },
    ]);
  });

  test('30. Tải lại chi tiết sau khi lưu cân nặng', async ({ page }) => {
    await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, (route) => fulfillJson(route, { result: true }));
    const refreshed = detailsData([{ soluongkgthucte: 2.5, tongtienthucte: 250000 }]);
    let reloads = 0;
    await page.route(`**/Donhangs/${ORDER_ID}/chitiet`, async (route) => {
      reloads += 1;
      await fulfillJson(route, { result: refreshed });
    });
    await weightInputs(page).first().fill('2.5');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect.poll(() => reloads).toBe(1);
    await expect(weightInputs(page).first()).toHaveValue('2.5');
  });

  test('31. Hiển thị thông báo lưu cân nặng thành công', async ({ page }) => {
    await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, (route) => fulfillJson(route, { result: true }));
    await weightInputs(page).first().fill('2.5');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(page.getByText('Đã cập nhật cân nặng thực tế!')).toBeVisible();
  });

  test('32. Không cho lưu cân nặng âm', async ({ page }) => {
    await weightInputs(page).first().fill('-1');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(page.getByText('Cân nặng thực tế phải lớn hơn 0!')).toBeVisible();
  });

  test('33. Không cho lưu dữ liệu cân nặng không phải số', async ({ page }) => {
    await weightInputs(page).first().evaluate((input) => {
      input.value = 'abc';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(page.getByText('Cân nặng thực tế phải lớn hơn 0!')).toBeVisible();
  });

  test('34. Không cho lưu cân nặng bằng 0', async ({ page }) => {
    await weightInputs(page).first().fill('0');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(page.getByText('Cân nặng thực tế phải lớn hơn 0!')).toBeVisible();
  });

  test('35. Tính lại đúng tổng tiền toàn bộ đơn', async ({ page }) => {
    await weightInputs(page).nth(0).fill('2.5');
    await weightInputs(page).nth(1).fill('1.5');
    await expect(page.getByText('370.000đ', { exact: true })).toBeVisible();
  });

  test('36. Không thay đổi đơn giá khi cập nhật cân nặng', async ({ page }) => {
    const firstRow = page.locator('tbody tr').first();
    await expect(firstRow.getByText('100.000đ/kg', { exact: true })).toBeVisible();
    await weightInputs(page).first().fill('3');
    await expect(firstRow.getByText('100.000đ/kg', { exact: true })).toBeVisible();
  });

  test('37. Giữ dữ liệu đang nhập khi API lưu thất bại', async ({ page }) => {
    await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, (route) =>
      fulfillJson(route, { message: 'Không thể lưu cân nặng' }, 500));
    await weightInputs(page).first().fill('2.75');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(weightInputs(page).first()).toHaveValue('2.75');
  });

  test('38. Hiển thị lỗi khi API lưu cân nặng thất bại', async ({ page }) => {
    await page.route(`**/Donhangs/${ORDER_ID}/cap-nhat-can-nang`, (route) =>
      fulfillJson(route, { message: 'Không thể lưu cân nặng' }, 500));
    await weightInputs(page).first().fill('2.75');
    await page.getByRole('button', { name: 'Xác nhận & Lưu Kg thực tế' }).click();
    await expect(page.getByText('Cập nhật cân nặng thất bại!')).toBeVisible();
  });

  test('39. Cảnh báo khi chuyển trạng thái lúc cân nặng chưa lưu', async ({ page }) => {
    await weightInputs(page).first().fill('2.75');
    let message;
    page.on('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await page.getByRole('button', { name: 'Giao đơn vị vận chuyển' }).click();
    expect(message).toContain('Bạn chưa lưu cân nặng đã sửa');
    await expect(page.getByText('Đang đóng hàng', { exact: true })).toBeVisible();
  });

  test('40. Không cho chỉnh cân nặng ngoài trạng thái DANG_DONG_HANG', async ({ page }) => {
    await mockOrderDetail(page, { status: 'CHO_XAC_NHAN', user: ADMIN });
    await page.goto(`/admin/QuanLyDonHang/chi-tiet/${ORDER_ID}`);
    await expect(page.getByText('Chờ xác nhận')).toBeVisible();
    await expect(weightInputs(page)).toHaveCount(0);
  });
});
