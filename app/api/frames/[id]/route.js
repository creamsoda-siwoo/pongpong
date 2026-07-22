import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function DELETE(req, { params }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const frameId = params.id;

    if (!isMockDb && supabase) {
      try {
        const { data: frame } = await supabase.from('worship_frames').select('*').eq('id', frameId).maybeSingle();
        if (frame) {
          if (frame.username !== authUser.username) {
            return NextResponse.json({ error: '본인의 액자만 삭제할 수 있습니다.' }, { status: 403 });
          }
          await supabase.from('worship_frames').delete().eq('id', frameId);
          return NextResponse.json({ success: true, message: '액자가 삭제되었습니다.' });
        }
      } catch (e) {}
    }

    mockDb.frames = mockDb.frames || [];
    const idx = mockDb.frames.findIndex(f => String(f.id) === String(frameId) && f.username === authUser.username);
    if (idx === -1) {
      return NextResponse.json({ error: '본인의 액자만 삭제할 수 있습니다.' }, { status: 403 });
    }
    mockDb.frames.splice(idx, 1);
    saveLocalDb();
    return NextResponse.json({ success: true, message: '액자가 삭제되었습니다.' });
  } catch (err) {
    return NextResponse.json({ error: '액자 삭제 오류' }, { status: 500 });
  }
}
