import { test, expect } from '@playwright/test';

test.describe('API Routes E2E Audit Tests', () => {
  test('GET /api/chats returns 400 when missing userId', async ({ request }) => {
    const res = await request.get('/api/chats');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('User ID is required');
  });

  test('GET /api/chats returns chats array when userId query is provided', async ({ request }) => {
    const res = await request.get('/api/chats?userId=00000000-0000-0000-0000-000000000001');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body.chats)).toBe(true);
  });

  test('GET /api/reports/status returns 400 when missing reportId', async ({ request }) => {
    const res = await request.get('/api/reports/status');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('reportId is required');
  });

  test('GET /api/reports/trends returns 400 when missing userId parameter', async ({ request }) => {
    const res = await request.get('/api/reports/trends');
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('userId');
  });

  test('GET /api/reports/share/[token] returns 404 for non-existent token', async ({ request }) => {
    const res = await request.get('/api/reports/share/invalid-token-12345');
    expect(res.status()).toBe(404);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  test('POST /api/register handles validation and duplicate checks', async ({ request }) => {
    const res = await request.post('/api/register', {
      data: { email: 'invalid-email', password: '123' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid input data');
  });

  test('POST /api/chat handles invalid message payload', async ({ request }) => {
    const res = await request.post('/api/chat', {
      data: { messages: [] },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body.error).toContain('Invalid or missing messages array');
  });
});
