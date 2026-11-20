import {
  CategoryRevenueShare,
  DailyRevenuePoint,
  DailySalesRecord,
  MenuCategory,
  RevenueDatePreset,
  RevenueReport,
  TopDishSale,
} from '../types';
import {
  formatFullDateVi,
  formatShortDateVi,
  MENU_CATEGORY_LABELS,
} from './formatters';

export interface DateRangeWindow {
  startDate: string;
  endDate: string;
}

const ORDERED_CATEGORIES: MenuCategory[] = [
  MenuCategory.MAIN_COURSE,
  MenuCategory.APPETIZER,
  MenuCategory.DRINK,
  MenuCategory.DESSERT,
];

function shiftIsoDate(isoDate: string, deltaDays: number): string {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return date.toISOString().slice(0, 10);
}

export function resolveDateRange(
  preset: RevenueDatePreset,
  todayIso: string,
  customStart?: string,
  customEnd?: string
): DateRangeWindow {
  switch (preset) {
    case 'TODAY':
      return { startDate: todayIso, endDate: todayIso };
    case 'LAST_7_DAYS':
      return { startDate: shiftIsoDate(todayIso, -6), endDate: todayIso };
    case 'THIS_MONTH':
      return { startDate: `${todayIso.slice(0, 7)}-01`, endDate: todayIso };
    case 'CUSTOM': {
      const start = customStart || shiftIsoDate(todayIso, -6);
      const end = customEnd || todayIso;
      if (start > end) {
        return { startDate: end, endDate: start };
      }
      return { startDate: start, endDate: end };
    }
  }
}

export function aggregateRevenueReport(
  records: DailySalesRecord[],
  startDate: string,
  endDate: string
): RevenueReport {
  const filtered = records
    .filter((rec) => rec.date >= startDate && rec.date <= endDate)
    .sort((a, b) => a.date.localeCompare(b.date));

  let totalRevenueVnd = 0;
  let totalInvoices = 0;

  const categoryMap = new Map<
    MenuCategory,
    { revenueVnd: number; quantitySold: number }
  >();
  const dishMap = new Map<number, TopDishSale>();

  const dailySeries: DailyRevenuePoint[] = filtered.map((record) => {
    let dayRevenue = 0;

    for (const item of record.itemsSold) {
      dayRevenue += item.revenueVnd;

      const existingCategory = categoryMap.get(item.category) ?? {
        revenueVnd: 0,
        quantitySold: 0,
      };
      existingCategory.revenueVnd += item.revenueVnd;
      existingCategory.quantitySold += item.quantity;
      categoryMap.set(item.category, existingCategory);

      const existingDish = dishMap.get(item.menuItemId) ?? {
        menuItemId: item.menuItemId,
        menuItemName: item.menuItemName,
        category: item.category,
        quantitySold: 0,
        revenueVnd: 0,
      };
      existingDish.quantitySold += item.quantity;
      existingDish.revenueVnd += item.revenueVnd;
      dishMap.set(item.menuItemId, existingDish);
    }

    totalRevenueVnd += dayRevenue;
    totalInvoices += record.invoiceCount;

    return {
      date: record.date,
      label: formatShortDateVi(record.date),
      revenueVnd: dayRevenue,
      invoiceCount: record.invoiceCount,
    };
  });

  const averageOrderValueVnd =
    totalInvoices > 0 ? Math.round(totalRevenueVnd / totalInvoices) : 0;

  const categoryShares: CategoryRevenueShare[] = ORDERED_CATEGORIES.map(
    (category) => {
      const bucket = categoryMap.get(category) ?? {
        revenueVnd: 0,
        quantitySold: 0,
      };
      const percentage =
        totalRevenueVnd > 0
          ? Number(((bucket.revenueVnd / totalRevenueVnd) * 100).toFixed(1))
          : 0;

      return {
        category,
        label: MENU_CATEGORY_LABELS[category],
        revenueVnd: bucket.revenueVnd,
        quantitySold: bucket.quantitySold,
        percentage,
      };
    }
  ).filter((share) => share.revenueVnd > 0 || filtered.length === 0);

  const topDishes = Array.from(dishMap.values()).sort((a, b) => {
    if (b.quantitySold !== a.quantitySold) {
      return b.quantitySold - a.quantitySold;
    }
    return b.revenueVnd - a.revenueVnd;
  });

  return {
    startDate,
    endDate,
    totalRevenueVnd,
    totalInvoices,
    averageOrderValueVnd,
    bestSellingDish: topDishes[0] ?? null,
    dailySeries,
    categoryShares,
    topDishes,
  };
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Tạo nội dung file CSV chuẩn UTF-8 BOM (\uFEFF) hỗ trợ mở trực tiếp bằng Excel tiếng Việt có dấu.
 */
export function buildRevenueCsv(report: RevenueReport): string {
  const lines: string[] = [];

  lines.push(
    [
      'BÁO CÁO THỐNG KÊ DOANH THU NHÀ HÀNG BẾP VIỆT',
      `Từ ngày ${formatFullDateVi(report.startDate)} đến ${formatFullDateVi(report.endDate)}`,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push('');

  lines.push(['Chỉ số tổng quan', 'Giá trị'].map(escapeCsvCell).join(','));
  lines.push(
    ['Tổng doanh thu (VNĐ)', report.totalRevenueVnd].map(escapeCsvCell).join(',')
  );
  lines.push(
    ['Tổng số hóa đơn', report.totalInvoices].map(escapeCsvCell).join(',')
  );
  lines.push(
    ['Giá trị trung bình/đơn (VNĐ)', report.averageOrderValueVnd]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push(
    [
      'Món bán chạy nhất',
      report.bestSellingDish
        ? `${report.bestSellingDish.menuItemName} (${report.bestSellingDish.quantitySold} phần)`
        : 'Chưa có dữ liệu',
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  lines.push('');

  lines.push(
    ['Ngày', 'Số hóa đơn', 'Doanh thu (VNĐ)', 'Trung bình/đơn (VNĐ)']
      .map(escapeCsvCell)
      .join(',')
  );
  for (const point of report.dailySeries) {
    const avg =
      point.invoiceCount > 0
        ? Math.round(point.revenueVnd / point.invoiceCount)
        : 0;
    lines.push(
      [
        formatFullDateVi(point.date),
        point.invoiceCount,
        point.revenueVnd,
        avg,
      ]
        .map(escapeCsvCell)
        .join(',')
    );
  }
  lines.push('');

  lines.push(
    ['Danh mục món', 'Số lượng bán', 'Doanh thu (VNĐ)', 'Tỉ trọng (%)']
      .map(escapeCsvCell)
      .join(',')
  );
  for (const cat of report.categoryShares) {
    lines.push(
      [cat.label, cat.quantitySold, cat.revenueVnd, `${cat.percentage}%`]
        .map(escapeCsvCell)
        .join(',')
    );
  }

  return `\uFEFF${lines.join('\r\n')}`;
}
