const cron = require('node-cron');
const nodemailer = require('nodemailer');
const Task = require('../models/Task');
const Habit = require('../models/Habit');
const User = require('../models/User');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const sendReminders = async () => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const tasks = await Task.find({ dueDate: { $gte: tomorrow, $lt: new Date(tomorrow.getTime() + 86400000) } }).populate('user');
  const habits = await Habit.find({}).populate('user');

  tasks.forEach(task => {
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: task.user.email,
      subject: `Reminder: Task "${task.title}" is due tomorrow!`,
      text: `Don't forget to complete your task: ${task.title}.\nDescription: ${task.description}`
    });
  });

  habits.forEach(habit => {
    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: habit.user.email,
      subject: `Reminder: Stay on track with your habit "${habit.name}"`,
      text: `Keep your streak going for the habit: ${habit.name}`
    });
  });
};

// Run the reminder check daily at 8 AM
const scheduleReminders = () => {
  cron.schedule('0 8 * * *', sendReminders); // every day at 8 AM
};

module.exports = scheduleReminders;