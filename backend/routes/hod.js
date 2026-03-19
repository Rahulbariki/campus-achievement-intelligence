const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const Participation = require('../models/Participation');
const User = require('../models/User');

const router = express.Router();

router.get('/summary', auth, permit('hod', 'admin', 'super_admin'), async (req, res) => {
  const { department } = req.user;

  const query = department ? { department } : {};
  const students = await User.find({ ...query, role: 'student' });

  const participations = await Participation.find({}).populate('student event');
  const filtered = department ? participations.filter((p) => p.student.department === department) : participations;

  const active = filtered.filter((p) => p.score >= 50).length;
  const winners = filtered.filter((p) => p.participationType === 'Winner').length;
  const events = filtered.length;

  const now = new Date();
  const inMonth = filtered.filter((p) => p.submittedAt.getMonth() === now.getMonth() && p.submittedAt.getFullYear() === now.getFullYear()).length;

  res.json({
    totalStudents: students.length,
    totalActivities: events,
    totalWinners: winners,
    thisMonth: inMonth,
    activeStudents: active,
    queue: filtered
  });
});

router.get('/leaderboard', auth, permit('hod', 'admin', 'super_admin'), async (req, res) => {
  const participations = await Participation.find().populate('student');

  const scores = {};
  participations.forEach((p) => {
    const id = p.student._id.toString();
    if (!scores[id]) scores[id] = { student: p.student, points: 0, participations: 0, wins: 0 };
    scores[id].points += p.score;
    scores[id].participations += 1;
    if (p.participationType === 'Winner') scores[id].wins += 1;
  });

  const sorted = Object.values(scores).sort((a, b) => b.points - a.points);
  res.json(sorted);
});

router.get('/activity-categories', auth, permit('hod', 'admin', 'super_admin'), async (req, res) => {
  const participations = await Participation.find().populate('student');
  const studentStats = {};

  participations.forEach((p) => {
    const id = p.student._id.toString();
    studentStats[id] = studentStats[id] || { student: p.student, participations: 0, wins: 0 };
    studentStats[id].participations += 1;
    if (p.participationType === 'Winner') studentStats[id].wins += 1;
  });

  const categories = { highlyActive: [], moderate: [], inactive: [] };

  Object.values(studentStats).forEach((s) => {
    if (s.participations >= 5 && s.wins >= 1) categories.highlyActive.push(s);
    else if (s.participations >= 2) categories.moderate.push(s);
    else categories.inactive.push(s);
  });

  res.json(categories);
});

module.exports = router;
