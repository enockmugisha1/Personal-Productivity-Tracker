const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const Goal = require('../models/Goal');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Enhanced email template for notifications
const createEmailTemplate = (type, items, user) => {
  const templates = {
    tasks: {
      subject: `📋 Task Reminders - ${items.length} items need your attention`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Hello ${user.displayName || user.email}! 👋</h2>
          <p>You have <strong>${items.length}</strong> task(s) that need your attention:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${items.map(task => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #3b82f6;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">${task.title}</h3>
                <p style="margin: 5px 0; color: #6b7280;">${task.description || 'No description'}</p>
                <p style="margin: 5px 0; font-weight: bold; color: #dc2626;">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
            `).join('')}
          </div>
          <p>Stay productive! 🚀</p>
        </div>
      `
    },
    goals: {
      subject: `🎯 Goal Reminders - Keep pushing towards your objectives!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #059669;">Hello ${user.displayName || user.email}! 🌟</h2>
          <p>Don't forget about your important goals:</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${items.map(goal => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #10b981;">
                <h3 style="margin: 0 0 10px 0; color: #047857;">${goal.title}</h3>
                <div style="background: #e5e7eb; height: 10px; border-radius: 5px; margin: 10px 0;">
                  <div style="background: #10b981; height: 100%; width: ${goal.progress}%; border-radius: 5px;"></div>
                </div>
                <p style="margin: 5px 0; color: #6b7280;">Progress: ${goal.progress}%</p>
                <p style="margin: 5px 0; font-weight: bold; color: ${goal.getDaysUntilDue() < 0 ? '#dc2626' : '#f59e0b'};">Due: ${new Date(goal.dueDate).toLocaleDateString()}</p>
              </div>
            `).join('')}
          </div>
          <p>You've got this! Keep making progress! 💪</p>
        </div>
      `
    },
    habits: {
      subject: `🔥 Habit Reminders - Keep your streak alive!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #7c3aed;">Hello ${user.displayName || user.email}! ⚡</h2>
          <p>Time to maintain your positive habits:</p>
          <div style="background: #faf5ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
            ${items.map(habit => `
              <div style="background: white; padding: 15px; margin: 10px 0; border-radius: 6px; border-left: 4px solid #8b5cf6;">
                <h3 style="margin: 0 0 10px 0; color: #6d28d9;">${habit.name}</h3>
                <p style="margin: 5px 0; color: #6b7280;">${habit.description || 'Keep building this habit!'}</p>
              </div>
            `).join('')}
          </div>
          <p>Consistency is key! 🗝️</p>
        </div>
      `
    }
  };
  
  return templates[type];
};

const sendReminders = async () => {
  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const nextDay = new Date(tomorrow.getTime() + 86400000);

    // Find users who need reminders
    const users = await User.find({});
    
    for (const user of users) {
      const reminders = {
        tasks: [],
        goals: [],
        habits: []
      };
      
      // Find overdue and due soon tasks
      const tasks = await Task.find({ 
        user: user._id,
        completed: { $ne: true },
        $or: [
          { dueDate: { $gte: tomorrow, $lt: nextDay } }, // Due tomorrow
          { dueDate: { $lt: now } } // Overdue
        ]
      });
      
      // Find goals that need reminders
      const goals = await Goal.find({ 
        user: user._id,
        status: { $in: ['not_started', 'in_progress'] }
      });
      
      const goalReminders = goals.filter(goal => {
        const daysUntilDue = goal.getDaysUntilDue();
        return (daysUntilDue <= 3 && daysUntilDue > 0) || daysUntilDue < 0; // Due soon or overdue
      });
      
      // Find habits that need daily reminders
      const habits = await Habit.find({ user: user._id });
      
      // Send task reminders
      if (tasks.length > 0) {
        const template = createEmailTemplate('tasks', tasks, user);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: template.subject,
          html: template.html
        });
        console.log(`Sent task reminders to ${user.email} for ${tasks.length} tasks`);
      }
      
      // Send goal reminders
      if (goalReminders.length > 0) {
        const template = createEmailTemplate('goals', goalReminders, user);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: template.subject,
          html: template.html
        });
        console.log(`Sent goal reminders to ${user.email} for ${goalReminders.length} goals`);
      }
      
      // Send habit reminders (only on specific days or if user opts in)
      if (habits.length > 0 && now.getDay() !== 0) { // Skip Sundays for habit reminders
        const template = createEmailTemplate('habits', habits, user);
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: template.subject,
          html: template.html
        });
        console.log(`Sent habit reminders to ${user.email} for ${habits.length} habits`);
      }
    }
  } catch (error) {
    console.error('Error sending reminders:', error);
  }
};

// Send weekly progress summary
const sendWeeklyProgress = async () => {
  try {
    const users = await User.find({});
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    
    for (const user of users) {
      // Get user's progress this week
      const completedTasks = await Task.countDocuments({
        user: user._id,
        completed: true,
        completedAt: { $gte: oneWeekAgo }
      });
      
      const completedGoals = await Goal.countDocuments({
        user: user._id,
        status: 'completed',
        updatedAt: { $gte: oneWeekAgo }
      });
      
      const goalsInProgress = await Goal.find({
        user: user._id,
        status: 'in_progress'
      });
      
      const averageProgress = goalsInProgress.length > 0 ?
        Math.round(goalsInProgress.reduce((sum, goal) => sum + goal.progress, 0) / goalsInProgress.length) : 0;
      
      if (completedTasks > 0 || completedGoals > 0 || goalsInProgress.length > 0) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: user.email,
          subject: '📊 Your Weekly Progress Summary',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">Weekly Progress Report 📈</h2>
              <p>Hello ${user.displayName || user.email}!</p>
              <p>Here's what you accomplished this week:</p>
              
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span>✅ Tasks Completed:</span>
                  <strong>${completedTasks}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span>🎯 Goals Completed:</span>
                  <strong>${completedGoals}</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span>🚀 Average Goal Progress:</span>
                  <strong>${averageProgress}%</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin: 10px 0;">
                  <span>🎯 Active Goals:</span>
                  <strong>${goalsInProgress.length}</strong>
                </div>
              </div>
              
              <p>Keep up the great work! 🌟</p>
            </div>
          `
        });
        console.log(`Sent weekly progress to ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error sending weekly progress:', error);
  }
};

// Schedule reminders and reports
const scheduleReminders = () => {
  // Daily reminders at 8 AM
  cron.schedule('0 8 * * *', sendReminders);
  
  // Weekly progress report on Sundays at 6 PM
  cron.schedule('0 18 * * 0', sendWeeklyProgress);
  
  console.log('📅 Reminder system initialized:');
  console.log('  ⏰ Daily reminders: 8:00 AM');
  console.log('  📊 Weekly reports: Sundays 6:00 PM');
};

module.exports = scheduleReminders;
