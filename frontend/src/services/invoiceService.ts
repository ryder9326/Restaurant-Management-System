import { MOCK_INVOICES } from '../mocks';
import {
  ApiResponse,
  CheckoutInvoiceRequest,
  Invoice,
  InvoiceStatus,
  OrderStatus,
  PaymentMethod,
  TableStatus,
} from '../types';
import { calculateInvoiceTotals } from '../utils';
import { cloneData, createApiResponse, simulateLatency } from './apiConfig';
import * as orderService from './orderService';
import * as tableService from './tableService';

let invoiceStore: Invoice[] = cloneData(MOCK_INVOICES);

/**
 * GET /api/invoices
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<Invoice[]>>('/invoices');
 * return res.data;
 */
export async function getInvoices(): Promise<ApiResponse<Invoice[]>> {
  await simulateLatency();
  return createApiResponse(cloneData(invoiceStore));
}

/**
 * POST /api/invoices/checkout
 * Tạo hóa đơn thanh toán, đánh dấu đơn đã hoàn tất (SERVED) và tự động trả bàn về trạng thái Trống (AVAILABLE).
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.post<ApiResponse<Invoice>>('/invoices/checkout', payload);
 * return res.data;
 */
export async function checkoutOrder(
  payload: CheckoutInvoiceRequest
): Promise<ApiResponse<Invoice>> {
  await simulateLatency();

  const ordersRes = await orderService.getOrders();
  const order = ordersRes.data.find((o) => o.id === payload.orderId);
  if (!order) {
    throw new Error(`Không tìm thấy đơn hàng #${payload.orderId} để thanh toán.`);
  }

  const vatRate = payload.vatRate ?? 0.08;
  const totals = calculateInvoiceTotals(
    order.subtotalVnd,
    payload.discountAmountVnd,
    vatRate
  );

  if (
    payload.paymentMethod === PaymentMethod.CASH &&
    payload.cashReceivedVnd !== undefined &&
    payload.cashReceivedVnd < totals.totalAmountVnd
  ) {
    throw new Error('Số tiền khách đưa chưa đủ để thanh toán hóa đơn.');
  }

  const nextId = Math.max(900, ...invoiceStore.map((inv) => inv.id)) + 1;
  const now = new Date().toISOString();

  const createdInvoice: Invoice = {
    id: nextId,
    invoiceCode: `HD-20261120-${String(nextId - 900).padStart(3, '0')}`,
    orderId: order.id,
    orderCode: order.orderCode,
    tableName: order.tableName,
    cashierId: payload.cashierId,
    cashierName: payload.cashierName,
    subtotalVnd: totals.subtotalVnd,
    discountCode: payload.discountCode ?? null,
    discountAmountVnd: totals.discountAmountVnd,
    vatRate,
    vatAmountVnd: totals.vatAmountVnd,
    totalAmountVnd: totals.totalAmountVnd,
    paymentMethod: payload.paymentMethod,
    status: InvoiceStatus.PAID,
    issuedAt: now,
    paidAt: now,
  };

  invoiceStore = [createdInvoice, ...invoiceStore];

  // Đóng đơn hàng và tự động trả bàn về Trống (AVAILABLE)
  await orderService.updateOrderStatus(order.id, OrderStatus.SERVED);
  await tableService.updateTableDetails(order.tableId, {
    status: TableStatus.AVAILABLE,
    currentOrderId: null,
  });

  return createApiResponse(
    cloneData(createdInvoice),
    `Thanh toán thành công hóa đơn ${createdInvoice.invoiceCode} và đã trả ${order.tableName} về Trống`
  );
}

/**
 * PATCH /api/invoices/{id}/pay
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.patch<ApiResponse<Invoice>>(`/invoices/${id}/pay`, { paymentMethod });
 * return res.data;
 */
export async function payInvoice(
  id: number,
  paymentMethod: PaymentMethod
): Promise<ApiResponse<Invoice>> {
  await simulateLatency();
  const index = invoiceStore.findIndex((inv) => inv.id === id);
  if (index === -1) {
    throw new Error(`Không tìm thấy hóa đơn mã #${id}.`);
  }
  invoiceStore[index] = {
    ...invoiceStore[index],
    paymentMethod,
    status: InvoiceStatus.PAID,
    paidAt: new Date().toISOString(),
  };
  return createApiResponse(
    cloneData(invoiceStore[index]),
    'Thanh toán hóa đơn thành công'
  );
}
