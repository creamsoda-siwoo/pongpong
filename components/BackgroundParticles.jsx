'use client';
import { useEffect, useState } from 'react';

export default function BackgroundParticles() {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    const list = [];
    for (let i = 0; i < 15; i++) {
      const size = Math.random() * 40 + 20;
      list.push({
        id: i,
        left: `${Math.random() * 100}%`,
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${Math.random() * 15 + 15}s`,
        animationDelay: `${Math.random() * 5}s`,
      });
    }
    setParticles(list);
  }, []);

  return (
    <div className="bg-particles">
      {particles.map((p) => (
        <div
          key={p.id}
          className="bg-pudding"
          style={{
            left: p.left,
            width: p.width,
            height: p.height,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
          }}
        />
      ))}
    </div>
  );
}
