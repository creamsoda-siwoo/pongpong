'use client';
import { useState, useEffect } from 'react';

export default function LeaderboardSection({ user }) {
  const [leaderboard, setLeaderboard] = useState([]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/worship/leaderboard');
      const data = await res.json();
      if (Array.isArray(data)) setLeaderboard(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  return (
    <section id="leaderboard" className="leaderboard-section">
      <div className="section-title">
        <h2 className="sep-title">👑 명예의 전당 (Top 10)</h2>
        <p>온 세상 퐁퐁푸린 최고 숭배자 랭킹 명단입니다.</p>
      </div>

      <div className="leaderboard-container">
        <div className="rank-list">
          {leaderboard.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>랭킹 정보를 불러오는 중입니다...</p>
          ) : (
            leaderboard.map((item, idx) => {
              const isMyRank = user && user.username === item.username;
              return (
                <div key={item.id || idx} className={`rank-item ${isMyRank ? 'my-rank' : ''}`}>
                  <div className="rank-left">
                    <span className="rank-num" style={{ background: idx < 3 ? 'var(--primary-yellow)' : 'rgba(0,0,0,0.06)' }}>
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <span style={{ fontWeight: '800', color: 'var(--dark-brown)' }}>
                      {item.username} {isMyRank && '(나)'}
                    </span>
                  </div>
                  <div style={{ fontWeight: '800', color: 'var(--gold)' }}>
                    🙏 {item.worship_count.toLocaleString()} 회 숭배
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
