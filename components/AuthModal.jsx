'use client';
import { useState } from 'react';

export default function AuthModal({ isOpen, mode, onClose, onAuthSuccess, showToast }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('⚠️ 아이디와 비밀번호를 입력해주세요.');
      return;
    }

    setLoading(true);
    const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register';
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = { error: `인증 서버 응답 오류 (${res.status})` };
      }

      if (res.ok && data.success) {
        showToast(mode === 'login' ? `🔓 환영합니다, ${data.user.username}님!` : '🎉 회원가입 및 로그인이 완료되었습니다!');
        onAuthSuccess(data.user);
        onClose();
        setUsername('');
        setPassword('');
      } else {
        showToast(`❌ ${data.error || '인증에 실패하였습니다.'}`);
      }
    } catch (err) {
      showToast('❌ 인증 처리 중 네트워크 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>{mode === 'login' ? '🔐 퐁퐁 성지 로그인' : '✨ 신규 숭배자 회원가입'}</h2>

        <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
              사용자 이름 (아이디)
            </label>
            <input
              type="text"
              placeholder="2자 이상의 사용자 이름"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>
              비밀번호
            </label>
            <input
              type="password"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '12px',
                border: '1px solid var(--glass-border)',
                background: 'var(--glass-bg)',
                outline: 'none',
              }}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={loading}>
            {loading ? '처리 중...' : mode === 'login' ? '로그인하기' : '가입 및 자동 로그인'}
          </button>
        </form>
      </div>
    </div>
  );
}
