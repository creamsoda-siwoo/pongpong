import { NextResponse } from 'next/server';
import { mockDb, supabase, isMockDb } from '@/lib/db';

export async function GET() {
  try {
    let list = [];
    if (isMockDb) {
      list = [...mockDb.users]
        .sort((a, b) => (b.worship_count || 0) - (a.worship_count || 0))
        .slice(0, 10)
        .map(u => ({ id: u.id, username: u.username, worship_count: parseInt(u.worship_count) || 0 }));
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('id, username, worship_count')
        .order('worship_count', { ascending: false })
        .limit(10);
      if (!error && data) {
        list = data.map(u => ({ id: u.id, username: u.username, worship_count: parseInt(u.worship_count) || 0 }));
      }
    }
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: '리더보드 조회 오류' }, { status: 500 });
  }
}
