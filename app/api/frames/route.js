import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function GET() {
  try {
    let list = [];
    if (!isMockDb) {
      try {
        const { data, error } = await supabase
          .from('worship_frames')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) list = data;
        else throw error;
      } catch (e) {
        mockDb.frames = mockDb.frames || [];
        list = [...mockDb.frames].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } else {
      mockDb.frames = mockDb.frames || [];
      list = [...mockDb.frames].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: '액자 갤러리 조회 오류' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const { title, image_data, frame_style } = await req.json();
    if (!image_data) {
      return NextResponse.json({ error: '이미지를 첨부해 주세요.' }, { status: 400 });
    }

    const newTitle = title && title.trim() !== '' ? title.trim() : '성스러운 퐁퐁 사진';
    const style = frame_style || 'frame-gold';
    const newFrame = {
      id: Date.now(),
      username: authUser.username,
      title: newTitle,
      image_data,
      frame_style: style,
      reactions: 0,
      created_at: new Date().toISOString()
    };

    if (!isMockDb && supabase) {
      try {
        const { data, error } = await supabase
          .from('worship_frames')
          .insert([{ username: authUser.username, title: newTitle, image_data, frame_style: style, reactions: 0 }])
          .select()
          .single();
        if (!error && data) {
          return NextResponse.json({ success: true, frame: data });
        }
      } catch (e) {}
    }

    mockDb.frames = mockDb.frames || [];
    mockDb.frames.unshift(newFrame);
    saveLocalDb();
    return NextResponse.json({ success: true, frame: newFrame });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '액자 게시 중 오류 발생' }, { status: 500 });
  }
}
