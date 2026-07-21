import { test, expect } from '@playwright/test';
import {
  ACCOUNTS,
  ADMIN,
  CUSTOMER,
  DEBT_CUSTOMERS,
  HISTORY,
  STAFF,
  customerRow,
  fulfillJson,
  modal,
  mockDebtApis,
  mockSession,
  openDebtPage,
  paginatedCustomers,
} from './fixtures.js';

test.describe('Quản lý công nợ - Danh sách, trạng thái và phân quyền', () => {
  test('1. Hiển thị đầy đủ thông tin khách hàng có công nợ', async ({ page }) => {
    await openDebtPage(page);
    const row = customerRow(page);
    await expect(row).toContainText('Nguyễn An');
    await expect(row).toContainText('an@example.com');
    await expect(row).toContainText('0901111111');
    await expect(row).toContainText('10.000.000đ');
    await expect(row).toContainText('1.000.000đ');
  });

  test('2. Hiển thị thông báo khi chưa có khách hàng mở công nợ', async ({ page }) => {
    await openDebtPage(page, { customers: [] });
    await expect(page.getByText('Chưa có khách hàng nào mở công nợ.')).toBeVisible();
  });

  test('3. Hiển thị lỗi khi không tải được danh sách công nợ', async ({ page }) => {
    await mockSession(page);
    await page.route('**/CongNo', (route) => fulfillJson(route, { message: 'Lỗi hệ thống' }, 500));
    await page.route('**/tai-khoan', (route) => fulfillJson(route, { result: [] }));
    await page.goto('/admin/QuanLyCongNo');
    await expect(page.getByText('Không thể tải danh sách công nợ!')).toBeVisible();
  });

  test('4. Hiển thị số dư trả trước khi công nợ âm', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Võ Em')).toContainText('500.000đ (dư trả trước)');
  });

  test('5. Hiển thị dấu gạch ngang khi khách hàng chưa có số điện thoại', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Đỗ Giang')).toContainText('-');
  });

  test('6. Hiển thị trạng thái Chưa cấp hạn mức khi hạn mức chưa được thiết lập', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Đỗ Giang')).toContainText('Chưa cấp hạn mức');
  });

  test('7. Hiển thị trạng thái Bình thường khi tỷ lệ công nợ dưới 80%', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Nguyễn An')).toContainText('Bình thường');
  });

  test('8. Hiển thị trạng thái Cảnh báo khi tỷ lệ công nợ bằng 80%', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Trần Bình')).toContainText('Cảnh báo');
  });

  test('9. Hiển thị trạng thái Nguy hiểm khi công nợ bằng hạn mức', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Lê Chi')).toContainText('Nguy hiểm');
  });

  test('10. Ưu tiên hiển thị trạng thái Bị khóa đối với khách hàng đã khóa', async ({ page }) => {
    await openDebtPage(page);
    await expect(customerRow(page, 'Phạm Dũng')).toContainText('Bị khóa');
  });

  test('11. Tìm kiếm khách hàng theo tên không phân biệt chữ hoa chữ thường', async ({ page }) => {
    await openDebtPage(page);
    await page.getByPlaceholder('Tìm theo tên khách, email, số điện thoại...').fill('TRẦN BÌNH');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Trần Bình');
  });

  test('12. Tìm kiếm khách hàng theo email', async ({ page }) => {
    await openDebtPage(page);
    await page.getByPlaceholder('Tìm theo tên khách, email, số điện thoại...').fill('chi@example.com');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Lê Chi');
  });

  test('13. Tìm kiếm khách hàng theo số điện thoại', async ({ page }) => {
    await openDebtPage(page);
    await page.getByPlaceholder('Tìm theo tên khách, email, số điện thoại...').fill('0904444444');
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('tbody tr')).toContainText('Phạm Dũng');
  });

  test('14. Hiển thị trạng thái rỗng khi không có kết quả tìm kiếm', async ({ page }) => {
    await openDebtPage(page);
    await page.getByPlaceholder('Tìm theo tên khách, email, số điện thoại...').fill('không tồn tại');
    await expect(page.getByText('Chưa có khách hàng nào mở công nợ.')).toBeVisible();
  });

  test('15. Phân trang danh sách với tối đa 10 khách hàng mỗi trang', async ({ page }) => {
    await openDebtPage(page, { customers: paginatedCustomers() });
    await expect(page.locator('tbody tr')).toHaveCount(10);
    await page.getByRole('button', { name: 'Sau' }).click();
    await expect(page.locator('tbody tr')).toHaveCount(2);
    await expect(page.getByText('Khách 11', { exact: true })).toBeVisible();
  });

  test('16. Quản trị viên được sử dụng các thao tác quản lý công nợ', async ({ page }) => {
    await openDebtPage(page, { user: ADMIN });
    await expect(page.getByRole('button', { name: '+ Mở công nợ cho khách mới' })).toBeVisible();
    await expect(customerRow(page).getByRole('button', { name: 'Sửa hạn mức' })).toBeVisible();
    await expect(customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' })).toBeVisible();
  });

  test('17. Nhân viên chỉ được xem danh sách và lịch sử công nợ', async ({ page }) => {
    await openDebtPage(page, { user: STAFF });
    await expect(page.getByRole('button', { name: '+ Mở công nợ cho khách mới' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Sửa hạn mức' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Điều chỉnh nợ' })).toHaveCount(0);
    await expect(customerRow(page).getByRole('button', { name: 'Lịch sử' })).toBeVisible();
  });

  test('18. Khách hàng không được truy cập trang quản lý công nợ', async ({ page }) => {
    await mockDebtApis(page, { user: CUSTOMER });
    await page.goto('/admin/QuanLyCongNo');
    await expect(page).toHaveURL('/');
  });
});

test.describe('Quản lý công nợ - Hạn mức tín dụng', () => {
  test.beforeEach(async ({ page }) => openDebtPage(page));

  test('19. Mở biểu mẫu cấp công nợ cho khách hàng mới', async ({ page }) => {
    await page.getByRole('button', { name: '+ Mở công nợ cho khách mới' }).click();
    await expect(page.getByRole('heading', { name: 'Mở công nợ cho khách mới' })).toBeVisible();
    await expect(modal(page).locator('select')).toBeVisible();
    await expect(modal(page).locator('input[type="number"]')).toBeVisible();
  });

  test('20. Chỉ hiển thị khách hàng chưa mở hạn mức trong danh sách cấp mới', async ({ page }) => {
    await page.getByRole('button', { name: '+ Mở công nợ cho khách mới' }).click();
    const options = modal(page).locator('select option');
    await expect(options).toContainText(['-- Chọn khách hàng --', 'Mai Hạnh — hanh@example.com']);
    await expect(modal(page).locator('select')).not.toContainText('Đã Mở');
    await expect(modal(page).locator('select')).not.toContainText('Một Nhân viên');
  });

  test('21. Không cho cấp hạn mức khi chưa chọn khách hàng', async ({ page }) => {
    await page.getByRole('button', { name: '+ Mở công nợ cho khách mới' }).click();
    await modal(page).locator('input[type="number"]').fill('5000000');
    await modal(page).getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText('Vui lòng chọn khách hàng!')).toBeVisible();
  });

  for (const [number, value, label] of [[22, '0', 'bằng 0'], [23, '-1', 'âm']]) {
    test(`${number}. Không cho cấp hạn mức ${label}`, async ({ page }) => {
      await page.getByRole('button', { name: '+ Mở công nợ cho khách mới' }).click();
      await modal(page).locator('select').selectOption('NEW-1');
      await modal(page).locator('input[type="number"]').fill(value);
      await modal(page).getByRole('button', { name: 'Lưu' }).click();
      await expect(page.getByText('Hạn mức tín dụng phải lớn hơn 0!')).toBeVisible();
    });
  }

  test('24. Gửi đúng khách hàng và hạn mức khi cấp công nợ mới', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/NEW-1/han-muc', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await page.getByRole('button', { name: '+ Mở công nợ cho khách mới' }).click();
    await modal(page).locator('select').selectOption('NEW-1');
    await modal(page).locator('input[type="number"]').fill('5000000');
    await modal(page).getByRole('button', { name: 'Lưu' }).click();
    expect(payload).toEqual({ hanmuctindung: 5000000 });
    await expect(page.getByText('Cập nhật hạn mức tín dụng thành công!')).toBeVisible();
  });

  test('25. Hiển thị hạn mức hiện tại khi sửa hạn mức', async ({ page }) => {
    await customerRow(page).getByRole('button', { name: 'Sửa hạn mức' }).click();
    await expect(page.getByRole('heading', { name: 'Sửa hạn mức — Nguyễn An' })).toBeVisible();
    await expect(modal(page).locator('input[type="number"]')).toHaveValue('10000000');
  });

  test('26. Gửi đúng hạn mức mới khi cập nhật', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/KH-1/han-muc', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await customerRow(page).getByRole('button', { name: 'Sửa hạn mức' }).click();
    await modal(page).locator('input[type="number"]').fill('12000000');
    await modal(page).getByRole('button', { name: 'Lưu' }).click();
    expect(payload).toEqual({ hanmuctindung: 12000000 });
  });

  test('27. Tải lại danh sách sau khi cập nhật hạn mức thành công', async ({ page }) => {
    let listRequests = 0;
    await page.route('**/CongNo', async (route) => {
      listRequests += 1;
      await fulfillJson(route, { result: DEBT_CUSTOMERS });
    });
    await page.route('**/CongNo/KH-1/han-muc', (route) => fulfillJson(route, { result: true }));
    await customerRow(page).getByRole('button', { name: 'Sửa hạn mức' }).click();
    await modal(page).locator('input[type="number"]').fill('12000000');
    await modal(page).getByRole('button', { name: 'Lưu' }).click();
    await expect.poll(() => listRequests).toBe(1);
  });

  test('28. Giữ biểu mẫu và hiển thị lỗi khi cập nhật hạn mức thất bại', async ({ page }) => {
    await page.route('**/CongNo/KH-1/han-muc', (route) => fulfillJson(route, { message: 'Không thể cập nhật hạn mức' }, 400));
    await customerRow(page).getByRole('button', { name: 'Sửa hạn mức' }).click();
    await modal(page).locator('input[type="number"]').fill('12000000');
    await modal(page).getByRole('button', { name: 'Lưu' }).click();
    await expect(page.getByText('Không thể cập nhật hạn mức')).toBeVisible();
    await expect(modal(page)).toBeVisible();
    await expect(modal(page).locator('input[type="number"]')).toHaveValue('12000000');
  });

  test('29. Không gửi trùng yêu cầu cập nhật hạn mức khi nhấn liên tục', async ({ page }) => {
    let requests = 0;
    await page.route('**/CongNo/KH-1/han-muc', async (route) => {
      requests += 1;
      await new Promise((resolve) => setTimeout(resolve, 400));
      await fulfillJson(route, { result: true });
    });
    await customerRow(page).getByRole('button', { name: 'Sửa hạn mức' }).click();
    await modal(page).locator('input[type="number"]').fill('12000000');
    const save = modal(page).getByRole('button', { name: 'Lưu' });
    await save.click();
    await expect(modal(page).getByRole('button', { name: 'Đang xử lý...' })).toBeDisabled();
    await modal(page).getByRole('button', { name: 'Đang xử lý...' }).dispatchEvent('click');
    await expect.poll(() => requests).toBe(1);
  });
});

test.describe('Quản lý công nợ - Điều chỉnh và mở khóa', () => {
  test.beforeEach(async ({ page }) => openDebtPage(page));

  test('30. Mở biểu mẫu điều chỉnh công nợ đúng khách hàng', async ({ page }) => {
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await expect(page.getByRole('heading', { name: 'Điều chỉnh công nợ — Nguyễn An' })).toBeVisible();
    await expect(modal(page).getByRole('button', { name: 'Cộng nợ' })).toBeVisible();
    await expect(modal(page).getByRole('button', { name: 'Trừ nợ' })).toBeVisible();
  });

  test('31. Gửi đúng dữ liệu khi cộng công nợ', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/KH-1/dieu-chinh', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('500000');
    await modal(page).locator('textarea').fill('Phụ phí giao hàng');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    expect(payload).toEqual({ sotien: 500000, tang: true, ghichu: 'Phụ phí giao hàng' });
    await expect(page.getByText('Điều chỉnh công nợ thành công!')).toBeVisible();
  });

  test('32. Gửi đúng dữ liệu khi trừ công nợ', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/KH-1/dieu-chinh', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).getByRole('button', { name: 'Trừ nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('250000');
    await modal(page).locator('textarea').fill('Chiết khấu cuối tháng');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    expect(payload).toEqual({ sotien: 250000, tang: false, ghichu: 'Chiết khấu cuối tháng' });
  });

  test('33. Không cho điều chỉnh với số tiền bằng 0', async ({ page }) => {
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('0');
    await modal(page).locator('textarea').fill('Kiểm tra');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByText('Số tiền phải lớn hơn 0!')).toBeVisible();
  });

  test('34. Bắt buộc nhập lý do điều chỉnh công nợ', async ({ page }) => {
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('500000');
    await modal(page).locator('textarea').fill('   ');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByText('Vui lòng nhập lý do điều chỉnh!')).toBeVisible();
  });

  test('35. Loại bỏ khoảng trắng thừa trong lý do điều chỉnh', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/KH-1/dieu-chinh', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('500000');
    await modal(page).locator('textarea').fill('  Làm tròn số dư  ');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    expect(payload.ghichu).toBe('Làm tròn số dư');
  });

  test('36. Giữ biểu mẫu khi API điều chỉnh công nợ thất bại', async ({ page }) => {
    await page.route('**/CongNo/KH-1/dieu-chinh', (route) => fulfillJson(route, { message: 'Không thể điều chỉnh công nợ' }, 500));
    await customerRow(page).getByRole('button', { name: 'Điều chỉnh nợ' }).click();
    await modal(page).locator('input[type="number"]').fill('500000');
    await modal(page).locator('textarea').fill('Phụ phí');
    await modal(page).getByRole('button', { name: 'Xác nhận', exact: true }).click();
    await expect(page.getByText('Không thể điều chỉnh công nợ')).toBeVisible();
    await expect(modal(page).locator('input[type="number"]')).toHaveValue('500000');
  });

  test('37. Chỉ hiển thị thao tác mở khóa đối với khách hàng đang bị khóa', async ({ page }) => {
    await expect(customerRow(page, 'Phạm Dũng').getByRole('button', { name: 'Mở khóa' })).toBeVisible();
    await expect(customerRow(page).getByRole('button', { name: 'Mở khóa' })).toHaveCount(0);
  });

  test('38. Bắt buộc nhập lý do mở khóa đặt hàng', async ({ page }) => {
    await customerRow(page, 'Phạm Dũng').getByRole('button', { name: 'Mở khóa' }).click();
    await modal(page).getByRole('button', { name: 'Xác nhận mở khóa' }).click();
    await expect(page.getByText('Vui lòng nhập lý do mở khóa!')).toBeVisible();
  });

  test('39. Gửi đúng lý do khi mở khóa đặt hàng', async ({ page }) => {
    let payload;
    await page.route('**/CongNo/KH-4/mo-khoa', async (route) => {
      payload = route.request().postDataJSON();
      await fulfillJson(route, { result: true });
    });
    await customerRow(page, 'Phạm Dũng').getByRole('button', { name: 'Mở khóa' }).click();
    await modal(page).locator('textarea').fill('  Khách cam kết thanh toán  ');
    await modal(page).getByRole('button', { name: 'Xác nhận mở khóa' }).click();
    expect(payload).toEqual({ ghichu: 'Khách cam kết thanh toán' });
    await expect(page.getByText('Mở khóa đặt hàng thành công!')).toBeVisible();
  });

  test('40. Giữ biểu mẫu khi API mở khóa thất bại', async ({ page }) => {
    await page.route('**/CongNo/KH-4/mo-khoa', (route) => fulfillJson(route, { message: 'Không thể mở khóa' }, 409));
    await customerRow(page, 'Phạm Dũng').getByRole('button', { name: 'Mở khóa' }).click();
    await modal(page).locator('textarea').fill('Khách cam kết thanh toán');
    await modal(page).getByRole('button', { name: 'Xác nhận mở khóa' }).click();
    await expect(page.getByText('Không thể mở khóa')).toBeVisible();
    await expect(modal(page).locator('textarea')).toHaveValue('Khách cam kết thanh toán');
  });
});

test.describe('Quản lý công nợ - Lịch sử biến động', () => {
  test('41. Hiển thị đầy đủ các cột và dữ liệu lịch sử công nợ', async ({ page }) => {
    await openDebtPage(page);
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    for (const heading of ['Thời gian', 'Loại', 'Số tiền', 'Số dư sau', 'Người thực hiện', 'Ghi chú']) {
      await expect(modal(page).getByRole('columnheader', { name: heading })).toBeVisible();
    }
    await expect(modal(page)).toContainText('3.000.000đ');
    await expect(modal(page)).toContainText('Đơn hàng DH-001');
  });

  test('42. Chuyển đúng mã loại biến động sang nhãn tiếng Việt', async ({ page }) => {
    await openDebtPage(page);
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    await expect(modal(page).getByText('Tăng nợ', { exact: true })).toBeVisible();
    await expect(modal(page).getByText('Giảm nợ', { exact: true })).toBeVisible();
    await expect(modal(page).getByText('Điều chỉnh', { exact: true })).toBeVisible();
  });

  test('43. Hiển thị Hệ thống và dấu gạch ngang khi lịch sử thiếu người thực hiện hoặc ghi chú', async ({ page }) => {
    await openDebtPage(page);
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    await expect(modal(page).getByText('Hệ thống', { exact: true })).toBeVisible();
    await expect(modal(page).getByText('-', { exact: true })).toBeVisible();
  });

  test('44. Hiển thị thông báo khi khách hàng chưa có biến động công nợ', async ({ page }) => {
    await openDebtPage(page, { history: [] });
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    await expect(modal(page).getByText('Chưa có biến động nào.')).toBeVisible();
  });

  test('45. Hiển thị lỗi khi không tải được lịch sử công nợ', async ({ page }) => {
    await mockDebtApis(page);
    await page.route('**/CongNo/*/lich-su', (route) => fulfillJson(route, { message: 'Lỗi hệ thống' }, 500));
    await page.goto('/admin/QuanLyCongNo');
    await expect(page.getByText('Đang tải dữ liệu...')).toHaveCount(0);
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    await expect(page.getByText('Không thể tải lịch sử công nợ!')).toBeVisible();
  });

  test('46. Đóng được cửa sổ lịch sử công nợ', async ({ page }) => {
    await openDebtPage(page);
    await customerRow(page).getByRole('button', { name: 'Lịch sử' }).click();
    await expect(page.getByRole('heading', { name: 'Lịch sử công nợ — Nguyễn An' })).toBeVisible();
    await modal(page).locator('button').first().click();
    await expect(modal(page)).toHaveCount(0);
  });
});
