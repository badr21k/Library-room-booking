const fetch = require('node-fetch');
const url = require('url');

module.exports = async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  const baseUrl = 'https://script.google.com/macros/s/AKfycbxqTv9VqYirc5o1AHtRB106blUrdlUWGgYz_R_MGJtCv262u0ZA_tjeBDXyXdT0RePk/exec'; // Your Web App URL
  let fetchUrl = baseUrl;

  if (req.method === 'GET') {
    const queryString = url.parse(req.url).query;
    if (queryString) fetchUrl += '?' + queryString;
  }

  try {
    const response = await fetch(fetchUrl, {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
