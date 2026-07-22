'use client';

export default function Header({
  user,
  onOpenModal,
  onLogout,
  showToast,
  isDarkMode,
  setIsDarkMode,
  isMuted,
  setIsMuted,
}) {
  const toggleTheme = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    if (next) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const toggleSound = () => {
    setIsMuted(!isMuted);
    showToast(!isMuted ? '🔇 효과음이 음소거되었습니다.' : '🔊 효과음이 활성화되었습니다.');
  };

  return (
    <header>
      <div className="header-container">
        <div className="logo">
          <img src="/pompompurin.png" alt="Mini Purin" className="mini-purin" />
          <span>퐁퐁푸린 숭배성지</span>
        </div>
        <nav>
          <a href="#home"><i className="fa-solid fa-gopuran"></i> 성전</a>
          <a href="#minigame"><i className="fa-solid fa-gamepad"></i> 미니게임</a>
          <a href="#tarot"><i className="fa-solid fa-brain"></i> 타로</a>
          <a href="#scripture"><i className="fa-solid fa-book-open"></i> 복음</a>
          <a href="#oracle"><i className="fa-solid fa-wand-magic-sparkles"></i> 신탁</a>
          <a href="#board"><i className="fa-solid fa-scroll"></i> 방명록</a>
          <a href="#frameGallery"><i className="fa-solid fa-image"></i> 액자</a>
          <a href="#leaderboard"><i className="fa-solid fa-crown"></i> 전당</a>
        </nav>
        <div className="auth-section">
          <button className="icon-tool-btn" onClick={toggleTheme} title="다크/라이트 테마 전환">
            <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          <button className={`icon-tool-btn ${isMuted ? 'muted' : ''}`} onClick={toggleSound} title="효과음 ON/OFF">
            <i className={`fa-solid ${isMuted ? 'fa-volume-xmark' : 'fa-volume-high'}`}></i>
          </button>
          <button className="icon-tool-btn trophy-btn" onClick={() => onOpenModal('gacha')} title="디저트 럭키 가챠">
            <i className="fa-solid fa-gift"></i>
          </button>
          <button className="icon-tool-btn trophy-btn" onClick={() => onOpenModal('roulette')} title="럭키 룰렛">
            <i className="fa-solid fa-dharmachakra"></i>
          </button>
          <button className="icon-tool-btn trophy-btn" onClick={() => onOpenModal('pass')} title="신도 인증서">
            <i className="fa-solid fa-id-card"></i>
          </button>
          <button className="icon-tool-btn trophy-btn" onClick={() => onOpenModal('shop')} title="퐁퐁 상점 및 스킨">
            <i className="fa-solid fa-store"></i>
          </button>

          {user ? (
            <div className="user-badge">
              <span>🍮 <strong>{user.username}</strong>님</span>
              <span style={{ color: 'var(--gold)', fontWeight: '800' }}>💰 {user.coins || 0} PPC</span>
              <button className="btn btn-logout" onClick={onLogout}>로그아웃</button>
            </div>
          ) : (
            <>
              <button className="btn btn-secondary" onClick={() => onOpenModal('login')}>로그인</button>
              <button className="btn btn-primary" onClick={() => onOpenModal('register')}>회원가입</button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
