import { useCallback } from 'react';
import {
  ModulePlaceholder,
  PreviewColumn,
  SummaryStat,
} from '../components/common/ModulePlaceholder';
import { useAsyncData } from '../hooks/useAsyncData';
import { discountService } from '../services';
import {
  DiscountCode,
  DiscountStatus,
  DiscountType,
  EndpointDoc,
} from '../types';
import { DISCOUNT_STATUS_LABELS, formatVnd } from '../utils';

const ENDPOINTS: EndpointDoc[] = [
  {
    method: 'GET',
    path: '/api/discounts',
    description: 'Lấy danh sách mã giảm giá và số lượt đã sử dụng',
  },
  {
    method: 'POST',
    path: '/api/discounts/validate',
    description: 'Kiểm tra điều kiện áp dụng mã cho giá trị đơn hàng hiện tại',
  },
  {
    method: 'POST',
    path: '/api/discounts',
    description: 'Tạo mới chương trình khuyến mãi theo phần trăm hoặc số tiền cố định',
  },
];

const STATUS_COLOR: Record<DiscountStatus, string> = {
  [DiscountStatus.ACTIVE]: 'text-[#15803D]',
  [DiscountStatus.EXPIRED]: 'text-[#B91C1C]',
  [DiscountStatus.DISABLED]: 'text-[#6E675E]',
};

const COLUMNS: PreviewColumn<DiscountCode>[] = [
  {
    key: 'code',
    header: 'Mã ưu đãi',
    render: (row) => (
      <span className="font-mono text-xs font-semibold text-[#9A3D18]">
        {row.code}
      </span>
    ),
  },
  {
    key: 'title',
    header: 'Chương trình',
    render: (row) => (
      <div>
        <p className="font-medium">{row.title}</p>
        <p className="text-xs text-[#6E675E]">{row.description}</p>
      </div>
    ),
  },
  {
    key: 'value',
    header: 'Mức giảm',
    align: 'right',
    render: (row) => (
      <span className="font-semibold">
        {row.type === DiscountType.PERCENTAGE
          ? `${row.value}%`
          : formatVnd(row.value)}
      </span>
    ),
  },
  {
    key: 'usage',
    header: 'Lượt dùng',
    align: 'right',
    render: (row) => (
      <span>
        {row.usedCount} / {row.usageLimit}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Trạng thái (Enum)',
    render: (row) => (
      <span className={`font-medium ${STATUS_COLOR[row.status]}`}>
        {DISCOUNT_STATUS_LABELS[row.status]}{' '}
        <span className="font-mono text-xs text-[#7A7268]">({row.status})</span>
      </span>
    ),
  },
];

export function DiscountsPage() {
  const fetchDiscounts = useCallback(async () => {
    const res = await discountService.getDiscountCodes();
    return res.data;
  }, []);

  const { data: discounts, loading, error, reload } = useAsyncData<
    DiscountCode[]
  >(fetchDiscounts, []);

  const activeCount = discounts.filter(
    (d) => d.status === DiscountStatus.ACTIVE
  ).length;
  const expiredCount = discounts.filter(
    (d) => d.status === DiscountStatus.EXPIRED
  ).length;
  const totalUses = discounts.reduce((sum, d) => sum + d.usedCount, 0);

  const stats: SummaryStat[] = [
    {
      label: 'Tổng mã khuyến mãi',
      value: String(discounts.length),
      hint: 'DiscountCode DTO',
    },
    {
      label: 'Đang áp dụng',
      value: String(activeCount),
      hint: 'ACTIVE',
    },
    {
      label: 'Đã hết hạn',
      value: String(expiredCount),
      hint: 'EXPIRED',
    },
    {
      label: 'Tổng lượt đã dùng',
      value: String(totalUses),
      hint: 'Cộng dồn toàn hệ thống',
    },
  ];

  return (
    <ModulePlaceholder
      title="Mã giảm giá"
      description="Trang chờ phát triển quản lý mã ưu đãi, kiểm tra điều kiện tối thiểu theo hóa đơn VNĐ và giới hạn lượt áp dụng."
      serviceModuleName="discountService.getDiscountCodes()"
      dtoName="DiscountCode"
      stats={stats}
      endpoints={ENDPOINTS}
      rows={discounts}
      columns={COLUMNS}
      getRowKey={(row) => row.id}
      loading={loading}
      error={error}
      onReload={reload}
      sampleDtoPayload={discounts[0] ?? null}
    />
  );
}
