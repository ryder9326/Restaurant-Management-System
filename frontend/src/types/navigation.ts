import { UserRole } from './enums';

export type PageKey =
  | 'dashboard'
  | 'tables'
  | 'orders'
  | 'kitchen'
  | 'menu'
  | 'invoices'
  | 'discounts'
  | 'employees'
  | 'trash';

export interface NavItemConfig {
  key: PageKey;
  label: string;
  shortDescription: string;
  section: 'Vận hành' | 'Quản trị';
  allowedRoles: UserRole[];
}

export interface EndpointDoc {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
}
