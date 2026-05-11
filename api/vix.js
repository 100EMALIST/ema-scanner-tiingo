const https = require('https');
const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Use Tiingo for VIX — ticker is VIX on Tiingo
  const today = new Date().toISOString().split('T')[0];
  const week  = new Date(Date.now()-7*864e5).toISOString().split('T')[0];
  const url   = `https://api.tiingo.com/tiingo/daily/VIX/prices?startDate=${week}&token=${TOKEN}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const r = https.get(url, {
        headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' },
        timeout: 8000
      }, (response) => {
        let body = '';
        response.on('data', c => body += c);
        response.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(502).json({ error: 'No VIX data' });
    }

    const latest = data[data.length - 1];
    const vix = latest.close || latest.adjClose;

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({ vix: Math.round(vix * 100) / 100, date: latest.date });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};
