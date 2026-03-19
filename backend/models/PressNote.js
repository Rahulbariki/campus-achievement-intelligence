const mongoose = require('mongoose');

const pressNoteSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  participation: { type: mongoose.Schema.Types.ObjectId, ref: 'Participation', required: true },
  text: { type: String, required: true },
  generatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('PressNote', pressNoteSchema);
