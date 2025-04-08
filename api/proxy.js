// api/proxy.js
const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(204).end();
    return;
  }

  // Replace this with your actual Google Apps Script Web App URL
  const GAS_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxqTv9VqYirc5o1AHtRB106blUrdlUWGgYz_R_MGJtCv262u0ZA_tjeBDXyXdT0RePk/exec";
  const fetchUrl = GAS_WEB_APP_URL + (req.query ? "?" + new URLSearchParams(req.query).toString() : "");

  try {
    const response = await fetch(fetchUrl, {
      method: req.method,
      headers: { "Content-Type": "application/json" },
      body: req.method === "POST" ? JSON.stringify(req.body) : undefined,
    });
    const data = await response.json();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: "Proxy error: " + error.message });
  }
};
