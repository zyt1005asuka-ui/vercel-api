// POST /api/keyword — 记录搜索关键词
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ error: 'empty keywords map' });
    }
    // 前端发送的 key 已经是 encodeURIComponent 编码的纯 ASCII，直接存
    // 如果 key 里含 replacement character（U+FFFD），说明 body parser 损坏了中文，跳过
    const safeBody = {};
    for (const k in body) {
      if (!k.includes('\uFFFD')) {
        safeBody[k] = body[k];
      }
    }
    if (Object.keys(safeBody).length === 0) {
      return res.status(200).json({ ok: true, count: 0, note: 'all keys were corrupted' });
    }
    const result = await storage.incrementKeywords(safeBody);
    return res.status(200).json({ ok: true, count: Object.keys(result).length });
  } catch (e) {
    console.error('keyword API error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};
