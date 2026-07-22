'use client';
import { useState, useEffect } from 'react';

export default function FrameGallerySection({ user, showToast }) {
  const [frames, setFrames] = useState([]);
  const [title, setTitle] = useState('');
  const [frameStyle, setFrameStyle] = useState('frame-gold');
  const [imageData, setImageData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchFrames = async () => {
    try {
      const res = await fetch('/api/frames');
      const data = await res.json();
      if (Array.isArray(data)) setFrames(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFrames();
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setImageData(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('⚠️ 로그인이 필요합니다.');
      return;
    }
    if (!imageData) {
      showToast('⚠️ 사진을 첨부해 주세요!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/frames', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, image_data: imageData, frame_style: frameStyle }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('🖼️ 성전 액자 갤러리에 사진이 정식 게시되었습니다!');
        setTitle('');
        setImageData(null);
        fetchFrames();
      } else {
        showToast(`❌ ${data.error}`);
      }
    } catch (err) {
      showToast('❌ 액자 게시 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleReact = async (id) => {
    try {
      const res = await fetch(`/api/frames/${id}/react`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setFrames((prev) =>
          prev.map((f) => (String(f.id) === String(id) ? { ...f, reactions: data.reactions } : f))
        );
      }
    } catch (e) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('액자를 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`/api/frames/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('🗑️ 액자가 삭제되었습니다.');
        fetchFrames();
      } else {
        showToast(`❌ ${data.error}`);
      }
    } catch (e) {}
  };

  return (
    <section id="frameGallery" className="frame-gallery-section">
      <div className="section-title">
        <h2 className="sep-title">🖼️ 성전 액자 갤러리</h2>
        <p>나만의 퐁퐁푸린 최애 사진을 명품 액자에 게시하세요.</p>
      </div>

      <div className="frame-container">
        <div className="frame-upload-card">
          <h3>🖼️ 새 액자 등록</h3>
          <form onSubmit={handleUpload} style={{ marginTop: '15px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>액자 제목</label>
              <input
                type="text"
                placeholder="예: 황금빛 퐁퐁 사진"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginTop: '4px' }}
                disabled={!user || loading}
              />
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>액자 테두리 스타일</label>
              <select
                value={frameStyle}
                onChange={(e) => setFrameStyle(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: '10px', border: '1px solid var(--glass-border)', marginTop: '4px' }}
                disabled={!user || loading}
              >
                <option value="frame-gold">👑 황금 커스터드 액자</option>
                <option value="frame-wood">🪵 성스러운 목재 액자</option>
                <option value="frame-pink">🌸 핑크 푸딩 액자</option>
                <option value="frame-diamond">💎 다이아몬드 크리스탈 액자</option>
              </select>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>사진 파일</label>
              <input type="file" accept="image/*" onChange={handleImageChange} disabled={!user || loading} style={{ fontSize: '12px', marginTop: '4px' }} />
            </div>

            {imageData && (
              <div className={`framed-photo-box ${frameStyle}`} style={{ marginBottom: '15px' }}>
                <img src={imageData} alt="preview" />
                <div className="frame-title-tag">{title || '제목 없음'}</div>
              </div>
            )}

            <button className="btn btn-primary btn-block" type="submit" disabled={!user || loading}>
              {loading ? '게시 중...' : '🖼️ 액자 게시하기'}
            </button>
          </form>
        </div>

        <div className="frame-wall-grid">
          {frames.length === 0 ? (
            <p style={{ color: '#888', gridColumn: '1 / -1', textAlign: 'center' }}>등록된 액자가 없습니다.</p>
          ) : (
            frames.map((frame) => (
              <div key={frame.id} className="frame-item-card">
                <div className={`framed-photo-box ${frame.frame_style || 'frame-gold'}`}>
                  <img src={frame.image_data} alt={frame.title} />
                  <div className="frame-title-tag">{frame.title}</div>
                </div>
                <div className="frame-meta">
                  <span>작성자: {frame.username}</span>
                  <button className="post-react-btn" onClick={() => handleReact(frame.id)}>
                    ❤️ {frame.reactions || 0}
                  </button>
                  {user && user.username === frame.username && (
                    <button className="post-react-btn" style={{ color: '#e53935' }} onClick={() => handleDelete(frame.id)}>
                      🗑️
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
