import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const cost = 100;
    const gachaPool = [
      { name: '🍮 전설의 자이언트 커스터드', rarity: 'Legendary', icon: '🍮' },
      { name: '🍩 다이아몬드 도넛', rarity: 'Epic', icon: '🍩' },
      { name: '🍨 성스러운 빙수', rarity: 'Rare', icon: '🍨' },
      { name: '🎂 축복의 케이크', rarity: 'Rare', icon: '🎂' },
      { name: '🍯 마법의 꿀단지', rarity: 'Normal', icon: '🍯' },
      { name: '🍪 바삭쿠키', rarity: 'Normal', icon: '🍪' }
    ];

    const loot = gachaPool[Math.floor(Math.random() * gachaPool.length)];

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

      user.coins = (user.coins !== undefined && user.coins !== null) ? user.coins : 100;
      if (user.coins < cost) {
        return NextResponse.json({ error: '퐁퐁코인이 부족합니다! (100 PPC 필요)' }, { status: 400 });
      }

      user.coins -= cost;
      user.inventory = user.inventory || [];
      user.inventory.push(loot.name);
      saveLocalDb();

      return NextResponse.json({ success: true, loot, coins: user.coins, inventory: user.inventory });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', authUser.id).maybeSingle();
      const currentCoins = (user && user.coins !== null && user.coins !== undefined) ? parseInt(user.coins) : 100;
      if (currentCoins < cost) {
        return NextResponse.json({ error: '퐁퐁코인이 부족합니다! (100 PPC 필요)' }, { status: 400 });
      }

      let inventory = Array.isArray(user?.inventory) ? user.inventory : [];
      inventory.push(loot.name);
      const nextCoins = currentCoins - cost;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, inventory })
        .eq('id', authUser.id)
        .select()
        .maybeSingle();

      return NextResponse.json({ success: true, loot, coins: updated ? updated.coins : nextCoins, inventory: updated ? updated.inventory : inventory });
    }
  } catch (err) {
    console.error('GACHA ERROR:', err);
    return NextResponse.json({ error: '가챠 뽑기 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
