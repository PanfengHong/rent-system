'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Avatar, Badge, Button, EmptyState, Field, Input, Select, Textarea } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { DetailGrid, DetailNote, DetailSection, Drawer } from '@/components/ui/drawer';
import { Pager } from '@/components/ui/pager';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import type { TenantView } from '@/lib/queries';
import type { Gender } from '@/lib/types';
import { cn, formatMoney, maskIdCard } from '@/lib/utils';

interface Props {
  tenants: TenantView[];
}

interface Form {
  id?: string;
  name: string;
  phone: string;
  gender: Gender;
  idCard: string;
  occupation: string;
  emergencyName: string;
  emergencyPhone: string;
  remark: string;
}

const emptyForm: Form = {
  name: '',
  phone: '',
  gender: 'male',
  idCard: '',
  occupation: '',
  emergencyName: '',
  emergencyPhone: '',
  remark: '',
};

export function TenantsClient({ tenants }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [keyword, setKeyword] = useState('');
  const [tab, setTab] = useState<'all' | 'renting' | 'idle'>('all');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<TenantView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [detail, setDetail] = useState<TenantView | null>(null);

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return tenants.filter((t) => {
      if (tab === 'renting' && !t.renting) return false;
      if (tab === 'idle' && t.renting) return false;
      if (!kw) return true;
      return t.name.toLowerCase().includes(kw) || t.phone.includes(kw) || (t.roomNo ?? '').includes(kw) || t.occupation.includes(kw);
    });
  }, [tenants, keyword, tab]);

  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [keyword, tab]);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);


  const rentingCount = tenants.filter((t) => t.renting).length;

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function openEdit(t: TenantView) {
    setForm({
      id: t.id,
      name: t.name,
      phone: t.phone,
      gender: t.gender,
      idCard: t.idCard,
      occupation: t.occupation,
      emergencyName: t.emergencyName,
      emergencyPhone: t.emergencyPhone,
      remark: t.remark ?? '',
    });
    setError('');
    setOpen(true);
  }

  async function submit() {
    if (saving) return;
    if (!form.name.trim()) return setError('请填写租客姓名');
    if (!/^1[3-9]\d{9}$/.test(form.phone.trim())) return setError('请输入有效的 11 位手机号');
    setSaving(true);
    setError('');
    try {
      const payload = { ...form };
      if (form.id) {
        await api(`/api/tenants/${form.id}`, { method: 'PATCH', body: payload });
        toast.success('租客信息已更新');
      } else {
        await api('/api/tenants', { body: payload });
        toast.success('租客已创建');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/tenants/${deleting.id}`, { method: 'DELETE' });
      toast.success('租客已删除');
      setDeleting(null);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '删除失败');
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: '租客总数', value: tenants.length, hint: '全部在册租客' },
          { label: '在租租客', value: rentingCount, hint: '持有生效合同' },
          { label: '未签约', value: tenants.length - rentingCount, hint: '可安排看房' },
        ].map((s) => (
          <div key={s.label} className="card px-4 py-3.5">
            <p className="text-xs text-slate-500">{s.label}</p>
            <p className="mt-1 text-xl font-semibold text-slate-900 tabular-nums">{s.value}<span className="ml-1 text-xs font-normal text-slate-400">人</span></p>
            <p className="mt-0.5 text-[11px] text-slate-400">{s.hint}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-slate-100 px-4 py-3">
          <div className="flex rounded-lg bg-slate-100 p-1">
            {[
              { key: 'all' as const, label: '全部' },
              { key: 'renting' as const, label: '在租' },
              { key: 'idle' as const, label: '未签约' },
            ].map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition',
                  tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Icon name="search" size={15} />
            </span>
            <input
              className="field h-9 w-56 pl-8 text-[13px]"
              placeholder="搜索姓名 / 手机号 / 房间"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>

          <div className="ml-auto">
            <Button size="sm" icon="plus" onClick={openCreate}>新增租客</Button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon="users" title="没有符合条件的租客" desc="换个关键词试试，或录入新的租客档案" action={<Button size="sm" icon="plus" onClick={openCreate}>新增租客</Button>} />
        ) : (
          <div className="table-wrap">
            <table className="data-table min-w-[860px]">
              <thead>
                <tr>
                  <th>租客</th>
                  <th>联系方式</th>
                  <th>证件号</th>
                  <th>职业</th>
                  <th>在租房间</th>
                  <th>合同到期</th>
                  <th>月租</th>
                  <th className="text-right">操作</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((t) => (
                  <tr key={t.id} onClick={() => setDetail(t)} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={t.name} size={32} />
                        <div>
                          <p className="font-medium text-slate-800">{t.name}</p>
                          <p className="text-[11px] text-slate-400">{t.gender === 'female' ? '女士' : '先生'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="tabular-nums text-slate-600">{t.phone}</td>
                    <td className="text-xs text-slate-500 tabular-nums">{t.idCard ? maskIdCard(t.idCard) : '—'}</td>
                    <td className="text-slate-600">{t.occupation}</td>
                    <td>
                      {t.renting ? (
                        <div>
                          <p className="text-slate-700">{t.buildingShort} · {t.roomNo}</p>
                          <p className="text-[11px] text-slate-400">{t.contractCode}</p>
                        </div>
                      ) : (
                        <Badge tone="slate">未签约</Badge>
                      )}
                    </td>
                    <td>
                      {t.contractEnd ? (
                        <div>
                          <p className="tabular-nums text-slate-600">{t.contractEnd}</p>
                          <p className={cn('text-[11px]', (t.daysLeft ?? 99) <= 30 ? 'text-amber-600' : 'text-slate-400')}>
                            剩 {t.daysLeft} 天
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="tabular-nums text-slate-600">{t.monthlyRent ? formatMoney(t.monthlyRent) : '—'}</td>
                    <td>
                      <div className="flex items-center gap-1 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDetail(t); }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100"
                        >
                          详情
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); openEdit(t); }}
                          className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
                        >
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDeleting(t); }}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                          aria-label="删除租客"
                        >
                          <Icon name="trash" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-xs text-slate-400">
          <span>共 {filtered.length} 位租客</span>
          <Pager page={page} pageSize={PAGE_SIZE} total={filtered.length} onChange={setPage} />
        </div>
      </div>

      {/* 租客详情 */}
      <Drawer
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.name} · ${detail.gender === 'female' ? '女士' : '先生'}` : '租客档案'}
        desc={detail ? `建档于 ${detail.createdAt.slice(0, 10)}` : ''}
        extra={detail ? (detail.renting ? <Badge tone="green" dot>在租</Badge> : <Badge tone="slate">未签约</Badge>) : null}
        size="md"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDetail(null)}>关闭</Button>
            <Button onClick={() => { const t = detail; setDetail(null); if (t) openEdit(t); }}>编辑资料</Button>
          </>
        }
      >
        {detail ? (
          <>
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 px-4 py-3.5">
              <Avatar name={detail.name} size={44} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{detail.name}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{detail.occupation || '未填写职业'} · {detail.phone}</p>
              </div>
            </div>

            <DetailSection title="基础信息">
              <DetailGrid
                items={[
                  { label: '手机号', value: <span className="tabular-nums">{detail.phone}</span> },
                  { label: '身份证号', value: detail.idCard ? <span className="tabular-nums">{maskIdCard(detail.idCard)}</span> : '—' },
                  { label: '紧急联系人', value: detail.emergencyName || '—' },
                  { label: '紧急联系电话', value: detail.emergencyPhone ? <span className="tabular-nums">{detail.emergencyPhone}</span> : '—' },
                ]}
              />
            </DetailSection>

            <DetailSection title="在租信息">
              {detail.renting ? (
                <DetailGrid
                  items={[
                    { label: '房间', value: `${detail.buildingShort} · ${detail.roomNo} 室` },
                    { label: '合同号', value: <span className="tabular-nums">{detail.contractCode}</span> },
                    { label: '到期日', value: <span className="tabular-nums">{detail.contractEnd}</span> },
                    {
                      label: '剩余天数',
                      value: (
                        <span className={(detail.daysLeft ?? 99) <= 30 ? 'text-amber-600' : ''}>
                          {detail.daysLeft} 天
                        </span>
                      ),
                    },
                    { label: '月租金', value: detail.monthlyRent ? formatMoney(detail.monthlyRent) : '—' },
                  ]}
                />
              ) : (
                <DetailNote>当前没有生效中的合同，可安排看房并新建租约。</DetailNote>
              )}
            </DetailSection>

            {detail.remark ? (
              <DetailSection title="备注">
                <DetailNote tone="amber">{detail.remark}</DetailNote>
              </DetailSection>
            ) : null}
          </>
        ) : null}
      </Drawer>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? '编辑租客' : '新增租客'}
        desc="租客档案用于签约与开具账单"
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>{form.id ? '保存修改' : '创建租客'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="姓名" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="请输入真实姓名" />
          </Field>
          <Field label="性别">
            <Select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })}>
              <option value="male">男</option>
              <option value="female">女</option>
            </Select>
          </Field>
          <Field label="手机号" required>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="11 位手机号" maxLength={11} />
          </Field>
          <Field label="身份证号" hint="选填，18 位">
            <Input value={form.idCard} onChange={(e) => setForm({ ...form, idCard: e.target.value })} placeholder="110105199001011234" maxLength={18} />
          </Field>
          <Field label="职业">
            <Input value={form.occupation} onChange={(e) => setForm({ ...form, occupation: e.target.value })} placeholder="例如：软件工程师" />
          </Field>
          <div className="hidden sm:block" />
          <Field label="紧急联系人">
            <Input value={form.emergencyName} onChange={(e) => setForm({ ...form, emergencyName: e.target.value })} placeholder="姓名" />
          </Field>
          <Field label="紧急联系电话">
            <Input value={form.emergencyPhone} onChange={(e) => setForm({ ...form, emergencyPhone: e.target.value })} placeholder="手机号" />
          </Field>
          <Field label="备注" className="sm:col-span-2">
            <Textarea rows={3} value={form.remark} onChange={(e) => setForm({ ...form, remark: e.target.value })} placeholder="特殊需求、宠物情况等" />
          </Field>
          {error ? (
            <div className="sm:col-span-2 flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
              <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
              {error}
            </div>
          ) : null}
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={deleteLoading}
        title="删除租客"
        desc={`确认删除租客「${deleting?.name ?? ''}」吗？其在租合同与历史账单会一并删除。`}
      />
    </div>
  );
}
