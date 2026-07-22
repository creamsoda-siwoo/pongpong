import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, supabase, isMockDb } from '../../../../lib/db';

export async function GET(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ loggedIn: false });
    }

    let userDetails = null;

    if (!isMockDb && supabase) {
      try {
        let { data, error } = await supabase
          .from('worship_users')
          .select('*')
          .eq('id', authUser.id)
          .maybeSingle();

        if (!data || error) {
          const { data: dataByName } = await supabase
            .from('worship_users')
            .select('*')
            .ilike('username', authUser.username)
            .maybeSingle();
          if (dataByName) data = dataByName;
        }

        if (data) userDetails = data;
      } catch (sbErr) {}
    }

    if (!userDetails && mockDb && mockDb.users) {
      const u = mockDb.users.find(u =>
        (authUser.id && u.id === authUser.id) ||
        (authUser.username && u.username.toLowerCase() === authUser.username.toLowerCase())
      );
      if (u) userDetails = u;
    }

    if (!userDetails) {
      const response = NextResponse.json({ loggedIn: false });
      response.cookies.set('token', '', { path: '/', maxAge: 0 });
      return response;
    }

    return NextResponse.json({
      loggedIn: true,
      user: {
        id: userDetails.id,
        username: userDetails.username,
        worship_count: parseInt(userDetails.worship_count || 0),
        coins: (userDetails.coins !== undefined && userDetails.coins !== null) ? parseInt(userDetails.coins) : 100,
        inventory: userDetails.inventory || [],
        equipped_skin: userDetails.equipped_skin || 'default',
        last_attendance: userDetails.last_attendance || null
      }
    });
  } catch (err) {
    return NextResponse.json({ error: '오류가 발생했습니다.' }, { status: 500 });
  }
}
