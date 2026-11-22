import {
  ApiResponse,
  MenuCategory,
  MenuItem,
  MenuItemStatus,
  UpsertMenuItemRequest,
} from '../types';
import { apiRequest } from './apiConfig';

interface BackendThucDonDTO {
  maMon: string;
  tenMon: string;
  moTa?: string | null;
  giaBan: number;
  trangThaiMon?: string | null;
  maNguyenLieuList?: string[];
}

interface BackendPageResponse<T> {
  content?: T[];
  items?: T[];
  data?: T[];
}

interface MenuUiMeta {
  category?: MenuCategory;
  unit?: string;
  preparationMinutes?: number;
  featured?: boolean;
  imageUrl?: string;
}

const MENU_UI_META_KEY = 'bepviet_menu_ui_meta_v1';

// Bảng ánh xạ 2 chiều giữa numeric id của FE và maMon ("MON01") của BE
const idToMaMonMap = new Map<number, string>();
const maMonToIdMap = new Map<string, number>();
const beMenuCacheByMaMon = new Map<string, BackendThucDonDTO>();

export function getMaMonByMenuItemId(id: number): string | undefined {
  return idToMaMonMap.get(id);
}

export function getMenuItemIdByMaMon(maMon: string): number {
  return getOrAssignMenuNumericId(maMon);
}

function readMenuUiMetaMap(): Record<string, MenuUiMeta> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(MENU_UI_META_KEY);
    return raw ? (JSON.parse(raw) as Record<string, MenuUiMeta>) : {};
  } catch {
    return {};
  }
}

function saveMenuUiMeta(maMon: string, meta: MenuUiMeta): void {
  if (typeof window === 'undefined') return;
  const current = readMenuUiMetaMap();
  current[maMon] = { ...current[maMon], ...meta };
  window.localStorage.setItem(MENU_UI_META_KEY, JSON.stringify(current));
}

function getOrAssignMenuNumericId(maMon: string): number {
  const existing = maMonToIdMap.get(maMon);
  if (existing !== undefined) return existing;

  const digits = maMon.replace(/\D/g, '');
  let candidate = digits ? Number.parseInt(digits, 10) : 0;

  if (!candidate || Number.isNaN(candidate) || idToMaMonMap.has(candidate)) {
    let hash = 2000;
    for (let i = 0; i < maMon.length; i += 1) {
      hash = (hash * 31 + maMon.charCodeAt(i)) % 100_000;
    }
    candidate = hash || 2000;
    while (idToMaMonMap.has(candidate)) {
      candidate += 1;
    }
  }

  maMonToIdMap.set(maMon, candidate);
  idToMaMonMap.set(candidate, maMon);
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

function mapBeStatusToFe(trangThaiMon?: string | null): MenuItemStatus {
  const normalized = normalizeText(trangThaiMon);
  if (normalized.includes('ngung') || normalized.includes('discontinued')) {
    return MenuItemStatus.DISCONTINUED;
  }
  if (
    normalized.includes('het') ||
    normalized.includes('out_of_stock') ||
    normalized.includes('out of stock')
  ) {
    return MenuItemStatus.OUT_OF_STOCK;
  }
  return MenuItemStatus.AVAILABLE;
}

function mapFeStatusToBe(status: MenuItemStatus): string {
  switch (status) {
    case MenuItemStatus.OUT_OF_STOCK:
      return 'Tạm hết';
    case MenuItemStatus.DISCONTINUED:
      return 'Ngừng bán';
    case MenuItemStatus.AVAILABLE:
    default:
      return 'Đang bán';
  }
}

function inferCategoryFromName(tenMon: string): MenuCategory {
  const n = normalizeText(tenMon);
  if (
    n.includes('bia') ||
    n.includes('nuoc') ||
    n.includes('tra') ||
    n.includes('ca phe') ||
    n.includes('sinh to') ||
    n.includes('soda')
  ) {
    return MenuCategory.DRINK;
  }
  if (n.includes('lau') || n.includes('sup') || n.includes('canh')) {
    return MenuCategory.SOUP_HOTPOT;
  }
  if (n.includes('salad') || n.includes('goi') || n.includes('nem') || n.includes('khai vi')) {
    return MenuCategory.APPETIZER;
  }
  if (n.includes('che') || n.includes('kem') || n.includes('banh ngot') || n.includes('trang mieng')) {
    return MenuCategory.DESSERT;
  }
  return MenuCategory.MAIN_COURSE;
}

function inferUnitFromCategory(category: MenuCategory, tenMon: string): string {
  const n = normalizeText(tenMon);
  if (n.includes('bia')) return 'Lon';
  if (category === MenuCategory.DRINK) return 'Ly';
  if (n.includes('lau')) return 'Nồi';
  if (n.includes('pho') || n.includes('bun')) return 'Tô';
  if (n.includes('ga nuong')) return 'Con';
  return 'Phần';
}

function mapBackendToMenuItem(dto: BackendThucDonDTO): MenuItem {
  beMenuCacheByMaMon.set(dto.maMon, dto);
  const id = getOrAssignMenuNumericId(dto.maMon);
  const meta = readMenuUiMetaMap()[dto.maMon];
  const category = meta?.category ?? inferCategoryFromName(dto.tenMon);

  return {
    id,
    sku: dto.maMon,
    name: dto.tenMon,
    description: dto.moTa ?? '',
    category,
    priceVnd: Math.round(Number(dto.giaBan) || 0),
    unit: meta?.unit || inferUnitFromCategory(category, dto.tenMon),
    preparationMinutes:
      meta?.preparationMinutes ?? (category === MenuCategory.DRINK ? 5 : 15),
    status: mapBeStatusToFe(dto.trangThaiMon),
    featured: meta?.featured ?? false,
    imageUrl: meta?.imageUrl,
  };
}

function extractListFromPage(
  pageData: BackendPageResponse<BackendThucDonDTO> | BackendThucDonDTO[]
): BackendThucDonDTO[] {
  if (Array.isArray(pageData)) return pageData;
  return pageData?.content ?? pageData?.items ?? pageData?.data ?? [];
}

/**
 * GET /api/v1/menu-orders/menu
 */
export async function getMenuItems(params?: {
  category?: MenuCategory;
  status?: MenuItemStatus;
}): Promise<ApiResponse<MenuItem[]>> {
  const res = await apiRequest<
    BackendPageResponse<BackendThucDonDTO> | BackendThucDonDTO[]
  >('/menu-orders/menu?page=0&size=100&sortBy=maMon', {
    method: 'GET',
  });

  let items = extractListFromPage(res.data).map(mapBackendToMenuItem);

  if (params?.category) {
    items = items.filter((item) => item.category === params.category);
  }
  if (params?.status) {
    items = items.filter((item) => item.status === params.status);
  }

  return {
    ...res,
    data: items,
  };
}

/**
 * POST /api/v1/menu-orders/menu
 */
export async function createMenuItem(
  payload: UpsertMenuItemRequest
): Promise<ApiResponse<MenuItem>> {
  const maMon = payload.sku.trim().toUpperCase();
  const body: BackendThucDonDTO = {
    maMon,
    tenMon: payload.name.trim(),
    moTa: payload.description.trim(),
    giaBan: Math.round(payload.priceVnd),
    trangThaiMon: mapFeStatusToBe(payload.status),
    maNguyenLieuList: [],
  };

  const res = await apiRequest<BackendThucDonDTO>('/menu-orders/menu', {
    method: 'POST',
    body,
  });

  saveMenuUiMeta(res.data.maMon, {
    category: payload.category,
    unit: payload.unit.trim(),
    preparationMinutes: Math.round(payload.preparationMinutes),
    imageUrl: payload.imageUrl?.trim() || undefined,
  });

  return {
    ...res,
    data: mapBackendToMenuItem(res.data),
  };
}

/**
 * PUT /api/v1/menu-orders/menu/{maMon}
 */
export async function updateMenuItem(
  id: number,
  payload: UpsertMenuItemRequest
): Promise<ApiResponse<MenuItem>> {
  const targetMaMon = idToMaMonMap.get(id) || payload.sku.trim().toUpperCase();
  const existingBe = beMenuCacheByMaMon.get(targetMaMon);

  const body: BackendThucDonDTO = {
    maMon: targetMaMon,
    tenMon: payload.name.trim(),
    moTa: payload.description.trim(),
    giaBan: Math.round(payload.priceVnd),
    trangThaiMon: mapFeStatusToBe(payload.status),
    maNguyenLieuList: existingBe?.maNguyenLieuList ?? [],
  };

  const res = await apiRequest<BackendThucDonDTO>(
    `/menu-orders/menu/${encodeURIComponent(targetMaMon)}`,
    {
      method: 'PUT',
      body,
    }
  );

  saveMenuUiMeta(res.data.maMon, {
    category: payload.category,
    unit: payload.unit.trim(),
    preparationMinutes: Math.round(payload.preparationMinutes),
    imageUrl: payload.imageUrl?.trim() || undefined,
  });

  return {
    ...res,
    data: mapBackendToMenuItem(res.data),
  };
}

/**
 * Cập nhật nhanh trạng thái món (Còn món / Tạm hết / Ngừng bán) qua PUT /menu-orders/menu/{maMon}
 */
export async function updateMenuItemStatus(
  id: number,
  status: MenuItemStatus
): Promise<ApiResponse<MenuItem>> {
  const targetMaMon = idToMaMonMap.get(id);
  if (!targetMaMon) {
    throw new Error(`Không tìm thấy món ăn mã #${id}.`);
  }

  let existingBe = beMenuCacheByMaMon.get(targetMaMon);
  if (!existingBe) {
    await getMenuItems();
    existingBe = beMenuCacheByMaMon.get(targetMaMon);
  }
  if (!existingBe) {
    throw new Error(`Không tìm thấy thông tin món ăn ${targetMaMon}.`);
  }

  const body: BackendThucDonDTO = {
    maMon: existingBe.maMon,
    tenMon: existingBe.tenMon,
    moTa: existingBe.moTa ?? '',
    giaBan: existingBe.giaBan,
    trangThaiMon: mapFeStatusToBe(status),
    maNguyenLieuList: existingBe.maNguyenLieuList ?? [],
  };

  const res = await apiRequest<BackendThucDonDTO>(
    `/menu-orders/menu/${encodeURIComponent(targetMaMon)}`,
    {
      method: 'PUT',
      body,
    }
  );

  return {
    ...res,
    data: mapBackendToMenuItem(res.data),
    message: 'Đã cập nhật trạng thái món ăn',
  };
}

/**
 * Xóa mềm món ăn bằng cách chuyển sang trạng thái 'Ngừng bán'
 * (do Backend không mở DELETE /menu để bảo toàn lịch sử hóa đơn).
 */
export async function deleteMenuItem(id: number): Promise<ApiResponse<null>> {
  const res = await updateMenuItemStatus(id, MenuItemStatus.DISCONTINUED);
  return {
    ...res,
    data: null,
    message: 'Đã chuyển món ăn sang trạng thái Ngừng bán',
  };
}

/**
 * Khôi phục món ăn từ Thùng rác về trạng thái Đang bán (AVAILABLE).
 */
export async function restoreMenuItem(id: number): Promise<ApiResponse<MenuItem>> {
  const res = await updateMenuItemStatus(id, MenuItemStatus.AVAILABLE);
  return {
    ...res,
    message: 'Đã khôi phục món ăn trở lại thực đơn',
  };
}

/**
 * DELETE /api/v1/menu-orders/menu/{maMon} — Xóa vĩnh viễn khỏi MySQL.
 */
export async function permanentlyDeleteMenuItem(id: number): Promise<ApiResponse<null>> {
  const targetMaMon = idToMaMonMap.get(id);
  if (!targetMaMon) {
    throw new Error(`Không tìm thấy món ăn mã #${id}.`);
  }

  const res = await apiRequest<void>(
    `/menu-orders/menu/${encodeURIComponent(targetMaMon)}`,
    { method: 'DELETE' }
  );

  beMenuCacheByMaMon.delete(targetMaMon);
  if (typeof window !== 'undefined') {
    const meta = readMenuUiMetaMap();
    delete meta[targetMaMon];
    window.localStorage.setItem(MENU_UI_META_KEY, JSON.stringify(meta));
  }

  return {
    ...res,
    data: null,
    message: res.message || 'Đã xóa vĩnh viễn món ăn khỏi hệ thống',
  };
}