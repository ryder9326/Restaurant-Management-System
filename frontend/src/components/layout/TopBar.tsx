import { ChevronRight, Menu } from 'lucide-react';
import { NavItemConfig, User } from '../../types';
import { ROLE_LABELS } from '../../utils';
import { UserAvatar } from '../common/UserAvatar';

interface TopBarProps {
  user: User;
  activeNavItem: NavItemConfig;
  onOpenMobileMenu: () => void;
}

export function TopBar({
  user,
  activeNavItem,
  onOpenMobileMenu,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-[#E6E2DC] bg-white px-4 sm:px-6 lg:px-8">
      {/* Vùng trái: Nút mở menu di động + Breadcrumb theo ngữ cảnh */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          aria-label="Mở danh mục điều hướng"
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#4A453E] hover:bg-[#F2EFEA] hover:text-[#1F1D1A] focus-visible:outline-2 focus-visible:outline-[#C2572B] md:hidden cursor-pointer"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <nav
          aria-label="Đường dẫn trang hiện tại"
          className="flex items-center gap-1.5 text-sm min-w-0"
        >
          <span className="hidden sm:inline text-[#6E675E] whitespace-nowrap shrink-0">
            Bếp Việt
          </span>
          <ChevronRight
            className="hidden sm:inline h-4 w-4 text-[#B8B0A4] shrink-0"
            aria-hidden="true"
          />
          <span className="font-semibold text-[#1F1D1A] truncate">
            {activeNavItem.label}
          </span>
        </nav>
      </div>

      {/* Vùng phải: Hiển thị tên & vai trò người dùng ở góc trên */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="text-right min-w-0">
          <p className="text-sm font-semibold text-[#1F1D1A] leading-tight truncate max-w-[160px] sm:max-w-none">
            {user.fullName}
          </p>
          <p className="mt-0.5 text-xs text-[#6E675E] leading-tight whitespace-nowrap">
            {ROLE_LABELS[user.role]}
          </p>
        </div>
        <UserAvatar
          name={user.fullName}
          avatarUrl={user.avatarUrl}
          size="sm"
        />
      </div>
    </header>
  );
}
