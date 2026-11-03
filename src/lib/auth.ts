import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDb } from './db';
import type { SessionUser } from './types';

export const SESSION_COOKIE = 'rent_session';
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 天

function getSecret() {
  return process.env.SESSION_SECRET || 'yunjuzufang-dev-secret-2026';
}

function base64url(input: string | Buffer) {
  return Buffer.from(input).toString('base64url');
}

function signToken(payload: Record<string, unknown>) {
  const body = base64url(JSON.stringify(payload));
  const signature = createHmac('sha256', getSecret()).update(body).digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token: string): (SessionUser & { exp: number }) | null {
  const [body, signature] = token.split('.');
  if (!body || !signature) return null;
  const expected = createHmac('sha256', getSecret()).update(body).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!payload?.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function createSession(user: SessionUser) {
  const token = signToken({ ...user, exp: Date.now() + SESSION_TTL });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL / 1000,
    secure: process.env.COOKIE_SECURE === '1',
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** 读取当前登录用户，无效则返回 null */
export async function getSessionUser(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;

  const db = getDb();
  const user = db.users.find((u) => u.id === payload.id);
  if (!user || user.status !== 'active') return null;

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    phone: user.phone,
    email: user.email,
  };
}

/** 页面级守卫：未登录跳转登录页 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/login');
  return user;
}

/** 接口级守卫：未登录返回 null，由调用方决定响应 */
export async function requireApiUser(): Promise<SessionUser | null> {
  return getSessionUser();
}
