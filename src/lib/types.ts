/** 角色：admin 拥有全部权限，manager 可管理日常业务 */
export type Role = 'admin' | 'manager';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  name: string;
  role: Role;
  phone: string;
  email?: string;
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

export interface Building {
  id: string;
  name: string;
  address: string;
  floors: number;
  keeper: string;
  remark?: string;
  createdAt: string;
}

export type RoomStatus = 'vacant' | 'rented' | 'maintenance';

export interface Room {
  id: string;
  buildingId: string;
  roomNo: string;
  floor: number;
  area: number;
  layout: string;
  orientation: string;
  monthlyRent: number;
  deposit: number;
  status: RoomStatus;
  facilities: string[];
  currentTenantId?: string;
  currentContractId?: string;
  remark?: string;
  updatedAt: string;
}

export type Gender = 'male' | 'female';

export interface Tenant {
  id: string;
  name: string;
  phone: string;
  idCard: string;
  gender: Gender;
  occupation: string;
  emergencyName: string;
  emergencyPhone: string;
  remark?: string;
  createdAt: string;
}

export type ContractStatus = 'active' | 'pending' | 'expired' | 'terminated';

export interface Contract {
  id: string;
  code: string;
  roomId: string;
  tenantId: string;
  startDate: string;
  endDate: string;
  monthlyRent: number;
  deposit: number;
  payCycle: 1 | 3 | 6 | 12; // 付款周期（月）
  status: ContractStatus;
  signedAt: string;
  terminatedAt?: string;
  remark?: string;
}

export type BillStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type PayMethod = 'wechat' | 'alipay' | 'bank' | 'cash';

export interface Bill {
  id: string;
  contractId: string;
  roomId: string;
  tenantId: string;
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  paidAt?: string;
  method?: PayMethod;
  note?: string;
  createdAt: string;
}

export type WorkOrderStatus = 'pending' | 'processing' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface WorkOrder {
  id: string;
  code: string;
  roomId: string;
  tenantId?: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: WorkOrderStatus;
  reporter: string;
  assignee?: string;
  cost?: number;
  createdAt: string;
  resolvedAt?: string;
}

export interface Database {
  users: User[];
  buildings: Building[];
  rooms: Room[];
  tenants: Tenant[];
  contracts: Contract[];
  bills: Bill[];
  workOrders: WorkOrder[];
  meta: {
    version: number;
    seededAt: string;
  };
}

/** 会话中携带的当前登录用户信息（不含密码） */
export type SessionUser = Pick<User, 'id' | 'username' | 'name' | 'role' | 'phone' | 'email'>;
