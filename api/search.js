// POST /api/search — 记录搜索事件
// GET  /api/search — 获取全部搜索记录（管理员用）
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || typeof body.query !== 'string') {
        return res.status(400).json({ error: 'missing query' });
      }
      await storage.addSearch({
        user_id: body.user_id || null,
        query: body.query,
        result_count: body.result_count || 0
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('search POST error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await storage.getAllSearches();
      return res.status(200).json(list);
    } catch (e) {
      console.error('search GET error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
