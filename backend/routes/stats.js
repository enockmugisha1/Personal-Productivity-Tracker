const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Task = require('../models/Task');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const Note = require('../models/Note');

// @route   GET /api/stats
// @desc    Get user-specific application statistics
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user;

    const totalTasks = await Task.countDocuments({ user: userId });
    const completedTasks = await Task.countDocuments({ user: userId, status: 'completed' });
    const activeGoals = await Goal.countDocuments({ user: userId, status: 'active' });
    const activeHabits = await Habit.countDocuments({ user: userId }); // Assuming all fetched are active
    const totalNotes = await Note.countDocuments({ user: userId });

    const stats = {
      totalTasks,
      completedTasks,
      activeGoals,
      activeHabits,
      totalNotes,
    };
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error while fetching stats' });
  }
});

module.exports = router; 