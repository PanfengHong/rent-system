export function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function formatMoney(value: number, symbol = true) {
  const num = Number.isFinite(value) ? value : 0;
  const text = num.toLocaleString('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  return symbol ? `¥${text}` : text;
}

export function formatWan(value: number) {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(value >= 100000 ? 0 : 1)}万`;
  }
  return value.toLocaleString('zh-CN');
}

export function parseDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function todayISO() {
  return toISO(new Date());
}

export function addDays(iso: string, days: number) {
  const d = parseDate(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

export function addMonths(iso: string, months: number) {
  const d = parseDate(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const daysInMonth = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, daysInMonth));
  return toISO(d);
}

export function diffDays(from: string, to: string) {
  return Math.round((parseDate(to).getTime() - parseDate(from).getTime()) / 86400000);
}

export function formatDate(iso?: string) {
  if (!iso) return '—';
  return iso.slice(0, 10).replace(/-/g, '.');
}

export function formatDateCN(iso?: string) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${y}年${Number(m)}月${Number(d)}日`;
}

export function formatDateTime(iso?: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 16).replace('T', ' ');
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function monthLabel(iso: string) {
  const [, m] = iso.slice(0, 7).split('-');
  return `${Number(m)}月`;
}

/** 生成一个短的可读 ID，如 rm_lz3k9a1x */
export function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function maskIdCard(id: string) {
  if (!id || id.length < 8) return id || '—';
  return `${id.slice(0, 4)}**********${id.slice(-4)}`;
}

export function percent(part: number, total: number, digits = 1) {
  if (!total) return 0;
  return Number(((part / total) * 100).toFixed(digits));
}

/** 相对当前日期的中文描述，如「还剩 12 天」「已逾期 3 天」 */
export function dueLabel(date: string, today = todayISO()) {
  const days = diffDays(today, date);
  if (days === 0) return '今天到期';
  if (days > 0) return `还剩 ${days} 天`;
  return `已逾期 ${Math.abs(days)} 天`;
}

export function csvEscape(value: unknown) {
  const text = value == null ? '' : String(value);
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}
