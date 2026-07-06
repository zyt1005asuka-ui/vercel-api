// GET /api/keywords — 获取全部关键词统计
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const keywords = await storage.getAllKeywords();
    return res.status(200).json(keywords);
  } catch (e) {
    console.error('keywords API error:', e);
    return res.status(500).json({ error: 'server error' });
  }
};
