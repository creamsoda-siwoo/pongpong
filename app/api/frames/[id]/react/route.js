import { NextResponse } from 'next/server';
import { mockDb, saveLocalDb, supabase, isMockDb } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const frameId = params.id;
  try {
    if (!isMockDb && supabase) {
      try {
        const { data: frame } = await supabase.from('worship_frames').select('reactions').eq('id', frameId).maybeSingle();
        const current = (frame && frame.reactions) ? parseInt(frame.reactions) : 0;
        const { data: updated } = await supabase.from('worship_frames').update({ reactions: current + 1 }).eq('id', frameId).select('reactions').maybeSingle();
        if (updated) return NextResponse.json({ success: true, reactions: parseInt(updated.reactions) });
      } catch (e) {}
    }

    mockDb.frames = mockDb.frames || [];
    const frame = mockDb.frames.find(f => String(f.id) === String(frameId));
    if (!frame) return NextResponse.json({ error: '액자를 찾을 수 없습니다.' }, { status: 404 });
    frame.reactions = (frame.reactions || 0) + 1;
    saveLocalDb();
    return NextResponse.json({ success: true, reactions: frame.reactions });
  } catch (err) {
    return NextResponse.json({ error: '공감 오류' }, { status: 500 });
  }
}
