import { NextResponse } from 'next/server';

const ipRequestCounts = new Map();

// Clear request history every 60 seconds
if (!global.__rateLimitInterval) {
  global.__rateLimitInterval = setInterval(() => {
    ipRequestCounts.clear();
  }, 60000);
}

export function checkRateLimit(req, maxRequestsPerMin = 200) {
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '127.0.0.1';
  const currentCount = (ipRequestCounts.get(ip) || 0) + 1;
  ipRequestCounts.set(ip, currentCount);

  if (currentCount > maxRequestsPerMin) {
    return NextResponse.json(
      { error: '요청 트래픽이 급증하여 일시 제어 중입니다. 잠시 후 다시 시도해주세요.' },
      { status: 429 }
    );
  }
  return null;
}
