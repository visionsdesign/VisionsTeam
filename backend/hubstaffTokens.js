const fs = require('fs');
const path = require('path');
const axios = require('axios');

const TOKEN_FILE = path.join(__dirname, '.hubstaff-tokens.json');

function readTokens() {
  try {
    return JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function writeTokens(data) {
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(data, null, 2));
}

async function refreshAccessToken() {
  const tokens = readTokens();
  if (!tokens?.refresh_token) {
    throw Object.assign(new Error('Not authorised — visit /api/auth/hubstaff to connect HubStaff'), { status: 401 });
  }

  const res = await axios.post('https://account.hubstaff.com/access_tokens', null, {
    params: {
      grant_type: 'refresh_token',
      refresh_token: tokens.refresh_token,
      client_id: process.env.HUBSTAFF_CLIENT_ID,
      client_secret: process.env.HUBSTAFF_CLIENT_SECRET,
    },
  });

  const updated = {
    access_token: res.data.access_token,
    refresh_token: res.data.refresh_token || tokens.refresh_token,
    expires_at: Date.now() + (res.data.expires_in || 7200) * 1000,
  };
  writeTokens(updated);
  return updated.access_token;
}

async function getAccessToken() {
  const tokens = readTokens();
  if (!tokens?.access_token) {
    throw Object.assign(new Error('Not authorised — visit /api/auth/hubstaff to connect HubStaff'), { status: 401 });
  }

  // Refresh proactively 5 minutes before expiry
  if (tokens.expires_at && Date.now() > tokens.expires_at - 5 * 60 * 1000) {
    return refreshAccessToken();
  }
  return tokens.access_token;
}

module.exports = { getAccessToken, writeTokens };
