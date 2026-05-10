const https = require('https');

const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { ticker, interval, startDate } = req.query;

  if (!ticker) return res.status(400).json({ error: 'Missing ticker' });

  const safeTicker = ticker.replace(/[^A-Za-z0-9.\-]/g, '').toUpperCase();
  const safeStart  = (startDate || '2023-01-01').replace(/[^0-9\-]/g, '');
  const safeFreq   = (interval || '1day').replace(/[^a-z0-9]/g, '');

  const url = `https://api.tiingo.com/tiingo/daily/${safeTicker}/prices?startDate=${safeStart}&resampleFreq=${safeFreq}&token=${TOKEN}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const r = https.get(url, {
        headers: { 'Authorization': `Token ${TOKEN}`, 'Content-Type': 'application/json' },
        timeout: 12000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Bad JSON: ' + body.slice(0,200))); }
        });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(data);
  } catch(err) {
    return res.status(502).json({ error: err.message });
  }
}
