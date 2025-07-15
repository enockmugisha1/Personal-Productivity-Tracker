const mongoose = require('mongoose');
const HabitSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  description: String,
  frequency: String,
  streak: { type: Number, default: 0 },
  lastCompleted: Date
}, {
  timestamps: true
});
module.exports = mongoose.model('Habit', HabitSchema);
