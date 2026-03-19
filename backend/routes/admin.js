const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const Participation = require('../models/Participation');
const Certificate = require('../models/Certificate');
const PressNote = require('../models/PressNote');

const router = express.Router();

router.get('/pending', auth, permit('admin', 'super_admin'), async (req, res) => {
  const pending = await Participation.find({ status: 'pending' }).populate('student event');
  res.json(pending);
});

router.post('/participation/:id/approve', auth, permit('admin', 'super_admin'), async (req, res) => {
  const participation = await Participation.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
  if (!participation) return res.status(404).json({ message: 'Participation not found' });
  res.json({ message: 'Approved', participation });
});

router.post('/participation/:id/reject', auth, permit('admin', 'super_admin'), async (req, res) => {
  const participation = await Participation.findByIdAndUpdate(req.params.id, { status: 'rejected' }, { new: true });
  if (!participation) return res.status(404).json({ message: 'Participation not found' });
  res.json({ message: 'Rejected', participation });
});

router.post('/certificate/:id/verify', auth, permit('admin', 'super_admin'), async (req, res) => {
  const certificate = await Certificate.findByIdAndUpdate(req.params.id, { verified: true }, { new: true });
  if (!certificate) return res.status(404).json({ message: 'Certificate not found' });
  res.json({ message: 'Certificate verified', certificate });
});

// press note generation
router.post('/press-note/:participationId', auth, permit('admin', 'super_admin'), async (req, res) => {
  const { text } = req.body;
  const participation = await Participation.findById(req.params.participationId).populate('student event');
  if (!participation) return res.status(404).json({ message: 'Participation not found' });

  const pressNoteText = text || `Press Note: ${participation.student.name} from ${participation.student.department} has ${participation.participationType} at ${participation.event.eventName} (${participation.event.eventType}) on ${participation.event.eventDate.toDateString()}.`;

  const pressNote = new PressNote({
    student: participation.student._id,
    participation: participation._id,
    text: pressNoteText
  });
  await pressNote.save();

  res.status(201).json({ message: 'Press note generated', pressNote });
});

module.exports = router;
