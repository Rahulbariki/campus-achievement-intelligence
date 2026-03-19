const express = require('express');
const auth = require('../middleware/auth');
const permit = require('../middleware/roles');
const Event = require('../models/Event');
const Participation = require('../models/Participation');
const Certificate = require('../models/Certificate');

const router = express.Router();

// Student submits event participation
router.post('/submit', auth, permit('student'), async (req, res) => {
  const { eventName, organizer, eventType, eventDate, location, participationType, certificateUrl } = req.body;
  try {
    const event = await Event.findOneAndUpdate(
      { eventName, eventDate },
      { eventName, organizer, eventType, eventDate, location },
      { upsert: true, new: true }
    );

    const participation = new Participation({
      student: req.user._id,
      event: event._id,
      participationType,
      status: 'pending',
      score: participationType === 'Winner' ? 50 : participationType === 'Runner-Up' ? 30 : participationType === 'Finalist' ? 25 : 10
    });
    await participation.save();

    if (certificateUrl) {
      await new Certificate({
        student: req.user._id,
        participation: participation._id,
        fileUrl: certificateUrl,
        verified: false
      }).save();
    }

    res.status(201).json({ message: 'Participation submitted', participation });
  } catch (err) {
    res.status(500).json({ message: 'Submission failed', error: err.message });
  }
});

// Student view own history
router.get('/me', auth, permit('student'), async (req, res) => {
  const participations = await Participation.find({ student: req.user._id }).populate('event').exec();
  res.json({ student: req.user, participations });
});

module.exports = router;
