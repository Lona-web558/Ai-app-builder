require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const { ANTHROPIC_API_KEY, APP_PASSWORD, MODEL = 'claude-sonnet-5-5', PORT = 3000 } = process.env;
if (!ANTHROPIC_API_KEY) console.warn('Missing ANTHROPIC_API_KEY. Set it in .env or your host settings.');
if (!APP_PASSWORD) console.warn('APP_PASSWORD is not set: anyone with the URL can spend your API credit.');

const SYSTEM = fs.readFileSync(path.join(__dirname, 'system-prompt.txt'), 'utf8');

const app = express();
app.set('trust proxy', 1); // needed behind Render's proxy
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname)));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 40, standardHeaders: true, legacyHeaders: false,
  message: { error: 'Too many requests. Try again in a few minutes.' } });

app.post('/api/chat', limiter, async (req, res) => {
  if (APP_PASSWORD && req.get('x-access-code') !== APP_PASSWORD) {
    return res.status(401).json({ error: 'Wrong or missing access code.' });
  }
  const messages = (Array.isArray(req.body.messages) ? req.body.messages : [])
    .filter(m => ['user', 'assistant'].includes(m.role) && typeof m.content === 'string' && m.content.trim())
    .map(m => ({ role: m.role, content: m.content }))
    .slice(-30);
  if (!messages.length || messages[0].role !== 'user') return res.status(400).json({ error: 'Send at least one user message.' });

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: MODEL, max_tokens: 16000, system: SYSTEM, messages, stream: true })
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: `AI API error ${r.status}: ${t.slice(0, 300)}` });
    }
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Accel-Buffering', 'no');

    // Convert the API's event stream into plain text chunks for the browser
    const dec = new TextDecoder();
    let buf = '';
    for await (const chunk of r.body) {
      buf += dec.decode(chunk, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        try {
          const ev = JSON.parse(line.slice(6));
          if (ev.type === 'content_block_delta' && ev.delta.type === 'text_delta') res.write(ev.delta.text);
        } catch { /* ignore partial lines */ }
      }
    }
    res.end();
  } catch (e) {
    if (!res.headersSent) res.status(500).json({ error: e.message });
    else res.end();
  }
});


app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));




app.listen(PORT, () => console.log(`App Builder AI running on http://localhost:${PORT}`));
