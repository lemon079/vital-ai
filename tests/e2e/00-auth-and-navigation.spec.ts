import { test, expect } from '@playwright/test';

test.describe('Auth and Navigation E2E Tests', () => {
  test('unauthenticated root / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText('Welcome Back')).toBeVisible();
  });

  test('login page renders form fields and submit button', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByText('Welcome Back')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();

    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    const submitBtn = page.getByRole('button', { name: /Sign In/i });

    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitBtn).toBeVisible();

    await emailInput.fill('user@vitalsense.ai');
    await passwordInput.fill('password123');
    await expect(emailInput).toHaveValue('user@vitalsense.ai');
  });

  test('signup page renders registration fields', async ({ page }) => {
    await page.goto('/signup');

    await expect(page.getByText('Create an Account')).toBeVisible();
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
  });

  test('authenticated user redirects to /chat', async ({ page, context }) => {
    await context.addCookies([
      { name: 'userId', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
      { name: 'isOnboarded', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/login');
    await expect(page).toHaveURL(/\/chat/);
  });
});
