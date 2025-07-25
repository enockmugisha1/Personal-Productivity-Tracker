const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// ✅ Create a Goal
router.post('/', auth, async (req, res) => {
  try {
    const goalData = {
      ...req.body,
      user: req.user
    };
    
    const goal = await Goal.create(goalData);
    res.status(201).json(goal);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get all Goals for logged-in user with filtering and sorting
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, category, sort = '-createdAt', limit = 50 } = req.query;
    
    // Build filter object
    const filter = { user: req.user };
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = new RegExp(category, 'i');
    
    const goals = await Goal.find(filter)
      .sort(sort)
      .limit(parseInt(limit))
      .populate('user', 'displayName email');
    
    res.json(goals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get goals with notification alerts
router.get('/notifications', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user });
    
    const notifications = {
      overdue: goals.filter(goal => goal.isOverdue),
      dueSoon: goals.filter(goal => goal.isDueSoon),
      needingReminder: goals.filter(goal => goal.needsReminder()),
      completedRecently: goals.filter(goal => {
        if (goal.status !== 'completed') return false;
        const daysSinceCompletion = Math.ceil((new Date() - new Date(goal.updatedAt)) / (1000 * 60 * 60 * 24));
        return daysSinceCompletion <= 7;
      })
    };
    
    res.json({
      counts: {
        overdue: notifications.overdue.length,
        dueSoon: notifications.dueSoon.length,
        needingReminder: notifications.needingReminder.length,
        completedRecently: notifications.completedRecently.length
      },
      details: notifications
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get goal statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user });
    
    const stats = {
      total: goals.length,
      completed: goals.filter(g => g.status === 'completed').length,
      inProgress: goals.filter(g => g.status === 'in_progress').length,
      notStarted: goals.filter(g => g.status === 'not_started').length,
      overdue: goals.filter(g => g.isOverdue).length,
      dueSoon: goals.filter(g => g.isDueSoon).length,
      averageProgress: goals.length > 0 ? 
        Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length) : 0,
      byPriority: {
        high: goals.filter(g => g.priority === 'high').length,
        medium: goals.filter(g => g.priority === 'medium').length,
        low: goals.filter(g => g.priority === 'low').length
      },
      byCategory: goals.reduce((acc, goal) => {
        acc[goal.category] = (acc[goal.category] || 0) + 1;
        return acc;
      }, {})
    };
    
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get a single Goal with full details
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user })
      .populate('user', 'displayName email');
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Add computed fields
    const goalData = goal.toObject({ virtuals: true });
    goalData.daysUntilDue = goal.getDaysUntilDue();
    goalData.milestoneProgress = goal.getMilestoneProgress();
    
    res.json(goalData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update a Goal
router.patch('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, user: req.user }, 
      req.body, 
      { new: true, runValidators: true }
    );
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal);
  } catch (err) {
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(e => e.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update goal progress
router.patch('/:id/progress', auth, async (req, res) => {
  try {
    const { progress, note } = req.body;
    
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: 'Progress must be between 0 and 100' });
    }
    
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    const oldProgress = goal.progress;
    goal.progress = progress;
    
    // Add custom note to progress history if provided
    if (note) {
      goal.progressHistory.push({
        progress,
        note
      });
    }
    
    // Check for achievements
    if (progress === 100 && oldProgress < 100) {
      await goal.addAchievement('goal_completed', 'Goal Completed!', `Congratulations on completing "${goal.title}"`);
    } else if (progress >= 50 && oldProgress < 50) {
      await goal.addAchievement('progress_streak', 'Halfway There!', `You've reached 50% progress on "${goal.title}"`);
    }
    
    await goal.save();
    res.json(goal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Add milestone to goal
router.post('/:id/milestones', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    goal.milestones.push(req.body);
    await goal.save();
    
    res.status(201).json(goal.milestones[goal.milestones.length - 1]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update milestone
router.patch('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) {
      return res.status(404).json({ message: 'Milestone not found' });
    }
    
    // If marking as completed, add achievement
    if (req.body.completed && !milestone.completed) {
      milestone.completedAt = new Date();
      await goal.addAchievement('milestone_completed', 'Milestone Achieved!', 
        `Completed milestone "${milestone.title}" for goal "${goal.title}"`);
    }
    
    Object.assign(milestone, req.body);
    await goal.save();
    
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete milestone
router.delete('/:id/milestones/:milestoneId', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    goal.milestones.id(req.params.milestoneId).remove();
    await goal.save();
    
    res.json({ message: 'Milestone deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Get goal achievements
router.get('/:id/achievements', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    res.json(goal.achievements);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete a Goal
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.json({ message: 'Goal deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
