const express = require('express');
const axios = require('axios');
const router = express.Router();
const { getAccessToken } = require('../hubstaffTokens');

const ORG_ID = 705380;

const PROJECTS = [
  {
    id: 'openworld',
    name: 'Open World',
    color: '#7F77DD',
    hubstaffId: 3727587,
    clickupFolderId: '90126610407',
  },
  {
    id: 'tribe',
    name: 'Tribe Property Solutions',
    color: '#1D9E75',
    hubstaffId: 3905866,
    clickupFolderId: '90129783563',
  },
];

const MEMBER_META = {
  'daniel bate':     { initials: 'DB', color: '#7F77DD' },
  'daniel cordwell': { initials: 'DC', color: '#E65A6E' },
  'charlie clayton': { initials: 'CC', color: '#1D9E75' },
  'lauren johnson':  { initials: 'LJ', color: '#378ADD' },
  'domenic ellis':   { initials: 'DE', color: '#BA7517' },
  'claire roxburgh': { initials: 'CR', color: '#639922' },
};

function memberMeta(name) {
  const key = (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
  if (MEMBER_META[key]) return MEMBER_META[key];
  for (const [k, v] of Object.entries(MEMBER_META)) {
    if (key.startsWith(k.split(' ')[0])) return v;
  }
  const parts = name.trim().split(/\s+/);
  return {
    initials: parts.length >= 2 ? parts[0][0].toUpperCase() + parts[1][0].toUpperCase() : name.slice(0, 2).toUpperCase(),
    color: '#64748b',
  };
}

async function getHubstaffHours(token, projectId, from, to) {
  const res = await axios.get(
    `https://api.hubstaff.com/v2/organizations/${ORG_ID}/activities/daily`,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { 'date[start]': from, 'date[stop]': to, include: 'users' },
    }
  );

  const activities = (res.data.daily_activities || []).filter(a => a.project_id === projectId);
  const users = Object.fromEntries((res.data.users || []).map(u => [u.id, u.name]));

  const memberMap = {};
  for (const a of activities) {
    const uid = a.user_id;
    const name = users[uid] || `User ${uid}`;
    if (!memberMap[uid]) memberMap[uid] = { name, seconds: 0 };
    memberMap[uid].seconds += a.tracked || 0;
  }

  const totalSeconds = Object.values(memberMap).reduce((s, m) => s + m.seconds, 0);
  const members = Object.values(memberMap)
    .sort((a, b) => b.seconds - a.seconds)
    .map(m => ({
      name: m.name,
      hours: Math.round(m.seconds / 360) / 10,
      percent: totalSeconds > 0 ? Math.round((m.seconds / totalSeconds) * 100) : 0,
      ...memberMeta(m.name),
    }));

  return {
    totalHours: Math.round(totalSeconds / 360) / 10,
    members,
  };
}

async function getClickupTasks(apiKey, folderId) {
  const listsRes = await axios.get(
    `https://api.clickup.com/api/v2/folder/${folderId}/list`,
    { headers: { Authorization: apiKey }, params: { archived: false } }
  );

  const lists = listsRes.data.lists || [];

  const taskArrays = await Promise.all(
    lists.map(list =>
      axios
        .get(`https://api.clickup.com/api/v2/list/${list.id}/task`, {
          headers: { Authorization: apiKey },
          params: { include_closed: true, subtasks: false },
        })
        .then(r => (r.data.tasks || []).map(t => ({ ...t, listName: list.name })))
        .catch(() => [])
    )
  );

  const now = new Date().toISOString().slice(0, 10);
  const allTasks = taskArrays.flat();

  function statusGroup(t) {
    const s = (t.status?.status || '').toLowerCase();
    if (s === 'complete' || s === 'closed') return 'complete';
    if (s === 'in progress') return 'inProgress';
    if (s === 'to do' || s === 'incoming') return 'toDo';
    if (s === 'blocked') return 'blocked';
    if (s === 'with client') return 'withClient';
    return 'other';
  }

  const stats = { total: allTasks.length, complete: 0, inProgress: 0, toDo: 0, overdue: 0 };
  const memberTaskMap = {};

  for (const t of allTasks) {
    const grp = statusGroup(t);
    if (grp === 'complete') stats.complete++;
    else if (grp === 'inProgress') stats.inProgress++;
    else if (grp === 'toDo') stats.toDo++;

    if (
      t.due_date &&
      new Date(parseInt(t.due_date)).toISOString().slice(0, 10) < now &&
      grp !== 'complete'
    ) {
      stats.overdue++;
    }

    for (const a of t.assignees || []) {
      const name = (a.username || '').trim();
      if (!name) continue;
      if (!memberTaskMap[name]) memberTaskMap[name] = { name, total: 0, complete: 0 };
      memberTaskMap[name].total++;
      if (grp === 'complete') memberTaskMap[name].complete++;
    }
  }

  stats.completionRate = stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0;

  const activeTasks = allTasks
    .filter(t => statusGroup(t) !== 'complete')
    .slice(0, 8)
    .map(t => ({
      id: t.id,
      name: t.name.length > 65 ? t.name.slice(0, 62) + '…' : t.name,
      status: t.status?.status || 'unknown',
      statusColor: t.status?.color || '#6b7280',
      assignees: (t.assignees || []).map(a => a.username).filter(Boolean),
      dueDate: t.due_date ? new Date(parseInt(t.due_date)).toISOString().slice(0, 10) : null,
      list: t.listName,
      url: t.url,
    }));

  const memberTasks = Object.values(memberTaskMap)
    .sort((a, b) => b.total - a.total)
    .map(m => ({
      ...m,
      ...memberMeta(m.name),
      completionRate: m.total > 0 ? Math.round((m.complete / m.total) * 100) : 0,
    }));

  return { ...stats, activeTasks, memberTasks };
}

router.get('/', async (req, res, next) => {
  const { from, to } = req.query;
  const apiKey = process.env.CLICKUP_API_KEY;

  let hubstaffToken = null;
  try { hubstaffToken = await getAccessToken(); } catch {}

  try {
    const projects = await Promise.all(
      PROJECTS.map(async project => {
        const [hours, tasks] = await Promise.all([
          hubstaffToken && from && to
            ? getHubstaffHours(hubstaffToken, project.hubstaffId, from, to).catch(() => ({ totalHours: 0, members: [] }))
            : Promise.resolve({ totalHours: 0, members: [] }),
          apiKey
            ? getClickupTasks(apiKey, project.clickupFolderId).catch(() => ({
                total: 0, complete: 0, inProgress: 0, toDo: 0, overdue: 0,
                completionRate: 0, activeTasks: [], memberTasks: [],
              }))
            : Promise.resolve({
                total: 0, complete: 0, inProgress: 0, toDo: 0, overdue: 0,
                completionRate: 0, activeTasks: [], memberTasks: [],
              }),
        ]);
        return { ...project, hours, tasks };
      })
    );
    res.json(projects);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
