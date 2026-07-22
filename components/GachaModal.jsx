'use client';
import { useState } from 'react';

export default function GachaModal({ isOpen, user, setUser, onClose, showToast }) {
  const [isOpening, setIsOpening] = useState(false);
  const [loot, setLoot] = useState(null);

  if (!isOpen) return null;

  const handleRoll = async () => {
    if (!user) {
      showToast('⚠️ 로그인 후 이용해 주세요!');
      return;
    }
    if (user.coins < 100) {
      showToast('⚠️ 퐁퐁코인이 부족합니다! (100 PPC 필요)');
      return;
    }

    setIsOpening(true);
    setLoot(null);

    setTimeout(async () => {
      try {
        const res = await fetch('/api/gacha/roll', { method: 'POST' });
        const data = await res.json();
        if (data.success) {
          setLoot(data.loot);
          setUser((prev) => ({
            ...prev,
            coins: data.coins,
            inventory: data.inventory,
          }));
          showToast(`✨ ${data.loot.name} 획득!`);
        } else {
          showToast(`❌ ${data.error}`);
        }
      } catch (e) {
        showToast('❌ 가챠 오류');
      } finally {
        setIsOpening(false);
      }
    }, 1500);
  };

  return (
    <div className="modal show">
      <div className="modal-content" style={{ textAlign: 'center' }}>
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>🎁 성스러운 디저트 럭키 가챠</h2>
        <p style={{ fontSize: '13px', color: 'var(--dark-brown-light)', margin: '8px 0' }}>
          100 PPC로 최고급 한정 디저트 보물을 뽑아보세요!
        </p>

        <div className="gacha-box-area">
          <div
            className="gacha-box-icon"
            style={{
              transform: isOpening ? 'scale(1.3) rotate(20deg)' : 'scale(1)',
              transition: 'transform 0.3s ease-in-out',
            }}
          >
            🎁
          </div>

          <button
            className="btn btn-secondary btn-block"
            onClick={handleRoll}
            disabled={isOpening || (user && user.coins < 100)}
          >
            {isOpening ? '상자 여는 중...' : '🎁 가챠 뽑기 (100 PPC)'}
          </button>
        </div>

        {loot && (
          <div className="gacha-result-area">
            <h3 style={{ color: 'var(--gold)' }}>🎉 축하합니다! 🎉</h3>
            <div style={{ fontSize: '48px', margin: '10px 0' }}>{loot.icon}</div>
            <h4 style={{ fontSize: '18px', color: 'var(--dark-brown)' }}>{loot.name}</h4>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#4CAF50' }}>
              등급: [{loot.rarity}]
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
