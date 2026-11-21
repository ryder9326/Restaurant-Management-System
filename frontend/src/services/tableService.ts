import {
  ApiResponse,
  DiningTable,
  TableArea,
  TableStatus,
  UpdateTableDetailsRequest,
} from '../types';
import { normalizePhoneDigits } from '../utils';
import { apiRequest } from './apiConfig';

type BackendTableStatus = 'TRONG' | 'DA_DAT_TRUOC' | 'DANG_PHUC_VU' | 'BAO_TRI';

interface BackendBanAnDTO {
  maBan: string;
  khuVuc: string;
  sucChua: number;
  trangThaiSuDung: BackendTableStatus;
}

interface BackendKhachHangDTO {
  maKH: string;
  hoVaTen: string;
  sdt: string;
  ghiChu?: string;
}

interface BackendDatBanRequestDTO {
  maDatBan: string;
  maKH: string;
  maBan: string;
  thoiGianDat: string;
  soLuongKhach: number;
  ghiChu?: string;
}

interface TableUiMeta {
  currentOrderId?: number | null;
  reservedCustomerName?: string | null;
  reservedCustomerPhone?: string | null;
  reservedGuestCount?: number | null;
  reservedAt?: string | null;
}

const TABLE_UI_META_KEY = 'bepviet_table_ui_meta_v1';

// Bộ ánh xạ 2 chiều giữa numeric id của FE và maBan ("BAN01") của BE
const idToMaBanMap = new Map<number, string>();
const maBanToIdMap = new Map<string, number>();
const tableCacheByMaBan = new Map<string, BackendBanAnDTO>();

export function getMaBanByTableId(id: number): string | undefined {
  return idToMaBanMap.get(id);
}

export function getTableIdByMaBan(maBan: string): number {
  return getOrAssignTableNumericId(maBan);
}

function readTableUiMetaMap(): Record<string, TableUiMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(TABLE_UI_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, TableUiMeta>) : {};
  } catch {
    return {};
  }
}

function saveTableUiMeta(maBan: string, meta: TableUiMeta): void {
  if (typeof window === 'undefined') return;
  const current = readTableUiMetaMap();
  current[maBan] = { ...current[maBan], ...meta };
  window.localStorage.setItem(TABLE_UI_META_KEY, JSON.stringify(current));
}

function clearTableUiMeta(maBan: string): void {
  if (typeof window === 'undefined') return;
  const current = readTableUiMetaMap();
  delete current[maBan];
  window.localStorage.setItem(TABLE_UI_META_KEY, JSON.stringify(current));
}

function getOrAssignTableNumericId(maBan: string): number {
  const existing = maBanToIdMap.get(maBan);
  if (existing !== undefined) return existing;

  const digits = maBan.replace(/\D/g, '');
  let candidate = digits ? Number.parseInt(digits, 10) : 0;

  if (!candidate || Number.isNaN(candidate) || idToMaBanMap.has(candidate)) {
    let hash = 500;
    for (let i = 0; i < maBan.length; i += 1) {
      hash = (hash * 31 + maBan.charCodeAt(i)) % 100_000;
    }
    candidate = hash || 500;
    while (idToMaBanMap.has(candidate)) {
      candidate += 1;
    }
  }

  maBanToIdMap.set(maBan, candidate);
  idToMaBanMap.set(candidate, maBan);
  return candidate;
}

function mapBeStatusToFe(status?: BackendTableStatus): TableStatus {
  switch (status) {
    case 'DANG_PHUC_VU':
      return TableStatus.OCCUPIED;
    case 'DA_DAT_TRUOC':
      return TableStatus.RESERVED;
    case 'BAO_TRI':
      return TableStatus.CLEANING;
    case 'TRONG':
    default:
      return TableStatus.AVAILABLE;
  }
}

function mapFeStatusToBe(status: TableStatus): BackendTableStatus {
  switch (status) {
    case TableStatus.OCCUPIED:
      return 'DANG_PHUC_VU';
    case TableStatus.RESERVED:
      return 'DA_DAT_TRUOC';
    case TableStatus.CLEANING:
      return 'BAO_TRI';
    case TableStatus.AVAILABLE:
    default:
      return 'TRONG';
  }
}

function mapBeAreaToFe(khuVuc?: string): TableArea {
  const normalized = (khuVuc || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

  if (normalized.includes('vip')) return TableArea.VIP_ROOM;
  if (
    normalized.includes('san') ||
    normalized.includes('vuon') ||
    normalized.includes('ngoai') ||
    normalized.includes('outdoor')
  ) {
    return TableArea.OUTDOOR;
  }
  if (normalized.includes('2')) return TableArea.FLOOR_2;
  return TableArea.FLOOR_1;
}

function formatTableName(maBan: string): string {
  const digits = maBan.replace(/\D/g, '');
  return digits ? `Bàn ${digits.padStart(2, '0')}` : maBan;
}

function formatLocalDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function normalizeBookingDateTime(raw?: string | null): string {
  const now = new Date();
  let target: Date | null = null;

  if (raw && raw.trim()) {
    const trimmed = raw.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(':').map(Number);
      target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0);
    } else {
      const parsed = new Date(trimmed.replace(' ', 'T'));
      if (!Number.isNaN(parsed.getTime())) {
        target = parsed;
      }
    }
  }

  if (!target || target.getTime() <= now.getTime()) {
    target = new Date(now.getTime() + 15 * 60 * 1000);
  }

  return formatLocalDateTime(target);
}

function mapBackendToDiningTable(dto: BackendBanAnDTO): DiningTable {
  tableCacheByMaBan.set(dto.maBan, dto);
  const id = getOrAssignTableNumericId(dto.maBan);
  const status = mapBeStatusToFe(dto.trangThaiSuDung);
  const meta = readTableUiMetaMap()[dto.maBan];

  return {
    id,
    tableCode: dto.maBan,
    tableName: formatTableName(dto.maBan),
    area: mapBeAreaToFe(dto.khuVuc),
    capacity: dto.sucChua,
    status,
    currentOrderId: status === TableStatus.OCCUPIED ? (meta?.currentOrderId ?? null) : null,
    reservedCustomerName:
      status === TableStatus.RESERVED ? (meta?.reservedCustomerName ?? null) : null,
    reservedCustomerPhone:
      status === TableStatus.RESERVED ? (meta?.reservedCustomerPhone ?? null) : null,
    reservedGuestCount:
      status === TableStatus.RESERVED ? (meta?.reservedGuestCount ?? null) : null,
    reservedAt: status === TableStatus.RESERVED ? (meta?.reservedAt ?? null) : null,
  };
}

async function findOrRegisterCustomer(name: string, phone: string): Promise<string> {
  const cleanPhone = normalizePhoneDigits(phone);

  try {
    const found = await apiRequest<BackendKhachHangDTO>(
      `/reservations/customers/by-phone?sdt=${encodeURIComponent(cleanPhone)}`,
      { method: 'GET' }
    );
    if (found.data?.maKH) {
      return found.data.maKH;
    }
  } catch {
    // Khách chưa tồn tại -> tạo mới bên dưới
  }

  const suffix = String(Date.now()).slice(-6);
  const newCustomer: BackendKhachHangDTO = {
    maKH: `KH${suffix}`,
    hoVaTen: name.trim(),
    sdt: cleanPhone,
    ghiChu: 'Đăng ký khi đặt bàn trên POS',
  };

  const created = await apiRequest<BackendKhachHangDTO>('/reservations/customers', {
    method: 'POST',
    body: newCustomer,
  });

  return created.data.maKH;
}

/**
 * GET /api/v1/reservations/tables
 */
export async function getTables(): Promise<ApiResponse<DiningTable[]>> {
  const res = await apiRequest<BackendBanAnDTO[]>('/reservations/tables', {
    method: 'GET',
  });
  return {
    ...res,
    data: (res.data || []).map(mapBackendToDiningTable),
  };
}

export async function getTableById(id: number): Promise<ApiResponse<DiningTable>> {
  const maBan = idToMaBanMap.get(id);
  const cached = maBan ? tableCacheByMaBan.get(maBan) : undefined;
  if (cached) {
    return {
      success: true,
      message: 'Thành công',
      data: mapBackendToDiningTable(cached),
      timestamp: new Date().toISOString(),
    };
  }

  const all = await getTables();
  const found = all.data.find((t) => t.id === id);
  if (!found) {
    throw new Error(`Không tìm thấy bàn ăn mã #${id}.`);
  }
  return {
    ...all,
    data: found,
  };
}

export async function updateTableStatus(
  id: number,
  status: TableStatus
): Promise<ApiResponse<DiningTable>> {
  return updateTableDetails(id, { status });
}

export async function updateTableDetails(
  id: number,
  payload: UpdateTableDetailsRequest
): Promise<ApiResponse<DiningTable>> {
  const maBan = idToMaBanMap.get(id);
  if (!maBan) {
    throw new Error(`Không tìm thấy mã bàn tương ứng với #${id}.`);
  }

  const previousBe = tableCacheByMaBan.get(maBan);
  const previousStatus = mapBeStatusToFe(previousBe?.trangThaiSuDung);
  const targetBeStatus = mapFeStatusToBe(payload.status);

  // 1. Đặt bàn mới kèm tên & SĐT -> gọi POST /reservations/bookings
  if (
    payload.status === TableStatus.RESERVED &&
    previousStatus !== TableStatus.RESERVED &&
    payload.reservedCustomerName?.trim() &&
    payload.reservedCustomerPhone?.trim()
  ) {
    const maKH = await findOrRegisterCustomer(
      payload.reservedCustomerName,
      payload.reservedCustomerPhone
    );

    const bookingBody: BackendDatBanRequestDTO = {
      maDatBan: `DB${String(Date.now()).slice(-6)}`,
      maKH,
      maBan,
      thoiGianDat: normalizeBookingDateTime(payload.reservedAt),
      soLuongKhach: Math.max(1, payload.reservedGuestCount ?? previousBe?.sucChua ?? 2),
      ghiChu: `Khách đặt: ${payload.reservedCustomerName.trim()}`,
    };

    const bookingRes = await apiRequest<BackendDatBanRequestDTO>('/reservations/bookings', {
      method: 'POST',
      body: bookingBody,
    });

    const updatedBe: BackendBanAnDTO = {
      maBan,
      khuVuc: previousBe?.khuVuc ?? 'Tầng 1',
      sucChua: previousBe?.sucChua ?? 4,
      trangThaiSuDung: 'DA_DAT_TRUOC',
    };

    saveTableUiMeta(maBan, {
      currentOrderId: null,
      reservedCustomerName: payload.reservedCustomerName.trim(),
      reservedCustomerPhone: normalizePhoneDigits(payload.reservedCustomerPhone),
      reservedGuestCount: bookingBody.soLuongKhach,
      reservedAt: payload.reservedAt || bookingBody.thoiGianDat,
    });

    return {
      ...bookingRes,
      data: mapBackendToDiningTable(updatedBe),
      message: bookingRes.message || 'Đặt bàn thành công',
    };
  }

  // 2. Giải phóng bàn đang có khách -> ưu tiên gọi POST /reservations/tables/{maBan}/release
  if (payload.status === TableStatus.AVAILABLE && previousStatus === TableStatus.OCCUPIED) {
    try {
      const releaseRes = await apiRequest<void>(
        `/reservations/tables/${encodeURIComponent(maBan)}/release`,
        { method: 'POST' }
      );
      clearTableUiMeta(maBan);
      const updatedBe: BackendBanAnDTO = {
        maBan,
        khuVuc: previousBe?.khuVuc ?? 'Tầng 1',
        sucChua: previousBe?.sucChua ?? 4,
        trangThaiSuDung: 'TRONG',
      };
      return {
        ...releaseRes,
        data: mapBackendToDiningTable(updatedBe),
        message: releaseRes.message || 'Giải phóng bàn thành công',
      };
    } catch {
      // Fallback sang PATCH status nếu bàn không ở trạng thái release được
    }
  }

  // 3. Cập nhật trạng thái bàn -> PATCH /reservations/tables/{maBan}/status
  const res = await apiRequest<BackendBanAnDTO>(
    `/reservations/tables/${encodeURIComponent(maBan)}/status?status=${encodeURIComponent(targetBeStatus)}`,
    { method: 'PATCH' }
  );

  if (payload.status === TableStatus.AVAILABLE) {
    clearTableUiMeta(maBan);
  } else {
    saveTableUiMeta(maBan, {
      currentOrderId:
        payload.currentOrderId !== undefined
          ? payload.currentOrderId
          : payload.status === TableStatus.OCCUPIED
            ? readTableUiMetaMap()[maBan]?.currentOrderId ?? null
            : null,
      reservedCustomerName:
        payload.status === TableStatus.RESERVED
          ? (payload.reservedCustomerName ?? readTableUiMetaMap()[maBan]?.reservedCustomerName ?? null)
          : null,
      reservedCustomerPhone:
        payload.status === TableStatus.RESERVED
          ? (payload.reservedCustomerPhone ?? readTableUiMetaMap()[maBan]?.reservedCustomerPhone ?? null)
          : null,
      reservedGuestCount:
        payload.status === TableStatus.RESERVED
          ? (payload.reservedGuestCount ?? readTableUiMetaMap()[maBan]?.reservedGuestCount ?? null)
          : null,
      reservedAt:
        payload.status === TableStatus.RESERVED
          ? (payload.reservedAt ?? readTableUiMetaMap()[maBan]?.reservedAt ?? null)
          : null,
    });
  }

  return {
    ...res,
    data: mapBackendToDiningTable(res.data),
  };
}