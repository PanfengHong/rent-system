import fs from 'node:fs';
import path from 'node:path';
import type { Database } from './types';
import { seedDatabase } from './seed';

const globalForDb = globalThis as unknown as { __rentDb?: Database };

const DATA_DIR = path.join(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function persist(db: Database) {
  ensureDir();
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
  fs.renameSync(tmp, DB_FILE);
}

/** 读取数据库（首次访问自动初始化种子数据） */
export function getDb(): Database {
  if (globalForDb.__rentDb) return globalForDb.__rentDb;
  ensureDir();

  if (fs.existsSync(DB_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) as Database;
      globalForDb.__rentDb = parsed;
      return parsed;
    } catch (error) {
      console.error('[db] 数据文件解析失败，将重新初始化：', error);
    }
  }

  const seeded = seedDatabase();
  persist(seeded);
  globalForDb.__rentDb = seeded;
  return seeded;
}

/** 显式落盘（写操作后调用） */
export function saveDb() {
  persist(getDb());
}

/** 重置为初始种子数据 */
export function resetDb() {
  const seeded = seedDatabase();
  globalForDb.__rentDb = seeded;
  persist(seeded);
  return seeded;
}

export function transaction<T>(fn: (db: Database) => T): T {
  const db = getDb();
  const result = fn(db);
  persist(db);
  return result;
}
