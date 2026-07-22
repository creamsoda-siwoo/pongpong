import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, debouncedSaveLocalDb, supabase, isMockDb } from '../../../lib/db';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    let globalCount = 0;
    let userCount = null;
    let userCoins = null;

    if (isMockDb) {
      mockDb.globalCount += 1;
      globalCount = mockDb.globalCount;

      if (authUser) {
        const user = mockDb.users.find(u => u.id === authUser.id);
        if (user) {
          user.worship_count += 1;
          user.coins = (user.coins || 100) + 2;
          userCount = user.worship_count;
          userCoins = user.coins;
        }
      }
      debouncedSaveLocalDb();
    } else {
      const { data: globalData, error: gError } = await supabase.rpc('increment_worship_global');

      if (gError) {
        const { data: selectG } = await supabase
          .from('worship_global')
          .select('count')
          .eq('id', 1)
          .maybeSingle();

        const currentGCount = (selectG && selectG.count !== null) ? parseInt(selectG.count) : 0;
        const nextGCount = currentGCount + 1;

        const { data: updatedG } = await supabase
          .from('worship_global')
          .upsert({ id: 1, count: nextGCount })
          .select('count')
          .maybeSingle();

        globalCount = updatedG ? parseInt(updatedG.count) : nextGCount;
      } else {
        globalCount = parseInt(globalData);
      }

      if (authUser) {
        const { data: uData, error: uError } = await supabase.rpc('increment_worship_user', { p_user_id: authUser.id });

        if (uError) {
          const { data: selectU } = await supabase
            .from('worship_users')
            .select('worship_count, coins')
            .eq('id', authUser.id)
            .maybeSingle();

          const currentUCount = (selectU && selectU.worship_count !== null) ? parseInt(selectU.worship_count) : 0;
          const currentCoins = (selectU && selectU.coins !== null) ? parseInt(selectU.coins) : 100;
          const nextUCount = currentUCount + 1;
          const nextCoins = currentCoins + 2;

          const { data: updatedU } = await supabase
            .from('worship_users')
            .update({ worship_count: nextUCount, coins: nextCoins })
            .eq('id', authUser.id)
            .select('worship_count, coins')
            .maybeSingle();

          userCount = updatedU ? parseInt(updatedU.worship_count) : nextUCount;
          userCoins = updatedU ? parseInt(updatedU.coins) : nextCoins;
        } else {
          userCount = parseInt(uData);
        }
      }
    }

    return NextResponse.json({
      success: true,
      globalCount,
      userCount,
      userCoins
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '숭배 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
