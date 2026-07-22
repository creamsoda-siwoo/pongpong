import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { parse } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'pompompurin-worship-secret-key-12345';
const DB_FILE = path.join(process.cwd(), 'worship_persist.json');
const TEMP_DB_FILE = path.join(process.cwd(), 'worship_persist.json.tmp');

// Initialize global mockDb in server memory
if (!global.__mockDb) {
  global.__mockDb = {
    users: [],
    globalCount: 0,
    posts: [
      { id: 1, username: '퐁퐁단단장', content: '퐁퐁푸린님을 경배하라! 푸딩 수호대 모집 중!', image_data: null, created_at: new Date(Date.now() - 3600000).toISOString(), reactions: 12 },
      { id: 2, username: '푸딩마스터', content: '퐁퐁복음 1장을 읽고 깊은 감명을 받았습니다. 아멘.', image_data: null, created_at: new Date(Date.now() - 1800000).toISOString(), reactions: 8 }
    ],
    frames: []
  };

  // Safe file load
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed) {
        if (Array.isArray(parsed.users)) global.__mockDb.users = parsed.users;
        if (typeof parsed.globalCount === 'number') global.__mockDb.globalCount = parsed.globalCount;
        if (Array.isArray(parsed.posts)) global.__mockDb.posts = parsed.posts;
        if (Array.isArray(parsed.frames)) global.__mockDb.frames = parsed.frames;
      }
    } catch (e) {
      console.error('🛡️ [DB GUARD] Failed to load local worship_persist.json:', e.message || e);
    }
  }
}

export const mockDb = global.__mockDb;

// Atomic file write to prevent corrupted JSON files during crash
export function saveLocalDb() {
  try {
    const payload = JSON.stringify(mockDb, null, 2);
    fs.writeFileSync(TEMP_DB_FILE, payload, 'utf8');
    fs.renameSync(TEMP_DB_FILE, DB_FILE);
  } catch (e) {
    console.error('🛡️ [DB GUARD] Failed to save local worship_persist.json:', e.message || e);
  }
}

let isSavePending = false;
export function debouncedSaveLocalDb() {
  if (isSavePending) return;
  isSavePending = true;
  setTimeout(() => {
    saveLocalDb();
    isSavePending = false;
  }, 2000);
}

// Supabase Client with timeout guard
let supabase = null;
let isMockDb = true;

const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_KEY;

if (sbUrl && sbKey && sbUrl.trim() !== '' && sbKey.trim() !== '' && !sbUrl.includes('your_supabase')) {
  try {
    supabase = createClient(sbUrl, sbKey, {
      auth: { persistSession: false },
      global: { headers: { 'x-application-name': 'pongpongpurin-worship' } }
    });
    isMockDb = false;
  } catch (err) {
    console.warn('🛡️ [DB GUARD] Supabase init error, falling back to mock DB:', err.message || err);
    isMockDb = true;
  }
}

export { supabase, isMockDb, JWT_SECRET };

// Auth Helper from Request with Token Verification Guard
export async function getAuthUser(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    if (!cookieHeader) return null;

    const cookies = parse(cookieHeader);
    const token = cookies.token;
    if (!token) return null;

    const verified = jwt.verify(token, JWT_SECRET);
    if (!verified) return null;

    let foundUser = null;
    if (mockDb && mockDb.users) {
      foundUser = mockDb.users.find(u =>
        (verified.id && u.id === verified.id) ||
        (verified.username && u.username.toLowerCase() === verified.username.toLowerCase())
      );
    }

    if (!foundUser && supabase && !isMockDb) {
      try {
        const { data } = await supabase
          .from('worship_users')
          .select('id, username')
          .ilike('username', verified.username || '')
          .maybeSingle();
        if (data) foundUser = data;
      } catch (sbErr) {}
    }

    if (foundUser) {
      return { id: foundUser.id, username: foundUser.username };
    } else if (verified.id && verified.username) {
      return { id: verified.id, username: verified.username };
    }
    return null;
  } catch (e) {
    return null;
  }
}
