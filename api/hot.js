// GET /api/hot — 获取全部点击计数
const storage = require('../lib/storage');

module.exports = async function handler(req, res) {
  // CORS 头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  // 允许浏览器缓存 10 秒
  res.setHeader('Cache-Control', 'public, max-age=10, s-maxage=10');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const clicks = await storage.getAllClicks();
    return res.status(200).json(clicks);
  } catch (e) {
    console.error('hot API 错误:', e);
    return res.status(500).json({ error: '服务器错误' });
  }
};
