import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { itemId, price } = await req.json();
    const cost = parseInt(price) || 0;

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
        return NextResponse.json({ error: '퐁퐁코인이 부족합니다!' }, { status: 400 });
      }

      user.coins -= cost;
      user.inventory = user.inventory || [];
      if (!user.inventory.includes(itemId)) {
        user.inventory.push(itemId);
      }
      if (itemId.startsWith('skin_')) {
        user.equipped_skin = itemId;
      }
      saveLocalDb();

      return NextResponse.json({
        success: true,
        coins: user.coins,
        inventory: user.inventory,
        equipped_skin: user.equipped_skin
      });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', authUser.id).maybeSingle();
      const currentCoins = (user && user.coins !== null && user.coins !== undefined) ? parseInt(user.coins) : 100;

      if (currentCoins < cost) {
        return NextResponse.json({ error: '퐁퐁코인이 부족합니다!' }, { status: 400 });
      }

      const nextCoins = currentCoins - cost;
      let inventory = Array.isArray(user?.inventory) ? user.inventory : [];
      if (!inventory.includes(itemId)) inventory.push(itemId);

      let equipped_skin = user?.equipped_skin || 'default';
      if (itemId.startsWith('skin_')) equipped_skin = itemId;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, inventory, equipped_skin })
        .eq('id', authUser.id)
        .select()
        .maybeSingle();

      return NextResponse.json({
        success: true,
        coins: updated ? updated.coins : nextCoins,
        inventory: updated ? updated.inventory : inventory,
        equipped_skin: updated ? updated.equipped_skin : equipped_skin
      });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '상점 구매 처리 실패' }, { status: 500 });
  }
}
