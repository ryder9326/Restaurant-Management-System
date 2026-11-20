import { useEffect, useMemo, useState } from 'react';
import { LoginScreen } from './components/auth/LoginScreen';
import { AppLayout } from './components/layout/AppLayout';
import { RestaurantProvider } from './context/RestaurantContext';
import {
  DashboardPage,
  DiscountsPage,
  EmployeesPage,
  InvoicesPage,
  KitchenPage,
  MenuPage,
  OrdersPage,
  TablesPage,
} from './pages';
import { authService } from './services';
import { LoginResponse, PageKey, User } from './types';
import {
  canAccessPage,
  getDefaultPageForRole,
  getMenuItemsForRole,
  getNavItemByKey,
} from './utils';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<PageKey>('dashboard');
  const [restoringSession, setRestoringSession] = useState(true);

  useEffect(() => {
    let active = true;
    authService
      .getCurrentSession()
      .then((res) => {
        if (!active) return;
        const sessionUser = res.data?.user ?? null;
        if (sessionUser) {
          setUser(sessionUser);
          setActivePage(getDefaultPageForRole(sessionUser.role));
        }
      })
      .finally(() => {
        if (active) setRestoringSession(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const roleMenuItems = useMemo(
    () => (user ? getMenuItemsForRole(user.role) : []),
    [user]
  );

  function handleLoginSuccess(session: LoginResponse) {
    setUser(session.user);
    setActivePage(getDefaultPageForRole(session.user.role));
  }

  async function handleLogout() {
    await authService.logout();
    setUser(null);
  }

  function handleSelectPage(nextPage: PageKey) {
    if (!user) return;
    if (canAccessPage(user.role, nextPage)) {
      setActivePage(nextPage);
    }
  }

  if (restoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F6F4]">
        <p className="text-sm text-[#5E5850]">Đang khởi tạo phiên làm việc...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  const safeActivePage = canAccessPage(user.role, activePage)
    ? activePage
    : getDefaultPageForRole(user.role);

  const activeNavItem = getNavItemByKey(safeActivePage);

  function renderPageContent(page: PageKey) {
    switch (page) {
      case 'dashboard':
        return <DashboardPage />;
      case 'tables':
        return <TablesPage />;
      case 'orders':
        return <OrdersPage />;
      case 'kitchen':
        return <KitchenPage />;
      case 'menu':
        return <MenuPage />;
      case 'invoices':
        return <InvoicesPage />;
      case 'discounts':
        return <DiscountsPage />;
      case 'employees':
        return <EmployeesPage />;
    }
  }

  return (
    <RestaurantProvider currentUser={user} onNavigate={handleSelectPage}>
      <AppLayout
        user={user}
        menuItems={roleMenuItems}
        activePage={safeActivePage}
        activeNavItem={activeNavItem}
        onSelectPage={handleSelectPage}
        onLogout={handleLogout}
      >
        {renderPageContent(safeActivePage)}
      </AppLayout>
    </RestaurantProvider>
  );
}
