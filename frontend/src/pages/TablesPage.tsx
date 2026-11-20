import { FormEvent, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  Phone,
  ReceiptText,
  User as UserIcon,
  Users,
  XCircle,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { useRestaurant } from '../context/RestaurantContext';
import {
  DiningTable,
  OrderStatus,
  TableArea,
  TableStatus,
} from '../types';
import {
  formatDateTimeVi,
  formatVnd,
  TABLE_AREA_LABELS,
} from '../utils';

type AreaFilter = 'ALL' | TableArea.FLOOR_1 | TableArea.FLOOR_2 | TableArea.VIP_ROOM;

const AREA_ORDER: TableArea[] = [
  TableArea.FLOOR_1,
  TableArea.FLOOR_2,
  TableArea.VIP_ROOM,
];

const AREA_TABS: { value: AreaFilter; label: string }[] = [
  { value: 'ALL', label: 'Tất cả khu vực' },
  { value: TableArea.FLOOR_1, label: TABLE_AREA_LABELS[TableArea.FLOOR_1] },
  { value: TableArea.FLOOR_2, label: TABLE_AREA_LABELS[TableArea.FLOOR_2] },
  { value: TableArea.VIP_ROOM, label: TABLE_AREA_LABELS[TableArea.VIP_ROOM] },
];

const STATUS_SHORT_LABEL: Record<TableStatus, string> = {
  [TableStatus.AVAILABLE]: 'Trống',
  [TableStatus.RESERVED]: 'Đã đặt trước',
  [TableStatus.OCCUPIED]: 'Đang phục vụ',
  [TableStatus.CLEANING]: 'Đang dọn dẹp',
};

const TABLE_CARD_THEME: Record<
  TableStatus,
  {
    surface: string;
    selectedRing: string;
    accentBar: string;
    statusText: string;
    codeBg: string;
  }
> = {
  [TableStatus.AVAILABLE]: {
    surface: 'bg-[#F3FBF6] border-[#A7DFC0] hover:border-[#15803D]',
    selectedRing: 'ring-2 ring-[#15803D] border-[#15803D]',
    accentBar: 'bg-[#16A34A]',
    statusText: 'text-[#15803D]',
    codeBg: 'bg-[#DCFCE7] text-[#166534]',
  },
  [TableStatus.RESERVED]: {
    surface: 'bg-[#FFFBEB] border-[#F4CF7B] hover:border-[#B45309]',
    selectedRing: 'ring-2 ring-[#B45309] border-[#B45309]',
    accentBar: 'bg-[#D97706]',
    statusText: 'text-[#B45309]',
    codeBg: 'bg-[#FEF3C7] text-[#92400E]',
  },
  [TableStatus.OCCUPIED]: {
    surface: 'bg-[#FEF4F2] border-[#F3B5AE] hover:border-[#B91C1C]',
    selectedRing: 'ring-2 ring-[#B91C1C] border-[#B91C1C]',
    accentBar: 'bg-[#DC2626]',
    statusText: 'text-[#B91C1C]',
    codeBg: 'bg-[#FEE2E2] text-[#991B1B]',
  },
  [TableStatus.CLEANING]: {
    surface: 'bg-[#F7F6F4] border-[#DCD7CE] hover:border-[#6E675E]',
    selectedRing: 'ring-2 ring-[#6E675E] border-[#6E675E]',
    accentBar: 'bg-[#8A8378]',
    statusText: 'text-[#5E5850]',
    codeBg: 'bg-[#E6E2DC] text-[#4A453E]',
  },
};

export function TablesPage() {
  const {
    tables,
    orders,
    loading,
    error,
    refreshAll,
    updateTable,
    goToPosForTable,
    goToBillingForTable,
  } = useRestaurant();

  const [areaFilter, setAreaFilter] = useState<AreaFilter>('ALL');
  const [selectedTableId, setSelectedTableId] = useState<number | null>(null);
  const [busyAction, setBusyAction] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Form đặt bàn trước (khi bàn đang Trống)
  const [showReserveForm, setShowReserveForm] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestCount, setGuestCount] = useState('2');
  const [arrivalTime, setArrivalTime] = useState('19:00');
  const [reserveFormError, setReserveFormError] = useState<string | null>(null);

  // Xác nhận hủy đặt bàn
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);

  // Mặc định chọn bàn đầu tiên khi tải xong dữ liệu
  useEffect(() => {
    if (selectedTableId === null && tables.length > 0) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  // Reset form đặt bàn khi chuyển sang bàn khác
  useEffect(() => {
    setShowReserveForm(false);
    setReserveFormError(null);
    setGuestName('');
    setGuestPhone('');
    setArrivalTime('19:00');
  }, [selectedTableId]);

  const selectedTable: DiningTable | null = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [tables, selectedTableId]
  );

  const selectedTableActiveOrder = useMemo(() => {
    if (!selectedTable) return null;
    return (
      orders.find(
        (order) =>
          order.tableId === selectedTable.id &&
          order.status !== OrderStatus.SERVED &&
          order.status !== OrderStatus.CANCELLED
      ) ?? null
    );
  }, [orders, selectedTable]);

  const counts = useMemo(() => {
    let available = 0;
    let reserved = 0;
    let occupied = 0;
    for (const table of tables) {
      if (table.status === TableStatus.AVAILABLE) available += 1;
      else if (table.status === TableStatus.RESERVED) reserved += 1;
      else if (table.status === TableStatus.OCCUPIED) occupied += 1;
    }
    return { available, reserved, occupied };
  }, [tables]);

  const visibleAreas = useMemo(() => {
    const areasToShow =
      areaFilter === 'ALL' ? AREA_ORDER : [areaFilter as TableArea];
    return areasToShow
      .map((area) => ({
        area,
        label: TABLE_AREA_LABELS[area],
        tables: tables.filter((t) => t.area === area),
      }))
      .filter((group) => group.tables.length > 0);
  }, [areaFilter, tables]);

  async function handleCheckInTable(table: DiningTable) {
    setBusyAction(true);
    setFeedback(null);
    try {
      await updateTable(table.id, {
        status: TableStatus.OCCUPIED,
        reservedCustomerName: null,
        reservedCustomerPhone: null,
        reservedGuestCount: null,
        reservedAt: null,
      });
      setFeedback({
        type: 'success',
        message: `Đã nhận ${table.tableName}. Bạn có thể chuyển sang màn hình gọi món ngay.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể cập nhật trạng thái bàn.',
      });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleConfirmCancelReservation() {
    if (!selectedTable) return;
    setBusyAction(true);
    setFeedback(null);
    try {
      await updateTable(selectedTable.id, {
        status: TableStatus.AVAILABLE,
        currentOrderId: null,
        reservedCustomerName: null,
        reservedCustomerPhone: null,
        reservedGuestCount: null,
        reservedAt: null,
      });
      setConfirmCancelOpen(false);
      setFeedback({
        type: 'success',
        message: `Đã hủy đặt trước cho ${selectedTable.tableName}. Bàn đã sẵn sàng đón khách.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể hủy đặt bàn.',
      });
      setConfirmCancelOpen(false);
    } finally {
      setBusyAction(false);
    }
  }

  async function handleReleaseEmptyTable(table: DiningTable) {
    setBusyAction(true);
    setFeedback(null);
    try {
      await updateTable(table.id, {
        status: TableStatus.AVAILABLE,
        currentOrderId: null,
      });
      setFeedback({
        type: 'success',
        message: `Đã chuyển ${table.tableName} về trạng thái Trống.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể cập nhật trạng thái bàn.',
      });
    } finally {
      setBusyAction(false);
    }
  }

  async function handleCreateReservation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTable) return;

    const trimmedName = guestName.trim();
    const trimmedPhone = guestPhone.trim();
    const parsedGuests = Number(guestCount);

    if (trimmedName.length < 2) {
      setReserveFormError('Vui lòng nhập họ tên khách đặt bàn.');
      return;
    }
    if (!/^0\d{8,10}$/.test(trimmedPhone.replace(/\s+/g, ''))) {
      setReserveFormError('Số điện thoại không hợp lệ (ví dụ: 0912345678).');
      return;
    }
    if (
      !Number.isInteger(parsedGuests) ||
      parsedGuests < 1 ||
      parsedGuests > selectedTable.capacity
    ) {
      setReserveFormError(
        `Số lượng khách phải từ 1 đến ${selectedTable.capacity} người.`
      );
      return;
    }

    setBusyAction(true);
    setReserveFormError(null);
    setFeedback(null);
    try {
      const isoArrival = `2026-11-20T${arrivalTime || '19:00'}:00+07:00`;
      await updateTable(selectedTable.id, {
        status: TableStatus.RESERVED,
        reservedCustomerName: trimmedName,
        reservedCustomerPhone: trimmedPhone,
        reservedGuestCount: parsedGuests,
        reservedAt: isoArrival,
      });
      setShowReserveForm(false);
      setFeedback({
        type: 'success',
        message: `Đã ghi nhận đặt trước ${selectedTable.tableName} cho khách ${trimmedName}.`,
      });
    } catch (err) {
      setReserveFormError(
        err instanceof Error ? err.message : 'Không thể lưu lịch đặt bàn.'
      );
    } finally {
      setBusyAction(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề & chú giải trạng thái */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Quản lý đặt bàn
          </h1>
          <p className="text-sm text-[#5E5850]">
            Theo dõi sơ đồ bàn trực quan theo khu vực, kiểm tra thông tin khách
            đặt và điều phối nhận bàn nhanh sang màn hình gọi món.
          </p>
        </div>

        <div
          aria-label="Chú giải tình trạng bàn"
          className="flex flex-wrap items-center gap-4 text-xs font-medium text-[#4A453E]"
        >
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              className="h-3 w-3 rounded-xs bg-[#16A34A]"
              aria-hidden="true"
            />
            <span>
              Trống (<strong className="tabular-nums">{counts.available}</strong>)
            </span>
          </span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              className="h-3 w-3 rounded-xs bg-[#D97706]"
              aria-hidden="true"
            />
            <span>
              Đã đặt trước (
              <strong className="tabular-nums">{counts.reserved}</strong>)
            </span>
          </span>
          <span className="inline-flex items-center gap-2 whitespace-nowrap">
            <span
              className="h-3 w-3 rounded-xs bg-[#DC2626]"
              aria-hidden="true"
            />
            <span>
              Đang phục vụ (
              <strong className="tabular-nums">{counts.occupied}</strong>)
            </span>
          </span>
        </div>
      </div>

      {/* Bộ lọc khu vực */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          role="group"
          aria-label="Lọc theo khu vực bàn"
          className="flex flex-wrap items-center gap-1 rounded-lg bg-[#EBE7E0] p-1"
        >
          {AREA_TABS.map((tab) => {
            const active = areaFilter === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                onClick={() => setAreaFilter(tab.value)}
                className={`h-9 rounded-md px-3.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-[#C2572B] ${
                  active
                    ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                    : 'text-[#5E5850] hover:text-[#1F1D1A]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <p className="text-xs text-[#6E675E] tabular-nums">
          Tổng sức chứa:{' '}
          <strong className="text-[#1F1D1A]">
            {tables.reduce((sum, t) => sum + t.capacity, 0)} chỗ ngồi
          </strong>{' '}
          trên {tables.length} bàn
        </p>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
              : 'border-[#F3C5C0] bg-[#FEF3F2] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
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
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void refreshAll()}
            className="text-xs font-semibold underline cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Bố cục chính: Sơ đồ bàn bên trái (8 cột) + Bảng chi tiết bàn bên phải (4 cột) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Sơ đồ bàn trực quan phân khu vực */}
        <div className="xl:col-span-8 space-y-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div
                  key={idx}
                  className="h-36 rounded-xl border border-[#E6E2DC] bg-white animate-pulse"
                />
              ))}
            </div>
          ) : (
            visibleAreas.map((group) => (
              <section
                key={group.area}
                aria-label={`Khu vực ${group.label}`}
                className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-[#EFECE6] bg-[#FAF9F7] px-5 py-3">
                  <h2 className="font-display text-sm font-bold text-[#1F1D1A]">
                    {group.label}
                  </h2>
                  <span className="text-xs text-[#6E675E] tabular-nums">
                    {group.tables.length} bàn
                  </span>
                </div>

                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {group.tables.map((table) => {
                    const theme = TABLE_CARD_THEME[table.status];
                    const isSelected = table.id === selectedTableId;
                    const activeOrder = orders.find(
                      (o) =>
                        o.tableId === table.id &&
                        o.status !== OrderStatus.SERVED &&
                        o.status !== OrderStatus.CANCELLED
                    );

                    return (
                      <button
                        key={table.id}
                        type="button"
                        onClick={() => setSelectedTableId(table.id)}
                        aria-pressed={isSelected}
                        data-testid={`table-card-${table.tableCode}`}
                        className={`group relative flex flex-col justify-between rounded-xl border p-4 text-left transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] ${theme.surface} ${
                          isSelected ? theme.selectedRing : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-bold ${theme.codeBg}`}
                            >
                              {table.tableCode}
                            </span>
                            <p className="mt-1.5 font-display text-base font-bold text-[#1F1D1A]">
                              {table.tableName}
                            </p>
                          </div>

                          <div className="flex items-center gap-1 text-xs font-medium text-[#5E5850] tabular-nums shrink-0">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{table.capacity} chỗ</span>
                          </div>
                        </div>

                        <div className="mt-4 pt-3 border-t border-black/8 flex items-center justify-between gap-2">
                          <span
                            className={`text-xs font-bold whitespace-nowrap shrink-0 ${theme.statusText}`}
                          >
                            {STATUS_SHORT_LABEL[table.status]}
                          </span>

                          {table.status === TableStatus.RESERVED &&
                            table.reservedCustomerName && (
                              <span className="text-[11px] font-medium text-[#78350F] truncate max-w-[130px]">
                                {table.reservedCustomerName}
                              </span>
                            )}

                          {table.status === TableStatus.OCCUPIED &&
                            activeOrder && (
                              <span className="text-[11px] font-semibold text-[#991B1B] tabular-nums whitespace-nowrap">
                                {formatVnd(activeOrder.subtotalVnd)}
                              </span>
                            )}

                          {table.status === TableStatus.OCCUPIED &&
                            !activeOrder && (
                              <span className="text-[11px] text-[#991B1B] whitespace-nowrap">
                                Chưa gọi món
                              </span>
                            )}

                          {table.status === TableStatus.AVAILABLE && (
                            <span className="text-[11px] text-[#166534] whitespace-nowrap">
                              Sẵn sàng
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>
            ))
          )}
        </div>

        {/* CỘT PHẢI: Bảng chi tiết bàn đang chọn */}
        <aside
          aria-label="Chi tiết bàn đang chọn"
          className="xl:col-span-4 xl:sticky xl:top-6 rounded-xl border border-[#E6E2DC] bg-white overflow-hidden"
        >
          {!selectedTable ? (
            <div className="p-8 text-center text-sm text-[#6E675E]">
              Chọn một bàn trên sơ đồ bên trái để xem thông tin chi tiết và cập
              nhật trạng thái.
            </div>
          ) : (
            <>
              {/* Header chi tiết bàn */}
              <div className="border-b border-[#E6E2DC] bg-[#FAF9F7] px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-[#6E675E]">
                      {TABLE_AREA_LABELS[selectedTable.area]} · Mã{' '}
                      <span className="font-mono font-semibold text-[#1F1D1A]">
                        {selectedTable.tableCode}
                      </span>
                    </p>
                    <h2 className="mt-0.5 font-display text-xl font-bold text-[#1F1D1A]">
                      {selectedTable.tableName}
                    </h2>
                  </div>

                  <span
                    className={`text-xs font-bold whitespace-nowrap ${
                      TABLE_CARD_THEME[selectedTable.status].statusText
                    }`}
                  >
                    {STATUS_SHORT_LABEL[selectedTable.status]}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-[#5E5850]">
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Users className="h-3.5 w-3.5" aria-hidden="true" />
                    Sức chứa tối đa {selectedTable.capacity} khách
                  </span>
                </div>
              </div>

              {/* Nội dung theo tình trạng bàn */}
              <div className="p-5 space-y-5">
                {/* 1. BÀN ĐÃ ĐẶT TRƯỚC */}
                {selectedTable.status === TableStatus.RESERVED && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6E675E]">
                        Thông tin khách đặt trước
                      </h3>
                      <dl className="space-y-2.5 rounded-lg border border-[#F4CF7B] bg-[#FFFBEB] p-4 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <dt className="inline-flex items-center gap-1.5 text-xs text-[#78350F]">
                            <UserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            Khách hàng
                          </dt>
                          <dd className="font-semibold text-[#1F1D1A] text-right">
                            {selectedTable.reservedCustomerName || 'Chưa cập nhật'}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <dt className="inline-flex items-center gap-1.5 text-xs text-[#78350F]">
                            <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                            Số điện thoại
                          </dt>
                          <dd className="font-mono text-xs font-semibold text-[#1F1D1A] text-right">
                            {selectedTable.reservedCustomerPhone || '—'}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <dt className="inline-flex items-center gap-1.5 text-xs text-[#78350F]">
                            <CalendarClock
                              className="h-3.5 w-3.5"
                              aria-hidden="true"
                            />
                            Giờ dự kiến đến
                          </dt>
                          <dd className="text-xs font-semibold text-[#1F1D1A] tabular-nums text-right">
                            {formatDateTimeVi(selectedTable.reservedAt)}
                          </dd>
                        </div>

                        <div className="flex items-center justify-between gap-2">
                          <dt className="inline-flex items-center gap-1.5 text-xs text-[#78350F]">
                            <Users className="h-3.5 w-3.5" aria-hidden="true" />
                            Số khách đặt
                          </dt>
                          <dd className="text-xs font-semibold text-[#1F1D1A] tabular-nums text-right">
                            {selectedTable.reservedGuestCount ?? selectedTable.capacity}{' '}
                            khách
                          </dd>
                        </div>
                      </dl>
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => void handleCheckInTable(selectedTable)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-60 cursor-pointer"
                      >
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        <span>Nhận bàn</span>
                      </button>

                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => setConfirmCancelOpen(true)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#F3C5C0] bg-white px-4 text-sm font-medium text-[#B91C1C] transition-colors hover:bg-[#FEF3F2] disabled:opacity-60 cursor-pointer"
                      >
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        <span>Hủy đặt bàn</span>
                      </button>
                    </div>
                  </>
                )}

                {/* 2. BÀN ĐANG PHỤC VỤ */}
                {selectedTable.status === TableStatus.OCCUPIED && (
                  <>
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-[#6E675E]">
                        Tình trạng phục vụ hiện tại
                      </h3>

                      {selectedTableActiveOrder ? (
                        <div className="rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] p-4 space-y-2.5 text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#6E675E]">
                              Mã đơn hiện tại
                            </span>
                            <span className="font-mono text-xs font-semibold text-[#1F1D1A]">
                              {selectedTableActiveOrder.orderCode}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#6E675E]">
                              Số món đã gọi
                            </span>
                            <span className="text-xs font-semibold text-[#1F1D1A] tabular-nums">
                              {selectedTableActiveOrder.items.length} dòng món (
                              {selectedTableActiveOrder.guestCount} khách)
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs text-[#6E675E]">
                              Giờ mở bàn
                            </span>
                            <span className="text-xs text-[#4A453E] tabular-nums">
                              {formatDateTimeVi(selectedTableActiveOrder.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E6E2DC]">
                            <span className="text-xs font-medium text-[#5E5850]">
                              Tạm tính hiện tại
                            </span>
                            <span className="font-display text-base font-bold text-[#9A3D18] tabular-nums">
                              {formatVnd(selectedTableActiveOrder.subtotalVnd)}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-[#F3C5C0] bg-[#FEF4F2] p-4 text-xs text-[#991B1B] leading-relaxed">
                          Khách đã nhận bàn nhưng chưa tạo phiếu gọi món. Nhấn
                          nút bên dưới để mở màn hình POS gọi món cho bàn này.
                        </div>
                      )}
                    </div>

                    <div className="space-y-2.5">
                      <button
                        type="button"
                        onClick={() => goToPosForTable(selectedTable.id)}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] cursor-pointer"
                      >
                        <ClipboardList className="h-4 w-4" aria-hidden="true" />
                        <span>Chuyển sang màn hình gọi món</span>
                      </button>

                      {selectedTableActiveOrder ? (
                        <button
                          type="button"
                          onClick={() => goToBillingForTable(selectedTable.id)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] cursor-pointer"
                        >
                          <ReceiptText className="h-4 w-4" aria-hidden="true" />
                          <span>Đi tới thanh toán hóa đơn</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() =>
                            void handleReleaseEmptyTable(selectedTable)
                          }
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-medium text-[#5E5850] transition-colors hover:bg-[#F2EFEA] hover:text-[#1F1D1A] disabled:opacity-60 cursor-pointer"
                        >
                          <span>Trả bàn về Trống</span>
                        </button>
                      )}
                    </div>
                  </>
                )}

                {/* 3. BÀN TRỐNG */}
                {selectedTable.status === TableStatus.AVAILABLE && (
                  <>
                    <div className="rounded-lg border border-[#A7DFC0] bg-[#F3FBF6] p-4 text-xs text-[#166534] leading-relaxed">
                      {selectedTable.tableName} hiện đang trống và sẵn sàng phục
                      vụ khách vãng lai hoặc nhận đặt bàn trước.
                    </div>

                    {!showReserveForm ? (
                      <div className="space-y-2.5">
                        <button
                          type="button"
                          disabled={busyAction}
                          onClick={() => void handleCheckInTable(selectedTable)}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-60 cursor-pointer"
                        >
                          <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                          <span>Nhận bàn ngay (Khách vào bàn)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setGuestCount(
                              String(Math.min(2, selectedTable.capacity))
                            );
                            setShowReserveForm(true);
                          }}
                          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#DCD7CE] bg-white px-4 text-sm font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B]/50 hover:bg-[#FDF5F1] hover:text-[#9A3D18] cursor-pointer"
                        >
                          <CalendarClock className="h-4 w-4" aria-hidden="true" />
                          <span>Tạo lịch đặt bàn trước</span>
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => void handleCreateReservation(e)}
                        className="space-y-3.5 rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] p-4"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase tracking-wide text-[#1F1D1A]">
                            Đặt trước {selectedTable.tableName}
                          </h3>
                          <button
                            type="button"
                            onClick={() => setShowReserveForm(false)}
                            className="text-xs font-medium text-[#6E675E] hover:text-[#1F1D1A] cursor-pointer"
                          >
                            Hủy
                          </button>
                        </div>

                        {reserveFormError && (
                          <p
                            role="alert"
                            className="rounded-md border border-[#F3C5C0] bg-[#FEF3F2] px-3 py-2 text-xs text-[#B42318]"
                          >
                            {reserveFormError}
                          </p>
                        )}

                        <div className="space-y-1">
                          <label
                            htmlFor="reserve-guest-name"
                            className="block text-xs font-medium text-[#4A453E]"
                          >
                            Họ tên khách đặt
                          </label>
                          <input
                            id="reserve-guest-name"
                            type="text"
                            required
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Ví dụ: Chị Nguyễn Lan Anh"
                            className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-white px-3 text-sm text-[#1F1D1A] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                          />
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor="reserve-guest-phone"
                            className="block text-xs font-medium text-[#4A453E]"
                          >
                            Số điện thoại
                          </label>
                          <input
                            id="reserve-guest-phone"
                            type="tel"
                            required
                            value={guestPhone}
                            onChange={(e) => setGuestPhone(e.target.value)}
                            placeholder="0912345678"
                            className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-white px-3 text-sm text-[#1F1D1A] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label
                              htmlFor="reserve-guest-count"
                              className="block text-xs font-medium text-[#4A453E]"
                            >
                              Số khách
                            </label>
                            <input
                              id="reserve-guest-count"
                              type="number"
                              min={1}
                              max={selectedTable.capacity}
                              value={guestCount}
                              onChange={(e) => setGuestCount(e.target.value)}
                              className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-white px-3 text-sm tabular-nums text-[#1F1D1A] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                            />
                          </div>

                          <div className="space-y-1">
                            <label
                              htmlFor="reserve-arrival-time"
                              className="block text-xs font-medium text-[#4A453E]"
                            >
                              Giờ đến
                            </label>
                            <input
                              id="reserve-arrival-time"
                              type="time"
                              value={arrivalTime}
                              onChange={(e) => setArrivalTime(e.target.value)}
                              className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-white px-3 text-sm tabular-nums text-[#1F1D1A] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                            />
                          </div>
                        </div>

                        <button
                          type="submit"
                          disabled={busyAction}
                          className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-[#C2572B] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-60 cursor-pointer"
                        >
                          Xác nhận đặt bàn
                        </button>
                      </form>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] px-5 py-2.5 text-[11px] font-mono text-[#6E675E]">
                GET / PATCH /api/tables/{selectedTable.id}
              </div>
            </>
          )}
        </aside>
      </div>

      {/* Hộp thoại xác nhận hủy đặt bàn */}
      <ConfirmDialog
        open={confirmCancelOpen}
        title="Xác nhận hủy đặt bàn"
        description={
          selectedTable
            ? `Bạn có chắc muốn hủy lịch đặt trước của ${
                selectedTable.reservedCustomerName ?? 'khách hàng'
              } tại ${selectedTable.tableName}? Bàn sẽ được chuyển về trạng thái Trống.`
            : ''
        }
        confirmLabel="Hủy đặt bàn"
        loading={busyAction}
        onCancel={() => setConfirmCancelOpen(false)}
        onConfirm={() => void handleConfirmCancelReservation()}
      />
    </div>
  );
}
