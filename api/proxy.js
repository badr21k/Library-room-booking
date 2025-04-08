const fetch = require('node-fetch');
const url = require('url');

module.exports = async (req, res) => {
  // Handle CORS preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.status(204).end();
    return;
  }

  // Use your verified Google Apps Script URL
  const baseUrl = 'https://script.google.com/macros/s/AKfycbwDWJbj5vV84m5Gc7eswsKa6ovt-Xt_UWZdlcnWQYcUtY8awpEDBt4SqdC2g5yTm6RG/exec';
  let fetchUrl = baseUrl;

  // Append query parameters for GET requests
  if (req.method === 'GET') {
    const queryString = url.parse(req.url).query;
    if (queryString) {
      fetchUrl += '?' + queryString;
    }
  }

  try {
    const response = await fetch(fetchUrl, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: req.method === 'POST' ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.toString() });
  }
};
