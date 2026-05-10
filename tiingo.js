const https = require('https');

const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

exports.default = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');

  const { ticker, interval, startDate } = req.query || {};

  if (!ticker) {
    res.status(400).json({ error: 'Missing ticker' });
    return;
  }

  const safeTicker    = ticker.replace(/[^A-Z0-9.\-]/g, '').toUpperCase();
  const safeInterval  = (interval || '1day').replace(/[^a-z0-9]/g, '');
  const safeStart     = (startDate || '2020-01-01').replace(/[^0-9\-]/g, '');

  const url = `https://api.tiingo.com/tiingo/daily/${safeTicker}/prices?startDate=${safeStart}&resampleFreq=${safeInterval}&token=${TOKEN}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const reqH = https.get(url, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      }, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid JSON')); }
        });
      });
      reqH.on('error', reject);
      reqH.on('timeout', () => { reqH.destroy(); reject(new Error('Timeout')); });
    });

    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
};
