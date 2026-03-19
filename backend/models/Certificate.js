const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participation: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation', required: true },
  fileUrl: { type: String, required: true },
  verified: { type: Boolean, default: false },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Certificate', certificateSchema);
