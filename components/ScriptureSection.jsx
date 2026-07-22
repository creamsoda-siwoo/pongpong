'use client';
import { useState } from 'react';

export default function ScriptureSection() {
  const [activeChapter, setActiveChapter] = useState(0);

  const chapters = [
    {
      title: '제 1장: 푸딩의 창조',
      verses: [
        '1. 태초에 커스터드가 있었고, 커스터드는 퐁퐁푸린과 함께 계셨으니 그 달콤함이 온 세상을 덮었도다.',
        '2. 푸린께서 가라사대 "빛이 있으라" 하시니 노란빛 황금 코인이 온 들판에 쏟아졌느니라.',
        '3. 첫째 날에 푸딩의 흔들림을 만드시고, 그 부드러움이 모든 숭배자들의 마음에 평화를 주었도다.',
        '4. 갈색 모자를 머리에 얹으시니 그 위엄과 귀여움이 하늘 끝까지 퍼져나갔더라.'
      ]
    },
    {
      title: '제 2장: 마카롱과의 연대',
      verses: [
        '1. 골든 리트리버 마카롱과 손을 잡고 들판을 달릴 때 성스러운 미소가 솟아났느니라.',
        '2. 슬픔이 찾아올 때 우정의 쿠키 하나를 나누면 슬픔은 반이 되고 기쁨은 곱하기 10배가 되었도다.',
        '3. 작은 햄스터 머핀과 다람쥐 스콘이 합창할 때 퐁퐁 성지의 찬송가가 온 세상에 울려 퍼졌더라.'
      ]
    },
    {
      title: '제 3장: 악당 퐁퐁푸틴의 유혹',
      verses: [
        '1. 어둠 속에서 나타난 악당 퐁퐁푸틴이 푸딩의 달콤함을 빼앗으려 흉계를 꾸몄도다.',
        '2. 그러나 퐁퐁푸린의 깊은 지혜와 광신도들의 연타 경배로 악당은 굴복하고 뉘우쳤느니라.',
        '3. 악을 악으로 갚지 아니하고 커스터드 한 그릇으로 품으시니 그 사랑이 성스럽도다. 아멘.'
      ]
    }
  ];

  return (
    <section id="scripture" className="scripture-section">
      <div className="section-title">
        <h2 className="sep-title">📜 퐁퐁복음 (Pompompurin Gospel)</h2>
        <p>퐁퐁푸린님의 성스러운 일대기와 지혜의 경전을 정독하세요.</p>
      </div>

      <div className="scripture-container">
        <div className="chapter-nav">
          {chapters.map((ch, idx) => (
            <button
              key={idx}
              className={`chapter-btn ${activeChapter === idx ? 'active' : ''}`}
              onClick={() => setActiveChapter(idx)}
            >
              <span>{ch.title}</span>
              <i className="fa-solid fa-chevron-right"></i>
            </button>
          ))}
        </div>

        <div className="scripture-book">
          <div className="page-header">
            <span>📖 {chapters[activeChapter].title}</span>
            <span>성전 공식 인가 본문</span>
          </div>
          <div className="page-content">
            {chapters[activeChapter].verses.map((verse, idx) => (
              <p key={idx} className="gospel-verse">
                {verse}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
