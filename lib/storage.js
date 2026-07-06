// 持久化存储层 — 使用 Neon Postgres（永久保存）
//
// 数据表：
//   clicks   —  (case_id TEXT PRIMARY KEY, count INT, last_clicked_at TIMESTAMPTZ)
//   keywords —  (word TEXT PRIMARY KEY, count INT)
//   feedback —  (id SERIAL, data JSONB, created_at TIMESTAMPTZ DEFAULT NOW())
//   searches —  (id SERIAL, user_id TEXT, query TEXT, result_count INT, created_at TIMESTAMPTZ DEFAULT NOW())
//   ai_gen   —  (id SERIAL, user_id TEXT, case_ids TEXT, mode TEXT, result_text TEXT, query TEXT, created_at TIMESTAMPTZ DEFAULT NOW())

const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

// ============ 建表（幂等） ============
let _initDone = false;
async function _init() {
  if (_initDone) return;
  // clicks 表：先尝试加 last_clicked_at 列（已存在则跳过）
  await sql`CREATE TABLE IF NOT EXISTS clicks (case_id TEXT PRIMARY KEY, count INT DEFAULT 1)`;
  try {
    await sql`ALTER TABLE clicks ADD COLUMN last_clicked_at TIMESTAMPTZ DEFAULT NOW()`;
  } catch(e) {
    // 列已存在会报错，忽略
  }
  await sql`CREATE TABLE IF NOT EXISTS keywords (word TEXT PRIMARY KEY, count INT DEFAULT 1)`;
  await sql`CREATE TABLE IF NOT EXISTS feedback (id SERIAL PRIMARY KEY, data JSONB, created_at TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS searches (id SERIAL PRIMARY KEY, user_id TEXT, query TEXT, result_count INT, created_at TIMESTAMPTZ DEFAULT NOW())`;
  await sql`CREATE TABLE IF NOT EXISTS ai_gen (id SERIAL PRIMARY KEY, user_id TEXT, case_ids TEXT, mode TEXT, result_text TEXT, query TEXT, created_at TIMESTAMPTZ DEFAULT NOW())`;
  try {
    await sql`ALTER TABLE ai_gen ADD COLUMN query TEXT`;
  } catch(e) {
    // 列已存在会报错，忽略
  }
  _initDone = true;
}

// ============ 点击 ============
async function incrementClick(caseId) {
  await _init();
  const result = await sql`
    INSERT INTO clicks (case_id, count, last_clicked_at) VALUES (${String(caseId)}, 1, NOW())
    ON CONFLICT (case_id) DO UPDATE SET count = clicks.count + 1, last_clicked_at = NOW()
    RETURNING count
  `;
  return result[0].count;
}

async function getAllClicks() {
  await _init();
  const rows = await sql`SELECT case_id, count, last_clicked_at FROM clicks`;
  const obj = {};
  for (const r of rows) obj[r.case_id] = { count: r.count, last_clicked_at: r.last_clicked_at };
  return obj;
}

// ============ 关键词 ============
async function incrementKeywords(kwMap) {
  await _init();
  for (const k in kwMap) {
    if (k.includes('\uFFFD')) continue;
    const count = kwMap[k] || 1;
    await sql`
      INSERT INTO keywords (word, count) VALUES (${k}, ${count})
      ON CONFLICT (word) DO UPDATE SET count = keywords.count + ${count}
    `;
  }
  const rows = await sql`SELECT word, count FROM keywords`;
  const obj = {};
  for (const r of rows) obj[r.word] = r.count;
  return obj;
}

async function getAllKeywords() {
  await _init();
  const rows = await sql`SELECT word, count FROM keywords`;
  const result = {};
  for (const r of rows) {
    let dk;
    try { dk = decodeURIComponent(r.word); } catch(e) { dk = r.word; }
    result[dk] = r.count;
  }
  return result;
}

// ============ 反馈 ============
async function addFeedback(record) {
  await _init();
  const result = await sql`
    INSERT INTO feedback (data) VALUES (${JSON.stringify(record)})
    RETURNING id
  `;
  // 最多保留 500 条
  await sql`DELETE FROM feedback WHERE id NOT IN (SELECT id FROM feedback ORDER BY id DESC LIMIT 500)`;
  return result[0].id;
}

async function getAllFeedback() {
  await _init();
  const rows = await sql`SELECT id, data, created_at FROM feedback ORDER BY id DESC LIMIT 500`;
  return rows.map(r => {
    const obj = typeof r.data === 'string' ? JSON.parse(r.data) : r.data;
    if (!obj || typeof obj !== 'object') return { ...obj, _db_id: r.id, _db_created_at: r.created_at };
    obj._db_id = r.id;
    obj._db_created_at = r.created_at;
    const out = {};
    for (const k in obj) {
      const v = obj[k];
      if (typeof v === 'string') {
        try { out[k] = decodeURIComponent(v); } catch(e) { out[k] = v; }
      } else if (Array.isArray(v)) {
        out[k] = v.map(x => {
          if (typeof x !== 'string') return x;
          try { return decodeURIComponent(x); } catch(e) { return x; }
        });
      } else {
        out[k] = v;
      }
    }
    return out;
  });
}

// ============ 搜索事件 ============
async function addSearch(record) {
  await _init();
  await sql`
    INSERT INTO searches (user_id, query, result_count) VALUES (${record.user_id || null}, ${record.query || ''}, ${record.result_count || 0})
  `;
}

async function getAllSearches() {
  await _init();
  const rows = await sql`SELECT id, user_id, query, result_count, created_at FROM searches ORDER BY id DESC LIMIT 1000`;
  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    query: r.query,
    result_count: r.result_count,
    created_at: r.created_at
  }));
}

// ============ AI生成事件 ============
async function addAIGen(record) {
  await _init();
  await sql`
    INSERT INTO ai_gen (user_id, case_ids, mode, result_text, query) VALUES (${record.user_id || null}, ${record.case_ids || ''}, ${record.mode || 'standard'}, ${record.result_text || ''}, ${record.query || ''})
  `;
  // 最多保留 500 条
  await sql`DELETE FROM ai_gen WHERE id NOT IN (SELECT id FROM ai_gen ORDER BY id DESC LIMIT 500)`;
}

async function getAllAIGen() {
  await _init();
  const rows = await sql`SELECT id, user_id, case_ids, mode, result_text, query, created_at FROM ai_gen ORDER BY id DESC LIMIT 500`;
  return rows.map(r => ({
    id: r.id,
    user_id: r.user_id,
    case_ids: r.case_ids,
    mode: r.mode,
    result_text: r.result_text,
    query: r.query,
    created_at: r.created_at
  }));
}

module.exports = {
  incrementClick,
  getAllClicks,
  incrementKeywords,
  getAllKeywords,
  addFeedback,
  getAllFeedback,
  addSearch,
  getAllSearches,
  addAIGen,
  getAllAIGen
};
