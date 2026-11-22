import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Search,
  Trash2,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { DishImage } from '../components/common/DishImage';
import { UserAvatar } from '../components/common/UserAvatar';
import { useRestaurant } from '../context/RestaurantContext';
import { employeeService, menuService } from '../services';
import {
  Employee,
  EmployeeStatus,
  MenuItem,
  MenuItemStatus,
} from '../types';
import {
  formatVnd,
  MENU_CATEGORY_LABELS,
  ROLE_LABELS,
} from '../utils';

type TrashTab = 'MENU' | 'EMPLOYEES';

type PendingPermanentDelete =
  | { kind: 'MENU'; item: MenuItem }
  | { kind: 'EMPLOYEE'; item: Employee };

export function TrashPage() {
  const { refreshMenu } = useRestaurant();

  const [activeTab, setActiveTab] = useState<TrashTab>('MENU');
  const [searchQuery, setSearchQuery] = useState('');
  const [trashedMenu, setTrashedMenu] = useState<MenuItem[]>([]);
  const [trashedEmployees, setTrashedEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] =
    useState<PendingPermanentDelete | null>(null);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const loadTrashData = useCallback(async () => {
    setLoading(true);
    const [menuRes, empRes] = await Promise.allSettled([
      menuService.getMenuItems(),
      employeeService.getEmployees(),
    ]);

    if (menuRes.status === 'fulfilled') {
      setTrashedMenu(
        menuRes.value.data.filter(
          (item) => item.status === MenuItemStatus.DISCONTINUED
        )
      );
    }

    if (empRes.status === 'fulfilled') {
      setTrashedEmployees(
        empRes.value.data.filter(
          (emp) => emp.status === EmployeeStatus.INACTIVE
        )
      );
    }

    if (menuRes.status === 'rejected' && empRes.status === 'rejected') {
      setFeedback({
        type: 'error',
        message: 'Không thể tải dữ liệu Thùng rác từ máy chủ.',
      });
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void loadTrashData();
  }, [loadTrashData]);

  const filteredMenu = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trashedMenu;
    return trashedMenu.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q)
    );
  }, [trashedMenu, searchQuery]);

  const filteredEmployees = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return trashedEmployees;
    return trashedEmployees.filter(
      (emp) =>
        emp.fullName.toLowerCase().includes(q) ||
        emp.employeeCode.toLowerCase().includes(q) ||
        emp.positionTitle.toLowerCase().includes(q)
    );
  }, [trashedEmployees, searchQuery]);

  async function handleRestoreMenu(item: MenuItem) {
    setBusyKey(`menu-${item.id}`);
    setFeedback(null);
    try {
      const res = await menuService.restoreMenuItem(item.id);
      setTrashedMenu((prev) => prev.filter((m) => m.id !== item.id));
      await refreshMenu();
      setFeedback({
        type: 'success',
        message: `${res.message}: "${item.name}" (${item.sku}).`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error ? err.message : 'Không thể khôi phục món ăn.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleRestoreEmployee(emp: Employee) {
    setBusyKey(`emp-${emp.id}`);
    setFeedback(null);
    try {
      const res = await employeeService.restoreEmployee(emp);
      setTrashedEmployees((prev) => prev.filter((e) => e.id !== emp.id));
      setFeedback({
        type: 'success',
        message: res.message,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể khôi phục hồ sơ nhân viên.',
      });
    } finally {
      setBusyKey(null);
    }
  }

  async function handleConfirmPermanentDelete() {
    if (!pendingDelete) return;
    setBusyKey('confirm-delete');
    setFeedback(null);

    try {
      if (pendingDelete.kind === 'MENU') {
        const res = await menuService.permanentlyDeleteMenuItem(
          pendingDelete.item.id
        );
        setTrashedMenu((prev) =>
          prev.filter((m) => m.id !== pendingDelete.item.id)
        );
        await refreshMenu();
        setFeedback({
          type: 'success',
          message: `${res.message}: "${pendingDelete.item.name}".`,
        });
      } else {
        const res = await employeeService.permanentlyDeleteEmployee(
          pendingDelete.item.employeeCode
        );
        setTrashedEmployees((prev) =>
          prev.filter((e) => e.id !== pendingDelete.item.id)
        );
        setFeedback({
          type: 'success',
          message: `${res.message}: ${pendingDelete.item.fullName}.`,
        });
      }
      setPendingDelete(null);
    } catch (err) {
      setFeedback({
        type: 'error',
        message:
          err instanceof Error
            ? err.message
            : 'Không thể xóa vĩnh viễn dữ liệu này.',
      });
      setPendingDelete(null);
    } finally {
      setBusyKey(null);
    }
  }

  const totalCount = trashedMenu.length + trashedEmployees.length;

  return (
    <div className="space-y-6">
      {/* Tiêu đề trang */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl sm:text-[26px] font-bold tracking-tight text-[#1F1D1A]">
            Thùng rác hệ thống
          </h1>
          <p className="text-sm text-[#5E5850]">
            Lưu trữ riêng các món ăn đã ngừng bán và hồ sơ nhân viên đã nghỉ
            việc. Bạn có thể khôi phục về danh sách chính hoặc xóa vĩnh viễn.
          </p>
        </div>

        <span className="inline-flex h-9 items-center gap-2 rounded-lg border border-[#E6E2DC] bg-white px-3.5 text-xs font-semibold text-[#5E5850] self-start sm:self-auto tabular-nums">
          <Trash2 className="h-3.5 w-3.5 text-[#B42318]" aria-hidden="true" />
          <span>Tổng cộng {totalCount} mục đã xóa</span>
        </span>
      </div>

      {/* Lưu ý bảo toàn lịch sử dữ liệu */}
      <div className="rounded-lg border border-[#F4CF7B] bg-[#FFFBEB] px-4 py-3 text-xs text-[#78350F] leading-relaxed">
        <strong>Lưu ý:</strong> Các món ăn đã phát sinh trong lịch sử gọi món /
        hóa đơn hoặc nhân viên đang gắn với dữ liệu vận hành sẽ không thể xóa
        vĩnh viễn để bảo toàn báo cáo doanh thu. Bạn vẫn có thể để ở đây hoặc
        khôi phục bất cứ lúc nào.
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

      {/* Thanh tab + tìm kiếm */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Phân loại dữ liệu trong thùng rác"
          className="inline-flex items-center gap-1 rounded-lg bg-[#EBE7E0] p-1 self-start"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'MENU'}
            onClick={() => {
              setActiveTab('MENU');
              setSearchQuery('');
            }}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'MENU'
                ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                : 'text-[#5E5850] hover:text-[#1F1D1A]'
            }`}
          >
            <UtensilsCrossed className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Món ngừng bán ({trashedMenu.length})</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'EMPLOYEES'}
            onClick={() => {
              setActiveTab('EMPLOYEES');
              setSearchQuery('');
            }}
            className={`inline-flex h-9 items-center gap-2 rounded-md px-3.5 text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'EMPLOYEES'
                ? 'bg-white text-[#1F1D1A] shadow-xs font-semibold'
                : 'text-[#5E5850] hover:text-[#1F1D1A]'
            }`}
          >
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Nhân viên nghỉ việc ({trashedEmployees.length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8A8378]"
            aria-hidden="true"
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'MENU'
                ? 'Tìm theo tên hoặc mã món...'
                : 'Tìm theo tên hoặc mã NV...'
            }
            className="h-9 w-full rounded-lg border border-[#DCD7CE] bg-white pl-9 pr-3 text-xs text-[#1F1D1A] placeholder:text-[#8A8378] focus:border-[#C2572B] focus:outline-none"
          />
        </div>
      </div>

      {/* Nội dung danh sách theo tab */}
      <section className="rounded-xl border border-[#E6E2DC] bg-white overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="h-16 rounded-lg bg-[#FAF9F7] animate-pulse"
              />
            ))}
          </div>
        ) : activeTab === 'MENU' ? (
          filteredMenu.length === 0 ? (
            <div className="py-14 text-center space-y-2">
              <UtensilsCrossed
                className="mx-auto h-8 w-8 text-[#C9C2B8]"
                aria-hidden="true"
              />
              <p className="text-sm font-medium text-[#4A453E]">
                Không có món ăn nào trong Thùng rác
              </p>
              <p className="text-xs text-[#7A7268]">
                Các món bị xóa hoặc chuyển sang Ngừng bán sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#EFECE6]">
              {filteredMenu.map((item) => {
                const isBusy = busyKey === `menu-${item.id}`;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 hover:bg-[#FAF9F7] transition-colors"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg border border-[#E6E2DC]">
                        <DishImage
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-full w-full grayscale"
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-[#EFECE6] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#4A453E]">
                            {item.sku}
                          </span>
                          <p className="text-sm font-semibold text-[#1F1D1A] truncate">
                            {item.name}
                          </p>
                        </div>
                        <p className="mt-0.5 text-xs text-[#6E675E] tabular-nums">
                          {MENU_CATEGORY_LABELS[item.category]} ·{' '}
                          {formatVnd(item.priceVnd)} / {item.unit}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={Boolean(busyKey)}
                        onClick={() => void handleRestoreMenu(item)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#A7DFC0] bg-[#F3FBF6] px-3 text-xs font-semibold text-[#15803D] transition-colors hover:bg-[#DCFCE7] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{isBusy ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={Boolean(busyKey)}
                        onClick={() =>
                          setPendingDelete({ kind: 'MENU', item })
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#F3C5C0] bg-white px-3 text-xs font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF3F2] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Xóa vĩnh viễn</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : filteredEmployees.length === 0 ? (
          <div className="py-14 text-center space-y-2">
            <Users
              className="mx-auto h-8 w-8 text-[#C9C2B8]"
              aria-hidden="true"
            />
            <p className="text-sm font-medium text-[#4A453E]">
              Không có nhân viên nào trong Thùng rác
            </p>
            <p className="text-xs text-[#7A7268]">
              Hồ sơ nhân viên đã nghỉ việc hoặc bị xóa khỏi danh sách chính sẽ
              nằm tại đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#EFECE6]">
            {filteredEmployees.map((emp) => {
              const isBusy = busyKey === `emp-${emp.id}`;
              return (
                <div
                  key={emp.id}
                  className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 hover:bg-[#FAF9F7] transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <UserAvatar
                      name={emp.fullName}
                      avatarUrl={emp.avatarUrl}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded bg-[#EFECE6] px-1.5 py-0.5 font-mono text-[11px] font-bold text-[#4A453E]">
                          {emp.employeeCode}
                        </span>
                        <p className="text-sm font-semibold text-[#1F1D1A] truncate">
                          {emp.fullName}
                        </p>
                      </div>
                      <p className="mt-0.5 text-xs text-[#6E675E]">
                        {emp.positionTitle} ({ROLE_LABELS[emp.role]})
                        {emp.phone ? ` · ${emp.phone}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={Boolean(busyKey)}
                      onClick={() => void handleRestoreEmployee(emp)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#A7DFC0] bg-[#F3FBF6] px-3 text-xs font-semibold text-[#15803D] transition-colors hover:bg-[#DCFCE7] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{isBusy ? 'Đang khôi phục...' : 'Khôi phục'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(busyKey)}
                      onClick={() =>
                        setPendingDelete({ kind: 'EMPLOYEE', item: emp })
                      }
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#F3C5C0] bg-white px-3 text-xs font-semibold text-[#B91C1C] transition-colors hover:bg-[#FEF3F2] disabled:opacity-50 cursor-pointer whitespace-nowrap"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Xóa vĩnh viễn</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Hộp thoại xác nhận Xóa vĩnh viễn */}
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Xác nhận xóa vĩnh viễn"
        description={
          pendingDelete?.kind === 'MENU'
            ? `Bạn có chắc muốn xóa vĩnh viễn món "${pendingDelete.item.name}" (${pendingDelete.item.sku}) khỏi cơ sở dữ liệu? Hành động này không thể hoàn tác.`
            : pendingDelete?.kind === 'EMPLOYEE'
              ? `Bạn có chắc muốn xóa vĩnh viễn hồ sơ nhân viên "${pendingDelete.item.fullName}" (${pendingDelete.item.employeeCode})? Hành động này không thể hoàn tác.`
              : ''
        }
        confirmLabel="Xóa vĩnh viễn"
        loading={busyKey === 'confirm-delete'}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleConfirmPermanentDelete()}
      />
    </div>
  );
}