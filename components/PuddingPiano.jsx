'use client';
import { useState } from 'react';

export default function PuddingPiano({ showToast, isMuted }) {
  const [activeKey, setActiveKey] = useState(null);

  const notes = [
    { note: '도', freq: 261.63, key: '1', emoji: '🍮' },
    { note: '레', freq: 293.66, key: '2', emoji: '🍩' },
    { note: '미', freq: 329.63, key: '3', emoji: '🍨' },
    { note: '파', freq: 349.23, key: '4', emoji: '🎂' },
    { note: '솔', freq: 392.00, key: '5', emoji: '🍯' },
    { note: '라', freq: 440.00, key: '6', emoji: '🍪' },
    { note: '시', freq: 493.88, key: '7', emoji: '🍒' },
    { note: '높은 도', freq: 523.25, key: '8', emoji: '✨' },
  ];

  const playNote = (item) => {
    setActiveKey(item.note);
    setTimeout(() => setActiveKey(null), 200);

    if (isMuted) return;

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(item.freq, ctx.currentTime);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  return (
    <section id="piano" className="piano-section" style={{ padding: '60px 0' }}>
      <div className="section-title">
        <h2 className="sep-title">🎹 성스러운 푸딩 피아노</h2>
        <p>건반을 눌러 퐁퐁푸린 신상 앞에서 아름다운 연주를 올려보세요.</p>
      </div>

      <div className="piano-container">
        <div className="piano-keys-grid">
          {notes.map((item, idx) => (
            <div
              key={idx}
              className={`piano-key ${activeKey === item.note ? 'active' : ''}`}
              onClick={() => playNote(item)}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>{item.emoji}</div>
              <span>{item.note}</span>
              <small>({item.key})</small>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
