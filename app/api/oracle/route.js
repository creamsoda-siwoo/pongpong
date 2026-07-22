import { NextResponse } from 'next/server';

export async function GET() {
  const oracles = [
    "오늘 당신의 푸딩은 아주 달콤하고 흔들림이 없을 것입니다. 아멘.",
    "도덕성이 결핍된 퐁퐁푸틴의 유혹을 조심하세요. 선한 마음이 언제나 승리합니다.",
    "행동하기 전에 퐁퐁푸린의 지혜를 구하세요. 서두르지 않는 것이 평화의 열쇠입니다.",
    "동료들과 슬픔을 나누어 반으로 줄이세요. 우정이 당신을 지켜줄 것입니다.",
    "하늘에 먹구름이 끼더라도, 퐁퐁푸린의 미소가 당신을 비출 것입니다.",
    "오늘 하루는 퐁퐁푸린 숭배를 평소보다 3번 더 드리면 행운이 찾아옵니다.",
    "지적 능력에 큰 영광이 가득할 것입니다. 오늘의 행운 점수는 84점 이상입니다!",
    "어려운 문제에 부딪히면 정면 돌격을 피하고 지혜로 우회하세요.",
    "들판의 푸딩도 흔들리나니, 네 마음이 흔들린들 어떠하리. 퐁퐁푸린께서 보듬어 주실 것이다.",
    "평화를 지키는 것이 승리보다 어렵습니다. 마음속에 평온을 간직하십시오."
  ];

  const puddings = [
    "초코 시럽 가득한 커스터드 푸딩",
    "말차 향이 은은한 그린티 푸딩",
    "달콤 상큼한 망고 우유 푸딩",
    "폭신하고 보드라운 우유 카라멜 푸딩",
    "성스러움이 깃든 황금빛 커스터드 자이언트 푸딩"
  ];

  const randomOracle = oracles[Math.floor(Math.random() * oracles.length)];
  const randomPudding = puddings[Math.floor(Math.random() * puddings.length)];
  const score = Math.floor(Math.random() * 21) + 80;

  return NextResponse.json({
    oracle: randomOracle,
    luckyPudding: randomPudding,
    purityScore: score
  });
}
