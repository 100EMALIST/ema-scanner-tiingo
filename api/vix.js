const https = require('https');
const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  const week = new Date(Date.now()-7*864e5).toISOString().split('T')[0];
  const url  = `https://api.tiingo.com/tiingo/daily/VIX/prices?startDate=${week}&token=${TOKEN}`;

  try {
    const data = await new Promise((resolve, reject) => {
      const r = https.get(url, {
        headers: { 'Authorization': `Token ${TOKEN}` },
        timeout: 8000
      }, (res) => {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { reject(e); } });
      });
      r.on('error', reject);
      r.on('timeout', () => { r.destroy(); reject(new Error('Timeout')); });
    });

    if(!Array.isArray(data)||!data.length) return res.status(502).json({error:'No data'});
    const vix = Math.round(data[data.length-1].close * 100) / 100;
    res.setHeader('Cache-Control', 'public, max-age=300');
    return res.status(200).json({ vix });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};
