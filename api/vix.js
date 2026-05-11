const https = require('https');
const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Tiingo IEX endpoint — live last price
  const url = `https://api.tiingo.com/iex/VIX?token=${TOKEN}`;

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

    // IEX returns array
    const quote = Array.isArray(data) ? data[0] : data;
    const vix = quote?.last || quote?.close || quote?.tngoLast;
    if (!vix) return res.status(502).json({ error: 'No price', raw: JSON.stringify(data).slice(0,100) });

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({ vix: Math.round(vix * 100) / 100 });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};
