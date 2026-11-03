import type {
  Building,
  Contract,
  Database,
  Room,
  Tenant,
  User,
  WorkOrder,
} from './types';
import { addDays, addMonths, todayISO, uid } from './utils';
import { buildBillPlan } from './billing';
import { hashPassword } from './password';

function createRng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const SURNAMES = ['李', '王', '张', '陈', '刘', '赵', '孙', '周', '吴', '郑', '徐', '何', '黄', '马', '朱', '胡', '林', '高', '罗', '梁', '宋', '谢', '唐', '韩', '冯'];
const GIVEN = ['思远', '梦琪', '浩然', '雨桐', '子墨', '一诺', '嘉怡', '天宇', '静怡', '凯文', '若曦', '俊杰', '雅雯', '晓东', '可欣', '博文', '佳怡', '子涵', '艺涵', '子轩', '依诺', '明轩', '婉清', '沐辰', '思琪', '子昂', '欣妍', '泽宇', '安然', '宇航'];
const OCCUPATIONS = ['互联网产品经理', '软件工程师', 'UI 设计师', '中学教师', '儿科医生', '财务主管', '律师助理', '销售经理', '自由职业者', '在读研究生', '建筑师', '新媒体运营'];
const LAYOUTS = ['开间', '1室1厅', '2室1厅', '2室2厅'];
const ORIENTATIONS = ['朝南', '朝东南', '朝东', '朝西南', '朝北'];
const FACILITY_POOL = ['空调', '热水器', '独立卫浴', '宽带', '衣柜', '冰箱', '洗衣机', '阳台', '燃气灶'];
const CATEGORIES = ['水电', '家电', '门窗', '网络', '其他'];
const WO_TITLES = ['卫生间下水道堵塞', '空调不制冷', '厨房水龙头漏水', '入户门锁芯松动', '宽带频繁掉线', '热水器无热水', '阳台推拉门卡顿', '客厅灯不亮', '马桶水箱漏水', '洗衣机排水异常'];
const WO_DESC = [
  '租客反馈该问题已持续两三天，希望尽快安排师傅上门检修。',
  '已电话联系租客，工作日白天家中有人，可随时上门。',
  '问题影响正常使用，租客希望安排在周末处理。',
  '巡检时发现该问题，已提醒租客先注意用电安全。',
  '租客表示此前自行处理过但未解决，需要专业师傅上门。',
  '紧急程度一般，可与同楼层其他工单合并处理。',
];

export function seedDatabase(): Database {
  const rng = createRng(20261102);
  const pick = <T,>(arr: T[]) => arr[Math.floor(rng() * arr.length)];
  const int = (min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
  const today = todayISO();
  const nowIso = new Date().toISOString();

  const users: User[] = [
    {
      id: 'u_admin',
      username: 'admin',
      passwordHash: hashPassword('admin123'),
      name: '管理员',
      role: 'admin',
      phone: '13800001234',
      email: 'chenming@yunjuzufang.com',
      status: 'active',
      createdAt: nowIso,
    },
    {
      id: 'u_manager',
      username: 'manager',
      passwordHash: hashPassword('manager123'),
      name: '林小雨',
      role: 'manager',
      phone: '13800005678',
      email: 'linxiaoyu@yunjuzufang.com',
      status: 'active',
      createdAt: nowIso,
    },
  ];

  const buildingSeeds = [
    { name: '云居公寓 · 望京 A 座', address: '北京市朝阳区望京西路 88 号', floors: 6, keeper: '林小雨' },
    { name: '云居公寓 · 望京 B 座', address: '北京市朝阳区望京西路 90 号', floors: 5, keeper: '周牧' },
    { name: '青年社区 · 酒仙桥 C 座', address: '北京市朝阳区酒仙桥路 12 号', floors: 4, keeper: '苏晴' },
  ];

  const buildings: Building[] = buildingSeeds.map((b, i) => ({
    id: `b_${i + 1}`,
    ...b,
    remark: i === 0 ? '主力楼盘，配套共享健身房' : undefined,
    createdAt: nowIso,
  }));

  const rooms: Room[] = [];
  const tenants: Tenant[] = [];
  const contracts: Contract[] = [];
  const bills: Database['bills'] = [];

  let tenantSeq = 0;
  let contractSeq = 0;

  buildings.forEach((building, bIndex) => {
    for (let floor = 1; floor <= building.floors; floor += 1) {
      for (let unit = 1; unit <= 4; unit += 1) {
        const layout = unit === 1 ? LAYOUTS[0] : pick(LAYOUTS.slice(1));
        const area = unit === 1 ? int(26, 34) : int(38, 72);
        const base = 2100 + bIndex * 260 + floor * 90 + area * 42;
        const monthlyRent = Math.round((base + int(-180, 320)) / 50) * 50;
        const roll = rng();
        const status: Room['status'] = roll < 0.07 ? 'maintenance' : roll < 0.26 ? 'vacant' : 'rented';

        const room: Room = {
          id: `r_${building.id}_${floor}${String(unit).padStart(2, '0')}`,
          buildingId: building.id,
          roomNo: `${floor}0${unit}`,
          floor,
          area,
          layout,
          orientation: pick(ORIENTATIONS),
          monthlyRent,
          deposit: monthlyRent,
          status,
          facilities: FACILITY_POOL.filter(() => rng() > 0.32).slice(0, 7),
          updatedAt: nowIso,
        };
        if (!room.facilities.includes('空调')) room.facilities.unshift('空调');
        if (!room.facilities.includes('宽带')) room.facilities.push('宽带');
        rooms.push(room);

        if (status !== 'rented') continue;

        tenantSeq += 1;
        const gender = rng() > 0.45 ? 'female' : 'male';
        const tenant: Tenant = {
          id: `t_${tenantSeq}`,
          name: `${pick(SURNAMES)}${pick(GIVEN)}`,
          phone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
          idCard: `110105${int(1988, 2002)}${String(int(1, 12)).padStart(2, '0')}${String(int(1, 28)).padStart(2, '0')}${int(1000, 9999)}`,
          gender,
          occupation: pick(OCCUPATIONS),
          emergencyName: `${pick(SURNAMES)}${pick(GIVEN)}`,
          emergencyPhone: `13${int(1, 9)}${String(int(10000000, 99999999))}`,
          createdAt: nowIso,
        };
        tenants.push(tenant);

        contractSeq += 1;
        const duration = rng() > 0.82 ? 6 : 12;
        const monthsAgo = duration === 6 ? int(1, 4) : int(1, 11);
        const startMonth = addMonths(today, -monthsAgo);
        const startOffset = int(0, 12);
        const startDate = addDays(startMonth, startOffset - 12);
        const endDate = addDays(addMonths(startDate, duration), -1);
        const payCycle = rng() > 0.55 ? 3 : 1;

        const contract: Contract = {
          id: `c_${contractSeq}`,
          code: `HT${startDate.slice(0, 4)}${String(contractSeq).padStart(3, '0')}`,
          roomId: room.id,
          tenantId: tenant.id,
          startDate,
          endDate,
          monthlyRent,
          deposit: monthlyRent,
          payCycle: payCycle as 1 | 3,
          status: endDate < today ? 'expired' : 'active',
          signedAt: addDays(startDate, -int(1, 6)),
          remark: rng() > 0.9 ? '含物业费，水电按表另计' : undefined,
        };
        contracts.push(contract);

        room.currentTenantId = tenant.id;
        room.currentContractId = contract.id;

        buildBillPlan(contract).forEach((draft) => {
          // 只为已经开始的账期生成历史账单，后续账期由「生成下期账单」补充
          if (draft.periodStart > today) return;

          const isPast = draft.periodEnd < today;
          const isCurrent = draft.periodStart <= today && draft.periodEnd >= today;
          let paidAmount = 0;
          let paidAt: string | undefined;

          if (isPast) {
            const r = rng();
            if (r > 0.05) {
              paidAmount = draft.amount;
              paidAt = addDays(draft.dueDate, int(-1, 5));
            } else if (r > 0.02) {
              paidAmount = Math.round(draft.amount * 0.5);
              paidAt = addDays(draft.dueDate, int(6, 16));
            }
          } else if (isCurrent) {
            const r = rng();
            if (r > 0.18) {
              paidAmount = draft.amount;
              paidAt = addDays(draft.dueDate, int(-2, 2));
            } else if (r > 0.1) {
              paidAmount = Math.round(draft.amount * 0.5);
              paidAt = addDays(draft.dueDate, 1);
            }
          }

          bills.push({
            id: uid('bill'),
            contractId: contract.id,
            roomId: room.id,
            tenantId: tenant.id,
            periodStart: draft.periodStart,
            periodEnd: draft.periodEnd,
            dueDate: draft.dueDate,
            amount: draft.amount,
            paidAmount,
            paidAt,
            method: paidAmount ? pick(['wechat', 'alipay', 'bank', 'cash'] as const) : undefined,
            createdAt: addDays(draft.periodStart, -3),
          });
        });
      }
    }
  });

  const rentedRooms = rooms.filter((r) => r.status === 'rented');
  const workOrders: WorkOrder[] = Array.from({ length: 11 }).map((_, i) => {
    const room = rentedRooms[(i * 7) % rentedRooms.length];
    const status = i < 4 ? 'pending' : i < 7 ? 'processing' : 'done';
    const createdAt = addDays(today, -int(0, 18));
    return {
      id: `w_${i + 1}`,
      code: `WO${createdAt.replace(/-/g, '').slice(2)}${String(i + 1).padStart(2, '0')}`,
      roomId: room.id,
      tenantId: room.currentTenantId,
      title: WO_TITLES[i % WO_TITLES.length],
      description: WO_DESC[i % WO_DESC.length],
      category: pick(CATEGORIES),
      priority: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
      status,
      reporter: '租客报修',
      assignee: status === 'pending' ? undefined : pick(['王师傅', '李师傅', '赵师傅']),
      cost: status === 'done' ? int(60, 480) : undefined,
      createdAt: new Date(`${createdAt}T09:30:00`).toISOString(),
      resolvedAt: status === 'done' ? new Date(`${addDays(createdAt, int(1, 3))}T16:20:00`).toISOString() : undefined,
    };
  });

  return {
    users,
    buildings,
    rooms,
    tenants,
    contracts,
    bills,
    workOrders,
    meta: { version: 1, seededAt: nowIso },
  };
}
