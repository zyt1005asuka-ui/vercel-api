// POST /api/click — 记录案例点击
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  // CORS 头（允许任何来源调用）
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '请使用 POST 方法' });
  }

  try {
    const { caseId } = req.body || {};
    if (!caseId) {
      return res.status(400).json({ error: '缺少 caseId' });
    }

    const count = await storage.incrementClick(String(caseId));
    return res.status(200).json({ success: true, count });
  } catch (e) {
    console.error('click API 错误:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
};
