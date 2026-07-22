import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { skinId } = await req.json();

    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === authUser.id);
      if (!user) return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 });

      user.equipped_skin = skinId || 'default';
      saveLocalDb();

      return NextResponse.json({ success: true, equipped_skin: user.equipped_skin });
    } else {
      const { data: updated } = await supabase
        .from('worship_users')
        .update({ equipped_skin: skinId || 'default' })
        .eq('id', authUser.id)
        .select('equipped_skin')
        .maybeSingle();

      return NextResponse.json({
        success: true,
        equipped_skin: updated ? updated.equipped_skin : (skinId || 'default')
      });
    }
  } catch (err) {
    return NextResponse.json({ error: '스킨 장착 실패' }, { status: 500 });
  }
}
