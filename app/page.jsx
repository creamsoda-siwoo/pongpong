'use client';
import { useState, useEffect } from 'react';
import BackgroundParticles from '../components/BackgroundParticles';
import Header from '../components/Header';
import PurinClicker from '../components/PurinClicker';
import MiniGames from '../components/MiniGames';
import PuddingPiano from '../components/PuddingPiano';
import TarotSection from '../components/TarotSection';
import ScriptureSection from '../components/ScriptureSection';
import OracleSection from '../components/OracleSection';
import GuestbookSection from '../components/GuestbookSection';
import FrameGallerySection from '../components/FrameGallerySection';
import LeaderboardSection from '../components/LeaderboardSection';
import AuthModal from '../components/AuthModal';
import ShopModal from '../components/ShopModal';
import GachaModal from '../components/GachaModal';
import RouletteModal from '../components/RouletteModal';
import WorshipperCardModal from '../components/WorshipperCardModal';

export default function Home() {
  const [user, setUser] = useState(null);
  const [globalCount, setGlobalCount] = useState(0);
  const [userCount, setUserCount] = useState(0);
  const [activeModal, setActiveModal] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/auth/me');
      const data = await res.json();
      if (data.loggedIn && data.user) {
        setUser(data.user);
        setUserCount(data.user.worship_count || 0);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/worship/stats');
      const data = await res.json();
      if (data.globalCount !== undefined) setGlobalCount(data.globalCount);
      if (data.userCount !== undefined) setUserCount(data.userCount);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    checkAuth();
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleWorship = async () => {
    setGlobalCount((g) => g + 1);
    if (user) setUserCount((u) => u + 1);

    try {
      const res = await fetch('/api/worship', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        if (data.globalCount) setGlobalCount(data.globalCount);
        if (data.userCount !== null) setUserCount(data.userCount);
        if (data.userCoins !== null && user) {
          setUser((prev) => ({ ...prev, coins: data.userCoins, worship_count: data.userCount }));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setUserCount(0);
      showToast('👋 로그아웃 되었습니다.');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={user && user.equipped_skin ? `skin-${user.equipped_skin.replace('skin_', '')}` : ''}>
      <BackgroundParticles />

      <Header
        user={user}
        onOpenModal={(modal) => setActiveModal(modal)}
        onLogout={handleLogout}
        showToast={showToast}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
        isMuted={isMuted}
        setIsMuted={setIsMuted}
      />

      <div className="event-banner-strip">
        <span className="event-banner-inner">
          🍮 ✨ <strong>여름 한정 성전 이벤트</strong> 개최 중 — 오늘 숭배 100회 달성 시 🎁 <strong>황금 푸딩 코인 +500 PPC</strong> 보너스 지급! &nbsp;&nbsp;|&nbsp;&nbsp; 🐾 펫 친구들과 10회 이상 교감하면 시즌 전용 칭호 획득! &nbsp;&nbsp;|&nbsp;&nbsp; 🎹 성스러운 푸딩 피아노 연주 가능! ✨ 🍮
        </span>
      </div>

      <main>
        <PurinClicker
          user={user}
          globalCount={globalCount}
          userCount={userCount}
          onWorship={handleWorship}
          showToast={showToast}
          isMuted={isMuted}
        />

        <MiniGames showToast={showToast} user={user} setUser={setUser} />

        <PuddingPiano showToast={showToast} isMuted={isMuted} />

        <TarotSection />

        <ScriptureSection />

        <OracleSection />

        <GuestbookSection user={user} showToast={showToast} />

        <FrameGallerySection user={user} showToast={showToast} />

        <LeaderboardSection user={user} />
      </main>

      <AuthModal
        isOpen={activeModal === 'login' || activeModal === 'register'}
        mode={activeModal}
        onClose={() => setActiveModal(null)}
        onAuthSuccess={(u) => {
          setUser(u);
          setUserCount(u.worship_count || 0);
        }}
        showToast={showToast}
      />

      <ShopModal
        isOpen={activeModal === 'shop'}
        user={user}
        setUser={setUser}
        onClose={() => setActiveModal(null)}
        showToast={showToast}
      />

      <GachaModal
        isOpen={activeModal === 'gacha'}
        user={user}
        setUser={setUser}
        onClose={() => setActiveModal(null)}
        showToast={showToast}
      />

      <RouletteModal
        isOpen={activeModal === 'roulette'}
        user={user}
        setUser={setUser}
        onClose={() => setActiveModal(null)}
        showToast={showToast}
      />

      <WorshipperCardModal
        isOpen={activeModal === 'pass'}
        user={user}
        userCount={userCount}
        onClose={() => setActiveModal(null)}
      />

      {toastMessage && <div className="toast-notification show">{toastMessage}</div>}
    </div>
  );
}
