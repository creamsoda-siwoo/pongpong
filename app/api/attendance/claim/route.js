import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const today = new Date().toISOString().split('T')[0];

    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === authUser.id);
      if (user.last_attendance === today) {
        return NextResponse.json({ error: '오늘 이미 출석체크 보상을 받으셨습니다!' }, { status: 400 });
      }
      user.last_attendance = today;
      user.coins = (user.coins || 100) + 150;
      user.worship_count = (user.worship_count || 0) + 30;
      saveLocalDb();

      return NextResponse.json({
        success: true,
        message: '출석 완료! +150 퐁퐁코인 & +30 숭배수 획득!',
        coins: user.coins,
        worship_count: user.worship_count,
        last_attendance: today
      });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', authUser.id).maybeSingle();
      if (user && user.last_attendance === today) {
        return NextResponse.json({ error: '오늘 이미 출석체크 보상을 받으셨습니다!' }, { status: 400 });
      }

      const currentCoins = (user && user.coins !== null) ? parseInt(user.coins) : 100;
      const currentWorship = (user && user.worship_count !== null) ? parseInt(user.worship_count) : 0;
      const nextCoins = currentCoins + 150;
      const nextWorship = currentWorship + 30;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, worship_count: nextWorship, last_attendance: today })
        .eq('id', authUser.id)
        .select()
        .maybeSingle();

      return NextResponse.json({
        success: true,
        message: '출석 완료! +150 퐁퐁코인 & +30 숭배수 획득!',
        coins: updated ? updated.coins : nextCoins,
        worship_count: updated ? updated.worship_count : nextWorship,
        last_attendance: today
      });
    }
  } catch (err) {
    return NextResponse.json({ error: '출석체크 처리 오류' }, { status: 500 });
  }
}
