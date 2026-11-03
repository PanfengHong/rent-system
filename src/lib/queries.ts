import 'server-only';
import { billStatusOf, outstandingOf } from './billing';
import { getDb } from './db';
import type {
  Bill,
  BillStatus,
  Contract,
  Room,
  Tenant,
  WorkOrder,
} from './types';
import { addDays, addMonths, diffDays, parseDate, percent, todayISO } from './utils';

export interface RoomView extends Room {
  buildingName: string;
  buildingShort: string;
  tenantName?: string;
  tenantPhone?: string;
  contractCode?: string;
}

export interface ContractView extends Contract {
  roomNo: string;
  buildingName: string;
  buildingShort: string;
  tenantName: string;
  tenantPhone: string;
  paid: number;
  outstanding: number;
  daysLeft: number;
}

export interface BillView extends Bill {
  roomNo: string;
  buildingName: string;
  buildingShort: string;
  tenantName: string;
  contractCode: string;
  status: BillStatus;
  outstanding: number;
}

export interface WorkOrderView extends WorkOrder {
  roomNo: string;
  buildingName: string;
  buildingShort: string;
  tenantName?: string;
  tenantPhone?: string;
}

export interface TenantView extends Tenant {
  roomNo?: string;
  buildingShort?: string;
  contractCode?: string;
  contractEnd?: string;
  daysLeft?: number;
  monthlyRent?: number;
  renting: boolean;
}

function shortBuilding(name: string) {
  const idx = name.lastIndexOf('·');
  return idx >= 0 ? name.slice(idx + 1).trim() : name;
}

export function getRoomViews(): RoomView[] {
  const db = getDb();
  const buildings = new Map(db.buildings.map((b) => [b.id, b]));
  const buildingOrder = new Map(db.buildings.map((b, i) => [b.id, i]));
  const tenants = new Map(db.tenants.map((t) => [t.id, t]));
  const contracts = new Map(db.contracts.map((c) => [c.id, c]));

  return db.rooms
    .map((room) => {
      const building = buildings.get(room.buildingId);
      const tenant = room.currentTenantId ? tenants.get(room.currentTenantId) : undefined;
      const contract = room.currentContractId ? contracts.get(room.currentContractId) : undefined;
      return {
        ...room,
        buildingName: building?.name ?? '未分配楼栋',
        buildingShort: shortBuilding(building?.name ?? '未分配'),
        tenantName: tenant?.name,
        tenantPhone: tenant?.phone,
        contractCode: contract?.code,
      };
    })
    .sort(
      (a, b) =>
        (buildingOrder.get(a.buildingId) ?? 99) - (buildingOrder.get(b.buildingId) ?? 99) ||
        a.floor - b.floor ||
        a.roomNo.localeCompare(b.roomNo)
    );
}

export function getBillViews(): BillView[] {
  const db = getDb();
  const rooms = new Map(db.rooms.map((r) => [r.id, r]));
  const buildings = new Map(db.buildings.map((b) => [b.id, b]));
  const tenants = new Map(db.tenants.map((t) => [t.id, t]));
  const contracts = new Map(db.contracts.map((c) => [c.id, c]));

  return db.bills
    .map((bill) => {
      const room = rooms.get(bill.roomId);
      const building = room ? buildings.get(room.buildingId) : undefined;
      return {
        ...bill,
        roomNo: room?.roomNo ?? '—',
        buildingName: building?.name ?? '—',
        buildingShort: shortBuilding(building?.name ?? '未分配'),
        tenantName: tenants.get(bill.tenantId)?.name ?? '—',
        contractCode: contracts.get(bill.contractId)?.code ?? '—',
        status: billStatusOf(bill),
        outstanding: outstandingOf(bill),
      };
    })
    .sort((a, b) => b.periodStart.localeCompare(a.periodStart));
}

export function getContractViews(): ContractView[] {
  const db = getDb();
  const rooms = new Map(db.rooms.map((r) => [r.id, r]));
  const buildings = new Map(db.buildings.map((b) => [b.id, b]));
  const tenants = new Map(db.tenants.map((t) => [t.id, t]));
  const today = todayISO();

  return db.contracts
    .map((contract) => {
      const room = rooms.get(contract.roomId);
      const building = room ? buildings.get(room.buildingId) : undefined;
      const tenant = tenants.get(contract.tenantId);
      const related = db.bills.filter((b) => b.contractId === contract.id);
      const paid = related.reduce((sum, b) => sum + b.paidAmount, 0);
      const total = related.reduce((sum, b) => sum + b.amount, 0);

      return {
        ...contract,
        roomNo: room?.roomNo ?? '—',
        buildingName: building?.name ?? '—',
        buildingShort: shortBuilding(building?.name ?? '未分配'),
        tenantName: tenant?.name ?? '—',
        tenantPhone: tenant?.phone ?? '—',
        paid,
        outstanding: Math.max(0, Math.round((total - paid) * 100) / 100),
        daysLeft: diffDays(today, contract.endDate),
      };
    })
    .sort((a, b) => a.endDate.localeCompare(b.endDate));
}

export function getWorkOrderViews(): WorkOrderView[] {
  const db = getDb();
  const rooms = new Map(db.rooms.map((r) => [r.id, r]));
  const buildings = new Map(db.buildings.map((b) => [b.id, b]));
  const tenants = new Map(db.tenants.map((t) => [t.id, t]));

  return db.workOrders
    .map((order) => {
      const room = rooms.get(order.roomId);
      const building = room ? buildings.get(room.buildingId) : undefined;
      const tenant = order.tenantId ? tenants.get(order.tenantId) : undefined;
      return {
        ...order,
        roomNo: room?.roomNo ?? '—',
        buildingName: building?.name ?? '—',
        buildingShort: shortBuilding(building?.name ?? '未分配'),
        tenantName: tenant?.name,
        tenantPhone: tenant?.phone,
      };
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getTenantViews(): TenantView[] {
  const db = getDb();
  const rooms = new Map(db.rooms.map((r) => [r.id, r]));
  const buildings = new Map(db.buildings.map((b) => [b.id, b]));
  const today = todayISO();

  return db.tenants
    .map((tenant) => {
      const contract = db.contracts.find((c) => c.tenantId === tenant.id && c.status === 'active');
      const room = contract ? rooms.get(contract.roomId) : undefined;
      const building = room ? buildings.get(room.buildingId) : undefined;
      return {
        ...tenant,
        roomNo: room?.roomNo,
        buildingShort: building ? shortBuilding(building.name) : undefined,
        contractCode: contract?.code,
        contractEnd: contract?.endDate,
        daysLeft: contract ? diffDays(today, contract.endDate) : undefined,
        monthlyRent: contract?.monthlyRent,
        renting: Boolean(contract),
      };
    })
    .sort((a, b) => (a.renting === b.renting ? a.name.localeCompare(b.name) : a.renting ? -1 : 1));
}

/* ------------------------------- 统计聚合 ------------------------------- */
export interface RevenuePoint {
  label: string;
  month: string;
  receivable: number;
  received: number;
}

function overlapDays(aStart: string, aEnd: string, bStart: string, bEnd: string) {
  const start = Math.max(parseDate(aStart).getTime(), parseDate(bStart).getTime());
  const end = Math.min(parseDate(aEnd).getTime(), parseDate(bEnd).getTime());
  return Math.max(0, Math.round((end - start) / 86400000) + 1);
}

export function getRevenueSeries(months = 6): RevenuePoint[] {
  const db = getDb();
  const today = todayISO();
  const points: RevenuePoint[] = [];

  for (let i = months - 1; i >= 0; i -= 1) {
    const monthStart = `${addMonths(today, -i).slice(0, 7)}-01`;
    const monthEnd = addDays(addMonths(monthStart, 1), -1);

    let receivable = 0;
    let received = 0;

    db.bills.forEach((bill) => {
      const periodDays = diffDays(bill.periodStart, bill.periodEnd) + 1;
      const overlap = overlapDays(bill.periodStart, bill.periodEnd, monthStart, monthEnd);
      if (overlap > 0) receivable += (bill.amount * overlap) / periodDays;
      if (bill.paidAt && bill.paidAt.slice(0, 7) === monthStart.slice(0, 7)) received += bill.paidAmount;
    });

    points.push({
      label: `${Number(monthStart.slice(5, 7))}月`,
      month: monthStart,
      receivable: Math.round(receivable),
      received: Math.round(received),
    });
  }

  return points;
}

export function getDashboard() {
  const db = getDb();
  const rooms = getRoomViews();
  const bills = getBillViews();
  const contracts = getContractViews();
  const orders = getWorkOrderViews();
  const today = todayISO();

  const total = rooms.length;
  const rented = rooms.filter((r) => r.status === 'rented').length;
  const vacant = rooms.filter((r) => r.status === 'vacant').length;
  const maintenance = rooms.filter((r) => r.status === 'maintenance').length;

  const currentBills = bills.filter((b) => b.periodStart <= today && b.periodEnd >= today);
  const periodReceivable = currentBills.reduce((sum, b) => sum + b.amount, 0);
  const periodReceived = currentBills.reduce((sum, b) => sum + b.paidAmount, 0);

  const overdueBills = bills.filter((b) => b.status === 'overdue');
  const overdueAmount = overdueBills.reduce((sum, b) => sum + b.outstanding, 0);
  const monthReceived = bills
    .filter((b) => b.paidAt?.slice(0, 7) === today.slice(0, 7))
    .reduce((sum, b) => sum + b.paidAmount, 0);

  const expiring = contracts
    .filter((c) => c.status === 'active' && c.daysLeft >= 0 && c.daysLeft <= 60)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const buildingStats = db.buildings.map((building) => {
    const list = rooms.filter((r) => r.buildingId === building.id);
    const rentedCount = list.filter((r) => r.status === 'rented').length;
    return {
      id: building.id,
      name: shortBuilding(building.name),
      fullName: building.name,
      total: list.length,
      rented: rentedCount,
      vacant: list.filter((r) => r.status === 'vacant').length,
      occupancy: percent(rentedCount, list.length),
    };
  });

  return {
    kpi: {
      totalRooms: total,
      rented,
      vacant,
      maintenance,
      occupancy: percent(rented, total),
      periodReceivable,
      periodReceived,
      collectionRate: percent(periodReceived, periodReceivable),
      monthReceived,
      overdueAmount,
      overdueCount: overdueBills.length,
      expiringCount: expiring.length,
      pendingOrders: orders.filter((o) => o.status !== 'done').length,
    },
    revenue: getRevenueSeries(6),
    roomStatus: [
      { label: '已出租', value: rented, color: '#2849e3' },
      { label: '空置待租', value: vacant, color: '#cbd5e1' },
      { label: '维修中', value: maintenance, color: '#f59e0b' },
    ],
    buildings: buildingStats,
    expiring: expiring.slice(0, 5),
    overdue: overdueBills.sort((a, b) => b.outstanding - a.outstanding).slice(0, 5),
    orders: orders.filter((o) => o.status !== 'done').slice(0, 5),
    rooms,
  };
}

export function getReport() {
  const db = getDb();
  const rooms = getRoomViews();
  const bills = getBillViews();
  const contracts = getContractViews();
  const today = todayISO();
  const revenue = getRevenueSeries(12);

  const buildingIncome = db.buildings.map((building) => {
    const list = rooms.filter((r) => r.buildingId === building.id);
    const rentedList = list.filter((r) => r.status === 'rented');
    const receivable = rentedList.reduce((sum, r) => sum + r.monthlyRent, 0);
    const buildingBills = bills.filter((b) => b.buildingName === building.name && b.periodStart <= today && b.periodEnd >= today);
    const received = buildingBills.reduce((sum, b) => sum + b.paidAmount, 0);
    return {
      id: building.id,
      name: shortBuilding(building.name),
      total: list.length,
      rented: rentedList.length,
      occupancy: percent(rentedList.length, list.length),
      monthlyRent: receivable,
      received,
    };
  });

  const buckets = [
    { label: '未到期', min: -9999, max: 0, color: '#10b981' },
    { label: '逾期 1-30 天', min: 1, max: 30, color: '#f59e0b' },
    { label: '逾期 31-60 天', min: 31, max: 60, color: '#fb7185' },
    { label: '逾期 60 天以上', min: 61, max: 99999, color: '#e11d48' },
  ];

  const aging = buckets.map((bucket) => {
    const list = bills.filter((b) => {
      if (b.outstanding <= 0) return false;
      const overdueDays = diffDays(b.dueDate, today);
      return overdueDays >= bucket.min && overdueDays <= bucket.max;
    });
    return {
      label: bucket.label,
      color: bucket.color,
      amount: Math.round(list.reduce((sum, b) => sum + b.outstanding, 0)),
      count: list.length,
    };
  });

  const allDebtors = Object.values(
    bills
      .filter((b) => b.outstanding > 0)
      .reduce<Record<string, { tenantName: string; room: string; building: string; amount: number; maxOverdue: number }>>((acc, bill) => {
        const key = bill.tenantId;
        const days = diffDays(bill.dueDate, today);
        if (!acc[key]) {
          acc[key] = {
            tenantName: bill.tenantName,
            room: `${bill.buildingShort} ${bill.roomNo}`,
            building: bill.buildingName,
            amount: 0,
            maxOverdue: 0,
          };
        }
        acc[key].amount += bill.outstanding;
        acc[key].maxOverdue = Math.max(acc[key].maxOverdue, days);
        return acc;
      }, {})
  )
    .sort((a, b) => b.amount - a.amount);

  const debtors = allDebtors.slice(0, 6);

  const methodMap = new Map<string, number>();
  bills
    .filter((b) => b.paidAt && b.method)
    .filter((b) => b.paidAt!.slice(0, 7) === today.slice(0, 7))
    .forEach((b) => methodMap.set(b.method!, (methodMap.get(b.method!) ?? 0) + b.paidAmount));

  const totalRooms = rooms.length;
  const rentedRooms = rooms.filter((r) => r.status === 'rented').length;
  const avgRent = rentedRooms
    ? Math.round(rooms.filter((r) => r.status === 'rented').reduce((s, r) => s + r.monthlyRent, 0) / rentedRooms)
    : 0;

  const activeContracts = contracts.filter((c) => c.status === 'active');

  return {
    revenue,
    buildingIncome,
    aging,
    debtors,
    methods: Array.from(methodMap.entries()).map(([method, value]) => ({ method, value })),
    summary: {
      occupancy: percent(rentedRooms, totalRooms),
      avgRent,
      activeContracts: activeContracts.length,
      overdueRate: percent(allDebtors.length, db.tenants.length),
      debtorCount: allDebtors.length,
      totalReceivable: bills.reduce((s, b) => s + b.amount, 0),
      totalReceived: bills.reduce((s, b) => s + b.paidAmount, 0),
    },
  };
}

export function getShellAlerts() {
  const db = getDb();
  const today = todayISO();
  const expiring = db.contracts.filter(
    (c) => c.status === 'active' && diffDays(today, c.endDate) >= 0 && diffDays(today, c.endDate) <= 30
  ).length;
  const overdue = db.bills.filter((b) => billStatusOf(b) === 'overdue').length;
  const orders = db.workOrders.filter((w) => w.status === 'pending').length;

  return [
    { label: '合同 30 天内到期', count: expiring, href: '/contracts', tone: 'amber' as const },
    { label: '逾期未收账单', count: overdue, href: '/bills', tone: 'red' as const },
    { label: '待受理报修', count: orders, href: '/maintenance', tone: 'amber' as const },
  ].filter((a) => a.count > 0);
}

export type { Bill, Contract, Room, WorkOrder };
