const BASE = 'http://localhost:3000';

let cookie = '';
async function call(path, { method = 'GET', body } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  if (setCookie.length) cookie = setCookie.map((c) => c.split(';')[0]).join('; ');
  const json = await res.json().catch(() => null);
  return { status: res.status, json };
}

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

// 1. 登录
let r = await call('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'admin123' } });
check('管理员登录', r.status === 200 && r.json.ok, `status=${r.status}`);

r = await call('/api/auth/login', { method: 'POST', body: { username: 'admin', password: 'wrong' } });
check('错误密码被拒绝', r.status === 401);

// 2. 房间 CRUD
r = await call('/api/rooms', { method: 'POST', body: { buildingId: 'b_1', roomNo: 'T900', floor: 9, area: 50, monthlyRent: 5000, layout: '1室1厅', status: 'vacant' } });
const room = r.json?.data;
check('创建房间', r.status === 201 && room?.roomNo === 'T900');

r = await call(`/api/rooms/${room.id}`, { method: 'PATCH', body: { monthlyRent: 5200 } });
check('修改房间租金', r.status === 200 && r.json.data.monthlyRent === 5200);

r = await call('/api/rooms', { method: 'POST', body: { buildingId: 'b_1', roomNo: 'T900', area: 50, monthlyRent: 5000 } });
check('重复房间号被拒绝', r.status === 400, r.json?.message);

// 3. 租客
r = await call('/api/tenants', { method: 'POST', body: { name: '测试租客', phone: '13900001111', gender: 'male', occupation: '测试工程师', idCard: '110105199001011234' } });
const tenant = r.json?.data;
check('创建租客', r.status === 201 && tenant?.name === '测试租客');

r = await call('/api/tenants', { method: 'POST', body: { name: '重复手机号', phone: '13900001111' } });
check('重复手机号被拒绝', r.status === 400);

// 4. 合同 + 账单
r = await call('/api/contracts', {
  method: 'POST',
  body: { roomId: room.id, tenantId: tenant.id, startDate: '2026-01-01', endDate: '2026-12-31', monthlyRent: 5200, deposit: 5200, payCycle: 3 },
});
const contract = r.json?.data;
check('创建合同', r.status === 201 && contract?.code?.startsWith('HT'), `code=${contract?.code}`);

const bills = (await call('/api/bills')).json.data.filter((b) => b.contractId === contract.id);
check('自动生成账单（季付 4 期）', bills.length === 4, `bills=${bills.length}`);

r = await call('/api/rooms', { method: 'POST', body: { buildingId: 'b_1', roomNo: 'T901', area: 30, monthlyRent: 3000 } });
const room2 = r.json.data;
r = await call('/api/contracts', { method: 'POST', body: { roomId: room.id, tenantId: tenant.id, startDate: '2026-02-01', endDate: '2026-06-30', monthlyRent: 5200, payCycle: 1 } });
check('冲突合同被拒绝', r.status === 409, r.json?.message);

// 5. 收款
const target = bills[0];
r = await call(`/api/bills/${target.id}/pay`, { method: 'POST', body: { amount: 5000, method: 'wechat' } });
check('部分收款', r.status === 200 && r.json.data.paidAmount === 5000);

r = await call(`/api/bills/${target.id}/pay`, { method: 'POST', body: { amount: 999999, method: 'wechat' } });
check('超额收款被拒绝', r.status === 400, r.json?.message);

r = await call(`/api/bills/${target.id}/pay`, { method: 'POST', body: { amount: 10600, method: 'wechat' } });
check('补收尾款', r.status === 200 && r.json.data.paidAmount === 15600);

// 6. 续租 + 退租
r = await call(`/api/contracts/${contract.id}`, { method: 'PATCH', body: { action: 'renew', months: 12, monthlyRent: 5400, payCycle: 3 } });
const renewed = r.json?.data;
check('续租生成新合同', r.status === 201 && renewed.startDate === '2027-01-01', `start=${renewed?.startDate}`);

r = await call(`/api/contracts/${renewed.id}`, { method: 'PATCH', body: { action: 'terminate' } });
check('办理退租', r.status === 200 && r.json.data.status === 'terminated');

// 7. 工单
r = await call('/api/workorders', { method: 'POST', body: { roomId: room.id, title: '测试报修：灯不亮', category: '水电', priority: 'high' } });
const order = r.json?.data;
check('创建报修工单', r.status === 201);

r = await call(`/api/workorders/${order.id}`, { method: 'PATCH', body: { status: 'done', assignee: '王师傅', cost: 120 } });
check('完成工单', r.status === 200 && r.json.data.status === 'done' && r.json.data.cost === 120);

r = await call(`/api/workorders/${order.id}`, { method: 'DELETE' });
check('删除工单', r.status === 200);

// 8. 楼栋
r = await call('/api/buildings', { method: 'POST', body: { name: '测试楼', address: '测试路 1 号', floors: 3 } });
const building = r.json?.data;
check('创建楼栋', r.status === 201);

r = await call(`/api/buildings/${building.id}`, { method: 'DELETE' });
check('删除空楼栋', r.status === 200);

r = await call('/api/buildings/b_1', { method: 'DELETE' });
check('有房间的楼栋不可删除', r.status === 409);

// 9. 清理房间（先删租客合同）
r = await call(`/api/rooms/${room2.id}`, { method: 'DELETE' });
check('删除空房间', r.status === 200);

// 10. 权限
const adminCookie = cookie;
cookie = '';
r = await call('/api/auth/login', { method: 'POST', body: { username: 'manager', password: 'manager123' } });
check('管家登录', r.status === 200 && r.json.data.role === 'manager');

r = await call('/api/buildings', { method: 'POST', body: { name: '越权楼', address: 'x', floors: 2 } });
check('管家不能新增楼栋', r.status === 403);

r = await call('/api/users');
check('管家不能查看账号列表', r.status === 403);

cookie = adminCookie;
r = await call(`/api/contracts/${contract.id}`, { method: 'PATCH', body: { action: 'terminate' } });
check('原合同退租', r.status === 200 && r.json.data.status === 'terminated');

r = await call(`/api/rooms/${room.id}`, { method: 'DELETE' });
check('有收款记录的房间禁止删除', r.status === 409, r.json?.message);

const failed = results.filter((x) => !x.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
if (failed.length) process.exit(1);
