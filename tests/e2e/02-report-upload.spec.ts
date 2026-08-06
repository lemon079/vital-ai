import { test, expect } from '@playwright/test';

test.describe('Report Upload E2E Tests', () => {
  test('paperclip file upload input exists and is accessible', async ({ page, context }) => {
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

    const uploadBtn = page.locator('button[title*="Upload PDF or Image"]');
    await expect(uploadBtn).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toHaveCount(1);
  });
});
