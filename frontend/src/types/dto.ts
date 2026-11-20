import {
  DiscountStatus,
  DiscountType,
  EmployeeStatus,
  InvoiceStatus,
  MenuCategory,
  MenuItemStatus,
  OrderItemStatus,
  OrderStatus,
  PaymentMethod,
  TableArea,
  TableStatus,
  UserRole,
} from './enums';

/**
 * Tài khoản đăng nhập hệ thống (tương ứng UserDTO trong Java Backend)
 */
export interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  active: boolean;
  lastLoginAt?: string;
}

/**
 * Hồ sơ nhân sự nhà hàng (tương ứng EmployeeDTO)
 */
export interface Employee {
  id: number;
  employeeCode: string;
  userId?: number;
  fullName: string;
  phone: string;
  email: string;
  role: UserRole;
  positionTitle: string;
  shift: string;
  baseSalaryVnd: number;
  hireDate: string;
  status: EmployeeStatus;
  avatarUrl?: string;
}

/**
 * Món ăn / Đồ uống trong thực đơn (tương ứng MenuItemDTO)
 */
export interface MenuItem {
  id: number;
  sku: string;
  name: string;
  description: string;
  category: MenuCategory;
  priceVnd: number;
  unit: string;
  preparationMinutes: number;
  status: MenuItemStatus;
  featured: boolean;
  imageUrl?: string;
}

/**
 * Bàn ăn tại nhà hàng (tương ứng DiningTableDTO)
 */
export interface DiningTable {
  id: number;
  tableCode: string;
  tableName: string;
  area: TableArea;
  capacity: number;
  status: TableStatus;
  currentOrderId?: number | null;
  reservedCustomerName?: string | null;
  reservedCustomerPhone?: string | null;
  reservedGuestCount?: number | null;
  reservedAt?: string | null;
}

/**
 * Chi tiết từng món trong đơn hàng (tương ứng OrderItemDTO)
 */
export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItemName: string;
  quantity: number;
  unitPriceVnd: number;
  lineTotalVnd: number;
  note?: string;
  status: OrderItemStatus;
}

/**
 * Đơn gọi món (tương ứng OrderDTO)
 */
export interface Order {
  id: number;
  orderCode: string;
  tableId: number;
  tableName: string;
  staffId: number;
  staffName: string;
  guestCount: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotalVnd: number;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Hóa đơn thanh toán (tương ứng InvoiceDTO)
 */
export interface Invoice {
  id: number;
  invoiceCode: string;
  orderId: number;
  orderCode: string;
  tableName: string;
  cashierId: number;
  cashierName: string;
  subtotalVnd: number;
  discountCode?: string | null;
  discountAmountVnd: number;
  vatRate: number;
  vatAmountVnd: number;
  totalAmountVnd: number;
  paymentMethod?: PaymentMethod | null;
  status: InvoiceStatus;
  issuedAt: string;
  paidAt?: string | null;
}

/**
 * Mã giảm giá / Chương trình khuyến mãi (tương ứng DiscountCodeDTO)
 */
export interface DiscountCode {
  id: number;
  code: string;
  title: string;
  description: string;
  type: DiscountType;
  value: number;
  minOrderVnd: number;
  maxDiscountVnd?: number | null;
  usageLimit: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  status: DiscountStatus;
}

/**
 * DTO xác thực đăng nhập (POST /api/auth/login)
 */
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: 'Bearer';
  expiresInSeconds: number;
  user: User;
}

/**
 * Request tạo đơn gọi món mới (POST /api/orders)
 */
export interface CreateOrderItemRequest {
  menuItemId: number;
  quantity: number;
  note?: string;
}

export interface CreateOrderRequest {
  tableId: number;
  staffId: number;
  staffName?: string;
  guestCount: number;
  note?: string;
  items: CreateOrderItemRequest[];
}

/**
 * Request cập nhật đặt bàn / trạng thái bàn (PATCH /api/tables/{id})
 */
export interface UpdateTableDetailsRequest {
  status: TableStatus;
  currentOrderId?: number | null;
  reservedCustomerName?: string | null;
  reservedCustomerPhone?: string | null;
  reservedGuestCount?: number | null;
  reservedAt?: string | null;
}

/**
 * Request cập nhật món chưa nấu trước khi thanh toán (PUT /api/orders/{id}/items)
 */
export interface UpdateOrderItemChange {
  orderItemId: number;
  quantity: number;
  status: OrderItemStatus;
}

/**
 * Request tạo và thanh toán hóa đơn (POST /api/invoices/checkout)
 */
export interface CheckoutInvoiceRequest {
  orderId: number;
  cashierId: number;
  cashierName: string;
  discountCode?: string | null;
  discountAmountVnd: number;
  vatRate?: number;
  paymentMethod: PaymentMethod;
  cashReceivedVnd?: number;
}

/**
 * Request tạo / cập nhật nhân viên (POST/PUT /api/employees)
 */
export interface UpsertEmployeeRequest {
  employeeCode: string;
  fullName: string;
  role: UserRole;
  positionTitle: string;
  phone: string;
  email: string;
  shift: string;
  baseSalaryVnd: number;
  hireDate: string;
  status: EmployeeStatus;
}

/**
 * Request tạo / cập nhật món ăn (POST/PUT /api/menu-items)
 */
export interface UpsertMenuItemRequest {
  sku: string;
  name: string;
  description: string;
  category: MenuCategory;
  priceVnd: number;
  unit: string;
  preparationMinutes: number;
  status: MenuItemStatus;
  imageUrl?: string;
}

/**
 * DTO thống kê doanh thu (GET /api/reports/revenue)
 */
export type RevenueDatePreset = 'TODAY' | 'LAST_7_DAYS' | 'THIS_MONTH' | 'CUSTOM';

export interface DailySalesRecord {
  date: string; // YYYY-MM-DD
  invoiceCount: number;
  itemsSold: {
    menuItemId: number;
    menuItemName: string;
    category: MenuCategory;
    quantity: number;
    revenueVnd: number;
  }[];
}

export interface DailyRevenuePoint {
  date: string;
  label: string;
  revenueVnd: number;
  invoiceCount: number;
}

export interface CategoryRevenueShare {
  category: MenuCategory;
  label: string;
  revenueVnd: number;
  quantitySold: number;
  percentage: number;
}

export interface TopDishSale {
  menuItemId: number;
  menuItemName: string;
  category: MenuCategory;
  quantitySold: number;
  revenueVnd: number;
}

export interface RevenueReport {
  startDate: string;
  endDate: string;
  totalRevenueVnd: number;
  totalInvoices: number;
  averageOrderValueVnd: number;
  bestSellingDish: TopDishSale | null;
  dailySeries: DailyRevenuePoint[];
  categoryShares: CategoryRevenueShare[];
  topDishes: TopDishSale[];
}

/**
 * Khung phản hồi chuẩn từ Java Spring Boot REST API
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}
