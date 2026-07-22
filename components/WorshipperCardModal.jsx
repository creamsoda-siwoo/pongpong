'use client';

export default function WorshipperCardModal({ isOpen, user, userCount, onClose }) {
  if (!isOpen) return null;

  const rankTitles = [
    { threshold: 0, title: ' 예비 숭배자' },
    { threshold: 50, title: '🥉 동빛 퐁퐁 수호대' },
    { threshold: 200, title: '🥈 은빛 커스터드 기사' },
    { threshold: 500, title: '🥇 황금 퐁퐁 신도' },
    { threshold: 1000, title: '👑 성스러운 푸딩 대사제' },
    { threshold: 3000, title: '✨ 전설의 퐁퐁 성자' },
  ];

  let currentTitle = ' 예비 숭배자';
  for (let i = rankTitles.length - 1; i >= 0; i--) {
    if (userCount >= rankTitles[i].threshold) {
      currentTitle = rankTitles[i].title;
      break;
    }
  }

  return (
    <div className="modal show">
      <div className="modal-content">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2 style={{ textAlign: 'center', marginBottom: '15px' }}>🪪 성스러운 신도 인증서</h2>

        <div className="identity-card">
          <div className="id-card-header">
            <img src="/pompompurin.png" alt="Seal" className="id-seal" />
            <div>
              <h3>퐁퐁푸린 성전 공식 신도증</h3>
              <p>POMPOMPURIN SANCTUARY OFFICIAL PASS</p>
            </div>
          </div>

          <div className="id-card-body">
            <div className="id-row">
              <span>숭배자 아이디: </span>
              <strong>{user ? user.username : 'GUEST (비회원)'}</strong>
            </div>
            <div className="id-row">
              <span>성전 칭호: </span>
              <strong>{currentTitle}</strong>
            </div>
            <div className="id-row">
              <span>누적 숭배 횟수: </span>
              <strong>{userCount.toLocaleString()} 회</strong>
            </div>
            <div className="id-row">
              <span>보유 퐁퐁코인: </span>
              <strong>{user ? user.coins : 0} PPC</strong>
            </div>
            <div className="id-row">
              <span>착용 중인 스킨: </span>
              <strong>{user && user.equipped_skin ? user.equipped_skin : '기본 푸린'}</strong>
            </div>
          </div>

          <div className="id-card-footer">
            <span>발급처: 퐁퐁 성지 중앙제단</span>
            <span className="stamp-seal">인가 필</span>
          </div>
        </div>
      </div>
    </div>
  );
}
