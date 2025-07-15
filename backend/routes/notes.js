const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const auth = require('../middleware/auth');

// ✅ Create Note
router.post('/', auth, async (req, res) => {
  const { title, content, category, goal, habit } = req.body;
  try {
    const note = await Note.create({
      user: req.user._id,
      title,
      content,
      category,
      goal,
      habit
    });
    res.status(201).json(note);
  } catch (error) {
    console.error("Error creating note:", error);
    res.status(500).json({ message: "Failed to create note", error: error.message });
  }
});

// ✅ Get All Notes
router.get('/', auth, async (req, res) => {
  const notes = await Note.find({ user: req.user });
  res.json(notes);
});

// ✅ Update Note
router.put('/:id', auth, async (req, res) => {
  const note = await Note.findOneAndUpdate({ _id: req.params.id, user: req.user }, req.body, { new: true });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json(note);
});

// ✅ Delete Note
router.delete('/:id', auth, async (req, res) => {
  const note = await Note.findOneAndDelete({ _id: req.params.id, user: req.user });
  if (!note) return res.status(404).json({ message: 'Note not found' });
  res.json({ message: 'Note deleted' });
});

module.exports = router;