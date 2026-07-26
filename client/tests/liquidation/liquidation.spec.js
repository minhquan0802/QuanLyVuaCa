import { test, expect } from '@playwright/test';
import {
  ADMIN, CUSTOMER, INVENTORY, LOTS, STAFF, addDetail, chooseLot, detailInputs,
  fulfillJson, mockMultiLotPage, mockSession, openMultiLotPage, openSingleLotPage, selects,
} from './fixtures.js';

test.describe('Lập phiếu thanh lý - Quyền truy cập và tải dữ liệu', () => {
  test('1. Admin truy cập được trang lập phiếu thanh lý', async ({ page }) => {
    await openMultiLotPage(page, { user: ADMIN });
    await expect(page.getByText('Thông tin chung')).toBeVisible();
  });

  test('2. Staff không được phép mở trang lập phiếu thanh lý', async ({ page }) => {
    await mockMultiLotPage(page, { user: STAFF });
    await page.goto('/admin/QuanLyThanhLy/tao-phieu');
    await expect(page).not.toHaveURL(/QuanLyThanhLy\/tao-phieu/);
  });

  test('3. Customer không được truy cập trang quản trị thanh lý', async ({ page }) => {
    await mockMultiLotPage(page, { user: CUSTOMER });
    await page.goto('/admin/QuanLyThanhLy/tao-phieu');
    await expect(page).toHaveURL('/');
  });

  test('4. Hiển thị trạng thái đang tải danh sách sản phẩm', async ({ page }) => {
    await mockSession(page);
    await page.route('**/Chitietcabans', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await fulfillJson(route, { result: INVENTORY });
    });
    await page.goto('/admin/QuanLyThanhLy/tao-phieu');
    await expect(page.getByText('Đang tải dữ liệu...')).toBeVisible();
    await expect(page.getByText('Đang tải dữ liệu...')).toHaveCount(0);
  });

  test('5. Tải danh sách sản phẩm trong kho thành công', async ({ page }) => {
    await openMultiLotPage(page);
    await expect(selects(page).fish).toContainText('Cá điêu hồng');
    await expect(selects(page).fish).toContainText('Cá rô phi');
  });

  test('6. Hiển thị thông báo khi tải danh sách sản phẩm thất bại', async ({ page }) => {
    await mockSession(page);
    await page.route('**/Chitietcabans', (route) => fulfillJson(route, { message: 'Lỗi' }, 500));
    await page.goto('/admin/QuanLyThanhLy/tao-phieu');
    await expect(page.getByText('Không thể tải danh sách sản phẩm kho!')).toBeVisible();
  });

  test('7. Xử lý đúng khi kho không có sản phẩm', async ({ page }) => {
    await openMultiLotPage(page, { inventory: [] });
    await expect(selects(page).fish.locator('option')).toHaveCount(1);
    await expect(selects(page).size).toBeDisabled();
  });
});

test.describe('Lập phiếu thanh lý - Chọn sản phẩm và lô hàng', () => {
  test.beforeEach(async ({ page }) => openMultiLotPage(page));

  test('8. Danh sách loại cá không hiển thị trùng lặp', async ({ page }) => {
    await expect(selects(page).fish.getByRole('option', { name: 'Cá điêu hồng' })).toHaveCount(1);
  });

  test('9. Chưa chọn loại cá thì trường Size bị vô hiệu hóa', async ({ page }) => {
    await expect(selects(page).size).toBeDisabled();
  });

  test('10. Chọn loại cá chỉ hiển thị các Size tương ứng', async ({ page }) => {
    await selects(page).fish.selectOption('1');
    await expect(selects(page).size).toContainText('500g');
    await expect(selects(page).size).toContainText('1kg');
    await expect(selects(page).size).not.toContainText('700g');
  });

  test('11. Thay đổi loại cá làm xóa Size và lô đã chọn', async ({ page }) => {
    await chooseLot(page);
    await selects(page).fish.selectOption('2');
    await expect(selects(page).size).toHaveValue('');
    await expect(selects(page).lot).toHaveValue('');
  });

  test('12. Chưa chọn đủ loại cá và Size thì chưa được chọn lô', async ({ page }) => {
    await selects(page).fish.selectOption('1');
    await expect(selects(page).lot).toBeDisabled();
  });

  test('13. Chọn đủ sản phẩm thì tải lô theo đúng mã sản phẩm', async ({ page }) => {
    let requestedUrl;
    await page.route('**/Phieuthanhlys/lo-con-hang?**', async (route) => {
      requestedUrl = route.request().url();
      await fulfillJson(route, { result: LOTS });
    });
    await selects(page).fish.selectOption('1');
    await selects(page).size.selectOption('10');
    await expect.poll(() => requestedUrl).toContain('idchitietcaban=101');
  });

  test('14. Danh sách lô chỉ hiển thị lô còn hàng do API trả về', async ({ page }) => {
    await chooseLot(page);
    await expect(selects(page).lot.locator('option')).toHaveCount(3);
    await expect(selects(page).lot).toContainText('còn 10kg');
  });

  test('15. Danh sách lô giữ thứ tự ngày nhập cũ trước', async ({ page }) => {
    await chooseLot(page);
    const options = selects(page).lot.locator('option');
    await expect(options.nth(1)).toContainText('2026-07-01');
    await expect(options.nth(2)).toContainText('2026-07-10');
  });

  test('16. Hiển thị đúng ngày nhập và số lượng còn lại của lô', async ({ page }) => {
    await chooseLot(page);
    await expect(selects(page).lot).toContainText('Nhập ngày 2026-07-01 — còn 10kg');
  });

  test('17. Hiển thị Không có lô còn hàng khi danh sách rỗng', async ({ page }) => {
    await page.route('**/Phieuthanhlys/lo-con-hang?**', (route) => fulfillJson(route, { result: [] }));
    await selects(page).fish.selectOption('1');
    await selects(page).size.selectOption('10');
    await expect(selects(page).lot).toContainText('Không có lô còn hàng');
  });

  test('18. Hiển thị lỗi khi không tải được danh sách lô', async ({ page }) => {
    await page.route('**/Phieuthanhlys/lo-con-hang?**', (route) => fulfillJson(route, { message: 'Lỗi' }, 500));
    await selects(page).fish.selectOption('1');
    await selects(page).size.selectOption('10');
    await expect(page.getByText('Không thể tải danh sách lô!')).toBeVisible();
  });

  test('19. Thay đổi Size làm xóa lô đã chọn', async ({ page }) => {
    await chooseLot(page);
    await selects(page).size.selectOption('11');
    await expect(selects(page).lot).toHaveValue('');
  });
});

test.describe('Lập phiếu thanh lý - Thêm và quản lý chi tiết', () => {
  test.beforeEach(async ({ page }) => openMultiLotPage(page));

  test('20. Không cho thêm dòng khi chưa chọn loại cá và Size', async ({ page }) => {
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Vui lòng chọn Loại cá và Size!')).toBeVisible();
  });

  test('21. Không cho thêm dòng khi chưa chọn lô hàng', async ({ page }) => {
    await selects(page).fish.selectOption('1');
    await selects(page).size.selectOption('10');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Vui lòng chọn lô hàng!')).toBeVisible();
  });

  for (const [id, value, label] of [[22, '', 'để trống'], [23, '0', 'bằng 0'], [24, '-1', 'âm']]) {
    test(`${id}. Không cho thêm khi số lượng ${label}`, async ({ page }) => {
      await chooseLot(page);
      if (value === '') await detailInputs(page).quantity.fill(''); else await detailInputs(page).quantity.fill(value);
      await page.getByRole('button', { name: 'Thêm dòng' }).click();
      await expect(page.getByText('Số lượng thanh lý phải > 0')).toBeVisible();
    });
  }

  test('25. Cho phép nhập số lượng thập phân hợp lệ', async ({ page }) => {
    await addDetail(page, { quantity: '1.5' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toContainText('1.5');
  });

  test('26. Cho phép thanh lý bằng đúng số lượng còn lại', async ({ page }) => {
    await addDetail(page, { quantity: '10' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toContainText('10');
  });

  test('27. Không cho thanh lý vượt số lượng còn lại của lô', async ({ page }) => {
    await chooseLot(page);
    await detailInputs(page).quantity.fill('10.01');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Lô này chỉ còn 10kg!')).toBeVisible();
  });

  test('28. Không cho nhập đơn giá âm', async ({ page }) => {
    await chooseLot(page);
    await detailInputs(page).quantity.fill('1');
    await detailInputs(page).price.fill('-1');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Đơn giá không được âm')).toBeVisible();
  });

  test('29. Cho phép đơn giá bằng 0 khi tiêu hủy', async ({ page }) => {
    await addDetail(page, { price: '0' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toContainText('0');
  });

  test('30. Khi bán thanh lý, đơn giá phải lớn hơn 0', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await chooseLot(page);
    await detailInputs(page).quantity.fill('1');
    await detailInputs(page).price.fill('0');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Đơn giá bán thanh lý phải lớn hơn 0')).toBeVisible();
  });

  test('31. Khi tiêu hủy, đơn giá phải bằng 0', async ({ page }) => {
    await chooseLot(page);
    await detailInputs(page).quantity.fill('1');
    await detailInputs(page).price.fill('50000');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Đơn giá phải bằng 0 khi tiêu hủy')).toBeVisible();
  });

  test('32. Thêm dòng hợp lệ vào bảng chi tiết', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page);
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng (500g)' })).toBeVisible();
  });

  test('33. Hiển thị đúng sản phẩm, lô, số lượng và đơn giá', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { quantity: '2', price: '50000' });
    const row = page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng (500g)' });
    await expect(row).toContainText('2026-07-01');
    await expect(row).toContainText('2');
    await expect(row).toContainText(/50[.,]000/);
  });

  test('34. Xóa dữ liệu nhập sau khi thêm dòng thành công', async ({ page }) => {
    await addDetail(page, { price: '0' });
    await expect(selects(page).lot).toHaveValue('');
    await expect(detailInputs(page).quantity).toHaveValue('0');
    await expect(detailInputs(page).price).toHaveValue('0');
  });

  test('35. Cho phép thêm nhiều lô khác nhau vào một phiếu', async ({ page }) => {
    await addDetail(page, { lotId: 'LOT-OLD', quantity: '2', price: '0' });
    await addDetail(page, { lotId: 'LOT-NEW', quantity: '3', price: '0' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toHaveCount(2);
  });

  test('36. Cho phép thêm cùng một lô nhiều lần khi tổng chưa vượt tồn', async ({ page }) => {
    await addDetail(page, { quantity: '2', price: '0' });
    await addDetail(page, { quantity: '3', price: '0' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toHaveCount(2);
  });

  test('37. Không cho tổng số lượng của cùng một lô vượt tồn', async ({ page }) => {
    await addDetail(page, { quantity: '6', price: '0' });
    await chooseLot(page);
    await detailInputs(page).quantity.fill('5');
    await page.getByRole('button', { name: 'Thêm dòng' }).click();
    await expect(page.getByText('Tổng số lượng thanh lý của lô vượt số lượng còn lại!')).toBeVisible();
  });

  test('38. Thành tiền từng dòng bằng số lượng nhân đơn giá', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { quantity: '2', price: '50000' });
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toContainText(/100[.,]000/);
  });

  test('39. Tổng số kg bằng tổng số lượng các dòng', async ({ page }) => {
    await addDetail(page, { lotId: 'LOT-OLD', quantity: '2', price: '0' });
    await addDetail(page, { lotId: 'LOT-NEW', quantity: '3', price: '0' });
    await expect(page.getByText('Tổng:').locator('span')).toHaveText('5');
  });

  test('40. Tổng tiền phiếu bằng tổng thành tiền các dòng', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { lotId: 'LOT-OLD', quantity: '2', price: '50000' });
    await addDetail(page, { lotId: 'LOT-NEW', quantity: '3', price: '20000' });
    await expect(page.getByText(/Tổng tiền thanh lý:/)).toContainText(/160[.,]000 VNĐ/);
  });

  test('41. Phiếu tiêu hủy có tổng tiền bằng 0', async ({ page }) => {
    await addDetail(page, { price: '0' });
    await expect(page.getByText(/Tổng tiền thanh lý:/)).toContainText('0 VNĐ');
  });

  test('42. Tổng tiền được cập nhật sau khi thêm dòng', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { quantity: '2', price: '50000' });
    await expect(page.getByText(/Tổng tiền thanh lý:/)).toContainText(/100[.,]000 VNĐ/);
  });

  test('43. Tổng tiền được cập nhật sau khi xóa dòng', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { quantity: '2', price: '50000' });
    await page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' }).locator('button').click();
    await expect(page.getByText(/Tổng tiền thanh lý:/)).toContainText('0 VNĐ');
  });

  test('44. Xóa đúng dòng chi tiết được chọn', async ({ page }) => {
    await addDetail(page, { lotId: 'LOT-OLD', quantity: '2', price: '0' });
    await addDetail(page, { lotId: 'LOT-NEW', quantity: '3', price: '0' });
    await page.locator('tbody tr').filter({ hasText: '2026-07-01' }).locator('button').click();
    await expect(page.locator('tbody tr').filter({ hasText: '2026-07-01' })).toHaveCount(0);
    await expect(page.locator('tbody tr').filter({ hasText: '2026-07-10' })).toHaveCount(1);
  });

  test('45. Tiền được hiển thị theo định dạng Việt Nam', async ({ page }) => {
    await selects(page).status.selectOption('DA_BAN_THANH_LY');
    await addDetail(page, { quantity: '2', price: '50000' });
    await expect(page.getByText('100.000', { exact: true })).toBeVisible();
  });
});

test.describe('Lập phiếu thanh lý - Hoàn tất phiếu', () => {
  test.beforeEach(async ({ page }) => openMultiLotPage(page));

  test('46. Không cho lập phiếu khi chưa nhập lý do', async ({ page }) => {
    await addDetail(page, { price: '0' });
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    await expect(page.getByText('Vui lòng nhập lý do thanh lý!')).toBeVisible();
  });

  test('47. Lý do chỉ chứa khoảng trắng được xem là không hợp lệ', async ({ page }) => {
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('   ');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    await expect(page.getByText('Vui lòng nhập lý do thanh lý!')).toBeVisible();
  });

  test('48. Không cho lập phiếu khi chưa có chi tiết lô hàng', async ({ page }) => {
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await expect(page.getByRole('button', { name: 'Hoàn tất lập phiếu' })).toBeDisabled();
  });

  test('49. Ghi chú được phép để trống', async ({ page }) => {
    let payload;
    await page.route('**/Phieuthanhlys', async (route) => { payload = route.request().postDataJSON(); await fulfillJson(route, { result: true }); });
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    expect(payload.ghichu).toBe('');
  });

  test('50. Gửi đúng lý do, trạng thái và ghi chú', async ({ page }) => {
    let payload;
    await page.route('**/Phieuthanhlys', async (route) => { payload = route.request().postDataJSON(); await fulfillJson(route, { result: true }); });
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByPlaceholder('Ghi chú thêm...').fill('Lập biên bản');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    expect(payload).toMatchObject({ lydothanhly: 'Cá chết', trangthai: 'DA_TIEU_HUY', ghichu: 'Lập biên bản' });
  });

  test('51. Gửi đúng mã lô, số lượng và đơn giá từng dòng', async ({ page }) => {
    let payload;
    await page.route('**/Phieuthanhlys', async (route) => { payload = route.request().postDataJSON(); await fulfillJson(route, { result: true }); });
    await addDetail(page, { quantity: '2.5', price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    expect(payload.listChiTiet).toEqual([{ idchitietphieunhap: 'LOT-OLD', soluongthanhly: 2.5, dongia: 0 }]);
  });

  for (const [id, status] of [[52, 'DA_TIEU_HUY'], [53, 'DA_BAN_THANH_LY']]) {
    test(`${id}. Gửi đúng trạng thái ${status}`, async ({ page }) => {
      await page.route('**/Phieuthanhlys', (route) => fulfillJson(route, { result: true }));
      await selects(page).status.selectOption(status);
      await addDetail(page, { price: status === 'DA_TIEU_HUY' ? '0' : '50000' });
      await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Hàng không đạt');
      const requestPromise = page.waitForRequest((request) =>
        request.url().endsWith('/Phieuthanhlys') && request.method() === 'POST');
      await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
      expect((await requestPromise).postDataJSON().trangthai).toBe(status);
    });
  }

  test('54. Hiển thị thông báo khi lập phiếu thành công', async ({ page }) => {
    await page.route('**/Phieuthanhlys', (route) => fulfillJson(route, { result: true }));
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    await expect(page.getByText('Lập phiếu thanh lý thành công!')).toBeVisible();
  });

  test('55. Chuyển về danh sách thanh lý sau khi thành công', async ({ page }) => {
    await page.route('**/Phieuthanhlys', (route) => fulfillJson(route, { result: true }));
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    await expect(page).toHaveURL('/admin/QuanLyThanhLy');
  });

  test('56. Hiển thị lỗi và giữ dữ liệu khi API thất bại', async ({ page }) => {
    await page.route('**/Phieuthanhlys', (route) => fulfillJson(route, { message: 'Lỗi' }, 500));
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Hoàn tất lập phiếu' }).click();
    await expect(page.getByText('Lỗi hệ thống hoặc kết nối thất bại!')).toBeVisible();
    await expect(page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...')).toHaveValue('Cá chết');
    await expect(page.locator('tbody tr').filter({ hasText: 'Cá điêu hồng' })).toHaveCount(1);
  });

  test('57. Nhấn hoàn tất liên tục chỉ tạo một phiếu', async ({ page }) => {
    let requests = 0;
    await page.route('**/Phieuthanhlys', async (route) => { requests += 1; await new Promise((r) => setTimeout(r, 400)); await fulfillJson(route, { result: true }); });
    await addDetail(page, { price: '0' });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    const submit = page.getByRole('button', { name: 'Hoàn tất lập phiếu' });
    await submit.click();
    await submit.dispatchEvent('click');
    await expect.poll(() => requests).toBe(1);
  });

  test('58. Nút Hủy quay về danh sách mà không tạo phiếu', async ({ page }) => {
    let requests = 0;
    await page.route('**/Phieuthanhlys', async (route) => { requests += 1; await fulfillJson(route, { result: true }); });
    await page.getByRole('button', { name: 'Hủy' }).click();
    await expect(page).toHaveURL('/admin/QuanLyThanhLy');
    expect(requests).toBe(0);
  });
});

test.describe('Thanh lý trực tiếp một lô', () => {
  test('59. Tải đúng lô theo mã trên URL', async ({ page }) => {
    await openSingleLotPage(page);
    await expect(page.getByRole('heading', { name: 'Cá điêu hồng (500g)' })).toBeVisible();
    await expect(page.getByText('10 kg')).toBeVisible();
  });

  test('60. Hiển thị thông báo khi lô không tồn tại hoặc đã hết', async ({ page }) => {
    await openSingleLotPage(page, { lotId: 'NOT-FOUND' });
    await expect(page.getByText(/Không tìm thấy lô hàng này/)).toBeVisible();
  });

  test('61. Chế độ Toàn bộ lô tự điền toàn bộ số lượng còn lại', async ({ page }) => {
    await openSingleLotPage(page);
    await expect(page.locator('input[type="number"]').first()).toHaveValue('10');
    await expect(page.locator('input[type="number"]').first()).toBeDisabled();
  });

  test('62. Chế độ Một phần cho phép nhập số lượng', async ({ page }) => {
    await openSingleLotPage(page);
    await page.getByRole('button', { name: 'Một phần' }).click();
    await expect(page.locator('input[type="number"]').first()).toBeEnabled();
    await page.locator('input[type="number"]').first().fill('3');
    await expect(page.locator('input[type="number"]').first()).toHaveValue('3');
  });

  test('63. Chuyển lại Toàn bộ lô khôi phục số lượng tồn', async ({ page }) => {
    await openSingleLotPage(page);
    await page.getByRole('button', { name: 'Một phần' }).click();
    await page.locator('input[type="number"]').first().fill('3');
    await page.getByRole('button', { name: 'Toàn bộ lô' }).click();
    await expect(page.locator('input[type="number"]').first()).toHaveValue('10');
  });

  test('64. Không cho thanh lý một phần vượt tồn lô', async ({ page }) => {
    await openSingleLotPage(page);
    await page.getByRole('button', { name: 'Một phần' }).click();
    await page.locator('input[type="number"]').first().fill('11');
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    await page.getByRole('button', { name: 'Xác nhận thanh lý' }).click();
    await expect(page.getByText('Lô này chỉ còn 10kg!')).toBeVisible();
  });

  test('65. Tính đúng thành tiền của lô', async ({ page }) => {
    await openSingleLotPage(page);
    await page.locator('input[type="number"]').nth(1).fill('50000');
    await expect(page.getByText(/500[.,]000 VNĐ/)).toBeVisible();
  });

  test('66. Không gửi trùng yêu cầu xác nhận thanh lý', async ({ page }) => {
    await openSingleLotPage(page);
    let requests = 0;
    await page.route('**/Phieuthanhlys', async (route) => { requests += 1; await new Promise((r) => setTimeout(r, 400)); await fulfillJson(route, { result: true }); });
    await page.getByPlaceholder('Cá chết, hao hụt lúc nhập, sự cố...').fill('Cá chết');
    const submit = page.getByRole('button', { name: 'Xác nhận thanh lý' });
    await submit.click();
    await expect(page.getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled();
    await page.getByRole('button', { name: 'Đang xử lý...' }).dispatchEvent('click');
    await expect.poll(() => requests).toBe(1);
  });
});
