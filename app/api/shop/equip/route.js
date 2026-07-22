import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { skinId } = await req.json();

    if (isMockDb) {
      let user = mockDb.users.find(u => u.id === authUser.id || u.username === authUser.username);
      if (!user) {
        user = {
          id: authUser.id,
          username: authUser.username,
          worship_count: 0,
          coins: 100,
          inventory: [],
          equipped_skin: 'default'
        };
        mockDb.users.push(user);
      }

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
