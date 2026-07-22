import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockDb, saveLocalDb, supabase, isMockDb, JWT_SECRET } from '../../../../lib/db';
import { checkRateLimit } from '../../../../lib/rateLimit';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const rateLimitError = checkRateLimit(req, 30);
  if (rateLimitError) return rateLimitError;

  try {
    const { username, password } = await req.json();
    const trimmedUsername = username ? username.trim() : '';

    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: '사용자 이름과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    if (trimmedUsername.length < 2) {
      return NextResponse.json({ error: '사용자 이름은 2자 이상이어야 합니다.' }, { status: 400 });
    }

    if (trimmedUsername.length > 20) {
      return NextResponse.json({ error: '사용자 이름은 20자 이하여야 합니다.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    mockDb.users = mockDb.users || [];
    const existsInMock = mockDb.users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    if (existsInMock) {
      return NextResponse.json({ error: '이미 존재하는 사용자 이름입니다.' }, { status: 400 });
    }

    if (!isMockDb && supabase) {
      try {
        const { data: existingUser } = await supabase
          .from('worship_users')
          .select('username')
          .ilike('username', trimmedUsername)
          .maybeSingle();

        if (existingUser) {
          return NextResponse.json({ error: '이미 존재하는 사용자 이름입니다.' }, { status: 400 });
        }
      } catch (sbErr) {}
    }

    const newUserId = crypto.randomUUID ? crypto.randomUUID() : (Date.now() + '-' + Math.random().toString(36).substring(2, 9));
    const newUser = {
      id: newUserId,
      username: trimmedUsername,
      password_hash: passwordHash,
      worship_count: 0,
      coins: 100,
      inventory: [],
      equipped_skin: 'default',
      created_at: new Date().toISOString()
    };

    mockDb.users.push(newUser);
    saveLocalDb();

    if (supabase && !isMockDb) {
      try {
        await supabase
          .from('worship_users')
          .insert([{
            id: newUserId,
            username: trimmedUsername,
            password_hash: passwordHash,
            worship_count: 0,
            coins: 100,
            inventory: [],
            equipped_skin: 'default'
          }]);
      } catch (sbInsertErr) {}
    }

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '30d' });

    const response = NextResponse.json({
      success: true,
      message: '회원가입 및 로그인이 완료되었습니다.',
      user: {
        id: newUser.id,
        username: newUser.username,
        worship_count: 0,
        coins: 100,
        inventory: [],
        equipped_skin: 'default'
      }
    });

    response.cookies.set('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60
    });

    return response;
  } catch (err) {
    console.error('REGISTER ERROR:', err);
    return NextResponse.json({ error: '회원가입 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
