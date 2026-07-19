-- 퐁퐁푸린 숭배 사이트 Supabase 테이블 DDL 스키마
-- Supabase SQL Editor에 복사하여 실행하세요.

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS worship_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    worship_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 글로벌 숭배 횟수 테이블
CREATE TABLE IF NOT EXISTS worship_global (
    id INT PRIMARY KEY DEFAULT 1,
    count BIGINT DEFAULT 0,
    CONSTRAINT single_row CHECK (id = 1)
);

-- 초기 글로벌 카운트가 없을 경우 삽입
INSERT INTO worship_global (id, count)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- 3. 숭배판/게시판 테이블
CREATE TABLE IF NOT EXISTS worship_posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    image_data TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 보안: RLS(Row Level Security)를 비활성화하거나, 모든 작업에 대한 기본 정책(Policy)을 추가합니다.
-- 개발 편의상 RLS를 비활성화하는 SQL입니다 (배포 시에는 적절한 Policy 설정 필요)
ALTER TABLE worship_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_global DISABLE ROW LEVEL SECURITY;
ALTER TABLE worship_posts DISABLE ROW LEVEL SECURITY;

-- 4. 글로벌 숭배 카운터 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_worship_global()
RETURNS bigint AS $$
DECLARE
    new_count bigint;
BEGIN
    INSERT INTO worship_global (id, count)
    VALUES (1, 1)
    ON CONFLICT (id) DO UPDATE
    SET count = worship_global.count + 1
    RETURNING count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

-- 5. 유저 숭배 카운터 증가 RPC 함수
CREATE OR REPLACE FUNCTION increment_worship_user(user_id UUID)
RETURNS integer AS $$
DECLARE
    new_count integer;
BEGIN
    UPDATE worship_users
    SET worship_count = worship_count + 1
    WHERE id = user_id
    RETURNING worship_count INTO new_count;
    
    RETURN new_count;
END;
$$ LANGUAGE plpgsql;

