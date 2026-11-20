import test from 'node:test';
import assert from 'node:assert/strict';
import { MOCK_DAILY_SALES_RECORDS, REPORT_REFERENCE_TODAY } from '../mocks';
import {
  aggregateRevenueReport,
  buildRevenueCsv,
  resolveDateRange,
} from './revenueAnalytics';

test('resolveDateRange handles TODAY, LAST_7_DAYS, THIS_MONTH, and inverted CUSTOM dates', () => {
  assert.deepEqual(resolveDateRange('TODAY', REPORT_REFERENCE_TODAY), {
    startDate: '2026-11-20',
    endDate: '2026-11-20',
  });

  assert.deepEqual(resolveDateRange('LAST_7_DAYS', REPORT_REFERENCE_TODAY), {
    startDate: '2026-11-14',
    endDate: '2026-11-20',
  });

  assert.deepEqual(resolveDateRange('THIS_MONTH', REPORT_REFERENCE_TODAY), {
    startDate: '2026-11-01',
    endDate: '2026-11-20',
  });

  assert.deepEqual(
    resolveDateRange('CUSTOM', REPORT_REFERENCE_TODAY, '2026-11-18', '2026-11-12'),
    {
      startDate: '2026-11-12',
      endDate: '2026-11-18',
    }
  );
});

test('aggregateRevenueReport computes KPIs, 7-day daily series, and category shares totaling ~100%', () => {
  const report = aggregateRevenueReport(
    MOCK_DAILY_SALES_RECORDS,
    '2026-11-14',
    '2026-11-20'
  );

  assert.equal(report.dailySeries.length, 7);
  assert.ok(report.totalRevenueVnd > 0);
  assert.ok(report.totalInvoices > 0);
  assert.equal(
    report.averageOrderValueVnd,
    Math.round(report.totalRevenueVnd / report.totalInvoices)
  );
  assert.ok(report.bestSellingDish !== null);

  const percentageSum = report.categoryShares.reduce(
    (sum, item) => sum + item.percentage,
    0
  );
  assert.ok(percentageSum >= 99.5 && percentageSum <= 100.5);
});

test('buildRevenueCsv prepends UTF-8 BOM and preserves accented Vietnamese headers', () => {
  const report = aggregateRevenueReport(
    MOCK_DAILY_SALES_RECORDS,
    '2026-11-20',
    '2026-11-20'
  );
  const csv = buildRevenueCsv(report);

  assert.equal(csv.startsWith('\uFEFF'), true);
  assert.match(csv, /BÁO CÁO THỐNG KÊ DOANH THU NHÀ HÀNG BẾP VIỆT/);
  assert.match(csv, /Tổng doanh thu \(VNĐ\)/);
  assert.match(csv, /Món chính/);
});
