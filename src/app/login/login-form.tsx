'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { api } from '@/lib/client';
import { Icon } from '@/components/icons';
import { Spinner } from '@/components/ui/base';

const DEMO_ACCOUNTS = [
  { label: '管理员', username: 'admin', password: 'admin123' },
  { label: '运营管家', username: 'manager', password: 'manager123' },
];

export function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [visible, setVisible] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      await api('/api/auth/login', { body: { username, password } });
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请稍后重试');
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="label">登录账号</label>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="user" size={16} />
          </span>
          <input
            className="field h-10 pl-9"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="请输入用户名"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="label mb-1.5">登录密码</label>
          <span className="mb-1.5 text-[11px] text-slate-400">演示环境</span>
        </div>
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="key" size={16} />
          </span>
          <input
            className="field h-10 pl-9 pr-10"
            type={visible ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-slate-400 hover:text-slate-600"
          >
            {visible ? '隐藏' : '显示'}
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-600">
          <Icon name="alert" size={14} className="mt-0.5 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-brand-600 text-sm font-medium text-white shadow-sm shadow-brand-600/25 transition hover:bg-brand-700 disabled:opacity-70"
      >
        {loading ? <><Spinner size={15} /> 正在登录…</> : '登录系统'}
      </button>

      <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
        <p className="mb-2 text-[11px] font-medium text-slate-500">演示账号（点击填入）</p>
        <div className="flex flex-wrap gap-2">
          {DEMO_ACCOUNTS.map((acc) => (
            <button
              key={acc.username}
              type="button"
              onClick={() => {
                setUsername(acc.username);
                setPassword(acc.password);
                setError('');
              }}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[11px] leading-tight text-slate-600 transition hover:border-brand-300 hover:text-brand-700"
            >
              <span className="font-semibold">{acc.label}</span>
              <span className="ml-1.5 text-slate-400">{acc.username}</span>
            </button>
          ))}
        </div>
      </div>
    </form>
  );
}
