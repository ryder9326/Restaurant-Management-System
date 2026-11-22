import {
  ApiResponse,
  CategoryRevenueShare,
  DailyRevenuePoint,
  InvoiceStatus,
  MenuCategory,
  RevenueDatePreset,
  RevenueReport,
  TopDishSale,
} from '../types';
import { MENU_CATEGORY_LABELS, resolveDateRange } from '../utils';
import { apiRequest, createApiResponse } from './apiConfig';
import * as invoiceService from './invoiceService';
import * as menuService from './menuService';

export interface RevenueReportQuery {
  preset: RevenueDatePreset;
  startDate?: string;
  endDate?: string;
}

interface BackendBestSellingDishProjection {
  tenMon: string;
  tongSoLuongDaBan: number;
}

interface BackendAreaRevenueStatProjection {
  khuVuc: string;
  soLuongHoaDon: number;
  tongDoanhThu: number;
}

const ORDERED_CATEGORIES: MenuCategory[] = [
  MenuCategory.MAIN_COURSE,
  MenuCategory.SOUP_HOTPOT,
  MenuCategory.APPETIZER,
  MenuCategory.DRINK,
  MenuCategory.DESSERT,
];

function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatShortDate(isoDate: string): string {
  const parts = isoDate.split('-');
  return parts.length === 3 ? `${parts[2]}/${parts[1]}` : isoDate;
}

function normalizeName(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Tổng hợp báo cáo doanh thu từ các endpoint thống kê thực tế của phân hệ billing:
 * - GET /billing/analytics/best-selling-dishes
 * - GET /billing/analytics/revenue-by-area
 * - GET /billing/payments/details
 */
export async function getRevenueReport(
  query: RevenueReportQuery
): Promise<ApiResponse<RevenueReport>> {
  const todayIso = getTodayIso();
  const { startDate, endDate } = resolveDateRange(
    query.preset,
    todayIso,
    query.startDate,
    query.endDate
  );

  const [bestSellingRes, areaStatsRes, invoicesRes, menuRes] =
    await Promise.allSettled([
      apiRequest<BackendBestSellingDishProjection[]>(
        '/billing/analytics/best-selling-dishes',
        { method: 'GET' }
      ),
      apiRequest<BackendAreaRevenueStatProjection[]>(
        '/billing/analytics/revenue-by-area',
        { method: 'GET' }
      ),
      invoiceService.getInvoices(),
      menuService.getMenuItems(),
    ]);

  const bestSellingRaw =
    bestSellingRes.status === 'fulfilled' ? bestSellingRes.value.data || [] : [];
  const areaStatsRaw =
    areaStatsRes.status === 'fulfilled' ? areaStatsRes.value.data || [] : [];
  const invoices =
    invoicesRes.status === 'fulfilled' ? invoicesRes.value.data || [] : [];
  const menuItems =
    menuRes.status === 'fulfilled' ? menuRes.value.data || [] : [];

  const menuByNormalizedName = new Map(
    menuItems.map((item) => [normalizeName(item.name), item])
  );

  // 1. Xây dựng danh sách Top món bán chạy & tỉ trọng theo danh mục
  const categoryMap = new Map<
    MenuCategory,
    { revenueVnd: number; quantitySold: number }
  >();

  const topDishes: TopDishSale[] = bestSellingRaw
    .map((row, idx) => {
      const matched = menuByNormalizedName.get(normalizeName(row.tenMon));
      const qty = Math.max(0, Number(row.tongSoLuongDaBan) || 0);
      const unitPrice = matched?.priceVnd ?? 0;
      const revenueVnd = qty * unitPrice;
      const category = matched?.category ?? MenuCategory.MAIN_COURSE;

      const currentCat = categoryMap.get(category) ?? {
        revenueVnd: 0,
        quantitySold: 0,
      };
      currentCat.revenueVnd += revenueVnd;
      currentCat.quantitySold += qty;
      categoryMap.set(category, currentCat);

      return {
        menuItemId: matched?.id ?? 8000 + idx,
        menuItemName: row.tenMon,
        category,
        quantitySold: qty,
        revenueVnd,
      };
    })
    .sort((a, b) => {
      if (b.quantitySold !== a.quantitySold) return b.quantitySold - a.quantitySold;
      return b.revenueVnd - a.revenueVnd;
    });

  const totalCategoryRevenue = Array.from(categoryMap.values()).reduce(
    (sum, item) => sum + item.revenueVnd,
    0
  );

  const categoryShares: CategoryRevenueShare[] = ORDERED_CATEGORIES.map(
    (category) => {
      const bucket = categoryMap.get(category) ?? {
        revenueVnd: 0,
        quantitySold: 0,
      };
      const percentage =
        totalCategoryRevenue > 0
          ? Number(((bucket.revenueVnd / totalCategoryRevenue) * 100).toFixed(1))
          : 0;
      return {
        category,
        label: MENU_CATEGORY_LABELS[category],
        revenueVnd: bucket.revenueVnd,
        quantitySold: bucket.quantitySold,
        percentage,
      };
    }
  ).filter((share) => share.quantitySold > 0);

  // 2. Tính tổng doanh thu, tổng số hóa đơn & chuỗi doanh thu theo ngày
  const paidInvoices = invoices.filter(
    (inv) => inv.status === InvoiceStatus.PAID
  );
  const dailyMap = new Map<string, { revenueVnd: number; invoiceCount: number }>();

  for (const inv of paidInvoices) {
    const invDate = (inv.paidAt || inv.issuedAt || todayIso).slice(0, 10);
    if (invDate >= startDate && invDate <= endDate) {
      const bucket = dailyMap.get(invDate) ?? { revenueVnd: 0, invoiceCount: 0 };
      bucket.revenueVnd += inv.totalAmountVnd;
      bucket.invoiceCount += 1;
      dailyMap.set(invDate, bucket);
    }
  }

  let dailySeries: DailyRevenuePoint[] = Array.from(dailyMap.entries())
    .sort(([d1], [d2]) => d1.localeCompare(d2))
    .map(([date, bucket]) => ({
      date,
      label: formatShortDate(date),
      revenueVnd: bucket.revenueVnd,
      invoiceCount: bucket.invoiceCount,
    }));

  // Nếu chưa có hóa đơn nào trong khoảng lọc nhưng DB đã có doanh thu khu vực, hiển thị tổng hợp vào ngày cuối
  const areaTotalRevenue = areaStatsRaw.reduce(
    (sum, item) => sum + (Number(item.tongDoanhThu) || 0),
    0
  );
  const areaTotalInvoices = areaStatsRaw.reduce(
    (sum, item) => sum + (Number(item.soLuongHoaDon) || 0),
    0
  );

  const totalRevenueFromPayments = dailySeries.reduce(
    (sum, p) => sum + p.revenueVnd,
    0
  );
  const totalInvoicesFromPayments = dailySeries.reduce(
    (sum, p) => sum + p.invoiceCount,
    0
  );

  const totalRevenueVnd =
    totalRevenueFromPayments > 0 ? totalRevenueFromPayments : areaTotalRevenue;
  const totalInvoices =
    totalInvoicesFromPayments > 0 ? totalInvoicesFromPayments : areaTotalInvoices;

  if (dailySeries.length === 0 && totalRevenueVnd > 0) {
    dailySeries = [
      {
        date: endDate,
        label: formatShortDate(endDate),
        revenueVnd: totalRevenueVnd,
        invoiceCount: totalInvoices,
      },
    ];
  }

  const averageOrderValueVnd =
    totalInvoices > 0 ? Math.round(totalRevenueVnd / totalInvoices) : 0;

  const report: RevenueReport = {
    startDate,
    endDate,
    totalRevenueVnd: Math.round(totalRevenueVnd),
    totalInvoices,
    averageOrderValueVnd,
    bestSellingDish: topDishes[0] ?? null,
    dailySeries,
    categoryShares,
    topDishes,
  };

  return createApiResponse(report, 'Tải báo cáo doanh thu thành công');
}