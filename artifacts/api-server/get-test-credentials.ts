/**
 * Helper script to get test credentials for load testing
 *
 * This script helps you extract your JWT token and user ID from the browser
 * so you can run the load test.
 *
 * Usage:
 * 1. Log into the app in your browser
 * 2. Open browser DevTools (F12)
 * 3. Go to Application/Storage → Cookies
 * 4. Find the 'token' cookie and copy its value
 * 5. Run: npx tsx get-test-credentials.ts
 * 6. The script will decode the token and show you your user ID
 */

const token = process.env.TEST_TOKEN;

if (!token) {
  console.log('To get your test credentials:');
  console.log('');
  console.log('1. Log into the app in your browser');
  console.log('2. Open browser DevTools (F12)');
  console.log('3. Go to Application → Cookies (or Storage → Cookies)');
  console.log('4. Find the "token" cookie and copy its value');
  console.log('5. Run this script with the token:');
  console.log('   TEST_TOKEN="your-token-here" npx tsx get-test-credentials.ts');
  console.log('');
  console.log('Or set it as an environment variable and run the load test directly:');
  console.log('   TEST_TOKEN="your-token-here" TEST_USER_ID="your-user-id" npx tsx load-test-monday-rush.ts');
  process.exit(1);
}

try {
  // Decode JWT (base64url encoded)
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );

  const payload = JSON.parse(jsonPayload);

  console.log('='.repeat(80));
  console.log('Test Credentials');
  console.log('='.repeat(80));
  console.log('');
  console.log('Your user ID:', payload.userId);
  console.log('Your email:', payload.email);
  console.log('');
  console.log('Copy these values to run the load test:');
  console.log('');
  console.log(`TEST_TOKEN="${token}"`);
  console.log(`TEST_USER_ID="${payload.userId}"`);
  console.log('');
  console.log('Then run:');
  console.log('  TEST_TOKEN="${token}" TEST_USER_ID="${payload.userId}" npx tsx load-test-monday-rush.ts');
  console.log('');
  console.log('='.repeat(80));
} catch (error) {
  console.error('Failed to decode token:', error);
  console.log('Make sure you copied the entire token value from the cookie.');
  process.exit(1);
}
