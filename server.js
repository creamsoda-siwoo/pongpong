const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'pompompurin-worship-secret-key-12345';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// --- Supabase 설정 및 Mock DB 지원 ---
let supabase = null;
let isMockDb = false;

const DB_FILE = path.join(__dirname, 'worship_persist.json');
const fs = require('fs');

// Mock DB 메모리 데이터스토어 (Supabase 미연동 시 사용)
const mockDb = {
  users: [], // { id, username, password_hash, worship_count, created_at }
  globalCount: 0,
  posts: [
    { id: 1, username: '퐁퐁단단장', content: '퐁퐁푸린님을 경배하라! 푸딩 수호대 모집 중!', image_data: null, created_at: new Date(Date.now() - 3600000).toISOString() },
    { id: 2, username: '푸딩마스터', content: '퐁퐁복음 1장을 읽고 깊은 감명을 받았습니다. 아멘.', image_data: null, created_at: new Date(Date.now() - 1800000).toISOString() }
  ]
};

// 로컬 DB 저장/로드 함수
function loadLocalDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const data = fs.readFileSync(DB_FILE, 'utf8');
      const parsed = JSON.parse(data);
      if (parsed) {
        if (parsed.users) mockDb.users = parsed.users;
        if (parsed.globalCount !== undefined) mockDb.globalCount = parsed.globalCount;
        if (parsed.posts) mockDb.posts = parsed.posts;
      }
    } catch (e) {
      console.error('로컬 백업 DB 로드 실패:', e);
    }
  }
}

function saveLocalDb() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(mockDb, null, 2), 'utf8');
  } catch (e) {
    console.error('로컬 백업 DB 저장 실패:', e);
  }
}

// 초기 로딩
loadLocalDb();

if (process.env.SUPABASE_URL && process.env.SUPABASE_KEY && 
    process.env.SUPABASE_URL.trim() !== '' && process.env.SUPABASE_KEY.trim() !== '' &&
    !process.env.SUPABASE_URL.includes('your_supabase')) {
  try {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('✅ Supabase 데이터베이스에 연결되었습니다.');
  } catch (error) {
    console.error('❌ Supabase 연결 실패, Mock DB 모드로 구동합니다:', error.message);
    isMockDb = true;
  }
} else {
  console.warn('⚠️ Supabase URL 또는 KEY가 설정되지 않았습니다. Mock DB 모드로 임시 작동합니다.');
  isMockDb = true;
}

// --- 인증 미들웨어 ---
const authenticateToken = async (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    req.user = null;
    return next();
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    
    // DB에서 최신 유저 정보 확인
    if (isMockDb) {
      const user = mockDb.users.find(u => (verified.id && u.id === verified.id) || u.username.toLowerCase() === (verified.username || '').toLowerCase());
      if (user) {
        req.user = { id: user.id, username: user.username };
      } else {
        req.user = null;
      }
    } else {
      let query;
      if (verified.id) {
        query = supabase.from('worship_users').select('id, username').eq('id', verified.id);
      } else {
        query = supabase.from('worship_users').select('id, username').ilike('username', verified.username);
      }
      const { data, error } = await query.maybeSingle();
      
      if (data && !error) {
        req.user = { id: data.id, username: data.username };
      } else if (verified.id && verified.username) {
        req.user = { id: verified.id, username: verified.username };
      } else {
        req.user = null;
      }
    }
  } catch (err) {
    req.user = null;
  }
  next();
};

// --- API 엔드포인트 ---

// 1. 회원가입
app.post('/api/auth/register', async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username ? username.trim() : '';

  if (!trimmedUsername || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
  }

  if (trimmedUsername.length < 2) {
    return res.status(400).json({ error: '사용자 이름은 2자 이상이어야 합니다.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    // 1. 로컬 mockDb 중복 체크
    mockDb.users = mockDb.users || [];
    const existsInMock = mockDb.users.some(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());

    if (existsInMock) {
      return res.status(400).json({ error: '이미 존재하는 사용자 이름입니다.' });
    }

    // 2. Supabase DB 연결 시 수파베이스 중복 체크
    if (!isMockDb && supabase) {
      try {
        const { data: existingUser } = await supabase
          .from('worship_users')
          .select('username')
          .ilike('username', trimmedUsername)
          .maybeSingle();

        if (existingUser) {
          return res.status(400).json({ error: '이미 존재하는 사용자 이름입니다.' });
        }
      } catch (sbErr) {}
    }

    // 3. 신규 유저 생성
    const newUserId = Math.random().toString(36).substring(2, 11);
    const newUser = {
      id: newUserId,
      username: trimmedUsername,
      password_hash: passwordHash,
      worship_count: 0,
      coins: 100,
      inventory: [],
      equipped_skin: 'default',
      created_at: new Date().toISOString()
    };

    // 4. 로컬 영구 DB 저장 보장 (Dual Persistence)
    mockDb.users.push(newUser);
    saveLocalDb();

    // 5. Supabase 테이블에 원격 저장 시도
    if (supabase) {
      try {
        const { error: sbInsertErr } = await supabase
          .from('worship_users')
          .insert([{
            id: newUserId,
            username: trimmedUsername,
            password_hash: passwordHash,
            worship_count: 0,
            coins: 100,
            inventory: [],
            equipped_skin: 'default'
          }]);
          
        if (sbInsertErr) {
          // 테이블에 일부 컬럼이 없는 경우 최소 필수 컬럼으로 재시도
          console.log('Supabase 필수 속성으로 가입 재시도:', sbInsertErr.message);
          await supabase
            .from('worship_users')
            .insert([{
              id: newUserId,
              username: trimmedUsername,
              password_hash: passwordHash,
              worship_count: 0
            }]);
        } else {
          console.log('✅ Supabase worship_users 테이블에 신규 계정이 성공적으로 추가되었습니다:', trimmedUsername);
        }
      } catch (sbInsertErr) {
        console.warn('Supabase 유저 저장 처리 경고:', sbInsertErr.message || sbInsertErr);
      }
    }

    // 6. JWT 쿠키 발급 및 자동 로그인
    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30일
    });

    return res.json({
      success: true,
      message: '회원가입 및 로그인이 완료되었습니다.',
      user: {
        id: newUser.id,
        username: newUser.username,
        worship_count: 0,
        coins: 100,
        inventory: [],
        equipped_skin: 'default'
      }
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 2. 로그인
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const trimmedUsername = username ? username.trim() : '';

  if (!trimmedUsername || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
  }

  try {
    let user = null;

    if (isMockDb) {
      user = mockDb.users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
    } else {
      try {
        const { data, error } = await supabase
          .from('worship_users')
          .select('*')
          .ilike('username', trimmedUsername)
          .maybeSingle();
        if (!error && data) user = data;
      } catch (sbErr) {}

      // Supabase 조회 실패 시 local mockDb Fallback 검색
      if (!user && mockDb && mockDb.users) {
        user = mockDb.users.find(u => u.username.toLowerCase() === trimmedUsername.toLowerCase());
      }
    }

    if (!user) {
      return res.status(400).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 발급 (id, username 포함)
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30일
    });

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        worship_count: user.worship_count || 0,
        coins: user.coins || 100,
        inventory: user.inventory || [],
        equipped_skin: user.equipped_skin || 'default'
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.', details: err.message || err });
  }
});

// 3. 로그아웃
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ success: true, message: '로그아웃 되었습니다.' });
});

// 4. 현재 로그인 사용자 정보 조회
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.json({ loggedIn: false });
  }

  try {
    let userDetails = null;

    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === req.user.id);
      if (user) userDetails = user;
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('*')
        .eq('id', req.user.id)
        .maybeSingle();
      if (data && !error) userDetails = data;
    }

    if (!userDetails) {
      res.clearCookie('token', { path: '/' });
      return res.json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: {
        id: userDetails.id,
        username: userDetails.username,
        worship_count: userDetails.worship_count || 0,
        coins: userDetails.coins || 100,
        inventory: userDetails.inventory || [],
        equipped_skin: userDetails.equipped_skin || 'default',
        last_attendance: userDetails.last_attendance || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: '오류가 발생했습니다.' });
  }
});

// 4-1. 퐁퐁 상점 구매 API
app.post('/api/shop/buy', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const { itemId, price } = req.body;
  const cost = parseInt(price) || 0;

  try {
    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === req.user.id);
      if (!user) return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });

      user.coins = user.coins || 100;
      if (user.coins < cost) {
        return res.status(400).json({ error: '퐁퐁코인이 부족합니다!' });
      }

      user.coins -= cost;
      user.inventory = user.inventory || [];
      if (!user.inventory.includes(itemId)) {
        user.inventory.push(itemId);
      }
      if (itemId.startsWith('skin_')) {
        user.equipped_skin = itemId;
      }
      saveLocalDb();

      return res.json({
        success: true,
        coins: user.coins,
        inventory: user.inventory,
        equipped_skin: user.equipped_skin
      });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', req.user.id).maybeSingle();
      const currentCoins = (user && user.coins !== null && user.coins !== undefined) ? parseInt(user.coins) : 100;
      
      if (currentCoins < cost) {
        return res.status(400).json({ error: '퐁퐁코인이 부족합니다!' });
      }

      const nextCoins = currentCoins - cost;
      let inventory = Array.isArray(user.inventory) ? user.inventory : [];
      if (!inventory.includes(itemId)) inventory.push(itemId);
      
      let equipped_skin = user.equipped_skin || 'default';
      if (itemId.startsWith('skin_')) equipped_skin = itemId;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, inventory, equipped_skin })
        .eq('id', req.user.id)
        .select()
        .maybeSingle();

      return res.json({
        success: true,
        coins: updated ? updated.coins : nextCoins,
        inventory: updated ? updated.inventory : inventory,
        equipped_skin: updated ? updated.equipped_skin : equipped_skin
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '상점 구매 처리 실패' });
  }
});

// 4-2. 럭키 가챠 뽑기 API
app.post('/api/gacha/roll', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const cost = 100;
  const gachaPool = [
    { name: '🍮 전설의 자이언트 커스터드', rarity: 'Legendary', icon: '🍮' },
    { name: '🍩 다이아몬드 도넛', rarity: 'Epic', icon: '🍩' },
    { name: '🍨 성스러운 빙수', rarity: 'Rare', icon: '🍨' },
    { name: '🎂 축복의 케이크', rarity: 'Rare', icon: '🎂' },
    { name: '🍯 마법의 꿀단지', rarity: 'Normal', icon: '🍯' },
    { name: '🍪 바삭쿠키', rarity: 'Normal', icon: '🍪' }
  ];

  const loot = gachaPool[Math.floor(Math.random() * gachaPool.length)];

  try {
    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === req.user.id);
      user.coins = user.coins || 100;
      if (user.coins < cost) {
        return res.status(400).json({ error: '퐁퐁코인이 부족합니다! (100 PPC 필요)' });
      }
      user.coins -= cost;
      user.inventory = user.inventory || [];
      user.inventory.push(loot.name);
      saveLocalDb();

      return res.json({ success: true, loot, coins: user.coins, inventory: user.inventory });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', req.user.id).maybeSingle();
      const currentCoins = (user && user.coins !== null) ? parseInt(user.coins) : 100;
      if (currentCoins < cost) {
        return res.status(400).json({ error: '퐁퐁코인이 부족합니다! (100 PPC 필요)' });
      }

      let inventory = Array.isArray(user.inventory) ? user.inventory : [];
      inventory.push(loot.name);
      const nextCoins = currentCoins - cost;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, inventory })
        .eq('id', req.user.id)
        .select()
        .maybeSingle();

      return res.json({ success: true, loot, coins: updated ? updated.coins : nextCoins, inventory: updated ? updated.inventory : inventory });
    }
  } catch (err) {
    res.status(500).json({ error: '가챠 뽑기 오류' });
  }
});

// 4-3. 일일 출석체크 API
app.post('/api/attendance/claim', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const today = new Date().toISOString().split('T')[0];

  try {
    if (isMockDb) {
      const user = mockDb.users.find(u => u.id === req.user.id);
      if (user.last_attendance === today) {
        return res.status(400).json({ error: '오늘 이미 출석체크 보상을 받으셨습니다!' });
      }
      user.last_attendance = today;
      user.coins = (user.coins || 100) + 150;
      user.worship_count = (user.worship_count || 0) + 30;
      saveLocalDb();

      return res.json({
        success: true,
        message: '출석 완료! +150 퐁퐁코인 & +30 숭배수 획득!',
        coins: user.coins,
        worship_count: user.worship_count,
        last_attendance: today
      });
    } else {
      const { data: user } = await supabase.from('worship_users').select('*').eq('id', req.user.id).maybeSingle();
      if (user && user.last_attendance === today) {
        return res.status(400).json({ error: '오늘 이미 출석체크 보상을 받으셨습니다!' });
      }

      const currentCoins = (user && user.coins !== null) ? parseInt(user.coins) : 100;
      const currentWorship = (user && user.worship_count !== null) ? parseInt(user.worship_count) : 0;
      const nextCoins = currentCoins + 150;
      const nextWorship = currentWorship + 30;

      const { data: updated } = await supabase
        .from('worship_users')
        .update({ coins: nextCoins, worship_count: nextWorship, last_attendance: today })
        .eq('id', req.user.id)
        .select()
        .maybeSingle();

      return res.json({
        success: true,
        message: '출석 완료! +150 퐁퐁코인 & +30 숭배수 획득!',
        coins: updated ? updated.coins : nextCoins,
        worship_count: updated ? updated.worship_count : nextWorship,
        last_attendance: today
      });
    }
  } catch (err) {
    res.status(500).json({ error: '출석체크 처리 오류' });
  }
});

// 5. 숭배하기 API (클릭 시 글로벌 카운터 + 로그인 유저의 숭배 카운터 증가)
app.post('/api/worship', authenticateToken, async (req, res) => {
  try {
    let globalCount = 0;
    let userCount = null;
    let userCoins = null;

    if (isMockDb) {
      // 1. 글로벌 숭배 카운트 증가
      mockDb.globalCount += 1;
      globalCount = mockDb.globalCount;

      // 2. 로그인 상태면 유저 숭배수 및 코인도 증가
      if (req.user) {
        const user = mockDb.users.find(u => u.id === req.user.id);
        if (user) {
          user.worship_count += 1;
          user.coins = (user.coins || 100) + 2;
          userCount = user.worship_count;
          userCoins = user.coins;
        }
      }
      saveLocalDb();
    } else {
      // Supabase: 글로벌 숭배 카운트 증가
      const { data: globalData, error: gError } = await supabase
        .rpc('increment_worship_global');

      if (gError) {
        const { data: selectG } = await supabase
          .from('worship_global')
          .select('count')
          .eq('id', 1)
          .maybeSingle();
        
        const currentGCount = (selectG && selectG.count !== null && selectG.count !== undefined) ? parseInt(selectG.count) : 0;
        const nextGCount = currentGCount + 1;
        
        const { data: updatedG } = await supabase
          .from('worship_global')
          .upsert({ id: 1, count: nextGCount })
          .select('count')
          .maybeSingle();
        
        globalCount = updatedG ? parseInt(updatedG.count) : nextGCount;
      } else {
        globalCount = parseInt(globalData);
      }

      // 로그인 상태면 유저 숭배수 및 코인 증가
      if (req.user) {
        const { data: uData, error: uError } = await supabase
          .rpc('increment_worship_user', { user_id: req.user.id });

        if (uError) {
          const { data: selectU } = await supabase
            .from('worship_users')
            .select('worship_count, coins')
            .eq('id', req.user.id)
            .maybeSingle();
          
          const currentUCount = (selectU && selectU.worship_count !== null && selectU.worship_count !== undefined) ? parseInt(selectU.worship_count) : 0;
          const currentCoins = (selectU && selectU.coins !== null && selectU.coins !== undefined) ? parseInt(selectU.coins) : 100;
          const nextUCount = currentUCount + 1;
          const nextCoins = currentCoins + 2;
          
          const { data: updatedU } = await supabase
            .from('worship_users')
            .update({ worship_count: nextUCount, coins: nextCoins })
            .eq('id', req.user.id)
            .select('worship_count, coins')
            .maybeSingle();
          
          userCount = updatedU ? parseInt(updatedU.worship_count) : nextUCount;
          userCoins = updatedU ? parseInt(updatedU.coins) : nextCoins;
        } else {
          userCount = parseInt(uData);
        }
      }
    }

    res.json({
      success: true,
      globalCount,
      userCount,
      userCoins
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '숭배 처리 중 오류가 발생했습니다.' });
  }
});

// 6. 누적 통계 조회
app.get('/api/worship/stats', authenticateToken, async (req, res) => {
  try {
    let globalCount = 0;
    let userCount = 0;

    if (isMockDb) {
      globalCount = mockDb.globalCount;
      if (req.user) {
        const user = mockDb.users.find(u => u.id === req.user.id);
        if (user) userCount = user.worship_count;
      }
    } else {
      const { data: gData } = await supabase.from('worship_global').select('count').eq('id', 1).maybeSingle();
      globalCount = (gData && gData.count !== null && gData.count !== undefined) ? parseInt(gData.count) : 0;

      if (req.user) {
        const { data: uData } = await supabase.from('worship_users').select('worship_count').eq('id', req.user.id).maybeSingle();
        userCount = (uData && uData.worship_count !== null && uData.worship_count !== undefined) ? parseInt(uData.worship_count) : 0;
      }
    }

    res.json({
      globalCount,
      userCount
    });
  } catch (err) {
    res.status(500).json({ error: '통계 조회 오류' });
  }
});

// 7. 명예의 전당 (Top 10 리더보드)
app.get('/api/worship/leaderboard', async (req, res) => {
  try {
    let list = [];
    if (isMockDb) {
      list = [...mockDb.users]
        .sort((a, b) => b.worship_count - a.worship_count)
        .slice(0, 10)
        .map(u => ({ id: u.id, username: u.username, worship_count: parseInt(u.worship_count) || 0 }));
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('id, username, worship_count')
        .order('worship_count', { ascending: false })
        .limit(10);
      if (!error && data) {
        list = data.map(u => ({ id: u.id, username: u.username, worship_count: parseInt(u.worship_count) || 0 }));
      }
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: '리더보드 조회 오류' });
  }
});

// 8. 게시판 목록 조회 (최근 50개)
app.get('/api/posts', async (req, res) => {
  try {
    let list = [];
    if (isMockDb) {
      list = [...mockDb.posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } else {
      const { data, error } = await supabase
        .from('worship_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (!error && data) list = data;
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: '방명록 조회 오류' });
  }
});

// 9. 게시판 글 쓰기
app.post('/api/posts', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '숭배자만 한마디를 남길 수 있습니다. 로그인해주세요.' });
  }

  const { content, image_data } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: '내용을 입력해주세요.' });
  }

  try {
    if (isMockDb) {
      const newPost = {
        id: Date.now(),
        username: req.user.username,
        content: content.trim(),
        image_data: image_data || null,
        created_at: new Date().toISOString()
      };
      mockDb.posts.unshift(newPost);
      saveLocalDb();
      return res.json({ success: true, post: newPost });
    } else {
      const { data, error } = await supabase
        .from('worship_posts')
        .insert([{ username: req.user.username, content: content.trim(), image_data: image_data || null }])
        .select()
        .single();
      if (error) throw error;
      return res.json({ success: true, post: data });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '방명록 작성 오류' });
  }
});

// 9-1. 게시판 글 삭제 API
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const postId = req.params.id;

  try {
    if (isMockDb) {
      const index = mockDb.posts.findIndex(p => String(p.id) === String(postId) && p.username === req.user.username);
      if (index === -1) {
        return res.status(403).json({ error: '본인의 게시글만 삭제할 수 있습니다.' });
      }
      mockDb.posts.splice(index, 1);
      saveLocalDb();
      return res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    } else {
      const { data: post, error: findErr } = await supabase
        .from('worship_posts')
        .select('*')
        .eq('id', postId)
        .maybeSingle();

      if (findErr || !post) {
        return res.status(404).json({ error: '게시글을 찾을 수 없습니다.' });
      }

      if (post.username !== req.user.username) {
        return res.status(403).json({ error: '본인의 게시글만 삭제할 수 있습니다.' });
      }

      const { error: delErr } = await supabase
        .from('worship_posts')
        .delete()
        .eq('id', postId);

      if (delErr) throw delErr;

      return res.json({ success: true, message: '게시글이 삭제되었습니다.' });
    }
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: '게시글 삭제 중 오류가 발생했습니다.' });
  }
});

// 9-2. 게시판 글 반응 API (좋아요/숭배 공감)
app.post('/api/posts/:id/react', async (req, res) => {
  const postId = req.params.id;
  try {
    if (isMockDb) {
      const post = mockDb.posts.find(p => String(p.id) === String(postId));
      if (!post) return res.status(404).json({ error: '게시글이 존재하지 않습니다.' });
      post.reactions = (post.reactions || 0) + 1;
      saveLocalDb();
      return res.json({ success: true, reactions: post.reactions });
    } else {
      const { data: post } = await supabase.from('worship_posts').select('reactions').eq('id', postId).maybeSingle();
      const current = (post && post.reactions) ? parseInt(post.reactions) : 0;
      const { data: updated } = await supabase.from('worship_posts').update({ reactions: current + 1 }).eq('id', postId).select('reactions').maybeSingle();
      return res.json({ success: true, reactions: updated ? parseInt(updated.reactions) : current + 1 });
    }
  } catch (err) {
    res.status(500).json({ error: '반응 처리 오류' });
  }
});

// 10. 오늘의 신탁 API
app.get('/api/oracle', (req, res) => {
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
  const score = Math.floor(Math.random() * 21) + 80; // Pompompurin's social score is around 84, so 80-100 is great

  res.json({
    oracle: randomOracle,
    luckyPudding: randomPudding,
    purityScore: score
  });
});

// 11. 액자 갤러리 목록 조회 API
app.get('/api/frames', async (req, res) => {
  try {
    let list = [];
    if (!isMockDb) {
      try {
        const { data, error } = await supabase
          .from('worship_frames')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);
        if (!error && data) list = data;
        else throw error;
      } catch (e) {
        mockDb.frames = mockDb.frames || [];
        list = [...mockDb.frames].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      }
    } else {
      mockDb.frames = mockDb.frames || [];
      list = [...mockDb.frames].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: '액자 갤러리 조회 오류' });
  }
});

// 12. 액자 사진 업로드 API
app.post('/api/frames', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const { title, image_data, frame_style } = req.body;
  if (!image_data) {
    return res.status(400).json({ error: '이미지를 첨부해 주세요.' });
  }

  const newTitle = title && title.trim() !== '' ? title.trim() : '성스러운 퐁퐁 사진';
  const style = frame_style || 'frame-gold';
  const newFrame = {
    id: Date.now(),
    username: req.user.username,
    title: newTitle,
    image_data,
    frame_style: style,
    reactions: 0,
    created_at: new Date().toISOString()
  };

  try {
    if (!isMockDb) {
      try {
        const { data, error } = await supabase
          .from('worship_frames')
          .insert([{ username: req.user.username, title: newTitle, image_data, frame_style: style, reactions: 0 }])
          .select()
          .single();
        if (!error && data) {
          return res.json({ success: true, frame: data });
        }
      } catch (e) {
        // Fallback to local storage if Supabase table worship_frames does not exist
      }
    }

    mockDb.frames = mockDb.frames || [];
    mockDb.frames.unshift(newFrame);
    saveLocalDb();
    return res.json({ success: true, frame: newFrame });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '액자 게시 중 오류 발생' });
  }
});

// 13. 액자 공감 API
app.post('/api/frames/:id/react', async (req, res) => {
  const frameId = req.params.id;
  try {
    if (!isMockDb) {
      try {
        const { data: frame } = await supabase.from('worship_frames').select('reactions').eq('id', frameId).maybeSingle();
        const current = (frame && frame.reactions) ? parseInt(frame.reactions) : 0;
        const { data: updated } = await supabase.from('worship_frames').update({ reactions: current + 1 }).eq('id', frameId).select('reactions').maybeSingle();
        if (updated) return res.json({ success: true, reactions: parseInt(updated.reactions) });
      } catch (e) {}
    }

    mockDb.frames = mockDb.frames || [];
    const frame = mockDb.frames.find(f => String(f.id) === String(frameId));
    if (!frame) return res.status(404).json({ error: '액자를 찾을 수 없습니다.' });
    frame.reactions = (frame.reactions || 0) + 1;
    saveLocalDb();
    return res.json({ success: true, reactions: frame.reactions });
  } catch (err) {
    res.status(500).json({ error: '공감 오류' });
  }
});

// 14. 액자 삭제 API
app.delete('/api/frames/:id', authenticateToken, async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }

  const frameId = req.params.id;

  try {
    if (!isMockDb) {
      try {
        const { data: frame } = await supabase.from('worship_frames').select('*').eq('id', frameId).maybeSingle();
        if (frame) {
          if (frame.username !== req.user.username) return res.status(403).json({ error: '본인의 액자만 삭제할 수 있습니다.' });
          await supabase.from('worship_frames').delete().eq('id', frameId);
          return res.json({ success: true, message: '액자가 삭제되었습니다.' });
        }
      } catch (e) {}
    }

    mockDb.frames = mockDb.frames || [];
    const idx = mockDb.frames.findIndex(f => String(f.id) === String(frameId) && f.username === req.user.username);
    if (idx === -1) return res.status(403).json({ error: '본인의 액자만 삭제할 수 있습니다.' });
    mockDb.frames.splice(idx, 1);
    saveLocalDb();
    return res.json({ success: true, message: '액자가 삭제되었습니다.' });
  } catch (err) {
    res.status(500).json({ error: '액자 삭제 오류' });
  }
});

// 파비콘 라우트
app.get('/favicon.ico', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pompompurin.png'));
});

// 메인 페이지 라우트 백업
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✨ 퐁퐁푸린 숭배 서버가 포트 ${PORT}에서 실행 중입니다!`);
  if (isMockDb) {
    console.log('💡 Supabase 연동 전이므로 로컬 테스트용 Mock DB가 실행됩니다. 데이터는 서버 재부팅 시 초기화됩니다.');
  }
});
