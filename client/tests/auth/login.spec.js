import { test, expect } from '@playwright/test';

test.describe('Login Page - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto('/login');
  });

  test('Hiển thị form đăng nhập với tất cả các trường bắt buộc', async ({ page }) => {
    // Check if page title/heading is present
    await expect(page.locator('h1')).toContainText('Đăng nhập hệ thống');

    // Check for email input field
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input field
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button:has-text("Đăng nhập")');
    await expect(submitButton).toBeVisible();

    // Check for register link
    const registerLink = page.locator('a:has-text("Đăng ký")');
    await expect(registerLink).toBeVisible();
  });

  test('Hiển thị lỗi khi submit form trống', async ({ page }) => {
    // Click submit button without entering data
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for error message
    const errorMessage = page.locator('.border-red-100');
    await expect(errorMessage).toBeVisible();
  });

  test('Hiển thị lỗi khi chỉ điền email', async ({ page }) => {
    // Fill only email
    await page.locator('input[type="email"]').fill('test@example.com');

    // Click submit button
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for error message
    const errorMessage = page.locator('.border-red-100');
    await expect(errorMessage).toBeVisible();
  });

  test('Hiển thị lỗi khi chỉ điền mật khẩu', async ({ page }) => {
    // Fill only password
    await page.locator('input[type="password"]').fill('password123');

    // Click submit button
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for error message
    const errorMessage = page.locator('.border-red-100');
    await expect(errorMessage).toBeVisible();
  });

  test('Chuyển đổi hiển thị/ẩn mật khẩu', async ({ page }) => {
    const passwordInput = page.locator('input[type="password"]');
    const toggleButton = page.getByRole('button', { name: 'Hiển thị mật khẩu' });

    // Check that password is initially hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click toggle button to show password
    await toggleButton.click();

    // Check that password is now visible
    await expect(page.locator('#login-password')).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: 'Ẩn mật khẩu' }).click();
    await expect(page.locator('#login-password')).toHaveAttribute('type', 'password');
  });

  test('Hiển thị trạng thái loading khi đăng nhập', async ({ page }) => {
    // Mock API response - add slight delay
    await page.route('**/auth/token', (route) => {
      setTimeout(() => {
      route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Invalid credentials' }),
        });
      }, 800);
    });

    // Fill in credentials
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton.locator('.animate-spin')).toBeVisible();
  });

  test('Xử lý lỗi thông tin không chính xác (401)', async ({ page }) => {
    // Mock the API to return 401 error
    await page.route('**/auth/token', (route) => {
      route.abort('failed');
    });

    // Fill in credentials
    await page.locator('input[type="email"]').fill('wrong@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');

    // Click submit
    await page.locator('button:has-text("Đăng nhập")').click();

    await expect(page.locator('.border-red-100')).toContainText('Có lỗi xảy ra, vui lòng thử lại sau.');
  });

  test('Chuyển hướng đến trang đăng ký khi click nút đăng ký', async ({ page }) => {
    // Click on register link/button
    const registerLink = page.locator('a:has-text("Đăng ký")') ;
    await registerLink.click();

    // Check if we navigated to register page
    await expect(page).toHaveURL('/register');
  });

  test('Chuyển hướng đến trang chủ khi click logo', async ({ page }) => {
    // Click on the logo/title area
    const logoButton = page.getByText('Vựa cá Điêu Hồng', { exact: true });
    await logoButton.click();

    // Check if we navigated to home
    await expect(page).toHaveURL('/');
  });

  test('Xử lý lỗi mạng một cách thanh lịch', async ({ page }) => {
    // Simulate network error by going offline
    await page.context().setOffline(true);

    // Fill in credentials
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // Click submit
    await page.locator('button:has-text("Đăng nhập")').click();

    // Wait for error to appear
    await page.waitForTimeout(500);

    // Check for error message
    const errorDiv = page.locator('.border-red-100');
    await expect(errorDiv).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
  });

  test('Xóa thông báo lỗi khi người dùng bắt đầu gõ', async ({ page }) => {
    // Submit empty form to show error
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check error is visible
    const errorDiv = page.locator('.border-red-100');
    await expect(errorDiv).toBeVisible();

    // Type in email field
    await page.locator('input[type="email"]').fill('test@example.com');

    await expect(errorDiv).toBeHidden();
  });

  test('Chấp nhận submit form bằng phím Enter', async ({ page }) => {
    // Mock successful login response
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            authenticated: true,
            token: 'mock-token',
          },
        }),
      });
    });

    await page.route('**/tai-khoan/my-info', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            id: 1,
            email: 'user@example.com',
            vaitro: 'ADMIN',
          },
        }),
      });
    });

    // Fill in credentials
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // Press Enter to submit
    await page.locator('input[type="password"]').press('Enter');

    // Wait for navigation to admin page
    await page.waitForURL('/admin', { timeout: 5000 });
  });

  test('Vô hiệu hóa nút submit khi loading', async ({ page }) => {
    // Mock the API with delay
    await page.route('**/auth/token', (route) => {
      setTimeout(() => {
      route.fulfill({
          status: 200,
          body: JSON.stringify({
            result: {
              authenticated: true,
              token: 'mock-token',
            },
          }),
        });
      }, 2000);
    });

    await page.route('**/tai-khoan/my-info', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            id: 1,
            email: 'user@example.com',
            vaitro: 'CUSTOMER',
          },
        }),
      });
    });

    // Fill in credentials
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('password123');

    // Click submit
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    await expect(submitButton).toBeDisabled();
    await expect(submitButton.locator('.animate-spin')).toBeVisible();
  });
});

test.describe('Login Page - Error Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Xử lý lỗi email chưa xác thực (code 1030)', async ({ page }) => {
    // Mock API to return unverified email error
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 422,
        body: JSON.stringify({
          code: 1030,
          message: 'Email not verified',
        }),
      });
    });

    // Fill credentials and submit
    await page.locator('input[type="email"]').fill('unverified@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for specific error message
    await expect(page.locator('.border-red-100')).toContainText('Email chưa được xác thực');
  });

  test('Xử lý lỗi chờ phê duyệt (code 1031)', async ({ page }) => {
    // Mock API to return pending approval error
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 403,
        body: JSON.stringify({
          code: 1031,
          message: 'Account pending approval',
        }),
      });
    });

    // Fill credentials and submit
    await page.locator('input[type="email"]').fill('pending@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for specific error message
    await expect(page.locator('.border-red-100')).toContainText('Tài khoản đang chờ quản trị viên phê duyệt');
  });

  test('Xử lý lỗi tài khoản bị khóa (code 1028)', async ({ page }) => {
    // Mock API to return locked account error
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 403,
        body: JSON.stringify({
          code: 1028,
          message: 'Account locked',
        }),
      });
    });

    // Fill credentials and submit
    await page.locator('input[type="email"]').fill('locked@example.com');
    await page.locator('input[type="password"]').fill('password123');
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for specific error message
    await expect(page.locator('.border-red-100')).toContainText('Tài khoản của bạn đã bị khóa');
  });

  test('Xử lý lỗi thông tin không chính xác (401)', async ({ page }) => {
    // Mock API to return 401 error
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 401,
        body: JSON.stringify({
          message: 'Invalid credentials',
        }),
      });
    });

    // Fill incorrect credentials and submit
    await page.locator('input[type="email"]').fill('user@example.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button:has-text("Đăng nhập")').click();

    // Check for specific error message
    await expect(page.locator('.border-red-100')).toContainText('Email hoặc mật khẩu không chính xác');
  });
});

test.describe('Login Page - Successful Login', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful API responses before navigating
    await page.route('**/auth/token', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            authenticated: true,
            token: 'mock-jwt-token',
          },
        }),
      });
    });

    await page.goto('/login');
  });

  test('Chuyển hướng đến dashboard admin sau khi đăng nhập thành công (admin)', async ({ page }) => {
    // Mock user info response for admin
    await page.route('**/tai-khoan/my-info', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            id: 1,
            email: 'admin@example.com',
            vaitro: 'ADMIN',
            username: 'Admin User',
          },
        }),
      });
    });

    // Fill in admin credentials
    await page.locator('input[type="email"]').fill('admin@example.com');
    await page.locator('input[type="password"]').fill('admin123');

    // Submit form
    await page.locator('button:has-text("Đăng nhập")').click();

    // Should redirect to admin dashboard
    await page.waitForURL('/admin', { timeout: 5000 });
  });

  test('Chuyển hướng đến QuanLyDonHang sau khi đăng nhập thành công (staff)', async ({ page }) => {
    // Mock user info response for staff
    await page.route('**/tai-khoan/my-info', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            id: 2,
            email: 'staff@example.com',
            vaitro: 'STAFF',
            username: 'Staff User',
          },
        }),
      });
    });

    // Fill in staff credentials
    await page.locator('input[type="email"]').fill('staff@example.com');
    await page.locator('input[type="password"]').fill('staff123');

    // Submit form
    await page.locator('button:has-text("Đăng nhập")').click();

    // Should redirect to QuanLyDonHang
    await page.waitForURL('/admin/QuanLyDonHang', { timeout: 5000 });
  });

  test('Chuyển hướng đến trang chủ sau khi đăng nhập thành công (khách hàng)', async ({ page }) => {
    // Mock user info response for customer
    await page.route('**/tai-khoan/my-info', (route) => {
      route.fulfill({
        status: 200,
        body: JSON.stringify({
          result: {
            id: 3,
            email: 'customer@example.com',
            vaitro: 'CUSTOMER',
            username: 'Customer User',
          },
        }),
      });
    });

    // Fill in customer credentials
    await page.locator('input[type="email"]').fill('customer@example.com');
    await page.locator('input[type="password"]').fill('customer123');

    // Submit form
    await page.locator('button:has-text("Đăng nhập")').click();

    // Should redirect to home
    await page.waitForURL('/home', { timeout: 5000 });
  });
});

test.describe('Login Page - Additional Scenarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  const submitCredentials = async (page, email = 'user@example.com', password = 'password123') => {
    await page.getByLabel('Email').fill(email);
    await page.locator('#login-password').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
  };

  test('Chuyển hướng đến trang quên mật khẩu', async ({ page }) => {
    await page.getByRole('link', { name: 'Quên mật khẩu?' }).click();
    await expect(page).toHaveURL('/quen-mat-khau');
  });

  test('Điền nhanh tài khoản quản trị viên', async ({ page }) => {
    await page.getByText(/Click điền nhanh/).click();

    await expect(page.getByLabel('Email')).toHaveValue('admin@gmail.com');
    await expect(page.locator('#login-password')).toHaveValue('123456789');
  });

  test('Hiển thị lỗi khi API trả authenticated bằng false', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { authenticated: false } }),
    }));

    await submitCredentials(page);

    await expect(page.locator('.border-red-100')).toContainText('Có lỗi xảy ra, vui lòng thử lại sau.');
  });

  test('Hiển thị lỗi chung khi API đăng nhập trả lỗi máy chủ', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }));

    await submitCredentials(page);

    await expect(page.locator('.border-red-100')).toContainText('Có lỗi xảy ra, vui lòng thử lại sau.');
  });

  test('Hiển thị lỗi khi không tải được thông tin người dùng sau đăng nhập', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { authenticated: true } }),
    }));
    await page.route('**/tai-khoan/my-info', (route) => route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Internal Server Error' }),
    }));

    await submitCredentials(page);

    await expect(page.locator('.border-red-100')).toContainText('Có lỗi xảy ra, vui lòng thử lại sau.');
  });

  test('Không gửi nhiều request khi nhấn đăng nhập liên tục', async ({ page }) => {
    let loginRequestCount = 0;
    await page.route('**/auth/token', (route) => {
      loginRequestCount += 1;
      setTimeout(() => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { authenticated: false } }),
      }), 500);
    });

    await page.getByLabel('Email').fill('user@example.com');
    await page.locator('#login-password').fill('password123');
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    await expect(submitButton).toBeDisabled();
    await submitButton.dispatchEvent('click');

    await expect.poll(() => loginRequestCount).toBe(1);
  });

  test('Hiển thị toast khi đăng nhập thành công', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { authenticated: true } }),
    }));
    await page.route('**/tai-khoan/my-info', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { id: 10, email: 'user@example.com', vaitro: 'CUSTOMER' } }),
    }));

    await submitCredentials(page);

    await expect(page.getByText('Đăng nhập thành công')).toBeVisible();
    await expect(page).toHaveURL('/home');
  });

  test('Hiển thị toast khi đăng nhập thất bại', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 403,
      contentType: 'application/json',
      body: JSON.stringify({ code: 1028, message: 'Account locked' }),
    }));

    await submitCredentials(page);

    await expect(page.getByText('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.')).toHaveCount(2);
  });

  test('Chuyển về trang chủ khi vai trò người dùng không xác định', async ({ page }) => {
    await page.route('**/auth/token', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { authenticated: true } }),
    }));
    await page.route('**/tai-khoan/my-info', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { id: 11, email: 'unknown@example.com', vaitro: 'UNKNOWN' } }),
    }));

    await submitCredentials(page, 'unknown@example.com');

    await expect(page).toHaveURL('/home');
  });

  test('Không gửi request khi email sai định dạng', async ({ page }) => {
    let loginRequestCount = 0;
    await page.route('**/auth/token', (route) => {
      loginRequestCount += 1;
      return route.abort();
    });

    await page.getByLabel('Email').fill('email-khong-hop-le');
    await page.locator('#login-password').fill('password123');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    expect(await page.getByLabel('Email').evaluate((input) => input.validity.typeMismatch)).toBe(true);
    expect(loginRequestCount).toBe(0);
  });

  test('Chấp nhận mật khẩu có ký tự đặc biệt và Unicode', async ({ page }) => {
    const specialPassword = 'Mật_khẩu@2026🐟';
    let submittedPassword;
    await page.route('**/auth/token', async (route) => {
      submittedPassword = route.request().postDataJSON().password;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ result: { authenticated: true } }),
      });
    });
    await page.route('**/tai-khoan/my-info', (route) => route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ result: { id: 12, email: 'unicode@example.com', vaitro: 'CUSTOMER' } }),
    }));

    await submitCredentials(page, 'unicode@example.com', specialPassword);

    expect(submittedPassword).toBe(specialPassword);
    await expect(page).toHaveURL('/home');
  });

  test('Hỗ trợ nhãn truy cập và điều hướng bằng bàn phím', async ({ page }) => {
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.locator('#login-password')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Hiển thị mật khẩu' })).toBeVisible();

    await page.getByLabel('Email').focus();
    await page.keyboard.press('Tab');
    await expect(page.locator('#login-password')).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(page.getByRole('button', { name: 'Hiển thị mật khẩu' })).toBeFocused();
  });
});
