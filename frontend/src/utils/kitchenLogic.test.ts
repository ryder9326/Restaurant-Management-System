import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_ORDERS } from '../mocks';
import { OrderItemStatus, OrderStatus } from '../types';
import {
  deriveOrderStatusFromItems,
  filterKitchenTicketsByTab,
  getNextOrderItemStatus,
  getOrderCookingProgress,
  sortKitchenTicketsFifo,
} from './kitchenLogic';

test('sortKitchenTicketsFifo orders oldest tickets first (chronological ascending)', () => {
  const sorted = sortKitchenTicketsFifo(MOCK_ORDERS);
  assert.equal(sorted[0].orderCode, 'OD-20261120-003'); // 10:50
  assert.equal(sorted[1].orderCode, 'OD-20261120-001'); // 11:25
  assert.equal(sorted[2].orderCode, 'OD-20261120-002'); // 11:42
});

test('filterKitchenTicketsByTab separates PENDING, COOKING, and COMPLETED tabs', () => {
  const pending = filterKitchenTicketsByTab(MOCK_ORDERS, 'PENDING');
  const cooking = filterKitchenTicketsByTab(MOCK_ORDERS, 'COOKING');
  const completed = filterKitchenTicketsByTab(MOCK_ORDERS, 'COMPLETED');

  assert.equal(pending.length, 1);
  assert.equal(pending[0].orderCode, 'OD-20261120-002');

  assert.equal(cooking.length, 1);
  assert.equal(cooking[0].orderCode, 'OD-20261120-001');

  assert.equal(completed.length, 1);
  assert.equal(completed[0].orderCode, 'OD-20261120-003');
});

test('getNextOrderItemStatus progresses PENDING -> COOKING -> COMPLETED', () => {
  assert.equal(
    getNextOrderItemStatus(OrderItemStatus.PENDING),
    OrderItemStatus.COOKING
  );
  assert.equal(
    getNextOrderItemStatus(OrderItemStatus.COOKING),
    OrderItemStatus.COMPLETED
  );
  assert.equal(
    getNextOrderItemStatus(OrderItemStatus.COMPLETED),
    OrderItemStatus.COMPLETED
  );
});

test('deriveOrderStatusFromItems auto-completes ticket when all active items are COMPLETED', () => {
  // All active items completed (cancelled item ignored)
  const completedStatus = deriveOrderStatusFromItems(
    [
      { status: OrderItemStatus.COMPLETED },
      { status: OrderItemStatus.COMPLETED },
      { status: OrderItemStatus.CANCELLED },
    ],
    OrderStatus.COOKING
  );
  assert.equal(completedStatus, OrderStatus.COMPLETED);

  // Starting one item promotes PENDING ticket to COOKING
  const cookingStatus = deriveOrderStatusFromItems(
    [
      { status: OrderItemStatus.COOKING },
      { status: OrderItemStatus.PENDING },
    ],
    OrderStatus.PENDING
  );
  assert.equal(cookingStatus, OrderStatus.COOKING);

  // Staying PENDING when all items still PENDING
  const pendingStatus = deriveOrderStatusFromItems(
    [
      { status: OrderItemStatus.PENDING },
      { status: OrderItemStatus.PENDING },
    ],
    OrderStatus.PENDING
  );
  assert.equal(pendingStatus, OrderStatus.PENDING);
});

test('getOrderCookingProgress computes completed ratio ignoring CANCELLED items', () => {
  const progress = getOrderCookingProgress([
    { status: OrderItemStatus.COMPLETED },
    { status: OrderItemStatus.COOKING },
    { status: OrderItemStatus.PENDING },
    { status: OrderItemStatus.CANCELLED },
  ]);
  assert.deepEqual(progress, { completed: 1, total: 3, percentage: 33 });
});
