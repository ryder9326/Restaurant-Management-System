/**
 * Các Enum trạng thái và phân quyền sử dụng chuẩn CHỮ_IN_HOA (UPPER_SNAKE_CASE)
 * tương thích trực tiếp với Java Enum / Jackson Serialization ở Backend Spring Boot.
 */

export enum UserRole {
  MANAGER = 'MANAGER',
  STAFF = 'STAFF',
  CHEF = 'CHEF',
}

export enum EmployeeStatus {
  ACTIVE = 'ACTIVE',
  ON_LEAVE = 'ON_LEAVE',
  INACTIVE = 'INACTIVE',
}

export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  CLEANING = 'CLEANING',
}

export enum TableArea {
  FLOOR_1 = 'FLOOR_1',
  FLOOR_2 = 'FLOOR_2',
  VIP_ROOM = 'VIP_ROOM',
  OUTDOOR = 'OUTDOOR',
}

export enum MenuCategory {
  APPETIZER = 'APPETIZER',
  MAIN_COURSE = 'MAIN_COURSE',
  SOUP_HOTPOT = 'SOUP_HOTPOT',
  DRINK = 'DRINK',
  DESSERT = 'DESSERT',
}

export enum MenuItemStatus {
  AVAILABLE = 'AVAILABLE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
  DISCONTINUED = 'DISCONTINUED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  COMPLETED = 'COMPLETED',
  SERVED = 'SERVED',
  CANCELLED = 'CANCELLED',
}

export enum OrderItemStatus {
  PENDING = 'PENDING',
  COOKING = 'COOKING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PAID = 'PAID',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CARD = 'CARD',
  E_WALLET = 'E_WALLET',
}

export enum DiscountType {
  PERCENTAGE = 'PERCENTAGE',
  FIXED_AMOUNT = 'FIXED_AMOUNT',
}

export enum DiscountStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  DISABLED = 'DISABLED',
}
