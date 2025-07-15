const express = require('express');
const router = express.Router();
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// ✅ Create Habit
router.post('/', auth, async (req, res) => {
  const { name, description, frequency } = req.body;
  const habit = await Habit.create({ user: req.user, name, description, frequency });
  res.status(201).json(habit);
});

// ✅ Get All Habits
router.get('/', auth, async (req, res) => {
  const habits = await Habit.find({ user: req.user });
  res.json(habits);
});

// ✅ Mark Habit Complete (update streak)
router.post('/:id/complete', auth, async (req, res) => {
  const habit = await Habit.findOne({ _id: req.params.id, user: req.user });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });

  const today = new Date().setHours(0, 0, 0, 0);
  const last = habit.lastCompleted ? new Date(habit.lastCompleted).setHours(0, 0, 0, 0) : null;

  if (!last || today - last > 86400000) {
    habit.streak = 1;
  } else if (today - last === 86400000) {
    habit.streak += 1;
  }
  habit.lastCompleted = new Date();
  await habit.save();

  res.json(habit);
});

// ✅ Update Habit
router.put('/:id', auth, async (req, res) => {
  const habit = await Habit.findOneAndUpdate({ _id: req.params.id, user: req.user }, req.body, { new: true });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });
  res.json(habit);
});

// ✅ Delete Habit
router.delete('/:id', auth, async (req, res) => {
  const habit = await Habit.findOneAndDelete({ _id: req.params.id, user: req.user });
  if (!habit) return res.status(404).json({ message: 'Habit not found' });
  res.json({ message: 'Habit deleted' });
});

module.exports = router;