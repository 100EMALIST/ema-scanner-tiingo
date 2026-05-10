const https = require('https');

const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async function(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const { ticker, type, startDate } = req.query || {};

  if (!ticker) {
    return res.status(400).json({ error: 'Missing ticker' });
  }

  const safeTicker = ticker.replace(/[^A-Za-z0-9.\-]/g, '').toUpperCase();
  const safeStart  = (startDate || '2023-01-01').replace(/[^0-9\-]/g, '');

  // Tiingo has two endpoints:
  // Daily/Weekly: /tiingo/daily/{ticker}/prices
  // Intraday:     /iex/{ticker}/prices (15min, 30min, 1hour)
  let url;
  if (type === 'intraday') {
    const safeResample = (req.query.interval || '15min').replace(/[^a-z0-9]/g, '');
    url = `https://api.tiingo.com/iex/${safeTicker}/prices?startDate=${safeStart}&resampleFreq=${safeResample}&token=${TOKEN}`;
  } else {
    const safeResample = (req.query.interval || '1day').replace(/[^a-z0-9]/g, '');
    url = `https://api.tiingo.com/tiingo/daily/${safeTicker}/prices?startDate=${safeStart}&resampleFreq=${safeResample}&token=${TOKEN}`;
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const reqH = https.get(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${TOKEN}`
        },
        timeout: 12000
      }, (r) => {
        let body = '';
        r.on('data', chunk => body += chunk);
        r.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('Invalid JSON: ' + body.slice(0, 100))); }
        });
      });
      reqH.on('error', reject);
      reqH.on('timeout', () => { reqH.destroy(); reject(new Error('Timeout')); });
    });

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
};
