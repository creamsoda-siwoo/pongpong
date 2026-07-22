'use client';
import { useState } from 'react';

export default function TarotSection() {
  const [selectedCards, setSelectedCards] = useState([]);
  const [reading, setReading] = useState(null);

  const tarotDeck = [
    { title: 'Ⅰ. 성스러운 커스터드', icon: '🍮', advice: '당신의 순수한 열정과 창의력이 결실을 맺을 것입니다. 달콤함이 당신의 날을 밝혀줍니다.' },
    { title: 'Ⅱ. 든든한 모자', icon: '🧢', advice: '퐁퐁푸린의 트레이드마크 모자처럼 명예와 지혜가 당신의 머리 위에 깃듭니다.' },
    { title: 'Ⅲ. 나눔의 쿠키', icon: '🍪', advice: '주변 사람들에게 미소와 따뜻한 마음을 나누면 2배의 축복으로 되돌아옵니다.' },
    { title: 'Ⅳ. 평화의 꿀단지', icon: '🍯', advice: '서두르지 말고 여유롭게 쉬어가는 자세가 최상의 결과를 만들어 냅니다.' },
    { title: 'Ⅴ. 승리의 푸딩 타워', icon: '🎂', advice: '꾸준히 쌓아온 노력이 비로소 높이 빛을 발하는 순간이 옵니다.' },
    { title: 'Ⅵ. 우정의 마카롱', icon: '🐶', advice: '마카롱과 푸린이처럼 소중한 친구와의 연대가 당신을 든든하게 지켜줍니다.' },
  ];

  const handleSelectCard = (idx) => {
    if (selectedCards.includes(idx)) return;
    if (selectedCards.length >= 3) return;

    const next = [...selectedCards, idx];
    setSelectedCards(next);

    if (next.length === 3) {
      setReading([tarotDeck[next[0]], tarotDeck[next[1]], tarotDeck[next[2]]]);
    }
  };

  const resetReading = () => {
    setSelectedCards([]);
    setReading(null);
  };

  return (
    <section id="tarot" className="tarot-section">
      <div className="section-title">
        <h2 className="sep-title">🔮 성스러운 퐁퐁 타로 점괘</h2>
        <p>3장의 카드를 선택하여 오늘의 운세와 신성한 지혜의 조언을 받아보세요.</p>
      </div>

      <div className="tarot-container">
        <p className="tarot-hint">
          {selectedCards.length < 3
            ? `신성한 퐁퐁 타로 카드 3장을 선택하세요 (${selectedCards.length}/3)`
            : '✨ 점괘 완독 완료! 아래의 해석을 읽어보세요.'}
        </p>

        <div className="tarot-cards-grid">
          {tarotDeck.map((card, idx) => (
            <div
              key={idx}
              className={`tarot-card-item ${selectedCards.includes(idx) ? 'selected' : ''}`}
              onClick={() => handleSelectCard(idx)}
            >
              {selectedCards.includes(idx) ? card.icon : '🔮'}
            </div>
          ))}
        </div>

        {reading && (
          <div className="tarot-reading-result">
            <h3>✨ 오늘의 퐁퐁 삼위일체 타로 조언</h3>
            <div className="tarot-result-cards">
              {reading.map((item, idx) => (
                <div key={idx} className="tarot-result-card">
                  <h4>{item.title}</h4>
                  <div className="card-icon">{item.icon}</div>
                  <p className="tarot-advice">{item.advice}</p>
                </div>
              ))}
            </div>
            <button className="btn btn-secondary" onClick={resetReading} style={{ marginTop: '15px' }}>
              🔄 다시 타로 뽑기
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
