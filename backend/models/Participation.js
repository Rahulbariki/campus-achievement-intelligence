const mongoose = require('mongoose');

const participationSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  participationType: { type: String, enum: ['Participant', 'Finalist', 'Runner-Up', 'Winner'], default: 'Participant' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  score: { type: Number, default: 10 },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Participation', participationSchema);
