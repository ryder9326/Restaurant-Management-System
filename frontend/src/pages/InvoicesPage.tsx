import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Banknote,
  CheckCircle2,
  CreditCard,
  Minus,
  Pencil,
  Plus,
  Printer,
  ReceiptText,
  Save,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import {
  ReceiptSnapshot,
  ThermalReceiptModal,
} from '../components/invoices/ThermalReceiptModal';
import { VietQrBox } from '../components/invoices/VietQrBox';
import { useRestaurant } from '../context/RestaurantContext';
import {
  Order,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  UpdateOrderItemChange,
} from '../types';
import {
  calculateCashChange,
  calculateInvoiceTotals,
  formatDateTimeVi,
  formatVnd,
  ORDER_ITEM_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
} from '../utils';

interface EditableItemState {
  orderItemId: number;
  quantity: number;
  status: OrderItemStatus;
}

const ITEM_STATUS_COLOR: Record<OrderItemStatus, string> = {
  [OrderItemStatus.PENDING]: 'text-[#B45309]',
  [OrderItemStatus.COOKING]: 'text-[#C2572B]',
  [OrderItemStatus.COMPLETED]: 'text-[#15803D]',
  [OrderItemStatus.CANCELLED]: 'text-[#8A8378] line-through',
};

const QUICK_CASH_AMOUNTS = [200000, 500000, 1000000, 2000000];

export function InvoicesPage() {
  const {
    currentUser,
    tables,
    orders,
    invoices,
    loading,
    selectedBillingTableId,
    setSelectedBillingTableId,
    updateOrderItems,
    validateDiscount,
    checkoutOrder,
    goToPosForTable,
  } = useRestaurant();

  // Danh sách các đơn hàng đang mở (chưa thanh toán) cần tính tiền
  const unpaidOrders = useMemo(
    () =>
      orders.filter(
        (order) =>
          order.status !== OrderStatus.SERVED &&
          order.status !== OrderStatus.CANCELLED
      ),
    [orders]
  );

  // Tự động chọn bàn cần thanh toán
  useEffect(() => {
    if (unpaidOrders.length === 0) {
      if (selectedBillingTableId !== null) setSelectedBillingTableId(null);
      return;
    }
    const hasSelected = unpaidOrders.some(
      (o) => o.tableId === selectedBillingTableId
    );
    if (!hasSelected) {
      setSelectedBillingTableId(unpaidOrders[0].tableId);
    }
  }, [unpaidOrders, selectedBillingTableId, setSelectedBillingTableId]);

  const activeOrder: Order | null = useMemo(
    () =>
      unpaidOrders.find((o) => o.tableId === selectedBillingTableId) ?? null,
    [unpaidOrders, selectedBillingTableId]
  );

  // Chế độ chỉnh sửa món chưa nấu (PENDING) trước khi tính tiền
  const [editingOrder, setEditingOrder] = useState(false);
  const [draftEdits, setDraftEdits] = useState<Record<number, EditableItemState>>(
    {}
  );
  const [savingOrderEdits, setSavingOrderEdits] = useState(false);

  // Mã giảm giá
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    amountVnd: number;
  } | null>(null);
  const [discountFeedback, setDiscountFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [checkingDiscount, setCheckingDiscount] = useState(false);

  // Phương thức thanh toán
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'DIGITAL'>('CASH');
  const [digitalChannel, setDigitalChannel] = useState<
    PaymentMethod.CARD | PaymentMethod.E_WALLET | PaymentMethod.BANK_TRANSFER
  >(PaymentMethod.BANK_TRANSFER);
  const [cashReceivedInput, setCashReceivedInput] = useState('');
  const [digitalConfirmed, setDigitalConfirmed] = useState(false);

  const [checkingOut, setCheckingOut] = useState(false);
  const [pageFeedback, setPageFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Modal hóa đơn khổ nhiệt K80 sau khi hoàn tất
  const [receiptSnapshot, setReceiptSnapshot] =
    useState<ReceiptSnapshot | null>(null);

  // Reset trạng thái giảm giá / thanh toán khi chuyển sang bàn khác
  useEffect(() => {
    setEditingOrder(false);
    setDraftEdits({});
    setDiscountInput('');
    setAppliedDiscount(null);
    setDiscountFeedback(null);
    setPaymentMode('CASH');
    setCashReceivedInput('');
    setDigitalConfirmed(false);
  }, [activeOrder?.id]);

  // Tính tổng hóa đơn theo subtotal hiện tại và mã giảm giá
  const totals = useMemo(() => {
    const subtotal = activeOrder?.subtotalVnd ?? 0;
    return calculateInvoiceTotals(
      subtotal,
      appliedDiscount?.amountVnd ?? 0,
      0.08
    );
  }, [activeOrder?.subtotalVnd, appliedDiscount]);

  const parsedCashReceived = useMemo(() => {
    const cleaned = cashReceivedInput.replace(/[^\d]/g, '');
    return cleaned ? Number(cleaned) : 0;
  }, [cashReceivedInput]);

  const cashChangeVnd = useMemo(
    () => calculateCashChange(parsedCashReceived, totals.totalAmountVnd),
    [parsedCashReceived, totals.totalAmountVnd]
  );

  // Kiểm tra có món chưa nấu (PENDING) để chỉnh sửa không
  const hasPendingItems = useMemo(
    () =>
      activeOrder
        ? activeOrder.items.some(
            (item) => item.status === OrderItemStatus.PENDING
          )
        : false,
    [activeOrder]
  );

  function startEditingOrder() {
    if (!activeOrder) return;
    const initial: Record<number, EditableItemState> = {};
    for (const item of activeOrder.items) {
      initial[item.id] = {
        orderItemId: item.id,
        quantity: item.quantity,
        status: item.status,
      };
    }
    setDraftEdits(initial);
    setEditingOrder(true);
    setPageFeedback(null);
  }

  function updateDraftItemQty(orderItemId: number, delta: number) {
    setDraftEdits((prev) => {
      const current = prev[orderItemId];
      if (!current) return prev;
      const nextQty = Math.max(1, current.quantity + delta);
      return {
        ...prev,
        [orderItemId]: {
          ...current,
          quantity: nextQty,
          status: OrderItemStatus.PENDING,
        },
      };
    });
  }

  function toggleCancelDraftItem(orderItemId: number) {
    setDraftEdits((prev) => {
      const current = prev[orderItemId];
      if (!current) return prev;
      const nextStatus =
        current.status === OrderItemStatus.CANCELLED
          ? OrderItemStatus.PENDING
          : OrderItemStatus.CANCELLED;
      return {
        ...prev,
        [orderItemId]: {
          ...current,
          status: nextStatus,
        },
      };
    });
  }

  async function handleSaveOrderEdits() {
    if (!activeOrder) return;
    setSavingOrderEdits(true);
    setPageFeedback(null);
    try {
      const changes: UpdateOrderItemChange[] = Object.values(draftEdits).map(
        (entry) => ({
          orderItemId: entry.orderItemId,
          quantity: entry.quantity,
          status: entry.status,
        })
      );
      const res = await updateOrderItems(activeOrder.id, changes);
      setEditingOrder(false);
      setPageFeedback({
        type: 'success',
        message: res.message,
      });

      // Tính lại mã giảm giá nếu đang áp dụng
      if (appliedDiscount) {
        const recheck = await validateDiscount(
          appliedDiscount.code,
          res.order.subtotalVnd
        );
        if (recheck.valid) {
          setAppliedDiscount({
            code: appliedDiscount.code,
            amountVnd: recheck.discountAmountVnd,
          });
        } else {
          setAppliedDiscount(null);
          setDiscountFeedback({
            type: 'error',
            message: `Mã ${appliedDiscount.code} đã gỡ bỏ: ${recheck.reason}`,
          });
        }
      }
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể cập nhật thông tin đơn hàng.',
      });
    } finally {
      setSavingOrderEdits(false);
    }
  }

  async function handleApplyDiscount(codeOverride?: string) {
    if (!activeOrder) return;
    const rawCode = (codeOverride ?? discountInput).trim().toUpperCase();
    if (!rawCode) {
      setDiscountFeedback({
        type: 'error',
        message: 'Vui lòng nhập mã giảm giá cần áp dụng.',
      });
      return;
    }

    setCheckingDiscount(true);
    setDiscountFeedback(null);
    try {
      const result = await validateDiscount(rawCode, activeOrder.subtotalVnd);
      if (result.valid) {
        setDiscountInput(rawCode);
        setAppliedDiscount({
          code: rawCode,
          amountVnd: result.discountAmountVnd,
        });
        setDiscountFeedback({
          type: 'success',
          message: `Đã áp dụng mã ${rawCode}: giảm ${formatVnd(
            result.discountAmountVnd
          )}.`,
        });
      } else {
        setAppliedDiscount(null);
        setDiscountFeedback({
          type: 'error',
          message: result.reason ?? 'Mã giảm giá không hợp lệ.',
        });
      }
    } catch (err) {
      setDiscountFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể kiểm tra mã giảm giá.',
      });
    } finally {
      setCheckingDiscount(false);
    }
  }

  function handleClearDiscount() {
    setDiscountInput('');
    setAppliedDiscount(null);
    setDiscountFeedback(null);
  }

  async function handleCompleteCheckout() {
    if (!activeOrder) return;

    const activeItemsCount = activeOrder.items.filter(
      (i) => i.status !== OrderItemStatus.CANCELLED
    ).length;
    if (activeItemsCount === 0 || totals.subtotalVnd <= 0) {
      setPageFeedback({
        type: 'error',
        message: 'Đơn hàng không còn món ăn hợp lệ để xuất hóa đơn.',
      });
      return;
    }

    if (paymentMode === 'CASH') {
      if (parsedCashReceived < totals.totalAmountVnd) {
        setPageFeedback({
          type: 'error',
          message: `Tiền khách đưa (${formatVnd(
            parsedCashReceived
          )}) chưa đủ tổng thanh toán (${formatVnd(totals.totalAmountVnd)}).`,
        });
        return;
      }
    } else if (!digitalConfirmed) {
      setPageFeedback({
        type: 'error',
        message:
          'Vui lòng xác nhận đã nhận tiền qua thẻ / chuyển khoản QR trước khi hoàn tất.',
      });
      return;
    }

    setCheckingOut(true);
    setPageFeedback(null);

    const snapshotItems = activeOrder.items;
    const snapshotGuestCount = activeOrder.guestCount;
    const chosenMethod: PaymentMethod =
      paymentMode === 'CASH' ? PaymentMethod.CASH : digitalChannel;

    try {
      const res = await checkoutOrder({
        orderId: activeOrder.id,
        cashierId: currentUser.id,
        cashierName: currentUser.fullName,
        discountCode: appliedDiscount?.code ?? null,
        discountAmountVnd: appliedDiscount?.amountVnd ?? 0,
        vatRate: 0.08,
        paymentMethod: chosenMethod,
        cashReceivedVnd:
          paymentMode === 'CASH' ? parsedCashReceived : undefined,
      });

      setReceiptSnapshot({
        invoice: res.invoice,
        items: snapshotItems,
        guestCount: snapshotGuestCount,
        cashReceivedVnd:
          paymentMode === 'CASH' ? parsedCashReceived : undefined,
        cashChangeVnd:
          paymentMode === 'CASH' ? Math.max(0, cashChangeVnd) : undefined,
      });

      setPageFeedback({
        type: 'success',
        message: res.message,
      });
    } catch (err) {
      setPageFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể hoàn tất thanh toán hóa đơn.',
      });
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="space-y-1">
        <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
          Thanh toán hóa đơn
        </h1>
        <p className="text-sm text-[#5E5850]">
          Kiểm tra chi tiết món gọi theo từng bàn, cập nhật món chưa nấu, áp
          dụng mã khuyến mãi và xuất hóa đơn in nhiệt K80.
        </p>
      </div>

      {pageFeedback && (
        <div
          role={pageFeedback.type === 'error' ? 'alert' : 'status'}
          className={`flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm ${
            pageFeedback.type === 'success'
              ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]'
              : 'border-[#F3C5C0] bg-[#FEF3F2] text-[#B42318]'
          }`}
        >
          <div className="flex items-center gap-2">
            {pageFeedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <span>{pageFeedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setPageFeedback(null)}
            className="text-xs font-semibold underline underline-offset-2 cursor-pointer whitespace-nowrap"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Bố cục 2 cột: Danh sách bàn chờ thanh toán (4/12) + Chi tiết thanh toán (8/12) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* CỘT TRÁI: Danh sách các bàn có đơn hàng chờ thanh toán */}
        <section
          aria-label="Danh sách bàn chờ thanh toán"
          className="xl:col-span-4 rounded-xl border border-[#E6E2DC] bg-white overflow-hidden"
        >
          <div className="flex items-center justify-between border-b border-[#E6E2DC] bg-[#FAF9F7] px-4 py-3.5">
            <h2 className="font-display text-sm font-bold text-[#1F1D1A]">
              Bàn chờ thanh toán
            </h2>
            <span className="text-xs font-semibold text-[#9A3D18] tabular-nums">
              {unpaidOrders.length} bàn
            </span>
          </div>

          <div className="divide-y divide-[#EFECE6]">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <div key={idx} className="p-4 space-y-2">
                  <div className="h-4 w-28 rounded bg-[#EFECE6] animate-pulse" />
                  <div className="h-3 w-40 rounded bg-[#EFECE6] animate-pulse" />
                </div>
              ))
            ) : unpaidOrders.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <ReceiptText
                  className="mx-auto h-7 w-7 text-[#C9C2B8]"
                  aria-hidden="true"
                />
                <p className="text-sm font-medium text-[#5E5850]">
                  Không có bàn nào đang chờ thanh toán
                </p>
                <p className="text-xs text-[#7A7268]">
                  Tất cả đơn hàng đã được thanh toán và trả bàn về trạng thái
                  Trống.
                </p>
              </div>
            ) : (
              unpaidOrders.map((order) => {
                const isSelected = order.tableId === selectedBillingTableId;
                const tableObj = tables.find((t) => t.id === order.tableId);
                const activeDishCount = order.items.filter(
                  (i) => i.status !== OrderItemStatus.CANCELLED
                ).length;

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedBillingTableId(order.tableId)}
                    data-testid={`billing-table-${tableObj?.tableCode ?? order.tableId}`}
                    aria-pressed={isSelected}
                    className={`w-full px-4 py-3.5 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#C2572B] ${
                      isSelected
                        ? 'bg-[#FDF5F1]'
                        : 'bg-white hover:bg-[#FAF9F7]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={`font-display text-sm font-bold ${
                            isSelected ? 'text-[#9A3D18]' : 'text-[#1F1D1A]'
                          }`}
                        >
                          {order.tableName}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-[#6E675E]">
                          {order.orderCode} · {activeDishCount} món
                        </p>
                      </div>
                      <p className="font-display text-sm font-bold text-[#1F1D1A] tabular-nums whitespace-nowrap">
                        {formatVnd(order.subtotalVnd)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-[#6E675E]">
                      <span>{order.guestCount} khách</span>
                      <span className="tabular-nums">
                        {formatDateTimeVi(order.createdAt)}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Lịch sử hóa đơn đã thanh toán gần đây */}
          {invoices.length > 0 && (
            <div className="border-t border-[#E6E2DC] bg-[#FAF9F7] px-4 py-3.5 space-y-2.5">
              <p className="text-xs font-bold uppercase tracking-wide text-[#6E675E]">
                Hóa đơn đã thanh toán gần đây ({invoices.length})
              </p>
              <div className="space-y-2 max-h-44 overflow-y-auto">
                {invoices.slice(0, 4).map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-mono font-semibold text-[#1F1D1A] truncate">
                        {inv.invoiceCode} · {inv.tableName}
                      </p>
                      <p className="text-[11px] text-[#6E675E]">
                        {inv.paymentMethod
                          ? PAYMENT_METHOD_LABELS[inv.paymentMethod]
                          : 'Đã thanh toán'}
                      </p>
                    </div>
                    <span className="font-semibold text-[#15803D] tabular-nums whitespace-nowrap">
                      {formatVnd(inv.totalAmountVnd)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* CỘT PHẢI: Chi tiết đơn hàng, chỉnh sửa món chưa nấu, mã giảm giá & thanh toán */}
        <div className="xl:col-span-8 space-y-5">
          {!activeOrder ? (
            <section className="rounded-xl border border-[#E6E2DC] bg-white p-10 text-center text-sm text-[#6E675E]">
              Chọn một bàn ở danh sách bên trái để kiểm tra chi tiết đơn hàng và
              tiến hành thanh toán.
            </section>
          ) : (
            <>
              {/* Khối 1: Chi tiết đơn hàng + Cập nhật món chưa nấu */}
              <section
                aria-label="Chi tiết đơn hàng"
                className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E2DC] bg-[#FAF9F7] px-5 py-4">
                  <div>
                    <h2 className="font-display text-lg font-bold text-[#1F1D1A]">
                      {activeOrder.tableName} ·{' '}
                      <span className="font-mono text-sm font-semibold text-[#6E675E]">
                        {activeOrder.orderCode}
                      </span>
                    </h2>
                    <p className="text-xs text-[#6E675E]">
                      Nhân viên phục vụ: {activeOrder.staffName} ·{' '}
                      {activeOrder.guestCount} khách · Mở lúc{' '}
                      {formatDateTimeVi(activeOrder.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {!editingOrder ? (
                      <>
                        <button
                          type="button"
                          onClick={() => goToPosForTable(activeOrder.tableId)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCD7CE] bg-white px-3 text-xs font-medium text-[#1F1D1A] transition-colors hover:bg-[#F2EFEA] cursor-pointer whitespace-nowrap"
                        >
                          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Gọi thêm món</span>
                        </button>
                        <button
                          type="button"
                          onClick={startEditingOrder}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#C2572B]/50 bg-[#FDF5F1] px-3 text-xs font-semibold text-[#9A3D18] transition-colors hover:bg-[#FBEAE2] cursor-pointer whitespace-nowrap"
                        >
                          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Cập nhật thông tin đơn hàng</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => setEditingOrder(false)}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#DCD7CE] bg-white px-3 text-xs font-medium text-[#5E5850] hover:bg-[#F2EFEA] cursor-pointer whitespace-nowrap"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Hủy chỉnh sửa</span>
                        </button>
                        <button
                          type="button"
                          disabled={savingOrderEdits}
                          onClick={() => void handleSaveOrderEdits()}
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#C2572B] px-3.5 text-xs font-semibold text-white hover:bg-[#A5451E] disabled:opacity-60 cursor-pointer whitespace-nowrap"
                        >
                          <Save className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            {savingOrderEdits
                              ? 'Đang lưu...'
                              : 'Lưu thay đổi đơn hàng'}
                          </span>
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {editingOrder && (
                  <div className="border-b border-[#F4CF7B] bg-[#FFFBEB] px-5 py-2.5 text-xs text-[#92400E]">
                    {hasPendingItems
                      ? 'Bạn có thể tăng/giảm số lượng hoặc hủy các món ở trạng thái "Chờ bếp". Các món đang nấu hoặc đã hoàn tất sẽ được khóa để đảm bảo đối soát.'
                      : 'Tất cả món trong đơn này đã hoặc đang được bếp chế biến, không thể hủy hay giảm số lượng.'}
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#E6E2DC] bg-[#FAF9F7] text-xs font-semibold text-[#5E5850]">
                        <th scope="col" className="px-5 py-3">
                          Món ăn
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 whitespace-nowrap"
                        >
                          Trạng thái bếp
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center whitespace-nowrap"
                        >
                          Số lượng
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-right whitespace-nowrap"
                        >
                          Đơn giá
                        </th>
                        <th
                          scope="col"
                          className="px-5 py-3 text-right whitespace-nowrap"
                        >
                          Thành tiền
                        </th>
                        {editingOrder && (
                          <th
                            scope="col"
                            className="px-4 py-3 text-right whitespace-nowrap"
                          >
                            Hủy món
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFECE6] text-sm">
                      {activeOrder.items.map((item) => {
                        const draft = draftEdits[item.id];
                        const isEditable =
                          editingOrder &&
                          item.status === OrderItemStatus.PENDING;
                        const displayQty =
                          isEditable && draft ? draft.quantity : item.quantity;
                        const displayStatus =
                          isEditable && draft ? draft.status : item.status;
                        const isCancelled =
                          displayStatus === OrderItemStatus.CANCELLED;
                        const lineTotal = isCancelled
                          ? 0
                          : displayQty * item.unitPriceVnd;

                        return (
                          <tr
                            key={item.id}
                            className={
                              isCancelled
                                ? 'bg-[#FAF9F7] text-[#8A8378]'
                                : 'hover:bg-[#FAF9F7]'
                            }
                          >
                            <td className="px-5 py-3">
                              <p
                                className={`font-medium ${
                                  isCancelled
                                    ? 'line-through text-[#8A8378]'
                                    : 'text-[#1F1D1A]'
                                }`}
                              >
                                {item.menuItemName}
                              </p>
                              {item.note && (
                                <p className="mt-0.5 text-xs text-[#6E675E]">
                                  Ghi chú: {item.note}
                                </p>
                              )}
                            </td>

                            <td className="px-4 py-3 whitespace-nowrap text-xs font-semibold">
                              <span className={ITEM_STATUS_COLOR[displayStatus]}>
                                {ORDER_ITEM_STATUS_LABELS[displayStatus]}
                              </span>
                            </td>

                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              {isEditable && !isCancelled ? (
                                <div className="inline-flex items-center rounded-md border border-[#DCD7CE] bg-white">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftItemQty(item.id, -1)
                                    }
                                    aria-label={`Giảm số lượng ${item.menuItemName}`}
                                    className="inline-flex h-7 w-7 items-center justify-center text-[#4A453E] hover:bg-[#F2EFEA] cursor-pointer"
                                  >
                                    <Minus
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <span className="w-8 text-center text-xs font-bold tabular-nums text-[#1F1D1A]">
                                    {displayQty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateDraftItemQty(item.id, 1)
                                    }
                                    aria-label={`Tăng số lượng ${item.menuItemName}`}
                                    className="inline-flex h-7 w-7 items-center justify-center text-[#4A453E] hover:bg-[#F2EFEA] cursor-pointer"
                                  >
                                    <Plus
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </div>
                              ) : (
                                <span className="font-semibold tabular-nums">
                                  {displayQty}
                                </span>
                              )}
                            </td>

                            <td className="px-4 py-3 text-right tabular-nums text-[#5E5850] whitespace-nowrap">
                              {formatVnd(item.unitPriceVnd)}
                            </td>

                            <td className="px-5 py-3 text-right font-semibold tabular-nums whitespace-nowrap">
                              {isCancelled ? '0 ₫' : formatVnd(lineTotal)}
                            </td>

                            {editingOrder && (
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {isEditable ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      toggleCancelDraftItem(item.id)
                                    }
                                    className={`inline-flex h-7 items-center gap-1 rounded-md border px-2 text-xs font-medium cursor-pointer ${
                                      isCancelled
                                        ? 'border-[#BBF7D0] bg-[#F0FDF4] text-[#15803D]'
                                        : 'border-[#F3C5C0] bg-[#FEF3F2] text-[#B91C1C]'
                                    }`}
                                  >
                                    <Trash2
                                      className="h-3 w-3"
                                      aria-hidden="true"
                                    />
                                    <span>
                                      {isCancelled ? 'Khôi phục' : 'Hủy món'}
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-[#8A8378]">
                                    Đã khóa
                                  </span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Khối 2: Mã giảm giá + Tổng hợp tiền + Phương thức thanh toán */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* Cột Mã giảm giá & Phương thức thanh toán (7/12) */}
                <section
                  aria-label="Khuyến mãi và phương thức thanh toán"
                  className="lg:col-span-7 rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-5"
                >
                  {/* Mã giảm giá */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor="discount-code-input"
                        className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[#5E5850]"
                      >
                        <Tag className="h-3.5 w-3.5 text-[#C2572B]" aria-hidden="true" />
                        Mã giảm giá / Khuyến mãi
                      </label>
                      {appliedDiscount && (
                        <button
                          type="button"
                          onClick={handleClearDiscount}
                          className="text-xs font-semibold text-[#B91C1C] hover:underline cursor-pointer"
                        >
                          Gỡ mã {appliedDiscount.code}
                        </button>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <input
                        id="discount-code-input"
                        type="text"
                        value={discountInput}
                        onChange={(e) =>
                          setDiscountInput(e.target.value.toUpperCase())
                        }
                        placeholder="Nhập mã (VD: GIAM10, GIAM50K)..."
                        className="h-10 flex-1 rounded-lg border border-[#DCD7CE] bg-[#FAF9F7] px-3 font-mono text-sm uppercase text-[#1F1D1A] placeholder:font-sans placeholder:normal-case placeholder:text-[#8A8378] focus:border-[#C2572B] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                      />
                      <button
                        type="button"
                        disabled={checkingDiscount}
                        onClick={() => void handleApplyDiscount()}
                        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg border border-[#C2572B] bg-[#FDF5F1] px-4 text-xs font-semibold text-[#9A3D18] transition-colors hover:bg-[#C2572B] hover:text-white disabled:opacity-60 cursor-pointer whitespace-nowrap"
                      >
                        {checkingDiscount
                          ? 'Đang kiểm tra...'
                          : 'Áp dụng mã giảm giá'}
                      </button>
                    </div>

                    {/* Nút chọn nhanh 2 mã demo */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#6E675E]">
                      <span>Mã demo nhanh:</span>
                      <button
                        type="button"
                        onClick={() => void handleApplyDiscount('GIAM10')}
                        className="rounded-md border border-[#DCD7CE] bg-[#FAF9F7] px-2.5 py-1 font-mono text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B] hover:text-[#9A3D18] cursor-pointer"
                      >
                        GIAM10 (-10%)
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleApplyDiscount('GIAM50K')}
                        className="rounded-md border border-[#DCD7CE] bg-[#FAF9F7] px-2.5 py-1 font-mono text-xs font-semibold text-[#1F1D1A] transition-colors hover:border-[#C2572B] hover:text-[#9A3D18] cursor-pointer"
                      >
                        GIAM50K (-50.000 ₫)
                      </button>
                    </div>

                    {discountFeedback && (
                      <p
                        role="status"
                        className={`text-xs font-medium ${
                          discountFeedback.type === 'success'
                            ? 'text-[#15803D]'
                            : 'text-[#B91C1C]'
                        }`}
                      >
                        {discountFeedback.message}
                      </p>
                    )}
                  </div>

                  {/* Chọn phương thức thanh toán */}
                  <div className="space-y-3 pt-4 border-t border-[#EFECE6]">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#5E5850]">
                      Phương thức thanh toán
                    </p>

                    <div
                      role="group"
                      aria-label="Chọn phương thức thanh toán"
                      className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
                    >
                      <button
                        type="button"
                        onClick={() => setPaymentMode('CASH')}
                        aria-pressed={paymentMode === 'CASH'}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-colors cursor-pointer ${
                          paymentMode === 'CASH'
                            ? 'border-[#C2572B] bg-[#FDF5F1] text-[#9A3D18] ring-1 ring-[#C2572B]'
                            : 'border-[#DCD7CE] bg-white text-[#1F1D1A] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <Banknote className="h-5 w-5 shrink-0" aria-hidden="true" />
                        <div>
                          <p className="text-xs font-bold">
                            Thanh toán tiền mặt
                          </p>
                          <p className="text-[11px] text-[#6E675E]">
                            Tự động tính tiền thừa
                          </p>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMode('DIGITAL')}
                        aria-pressed={paymentMode === 'DIGITAL'}
                        className={`flex items-center gap-2.5 rounded-lg border px-3.5 py-3 text-left transition-colors cursor-pointer ${
                          paymentMode === 'DIGITAL'
                            ? 'border-[#C2572B] bg-[#FDF5F1] text-[#9A3D18] ring-1 ring-[#C2572B]'
                            : 'border-[#DCD7CE] bg-white text-[#1F1D1A] hover:bg-[#FAF9F7]'
                        }`}
                      >
                        <CreditCard
                          className="h-5 w-5 shrink-0"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="text-xs font-bold">
                            Thanh toán thẻ / Ví điện tử
                          </p>
                          <p className="text-[11px] text-[#6E675E]">
                            VietQR, Thẻ POS, MoMo
                          </p>
                        </div>
                      </button>
                    </div>

                    {/* Chi tiết thanh toán tiền mặt */}
                    {paymentMode === 'CASH' ? (
                      <div className="rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] p-4 space-y-3">
                        <div className="space-y-1">
                          <label
                            htmlFor="cash-received-input"
                            className="block text-xs font-semibold text-[#4A453E]"
                          >
                            Tiền khách đưa (VNĐ)
                          </label>
                          <input
                            id="cash-received-input"
                            type="number"
                            min={0}
                            step={1000}
                            value={cashReceivedInput}
                            onChange={(e) =>
                              setCashReceivedInput(e.target.value)
                            }
                            placeholder={`Tối thiểu ${totals.totalAmountVnd.toLocaleString('vi-VN')}`}
                            className="h-10 w-full rounded-lg border border-[#DCD7CE] bg-white px-3 text-sm font-semibold tabular-nums text-[#1F1D1A] focus:border-[#C2572B] focus:outline-none focus:ring-2 focus:ring-[#C2572B]/20"
                          />
                        </div>

                        <div className="flex flex-wrap gap-1.5">
                          <button
                            type="button"
                            onClick={() =>
                              setCashReceivedInput(String(totals.totalAmountVnd))
                            }
                            className="rounded-md border border-[#C2572B]/40 bg-[#FDF5F1] px-2.5 py-1 text-xs font-semibold text-[#9A3D18] hover:bg-[#FBEAE2] cursor-pointer tabular-nums"
                          >
                            Đúng số tiền ({formatVnd(totals.totalAmountVnd)})
                          </button>
                          {QUICK_CASH_AMOUNTS.map((amount) => (
                            <button
                              key={amount}
                              type="button"
                              onClick={() =>
                                setCashReceivedInput(String(amount))
                              }
                              className="rounded-md border border-[#DCD7CE] bg-white px-2.5 py-1 text-xs font-medium text-[#4A453E] hover:border-[#C2572B] cursor-pointer tabular-nums"
                            >
                              {formatVnd(amount)}
                            </button>
                          ))}
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[#E6E2DC] text-sm">
                          <span className="font-medium text-[#5E5850]">
                            Tiền thừa trả khách
                          </span>
                          <span
                            data-testid="cash-change-amount"
                            className={`font-display text-base font-bold tabular-nums ${
                              parsedCashReceived === 0
                                ? 'text-[#6E675E]'
                                : cashChangeVnd >= 0
                                  ? 'text-[#15803D]'
                                  : 'text-[#B91C1C]'
                            }`}
                          >
                            {parsedCashReceived === 0
                              ? '—'
                              : cashChangeVnd >= 0
                                ? formatVnd(cashChangeVnd)
                                : `Còn thiếu ${formatVnd(Math.abs(cashChangeVnd))}`}
                          </span>
                        </div>
                      </div>
                    ) : (
                      /* Chi tiết thanh toán Thẻ / Ví điện tử / QR */
                      <div className="space-y-3">
                        <div className="flex flex-wrap gap-1.5">
                          {(
                            [
                              PaymentMethod.BANK_TRANSFER,
                              PaymentMethod.CARD,
                              PaymentMethod.E_WALLET,
                            ] as const
                          ).map((method) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => setDigitalChannel(method)}
                              className={`h-8 rounded-md border px-3 text-xs font-medium cursor-pointer ${
                                digitalChannel === method
                                  ? 'border-[#C2572B] bg-[#FDF5F1] text-[#9A3D18] font-semibold'
                                  : 'border-[#DCD7CE] bg-white text-[#5E5850]'
                              }`}
                            >
                              {PAYMENT_METHOD_LABELS[method]}
                            </button>
                          ))}
                        </div>

                        <VietQrBox
                          orderCode={activeOrder.orderCode}
                          amountVnd={totals.totalAmountVnd}
                          channelLabel={PAYMENT_METHOD_LABELS[digitalChannel]}
                        />

                        <label className="flex items-center gap-2.5 rounded-lg border border-[#E6E2DC] bg-[#FAF9F7] px-3.5 py-2.5 text-xs font-medium text-[#1F1D1A] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={digitalConfirmed}
                            onChange={(e) =>
                              setDigitalConfirmed(e.target.checked)
                            }
                            className="h-4 w-4 accent-[#C2572B] cursor-pointer"
                          />
                          <span>
                            Xác nhận đã nhận đủ{' '}
                            <strong className="tabular-nums">
                              {formatVnd(totals.totalAmountVnd)}
                            </strong>{' '}
                            từ giao dịch{' '}
                            {PAYMENT_METHOD_LABELS[digitalChannel]}
                          </span>
                        </label>
                      </div>
                    )}
                  </div>
                </section>

                {/* Cột Tổng kết hóa đơn & Hoàn tất thanh toán (5/12) */}
                <section
                  aria-label="Tổng hợp thanh toán"
                  className="lg:col-span-5 self-start rounded-xl border border-[#E6E2DC] bg-white p-5 space-y-5"
                >
                  <div className="space-y-3">
                    <h3 className="font-display text-base font-bold text-[#1F1D1A]">
                      Tổng kết hóa đơn
                    </h3>

                    <dl className="space-y-2.5 text-sm">
                      <div className="flex items-center justify-between">
                        <dt className="text-[#5E5850]">Tạm tính tiền món</dt>
                        <dd className="font-medium tabular-nums text-[#1F1D1A]">
                          {formatVnd(totals.subtotalVnd)}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between">
                        <dt className="text-[#5E5850]">
                          Giảm giá
                          {appliedDiscount ? ` (${appliedDiscount.code})` : ''}
                        </dt>
                        <dd className="font-medium tabular-nums text-[#15803D]">
                          -{formatVnd(totals.discountAmountVnd)}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between">
                        <dt className="text-[#5E5850]">Thuế VAT (8%)</dt>
                        <dd className="font-medium tabular-nums text-[#1F1D1A]">
                          {formatVnd(totals.vatAmountVnd)}
                        </dd>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-[#E6E2DC]">
                        <dt className="font-bold text-[#1F1D1A]">
                          Tổng phải thanh toán
                        </dt>
                        <dd
                          data-testid="invoice-grand-total"
                          className="font-display text-xl font-bold text-[#9A3D18] tabular-nums"
                        >
                          {formatVnd(totals.totalAmountVnd)}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-2.5">
                    <button
                      type="button"
                      disabled={checkingOut || editingOrder}
                      onClick={() => void handleCompleteCheckout()}
                      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#C2572B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#A5451E] disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B]"
                    >
                      <Printer className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {checkingOut
                          ? 'Đang xử lý thanh toán...'
                          : 'Hoàn tất & In/Xuất hóa đơn'}
                      </span>
                    </button>

                    <p className="text-[11px] text-[#6E675E] text-center leading-relaxed">
                      Sau khi hoàn tất, hóa đơn khổ nhiệt K80 sẽ được mở để in
                      và <strong>{activeOrder.tableName}</strong> tự động chuyển
                      về Trống.
                    </p>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modal Hóa đơn khổ giấy in nhiệt K80 */}
      <ThermalReceiptModal
        snapshot={receiptSnapshot}
        onClose={() => setReceiptSnapshot(null)}
      />
    </div>
  );
}
