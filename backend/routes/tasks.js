const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');

// ✅ Create Task
router.post('/', auth, async (req, res) => {
  const { title, description, goal, dueDate } = req.body;
  const task = await Task.create({ user: req.user, title, description, goal, dueDate });
  res.status(201).json(task);
});

// ✅ Get All Tasks
router.get('/', auth, async (req, res) => {
  const tasks = await Task.find({ user: req.user });
  res.json(tasks);
});

// ✅ Mark Task as Complete
router.patch('/:id/complete', auth, async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user }, { completed: true }, { new: true });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

// ✅ Update Task
router.patch('/:id', auth, async (req, res) => {
  const task = await Task.findOneAndUpdate({ _id: req.params.id, user: req.user }, req.body, { new: true });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json(task);
});

// ✅ Delete Task
router.delete('/:id', auth, async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ message: 'Task deleted' });
});

module.exports = router;