import type { BadgeTone } from '@/components/ui/base';
import type { BillStatus, ContractStatus, Priority, RoomStatus, WorkOrderStatus } from './types';

export const ROOM_STATUS_META: Record<RoomStatus, { label: string; tone: BadgeTone }> = {
  rented: { label: '已出租', tone: 'green' },
  vacant: { label: '空置待租', tone: 'slate' },
  maintenance: { label: '维修中', tone: 'amber' },
};

export const CONTRACT_STATUS_META: Record<ContractStatus, { label: string; tone: BadgeTone }> = {
  active: { label: '履行中', tone: 'green' },
  pending: { label: '待生效', tone: 'blue' },
  expired: { label: '已到期', tone: 'slate' },
  terminated: { label: '已退租', tone: 'red' },
};

export const BILL_STATUS_META: Record<BillStatus, { label: string; tone: BadgeTone }> = {
  paid: { label: '已收清', tone: 'green' },
  partial: { label: '部分收款', tone: 'blue' },
  unpaid: { label: '待收款', tone: 'amber' },
  overdue: { label: '已逾期', tone: 'red' },
};

export const ORDER_STATUS_META: Record<WorkOrderStatus, { label: string; tone: BadgeTone }> = {
  pending: { label: '待受理', tone: 'amber' },
  processing: { label: '处理中', tone: 'blue' },
  done: { label: '已完成', tone: 'green' },
};

export const PRIORITY_META: Record<Priority, { label: string; tone: BadgeTone }> = {
  high: { label: '高', tone: 'red' },
  medium: { label: '中', tone: 'amber' },
  low: { label: '低', tone: 'slate' },
};

export const PAY_CYCLE_LABEL: Record<number, string> = {
  1: '月付',
  3: '季付',
  6: '半年付',
  12: '年付',
};

export const FACILITIES = ['空调', '热水器', '独立卫浴', '宽带', '衣柜', '冰箱', '洗衣机', '阳台', '燃气灶', '电视'];

export const WORK_CATEGORIES = ['水电', '家电', '门窗', '网络', '其他'];
