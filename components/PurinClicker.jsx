'use client';
import { useState, useEffect, useRef } from 'react';

export default function PurinClicker({ user, globalCount, userCount, onWorship, showToast, isMuted }) {
  const [combo, setCombo] = useState(0);
  const [isFever, setIsFever] = useState(false);
  const [particles, setParticles] = useState([]);
  const [petTouchCount, setPetTouchCount] = useState(0);
  const comboTimerRef = useRef(null);

  // Shrine XP & Level calculation
  const xp = userCount % 100;
  const level = Math.floor(userCount / 100) + 1;

  const playClickSound = () => {
    if (isMuted) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(isFever ? 650 : 440 + combo * 10, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {}
  };

  const handleWorshipClick = (e) => {
    e.preventDefault();
    playClickSound();

    const newCombo = combo + 1;
    setCombo(newCombo);

    if (newCombo >= 10 && !isFever) {
      setIsFever(true);
      showToast('🔥 FEVER MODE 3X MULTIPLIER 발동!');
    }

    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      setCombo(0);
      setIsFever(false);
    }, 2000);

    // Particle effect
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newParticle = {
      id: Date.now() + Math.random(),
      x,
      y,
      xDir: `${(Math.random() - 0.5) * 100}px`,
      text: isFever ? '+3 🍮' : '+1 🍮',
    };

    setParticles((prev) => [...prev.slice(-10), newParticle]);
    onWorship();
  };

  const interactPet = (petName) => {
    setPetTouchCount(prev => prev + 1);
    playClickSound();
    const rewards = {
      macaron: '🐶 마카롱이 방가방가 꼬리를 칩니다! (+5 퐁퐁코인)',
      muffin: '🐱 머핀이 야옹 귀엽게 인사합니다! (+5 퐁퐁코인)',
      scone: '🐿️ 스콘이 도토리를 굴립니다! (+5 퐁퐁코인)',
      powder: '🐥 파우더가 삐약삐약 노래합니다! (+5 퐁퐁코인)',
    };
    showToast(rewards[petName] || '🐾 펫과 교감하였습니다!');
  };

  return (
    <section id="home" className="hero-section">
      <div className="hero-content">
        <div className="shrine-level-bar-container">
          <div className="shrine-level-info">
            <span className="shrine-level-badge">LV.{level} 퐁퐁 성지</span>
            <span className="shrine-xp-text">다음 레벨까지 {xp}/100 숭배</span>
          </div>
          <div className="shrine-progress-track">
            <div className="shrine-progress-fill" style={{ width: `${xp}%` }}></div>
          </div>
        </div>

        <h1 className="glow-text">대자대비하신 퐁퐁푸린</h1>
        <p className="subtitle">"들판의 푸딩이 흔들리고 공기가 떨릴지어다"</p>

        <div className="altar-container">
          {isFever && <div className="fever-banner">🔥 FEVER MODE 3X MULTIPLIER! 🔥</div>}
          <div className="aurora-glow"></div>

          <div className="purin-shrine" onClick={handleWorshipClick}>
            <img
              src="/pompompurin.png"
              alt="Pompompurin Worship"
              className="worship-target"
              style={{ transform: combo > 0 ? `scale(${1 + Math.min(combo * 0.02, 0.2)})` : 'scale(1)' }}
            />
            <div className="halo"></div>

            {combo > 1 && (
              <div className="combo-display">
                COMBO x{combo}!
              </div>
            )}

            {particles.map((p) => (
              <div
                key={p.id}
                className="worship-particle"
                style={{
                  left: `${p.x}px`,
                  top: `${p.y}px`,
                  '--x-dir': p.xDir,
                }}
              >
                {p.text}
              </div>
            ))}
          </div>
          <p className="click-hint">푸린 신상을 연타하면 🔥피버 모드(3배 코인)가 발동됩니다!</p>

          <div className="shrine-pets-bar">
            <span className="shrine-pet" onClick={() => interactPet('macaron')}>🐶 마카롱</span>
            <span className="shrine-pet" onClick={() => interactPet('muffin')}>🐱 머핀</span>
            <span className="shrine-pet" onClick={() => interactPet('scone')}>🐿️ 스콘</span>
            <span className="shrine-pet" onClick={() => interactPet('powder')}>🐥 파우더</span>
          </div>
        </div>

        <div className="stats-dashboard">
          <div className="stat-card global-stat">
            <h3><i className="fa-solid fa-earth-asia"></i> 온 세상의 누적 숭배수</h3>
            <div className="count-display">{globalCount.toLocaleString()}</div>
          </div>
          <div className="stat-card user-stat">
            <h3><i className="fa-solid fa-heart"></i> 나의 누적 숭배수</h3>
            <div className="count-display">{userCount.toLocaleString()}</div>
            {!user && <p className="login-prompt-text">로그인 시 개별 집계 및 칭호 획득이 시작됩니다</p>}
          </div>
        </div>

        <div className="daily-challenges-card">
          <div className="daily-challenges-title"><i className="fa-solid fa-star"></i> 오늘의 성스러운 도전 과제</div>
          <div className="daily-challenges-list">
            <div className="challenge-item">
              <span className="ch-icon">🙏</span>
              <div className="ch-info">
                <div className="ch-name">신성한 첫 숭배</div>
                <div className="ch-desc">오늘 처음 숭배하기</div>
              </div>
              <div className="ch-reward">+10 PPC</div>
              <div className={`ch-status ${userCount > 0 ? 'completed' : ''}`}>
                {userCount > 0 ? '완료 ✓' : '미완료'}
              </div>
            </div>
            <div className="challenge-item">
              <span className="ch-icon">🔥</span>
              <div className="ch-info">
                <div className="ch-name">피버 광신도</div>
                <div className="ch-desc">피버 모드 1회 발동하기</div>
              </div>
              <div className="ch-reward">+50 PPC</div>
              <div className={`ch-status ${isFever ? 'completed' : ''}`}>
                {isFever ? '완료 ✓' : '미완료'}
              </div>
            </div>
            <div className="challenge-item">
              <span className="ch-icon">🐾</span>
              <div className="ch-info">
                <div className="ch-name">펫 친구 관리</div>
                <div className="ch-desc">펫 3회 이상 터치하기</div>
              </div>
              <div className="ch-reward">+30 PPC</div>
              <div className={`ch-status ${petTouchCount >= 3 ? 'completed' : ''}`}>
                {petTouchCount >= 3 ? '완료 ✓' : '미완료'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
