const { describe, it, before, after, beforeEach } = require('node:test');
const assert = require('node:assert');
const { setupTestEnv, teardownTestEnv, cleanUserAndMatchData, request } = require('./test_helper');

describe('Backend Auth Unit & Integration Tests', () => {
  before(async () => {
    await setupTestEnv();
  });

  after(async () => {
    await teardownTestEnv();
  });

  beforeEach(async () => {
    await cleanUserAndMatchData();
  });

  it('1. Register new user with hashed password and return access token', async () => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'heritagewarrior',
        email: 'warrior@folkboard.org',
        password: 'Pass1234Secure!',
      }),
    });

    assert.strictEqual(res.status, 201, `Expected status 201, got ${res.status}`);
    assert.strictEqual(res.data.success, true);
    const token = res.data.accessToken || res.data.token;
    assert.ok(token, 'Response must include JWT access token');
    assert.strictEqual(res.data.user.username, 'heritagewarrior');
    assert.strictEqual(res.data.user.email, 'warrior@folkboard.org');

    // Confirm Set-Cookie header contains HttpOnly refresh token
    const setCookie = res.headers.get('set-cookie') || '';
    assert.ok(setCookie.includes('refreshToken='), 'Must set refreshToken cookie');
    assert.ok(setCookie.includes('HttpOnly'), 'Cookie must have HttpOnly flag');
  });

  it('2. Login with valid credentials and reject invalid password', async () => {
    // Setup user
    await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'testplayer',
        email: 'player@folkboard.org',
        password: 'Password123!',
      }),
    });

    // Valid login
    const loginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'player@folkboard.org',
        password: 'Password123!',
      }),
    });

    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginRes.data.success, true);
    const token = loginRes.data.accessToken || loginRes.data.token;
    assert.ok(token);
    assert.strictEqual(loginRes.data.user.username, 'testplayer');

    // Invalid password
    const badLoginRes = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'player@folkboard.org',
        password: 'WrongPassword123!',
      }),
    });

    assert.strictEqual(badLoginRes.status, 401);
    assert.strictEqual(badLoginRes.data.success, false);
    assert.ok(badLoginRes.data.message.includes('Invalid'));
  });

  it('3. Access protected user profile with valid Bearer token and reject unauthenticated request', async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'profileuser',
        email: 'profile@folkboard.org',
        password: 'Password123!',
      }),
    });
    const token = regRes.data.accessToken || regRes.data.token;

    // Unauthenticated request
    const unauthRes = await request('/auth/me');
    assert.strictEqual(unauthRes.status, 401);

    // Authenticated request
    const authRes = await request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(authRes.status, 200);
    assert.strictEqual(authRes.data.user.username, 'profileuser');
  });

  it('4. Refresh access token using HttpOnly cookie', async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'refreshuser',
        email: 'refresh@folkboard.org',
        password: 'Password123!',
      }),
    });

    const setCookie = regRes.headers.get('set-cookie') || '';
    const cookiePart = setCookie.split(';')[0]; // refreshToken=...

    const refreshRes = await request('/auth/refresh', {
      method: 'POST',
      headers: { Cookie: cookiePart },
    });

    assert.strictEqual(refreshRes.status, 200);
    const refreshedToken = refreshRes.data.accessToken || refreshRes.data.token;
    assert.ok(refreshedToken, 'Must return refreshed access token');
    assert.strictEqual(refreshRes.data.user.username, 'refreshuser');
  });

  it('5. User logout clears refresh token cookie and ends session', async () => {
    const regRes = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: 'logoutuser',
        email: 'logout@folkboard.org',
        password: 'Password123!',
      }),
    });

    const setCookie = regRes.headers.get('set-cookie') || '';
    const cookiePart = setCookie.split(';')[0];

    const logoutRes = await request('/auth/logout', {
      method: 'POST',
      headers: { Cookie: cookiePart },
    });

    assert.strictEqual(logoutRes.status, 200);
    assert.strictEqual(logoutRes.data.success, true);
    const clearCookieHeader = logoutRes.headers.get('set-cookie') || '';
    assert.ok(
      clearCookieHeader.includes('refreshToken=;') ||
      clearCookieHeader.includes('Expires=Thu, 01 Jan 1970') ||
      clearCookieHeader.includes('Max-Age=0')
    );
  });
});
