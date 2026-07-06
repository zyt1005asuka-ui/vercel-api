// POST /api/ai-gen — 记录AI生成事件
// GET  /api/ai-gen — 获取全部AI生成记录（管理员用）
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
      if (!body || typeof body.result_text !== 'string') {
        return res.status(400).json({ error: 'missing result_text' });
      }
      await storage.addAIGen({
        user_id: body.user_id || null,
        case_ids: body.case_ids || '',
        mode: body.mode || 'standard',
        result_text: body.result_text
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('ai-gen POST error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await storage.getAllAIGen();
      return res.status(200).json(list);
    } catch (e) {
      console.error('ai-gen GET error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
