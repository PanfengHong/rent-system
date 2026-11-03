# 云居租房 · 租赁管理系统

面向集中式公寓 / 二房东的租房管理后台，基于 **Next.js 15 + React 19 + TypeScript** 构建。覆盖登录鉴权、楼栋与房间、租客、合同签约续租退租、账单收款、报修工单与经营分析全流程。

## 功能模块

| 模块 | 主要能力 |
| --- | --- |
| 登录鉴权 | 账号密码登录、scrypt 加盐哈希、HttpOnly Cookie 会话（7 天）、路由中间件守卫、登录限流 |
| 工作台 | 房源与出租率、本期应收 / 实收 / 收缴率、本月回款环比、逾期金额、收支趋势图、房态环图、到期合同 / 逾期账单 / 待处理工单速览 |
| 楼栋管理 | 楼栋档案 CRUD、按楼栋统计房间数与出租率、在租月租金规模（仅管理员可维护） |
| 房间管理 | 房间 CRUD、房态（已出租 / 空置 / 维修中）、租金押金、配套标签、按楼栋 / 房态 / 关键词筛选、CSV 导出、分页 |
| 租客管理 | 租客档案 CRUD、手机号唯一校验、身份证脱敏展示、在租房间与合同剩余天数 |
| 合同管理 | 新建合同（仅可选空置房源）、自动按付款周期生成账单、续租、退租、合同详情与账单明细、到期天数提醒 |
| 账单收款 | 账期 / 状态 / 关键词筛选、部分收款与多次补收、收款方式登记、生成下期账单、CSV 导出、逾期天数计算 |
| 报修工单 | 三列看板（待受理 / 处理中 / 已完成）、优先级筛选、派单与费用登记、状态流转 |
| 经营分析 | 近 12 个月收支趋势、楼栋出租率与租金规模、账龄分析、欠款排行、收款方式占比 |
| 系统设置 | 账号 CRUD 与启停、角色权限（管理员 / 管家）、系统与数据规模信息 |

## 技术栈

- **框架**：Next.js 15（App Router、Server Components、Route Handlers）、React 19
- **语言**：TypeScript（strict）
- **样式**：Tailwind CSS 3 + 自定义设计令牌
- **图表**：手写 SVG 组件（面积图 / 环形图 / 横向条形图），无第三方图表依赖
- **数据**：本地 JSON 文件存储（`.data/db.json`），原子写入 + 内存缓存，首次启动自动生成演示数据
- **鉴权**：Node `crypto` 实现 HMAC-SHA256 签名会话 + scrypt 密码哈希

> 数据访问集中在 `src/lib/db.ts` 与 `src/lib/queries.ts`，替换为 Prisma / PostgreSQL 时只需修改这两层，业务代码无需改动。

## 快速开始

```bash
npm install
npm run dev          # http://localhost:3000
```

生产模式：

```bash
npm run build
npm start
```

### 演示账号

| 角色 | 用户名 | 密码 | 权限 |
| --- | --- | --- | --- |
| 超级管理员 | `admin` | `admin123` | 全部功能，含楼栋与账号管理 |
| 运营管家 | `manager` | `manager123` | 日常房源、租客、合同、账单、工单操作 |

首次启动会在项目根目录生成 `.data/db.json`（3 栋楼、60 间房、50 份合同、170+ 期账单与 11 条报修工单）。删除该文件并重启即可恢复初始演示数据。

### 环境变量（可选）

| 变量 | 说明 |
| --- | --- |
| `SESSION_SECRET` | 会话签名密钥，生产环境务必设置 |
| `COOKIE_SECURE=1` | 启用 HTTPS-only Cookie，生产部署建议开启 |

## 目录结构

```
src/
├─ app/
│  ├─ login/                  登录页（品牌区 + 表单）
│  ├─ (app)/                  登录后布局：侧边栏 + 顶栏 + 鉴权守卫
│  │  ├─ page.tsx             工作台
│  │  ├─ rooms/ buildings/ tenants/ contracts/ bills/
│  │  ├─ maintenance/ reports/ settings/
│  ├─ api/                    Route Handlers（auth / rooms / buildings / tenants
│  │                          / contracts / bills / workorders / users）
│  ├─ layout.tsx globals.css icon.svg
├─ components/
│  ├─ layout/app-shell.tsx    侧边导航、顶栏、提醒与用户菜单（固定框架）
│  ├─ layout/nav-link.tsx     导航项（无 loading 视觉，纯高亮切换）
│  ├─ layout/route-preloader.tsx  空闲时预取全部路由，消除冷路由首访延迟
│  ├─ layout/route-transition.tsx 内容区淡入过渡（按 pathname 重新挂载）
│  ├─ layout/navigation-progress.tsx 顶部 2px 进度条（100ms 后才出现）
│  ├─ ui/                     Button / Input / Badge / Modal / Toast / Pager
│  ├─ charts.tsx              SVG 图表组件
│  └─ icons.tsx               图标库
├─ lib/
│  ├─ db.ts                   数据读写与种子初始化
│  ├─ seed.ts                 演示数据生成
│  ├─ queries.ts              视图模型与统计聚合
│  ├─ billing.ts              账单计划与状态计算
│  ├─ contracts.ts            合同编号与账单生成
│  ├─ auth.ts password.ts     会话与密码
│  ├─ labels.ts utils.ts      状态文案、格式化工具
│  └─ client.ts               前端 fetch 封装
├─ middleware.ts              未登录跳转 / 接口 401
└─ scripts/smoke.mjs          接口冒烟测试（27 项断言）
```

## 导航与渲染策略

页面全部是 `force-dynamic`（读 cookie 鉴权），Next 15 默认不会为动态路由做完整预取，因此做了三件事：

1. **固定框架、只换内容**：侧边栏与顶栏在 `(app)/layout.tsx` 里，路由切换只替换 `<main>` 子树；内容区加 `min-h-[calc(100vh-4rem)]`，`html` 设 `scrollbar-gutter: stable`，避免内容高度变化时滚动条出现/消失导致整页横移。
2. **空闲预取**：`route-preloader.tsx` 在首屏稳定后用 `requestIdleCallback` 逐个 `router.prefetch()` 全部路由，RSC 结果进客户端路由缓存（`staleTimes.dynamic = 60s`）。实测点击时 RSC 请求数为 **0**，切换耗时 50–100ms。
3. **不闪的等待提示**：不用路由级 `loading.tsx` 骨架屏 —— 导航走 React transition，RSC 未就绪时旧页面会保留，骨架往往在数据快到时才闪一下。改为顶栏下方 2px 进度条，**100ms 后才出现**（命中缓存时根本不出现），菜单上不加任何转圈。

> 开发模式使用 `.next-dev` 独立构建目录（见 `next.config.js`），`next dev` 不会重写 `.next`，可以和生产服务同时跑而互不干扰。

## 核心业务规则
- **账单生成**：按合同「付款周期」（月付 / 季付 / 半年付 / 年付）拆分为多期，每期应缴日为账期开始后第 5 天；末期不足 10 天时并入上一期，避免零碎账单。
- **合同生效**：开始日期晚于今天的合同状态为「待生效」，签约后房间立即标记为已出租；同一房间租期重叠会被拒绝。
- **退租**：合同置为「已退租」，房间恢复空置（若同房间还有其他覆盖今日的生效合同则保持出租），并清理退租日之后未收款的账单。
- **续租**：从原合同到期次日起生成新合同，可调整租金与付款周期，自动补生成对应账单。
- **数据保护**：存在生效合同的房间不可删除；已有收款记录的房间 / 合同不可删除，满足财务留存要求；系统至少保留一名启用状态的管理员。

## 接口一览

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | `/api/auth/login` | 登录（限流 10 次 / 5 分钟） |
| POST | `/api/auth/logout` | 退出登录 |
| GET | `/api/auth/me` | 当前会话用户 |
| GET/POST | `/api/rooms` | 房间列表 / 新建 |
| PATCH/DELETE | `/api/rooms/[id]` | 修改 / 删除房间 |
| GET/POST | `/api/buildings` | 楼栋列表 / 新建（管理员） |
| PATCH/DELETE | `/api/buildings/[id]` | 修改 / 删除楼栋（管理员） |
| GET/POST | `/api/tenants` | 租客列表 / 新建 |
| PATCH/DELETE | `/api/tenants/[id]` | 修改 / 删除租客 |
| GET/POST | `/api/contracts` | 合同列表 / 签约 |
| PATCH/DELETE | `/api/contracts/[id]` | 续租 / 退租 / 修改 / 删除 |
| GET | `/api/bills` | 账单列表 |
| POST | `/api/bills/[id]/pay` | 登记收款（支持部分收款） |
| POST | `/api/bills/generate` | 为生效合同补齐下期账单 |
| GET/POST | `/api/workorders` | 工单列表 / 新建 |
| PATCH/DELETE | `/api/workorders/[id]` | 状态流转 / 派单 / 删除 |
| GET/POST | `/api/users` | 账号列表 / 新建（管理员） |
| PATCH/DELETE | `/api/users/[id]` | 修改 / 停用 / 删除账号（管理员） |

## 测试

服务启动后运行接口冒烟测试（覆盖登录鉴权、CRUD、合同账单联动、部分收款、续租退租、越权访问等 27 项断言）：

```bash
node scripts/smoke.mjs
```

类型检查：

```bash
npm run typecheck
```
