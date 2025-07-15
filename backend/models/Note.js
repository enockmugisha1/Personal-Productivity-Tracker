const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true
  },
  content: {
    type: String,
    required: [true, 'Note content is required']
  },
  category: {
    type: String,
    trim: true,
    default: 'General' // Optional: provide a default category
  },
  goal: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Goal' 
  }, // Optional
  habit: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Habit' 
  } // Optional
}, {
  timestamps: true // Automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('Note', NoteSchema);
