import {
  ApiResponse,
  CheckoutInvoiceRequest,
  Invoice,
  InvoiceStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  TableStatus,
} from '../types';
import { calculateInvoiceTotals } from '../utils';
import { apiRequest, createApiResponse } from './apiConfig';
import * as menuService from './menuService';
import * as orderService from './orderService';
import * as tableService from './tableService';

type BackendPaymentMethod =
  | 'TIEN_MAT'
  | 'CHUYEN_KHOAN'
  | 'THE_NGAN_HANG'
  | 'VI_DIEN_TU';

interface BackendHoaDonRequestDTO {
  maHD: string;
  maDatBanList: string[];
  monAnSoLuongMap: Record<string, number>;
  maGiamGiaList: string[];
}

interface BackendHoaDonResponseDTO {
  maHD: string;
  tongTien: number;
  danhSachMaDatBan?: string[];
  danhSachMaGiamGia?: string[];
}

interface BackendThanhToanRequestDTO {
  maKH: string;
  maHD: string;
  phuongThuc: BackendPaymentMethod;
  maGiamGiaApDung: string[];
}

interface BackendThanhToanResponseDTO {
  maKH: string;
  tenKhachHang: string;
  maHD: string;
  tongTienThanhToan: number;
  tongTienGiamGia: number;
  phuongThuc: string;
  trangThai: string;
}

interface BackendPaymentDetailProjection {
  tenKhachHang: string;
  maHD: string;
  tongTien: number;
  giamGia: number;
  phuongThuc: string;
  trangThaiThanhToan: string;
}

export interface InvoiceUiMeta {
  maKH?: string;
  orderId?: number;
  orderCode?: string;
  tableName?: string;
  cashierId?: number;
  cashierName?: string;
  discountCode?: string | null;
  vatRate?: number;
  vatAmountVnd?: number;
  issuedAt?: string;
  paidAt?: string | null;
}

export const INVOICE_UI_META_KEY = 'bepviet_invoice_ui_meta_v1';

const idToMaHdMap = new Map<number, string>();
const maHdToIdMap = new Map<string, number>();
let cachedInvoices: Invoice[] = [];

export function readInvoiceUiMetaMap(): Record<string, InvoiceUiMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(INVOICE_UI_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, InvoiceUiMeta>) : {};
  } catch {
    return {};
  }
}

function saveInvoiceUiMeta(maHD: string, meta: InvoiceUiMeta): void {
  if (typeof window === 'undefined') return;
  const current = readInvoiceUiMetaMap();
  current[maHD] = { ...current[maHD], ...meta };
  window.localStorage.setItem(INVOICE_UI_META_KEY, JSON.stringify(current));
}

function getOrAssignInvoiceId(maHD: string): number {
  const existing = maHdToIdMap.get(maHD);
  if (existing !== undefined) return existing;

  const digits = maHD.replace(/\D/g, '');
  let candidate = digits ? Number.parseInt(digits.slice(-6), 10) : 0;

  if (!candidate || Number.isNaN(candidate) || idToMaHdMap.has(candidate)) {
    let hash = 9000;
    for (let i = 0; i < maHD.length; i += 1) {
      hash = (hash * 31 + maHD.charCodeAt(i)) % 900_000;
    }
    candidate = 9000 + Math.abs(hash);
    while (idToMaHdMap.has(candidate)) {
      candidate += 1;
    }
  }

  maHdToIdMap.set(maHD, candidate);
  idToMaHdMap.set(candidate, maHD);
  return candidate;
}

function normalizeText(raw?: string | null): string {
  return (raw || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

function mapFePaymentMethodToBe(method: PaymentMethod): BackendPaymentMethod {
  switch (method) {
    case PaymentMethod.BANK_TRANSFER:
      return 'CHUYEN_KHOAN';
    case PaymentMethod.CARD:
      return 'THE_NGAN_HANG';
    case PaymentMethod.E_WALLET:
      return 'VI_DIEN_TU';
    case PaymentMethod.CASH:
    default:
      return 'TIEN_MAT';
  }
}

function mapBePaymentMethodToFe(raw?: string | null): PaymentMethod {
  const n = normalizeText(raw);
  if (n.includes('chuyen') || n.includes('bank')) return PaymentMethod.BANK_TRANSFER;
  if (n.includes('the') || n.includes('card')) return PaymentMethod.CARD;
  if (n.includes('vi') || n.includes('wallet') || n.includes('momo') || n.includes('zalo')) {
    return PaymentMethod.E_WALLET;
  }
  return PaymentMethod.CASH;
}

function mapBeInvoiceStatusToFe(raw?: string | null): InvoiceStatus {
  const n = normalizeText(raw);
  if (n.includes('huy') || n.includes('cancel')) return InvoiceStatus.CANCELLED;
  if (n.includes('hoan') || n.includes('refund')) return InvoiceStatus.REFUNDED;
  if (n.includes('chua') || n.includes('unpaid')) return InvoiceStatus.UNPAID;
  return InvoiceStatus.PAID;
}

function extractMaKhFromOrder(orderId: number, orderCode: string): string | null {
  const helper = (
    orderService as { getMaKhByOrderId?: (id: number) => string | undefined }
  ).getMaKhByOrderId;

  if (typeof helper === 'function') {
    const fromMap = helper(orderId);
    if (fromMap) return fromMap;
  }

  const parts = orderCode.split('-');
  if (parts.length >= 3 && parts[2]) {
    return parts.slice(2).join('-');
  }

  const matched = orderCode.match(/KH[A-Za-z0-9]+/i);
  return matched ? matched[0].toUpperCase() : null;
}

function mapPaymentDetailToInvoice(row: BackendPaymentDetailProjection): Invoice {
  const id = getOrAssignInvoiceId(row.maHD);
  const meta = readInvoiceUiMetaMap()[row.maHD];

  const beTotal = Math.round(Number(row.tongTien) || 0);
  const discountAmount = Math.round(Number(row.giamGia) || 0);
  const subtotal = Math.max(0, beTotal + discountAmount);
  const vatRate = meta?.vatRate ?? 0;
  const vatAmount = meta?.vatAmountVnd ?? 0;
  const status = mapBeInvoiceStatusToFe(row.trangThaiThanhToan);
  const fallbackNow = new Date().toISOString();

  return {
    id,
    invoiceCode: row.maHD,
    orderId: meta?.orderId ?? 0,
    orderCode: meta?.orderCode ?? `OD-${row.maHD}`,
    tableName: meta?.tableName ?? `KH ${row.tenKhachHang}`,
    cashierId: meta?.cashierId ?? 0,
    cashierName: meta?.cashierName ?? 'Thu ngân',
    subtotalVnd: subtotal,
    discountCode: meta?.discountCode ?? null,
    discountAmountVnd: discountAmount,
    vatRate,
    vatAmountVnd: vatAmount,
    totalAmountVnd: beTotal + vatAmount,
    paymentMethod: mapBePaymentMethodToFe(row.phuongThuc),
    status,
    issuedAt: meta?.issuedAt ?? fallbackNow,
    paidAt: status === InvoiceStatus.PAID ? (meta?.paidAt ?? fallbackNow) : null,
  };
}

/**
 * GET /api/v1/billing/payments/details
 */
export async function getInvoices(): Promise<ApiResponse<Invoice[]>> {
  const res = await apiRequest<BackendPaymentDetailProjection[]>(
    '/billing/payments/details',
    { method: 'GET' }
  );

  const invoices = (res.data || [])
    .map(mapPaymentDetailToInvoice)
    .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));

  cachedInvoices = invoices;

  return {
    ...res,
    data: invoices,
  };
}

/**
 * Tạo hóa đơn (POST /billing/invoices) + Thanh toán (POST /billing/payments)
 * + Đóng đơn hàng & giải phóng bàn về Trống.
 */
export async function checkoutOrder(
  payload: CheckoutInvoiceRequest
): Promise<ApiResponse<Invoice>> {
  const [ordersRes, menuRes] = await Promise.all([
    orderService.getOrders(),
    menuService.getMenuItems(),
  ]);

  const order = ordersRes.data.find((o) => o.id === payload.orderId);
  if (!order) {
    throw new Error(`Không tìm thấy đơn hàng #${payload.orderId} để thanh toán.`);
  }

  const activeItems = order.items.filter(
    (item) => item.status !== OrderItemStatus.CANCELLED && item.quantity > 0
  );
  if (activeItems.length === 0) {
    throw new Error('Đơn hàng không có món hợp lệ nào để lập hóa đơn.');
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

  // Gom số lượng theo từng mã món (maMon) khớp với Map<String, Integer> của HoaDonRequestDTO
  const menuById = new Map(menuRes.data.map((m) => [m.id, m]));
  const monAnSoLuongMap: Record<string, number> = {};

  for (const item of activeItems) {
    const matchedMenu = menuById.get(item.menuItemId);
    const maMon = matchedMenu?.sku;
    if (!maMon) {
      throw new Error(`Không tìm thấy mã món cho "${item.menuItemName}".`);
    }
    monAnSoLuongMap[maMon] = (monAnSoLuongMap[maMon] ?? 0) + item.quantity;
  }

  const maKH = extractMaKhFromOrder(order.id, order.orderCode);
  if (!maKH) {
    throw new Error(
      `Không xác định được mã khách hàng cho đơn ${order.orderCode}.`
    );
  }

  const maHD = `HD${String(Date.now()).slice(-8)}`;
  const discountCodes = payload.discountCode?.trim()
    ? [payload.discountCode.trim().toUpperCase()]
    : [];

  // Bước 1: Lập hóa đơn xuống MySQL
  const invoiceBody: BackendHoaDonRequestDTO = {
    maHD,
    maDatBanList: [],
    monAnSoLuongMap,
    maGiamGiaList: discountCodes,
  };

  await apiRequest<BackendHoaDonResponseDTO>('/billing/invoices', {
    method: 'POST',
    body: invoiceBody,
  });

  // Bước 2: Ghi nhận thanh toán hóa đơn xuống bảng thanhtoan
  const paymentBody: BackendThanhToanRequestDTO = {
    maKH,
    maHD,
    phuongThuc: mapFePaymentMethodToBe(payload.paymentMethod),
    maGiamGiaApDung: [],
  };

  const paymentRes = await apiRequest<BackendThanhToanResponseDTO>(
    '/billing/payments',
    {
      method: 'POST',
      body: paymentBody,
    }
  );

  const now = new Date().toISOString();
  const beNetTotal = Math.round(
    Number(paymentRes.data?.tongTienThanhToan) ||
      Math.max(0, totals.subtotalVnd - totals.discountAmountVnd)
  );
  const beDiscount = Math.round(
    Number(paymentRes.data?.tongTienGiamGia) || totals.discountAmountVnd
  );

  saveInvoiceUiMeta(maHD, {
    maKH,
    orderId: order.id,
    orderCode: order.orderCode,
    tableName: order.tableName,
    cashierId: payload.cashierId,
    cashierName: payload.cashierName,
    discountCode: discountCodes[0] ?? null,
    vatRate,
    vatAmountVnd: totals.vatAmountVnd,
    issuedAt: now,
    paidAt: now,
  });

  // Bước 3: Đóng đơn hàng và giải phóng bàn về Trống
  try {
    await orderService.updateOrderStatus(order.id, OrderStatus.SERVED);
  } catch {
    // Bỏ qua nếu toàn bộ món trong đơn đã ở trạng thái DA_PHUC_VU
  }

  if (order.tableId > 0) {
    try {
      await tableService.updateTableDetails(order.tableId, {
        status: TableStatus.AVAILABLE,
        currentOrderId: null,
      });
    } catch {
      // Bỏ qua nếu bàn đã được giải phóng trước đó
    }
  }

  const createdInvoice: Invoice = {
    id: getOrAssignInvoiceId(maHD),
    invoiceCode: maHD,
    orderId: order.id,
    orderCode: order.orderCode,
    tableName: order.tableName,
    cashierId: payload.cashierId,
    cashierName: payload.cashierName,
    subtotalVnd: totals.subtotalVnd,
    discountCode: discountCodes[0] ?? null,
    discountAmountVnd: beDiscount,
    vatRate,
    vatAmountVnd: totals.vatAmountVnd,
    totalAmountVnd: beNetTotal + totals.vatAmountVnd,
    paymentMethod: payload.paymentMethod,
    status: InvoiceStatus.PAID,
    issuedAt: now,
    paidAt: now,
  };

  cachedInvoices = [createdInvoice, ...cachedInvoices];

  return createApiResponse(
    createdInvoice,
    `Thanh toán thành công hóa đơn ${createdInvoice.invoiceCode} và đã trả ${order.tableName} về Trống`
  );
}

/**
 * Thanh toán một hóa đơn chưa tất toán qua POST /billing/payments
 */
export async function payInvoice(
  id: number,
  paymentMethod: PaymentMethod
): Promise<ApiResponse<Invoice>> {
  const maHD = idToMaHdMap.get(id);
  const existing = cachedInvoices.find((inv) => inv.id === id);

  if (!maHD || !existing) {
    throw new Error(`Không tìm thấy hóa đơn mã #${id}.`);
  }

  const meta = readInvoiceUiMetaMap()[maHD];
  if (meta?.maKH) {
    await apiRequest<BackendThanhToanResponseDTO>('/billing/payments', {
      method: 'POST',
      body: {
        maKH: meta.maKH,
        maHD,
        phuongThuc: mapFePaymentMethodToBe(paymentMethod),
        maGiamGiaApDung: [],
      },
    });
  }

  const now = new Date().toISOString();
  saveInvoiceUiMeta(maHD, {
    ...meta,
    paidAt: now,
  });

  const updated: Invoice = {
    ...existing,
    paymentMethod,
    status: InvoiceStatus.PAID,
    paidAt: now,
  };

  cachedInvoices = cachedInvoices.map((inv) => (inv.id === id ? updated : inv));
  return createApiResponse(updated, 'Thanh toán hóa đơn thành công');
}