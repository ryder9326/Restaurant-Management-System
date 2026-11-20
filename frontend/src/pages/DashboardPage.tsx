import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  Download,
  FileSpreadsheet,
  LineChart as LineChartIcon,
  Printer,
  TrendingUp,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { ReportPrintPreviewModal } from '../components/reports/ReportPrintPreviewModal';
import { useAsyncData } from '../hooks/useAsyncData';
import { REPORT_REFERENCE_TODAY } from '../mocks';
import { reportService } from '../services';
import { MenuCategory, RevenueDatePreset, RevenueReport } from '../types';
import {
  buildRevenueCsv,
  formatFullDateVi,
  formatVnd,
  MENU_CATEGORY_LABELS,
} from '../utils';

type ChartStyle = 'bar' | 'line';

const DATE_PRESETS: { value: RevenueDatePreset; label: string }[] = [
  { value: 'TODAY', label: 'Hôm nay' },
  { value: 'LAST_7_DAYS', label: '7 ngày qua' },
  { value: 'THIS_MONTH', label: 'Tháng này' },
  { value: 'CUSTOM', label: 'Tùy chọn ngày' },
];

const CATEGORY_COLORS: Record<MenuCategory, string> = {
  [MenuCategory.MAIN_COURSE]: '#C2572B',
  [MenuCategory.APPETIZER]: '#D98A4E',
  [MenuCategory.DRINK]: '#4E7A66',
  [MenuCategory.DESSERT]: '#8B7462',
  [MenuCategory.SOUP_HOTPOT]: '#A5451E',
};

function formatCompactMillionVnd(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, '')}tr`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)}k`;
  }
  return String(value);
}

export function DashboardPage() {
  const [preset, setPreset] = useState<RevenueDatePreset>('LAST_7_DAYS');
  const [customStart, setCustomStart] = useState('2026-11-10');
  const [customEnd, setCustomEnd] = useState(REPORT_REFERENCE_TODAY);
  const [chartStyle, setChartStyle] = useState<ChartStyle>('bar');

  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const fetchReport = useCallback(async () => {
    const res = await reportService.getRevenueReport({
      preset,
      startDate: customStart,
      endDate: customEnd,
    });
    return res.data;
  }, [preset, customStart, customEnd]);

  const {
    data: report,
    loading,
    error,
    reload,
  } = useAsyncData<RevenueReport | null>(fetchReport, null);

  const customRangeInvalid =
    preset === 'CUSTOM' && customStart > customEnd;

  function handleExportCsv() {
    if (!report) return;
    setExportMenuOpen(false);

    const csvContent = buildRevenueCsv(report);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bao-cao-doanh-thu-${report.startDate}-den-${report.endDate}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(
      `Đã xuất file CSV báo cáo kỳ ${formatFullDateVi(report.startDate)} – ${formatFullDateVi(report.endDate)} (hỗ trợ tiếng Việt UTF-8).`
    );
  }

  function handleOpenPrintPreview() {
    setExportMenuOpen(false);
    setPrintPreviewOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề & Nút Xuất báo cáo */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Thống kê doanh thu
          </h1>
          <p className="text-sm text-[#5E5850]">
            Theo dõi hiệu quả kinh doanh theo thời gian, cơ cấu danh mục món ăn
            và xuất báo cáo tài chính.
          </p>
        </div>

        <div ref={exportMenuRef} className="relative self-start sm:self-auto">
          <button
            type="button"
            disabled={!report || loading}
            onClick={() => setExportMenuOpen((prev) => !prev)}
            aria-expanded={exportMenuOpen}
            aria-haspopup="menu"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap"
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            <span>Xuất báo cáo</span>
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </button>

          {exportMenuOpen && (
            <div
              role="menu"
              className="absolute right-0 z-30 mt-2 w-64 rounded-xl border border-[#E6E2DC] bg-white p-1.5 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={handleExportCsv}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#FDF5F1] cursor-pointer"
              >
                <FileSpreadsheet
                  className="h-4 w-4 shrink-0 mt-0.5 text-[#15803D]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-[#1F1D1A]">
                    Xuất file CSV (Excel)
                  </p>
                  <p className="text-xs text-[#6E675E]">
                    Chuẩn UTF-8 BOM hiển thị tiếng Việt có dấu
                  </p>
                </div>
              </button>

              <button
                type="button"
                role="menuitem"
                onClick={handleOpenPrintPreview}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-[#FDF5F1] cursor-pointer"
              >
                <Printer
                  className="h-4 w-4 shrink-0 mt-0.5 text-[#C2572B]"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-[#1F1D1A]">
                    Xem trước &amp; In PDF
                  </p>
                  <p className="text-xs text-[#6E675E]">
                    Bản in báo cáo chuẩn có đầy đủ bảng số liệu
                  </p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bộ lọc khoảng thời gian */}
      <section
        aria-label="Bộ lọc khoảng thời gian thống kê"
        className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between rounded-xl border border-[#E6E2DC] bg-white px-5 py-3.5"
      >
        <div
          role="group"
          aria-label="Chọn nhanh khoảng thời gian"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F2EFEA] p-1 self-start"
        >
          {DATE_PRESETS.map((option) => {
            const active = preset === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreset(option.value)}
                className={`h-8 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                  active
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {preset === 'CUSTOM' ? (
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <label className="flex items-center gap-2 text-[#5E5850]">
              <span>Từ ngày</span>
              <input
                type="date"
                aria-label="Từ ngày"
                value={customStart}
                min="2026-10-22"
                max={REPORT_REFERENCE_TODAY}
                onChange={(e) => setCustomStart(e.target.value)}
                className="h-9 rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] px-2.5 text-xs text-[#1F1D1A] tabular-nums focus:border-[#C2572B] focus:bg-white focus:outline-none"
              />
            </label>
            <label className="flex items-center gap-2 text-[#5E5850]">
              <span>Đến ngày</span>
              <input
                type="date"
                aria-label="Đến ngày"
                value={customEnd}
                min="2026-10-22"
                max={REPORT_REFERENCE_TODAY}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="h-9 rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] px-2.5 text-xs text-[#1F1D1A] tabular-nums focus:border-[#C2572B] focus:bg-white focus:outline-none"
              />
            </label>
            {customRangeInvalid && (
              <span className="text-[#B45309]">
                Đã tự động sắp xếp lại khoảng ngày hợp lệ.
              </span>
            )}
          </div>
        ) : (
          <p className="text-xs text-[#6E675E] tabular-nums">
            {report
              ? `Kỳ dữ liệu: ${formatFullDateVi(report.startDate)} – ${formatFullDateVi(report.endDate)}`
              : 'Đang tổng hợp dữ liệu...'}
          </p>
        )}
      </section>

      {exportNotice && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{exportNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-xs font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="flex items-center justify-between gap-3 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={reload}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* 4 thẻ KPI tổng quan */}
      <section
        aria-label="Chỉ số doanh thu chính"
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <div className="rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#6E675E]">Tổng doanh thu</p>
          {loading || !report ? (
            <div className="h-8 w-36 rounded bg-[#EFECE6] animate-pulse" />
          ) : (
            <p className="font-display text-2xl font-bold text-[#9A3D18] tabular-nums">
              {formatVnd(report.totalRevenueVnd)}
            </p>
          )}
          <p className="text-xs text-[#7A7268]">
            Tổng thu đã quyết toán trong kỳ
          </p>
        </div>

        <div className="rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#6E675E]">Tổng số hóa đơn</p>
          {loading || !report ? (
            <div className="h-8 w-20 rounded bg-[#EFECE6] animate-pulse" />
          ) : (
            <p className="font-display text-2xl font-bold text-[#1F1D1A] tabular-nums">
              {report.totalInvoices.toLocaleString('vi-VN')}
            </p>
          )}
          <p className="text-xs text-[#7A7268]">Hóa đơn đã thanh toán (PAID)</p>
        </div>

        <div className="rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#6E675E]">
            Giá trị trung bình / đơn
          </p>
          {loading || !report ? (
            <div className="h-8 w-32 rounded bg-[#EFECE6] animate-pulse" />
          ) : (
            <p className="font-display text-2xl font-bold text-[#1F1D1A] tabular-nums">
              {formatVnd(report.averageOrderValueVnd)}
            </p>
          )}
          <p className="text-xs text-[#7A7268]">Doanh thu chia theo số hóa đơn</p>
        </div>

        <div className="rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-1.5">
          <p className="text-xs font-medium text-[#6E675E]">
            Món bán chạy nhất
          </p>
          {loading || !report ? (
            <div className="h-8 w-40 rounded bg-[#EFECE6] animate-pulse" />
          ) : report.bestSellingDish ? (
            <>
              <p
                className="font-display text-lg font-bold text-[#1F1D1A] leading-snug truncate"
                title={report.bestSellingDish.menuItemName}
              >
                {report.bestSellingDish.menuItemName}
              </p>
              <p className="text-xs text-[#15803D] font-medium tabular-nums">
                {report.bestSellingDish.quantitySold.toLocaleString('vi-VN')}{' '}
                phần · {formatVnd(report.bestSellingDish.revenueVnd)}
              </p>
            </>
          ) : (
            <p className="text-sm text-[#6E675E]">Chưa có dữ liệu</p>
          )}
        </div>
      </section>

      {/* Khu vực Biểu đồ Recharts: Doanh thu theo thời gian + Tỉ trọng danh mục */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Biểu đồ Cột / Đường doanh thu theo thời gian */}
        <section className="xl:col-span-8 rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-[#1F1D1A]">
                Biểu đồ doanh thu theo thời gian
              </h2>
              <p className="text-xs text-[#6E675E]">
                Đơn vị hiển thị VNĐ · Di chuột vào từng điểm để xem chi tiết
                ngày
              </p>
            </div>

            <div
              role="group"
              aria-label="Chọn kiểu biểu đồ doanh thu"
              className="inline-flex items-center gap-1 rounded-lg bg-[#F2EFEA] p-1 self-start sm:self-auto"
            >
              <button
                type="button"
                onClick={() => setChartStyle('bar')}
                aria-pressed={chartStyle === 'bar'}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  chartStyle === 'bar'
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                <BarChart3 className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Biểu đồ cột</span>
              </button>
              <button
                type="button"
                onClick={() => setChartStyle('line')}
                aria-pressed={chartStyle === 'line'}
                className={`inline-flex h-8 items-center gap-1.5 rounded-md px-3 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  chartStyle === 'line'
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                <LineChartIcon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Biểu đồ đường</span>
              </button>
            </div>
          </div>

          <div className="h-[310px] w-full" data-testid="revenue-trend-chart">
            {loading || !report ? (
              <div className="h-full w-full rounded-lg bg-[#FAF9F7] animate-pulse" />
            ) : report.dailySeries.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[#6E675E]">
                Không có dữ liệu doanh thu trong khoảng thời gian đã chọn.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartStyle === 'bar' ? (
                  <BarChart
                    data={report.dailySeries}
                    margin={{ top: 10, right: 12, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ECE8E1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#6E675E' }}
                      axisLine={{ stroke: '#E6E2DC' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCompactMillionVnd}
                      tick={{ fontSize: 12, fill: '#6E675E' }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatVnd(Number(value ?? 0)),
                        'Doanh thu',
                      ]}
                      labelFormatter={(label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { date?: string; invoiceCount?: number }
                          | undefined;
                        if (row?.date) {
                          return `Ngày ${formatFullDateVi(row.date)} (${row.invoiceCount ?? 0} hóa đơn)`;
                        }
                        return `Ngày ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #E6E2DC',
                        fontSize: '12px',
                        boxShadow: '0 8px 20px rgba(31,29,26,0.08)',
                      }}
                    />
                    <Bar
                      dataKey="revenueVnd"
                      fill="#C2572B"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={44}
                    />
                  </BarChart>
                ) : (
                  <LineChart
                    data={report.dailySeries}
                    margin={{ top: 10, right: 16, left: 4, bottom: 4 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#ECE8E1"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 12, fill: '#6E675E' }}
                      axisLine={{ stroke: '#E6E2DC' }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={formatCompactMillionVnd}
                      tick={{ fontSize: 12, fill: '#6E675E' }}
                      axisLine={false}
                      tickLine={false}
                      width={52}
                    />
                    <Tooltip
                      formatter={(value) => [
                        formatVnd(Number(value ?? 0)),
                        'Doanh thu',
                      ]}
                      labelFormatter={(label, payload) => {
                        const row = payload?.[0]?.payload as
                          | { date?: string; invoiceCount?: number }
                          | undefined;
                        if (row?.date) {
                          return `Ngày ${formatFullDateVi(row.date)} (${row.invoiceCount ?? 0} hóa đơn)`;
                        }
                        return `Ngày ${label}`;
                      }}
                      contentStyle={{
                        borderRadius: '10px',
                        border: '1px solid #E6E2DC',
                        fontSize: '12px',
                        boxShadow: '0 8px 20px rgba(31,29,26,0.08)',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenueVnd"
                      stroke="#C2572B"
                      strokeWidth={2.5}
                      dot={{ r: 4, fill: '#C2572B', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 6, fill: '#9A3D18' }}
                    />
                  </LineChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </section>

        {/* Biểu đồ tròn tỉ trọng theo danh mục món */}
        <section className="xl:col-span-4 rounded-xl border border-[#E6E2DC] bg-white p-5 flex flex-col justify-between space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-[#1F1D1A]">
              Tỉ trọng theo danh mục món
            </h2>
            <p className="text-xs text-[#6E675E]">
              Cơ cấu đóng góp doanh thu giữa các nhóm thực đơn
            </p>
          </div>

          <div className="h-[200px] w-full" data-testid="category-pie-chart">
            {loading || !report ? (
              <div className="h-full w-full rounded-lg bg-[#FAF9F7] animate-pulse" />
            ) : report.categoryShares.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-[#6E675E]">
                Chưa có dữ liệu danh mục.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={report.categoryShares}
                    dataKey="revenueVnd"
                    nameKey="label"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={82}
                    paddingAngle={2}
                  >
                    {report.categoryShares.map((entry) => (
                      <Cell
                        key={entry.category}
                        fill={CATEGORY_COLORS[entry.category]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [
                      formatVnd(Number(value ?? 0)),
                      'Doanh thu',
                    ]}
                    contentStyle={{
                      borderRadius: '10px',
                      border: '1px solid #E6E2DC',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <ul className="divide-y divide-[#EFECE6] border-t border-[#EFECE6]">
            {(report?.categoryShares ?? []).map((share) => (
              <li
                key={share.category}
                className="flex items-center justify-between gap-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    aria-hidden="true"
                    className="h-2.5 w-2.5 shrink-0 rounded-xs"
                    style={{ backgroundColor: CATEGORY_COLORS[share.category] }}
                  />
                  <span className="font-medium text-[#1F1D1A] truncate">
                    {share.label}
                  </span>
                </div>
                <div className="text-right tabular-nums shrink-0">
                  <span className="font-semibold text-[#1F1D1A]">
                    {share.percentage}%
                  </span>
                  <span className="text-[#6E675E]">
                    {' '}
                    · {formatVnd(share.revenueVnd)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Bảng xếp hạng món bán chạy trong kỳ */}
      <section className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#E6E2DC]">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#C2572B]" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-[#1F1D1A]">
              Hiệu suất bán hàng theo món trong kỳ
            </h2>
          </div>
          <span className="font-mono text-xs text-[#6E675E] hidden sm:inline">
            GET /api/reports/revenue
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E6E2DC] bg-[#FAF9F7] text-xs font-semibold text-[#5E5850]">
                <th scope="col" className="px-5 py-3 whitespace-nowrap">
                  Hạng
                </th>
                <th scope="col" className="px-5 py-3 whitespace-nowrap">
                  Tên món ăn
                </th>
                <th scope="col" className="px-5 py-3 whitespace-nowrap">
                  Danh mục
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-right whitespace-nowrap"
                >
                  Số lượng bán
                </th>
                <th
                  scope="col"
                  className="px-5 py-3 text-right whitespace-nowrap"
                >
                  Doanh thu đóng góp
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE6] text-sm">
              {loading || !report ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="h-11">
                    {Array.from({ length: 5 }).map((__, cIdx) => (
                      <td key={cIdx} className="px-5 py-3">
                        <div className="h-4 w-24 rounded bg-[#EFECE6] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                report.topDishes.slice(0, 8).map((dish, idx) => (
                  <tr
                    key={dish.menuItemId}
                    className="h-11 transition-colors hover:bg-[#FAF9F7]"
                  >
                    <td className="px-5 py-2.5 font-mono text-xs font-semibold text-[#6E675E] tabular-nums">
                      #{idx + 1}
                    </td>
                    <td className="px-5 py-2.5 font-medium text-[#1F1D1A]">
                      {dish.menuItemName}
                    </td>
                    <td className="px-5 py-2.5 text-[#5E5850] whitespace-nowrap">
                      {MENU_CATEGORY_LABELS[dish.category]}
                    </td>
                    <td className="px-5 py-2.5 text-right tabular-nums text-[#1F1D1A]">
                      {dish.quantitySold.toLocaleString('vi-VN')} phần
                    </td>
                    <td className="px-5 py-2.5 text-right font-semibold tabular-nums text-[#1F1D1A]">
                      {formatVnd(dish.revenueVnd)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modal xem trước bản in PDF */}
      <ReportPrintPreviewModal
        open={printPreviewOpen}
        report={report}
        onClose={() => setPrintPreviewOpen(false)}
      />
    </div>
  );
}
