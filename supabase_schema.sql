-- 퐁퐁푸린 숭배 성지 (Pompompurin Sanctuary) - Supabase SQL 테이블 생성 스크립트

-- 1. 회원 정보 테이블
CREATE TABLE IF NOT EXISTS worship_users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  worship_count BIGINT DEFAULT 0,
  coins INT DEFAULT 100,
  inventory JSONB DEFAULT '[]'::jsonb,
  equipped_skin TEXT DEFAULT 'default',
  last_attendance TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 온 세상 글로벌 누적 숭배수 테이블
CREATE TABLE IF NOT EXISTS worship_global (
  id INT PRIMARY KEY DEFAULT 1,
  count BIGINT DEFAULT 0
);
INSERT INTO worship_global (id, count) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- 3. 성전 방명록 테이블
CREATE TABLE IF NOT EXISTS worship_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  image_data TEXT,
  reactions INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 성전 액자 갤러리 테이블
CREATE TABLE IF NOT EXISTS worship_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  title TEXT NOT NULL,
  image_data TEXT NOT NULL,
  frame_style TEXT DEFAULT 'frame-gold',
  reactions INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Row Level Security (RLS) 비활성화 (Table Editor 및 외부 API 자유 추가 허용)
ALTER TABLE worship_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_global DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_frames DISABLE ROW LEVEL SECURITY;

-- 6. RPC 숭배수 카운터 함수
CREATE OR REPLACE FUNCTION increment_worship_global()
RETURNS BIGINT AS $$
  UPDATE worship_global SET count = count + 1 WHERE id = 1 RETURNING count;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_worship_user(user_id TEXT)
RETURNS BIGINT AS $$
  UPDATE worship_users SET worship_count = worship_count + 1, coins = coins + 2 WHERE id = user_id RETURNING worship_count;
$$ LANGUAGE SQL;
