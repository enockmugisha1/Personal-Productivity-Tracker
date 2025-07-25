const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const Goal = require('../models/Goal');
const Habit = require('../models/Habit');
const auth = require('../middleware/auth');

// 📱 Get notification counts and details for dashboard
router.get('/', auth, async (req, res) => {
  try {
    const now = new Date();
    
    // Get all user's tasks, goals, and habits
    const [tasks, goals, habits] = await Promise.all([
      Task.find({ user: req.user, completed: { $ne: true } }),
      Goal.find({ user: req.user, status: { $in: ['not_started', 'in_progress'] } }),
      Habit.find({ user: req.user })
    ]);
    
    // Calculate task notifications
    const overdueTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      return new Date(task.dueDate) < now;
    });
    
    const dueSoonTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 3 && daysUntilDue > 0;
    });
    
    // Calculate goal notifications
    const goalDeadlines = goals.filter(goal => {
      const daysUntilDue = goal.getDaysUntilDue();
      return (daysUntilDue <= 7 && daysUntilDue > 0) || daysUntilDue < 0;
    });
    
    // Calculate habit reminders (habits that haven't been logged today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const habitReminders = habits.filter(habit => {
      // Check if habit was logged today
      const todayLog = habit.logs?.find(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });
      return !todayLog;
    });
    
    // Get high-priority tasks and goals
    const urgentTasks = tasks.filter(task => {
      if (!task.dueDate) return false;
      const daysUntilDue = Math.ceil((new Date(task.dueDate) - now) / (1000 * 60 * 60 * 24));
      return daysUntilDue <= 1;
    });
    
    const highPriorityGoals = goals.filter(goal => 
      goal.priority === 'high' && goal.progress < 100
    );
    
    // Get recent achievements
    const recentAchievements = goals.reduce((acc, goal) => {
      const recent = goal.achievements?.filter(achievement => {
        const daysSince = Math.ceil((now - new Date(achievement.earnedAt)) / (1000 * 60 * 60 * 24));
        return daysSince <= 7;
      }) || [];
      return acc.concat(recent.map(achievement => ({
        ...achievement.toObject(),
        goalTitle: goal.title
      })));
    }, []);
    
    // Calculate progress insights
    const goalsWithProgress = goals.filter(goal => goal.progress > 0);
    const averageProgress = goalsWithProgress.length > 0 
      ? Math.round(goalsWithProgress.reduce((sum, goal) => sum + goal.progress, 0) / goalsWithProgress.length)
      : 0;
    
    const completionRate = tasks.length > 0
      ? Math.round((tasks.filter(task => task.completed).length / tasks.length) * 100)
      : 0;
    
    const response = {
      counts: {
        overdueTasks: overdueTasks.length,
        dueSoonTasks: dueSoonTasks.length,
        goalDeadlines: goalDeadlines.length,
        habitReminders: habitReminders.length,
        urgentTasks: urgentTasks.length,
        highPriorityGoals: highPriorityGoals.length,
        recentAchievements: recentAchievements.length
      },
      details: {
        overdueTasks: overdueTasks.slice(0, 5), // Limit to 5 for dashboard
        dueSoonTasks: dueSoonTasks.slice(0, 5),
        goalDeadlines: goalDeadlines.slice(0, 5),
        habitReminders: habitReminders.slice(0, 5),
        urgentTasks: urgentTasks.slice(0, 3),
        highPriorityGoals: highPriorityGoals.slice(0, 3),
        recentAchievements: recentAchievements.slice(0, 5)
      },
      insights: {
        averageGoalProgress: averageProgress,
        taskCompletionRate: completionRate,
        totalActiveItems: tasks.length + goals.length,
        streak: {
          tasks: await calculateTaskStreak(req.user),
          habits: await calculateHabitStreak(req.user, habits)
        }
      },
      summary: generateNotificationSummary({
        overdueTasks: overdueTasks.length,
        dueSoonTasks: dueSoonTasks.length,
        goalDeadlines: goalDeadlines.length,
        habitReminders: habitReminders.length,
        recentAchievements: recentAchievements.length
      })
    };
    
    res.json(response);
  } catch (err) {
    console.error('Notifications error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 🎯 Mark notification as read/dismissed
router.post('/dismiss', auth, async (req, res) => {
  try {
    const { type, itemId } = req.body;
    
    // In a real app, you'd store dismissal state in user preferences
    // For now, we'll just acknowledge the request
    
    res.json({ 
      message: `${type} notification dismissed`,
      dismissedAt: new Date()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 📊 Get notification preferences
router.get('/preferences', auth, async (req, res) => {
  try {
    // In a real app, you'd fetch from user preferences
    const defaultPreferences = {
      email: {
        dailyReminders: true,
        weeklyReports: true,
        goalDeadlines: true,
        taskReminders: true,
        habitReminders: true,
        achievements: true
      },
      push: {
        urgentTasks: true,
        goalDeadlines: true,
        habitReminders: false,
        achievements: true
      },
      frequency: {
        reminderTime: '08:00',
        reportDay: 'sunday',
        snoozeMinutes: 30
      }
    };
    
    res.json(defaultPreferences);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ⚙️ Update notification preferences
router.patch('/preferences', auth, async (req, res) => {
  try {
    // In a real app, you'd save to user preferences collection
    const preferences = req.body;
    
    res.json({ 
      message: 'Preferences updated successfully',
      preferences 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to calculate task completion streak
async function calculateTaskStreak(userId) {
  try {
    const tasks = await Task.find({ 
      user: userId, 
      completed: true 
    }).sort({ completedAt: -1 });
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const task of tasks) {
      if (!task.completedAt) break;
      
      const taskDate = new Date(task.completedAt);
      taskDate.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.ceil((currentDate - taskDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === streak) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    return streak;
  } catch (error) {
    return 0;
  }
}

// Helper function to calculate habit streak
async function calculateHabitStreak(userId, habits) {
  try {
    let maxStreak = 0;
    
    for (const habit of habits) {
      if (!habit.logs || habit.logs.length === 0) continue;
      
      const sortedLogs = habit.logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      let currentStreak = 0;
      let expectedDate = new Date();
      expectedDate.setHours(0, 0, 0, 0);
      
      for (const log of sortedLogs) {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        
        if (logDate.getTime() === expectedDate.getTime()) {
          currentStreak++;
          expectedDate.setDate(expectedDate.getDate() - 1);
        } else {
          break;
        }
      }
      
      maxStreak = Math.max(maxStreak, currentStreak);
    }
    
    return maxStreak;
  } catch (error) {
    return 0;
  }
}

// Helper function to generate notification summary
function generateNotificationSummary(counts) {
  const messages = [];
  
  if (counts.overdueTasks > 0) {
    messages.push(`${counts.overdueTasks} overdue task${counts.overdueTasks > 1 ? 's' : ''}`);
  }
  
  if (counts.dueSoonTasks > 0) {
    messages.push(`${counts.dueSoonTasks} task${counts.dueSoonTasks > 1 ? 's' : ''} due soon`);
  }
  
  if (counts.goalDeadlines > 0) {
    messages.push(`${counts.goalDeadlines} goal deadline${counts.goalDeadlines > 1 ? 's' : ''} approaching`);
  }
  
  if (counts.habitReminders > 0) {
    messages.push(`${counts.habitReminders} habit${counts.habitReminders > 1 ? 's' : ''} to complete today`);
  }
  
  if (counts.recentAchievements > 0) {
    messages.push(`🎉 ${counts.recentAchievements} recent achievement${counts.recentAchievements > 1 ? 's' : ''}!`);
  }
  
  if (messages.length === 0) {
    return "All caught up! Great work! 🌟";
  }
  
  if (messages.length === 1) {
    return messages[0];
  }
  
  const lastMessage = messages.pop();
  return messages.join(', ') + ', and ' + lastMessage;
}

module.exports = router;
