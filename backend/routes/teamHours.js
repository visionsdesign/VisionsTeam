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

const WEEKLY_TARGET_SECONDS = 144000; // 40 hours

function getCapacityStatus(percentOfTarget) {
  if (percentOfTarget < 60)  return 'under-utilised';
  if (percentOfTarget <= 100) return 'on-track';
  if (percentOfTarget <= 120) return 'high-load';
  return 'over-capacity';
}

function getMockData() {
  // Realistic hours: some under, some over, most on-track
  const mockSeconds = [
    108000, // Daniel:  30h  → 75%  on-track
     72000, // Charlie: 20h  → 50%  under-utilised
    158400, // Michael: 44h  → 110% high-load
    144000, // Lauren:  40h  → 100% on-track
     86400, // Domenic: 24h  → 60%  on-track (edge)
    180000, // Claire:  50h  → 125% over-capacity
  ];

  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  return TEAM.map((member, i) => {
    const trackedSeconds = mockSeconds[i];
    const trackedHours = Math.round((trackedSeconds / 3600) * 10) / 10;
    const targetHours = 40;
    const percentOfTarget = Math.round((trackedSeconds / WEEKLY_TARGET_SECONDS) * 100);

    // Spread hours across Mon–Fri
    const dailyBreakdown = [];
    const daysLogged = 5;
    const secondsPerDay = Math.floor(trackedSeconds / daysLogged);
    for (let d = 0; d < daysLogged; d++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + d);
      const jitter = Math.floor((Math.random() - 0.5) * 3600);
      dailyBreakdown.push({
        date: date.toISOString().slice(0, 10),
        seconds: Math.max(0, secondsPerDay + jitter),
      });
    }

    return {
      ...member,
      trackedSeconds,
      trackedHours,
      targetHours,
      percentOfTarget,
      capacityStatus: getCapacityStatus(percentOfTarget),
      dailyBreakdown,
    };
  });
}

let cachedOrgId = null;

async function getOrgId(token) {
  if (cachedOrgId) return cachedOrgId;
  const res = await axios.get('https://api.hubstaff.com/v2/organizations', {
    headers: { Authorization: `Bearer ${token}` },
  });
  cachedOrgId = res.data.organizations[0].id;
  return cachedOrgId;
}

router.get('/', async (req, res, next) => {
  const token = process.env.HUBSTAFF_TOKEN;
  const { from, to } = req.query;

  if (!token) {
    return res.json(getMockData());
  }

  try {
    const orgId = await getOrgId(token);
    const headers = { Authorization: `Bearer ${token}` };

    // Get org members
    const membersRes = await axios.get(
      `https://api.hubstaff.com/v2/organizations/${orgId}/members`,
      { headers }
    );
    const hubstaffMembers = membersRes.data.members || [];

    // Get daily activities
    const activitiesRes = await axios.get(
      `https://api.hubstaff.com/v2/organizations/${orgId}/activities/daily`,
      {
        headers,
        params: {
          'date[start]': from,
          'date[stop]': to,
          include: 'users',
        },
      }
    );
    const activities = activitiesRes.data.daily_activities || [];

    // Map TEAM members to HubStaff members by first name
    const result = TEAM.map(member => {
      const firstName = member.name.split(' ')[0].toLowerCase();
      const hsMatch = hubstaffMembers.find(
        m => (m.name || '').split(' ')[0].toLowerCase() === firstName
      );

      const hsUserId = hsMatch?.user_id;
      const memberActivities = hsUserId
        ? activities.filter(a => a.user_id === hsUserId)
        : [];

      const trackedSeconds = memberActivities.reduce((sum, a) => sum + (a.tracked || 0), 0);
      const trackedHours = Math.round((trackedSeconds / 3600) * 10) / 10;
      const targetHours = 40;
      const percentOfTarget = Math.round((trackedSeconds / WEEKLY_TARGET_SECONDS) * 100);

      const dailyBreakdown = memberActivities.map(a => ({
        date: a.date,
        seconds: a.tracked || 0,
      }));

      return {
        ...member,
        trackedSeconds,
        trackedHours,
        targetHours,
        percentOfTarget,
        capacityStatus: getCapacityStatus(percentOfTarget),
        dailyBreakdown,
      };
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
