import { test, expect } from '@playwright/test';

test.describe('Agent Dashboard E2E Tests', () => {
  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.goto('/chat');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user sees agent dashboard interface', async ({ page, context }) => {
    await page.route('/api/chats*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ chats: [] }),
      });
    });

    await context.addCookies([
      { name: 'userId', value: '00000000-0000-0000-0000-000000000001', domain: 'localhost', path: '/' },
      { name: 'isOnboarded', value: 'true', domain: 'localhost', path: '/' },
    ]);

    await page.goto('/chat');

    const headerTitle = page.locator('header h1');
    await expect(headerTitle).toBeVisible();
    await expect(headerTitle).toContainText('VitalSense Agent');

    const chatInput = page.getByPlaceholder(/Type your health question/i);
    await expect(chatInput).toBeVisible();

    await chatInput.fill('What is a normal potassium level?');
    await expect(chatInput).toHaveValue('What is a normal potassium level?');
  });
});
