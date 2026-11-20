import { DailySalesRecord, MenuCategory } from '../types';

export const REPORT_REFERENCE_TODAY = '2026-11-20';

interface DishTemplate {
  id: number;
  name: string;
  category: MenuCategory;
  priceVnd: number;
  baseQty: number;
}

const DISH_TEMPLATES: DishTemplate[] = [
  { id: 201, name: 'Gỏi cuốn tôm thịt', category: MenuCategory.APPETIZER, priceVnd: 65_000, baseQty: 26 },
  { id: 202, name: 'Chả giò hải sản giòn rụm', category: MenuCategory.APPETIZER, priceVnd: 88_000, baseQty: 18 },
  { id: 203, name: 'Cá lóc kho tộ niêu đất', category: MenuCategory.MAIN_COURSE, priceVnd: 165_000, baseQty: 28 },
  { id: 204, name: 'Bò lúc lắc khoai tây chiên', category: MenuCategory.MAIN_COURSE, priceVnd: 195_000, baseQty: 24 },
  { id: 205, name: 'Cơm tấm sườn bì chả đặc biệt', category: MenuCategory.MAIN_COURSE, priceVnd: 78_000, baseQty: 32 },
  { id: 208, name: 'Lẩu riêu cua bắp bò', category: MenuCategory.MAIN_COURSE, priceVnd: 340_000, baseQty: 14 },
  { id: 209, name: 'Trà đào cam sả', category: MenuCategory.DRINK, priceVnd: 45_000, baseQty: 44 },
  { id: 210, name: 'Cà phê sữa đá Sài Gòn', category: MenuCategory.DRINK, priceVnd: 35_000, baseQty: 30 },
  { id: 211, name: 'Chè khúc bạch hạnh nhân', category: MenuCategory.DESSERT, priceVnd: 48_000, baseQty: 22 },
  { id: 212, name: 'Bánh flan caramel cà phê', category: MenuCategory.DESSERT, priceVnd: 38_000, baseQty: 15 },
];

/**
 * Sinh dữ liệu bán hàng tất định 30 ngày gần nhất (22/10/2026 -> 20/11/2026)
 * với biên độ thực tế của nhà hàng Việt Nam (cuối tuần cao điểm).
 */
function buildDeterministicDailySales(): DailySalesRecord[] {
  const records: DailySalesRecord[] = [];
  const endDate = new Date('2026-11-20T00:00:00Z');

  for (let offset = 29; offset >= 0; offset -= 1) {
    const current = new Date(endDate.getTime() - offset * 86_400_000);
    const iso = current.toISOString().slice(0, 10);
    const dayOfWeek = current.getUTCDay(); // 0=CN, 6=T7
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isFriday = dayOfWeek === 5;
    const daySeed = (30 - offset) * 7 + current.getUTCDate();

    const dayMultiplier = isWeekend
      ? 1.38 + ((daySeed % 5) * 0.04)
      : isFriday
        ? 1.18 + ((daySeed % 4) * 0.03)
        : 0.85 + ((daySeed % 6) * 0.045);

    const invoiceCount = Math.round(32 * dayMultiplier + (daySeed % 7));

    const itemsSold = DISH_TEMPLATES.map((dish, idx) => {
      const variance = 0.82 + (((daySeed + idx * 11) % 9) * 0.045);
      const quantity = Math.max(4, Math.round(dish.baseQty * dayMultiplier * variance));
      return {
        menuItemId: dish.id,
        menuItemName: dish.name,
        category: dish.category,
        quantity,
        revenueVnd: quantity * dish.priceVnd,
      };
    });

    records.push({
      date: iso,
      invoiceCount,
      itemsSold,
    });
  }

  return records;
}

export const MOCK_DAILY_SALES_RECORDS: DailySalesRecord[] =
  buildDeterministicDailySales();
