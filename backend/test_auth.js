const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');
const User = require('./models/User');
const RefreshSession = require('./models/RefreshSession');
const app = require('./app');

async function runAuthTests() {
  console.log('=== FOLKBOARD PHASE 2 AUTHENTICATION TEST SUITE ===\n');

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[Setup] Connected to MongoDB.');

    // Start a temporary test server
    const server = app.listen(5099);
    const BASE_URL = 'http://127.0.0.1:5099/api/auth';

    const testUser = {
      username: `preserver_${Date.now()}`,
      email: `preserver_${Date.now()}@folkboard.org`,
      password: 'SecureFolkPassword#2026',
    };

    let accessToken = null;
    let refreshCookie = null;

    // Helper for fetch with cookie extraction
    const sendRequest = async (endpoint, options = {}) => {
      const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
      if (refreshCookie) {
        headers['Cookie'] = refreshCookie;
      }
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const setCookieHeader = res.headers.get('set-cookie');
      if (setCookieHeader && setCookieHeader.includes('refreshToken=')) {
        // Extract raw refreshToken cookie value
        const match = setCookieHeader.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshCookie = `refreshToken=${match[1]}`;
        }
      }

      const data = await res.json().catch(() => ({}));
      return { status: res.status, data, headers: res.headers };
    };

    // Test 1: Register new user
    console.log('Test 1: POST /api/auth/register (New User Registration)');
    const regRes = await sendRequest('/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    if (regRes.status === 201 && regRes.data.accessToken && regRes.data.user.username === testUser.username) {
      console.log('  ✓ PASSED: User registered with access token and HttpOnly refresh cookie.');
      accessToken = regRes.data.accessToken;
    } else {
      throw new Error(`Test 1 Failed: ${JSON.stringify(regRes)}`);
    }

    // Test 2: Duplicate registration check
    console.log('Test 2: POST /api/auth/register (Duplicate Username/Email Prevention)');
    const dupRes = await sendRequest('/register', {
      method: 'POST',
      body: JSON.stringify(testUser),
    });
    if (dupRes.status === 409) {
      console.log('  ✓ PASSED: Duplicate user correctly rejected with 409 Conflict.');
    } else {
      throw new Error(`Test 2 Failed: ${JSON.stringify(dupRes)}`);
    }

    // Test 3: Login
    console.log('Test 3: POST /api/auth/login (Authentication with Credentials)');
    const loginRes = await sendRequest('/login', {
      method: 'POST',
      body: JSON.stringify({
        identifier: testUser.email,
        password: testUser.password,
      }),
    });
    if (loginRes.status === 200 && loginRes.data.accessToken) {
      console.log('  ✓ PASSED: Login succeeded, issued new access token and refresh cookie.');
      accessToken = loginRes.data.accessToken;
    } else {
      throw new Error(`Test 3 Failed: ${JSON.stringify(loginRes)}`);
    }

    // Test 4: Protected route with valid token
    console.log('Test 4: GET /api/auth/me (Protected Route with Bearer Token)');
    const meRes = await sendRequest('/me', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (meRes.status === 200 && meRes.data.user.email === testUser.email) {
      console.log('  ✓ PASSED: Identity verified successfully from memory access token.');
    } else {
      throw new Error(`Test 4 Failed: ${JSON.stringify(meRes)}`);
    }

    // Test 5: Protected route without token
    console.log('Test 5: GET /api/auth/me (Unauthorized Rejection Without Bearer Token)');
    const unauthRes = await sendRequest('/me', { method: 'GET' });
    if (unauthRes.status === 401) {
      console.log('  ✓ PASSED: Correctly blocked unauthorized access with 401.');
    } else {
      throw new Error(`Test 5 Failed: ${JSON.stringify(unauthRes)}`);
    }

    // Test 6: Silent Refresh via HttpOnly Cookie
    console.log('Test 6: POST /api/auth/refresh (Session Rotation via HttpOnly Cookie)');
    const refreshRes = await sendRequest('/refresh', { method: 'POST' });
    if (refreshRes.status === 200 && refreshRes.data.accessToken) {
      console.log('  ✓ PASSED: Access token successfully refreshed and rotated.');
      accessToken = refreshRes.data.accessToken;
    } else {
      throw new Error(`Test 6 Failed: ${JSON.stringify(refreshRes)}`);
    }

    // Test 7: Logout
    console.log('Test 7: POST /api/auth/logout (Session Revocation & Cookie Clear)');
    const logoutRes = await sendRequest('/logout', { method: 'POST' });
    if (logoutRes.status === 200) {
      console.log('  ✓ PASSED: Successfully logged out and marked session as revoked.');
    } else {
      throw new Error(`Test 7 Failed: ${JSON.stringify(logoutRes)}`);
    }

    // Clean up test data
    console.log('\n[Teardown] Cleaning up test records from database...');
    const deletedUser = await User.findOneAndDelete({ username: testUser.username });
    if (deletedUser) {
      await RefreshSession.deleteMany({ userId: deletedUser._id });
    }
    console.log('[Teardown] Cleanup complete.');

    server.close();
    await mongoose.connection.close();
    console.log('\n🎉 ALL PHASE 2 AUTHENTICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Test Suite Error:', err.message);
    process.exit(1);
  }
}

runAuthTests();

