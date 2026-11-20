import { ReactNode, useState } from 'react';
import { NavItemConfig, PageKey, User } from '../../types';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

interface AppLayoutProps {
  user: User;
  menuItems: NavItemConfig[];
  activePage: PageKey;
  activeNavItem: NavItemConfig;
  onSelectPage: (page: PageKey) => void;
  onLogout: () => void;
  children: ReactNode;
}

export function AppLayout({
  user,
  menuItems,
  activePage,
  activeNavItem,
  onSelectPage,
  onLogout,
  children,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen w-full flex bg-[#F7F6F4] text-[#1F1D1A]">
      <Sidebar
        user={user}
        menuItems={menuItems}
        activePage={activePage}
        onSelectPage={onSelectPage}
        onLogout={onLogout}
        mobileOpen={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <TopBar
          user={user}
          activeNavItem={activeNavItem}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />

        <main className="flex-1 w-full max-w-[1280px] mx-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
