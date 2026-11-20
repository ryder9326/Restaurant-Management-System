import { ReactNode, useState } from 'react';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Code2,
  RefreshCw,
} from 'lucide-react';
import { EndpointDoc } from '../../types';

export interface SummaryStat {
  label: string;
  value: string;
  hint?: string;
}

export interface PreviewColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T) => ReactNode;
}

interface ModulePlaceholderProps<T> {
  title: string;
  description: string;
  serviceModuleName: string;
  dtoName: string;
  stats: SummaryStat[];
  endpoints: EndpointDoc[];
  rows: T[];
  columns: PreviewColumn<T>[];
  getRowKey: (row: T) => string | number;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  sampleDtoPayload: unknown;
}

const METHOD_TEXT_COLORS: Record<EndpointDoc['method'], string> = {
  GET: 'text-[#15803D]',
  POST: 'text-[#C2572B]',
  PUT: 'text-[#B45309]',
  PATCH: 'text-[#B45309]',
  DELETE: 'text-[#B91C1C]',
};

export function ModulePlaceholder<T>({
  title,
  description,
  serviceModuleName,
  dtoName,
  stats,
  endpoints,
  rows,
  columns,
  getRowKey,
  loading,
  error,
  onReload,
  sampleDtoPayload,
}: ModulePlaceholderProps<T>) {
  const [showDtoJson, setShowDtoJson] = useState(false);

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang và nút làm mới dữ liệu giả lập */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5 min-w-0">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A] text-balance">
            {title}
          </h1>
          <p className="text-sm text-[#5E5850] max-w-2xl leading-relaxed">
            {description}
          </p>
        </div>

        <button
          type="button"
          onClick={onReload}
          disabled={loading}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-medium text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] disabled:opacity-60 cursor-pointer whitespace-nowrap self-start sm:self-auto"
        >
          <RefreshCw
            className={`h-4 w-4 ${loading ? 'animate-spin text-[#C2572B]' : 'text-[#6E675E]'}`}
            aria-hidden="true"
          />
          <span>Tải lại dữ liệu</span>
        </button>
      </div>

      {/* Dải chỉ số tổng hợp từ mock service (một khối duy nhất chia bằng đường kẻ mảnh) */}
      <section
        aria-label="Chỉ số tóm tắt"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-xl border border-[#E6E2DC] bg-white divide-y sm:divide-y-0 sm:divide-x divide-[#E6E2DC]"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="px-5 py-4 space-y-1">
            <p className="text-xs font-medium text-[#6E675E]">{stat.label}</p>
            {loading ? (
              <div className="h-7 w-24 rounded bg-[#EFECE6] animate-pulse" />
            ) : (
              <p className="font-display text-xl font-bold text-[#1F1D1A] tabular-nums">
                {stat.value}
              </p>
            )}
            {stat.hint && (
              <p className="text-xs text-[#7A7268] truncate">{stat.hint}</p>
            )}
          </div>
        ))}
      </section>

      {/* Khung trang chờ phát triển + Bảng kiểm chứng dữ liệu mock service */}
      <section className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-[#E6E2DC]">
          <div>
            <h2 className="font-display text-base font-semibold text-[#1F1D1A]">
              Khung phân hệ chờ phát triển chi tiết
            </h2>
            <p className="mt-0.5 text-xs text-[#6E675E]">
              Đã kết nối sẵn dịch vụ{' '}
              <span className="font-mono text-[#1F1D1A]">{serviceModuleName}</span>
              <span aria-hidden="true"> · </span>
              DTO <span className="font-mono text-[#1F1D1A]">{dtoName}</span>
            </p>
          </div>
          <p className="text-xs text-[#6E675E] tabular-nums whitespace-nowrap">
            {loading ? 'Đang tải...' : `${rows.length} bản ghi mẫu`}
          </p>
        </div>

        {/* Trạng thái lỗi */}
        {error && (
          <div
            role="alert"
            className="mx-5 my-4 flex items-center justify-between gap-3 rounded-lg border border-[#F3C5C0] bg-[#FEF3F2] px-4 py-3 text-sm text-[#B42318]"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={onReload}
              className="text-xs font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Bảng dữ liệu mẫu xác nhận luồng types -> mocks -> services */}
        {!error && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E6E2DC] bg-[#FAF9F7] text-xs font-semibold text-[#5E5850]">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      scope="col"
                      className={`px-5 py-3 whitespace-nowrap ${
                        column.align === 'right' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {column.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFECE6] text-sm">
                {loading ? (
                  Array.from({ length: 4 }).map((_, index) => (
                    <tr key={index} className="h-11">
                      {columns.map((col) => (
                        <td key={col.key} className="px-5 py-3">
                          <div className="h-4 w-28 rounded bg-[#EFECE6] animate-pulse" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-5 py-10 text-center text-sm text-[#6E675E]"
                    >
                      Chưa có dữ liệu mẫu cho phân hệ này. Nhấn &ldquo;Tải lại
                      dữ liệu&rdquo; để đồng bộ.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr
                      key={getRowKey(row)}
                      className="h-11 transition-colors hover:bg-[#FAF9F7]"
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={`px-5 py-2.5 text-[#1F1D1A] ${
                            column.align === 'right'
                              ? 'text-right tabular-nums'
                              : 'text-left'
                          }`}
                        >
                          {column.render(row)}
                        </td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Hợp đồng REST API Java Backend & JSON DTO mẫu */}
        <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] px-5 py-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1F1D1A]">
                Đường dẫn Java REST API dự kiến tích hợp
              </h3>
              <p className="text-xs text-[#6E675E]">
                Thay thế hàm giả lập bằng <span className="font-mono">axios</span>{' '}
                trong <span className="font-mono">src/services/</span> mà không
                cần sửa giao diện.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDtoJson((prev) => !prev)}
              aria-expanded={showDtoJson}
              className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-[#DCD7CE] bg-white px-3 text-xs font-medium text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:text-[#9A3D18] focus-visible:outline-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              <Code2 className="h-3.5 w-3.5 text-[#C2572B]" aria-hidden="true" />
              <span>
                {showDtoJson ? 'Ẩn cấu trúc JSON DTO' : 'Xem cấu trúc JSON DTO'}
              </span>
              {showDtoJson ? (
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
          </div>

          <ul className="divide-y divide-[#E6E2DC] border-t border-[#E6E2DC]">
            {endpoints.map((endpoint) => (
              <li
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between py-2.5 text-xs"
              >
                <div className="flex items-center gap-3 font-mono min-w-0">
                  <span
                    className={`w-12 shrink-0 font-semibold ${METHOD_TEXT_COLORS[endpoint.method]}`}
                  >
                    {endpoint.method}
                  </span>
                  <span className="text-[#1F1D1A] truncate">
                    {endpoint.path}
                  </span>
                </div>
                <span className="text-[#5E5850] sm:text-right">
                  {endpoint.description}
                </span>
              </li>
            ))}
          </ul>

          {showDtoJson && (
            <div className="rounded-lg border border-[#E6E2DC] bg-[#1F1D1A] p-4 overflow-x-auto">
              <pre className="font-mono text-xs leading-relaxed text-[#F2EFEA]">
                {JSON.stringify(sampleDtoPayload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
