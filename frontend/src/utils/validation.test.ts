import test from 'node:test';
import assert from 'node:assert/strict';
import {
  EmployeeStatus,
  MenuCategory,
  MenuItemStatus,
  UserRole,
} from '../types';
import {
  hasValidationErrors,
  validateEmployeeForm,
  validateMenuItemForm,
} from './validation';

test('validateEmployeeForm catches missing fields, duplicate code, invalid phone/email', () => {
  const errors = validateEmployeeForm(
    {
      employeeCode: 'NV-001',
      fullName: '',
      role: UserRole.STAFF,
      positionTitle: '',
      phone: '12345',
      email: 'not-an-email',
      shift: 'Ca sáng',
      baseSalaryVnd: 0,
      hireDate: '2026-11-20',
      status: EmployeeStatus.ACTIVE,
    },
    ['NV-001']
  );

  assert.equal(hasValidationErrors(errors), true);
  assert.ok(errors.employeeCode);
  assert.ok(errors.fullName);
  assert.ok(errors.phone);
  assert.ok(errors.email);
  assert.ok(errors.baseSalaryVnd);
});

test('validateEmployeeForm passes on valid Vietnamese employee input', () => {
  const errors = validateEmployeeForm(
    {
      employeeCode: 'NV-010',
      fullName: 'Hoàng Minh Khôi',
      role: UserRole.STAFF,
      positionTitle: 'Nhân viên phục vụ',
      phone: '0912 345 678',
      email: 'khoi.hoang@bepviet.vn',
      shift: 'Ca sáng',
      baseSalaryVnd: 9_500_000,
      hireDate: '2026-11-20',
      status: EmployeeStatus.ACTIVE,
    },
    ['NV-001']
  );

  assert.equal(hasValidationErrors(errors), false);
});

test('validateMenuItemForm catches invalid price/SKU and passes valid dish', () => {
  const invalidErrors = validateMenuItemForm(
    {
      sku: 'MC-01',
      name: '',
      description: '',
      category: MenuCategory.MAIN_COURSE,
      priceVnd: 500,
      unit: '',
      preparationMinutes: 0,
      status: MenuItemStatus.AVAILABLE,
    },
    ['MC-01']
  );

  assert.equal(hasValidationErrors(invalidErrors), true);
  assert.ok(invalidErrors.sku);
  assert.ok(invalidErrors.name);
  assert.ok(invalidErrors.priceVnd);
  assert.ok(invalidErrors.unit);
  assert.ok(invalidErrors.preparationMinutes);

  const validErrors = validateMenuItemForm(
    {
      sku: 'MC-99',
      name: 'Gà nướng mật ong lá chanh',
      description: 'Thịt gà ta nướng than hoa',
      category: MenuCategory.MAIN_COURSE,
      priceVnd: 185_000,
      unit: 'Đĩa',
      preparationMinutes: 20,
      status: MenuItemStatus.AVAILABLE,
    },
    ['MC-01']
  );

  assert.equal(hasValidationErrors(validErrors), false);
});
