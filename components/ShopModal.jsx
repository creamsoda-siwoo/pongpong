'use client';
import { useState } from 'react';

export default function ShopModal({ isOpen, user, setUser, onClose, showToast }) {
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const skins = [
    { id: 'skin_gold', name: '👑 황금 퐁퐁푸린', price: 300, preview: '✨🍮✨', desc: '황금 오라와 반짝이는 광채 효과' },
    { id: 'skin_angel', name: '👼 천사 퐁퐁푸린', price: 500, preview: '🪽🍮🪽', desc: '성스러운 천사 날개와 오라' },
    { id: 'skin_king', name: '🤴 국왕 퐁퐁푸린', price: 1000, preview: '👑🍮👑', desc: '왕관을 쓴 존엄한 제국의 왕' },
    { id: 'skin_devil', name: '👿 데빌 퐁퐁푸린', price: 700, preview: '😈🍮😈', desc: '반전 매력의 붉은 불꽃 아이콘' },
    { id: 'skin_rainbow', name: '🌈 사이버 무지개', price: 1500, preview: '🌈🍮⚡', desc: '레인보우 그라데이션 광속 파티클' },
  ];

  const handleBuy = async (skin) => {
    if (!user) {
      showToast('⚠️ 로그인 후 이용해 주세요!');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/shop/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: skin.id, price: skin.price }),
      });
      const data = await res.json();

      if (data.success) {
        showToast(`🎉 ${skin.name} 스킨을 구매 및 장착했습니다!`);
        setUser((prev) => ({
          ...prev,
          coins: data.coins,
          inventory: data.inventory,
          equipped_skin: data.equipped_skin,
        }));
      } else {
        showToast(`❌ ${data.error}`);
      }
    } catch (e) {
      showToast('❌ 구매 오류');
    } finally {
      setLoading(false);
    }
  };

  const handleClaimAttendance = async () => {
    if (!user) {
      showToast('⚠️ 로그인 후 이용해 주세요!');
      return;
    }
    try {
      const res = await fetch('/api/attendance/claim', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast(`🎁 ${data.message}`);
        setUser((prev) => ({
          ...prev,
          coins: data.coins,
          worship_count: data.worship_count,
          last_attendance: data.last_attendance,
        }));
      } else {
        showToast(`⚠️ ${data.error}`);
      }
    } catch (e) {
      showToast('❌ 출석체크 오류');
    }
  };

  return (
    <div className="modal show">
      <div className="modal-content modal-lg">
        <span className="close-btn" onClick={onClose}>&times;</span>
        <h2>🏪 퐁퐁 상점 & 일일 보너스</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '20px 0', background: 'var(--glass-bg)', padding: '15px 20px', borderRadius: '16px' }}>
          <div>
            <span>내 보유 코인: <strong style={{ color: 'var(--gold)', fontSize: '20px' }}>💰 {user ? user.coins : 0} PPC</strong></span>
          </div>
          <button className="btn btn-secondary" onClick={handleClaimAttendance}>
            🎁 일일 출석체크 보상 받기 (+150 PPC)
          </button>
        </div>

        <h3>✨ 스킨 및 칭호 상점</h3>
        <div className="shop-items-grid">
          {skins.map((skin) => {
            const isOwned = user && Array.isArray(user.inventory) && user.inventory.includes(skin.id);
            const isEquipped = user && user.equipped_skin === skin.id;

            return (
              <div key={skin.id} className="shop-item-card">
                <div className="shop-item-preview">{skin.preview}</div>
                <h4>{skin.name}</h4>
                <p>{skin.desc}</p>
                <div className="shop-price">{skin.price} PPC</div>

                {isEquipped ? (
                  <button className="btn btn-block" disabled style={{ background: '#4CAF50', color: '#FFF' }}>
                    착용 중 ✓
                  </button>
                ) : isOwned ? (
                  <button className="btn btn-primary btn-block" onClick={() => handleBuy(skin)}>
                    스킨 착용하기
                  </button>
                ) : (
                  <button
                    className="btn btn-secondary btn-block"
                    onClick={() => handleBuy(skin)}
                    disabled={loading || (user && user.coins < skin.price)}
                  >
                    구매하기
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
