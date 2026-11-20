import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  discountService,
  invoiceService,
  menuService,
  orderService,
  tableService,
} from '../services';
import {
  CheckoutInvoiceRequest,
  CreateOrderRequest,
  DiningTable,
  DiscountCode,
  Invoice,
  MenuItem,
  MenuItemStatus,
  Order,
  OrderItemStatus,
  OrderStatus,
  PageKey,
  UpdateOrderItemChange,
  UpdateTableDetailsRequest,
  User,
} from '../types';
import { DiscountValidationResult } from '../utils';

interface RestaurantContextValue {
  currentUser: User;
  tables: DiningTable[];
  menuItems: MenuItem[];
  orders: Order[];
  invoices: Invoice[];
  discountCodes: DiscountCode[];
  loading: boolean;
  error: string | null;
  selectedPosTableId: number | null;
  setSelectedPosTableId: (tableId: number | null) => void;
  selectedBillingTableId: number | null;
  setSelectedBillingTableId: (tableId: number | null) => void;
  refreshAll: () => Promise<void>;
  refreshMenu: () => Promise<void>;
  updateTable: (
    tableId: number,
    payload: UpdateTableDetailsRequest
  ) => Promise<{ table: DiningTable; message: string }>;
  submitOrder: (
    payload: CreateOrderRequest
  ) => Promise<{ order: Order; message: string }>;
  updateOrderItems: (
    orderId: number,
    changes: UpdateOrderItemChange[]
  ) => Promise<{ order: Order; message: string }>;
  acceptKitchenOrder: (
    orderId: number
  ) => Promise<{ order: Order; message: string }>;
  updateOrderItemStatus: (
    orderId: number,
    orderItemId: number,
    nextStatus: OrderItemStatus
  ) => Promise<{ order: Order; message: string }>;
  completeKitchenOrder: (
    orderId: number
  ) => Promise<{ order: Order; message: string }>;
  updateMenuItemStatus: (
    menuItemId: number,
    status: MenuItemStatus
  ) => Promise<{ menuItem: MenuItem; message: string }>;
  validateDiscount: (
    code: string,
    subtotalVnd: number
  ) => Promise<DiscountValidationResult>;
  checkoutOrder: (
    payload: CheckoutInvoiceRequest
  ) => Promise<{ invoice: Invoice; message: string }>;
  goToPosForTable: (tableId: number) => void;
  goToBillingForTable: (tableId: number) => void;
  navigateTo: (page: PageKey) => void;
}

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

interface RestaurantProviderProps {
  currentUser: User;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}

export function RestaurantProvider({
  currentUser,
  onNavigate,
  children,
}: RestaurantProviderProps) {
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedPosTableId, setSelectedPosTableId] = useState<number | null>(
    null
  );
  const [selectedBillingTableId, setSelectedBillingTableId] = useState<
    number | null
  >(null);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      const [tablesRes, menuRes, ordersRes, invoicesRes, discountsRes] =
        await Promise.all([
          tableService.getTables(),
          menuService.getMenuItems(),
          orderService.getOrders(),
          invoiceService.getInvoices(),
          discountService.getDiscountCodes(),
        ]);

      setTables(tablesRes.data);
      setMenuItems(menuRes.data);
      setOrders(ordersRes.data);
      setInvoices(invoicesRes.data);
      setDiscountCodes(discountsRes.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Không thể đồng bộ dữ liệu vận hành nhà hàng.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshMenu = useCallback(async () => {
    try {
      const menuRes = await menuService.getMenuItems();
      setMenuItems(menuRes.data);
    } catch {
      // Giữ trạng thái hiện tại nếu lỗi tạm thời
    }
  }, []);

  useEffect(() => {
    void refreshAll();
  }, [refreshAll]);

  const updateTable = useCallback(
    async (tableId: number, payload: UpdateTableDetailsRequest) => {
      const res = await tableService.updateTableDetails(tableId, payload);
      setTables((prev) =>
        prev.map((item) => (item.id === tableId ? res.data : item))
      );
      return { table: res.data, message: res.message };
    },
    []
  );

  const submitOrder = useCallback(async (payload: CreateOrderRequest) => {
    const res = await orderService.createOrder(payload);
    // Đồng bộ lại cả danh sách đơn hàng và sơ đồ bàn sau khi tạo/cập nhật phiếu
    const [tablesRes, ordersRes] = await Promise.all([
      tableService.getTables(),
      orderService.getOrders(),
    ]);
    setTables(tablesRes.data);
    setOrders(ordersRes.data);
    return { order: res.data, message: res.message };
  }, []);

  const updateOrderItems = useCallback(
    async (orderId: number, changes: UpdateOrderItemChange[]) => {
      const res = await orderService.updateOrderItems(orderId, changes);
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? res.data : order))
      );
      return { order: res.data, message: res.message };
    },
    []
  );

  const acceptKitchenOrder = useCallback(async (orderId: number) => {
    const res = await orderService.acceptKitchenOrder(orderId);
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? res.data : order))
    );
    return { order: res.data, message: res.message };
  }, []);

  const updateOrderItemStatus = useCallback(
    async (
      orderId: number,
      orderItemId: number,
      nextStatus: OrderItemStatus
    ) => {
      const res = await orderService.updateOrderItemStatus(
        orderId,
        orderItemId,
        nextStatus
      );
      setOrders((prev) =>
        prev.map((order) => (order.id === orderId ? res.data : order))
      );
      return { order: res.data, message: res.message };
    },
    []
  );

  const completeKitchenOrder = useCallback(async (orderId: number) => {
    const res = await orderService.updateOrderStatus(
      orderId,
      OrderStatus.COMPLETED
    );
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? res.data : order))
    );
    return { order: res.data, message: res.message };
  }, []);

  const updateMenuItemStatus = useCallback(
    async (menuItemId: number, status: MenuItemStatus) => {
      const res = await menuService.updateMenuItemStatus(menuItemId, status);
      setMenuItems((prev) =>
        prev.map((item) => (item.id === menuItemId ? res.data : item))
      );
      return { menuItem: res.data, message: res.message };
    },
    []
  );

  const validateDiscount = useCallback(
    async (code: string, subtotalVnd: number) => {
      const res = await discountService.validateDiscountCode(code, subtotalVnd);
      return res.data;
    },
    []
  );

  const checkoutOrder = useCallback(async (payload: CheckoutInvoiceRequest) => {
    const res = await invoiceService.checkoutOrder(payload);
    // Đồng bộ lại bàn (tự động chuyển về AVAILABLE), đơn hàng (SERVED) và hóa đơn (PAID)
    const [tablesRes, ordersRes, invoicesRes] = await Promise.all([
      tableService.getTables(),
      orderService.getOrders(),
      invoiceService.getInvoices(),
    ]);
    setTables(tablesRes.data);
    setOrders(ordersRes.data);
    setInvoices(invoicesRes.data);
    return { invoice: res.data, message: res.message };
  }, []);

  const goToPosForTable = useCallback(
    (tableId: number) => {
      setSelectedPosTableId(tableId);
      onNavigate('orders');
    },
    [onNavigate]
  );

  const goToBillingForTable = useCallback(
    (tableId: number) => {
      setSelectedBillingTableId(tableId);
      onNavigate('invoices');
    },
    [onNavigate]
  );

  return (
    <RestaurantContext.Provider
      value={{
        currentUser,
        tables,
        menuItems,
        orders,
        invoices,
        discountCodes,
        loading,
        error,
        selectedPosTableId,
        setSelectedPosTableId,
        selectedBillingTableId,
        setSelectedBillingTableId,
        refreshAll,
        refreshMenu,
        updateTable,
        submitOrder,
        updateOrderItems,
        acceptKitchenOrder,
        updateOrderItemStatus,
        completeKitchenOrder,
        updateMenuItemStatus,
        validateDiscount,
        checkoutOrder,
        goToPosForTable,
        goToBillingForTable,
        navigateTo: onNavigate,
      }}
    >
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant(): RestaurantContextValue {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error('useRestaurant phải được sử dụng bên trong RestaurantProvider.');
  }
  return ctx;
}

export function useOptionalRestaurant(): RestaurantContextValue | null {
  return useContext(RestaurantContext);
}
