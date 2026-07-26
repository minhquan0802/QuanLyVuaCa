# E2E Tests for Login Functionality

This directory contains end-to-end tests for login and ordering flows using Playwright.

## Setup

### Prerequisites
- Node.js (v16+)
- npm

### Installation

Playwright is already added to the project dependencies. To install all dependencies:

```bash
npm install
```

This installs `@playwright/test`. The current configuration runs only the `chrome` project using Playwright's Desktop Chrome profile.

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode (interactive)
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npx playwright test tests/auth/login.spec.js
```

### Run specific test
```bash
npx playwright test -g "Hiển thị form đăng nhập với tất cả các trường bắt buộc"
```

## Test Structure

The login coverage contains 32 tests organized in 4 test suites:

### 1. **Login Page - Authentication** (Basic UI Tests)
- Display of login form and fields
- Error handling for empty form submission
- Password visibility toggle
- Loading state during login
- Navigation to register and home pages

### 2. **Login Page - Error Scenarios** (Error Handling)
- Unverified email (code 1030)
- Pending approval (code 1031)
- Locked account (code 1028)
- Invalid credentials (401)
- Network errors

### 3. **Login Page - Successful Login** (Integration Tests)
- Successful admin login → redirect to `/admin`
- Successful staff login → redirect to `/admin/QuanLyDonHang`
- Successful customer login → redirect to `/home`

### 4. **Login Page - Additional Scenarios** (Edge Cases)
- Forgot-password and quick-fill navigation
- `authenticated: false`, server errors, and user-info errors
- Duplicate-submit prevention and toast messages
- Unknown roles, invalid email format, and Unicode passwords
- Accessible labels and keyboard navigation

## Ordering Test Structure

The ordering coverage contains 38 tests organized in 3 suites:

1. **Đặt hàng - Sản phẩm và giỏ hàng** (13 tests)
2. **Đặt hàng - Checkout và tạo đơn** (19 tests)
3. **Đặt hàng - Lịch sử, hủy đơn và thanh toán** (6 tests)

Run only ordering tests:

```bash
npx playwright test tests/order/order.spec.js --project=chrome
```

## Confirmation and Packing Test Structure

The admin order-confirmation coverage contains 40 tests organized in 2 suites:

1. **Quản lý đơn hàng - Xác nhận đơn** (25 tests)
2. **Quản lý đơn hàng - Cân và đóng hàng** (15 tests)

Run only confirmation and packing tests:

```bash
npx playwright test tests/admin-order/confirmation-packing.spec.js --project=chrome
```

## Debt Management Test Structure

The debt-management coverage contains 46 tests organized in 4 suites:

1. **Quản lý công nợ - Danh sách, trạng thái và phân quyền** (18 tests)
2. **Quản lý công nợ - Hạn mức tín dụng** (11 tests)
3. **Quản lý công nợ - Điều chỉnh và mở khóa** (11 tests)
4. **Quản lý công nợ - Lịch sử biến động** (6 tests)

Run only debt-management tests:

```bash
npx playwright test tests/debt/debt-management.spec.js --project=chrome
```

## Liquidation Test Structure

The liquidation coverage contains 66 Chrome E2E tests organized in 5 suites:

1. **Quyền truy cập và tải dữ liệu** (7 tests)
2. **Chọn sản phẩm và lô hàng** (12 tests)
3. **Thêm và quản lý chi tiết** (26 tests)
4. **Hoàn tất phiếu** (13 tests)
5. **Thanh lý trực tiếp một lô** (8 tests)

Run only liquidation E2E tests:

```bash
npx playwright test tests/liquidation/liquidation.spec.js --project=chrome
```

## Test Files

- `tests/auth/login.spec.js` - 32 login tests
- `tests/order/order.spec.js` - 38 ordering tests
- `tests/order/fixtures.js` - Shared ordering fixtures and API mocks
- `tests/admin-order/confirmation-packing.spec.js` - 40 confirmation and packing tests
- `tests/admin-order/fixtures.js` - Shared admin-order fixtures and API mocks
- `tests/debt/debt-management.spec.js` - 46 debt-management tests
- `tests/debt/fixtures.js` - Shared debt-management fixtures and API mocks
- `tests/liquidation/liquidation.spec.js` - 66 liquidation tests
- `tests/liquidation/fixtures.js` - Shared liquidation fixtures and API mocks

## Configuration

Configuration is defined in `playwright.config.js`:

- Base URL: `http://localhost:5173`
- Browser project: Chrome only (`Desktop Chrome` profile on Playwright Chromium)
- Total tests: 222 (32 login + 38 ordering + 40 confirmation/packing + 46 debt management + 66 liquidation)
- Test timeout: 30 seconds
- Auto-start dev server before tests

## Common Issues

### Port Already in Use
If you get an error about port 5173 already in use:
```bash
# Kill the process using port 5173
# On Windows:
netstat -ano | findstr :5173
taskkill /PID <PID> /F

# On macOS/Linux:
lsof -ti:5173 | xargs kill -9
```

### API Mocking
Tests use route handlers to mock API responses. If the API is running, comments out the route mock or use `{ unhandledRouteAction: 'ignore' }` in the config.

### Debugging Tests
Use the debug mode to step through tests:
```bash
npm run test:debug
```

## Example: Writing a New Test

```javascript
test('thực hiện một hành vi cụ thể', async ({ page }) => {
  await page.goto('/login');
  
  // Interact with elements
  await page.locator('input[type="email"]').fill('test@example.com');
  
  // Assert expectations
  await expect(page.locator('h1')).toContainText('Expected Text');
});
```

## Environment Variables

If needed, create a `.env.test` file with test-specific environment variables.

## CI/CD Integration

To run tests in CI/CD pipeline, the configuration already handles CI mode. In CI mode:
- Uses 1 worker (no parallelization)
- Retries failed tests twice
- Fails on console warnings (`forbidOnly`)

## References

- [Playwright Documentation](https://playwright.dev)
- [Playwright API Reference](https://playwright.dev/docs/api/class-test)
- [Test Best Practices](https://playwright.dev/docs/best-practices)
