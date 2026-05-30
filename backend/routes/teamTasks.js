const express = require('express');
const axios = require('axios');
const router = express.Router();

const TEAM = [
  { id: '32497410', name: 'Daniel Bate',     initials: 'DB', role: 'Developer',       color: '#7F77DD' },
  { id: '32422388', name: 'Charlie Clayton',  initials: 'CC', role: 'Marketing',        color: '#1D9E75' },
  { id: '6613651',  name: 'Michael',          initials: 'MI', role: 'Developer',        color: '#D85A30' },
  { id: '50631627', name: 'Lauren Johnson',   initials: 'LJ', role: 'Developer',        color: '#378ADD' },
  { id: '38504090', name: 'Domenic Ellis',    initials: 'DE', role: 'Designer',         color: '#BA7517' },
  { id: '87656116', name: 'Claire Roxburgh',  initials: 'CR', role: 'Client Services',  color: '#639922' },
];

function calcHealth({ inProgress, done, overdue, blockers }) {
  let score = 65;
  score -= (overdue?.length || 0) * 10;
  score -= (blockers?.length || 0) * 15;
  score += (done?.length || 0) * 5;
  score -= Math.max(0, (inProgress?.length || 0) - 3) * 5;
  return Math.max(0, Math.min(100, score));
}

function getMockData() {
  return TEAM.map((member, i) => {
    const scenarios = [
      {
        inProgress: ['Fix auth bug', 'API refactor'],
        upcoming: ['Deploy v2', 'Write unit tests'],
        done: ['Setup CI', 'Code review', 'DB migration'],
        overdue: [],
        blockers: [],
      },
      {
        inProgress: ['Email campaign', 'SEO audit'],
        upcoming: ['Social posts', 'Blog draft'],
        done: ['Newsletter'],
        overdue: ['Q2 report'],
        blockers: [],
      },
      {
        inProgress: ['Mobile app', 'Unit tests', 'Docs', 'Perf optimisation'],
        upcoming: ['Release'],
        done: [],
        overdue: ['Client demo', 'Sprint planning'],
        blockers: ['Waiting on design assets'],
      },
      {
        inProgress: ['Dashboard UI'],
        upcoming: ['User testing', 'Accessibility audit'],
        done: ['Wireframes', 'Prototype', 'Stakeholder review'],
        overdue: [],
        blockers: [],
      },
      {
        inProgress: ['Brand refresh'],
        upcoming: ['Logo variants', 'Style guide'],
        done: ['Mood board', 'Client feedback'],
        overdue: [],
        blockers: ['Awaiting client approval'],
      },
      {
        inProgress: ['Onboarding flow'],
        upcoming: ['Weekly check-ins'],
        done: ['Client calls', 'Status report', 'Proposal', 'Contract'],
        overdue: [],
        blockers: [],
      },
    ];

    const listNames = ['Sprint Board', 'Marketing', 'Dev Tasks', 'Design', 'Client Projects', 'Operations'];
    const s = scenarios[i];
    const makeTask = (name, status) => ({
      id: `mock-${member.id}-${Math.random().toString(36).slice(2)}`,
      name,
      status,
      due_date: null,
      priority: null,
      url: '#',
      list: listNames[i],
    });

    const tasks = {
      inProgress: s.inProgress.map(n => makeTask(n, 'in progress')),
      upcoming:   s.upcoming.map(n => makeTask(n, 'to do')),
      done:       s.done.map(n => makeTask(n, 'complete')),
      overdue:    s.overdue.map(n => makeTask(n, 'in progress')),
      blockers:   s.blockers.map(n => makeTask(n, 'blocked')),
    };

    return { ...member, tasks, healthScore: calcHealth(tasks) };
  });
}

let cachedTeamId = null;
let cachedProfilePics = null;

async function getTeamId(apiKey) {
  if (cachedTeamId) return cachedTeamId;
  const res = await axios.get('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: apiKey },
  });
  cachedTeamId = res.data.teams[0].id;
  return cachedTeamId;
}

async function getProfilePics(apiKey) {
  if (cachedProfilePics) return cachedProfilePics;
  const res = await axios.get('https://api.clickup.com/api/v2/team', {
    headers: { Authorization: apiKey },
  });
  const map = {};
  for (const team of res.data.teams || []) {
    for (const m of team.members || []) {
      const u = m.user || {};
      if (u.id && u.profilePicture) map[String(u.id)] = u.profilePicture;
    }
  }
  cachedProfilePics = map;
  return map;
}

async function fetchMemberTasks(apiKey, teamId, userId) {
  const now = Date.now();
  const weekStart = (() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d.getTime();
  })();
  const in14days = now + 14 * 24 * 60 * 60 * 1000;

  const base = `https://api.clickup.com/api/v2/team/${teamId}/task`;
  const headers = { Authorization: apiKey };
  const params = (extra) => ({ 'assignees[]': userId, ...extra });

  const [ipRes, upRes, doneRes, overdueRes, blockRes] = await Promise.allSettled([
    axios.get(base, { headers, params: params({ 'statuses[]': 'in progress', include_closed: false }) }),
    axios.get(base, { headers, params: params({ due_date_gt: now, due_date_lt: in14days, include_closed: false }) }),
    axios.get(base, { headers, params: params({ 'statuses[]': 'complete', date_updated_gt: weekStart, include_closed: true }) }),
    axios.get(base, { headers, params: params({ due_date_lt: now, include_closed: false }) }),
    axios.get(base, { headers, params: params({ 'statuses[]': 'blocked', include_closed: false }) }),
  ]);

  const extract = (res) => {
    if (res.status === 'rejected') return [];
    return (res.value.data.tasks || []).map(t => ({
      id: t.id,
      name: t.name,
      status: t.status?.status,
      start_date: t.start_date ? new Date(parseInt(t.start_date)).toISOString().slice(0, 10) : null,
      due_date: t.due_date ? new Date(parseInt(t.due_date)).toISOString().slice(0, 10) : null,
      priority: t.priority?.priority,
      url: t.url,
      list: t.list?.name,
      folder: t.folder?.name || t.list?.name,
    }));
  };

  return {
    inProgress: extract(ipRes),
    upcoming:   extract(upRes),
    done:       extract(doneRes),
    overdue:    extract(overdueRes),
    blockers:   extract(blockRes),
  };
}

router.get('/', async (req, res, next) => {
  const apiKey = process.env.CLICKUP_API_KEY;

  if (!apiKey) {
    return res.json(getMockData());
  }

  try {
    const [teamId, profilePics] = await Promise.all([
      getTeamId(apiKey),
      getProfilePics(apiKey).catch(() => ({})),
    ]);
    const results = await Promise.all(
      TEAM.map(async (member) => {
        try {
          const tasks = await fetchMemberTasks(apiKey, teamId, member.id);
          return { ...member, tasks, healthScore: calcHealth(tasks), profilePicture: profilePics[member.id] || null };
        } catch (err) {
          console.error(`Error fetching tasks for ${member.name}:`, err.message);
          return {
            ...member,
            tasks: { inProgress: [], upcoming: [], done: [], overdue: [], blockers: [] },
            healthScore: 65,
            profilePicture: profilePics[member.id] || null,
          };
        }
      })
    );
    res.json(results);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
