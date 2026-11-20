import {
  Armchair,
  ChefHat,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Receipt,
  TicketPercent,
  Users,
  UtensilsCrossed,
  X,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { NavItemConfig, PageKey, User } from '../../types';
import { ROLE_LABELS } from '../../utils';
import { UserAvatar } from '../common/UserAvatar';

interface SidebarProps {
  user: User;
  menuItems: NavItemConfig[];
  activePage: PageKey;
  onSelectPage: (page: PageKey) => void;
  onLogout: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

const NAV_ICONS: Record<PageKey, ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  tables: Armchair,
  orders: ClipboardList,
  kitchen: ChefHat,
  menu: UtensilsCrossed,
  invoices: Receipt,
  discounts: TicketPercent,
  employees: Users,
};

export function Sidebar({
  user,
  menuItems,
  activePage,
  onSelectPage,
  onLogout,
  mobileOpen,
  onCloseMobile,
}: SidebarProps) {
  const sections: ('Vận hành' | 'Quản trị')[] = ['Vận hành', 'Quản trị'];

  const renderSidebarBody = (isMobileDrawer: boolean) => (
    <div className="flex h-full flex-col bg-white border-r border-[#E6E2DC]">
      {/* Góc trên Sidebar: Thương hiệu nhà hàng */}
      <div className="flex h-16 shrink-0 items-center justify-between px-5 border-b border-[#E6E2DC]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#C2572B] text-white">
            <UtensilsCrossed className="h-4 w-4" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="font-display text-base font-bold tracking-tight text-[#1F1D1A] leading-none truncate">
              Bếp Việt
            </p>
            <p className="mt-1 text-[11px] text-[#6E675E] truncate">
              Quản lý Nhà hàng
            </p>
          </div>
        </div>

        {isMobileDrawer && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Đóng danh mục điều hướng"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-[#5E5850] hover:bg-[#F2EFEA] hover:text-[#1F1D1A] focus-visible:outline-2 focus-visible:outline-[#C2572B]"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Thông tin người dùng trên mobile drawer */}
      {isMobileDrawer && (
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#E6E2DC] bg-[#FAF9F7]">
          <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#1F1D1A] truncate">
              {user.fullName}
            </p>
            <p className="text-xs text-[#6E675E] truncate">
              {ROLE_LABELS[user.role]}
            </p>
          </div>
        </div>
      )}

      {/* Danh sách menu tự động theo vai trò */}
      <nav
        aria-label="Điều hướng chính"
        className="flex-1 overflow-y-auto px-3 py-4 space-y-5"
      >
        {sections.map((sectionName) => {
          const sectionItems = menuItems.filter(
            (item) => item.section === sectionName
          );
          if (sectionItems.length === 0) return null;

          return (
            <div key={sectionName} className="space-y-1">
              <p className="px-3 pb-1 text-xs font-medium text-[#7A7268]">
                {sectionName}
              </p>
              <ul className="space-y-0.5">
                {sectionItems.map((item) => {
                  const Icon = NAV_ICONS[item.key];
                  const isActive = item.key === activePage;
                  return (
                    <li key={item.key}>
                      <button
                        type="button"
                        onClick={() => {
                          onSelectPage(item.key);
                          if (isMobileDrawer) onCloseMobile();
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        className={`flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] ${
                          isActive
                            ? 'bg-[#FDF5F1] text-[#9A3D18] font-semibold'
                            : 'text-[#4A453E] hover:bg-[#F5F2EE] hover:text-[#1F1D1A]'
                        }`}
                      >
                        <Icon
                          className={`h-[18px] w-[18px] shrink-0 ${
                            isActive ? 'text-[#C2572B]' : 'text-[#7A7268]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Đáy Sidebar: Nút Đăng xuất */}
      <div className="shrink-0 border-t border-[#E6E2DC] p-3">
        <button
          type="button"
          onClick={onLogout}
          className="flex min-h-[42px] w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-[#5E5850] transition-colors hover:bg-[#FEF3F2] hover:text-[#B42318] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C2572B] cursor-pointer whitespace-nowrap"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" aria-hidden="true" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Sidebar cố định trên Desktop */}
      <aside className="hidden md:block md:w-[260px] md:shrink-0">
        <div className="sticky top-0 h-screen">{renderSidebarBody(false)}</div>
      </aside>

      {/* Drawer trượt trên Mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 md:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Danh mục điều hướng"
        >
          <div
            className="fixed inset-0 bg-[#1F1D1A]/40 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 w-[272px] max-w-[85vw] h-full shadow-xl">
            {renderSidebarBody(true)}
          </div>
        </div>
      )}
    </>
  );
}
