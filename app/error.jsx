'use client';
import { useEffect } from 'react';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error('🛡️ [GLOBAL ERROR BOUNDARY]:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at top, #FFFDEB, #FFF9D1, #FFF2B2)',
        color: '#5C3A21',
        padding: '20px',
        textAlign: 'center',
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      <div style={{ fontSize: '72px', marginBottom: '15px' }}>🍮 🛡️</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>
        성전 접속 중 일시적인 오류가 발생했습니다
      </h2>
      <p style={{ fontSize: '15px', color: '#7A5338', maxWidth: '500px', marginBottom: '25px', lineHeight: '1.6' }}>
        퐁퐁푸린 성지의 수호막이 자동 실행되었습니다. 아래 버튼을 눌러 페이지를 다시 불러와주세요.
      </p>
      <button
        onClick={() => reset()}
        style={{
          background: '#5C3A21',
          color: '#FFFBEB',
          padding: '12px 28px',
          borderRadius: '24px',
          border: 'none',
          fontWeight: '700',
          fontSize: '15px',
          cursor: 'pointer',
          boxShadow: '0 4px 15px rgba(92, 58, 33, 0.25)',
        }}
      >
        🔄 다시 시도하기
      </button>
    </div>
  );
}
