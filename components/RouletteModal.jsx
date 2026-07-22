'use client';
import { useState } from 'react';

export default function RouletteModal({ isOpen, user, setUser, onClose, showToast }) {
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [prize, setPrize] = useState(null);

  if (!isOpen) return null;

  const prizes = [
    { label: '+50 PPC', coins: 50 },
    { label: '+100 PPC', coins: 100 },
    { label: '꽝', coins: 0 },
    { label: '+200 PPC', coins: 200 },
    { label: '+30 PPC', coins: 30 },
    { label: '💎 777 PPC', coins: 777 },
    { label: '+80 PPC', coins: 80 },
    { label: '+500 PPC', coins: 500 },
  ];

  const spinWheel = () => {
    if (isSpinning) return;
    setIsSpinning(true);
    setPrize(null);

    const randomIndex = Math.floor(Math.random() * prizes.length);
    const degreesPerSector = 360 / prizes.length;
    const targetDegree = 360 * 5 + (prizes.length - randomIndex) * degreesPerSector - degreesPerSector / 2;

    const newRotation = rotation + targetDegree;
    setRotation(newRotation);

    setTimeout(() => {
      setIsSpinning(false);
      const won = prizes[randomIndex];
      setPrize(won.label);

      if (won.coins > 0 && user) {
        setUser((prev) => ({
          ...prev,
          coins: (prev.coins || 0) + won.coins,
        }));
        showToast(`🎉 룰렛 결과: ${won.label} 획득!`);
      } else {
        showToast(`룰렛 결과: ${won.label}`);
      }
    }, 4000);
  };

  return (
    <div className="modal show">
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>🎡 퐁퐁 럭키 룰렛</h2>
        <p style={{ fontSize: '13px', color: 'var(--dark-brown-light)', marginBottom: '15px' }}>
          매일 행운의 룰렛을 돌려 황금 코인 보너스를 받으세요!
        </p>

        <div className="roulette-container">
          <div className="roulette-wheel-wrapper">
            <div className="roulette-pointer">▼</div>
            <div
              className="roulette-wheel"
              style={{ transform: `rotate(${rotation}deg)` }}
            >
              {prizes.map((p, idx) => (
                <div key={idx} className="wheel-sector" style={{ '--i': idx }}>
                  <span>{p.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="roulette-result-text">
            {prize ? `✨ 당첨: ${prize}` : '룰렛 버튼을 눌러 돌려보세요!'}
          </div>

          <button
            className="btn btn-primary btn-block"
            style={{ marginTop: '15px' }}
            onClick={spinWheel}
            disabled={isSpinning}
          >
            {isSpinning ? '돌아가는 중...' : '🎡 룰렛 돌리기!'}
          </button>
        </div>
      </div>
    </div>
  );
}
