const express = require('express');
const router = express.Router();

const ADMIN_USER = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'changeme';

// Simple token — in production use JWT or a proper session library
function makeToken(user) {
  const payload = Buffer.from(JSON.stringify({ user, ts: Date.now() })).toString('base64');
  return `vtok_${payload}`;
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USER && password === ADMIN_PASS) {
    return res.json({ ok: true, token: makeToken(username) });
  }
  res.status(401).json({ ok: false, error: 'Invalid credentials' });
});

router.get('/verify', (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.replace('Bearer ', '');
  if (token.startsWith('vtok_')) {
    try {
      const payload = JSON.parse(Buffer.from(token.slice(5), 'base64').toString());
      // Expire tokens after 12 hours
      if (Date.now() - payload.ts < 12 * 60 * 60 * 1000) {
        return res.json({ ok: true, user: payload.user });
      }
    } catch (_) {}
  }
  res.status(401).json({ ok: false, error: 'Invalid or expired token' });
});

module.exports = router;
