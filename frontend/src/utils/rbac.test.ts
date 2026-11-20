import test from 'node:test';
import assert from 'node:assert/strict';
import { UserRole } from '../types';
import {
  canAccessPage,
  getDefaultPageForRole,
  getMenuItemsForRole,
} from './rbac';

test('MANAGER receives full 8-item navigation menu and defaults to dashboard', () => {
  const items = getMenuItemsForRole(UserRole.MANAGER);
  assert.equal(items.length, 8);
  assert.equal(getDefaultPageForRole(UserRole.MANAGER), 'dashboard');
  assert.equal(canAccessPage(UserRole.MANAGER, 'employees'), true);
  assert.equal(canAccessPage(UserRole.MANAGER, 'kitchen'), true);
});

test('STAFF receives 5 operational/billing items and cannot access manager or kitchen views', () => {
  const items = getMenuItemsForRole(UserRole.STAFF);
  const keys = items.map((item) => item.key);
  assert.deepEqual(keys, ['tables', 'orders', 'menu', 'invoices', 'discounts']);
  assert.equal(getDefaultPageForRole(UserRole.STAFF), 'tables');
  assert.equal(canAccessPage(UserRole.STAFF, 'employees'), false);
  assert.equal(canAccessPage(UserRole.STAFF, 'dashboard'), false);
  assert.equal(canAccessPage(UserRole.STAFF, 'kitchen'), false);
});

test('CHEF receives only kitchen and menu items and defaults to kitchen', () => {
  const items = getMenuItemsForRole(UserRole.CHEF);
  const keys = items.map((item) => item.key);
  assert.deepEqual(keys, ['kitchen', 'menu']);
  assert.equal(getDefaultPageForRole(UserRole.CHEF), 'kitchen');
  assert.equal(canAccessPage(UserRole.CHEF, 'invoices'), false);
  assert.equal(canAccessPage(UserRole.CHEF, 'tables'), false);
});
