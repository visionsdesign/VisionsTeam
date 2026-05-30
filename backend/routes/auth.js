const express = require('express');
const axios = require('axios');
const router = express.Router();
const { writeTokens } = require('../hubstaffTokens');

const redirectUri = () =>
  `http://localhost:${process.env.PORT || 3001}/api/auth/hubstaff/callback`;

router.get('/hubstaff', (req, res) => {
  const nonce = require('crypto').randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri(),
    scope: 'hubstaff:read tasks:read openid',
    client_id: process.env.HUBSTAFF_CLIENT_ID,
    nonce,
  });
  res.redirect(`https://account.hubstaff.com/authorizations/new?${params}`);
});

router.get('/hubstaff/callback', async (req, res, next) => {
  try {
    const { code } = req.query;
    if (!code) return res.status(400).send('Missing authorisation code');

    const tokenRes = await axios.post('https://account.hubstaff.com/access_tokens', null, {
      params: {
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri(),
        client_id: process.env.HUBSTAFF_CLIENT_ID,
        client_secret: process.env.HUBSTAFF_CLIENT_SECRET,
      },
    });

    writeTokens({
      access_token: tokenRes.data.access_token,
      refresh_token: tokenRes.data.refresh_token,
      expires_at: Date.now() + (tokenRes.data.expires_in || 7200) * 1000,
    });

    res.send('<p style="font-family:sans-serif">HubStaff connected successfully. You can close this window.</p>');
  } catch (err) {
    next(err);
  }
});

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
