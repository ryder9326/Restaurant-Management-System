import { MOCK_DAILY_SALES_RECORDS, REPORT_REFERENCE_TODAY } from '../mocks';
import { ApiResponse, RevenueDatePreset, RevenueReport } from '../types';
import { aggregateRevenueReport, resolveDateRange } from '../utils';
import { createApiResponse, simulateLatency } from './apiConfig';

export interface RevenueReportQuery {
  preset: RevenueDatePreset;
  startDate?: string;
  endDate?: string;
}

/**
 * GET /api/reports/revenue?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 * Thay thế khi nối Java Backend:
 * const res = await apiClient.get<ApiResponse<RevenueReport>>('/reports/revenue', {
 *   params: { startDate, endDate },
 * });
 * return res.data;
 */
export async function getRevenueReport(
  query: RevenueReportQuery
): Promise<ApiResponse<RevenueReport>> {
  await simulateLatency();
  const { startDate, endDate } = resolveDateRange(
    query.preset,
    REPORT_REFERENCE_TODAY,
    query.startDate,
    query.endDate
  );

  const report = aggregateRevenueReport(
    MOCK_DAILY_SALES_RECORDS,
    startDate,
    endDate
  );

  return createApiResponse(report, 'Tải báo cáo doanh thu thành công');
}
