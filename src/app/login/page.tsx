import type { Metadata } from 'next';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';
import { Icon } from '@/components/icons';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: '登录' };

const FEATURES = [
  { icon: 'room' as const, title: '房态实时可视', desc: '空置 / 在租 / 维修状态一目了然' },
  { icon: 'contract' as const, title: '合同到期预警', desc: '自动提醒续租，避免空置损失' },
  { icon: 'wallet' as const, title: '账单自动生成', desc: '按付款周期拆分，回款进度可追踪' },
];

const STATS = [
  { value: '60', unit: '间', label: '在管房源' },
  { value: '3', unit: '栋', label: '运营楼栋' },
  { value: '99.9', unit: '%', label: '系统可用性' },
];

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect('/');

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* 品牌区 */}
      <div className="relative hidden overflow-hidden bg-[#0a1029] lg:block">
        <Image
          src="/images/login-bg.jpg"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-[50%_46%]"
        />
        {/* 渐变遮罩：左侧压暗保证文字对比，右侧留出建筑轮廓 */}
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgba(6,11,28,0.9)_0%,rgba(8,15,38,0.78)_38%,rgba(9,16,42,0.55)_66%,rgba(10,17,44,0.3)_100%)]" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050a1a]/90 via-transparent to-[#050a1a]/45" />
        <div className="grid-bg absolute inset-0 opacity-20" />

        <div className="relative mx-auto flex h-full min-h-screen w-full max-w-[36rem] flex-col px-10 py-10 xl:py-12">
          {/* 顶部：品牌标识 */}
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white ring-1 ring-white/20 backdrop-blur">
                <Icon name="logo" size={21} />
              </span>
              <div>
                <p className="text-[15px] font-semibold tracking-wide text-white">云居租房</p>
                <p className="text-[10px] tracking-[0.18em] text-white/40">RENTAL MANAGEMENT OS</p>
              </div>
            </div>
            {/* <span className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10.5px] font-medium text-white/55 backdrop-blur xl:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              集中式公寓运营中台
            </span> */}
          </div>

          {/* 中部：主视觉 + 运营数据，整体在剩余空间内垂直居中 */}
          <div className="my-auto py-10">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.07] px-2.5 py-1 text-[10px] font-medium tracking-[0.16em] text-white/60 backdrop-blur">
              <Icon name="sparkle" size={11} />
              SMART RENTAL
            </span>

            <h1 className="mt-5 text-[36px] font-semibold leading-[1.22] tracking-tight text-white xl:text-[40px]">
              让每一间房
              <br />
              都被认真经营
            </h1>
            <p className="mt-4 max-w-[24rem] text-[13.5px] leading-relaxed text-white/60">
              从房源上架、签约入住到租金回款与报修服务，一套系统覆盖集中式公寓的全部日常运营。
            </p>

            <div className="mt-8 overflow-hidden rounded-2xl border border-white/[0.12] bg-white/[0.055] backdrop-blur-md">
              <div className="divide-y divide-white/[0.08]">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-center gap-3 px-4 py-3.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/85 ring-1 ring-white/10">
                      <Icon name={f.icon} size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium text-white/90">{f.title}</p>
                      <p className="mt-0.5 truncate text-[11.5px] text-white/45">{f.desc}</p>
                    </div>
                    <Icon name="check" size={14} className="shrink-0 text-emerald-400/70" />
                  </div>
                ))}
              </div>
            </div>

            {/* 运营数据：与上方卡片留出呼吸间距，做成轻量数据行 */}
            <div className="mt-8 grid grid-cols-3">
              {STATS.map((s, i) => (
                <div
                  key={s.label}
                  className={
                    i === 0
                      ? 'pr-4 pl-4 text-center'
                      : 'border-l border-white/[0.08] pl-5 pr-4 text-center'
                  }
                >
                  <p className="text-[19px] font-semibold leading-none text-white tabular-nums">
                    {s.value}
                    <span className="ml-0.5 text-[11px] font-normal text-white/40">{s.unit}</span>
                  </p>
                  <p className="mt-2 text-[10.5px] tracking-wide text-white/45">{s.label}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="shrink-0 text-[11px] text-white/25">
            © 2026 云居公寓管理有限公司 · 数据每日 02:00 自动归档
          </p>
        </div>
      </div>

      {/* 表单区 */}
      <div className="relative flex items-center justify-center overflow-hidden bg-white px-6 py-12">
        {/* 移动端顶部品牌图带 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-52 lg:hidden">
          <Image
            src="/images/login-bg.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[50%_64%]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,11,26,0.72)_0%,rgba(6,11,26,0.34)_46%,rgba(255,255,255,0.9)_88%,#ffffff_100%)]" />
        </div>

        <div className="absolute left-6 top-8 flex items-center gap-2.5 lg:hidden">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white ring-1 ring-white/25 backdrop-blur">
            <Icon name="logo" size={19} />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-white">云居租房</p>
            <p className="text-[9px] tracking-[0.16em] text-white/55">RENTAL MANAGEMENT OS</p>
          </div>
        </div>

        <div className="relative w-full max-w-[352px] pt-20 lg:pt-0">
          <h2 className="text-[26px] font-semibold tracking-tight text-slate-900">欢迎回来</h2>
          <p className="mt-1.5 text-sm text-slate-500">请使用管理员或管家账号登录管理后台</p>

          <div className="mt-8">
            <LoginForm />
          </div>

          <p className="mt-8 text-center text-[11px] leading-relaxed text-slate-400">
            登录即表示同意《服务协议》与《隐私政策》
            <br />© 2026 云居公寓管理有限公司
          </p>
        </div>
      </div>
    </div>
  );
}
