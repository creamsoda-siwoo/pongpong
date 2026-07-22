import { NextResponse } from 'next/server';
import { mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function POST(req, { params }) {
  const postId = params.id;
  try {
    if (isMockDb) {
      const post = mockDb.posts.find(p => String(p.id) === String(postId));
      if (!post) return NextResponse.json({ error: '게시글이 존재하지 않습니다.' }, { status: 404 });
      post.reactions = (post.reactions || 0) + 1;
      saveLocalDb();
      return NextResponse.json({ success: true, reactions: post.reactions });
    } else {
      const { data: post } = await supabase.from('worship_posts').select('reactions').eq('id', postId).maybeSingle();
      const current = (post && post.reactions) ? parseInt(post.reactions) : 0;
      const { data: updated } = await supabase.from('worship_posts').update({ reactions: current + 1 }).eq('id', postId).select('reactions').maybeSingle();
      return NextResponse.json({ success: true, reactions: updated ? parseInt(updated.reactions) : current + 1 });
    }
  } catch (err) {
    return NextResponse.json({ error: '반응 처리 오류' }, { status: 500 });
  }
}
