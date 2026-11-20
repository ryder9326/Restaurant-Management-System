import test from 'node:test';
import assert from 'node:assert/strict';
import {
  authService,
  discountService,
  employeeService,
  invoiceService,
  menuService,
  orderService,
  reportService,
  setMockNetworkDelay,
  tableService,
} from './index';
import {
  EmployeeStatus,
  InvoiceStatus,
  MenuCategory,
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  TableStatus,
  UserRole,
} from '../types';

setMockNetworkDelay(0);

test('authService.login rejects empty or wrong credentials and succeeds on valid account', async () => {
  await assert.rejects(
    () => authService.login({ username: '', password: '' }),
    /Vui lòng nhập đầy đủ/
  );

  await assert.rejects(
    () => authService.login({ username: 'quanly', password: 'wrong' }),
    /không chính xác/
  );

  const res = await authService.login({ username: 'quanly', password: '123456' });
  assert.equal(res.success, true);
  assert.equal(res.data.user.role, UserRole.MANAGER);
  assert.equal(res.data.tokenType, 'Bearer');
});

test('authService.loginAsDemoRole resolves all 3 demo roles', async () => {
  for (const role of [UserRole.MANAGER, UserRole.STAFF, UserRole.CHEF]) {
    const res = await authService.loginAsDemoRole(role);
    assert.equal(res.data.user.role, role);
  }
});

test('tableService, menuService, orderService, and discountService return typed mock DTOs', async () => {
  const tables = await tableService.getTables();
  assert.ok(tables.data.length >= 6);

  const outOfStock = await menuService.getMenuItems({
    status: MenuItemStatus.OUT_OF_STOCK,
  });
  assert.ok(outOfStock.data.length >= 1);
  assert.ok(
    outOfStock.data.every((item) => item.status === MenuItemStatus.OUT_OF_STOCK)
  );

  const kitchen = await orderService.getKitchenOrders();
  assert.ok(kitchen.data.length >= 1);

  const validGiam10 = await discountService.validateDiscountCode('GIAM10', 300_000);
  assert.equal(validGiam10.data.valid, true);
  assert.equal(validGiam10.data.discountAmountVnd, 30_000);

  const validGiam50k = await discountService.validateDiscountCode('GIAM50K', 350_000);
  assert.equal(validGiam50k.data.valid, true);
  assert.equal(validGiam50k.data.discountAmountVnd, 50_000);
});

test('employeeService supports full create, update, and delete lifecycle', async () => {
  const initial = await employeeService.getEmployees();
  const created = await employeeService.createEmployee({
    employeeCode: 'NV-999',
    fullName: 'Ngô Quang Huy',
    role: UserRole.STAFF,
    positionTitle: 'Phục vụ',
    phone: '0911222333',
    email: 'huy.ngo@bepviet.vn',
    shift: 'Ca sáng',
    baseSalaryVnd: 9_000_000,
    hireDate: '2026-11-20',
    status: EmployeeStatus.ACTIVE,
  });

  assert.equal(created.data.employeeCode, 'NV-999');

  const updated = await employeeService.updateEmployee(created.data.id, {
    employeeCode: 'NV-999',
    fullName: 'Ngô Quang Huy',
    role: UserRole.CHEF,
    positionTitle: 'Phụ bếp',
    phone: '0911222333',
    email: 'huy.ngo@bepviet.vn',
    shift: 'Ca chiều',
    baseSalaryVnd: 10_500_000,
    hireDate: '2026-11-20',
    status: EmployeeStatus.ON_LEAVE,
  });
  assert.equal(updated.data.role, UserRole.CHEF);
  assert.equal(updated.data.status, EmployeeStatus.ON_LEAVE);

  await employeeService.deleteEmployee(created.data.id);
  const afterDelete = await employeeService.getEmployees();
  assert.equal(afterDelete.data.length, initial.data.length);
});

test('menuService supports full create, update, and delete lifecycle', async () => {
  const initial = await menuService.getMenuItems();
  const created = await menuService.createMenuItem({
    sku: 'KV-99',
    name: 'Nộm hoa chuối tai heo',
    description: 'Hoa chuối bào giòn trộn tai heo, lạc rang',
    category: MenuCategory.APPETIZER,
    priceVnd: 75_000,
    unit: 'Đĩa',
    preparationMinutes: 10,
    status: MenuItemStatus.AVAILABLE,
  });

  const updated = await menuService.updateMenuItem(created.data.id, {
    sku: 'KV-99',
    name: 'Nộm hoa chuối tai heo đặc biệt',
    description: 'Hoa chuối bào giòn trộn tai heo, lạc rang',
    category: MenuCategory.APPETIZER,
    priceVnd: 82_000,
    unit: 'Đĩa',
    preparationMinutes: 10,
    status: MenuItemStatus.OUT_OF_STOCK,
  });
  assert.equal(updated.data.priceVnd, 82_000);
  assert.equal(updated.data.status, MenuItemStatus.OUT_OF_STOCK);

  await menuService.deleteMenuItem(created.data.id);
  const afterDelete = await menuService.getMenuItems();
  assert.equal(afterDelete.data.length, initial.data.length);
});

test('reportService.getRevenueReport returns populated KPI and chart series', async () => {
  const res = await reportService.getRevenueReport({ preset: 'LAST_7_DAYS' });
  assert.equal(res.success, true);
  assert.equal(res.data.dailySeries.length, 7);
  assert.ok(res.data.totalRevenueVnd > 0);
  assert.ok(res.data.categoryShares.length === 4);
});

test('Staff workflow: check-in table, reject out-of-stock order, create order, edit pending item, checkout & reset table to AVAILABLE', async () => {
  // 1. Nhận bàn trống B02 (id = 2)
  const checkIn = await tableService.updateTableDetails(2, {
    status: TableStatus.OCCUPIED,
  });
  assert.equal(checkIn.data.status, TableStatus.OCCUPIED);

  // 2. Từ chối gọi món đang OUT_OF_STOCK (id = 206: Sườn non rim mặn ngọt)
  await assert.rejects(
    () =>
      orderService.createOrder({
        tableId: 2,
        staffId: 2,
        staffName: 'Trần Thu Hà',
        guestCount: 2,
        items: [{ menuItemId: 206, quantity: 1 }],
      }),
    /hết nguyên liệu/
  );

  // 3. Tạo phiếu gọi món hợp lệ (Gỏi cuốn 65k x2 + Trà đào 45k x1 = 175k)
  const orderRes = await orderService.createOrder({
    tableId: 2,
    staffId: 2,
    staffName: 'Trần Thu Hà',
    guestCount: 2,
    note: 'Ít cay, không hành',
    items: [
      { menuItemId: 201, quantity: 2 },
      { menuItemId: 209, quantity: 1 },
    ],
  });
  assert.equal(orderRes.data.status, OrderStatus.PENDING);
  assert.equal(orderRes.data.subtotalVnd, 175_000);

  // 4. Cập nhật món chưa nấu trước khi thanh toán (tăng Gỏi cuốn lên 3, hủy Trà đào -> 195k)
  const [firstItem, secondItem] = orderRes.data.items;
  const editedOrder = await orderService.updateOrderItems(orderRes.data.id, [
    { orderItemId: firstItem.id, quantity: 3, status: OrderItemStatus.PENDING },
    { orderItemId: secondItem.id, quantity: 1, status: OrderItemStatus.CANCELLED },
  ]);
  assert.equal(editedOrder.data.subtotalVnd, 195_000);

  // 5. Áp dụng mã GIAM10 (giảm 19.500đ) và thanh toán tiền mặt -> bàn tự động về AVAILABLE
  const discountCheck = await discountService.validateDiscountCode(
    'GIAM10',
    editedOrder.data.subtotalVnd
  );
  assert.equal(discountCheck.data.valid, true);
  assert.equal(discountCheck.data.discountAmountVnd, 19_500);

  const invoiceRes = await invoiceService.checkoutOrder({
    orderId: editedOrder.data.id,
    cashierId: 2,
    cashierName: 'Trần Thu Hà',
    discountCode: 'GIAM10',
    discountAmountVnd: discountCheck.data.discountAmountVnd,
    vatRate: 0.08,
    paymentMethod: PaymentMethod.CASH,
    cashReceivedVnd: 200_000,
  });

  assert.equal(invoiceRes.data.status, InvoiceStatus.PAID);
  assert.equal(invoiceRes.data.discountCode, 'GIAM10');
  assert.equal(invoiceRes.data.totalAmountVnd, 189_540);

  const tableAfter = await tableService.getTableById(2);
  assert.equal(tableAfter.data.status, TableStatus.AVAILABLE);
  assert.equal(tableAfter.data.currentOrderId, null);
});

test('KDS workflow: accept ticket, advance items to COMPLETED auto-marks ticket ready, and reporting OUT_OF_STOCK blocks POS order', async () => {
  // 1. Bếp tiếp nhận phiếu chờ 502 (Bàn 03)
  const accepted = await orderService.acceptKitchenOrder(502);
  assert.equal(accepted.data.status, OrderStatus.COOKING);

  // 2. Chuyển lần lượt từng món: PENDING -> COOKING -> COMPLETED
  let latest = accepted.data;
  for (const item of accepted.data.items) {
    const cookingRes = await orderService.updateOrderItemStatus(
      502,
      item.id,
      OrderItemStatus.COOKING
    );
    assert.equal(cookingRes.data.status, OrderStatus.COOKING);

    const doneRes = await orderService.updateOrderItemStatus(
      502,
      item.id,
      OrderItemStatus.COMPLETED
    );
    latest = doneRes.data;
  }

  // Khi toàn bộ món đã COMPLETED -> tự động đánh dấu phiếu COMPLETED (Sẵn sàng phục vụ)
  assert.equal(latest.status, OrderStatus.COMPLETED);
  assert.ok(latest.items.every((item) => item.status === OrderItemStatus.COMPLETED));

  // 3. Bếp báo hết nguyên liệu món 201 (Gỏi cuốn tôm thịt) -> POS bị chặn gọi món đó
  const oosRes = await menuService.updateMenuItemStatus(
    201,
    MenuItemStatus.OUT_OF_STOCK
  );
  assert.equal(oosRes.data.status, MenuItemStatus.OUT_OF_STOCK);

  await assert.rejects(
    () =>
      orderService.createOrder({
        tableId: 2,
        staffId: 2,
        guestCount: 2,
        items: [{ menuItemId: 201, quantity: 1 }],
      }),
    /hết nguyên liệu/
  );

  // Khôi phục lại món 201 về AVAILABLE
  await menuService.updateMenuItemStatus(201, MenuItemStatus.AVAILABLE);
});
