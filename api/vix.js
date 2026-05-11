const https = require('https');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // stooq symbol for VIX is vi.f
  const url = 'https://stooq.com/q/l/?s=vi.f&f=sd2t2ohlcv&h&e=csv';

  try {
    const data = await new Promise((resolve, reject) => {
      const r = https.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        timeout: 8000
      }, (response) => {
        let body = '';
        response.on('data', c => body += c);
        response.on('end', () => resolve(body));
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });

    const lines = data.trim().split('\n');
    if (lines.length < 2) return res.status(502).json({ error: 'No data', raw: data.slice(0,100) });

    const cols = lines[1].split(',');
    // Columns: Symbol,Date,Time,Open,High,Low,Close,Volume
    const close = parseFloat(cols[6]);
    if (isNaN(close)) return res.status(502).json({ error: 'Parse error', raw: lines[1] });

    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ vix: close, date: cols[1] });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};
