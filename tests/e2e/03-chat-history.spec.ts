import { test, expect } from '@playwright/test';

test.describe('Chat History Sidebar E2E Tests', () => {
  test('opens sidebar drawer and shows history controls', async ({ page, context }) => {
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

    const menuBtn = page.locator('header button').first();
    await menuBtn.click();

    await expect(page.getByText('Manage your health conversations')).toBeVisible();

    const newChatBtn = page.getByRole('button', { name: /New Chat/i });
    await expect(newChatBtn).toBeVisible();
  });
});
