-- 퐁퐁푸린 숭배 성지 (Pompompurin Sanctuary) - Supabase SQL 테이블 생성 스크립트
-- ⚠️ 이미 Table Editor에서 테이블을 만든 경우, 아래 ALTER TABLE만 실행하세요.

-- =============================================
-- [옵션 A] 테이블이 아직 없는 경우: 전체 실행
-- =============================================

-- 1. 회원 정보 테이블 (id = UUID 타입)
CREATE TABLE IF NOT EXISTS worship_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- =============================================
-- [옵션 B] 이미 Table Editor에서 테이블을 만든 경우:
-- 아래 ALTER TABLE로 누락 컬럼만 추가하세요.
-- =============================================

-- worship_users에 누락 컬럼 추가 (이미 있으면 무시됨)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='worship_users' AND column_name='coins') THEN
    ALTER TABLE worship_users ADD COLUMN coins INT DEFAULT 100;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='worship_users' AND column_name='inventory') THEN
    ALTER TABLE worship_users ADD COLUMN inventory JSONB DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='worship_users' AND column_name='equipped_skin') THEN
    ALTER TABLE worship_users ADD COLUMN equipped_skin TEXT DEFAULT 'default';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='worship_users' AND column_name='last_attendance') THEN
    ALTER TABLE worship_users ADD COLUMN last_attendance TEXT;
  END IF;
END $$;

-- =============================================
-- 5. Row Level Security (RLS) 비활성화
-- =============================================
ALTER TABLE worship_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_global DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_posts DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_frames DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RPC 숭배수 카운터 함수 (UUID 타입 호환)
-- =============================================
CREATE OR REPLACE FUNCTION increment_worship_global()
RETURNS BIGINT AS $$
  UPDATE worship_global SET count = count + 1 WHERE id = 1 RETURNING count;
$$ LANGUAGE SQL;

CREATE OR REPLACE FUNCTION increment_worship_user(p_user_id UUID)
RETURNS BIGINT AS $$
  UPDATE worship_users
  SET worship_count = worship_count + 1,
      coins = coins + 2
  WHERE id = p_user_id
  RETURNING worship_count;
$$ LANGUAGE SQL;
