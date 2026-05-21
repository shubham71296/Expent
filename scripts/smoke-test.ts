/**
 * Lightweight smoke tests for pure logic (no Jest required).
 * Run: npm run test:smoke
 */
import assert from 'node:assert/strict';
import { BUTTON_ACTIVE_OPACITY } from '../components/ui/buttonPressable';
import {
  isValidEmail,
  validateEmail,
  validateLoginFields,
  validateRegisterFields,
  validateOtpCode,
  validateSignupPassword,
} from '../lib/authValidation';

let passed = 0;
let failed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${e instanceof Error ? e.message : String(e)}`);
  }
}

console.log('\nbuttonPressable');
test('BUTTON_ACTIVE_OPACITY is defined', () => {
  assert.ok(BUTTON_ACTIVE_OPACITY > 0 && BUTTON_ACTIVE_OPACITY <= 1);
});

console.log('\nauthValidation');
test('valid email', () => {
  assert.equal(isValidEmail('user@example.com'), true);
  assert.equal(validateEmail('user@example.com'), null);
});
test('invalid email', () => {
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(validateEmail(''), 'Enter your email.');
});
test('login requires password', () => {
  assert.equal(validateLoginFields('a@b.co', ''), 'Enter your password.');
});
test('register password rules', () => {
  assert.match(validateSignupPassword('short') ?? '', /at least 8/);
  assert.equal(validateSignupPassword('Password1'), null);
});
test('register mismatch', () => {
  assert.equal(
    validateRegisterFields('Jane', 'j@e.co', 'Password1', 'Password2'),
    'Passwords do not match.'
  );
});
test('otp length', () => {
  assert.match(validateOtpCode('123') ?? '', /digit/);
});

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);
