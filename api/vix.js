const https = require('https');
const TOKEN = '4669bd81d63093e01dd88436069107820a0730ae';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');

  // Try live VIX from Tiingo daily first (updates ~4:15pm EST)
  // Then try VXX IEX for intraday proxy
  const today = new Date(Date.now()-7*864e5).toISOString().split('T')[0];

  // First get actual VIX daily close
  const vixUrl = `https://api.tiingo.com/tiingo/daily/VIX/prices?startDate=${today}&token=${TOKEN}`;
  // Then get VXX live from IEX as intraday proxy
  const vxxUrl = `https://api.tiingo.com/iex/VXX?token=${TOKEN}`;

  try {
    const [vixData, vxxData] = await Promise.all([
      fetch2(vixUrl, TOKEN),
      fetch2(vxxUrl, TOKEN)
    ]);

    // VXX live price
    const vxxLive = Array.isArray(vxxData) && vxxData[0]?.last;
    // VIX last close
    const vixClose = Array.isArray(vixData) && vixData.length > 0 ? vixData[vixData.length-1].close : null;

    res.setHeader('Cache-Control', 'public, max-age=60');
    return res.status(200).json({
      vix: vixClose ? Math.round(vixClose*100)/100 : null,
      vxx: vxxLive ? Math.round(vxxLive*100)/100 : null,
      live: !!vxxLive
    });
  } catch(e) {
    return res.status(502).json({ error: e.message });
  }
};

function fetch2(url, token){
  return new Promise((resolve, reject) => {
    const r = require('https').get(url, {
      headers: { 'Authorization': `Token ${token}` },
      timeout: 8000
    }, (res) => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => { try { resolve(JSON.parse(body)); } catch(e) { resolve(null); } });
    });
    r.on('error', () => resolve(null));
    r.on('timeout', () => { r.destroy(); resolve(null); });
  });
}
