require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const teamTasksRouter = require('./routes/teamTasks');
const teamHoursRouter = require('./routes/teamHours');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/team-tasks', teamTasksRouter);
app.use('/api/team-hours', teamHoursRouter);

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
