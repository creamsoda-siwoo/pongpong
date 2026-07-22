import { NextResponse } from 'next/server';
import { getAuthUser, mockDb, saveLocalDb, supabase, isMockDb } from '@/lib/db';

export async function DELETE(req, { params }) {
  try {
    const authUser = await getAuthUser(req);
    if (!authUser) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }

    const postId = params.id;

    if (isMockDb) {
      const index = mockDb.posts.findIndex(p => String(p.id) === String(postId) && p.username === authUser.username);
      if (index === -1) {
        return NextResponse.json({ error: '본인의 게시글만 삭제할 수 있습니다.' }, { status: 403 });
      }
      mockDb.posts.splice(index, 1);
      saveLocalDb();
      return NextResponse.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } else {
      const { data: post, error: findErr } = await supabase
        .from('worship_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (findErr || !post) {
        return NextResponse.json({ error: '게시글을 찾을 수 없습니다.' }, { status: 404 });
      }

      if (post.username !== authUser.username) {
        return NextResponse.json({ error: '본인의 게시글만 삭제할 수 있습니다.' }, { status: 403 });
      }

      const { error: delErr } = await supabase
        .from('worship_posts')
        .delete()
        .eq('id', postId);

      if (delErr) throw delErr;

      return NextResponse.json({ success: true, message: '게시글이 삭제되었습니다.' });
    }
  } catch (err) {
    console.error('Delete post error:', err);
    return NextResponse.json({ error: '게시글 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
}
