// POST /api/feedback — 提交反馈
// GET /api/feedback — 获取全部反馈（管理员用）
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!body || (!body.feedback_text && !body.container_id)) {
        return res.status(400).json({ error: 'missing feedback_text or container_id' });
      }
      await storage.addFeedback(body);
      return res.status(200).json({ ok: true });
    } catch (e) {
      console.error('feedback POST error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  if (req.method === 'GET') {
    try {
      const list = await storage.getAllFeedback();
      return res.status(200).json(list);
    } catch (e) {
      console.error('feedback GET error:', e);
      return res.status(500).json({ error: 'server error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};
