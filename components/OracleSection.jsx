'use client';
import { useState } from 'react';

export default function OracleSection() {
  const [oracle, setOracle] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchOracle = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/oracle');
      const data = await res.json();
      setOracle(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="oracle" className="oracle-section">
      <div className="section-title">
        <h2 className="sep-title">✨ 오늘의 푸린 신탁 (Oracle)</h2>
        <p>오늘 나를 기다리는 행운과 퐁퐁푸린님의 일일 신성한 계시를 확인하세요.</p>
      </div>

      <div className="oracle-container">
        <div className="oracle-card">
          <div className="oracle-ball">🔮</div>
          <h3>오늘의 신성 계시</h3>

          {oracle ? (
            <div>
              <p className="oracle-text">"{oracle.oracle}"</p>
              <div style={{ margin: '15px 0', fontSize: '15px', color: 'var(--dark-brown)' }}>
                <span>🍮 오늘의 행운 푸딩: <strong>{oracle.luckyPudding}</strong></span>
                <br />
                <span>✨ 신성도 점수: <strong>{oracle.purityScore}점 / 100점</strong></span>
              </div>
            </div>
          ) : (
            <p className="oracle-text">버튼을 눌러 신성한 신탁 구슬을 밝혀보세요.</p>
          )}

          <button className="btn btn-secondary" onClick={fetchOracle} disabled={loading}>
            {loading ? '신탁을 청하는 중...' : '✨ 오늘의 신탁 받기'}
          </button>
        </div>
      </div>
    </section>
  );
}
