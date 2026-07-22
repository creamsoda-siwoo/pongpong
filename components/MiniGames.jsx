'use client';
import { useState, useEffect, useRef } from 'react';

export default function MiniGames({ showToast, user, setUser }) {
  const [activeTab, setActiveTab] = useState('catch');

  // Game 1: Pudding Catch
  const [catchScore, setCatchScore] = useState(0);
  const [catchTime, setCatchTime] = useState(30);
  const [isCatchPlaying, setIsCatchPlaying] = useState(false);
  const [basketPos, setBasketPos] = useState(50);

  // Game 2: Memory Match
  const [memoryCards, setMemoryCards] = useState([]);
  const [flippedCards, setFlippedCards] = useState([]);
  const [matchedPairs, setMatchedPairs] = useState(0);
  const [memoryFlips, setMemoryFlips] = useState(0);

  // Game 3: Putin Smash
  const [smashScore, setSmashScore] = useState(0);
  const [smashTime, setSmashTime] = useState(25);
  const [isSmashPlaying, setIsSmashPlaying] = useState(false);
  const [activeHole, setActiveHole] = useState(null);

  // Game 4: Slot Machine
  const [reels, setReels] = useState(['🍮', '🍩', '🍨']);
  const [isSpinning, setIsSpinning] = useState(false);

  // Game 5: Pudding Bakery
  const [bakeStatus, setBakeStatus] = useState('ready'); // ready, baking, done
  const [bakeProgress, setBakeProgress] = useState(0);
  const [bakedPuddings, setBakedPuddings] = useState(0);

  // --- Game 1 Logic ---
  const startCatchGame = () => {
    setCatchScore(0);
    setCatchTime(30);
    setIsCatchPlaying(true);
    setBasketPos(50);
  };

  useEffect(() => {
    if (!isCatchPlaying) return;
    const interval = setInterval(() => {
      setCatchTime((t) => {
        if (t <= 1) {
          clearInterval(interval);
          setIsCatchPlaying(false);
          showToast(`🎮 게임 종료! 최종 점수: ${catchScore}점`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isCatchPlaying, catchScore]);

  // --- Game 2 Logic ---
  const startMemoryGame = () => {
    const icons = ['🍮', '🍩', '🍨', '🎂', '🍯', '🍪', '🍒', '🍓'];
    const deck = [...icons, ...icons]
      .sort(() => Math.random() - 0.5)
      .map((icon, idx) => ({ id: idx, icon, flipped: false, matched: false }));
    setMemoryCards(deck);
    setFlippedCards([]);
    setMatchedPairs(0);
    setMemoryFlips(0);
  };

  const handleCardClick = (idx) => {
    if (flippedCards.length >= 2 || memoryCards[idx].flipped || memoryCards[idx].matched) return;
    const newCards = [...memoryCards];
    newCards[idx].flipped = true;
    setMemoryCards(newCards);

    const newFlipped = [...flippedCards, idx];
    setFlippedCards(newFlipped);
    setMemoryFlips((f) => f + 1);

    if (newFlipped.length === 2) {
      const [first, second] = newFlipped;
      if (newCards[first].icon === newCards[second].icon) {
        newCards[first].matched = true;
        newCards[second].matched = true;
        setMemoryCards(newCards);
        setMatchedPairs((p) => {
          const next = p + 1;
          if (next === 8) showToast('🎉 축하합니다! 모든 푸딩 짝을 찾으셨습니다!');
          return next;
        });
        setFlippedCards([]);
      } else {
        setTimeout(() => {
          newCards[first].flipped = false;
          newCards[second].flipped = false;
          setMemoryCards(newCards);
          setFlippedCards([]);
        }, 1000);
      }
    }
  };

  // --- Game 3 Logic ---
  const startSmashGame = () => {
    setSmashScore(0);
    setSmashTime(25);
    setIsSmashPlaying(true);
  };

  useEffect(() => {
    if (!isSmashPlaying) return;
    const moleTimer = setInterval(() => {
      setActiveHole(Math.floor(Math.random() * 9));
    }, 900);

    const gameTimer = setInterval(() => {
      setSmashTime((t) => {
        if (t <= 1) {
          clearInterval(moleTimer);
          clearInterval(gameTimer);
          setIsSmashPlaying(false);
          setActiveHole(null);
          showToast(`🔨 악당 퇴치 성공! 점수: ${smashScore}점`);
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => {
      clearInterval(moleTimer);
      clearInterval(gameTimer);
    };
  }, [isSmashPlaying, smashScore]);

  const handleHoleClick = (idx) => {
    if (idx === activeHole) {
      setSmashScore((s) => s + 10);
      setActiveHole(null);
    }
  };

  // --- Game 4 Logic (Slot) ---
  const spinSlot = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    const icons = ['🍮', '🍩', '🍨', '🎂', '🍯', '🍒', '7️⃣'];
    let count = 0;
    const interval = setInterval(() => {
      setReels([
        icons[Math.floor(Math.random() * icons.length)],
        icons[Math.floor(Math.random() * icons.length)],
        icons[Math.floor(Math.random() * icons.length)],
      ]);
      count++;
      if (count > 15) {
        clearInterval(interval);
        setIsSpinning(false);
        const final = [
          icons[Math.floor(Math.random() * icons.length)],
          icons[Math.floor(Math.random() * icons.length)],
          icons[Math.floor(Math.random() * icons.length)],
        ];
        setReels(final);
        if (final[0] === final[1] && final[1] === final[2]) {
          showToast('🎉 JACKPOT! 777 대박 당첨! (+500 PPC)');
        } else if (final[0] === final[1] || final[1] === final[2] || final[0] === final[2]) {
          showToast('✨ 2개 일치! 소소한 당첨! (+50 PPC)');
        } else {
          showToast('아쉽게도 꽝입니다! 다시 도전하세요.');
        }
      }
    }, 100);
  };

  // --- Game 5 Logic (Bakery) ---
  const startBaking = () => {
    setBakeStatus('baking');
    setBakeProgress(0);
    const interval = setInterval(() => {
      setBakeProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setBakeStatus('done');
          setBakedPuddings((b) => b + 1);
          showToast('👩‍🍳 달콤 폭신 커스터드 푸딩 완성! (+20 PPC)');
          return 100;
        }
        return p + 10;
      });
    }, 300);
  };

  useEffect(() => {
    startMemoryGame();
  }, []);

  return (
    <section id="minigame" className="minigame-section">
      <div className="section-title">
        <h2 className="sep-title">🎮 퐁퐁 푸딩 미니게임 천국</h2>
        <p>성스러운 푸딩 미니게임을 즐기고 축복 점수를 받으세요!</p>
      </div>

      <div className="game-tabs-container">
        <button
          className={`game-tab-btn ${activeTab === 'catch' ? 'active' : ''}`}
          onClick={() => setActiveTab('catch')}
        >
          <i className="fa-solid fa-cookie-bite"></i> 1. 푸딩 캐치
        </button>
        <button
          className={`game-tab-btn ${activeTab === 'memory' ? 'active' : ''}`}
          onClick={() => setActiveTab('memory')}
        >
          <i className="fa-solid fa-clone"></i> 2. 짝맞추기
        </button>
        <button
          className={`game-tab-btn ${activeTab === 'smash' ? 'active' : ''}`}
          onClick={() => setActiveTab('smash')}
        >
          <i className="fa-solid fa-hand-fist"></i> 3. 악당 퇴치
        </button>
        <button
          className={`game-tab-btn ${activeTab === 'slot' ? 'active' : ''}`}
          onClick={() => setActiveTab('slot')}
        >
          <i className="fa-solid fa-dice"></i> 4. 럭키 슬롯
        </button>
        <button
          className={`game-tab-btn ${activeTab === 'bake' ? 'active' : ''}`}
          onClick={() => setActiveTab('bake')}
        >
          <i className="fa-solid fa-fire-burner"></i> 5. 푸딩 베이커리
        </button>
      </div>

      <div className="minigame-container">
        {/* Game 1: Catch */}
        {activeTab === 'catch' && (
          <div className="minigame-card">
            <div className="minigame-stats">
              <div><i className="fa-solid fa-trophy"></i> 점수: <strong>{catchScore}</strong>점</div>
              <div><i className="fa-solid fa-clock"></i> 시간: <strong>{catchTime}</strong>초</div>
            </div>
            <div className="minigame-canvas-area">
              {!isCatchPlaying && (
                <div className="game-overlay">
                  <i className="fa-solid fa-cookie-bite game-start-icon"></i>
                  <h3>푸딩 캐치 챌린지</h3>
                  <p>버튼을 눌러 좌우로 바구니를 움직이세요!</p>
                  <button className="btn btn-secondary" onClick={startCatchGame}>게임 시작</button>
                </div>
              )}
              <div className="basket" style={{ left: `${basketPos}%` }}>🥣</div>
            </div>
            <div className="minigame-controls">
              <button
                className="btn btn-secondary"
                onClick={() => setBasketPos((p) => Math.max(10, p - 15))}
              >
                ◀ 왼쪽
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => setBasketPos((p) => Math.min(90, p + 15))}
              >
                오른쪽 ▶
              </button>
            </div>
          </div>
        )}

        {/* Game 2: Memory Match */}
        {activeTab === 'memory' && (
          <div className="minigame-card">
            <div className="minigame-stats">
              <div>쌍: <strong>{matchedPairs}</strong> / 8</div>
              <div>시도: <strong>{memoryFlips}</strong>회</div>
            </div>
            <div className="memory-grid">
              {memoryCards.map((card, idx) => (
                <div
                  key={card.id}
                  className={`memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}`}
                  onClick={() => handleCardClick(idx)}
                >
                  {card.flipped || card.matched ? card.icon : '❓'}
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-block" style={{ marginTop: '15px' }} onClick={startMemoryGame}>
              🔄 다시 하기
            </button>
          </div>
        )}

        {/* Game 3: Putin Smash */}
        {activeTab === 'smash' && (
          <div className="minigame-card">
            <div className="minigame-stats">
              <div>점수: <strong>{smashScore}</strong>점</div>
              <div>시간: <strong>{smashTime}</strong>초</div>
            </div>
            <div className="smash-grid-container">
              {!isSmashPlaying && (
                <div className="smash-overlay">
                  <i className="fa-solid fa-hand-fist game-start-icon" style={{ color: '#e53935' }}></i>
                  <h3>악당 퐁퐁푸틴 퇴치전</h3>
                  <p>튀어나오는 악당(👿)을 터치하세요!</p>
                  <button className="btn btn-secondary" onClick={startSmashGame}>게임 시작</button>
                </div>
              )}
              <div className="smash-grid">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((idx) => (
                  <div key={idx} className="smash-hole" onClick={() => handleHoleClick(idx)}>
                    <div className={`smash-target ${activeHole === idx ? 'up' : ''}`}>
                      👿
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game 4: Slot Machine */}
        {activeTab === 'slot' && (
          <div className="minigame-card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--dark-brown)' }}>🎰 퐁퐁 럭키 슬롯머신</h3>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '15px', fontSize: '54px', margin: '20px 0' }}>
              <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '2px solid var(--gold)' }}>
                {reels[0]}
              </div>
              <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '2px solid var(--gold)' }}>
                {reels[1]}
              </div>
              <div style={{ background: 'var(--card-bg)', padding: '15px', borderRadius: '16px', border: '2px solid var(--gold)' }}>
                {reels[2]}
              </div>
            </div>
            <button className="btn btn-secondary btn-block" onClick={spinSlot} disabled={isSpinning}>
              {isSpinning ? '돌아가는 중...' : '🎰 슬롯 돌리기!'}
            </button>
          </div>
        )}

        {/* Game 5: Bakery Cooking */}
        {activeTab === 'bake' && (
          <div className="minigame-card" style={{ textAlign: 'center' }}>
            <h3 style={{ marginBottom: '15px', color: 'var(--dark-brown)' }}>👩‍🍳 퐁퐁 쿠킹 베이커리</h3>
            <p style={{ fontSize: '13px', color: 'var(--dark-brown-light)', marginBottom: '15px' }}>
              완성된 푸딩 총 개수: <strong>{bakedPuddings} 개</strong>
            </p>

            <div style={{ fontSize: '64px', margin: '15px 0' }}>
              {bakeStatus === 'ready' ? '🥣' : bakeStatus === 'baking' ? '🔥' : '🍮'}
            </div>

            <div className="shrine-progress-track" style={{ marginBottom: '20px' }}>
              <div className="shrine-progress-fill" style={{ width: `${bakeProgress}%` }}></div>
            </div>

            <button
              className="btn btn-secondary btn-block"
              onClick={startBaking}
              disabled={bakeStatus === 'baking'}
            >
              {bakeStatus === 'baking' ? '오븐에서 푸딩 굽는 중...' : '🔥 푸딩 베이킹 시작'}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
