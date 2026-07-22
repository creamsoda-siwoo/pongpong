import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function GET() {
  try {
    let list = [];
    if (isMockDb) {
      list = [...mockDb.posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      const { data, error } = await supabase
        .from('worship_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) list = data;
    }
    return NextResponse.json(list);
  } catch (err) {
    return NextResponse.json({ error: '방명록 조회 오류' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '숭배자만 한마디를 남길 수 있습니다. 로그인해주세요.' }, { status: 401 });
    }

    const { content, image_data } = await req.json();
    if (!content || content.trim() === '') {
      return NextResponse.json({ error: '내용을 입력해주세요.' }, { status: 400 });
    }

    if (isMockDb) {
      const newPost = {
        id: Date.now(),
        username: authUser.username,
        content: content.trim(),
        image_data: image_data || null,
        created_at: new Date().toISOString()
      };
      mockDb.posts.unshift(newPost);
      saveLocalDb();
      return NextResponse.json({ success: true, post: newPost });
    } else {
      const { data, error } = await supabase
        .from('worship_posts')
        .insert([{ username: authUser.username, content: content.trim(), image_data: image_data || null }])
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, post: data });
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: '방명록 작성 오류' }, { status: 500 });
  }
}
