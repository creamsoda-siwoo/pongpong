'use client';
import { useState, useEffect } from 'react';

export default function GuestbookSection({ user, showToast }) {
  const [posts, setPosts] = useState([]);
  const [content, setContent] = useState('');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    try {
      const res = await fetch('/api/posts');
      const data = await res.json();
      if (Array.isArray(data)) setPosts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageData(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('⚠️ 숭배자만 한마디를 남길 수 있습니다. 로그인해주세요.');
      return;
    }
    if (!content.trim()) {
      showToast('⚠️ 내용을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, image_data: imageData }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('✍️ 성전 방명록에 성스러운 한마디가 등록되었습니다!');
        setContent('');
        setImageData(null);
        fetchPosts();
      } else {
        showToast(`❌ ${data.error || '등록 실패'}`);
      }
    } catch (err) {
      showToast('❌ 서버 통신 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}/react`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setPosts((prev) =>
          prev.map((p) => (String(p.id) === String(id) ? { ...p, reactions: data.reactions } : p))
        );
      }
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ 게시글이 삭제되었습니다.');
        fetchPosts();
      } else {
        showToast(`❌ ${data.error}`);
      }
    } catch (e) {}
  };

  return (
    <section id="board" className="board-section">
      <div className="section-title">
        <h2 className="sep-title">📜 성전 방명록</h2>
        <p>전 세계 퐁퐁푸린 숭배자들과 은혜로운 한마디를 나누세요.</p>
      </div>

      <div className="board-container">
        <div className="board-write-card">
          <h3>✍️ 한마디 남기기</h3>
          <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
            <textarea
              style={{
                width: '100%',
                height: '100px',
                padding: '12px',
                borderRadius: '14px',
                border: '1px solid var(--glass-border)',
                background: 'var(--card-bg)',
                color: 'var(--text-dark)',
                outline: 'none',
                resize: 'none',
                marginBottom: '10px',
              }}
              placeholder={user ? '퐁퐁푸린님께 바치는 경배의 한마디를 적어보세요...' : '로그인 후 작성할 수 있습니다.'}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={!user || loading}
            />

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--dark-brown)' }}>
                📷 사진 첨부 (선택)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                disabled={!user || loading}
                style={{ fontSize: '12px', marginTop: '4px', width: '100%' }}
              />
              {imageData && (
                <img
                  src={imageData}
                  alt="preview"
                  style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '10px', marginTop: '8px' }}
                />
              )}
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={!user || loading}>
              {loading ? '등록 중...' : '등록하기'}
            </button>
          </form>
        </div>

        <div className="board-feed">
          {posts.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>아직 등록된 방명록이 없습니다. 첫 번째 한마디를 남겨보세요!</p>
          ) : (
            posts.map((post) => (
              <div key={post.id} className="post-item">
                <div className="post-header">
                  <span className="post-author">{post.username}</span>
                  <span style={{ fontSize: '12px', color: '#888' }}>
                    {new Date(post.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
                <p style={{ margin: '8px 0', fontSize: '15px', color: 'var(--dark-brown)' }}>{post.content}</p>
                {post.image_data && (
                  <img
                    src={post.image_data}
                    alt="post attachment"
                    style={{ width: '100%', maxHeight: '250px', objectFit: 'cover', borderRadius: '12px', marginBottom: '8px' }}
                  />
                )}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button className="post-react-btn" onClick={() => handleReact(post.id)}>
                    ❤️ 숭배 공감 ({post.reactions || 0})
                  </button>
                  {user && user.username === post.username && (
                    <button
                      className="post-react-btn"
                      style={{ color: '#e53935', borderColor: '#e53935' }}
                      onClick={() => handleDelete(post.id)}
                    >
                      🗑️ 삭제
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
