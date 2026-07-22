import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { mockDb, saveLocalDb, supabase, isMockDb, JWT_SECRET } from '../../../../lib/db';
import { checkRateLimit } from '../../../../lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const rateLimitError = checkRateLimit(req, 40);
  if (rateLimitError) return rateLimitError;

  try {
    const { username, password } = await req.json();
    const trimmedUsername = username ? username.trim() : '';

    if (!trimmedUsername || !password) {
      return NextResponse.json({ error: '사용자 이름과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    let user = null;
    if (mockDb && mockDb.users) {
      user = mockDb.users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    }

    if (!user && supabase && !isMockDb) {
      try {
        const { data, error } = await supabase
          .from('worship_users')
          .select('*')
          .ilike('username', trimmedUsername)
          .maybeSingle();
        if (!error && data) {
          user = data;
          if (mockDb && mockDb.users && !mockDb.users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase())) {
            mockDb.users.push(data);
            saveLocalDb();
          }
        }
      } catch (sbErr) {}
    }

    if (!user) {
      return NextResponse.json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    if (!user.password_hash) {
      return NextResponse.json({ error: '계정 정보에 문제가 있습니다. 다시 가입해주세요.' }, { status: 400 });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return NextResponse.json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' }, { status: 400 });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        worship_count: user.worship_count || 0,
        coins: user.coins || 100,
        inventory: user.inventory || [],
        equipped_skin: user.equipped_skin || 'default'
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
    console.error("LOGIN ERROR:", err);
    return NextResponse.json({ error: '로그인 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
