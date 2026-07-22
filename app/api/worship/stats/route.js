import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, supabase, isMockDb } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    let globalCount = 0;
    let userCount = 0;

    if (isMockDb) {
      globalCount = mockDb.globalCount;
      if (authUser) {
        const user = mockDb.users.find(u => u.id === authUser.id || u.username === authUser.username);
        if (user) userCount = user.worship_count;
      }
    } else {
      const { data: gData } = await supabase.from('worship_global').select('count').eq('id', 1).maybeSingle();
      globalCount = (gData && gData.count !== null) ? parseInt(gData.count) : 0;

      if (authUser) {
        const { data: uData } = await supabase.from('worship_users').select('worship_count').eq('id', authUser.id).maybeSingle();
        userCount = (uData && uData.worship_count !== null) ? parseInt(uData.worship_count) : 0;
      }
    }

    return NextResponse.json({ globalCount, userCount });
  } catch (err) {
    return NextResponse.json({ error: '통계 조회 오류' }, { status: 500 });
  }
}
