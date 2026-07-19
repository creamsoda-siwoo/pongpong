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
      const user = mockDb.users.find(u => u.username === verified.username);
      if (user) {
        req.user = { id: user.id, username: user.username };
      } else {
        req.user = null;
      }
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('id, username')
        .eq('username', verified.username)
        .single();
      
      if (data && !error) {
        req.user = { id: data.id, username: data.username };
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
  if (!username || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (isMockDb) {
      const exists = mockDb.users.some(u => u.username === username);
      if (exists) {
        return res.status(400).json({ error: '이미 존재하는 사용자 이름입니다.' });
      }

      const newUser = {
        id: Math.random().toString(36).substring(2, 11),
        username,
        password_hash: passwordHash,
        worship_count: 0,
        created_at: new Date().toISOString()
      };
      mockDb.users.push(newUser);
      saveLocalDb();
      return res.json({ success: true, message: '회원가입이 완료되었습니다. (Mock DB)' });
    } else {
      // Supabase 중복 체크 및 가입
      const { data: existingUser } = await supabase
        .from('worship_users')
        .select('username')
        .eq('username', username)
        .maybeSingle();

      if (existingUser) {
        return res.status(400).json({ error: '이미 존재하는 사용자 이름입니다.' });
      }

      const { error } = await supabase
        .from('worship_users')
        .insert([{ username, password_hash: passwordHash, worship_count: 0 }]);

      if (error) throw error;
      return res.json({ success: true, message: '회원가입이 완료되었습니다.' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '회원가입 중 오류가 발생했습니다.' });
  }
});

// 2. 로그인
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: '사용자 이름과 비밀번호를 입력해주세요.' });
  }

  try {
    let user = null;

    if (isMockDb) {
      user = mockDb.users.find(u => u.username === username);
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('*')
        .eq('username', username)
        .maybeSingle();
      if (!error) user = data;
    }

    if (!user) {
      return res.status(400).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(400).json({ error: '사용자 이름 또는 비밀번호가 올바르지 않습니다.' });
    }

    // JWT 발급
    const token = jwt.sign({ username: user.username }, JWT_SECRET, { expiresIn: '30d' });
    res.cookie('token', token, {
      httpOnly: true,
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30일
    });

    res.json({
      success: true,
      user: {
        username: user.username,
        worship_count: user.worship_count
      }
    });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: '로그인 중 오류가 발생했습니다.', details: err.message || err });
  }
});

// 3. 로그아웃
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
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
      if (user) userDetails = { username: user.username, worship_count: user.worship_count };
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('username, worship_count')
        .eq('id', req.user.id)
        .single();
      if (data && !error) userDetails = data;
    }

    if (!userDetails) {
      res.clearCookie('token');
      return res.json({ loggedIn: false });
    }

    res.json({
      loggedIn: true,
      user: userDetails
    });
  } catch (err) {
    res.status(500).json({ error: '오류가 발생했습니다.' });
  }
});

// 5. 숭배하기 API (클릭 시 글로벌 카운터 + 로그인 유저의 숭배 카운터 증가)
app.post('/api/worship', authenticateToken, async (req, res) => {
  try {
    let globalCount = 0;
    let userCount = null;

    if (isMockDb) {
      // 1. 글로벌 숭배 카운트 증가
      mockDb.globalCount += 1;
      globalCount = mockDb.globalCount;

      // 2. 로그인 상태면 유저 숭배수도 증가
      if (req.user) {
        const user = mockDb.users.find(u => u.id === req.user.id);
        if (user) {
          user.worship_count += 1;
          userCount = user.worship_count;
        }
      }
      saveLocalDb();
    } else {
      // Supabase: 글로벌 숭배 카운트 증가
      const { data: globalData, error: gError } = await supabase
        .rpc('increment_worship_global');

      if (gError) {
        // RPC가 없거나 오류일 경우 upsert로 강제 증가 처리
        const { data: selectG, error: sGError } = await supabase
          .from('worship_global')
          .select('count')
          .eq('id', 1)
          .maybeSingle();
        
        if (sGError) console.error("Error selectG:", sGError);
        const currentGCount = (selectG && selectG.count) ? parseInt(selectG.count) : 0;
        
        const { data: updatedG, error: upGError } = await supabase
          .from('worship_global')
          .upsert({ id: 1, count: currentGCount + 1 })
          .select('count')
          .single();
        
        if (upGError) console.error("Error upserting global count:", upGError);
        globalCount = updatedG ? updatedG.count : currentGCount + 1;
      } else {
        globalCount = globalData;
      }

      // 로그인 상태면 유저 숭배수 증가
      if (req.user) {
        const { data: uData, error: uError } = await supabase
          .rpc('increment_worship_user', { user_id: req.user.id });

        if (uError) {
          console.warn("RPC increment_worship_user failed, falling back to select & update:", uError.message || uError);
          const { data: selectU, error: sUError } = await supabase
            .from('worship_users')
            .select('worship_count')
            .eq('id', req.user.id)
            .maybeSingle();
          
          if (sUError) console.error("Error selectU:", sUError);
          const currentUCount = (selectU && selectU.worship_count) ? parseInt(selectU.worship_count) : 0;
          
          const { data: updatedU, error: uUError } = await supabase
            .from('worship_users')
            .update({ worship_count: currentUCount + 1 })
            .eq('id', req.user.id)
            .select('worship_count')
            .single();
          
          if (uUError) console.error("Error updatedU:", uUError);
          if (updatedU) {
            userCount = updatedU.worship_count;
          }
        } else {
          userCount = uData;
        }
      }
    }

    res.json({
      success: true,
      globalCount,
      userCount
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
      globalCount = (gData && gData.count !== null) ? gData.count : 0;

      if (req.user) {
        const { data: uData } = await supabase.from('worship_users').select('worship_count').eq('id', req.user.id).maybeSingle();
        userCount = (uData && uData.worship_count !== null) ? uData.worship_count : 0;
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
        .map(u => ({ username: u.username, worship_count: u.worship_count }));
    } else {
      const { data, error } = await supabase
        .from('worship_users')
        .select('username, worship_count')
        .order('worship_count', { ascending: false })
        .limit(10);
      if (!error && data) list = data;
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
        id: mockDb.posts.length + 1,
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
