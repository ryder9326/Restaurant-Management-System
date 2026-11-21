import {
  ApiResponse,
  CreateOrderRequest,
  MenuItemStatus,
  Order,
  OrderItem,
  OrderItemStatus,
  OrderStatus,
  TableStatus,
  UpdateOrderItemChange,
} from '../types';
import { calculateOrderSubtotal, normalizePhoneDigits } from '../utils';
import { apiRequest, createApiResponse } from './apiConfig';
import * as menuService from './menuService';
import * as tableService from './tableService';

type BackendDishOrderStatus =
  | 'CHO_CHE_BIEN'
  | 'DANG_CHE_BIEN'
  | 'DA_PHUC_VU'
  | 'DA_HUY';

interface BackendDatMonResponseDTO {
  maKH: string;
  tenKhachHang: string;
  maBan?: string | null;
  maMon: string;
  tenMon: string;
  thoiGianGoi: string;
  soLuong: number;
  trangThai: BackendDishOrderStatus;
  ghiChu?: string | null;
  thanhTien: number;
}

interface BackendDatMonRequestDTO {
  maKH: string;
  maMon: string;
  soLuong: number;
  ghiChu?: string;
}

interface BackendKhachHangDTO {
  maKH: string;
  hoVaTen: string;
  sdt: string;
  ghiChu?: string;
}

interface BackendDatMonKey {
  maKH: string;
  maMon: string;
  thoiGianGoi: string;
  soLuong: number;
  ghiChu?: string;
  trangThai: BackendDishOrderStatus;
}

interface OrderUiMeta {
  maKH: string;
  tableMaBan?: string;
  staffId?: number;
  staffName?: string;
  guestCount?: number;
  note?: string;
  served?: boolean;
}

const ORDER_UI_META_KEY = 'bepviet_order_ui_meta_v1';

// Bộ nhớ ánh xạ giữa ID số trên FE và khóa phức hợp (maKH, maMon, thoiGianGoi) trên BE
const orderIdToGroupKey = new Map<number, string>();
const groupKeyToOrderId = new Map<string, number>();
const orderIdToMaKh = new Map<number, string>();
const itemIdToBeKey = new Map<number, BackendDatMonKey>();
const beKeyStrToItemId = new Map<string, number>();
let cachedOrders: Order[] = [];

export function getMaKhByOrderId(orderId: number): string | undefined {
  return orderIdToMaKh.get(orderId);
}

export function markOrderAsServed(orderId: number): void {
  const groupKey = orderIdToGroupKey.get(orderId);
  if (!groupKey) return;
  saveOrderUiMeta(groupKey, { served: true });
}

function readOrderUiMetaMap(): Record<string, OrderUiMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(ORDER_UI_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, OrderUiMeta>) : {};
  } catch {
    return {};
  }
}

function saveOrderUiMeta(groupKey: string, meta: Partial<OrderUiMeta>): void {
  if (typeof window === 'undefined') return;
  const current = readOrderUiMetaMap();
  current[groupKey] = {
    ...current[groupKey],
    ...meta,
    maKH: meta.maKH ?? current[groupKey]?.maKH ?? '',
  };
  window.localStorage.setItem(ORDER_UI_META_KEY, JSON.stringify(current));
}

function stableHashId(input: string, base: number): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) % 900_000;
  }
  return base + Math.abs(hash);
}

function getOrAssignOrderId(groupKey: string): number {
  const existing = groupKeyToOrderId.get(groupKey);
  if (existing !== undefined) return existing;

  let candidate = stableHashId(groupKey, 5000);
  while (orderIdToGroupKey.has(candidate)) {
    candidate += 1;
  }
  groupKeyToOrderId.set(groupKey, candidate);
  orderIdToGroupKey.set(candidate, groupKey);
  return candidate;
}

function getOrAssignItemId(beKeyStr: string): number {
  const existing = beKeyStrToItemId.get(beKeyStr);
  if (existing !== undefined) return existing;

  let candidate = stableHashId(beKeyStr, 50_000);
  while (itemIdToBeKey.has(candidate)) {
    candidate += 1;
  }
  beKeyStrToItemId.set(beKeyStr, candidate);
  return candidate;
}

function mapBeStatusToItemStatus(status: BackendDishOrderStatus): OrderItemStatus {
  switch (status) {
    case 'DANG_CHE_BIEN':
      return OrderItemStatus.COOKING;
    case 'DA_PHUC_VU':
      return OrderItemStatus.COMPLETED;
    case 'DA_HUY':
      return OrderItemStatus.CANCELLED;
    case 'CHO_CHE_BIEN':
    default:
      return OrderItemStatus.PENDING;
  }
}

function mapItemStatusToBeStatus(status: OrderItemStatus): BackendDishOrderStatus {
  switch (status) {
    case OrderItemStatus.COOKING:
      return 'DANG_CHE_BIEN';
    case OrderItemStatus.COMPLETED:
      return 'DA_PHUC_VU';
    case OrderItemStatus.CANCELLED:
      return 'DA_HUY';
    case OrderItemStatus.PENDING:
    default:
      return 'CHO_CHE_BIEN';
  }
}

function formatTableLabel(maBan?: string | null): string {
  if (!maBan) return 'Khách đã trả bàn';
  const digits = maBan.replace(/\D/g, '');
  return digits ? `Bàn ${digits.padStart(2, '0')}` : maBan;
}

function formatOrderCode(maKH: string, datePart: string): string {
  const compactDate = datePart.replace(/-/g, '');
  return `OD-${compactDate}-${maKH}`;
}

function deriveGroupOrderStatus(
  items: OrderItem[],
  isMarkedServed: boolean,
  hasActiveTable: boolean
): OrderStatus {
  const activeItems = items.filter((item) => item.status !== OrderItemStatus.CANCELLED);
  if (activeItems.length === 0) return OrderStatus.CANCELLED;
  if (isMarkedServed) return OrderStatus.SERVED;

  const allCompleted = activeItems.every(
    (item) => item.status === OrderItemStatus.COMPLETED
  );
  if (allCompleted) {
    return hasActiveTable ? OrderStatus.COMPLETED : OrderStatus.SERVED;
  }

  const hasCooking = activeItems.some(
    (item) => item.status === OrderItemStatus.COOKING
  );
  if (hasCooking) return OrderStatus.COOKING;

  return OrderStatus.PENDING;
}

function groupBackendOrdersToFe(rawList: BackendDatMonResponseDTO[]): Order[] {
  const metaMap = readOrderUiMetaMap();
  const grouped = new Map<string, BackendDatMonResponseDTO[]>();

  for (const row of rawList) {
    const datePart = (row.thoiGianGoi || '').slice(0, 10) || new Date().toISOString().slice(0, 10);
    const groupKey = `${row.maKH}_${datePart}`;
    const bucket = grouped.get(groupKey);
    if (bucket) {
      bucket.push(row);
    } else {
      grouped.set(groupKey, [row]);
    }
  }

  const orders: Order[] = [];

  for (const [groupKey, rows] of grouped.entries()) {
    const sortedRows = [...rows].sort((a, b) =>
      a.thoiGianGoi.localeCompare(b.thoiGianGoi)
    );
    const first = sortedRows[0];
    const last = sortedRows[sortedRows.length - 1];
    const datePart = (first.thoiGianGoi || '').slice(0, 10);

    const orderId = getOrAssignOrderId(groupKey);
    orderIdToMaKh.set(orderId, first.maKH);

    const meta = metaMap[groupKey];
    const resolvedMaBan =
      sortedRows.find((r) => r.maBan)?.maBan ||
      (!meta?.served ? meta?.tableMaBan : undefined) ||
      null;
    const hasActiveTable = Boolean(resolvedMaBan);

    const items: OrderItem[] = sortedRows.map((row) => {
      const beKeyStr = `${row.maKH}|${row.maMon}|${row.thoiGianGoi}`;
      const itemId = getOrAssignItemId(beKeyStr);
      itemIdToBeKey.set(itemId, {
        maKH: row.maKH,
        maMon: row.maMon,
        thoiGianGoi: row.thoiGianGoi,
        soLuong: row.soLuong,
        ghiChu: row.ghiChu ?? undefined,
        trangThai: row.trangThai,
      });

      const qty = Math.max(1, Number(row.soLuong) || 1);
      const lineTotal = Math.round(Number(row.thanhTien) || 0);
      const unitPrice = Math.round(lineTotal / qty);
      const itemStatus = mapBeStatusToItemStatus(row.trangThai);

      return {
        id: itemId,
        orderId,
        menuItemId: menuService.getMenuItemIdByMaMon(row.maMon),
        menuItemName: row.tenMon,
        quantity: qty,
        unitPriceVnd: unitPrice,
        lineTotalVnd: itemStatus === OrderItemStatus.CANCELLED ? 0 : lineTotal,
        note: row.ghiChu || undefined,
        status: itemStatus,
      };
    });

    const status = deriveGroupOrderStatus(
      items,
      Boolean(meta?.served),
      hasActiveTable
    );

    const tableId = resolvedMaBan
      ? tableService.getTableIdByMaBan(resolvedMaBan)
      : 0;

    orders.push({
      id: orderId,
      orderCode: formatOrderCode(first.maKH, datePart),
      tableId,
      tableName: resolvedMaBan
        ? formatTableLabel(resolvedMaBan)
        : `KH ${first.tenKhachHang}`,
      staffId: meta?.staffId ?? 0,
      staffName: meta?.staffName || first.tenKhachHang || 'Nhân viên phục vụ',
      guestCount: meta?.guestCount ?? 2,
      status,
      items,
      subtotalVnd: calculateOrderSubtotal(items),
      note: meta?.note,
      createdAt: first.thoiGianGoi,
      updatedAt: last.thoiGianGoi,
    });
  }

  orders.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  cachedOrders = orders;
  return orders;
}

async function patchSingleDishStatus(
  key: BackendDatMonKey,
  nextBeStatus: BackendDishOrderStatus
): Promise<void> {
  const query = new URLSearchParams({
    maKH: key.maKH,
    maMon: key.maMon,
    thoiGianGoi: key.thoiGianGoi,
    status: nextBeStatus,
  });

  await apiRequest<BackendDatMonResponseDTO>(
    `/menu-orders/orders/status?${query.toString()}`,
    { method: 'PATCH' }
  );
}

/**
 * Tìm hoặc tạo khách hàng gắn với bàn trước khi gọi món (vì bảng datmon cần MaKH).
 */
async function resolveCustomerForTable(
  tableId: number,
  tableCode: string,
  tableName: string,
  reservedCustomerName?: string | null,
  reservedCustomerPhone?: string | null
): Promise<string> {
  // 1. Nếu bàn đang có đơn chưa thanh toán, tái sử dụng MaKH của đơn đó
  const activeOrder = cachedOrders.find(
    (o) =>
      o.tableId === tableId &&
      o.status !== OrderStatus.SERVED &&
      o.status !== OrderStatus.CANCELLED
  );
  if (activeOrder) {
    const existingMaKh = orderIdToMaKh.get(activeOrder.id);
    if (existingMaKh) return existingMaKh;
  }

  // 2. Nếu bàn đang đặt trước có SĐT, tìm lại đúng khách đã đặt bàn
  let maKH: string | null = null;
  if (reservedCustomerPhone) {
    try {
      const cleanPhone = normalizePhoneDigits(reservedCustomerPhone);
      const found = await apiRequest<BackendKhachHangDTO>(
        `/reservations/customers/by-phone?sdt=${encodeURIComponent(cleanPhone)}`,
        { method: 'GET' }
      );
      if (found.data?.maKH) {
        maKH = found.data.maKH;
      }
    } catch {
      // Không tìm thấy -> tạo khách vãng lai bên dưới
    }
  }

  // 3. Nếu chưa có khách, tự đăng ký khách vãng lai vào bảng khachhang
  if (!maKH) {
    const suffix = String(Date.now()).slice(-7);
    const randomDigit = Math.floor(Math.random() * 10);
    const walkInPhone = `09${suffix}${randomDigit}`;
    const newMaKh = `KH${suffix}`;

    const created = await apiRequest<BackendKhachHangDTO>(
      '/reservations/customers',
      {
        method: 'POST',
        body: {
          maKH: newMaKh,
          hoVaTen: reservedCustomerName?.trim() || `Khách ${tableName}`,
          sdt: walkInPhone,
          ghiChu: `Khách dùng bữa tại ${tableCode}`,
        },
      }
    );
    maKH = created.data.maKH;
  }

  // 4. Ghi nhận khách ngồi vào bàn (bảng ngoi + chuyển bàn sang DANG_PHUC_VU)
  try {
    const seatQuery = new URLSearchParams({ maKH, maBan: tableCode });
    await apiRequest<void>(`/reservations/seat?${seatQuery.toString()}`, {
      method: 'POST',
    });
  } catch {
    // Trường hợp bàn đã ở trạng thái DANG_PHUC_VU sẵn thì bỏ qua bước seat
  }

  return maKH;
}

/**
 * GET /api/v1/menu-orders/orders
 */
export async function getOrders(
  status?: OrderStatus
): Promise<ApiResponse<Order[]>> {
  const res = await apiRequest<BackendDatMonResponseDTO[]>(
    '/menu-orders/orders',
    { method: 'GET' }
  );

  const allOrders = groupBackendOrdersToFe(res.data || []);
  const filtered = status
    ? allOrders.filter((order) => order.status === status)
    : allOrders;

  return {
    ...res,
    data: filtered,
  };
}

/**
 * Lấy danh sách đơn đang hoạt động cho màn hình Điều phối bếp (KDS).
 */
export async function getKitchenOrders(): Promise<ApiResponse<Order[]>> {
  const res = await getOrders();
  const kitchenQueue = res.data.filter(
    (order) =>
      order.status === OrderStatus.PENDING ||
      order.status === OrderStatus.COOKING ||
      order.status === OrderStatus.COMPLETED
  );

  return {
    ...res,
    data: kitchenQueue,
  };
}

/**
 * POST /api/v1/menu-orders/orders
 */
export async function createOrder(
  payload: CreateOrderRequest
): Promise<ApiResponse<Order>> {
  if (!payload.items.length) {
    throw new Error('Phiếu gọi món cần tối thiểu 1 món ăn.');
  }

  if (cachedOrders.length === 0) {
    try {
      await getOrders();
    } catch {
      // Tiếp tục nếu chưa tải được danh sách cũ
    }
  }

  const [tableRes, menuRes] = await Promise.all([
    tableService.getTableById(payload.tableId),
    menuService.getMenuItems(),
  ]);

  const table = tableRes.data;
  const menuList = menuRes.data;

  // Kiểm tra trạng thái món ăn trước khi gửi xuống Backend
  const preparedItems = payload.items.map((reqItem) => {
    const found = menuList.find((m) => m.id === reqItem.menuItemId);
    if (!found) {
      throw new Error(`Món ăn mã #${reqItem.menuItemId} không tồn tại.`);
    }
    if (found.status !== MenuItemStatus.AVAILABLE) {
      throw new Error(`Món "${found.name}" hiện đang tạm hết hoặc ngừng bán.`);
    }
    if (reqItem.quantity <= 0) {
      throw new Error(`Số lượng của món "${found.name}" phải lớn hơn 0.`);
    }
    return {
      maMon: found.sku,
      quantity: Math.round(reqItem.quantity),
      note: reqItem.note?.trim() || payload.note?.trim() || undefined,
    };
  });

  const maKH = await resolveCustomerForTable(
    table.id,
    table.tableCode,
    table.tableName,
    table.reservedCustomerName,
    table.reservedCustomerPhone
  );

  // Gọi tuần tự từng món để Backend khấu trừ kho an toàn & không trùng giây ThoiGianGoi
  let lastCreatedDate = new Date().toISOString().slice(0, 10);
  for (const item of preparedItems) {
    const body: BackendDatMonRequestDTO = {
      maKH,
      maMon: item.maMon,
      soLuong: item.quantity,
      ghiChu: item.note,
    };
    const placed = await apiRequest<BackendDatMonResponseDTO>(
      '/menu-orders/orders',
      {
        method: 'POST',
        body,
      }
    );
    if (placed.data?.thoiGianGoi) {
      lastCreatedDate = placed.data.thoiGianGoi.slice(0, 10);
    }
  }

  const groupKey = `${maKH}_${lastCreatedDate}`;
  saveOrderUiMeta(groupKey, {
    maKH,
    tableMaBan: table.tableCode,
    staffId: payload.staffId,
    staffName: payload.staffName,
    guestCount: payload.guestCount,
    note: payload.note?.trim() || undefined,
    served: false,
  });

  const refreshed = await getOrders();
  const targetOrderId = getOrAssignOrderId(groupKey);
  const updatedOrder = refreshed.data.find((o) => o.id === targetOrderId);

  if (!updatedOrder) {
    throw new Error('Đã gửi gọi món nhưng không đồng bộ lại được phiếu.');
  }

  try {
    await tableService.updateTableDetails(table.id, {
      status: TableStatus.OCCUPIED,
      currentOrderId: updatedOrder.id,
    });
  } catch {
    // Bàn đã được chuyển sang DANG_PHUC_VU ở bước /reservations/seat
  }

  return createApiResponse(
    updatedOrder,
    `Đã gửi phiếu ${updatedOrder.orderCode} xuống bếp thành công`
  );
}

/**
 * Cập nhật số lượng hoặc hủy món chưa nấu (PENDING) trước khi thanh toán.
 */
export async function updateOrderItems(
  orderId: number,
  changes: UpdateOrderItemChange[]
): Promise<ApiResponse<Order>> {
  const current = cachedOrders.find((o) => o.id === orderId);
  if (!current) {
    throw new Error(`Không tìm thấy đơn hàng mã #${orderId}.`);
  }

  for (const change of changes) {
    const item = current.items.find((i) => i.id === change.orderItemId);
    const beKey = itemIdToBeKey.get(change.orderItemId);
    if (!item || !beKey || item.status !== OrderItemStatus.PENDING) {
      continue;
    }

    const nextQty = Math.max(0, Math.round(change.quantity));
    const isCancelling =
      nextQty === 0 || change.status === OrderItemStatus.CANCELLED;

    if (isCancelling) {
      await patchSingleDishStatus(beKey, 'DA_HUY');
    } else if (nextQty !== item.quantity) {
      // Backend không có PUT số lượng DatMon -> Hủy dòng cũ (hoàn kho) rồi đặt lại đúng số lượng mới
      await patchSingleDishStatus(beKey, 'DA_HUY');
      await apiRequest<BackendDatMonResponseDTO>('/menu-orders/orders', {
        method: 'POST',
        body: {
          maKH: beKey.maKH,
          maMon: beKey.maMon,
          soLuong: nextQty,
          ghiChu: beKey.ghiChu,
        },
      });
    }
  }

  const refreshed = await getOrders();
  const updated = refreshed.data.find((o) => o.id === orderId);
  if (!updated) {
    throw new Error(`Không tìm thấy đơn hàng mã #${orderId} sau khi cập nhật.`);
  }

  return createApiResponse(updated, 'Đã cập nhật chi tiết đơn hàng thành công');
}

/**
 * Bếp tiếp nhận phiếu gọi món: chuyển toàn bộ món đang chờ (CHO_CHE_BIEN) sang đang chế biến (DANG_CHE_BIEN).
 */
export async function acceptKitchenOrder(
  id: number
): Promise<ApiResponse<Order>> {
  const current = cachedOrders.find((o) => o.id === id);
  if (!current) {
    throw new Error(`Không tìm thấy phiếu bếp mã #${id}.`);
  }

  for (const item of current.items) {
    if (item.status === OrderItemStatus.PENDING) {
      const beKey = itemIdToBeKey.get(item.id);
      if (beKey) {
        await patchSingleDishStatus(beKey, 'DANG_CHE_BIEN');
      }
    }
  }

  const refreshed = await getOrders();
  const updated = refreshed.data.find((o) => o.id === id) ?? current;

  return createApiResponse(
    updated,
    `Bếp đã tiếp nhận phiếu ${updated.orderCode} (${updated.tableName})`
  );
}

/**
 * Cập nhật trạng thái từng món ăn trên màn hình Bếp (KDS).
 */
export async function updateOrderItemStatus(
  orderId: number,
  orderItemId: number,
  nextStatus: OrderItemStatus
): Promise<ApiResponse<Order>> {
  const beKey = itemIdToBeKey.get(orderItemId);
  if (!beKey) {
    throw new Error(`Không tìm thấy khóa món #${orderItemId} để cập nhật.`);
  }

  const targetBeStatus = mapItemStatusToBeStatus(nextStatus);
  await patchSingleDishStatus(beKey, targetBeStatus);

  const refreshed = await getOrders();
  const updated = refreshed.data.find((o) => o.id === orderId);
  if (!updated) {
    throw new Error(`Không tìm thấy phiếu bếp mã #${orderId}.`);
  }

  const message =
    updated.status === OrderStatus.COMPLETED
      ? `Phiếu ${updated.orderCode} (${updated.tableName}) đã hoàn thành tất cả món và sẵn sàng phục vụ!`
      : 'Đã cập nhật trạng thái món ăn thành công';

  return createApiResponse(updated, message);
}

/**
 * Cập nhật trạng thái toàn bộ đơn hàng (Hoàn thành bếp / Đã thanh toán / Hủy).
 */
export async function updateOrderStatus(
  id: number,
  status: OrderStatus
): Promise<ApiResponse<Order>> {
  const current = cachedOrders.find((o) => o.id === id);
  if (!current) {
    throw new Error(`Không tìm thấy đơn hàng mã #${id}.`);
  }

  if (status === OrderStatus.COMPLETED || status === OrderStatus.SERVED) {
    for (const item of current.items) {
      if (
        item.status === OrderItemStatus.PENDING ||
        item.status === OrderItemStatus.COOKING
      ) {
        const beKey = itemIdToBeKey.get(item.id);
        if (beKey) {
          await patchSingleDishStatus(beKey, 'DA_PHUC_VU');
        }
      }
    }
    if (status === OrderStatus.SERVED) {
      markOrderAsServed(id);
    }
  } else if (status === OrderStatus.CANCELLED) {
    for (const item of current.items) {
      if (item.status === OrderItemStatus.PENDING) {
        const beKey = itemIdToBeKey.get(item.id);
        if (beKey) {
          await patchSingleDishStatus(beKey, 'DA_HUY');
        }
      }
    }
  }

  const refreshed = await getOrders();
  const updated = refreshed.data.find((o) => o.id === id) ?? {
    ...current,
    status,
  };

  return createApiResponse(
    updated,
    status === OrderStatus.COMPLETED
      ? `Phiếu ${updated.orderCode} (${updated.tableName}) đã sẵn sàng phục vụ!`
      : 'Đã cập nhật trạng thái đơn hàng'
  );
}