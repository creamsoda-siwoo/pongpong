import Link from 'next/link';

export default function NotFound() {
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
      <div style={{ fontSize: '72px', marginBottom: '15px' }}>🍮 🔍</div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '10px' }}>
        404 - 성전 페이지를 찾을 수 없습니다
      </h2>
      <p style={{ fontSize: '15px', color: '#7A5338', maxWidth: '500px', marginBottom: '25px', lineHeight: '1.6' }}>
        요청하신 페이지가 존재하지 않거나 이전되었습니다. 메인 성전으로 돌아가세요.
      </p>
      <Link
        href="/"
        style={{
          background: '#FFD23F',
          color: '#3E2723',
          padding: '12px 28px',
          borderRadius: '24px',
          textDecoration: 'none',
          fontWeight: '700',
          fontSize: '15px',
          boxShadow: '0 4px 15px rgba(255, 210, 63, 0.4)',
        }}
      >
        🏠 메인 성전으로 돌아가기
      </Link>
    </div>
  );
}
