const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// ✅ Create a Goal
router.post('/', auth, async (req, res) => {
  const { title, description, dueDate } = req.body;
  try {
    const goal = await Goal.create({ user: req.user, title, description, dueDate });
    res.status(201).json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all Goals for logged-in user
router.get('/', auth, async (req, res) => {
  const goals = await Goal.find({ user: req.user });
  res.json(goals);
});

// ✅ Get a single Goal
router.get('/:id', auth, async (req, res) => {
  const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json(goal);
});

// ✅ Update a Goal
router.patch('/:id', auth, async (req, res) => {
  const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user }, req.body, { new: true });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json(goal);
});

// ✅ Delete a Goal
router.delete('/:id', auth, async (req, res) => {
  const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user });
  if (!goal) return res.status(404).json({ message: 'Goal not found' });
  res.json({ message: 'Goal deleted' });
});

module.exports = router;