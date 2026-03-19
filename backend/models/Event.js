const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  organizer: { type: String, required: true },
  eventType: { type: String, enum: ['Hackathon', 'Workshop', 'Seminar', 'Coding Contest', 'Other'], default: 'Other' },
  eventDate: { type: Date, required: true },
  location: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Event', eventSchema);
