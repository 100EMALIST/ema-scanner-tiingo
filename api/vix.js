const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Fetch VIX from stooq via server-side (no CORS issue)
  const url = 'https://stooq.com/q/l/?s=%5Evix&f=sd2t2ohlcv&h&e=csv';

  try {
    const data = await new Promise((resolve, reject) => {
      const r = https.get(url, { timeout: 8000 }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => resolve(body));
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });

    const lines = data.trim().split('\n');
    if (lines.length < 2) return res.status(502).json({ error: 'No data' });
    const cols = lines[1].split(',');
    const close = parseFloat(cols[6]);
    if (isNaN(close)) return res.status(502).json({ error: 'Parse error' });

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ vix: close });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};
