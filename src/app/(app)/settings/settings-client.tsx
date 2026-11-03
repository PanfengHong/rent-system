'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Icon } from '@/components/icons';
import { Avatar, Badge, Button, Card, CardHeader, Field, Input, Select } from '@/components/ui/base';
import { ConfirmDialog, Modal } from '@/components/ui/modal';
import { useToast } from '@/components/ui/toast';
import { api } from '@/lib/client';
import type { SessionUser, User } from '@/lib/types';
import { cn, formatDateTime } from '@/lib/utils';

type SafeUser = Omit<User, 'passwordHash'>;

interface Props {
  user: SessionUser;
  users: SafeUser[];
  isAdmin: boolean;
  stats: { rooms: number; tenants: number; contracts: number; bills: number; orders: number };
}

interface Form {
  id?: string;
  username: string;
  name: string;
  role: 'admin' | 'manager';
  phone: string;
  email: string;
  password: string;
}

const emptyForm: Form = { username: '', name: '', role: 'manager', phone: '', email: '', password: '' };

export function SettingsClient({ user, users, isAdmin, stats }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<'accounts' | 'system'>('accounts');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Form>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<SafeUser | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  function openCreate() {
    setForm(emptyForm);
    setError('');
    setOpen(true);
  }

  function openEdit(u: SafeUser) {
    setForm({ id: u.id, username: u.username, name: u.name, role: u.role, phone: u.phone, email: u.email ?? '', password: '' });
    setError('');
    setOpen(true);
  }

  async function submit() {
    setSaving(true);
    setError('');
    try {
      if (form.id) {
        await api(`/api/users/${form.id}`, {
          method: 'PATCH',
          body: { name: form.name, role: form.role, phone: form.phone, email: form.email, password: form.password || undefined },
        });
        toast.success('账号信息已更新');
      } else {
        await api('/api/users', {
          body: { username: form.username, name: form.name, role: form.role, phone: form.phone, email: form.email, password: form.password },
        });
        toast.success('账号已创建');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(u: SafeUser) {
    try {
      await api(`/api/users/${u.id}`, { method: 'PATCH', body: { status: u.status === 'active' ? 'disabled' : 'active' } });
      toast.success(u.status === 'active' ? '账号已停用' : '账号已启用');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : '操作失败');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await api(`/api/users/${deleting.id}`, { method: 'DELETE' });
      toast.success('账号已删除');
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
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {[
          { key: 'accounts' as const, label: '账号与权限' },
          { key: 'system' as const, label: '系统信息' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3.5 py-1.5 text-[13px] font-medium transition',
              tab === t.key ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'accounts' ? (
        <>
          <Card className="p-5">
            <div className="flex flex-wrap items-center gap-4">
              <Avatar name={user.name} size={52} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[15px] font-semibold text-slate-900">{user.name}</p>
                  <Badge tone={user.role === 'admin' ? 'brand' : 'slate'}>{user.role === 'admin' ? '超级管理员' : '运营管家'}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-slate-400">@{user.username} · {user.phone || '未填写手机号'}{user.email ? ` · ${user.email}` : ''}</p>
              </div>
              <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-500">
                当前会话有效期 7 天，退出后需重新登录
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader
              title="后台账号"
              desc={isAdmin ? '可为管家分配账号，并控制账号状态' : '仅管理员可以维护后台账号'}
              action={isAdmin ? <Button size="sm" icon="plus" onClick={openCreate}>新增账号</Button> : undefined}
            />
            <div className="table-wrap">
              <table className="data-table min-w-[760px]">
                <thead>
                  <tr>
                    <th>成员</th>
                    <th>用户名</th>
                    <th>角色</th>
                    <th>联系方式</th>
                    <th>状态</th>
                    <th>最后登录</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={u.name} size={30} />
                          <div>
                            <p className="font-medium text-slate-800">{u.name}{u.id === user.id ? <span className="ml-1 text-[11px] text-brand-600">（我）</span> : null}</p>
                            <p className="text-[11px] text-slate-400">创建于 {u.createdAt.slice(0, 10)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">@{u.username}</td>
                      <td><Badge tone={u.role === 'admin' ? 'brand' : 'slate'}>{u.role === 'admin' ? '管理员' : '管家'}</Badge></td>
                      <td className="text-xs text-slate-500">
                        <p>{u.phone || '—'}</p>
                        <p className="text-slate-400">{u.email || ''}</p>
                      </td>
                      <td>
                        <Badge tone={u.status === 'active' ? 'green' : 'red'} dot>{u.status === 'active' ? '启用' : '停用'}</Badge>
                      </td>
                      <td className="text-xs text-slate-500">{u.lastLoginAt ? formatDateTime(u.lastLoginAt) : '—'}</td>
                      <td>
                        {isAdmin ? (
                          <div className="flex items-center justify-end gap-1">
                            <button type="button" onClick={() => openEdit(u)} className="rounded-md px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50">编辑</button>
                            <button type="button" onClick={() => toggleStatus(u)} className="rounded-md px-2 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100">
                              {u.status === 'active' ? '停用' : '启用'}
                            </button>
                            <button type="button" onClick={() => setDeleting(u)} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" aria-label="删除账号">
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="block text-right text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader title="系统信息" desc="当前部署环境概览" />
            <dl className="divide-y divide-slate-100 px-5">
              {[
                ['系统名称', '云居租房 · 租赁管理平台'],
                ['版本号', 'v1.0.0'],
                ['技术栈', 'Next.js 15 + React 19 + TypeScript'],
                ['数据存储', '本地 JSON 存储（.data/db.json）'],
                ['登录方式', '账号密码 + HttpOnly Cookie 会话'],
                ['数据更新', '实时写入，单机部署'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between py-3 text-[13px]">
                  <dt className="text-slate-500">{k}</dt>
                  <dd className="font-medium text-slate-800">{v}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <CardHeader title="数据规模" desc="当前业务数据量统计" />
            <div className="grid grid-cols-2 gap-px bg-slate-100">
              {[
                { label: '房间', value: stats.rooms },
                { label: '租客', value: stats.tenants },
                { label: '合同', value: stats.contracts },
                { label: '账单', value: stats.bills },
                { label: '工单', value: stats.orders },
                { label: '账号', value: users.length },
              ].map((s) => (
                <div key={s.label} className="bg-white px-5 py-4">
                  <p className="text-xs text-slate-500">{s.label}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900 tabular-nums">{s.value}</p>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-100 px-5 py-3 text-[11px] leading-relaxed text-slate-400">
              数据文件位于项目根目录 <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-600">.data/db.json</code>，可直接备份该文件。
            </div>
          </Card>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? '编辑账号' : '新增账号'}
        desc={form.id ? '留空密码则保持原密码不变' : '新账号可用于登录管理后台'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setOpen(false)}>取消</Button>
            <Button onClick={submit} loading={saving}>{form.id ? '保存修改' : '创建账号'}</Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="用户名" required hint="3-20 位小写字母、数字或下划线">
            <Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} disabled={Boolean(form.id)} placeholder="例如: zhangsan" />
          </Field>
          <Field label="姓名" required>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="真实姓名" />
          </Field>
          <Field label="角色">
            <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as 'admin' | 'manager' })}>
              <option value="manager">运营管家</option>
              <option value="admin">超级管理员</option>
            </Select>
          </Field>
          <Field label={form.id ? '重置密码' : '初始密码'} required={!form.id} hint="至少 6 位">
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="••••••" />
          </Field>
          <Field label="手机号">
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="选填" />
          </Field>
          <Field label="邮箱">
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="选填" />
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
        title="删除账号"
        desc={`确认删除账号「${deleting?.name ?? ''}」吗？删除后该成员将无法登录系统。`}
      />
    </div>
  );
}
