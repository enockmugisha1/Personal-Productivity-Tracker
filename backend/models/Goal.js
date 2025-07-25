const mongoose = require('mongoose');

const MilestoneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  targetDate: Date,
  completed: {
    type: Boolean,
    default: false
  },
  completedAt: Date
}, { timestamps: true });

const GoalSchema = new mongoose.Schema({
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Goal title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    trim: true,
    default: 'Personal'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'paused', 'cancelled'],
    default: 'not_started'
  },
  dueDate: {
    type: Date,
    required: [true, 'Due date is required']
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  progress: { 
    type: Number, 
    default: 0,
    min: 0,
    max: 100
  },
  milestones: [MilestoneSchema],
  tags: [{
    type: String,
    trim: true
  }],
  // Notification settings
  notifications: {
    enabled: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 3 // Days before due date to send reminder
    },
    milestoneReminders: {
      type: Boolean,
      default: true
    }
  },
  // Progress tracking
  progressHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    progress: {
      type: Number,
      required: true
    },
    note: String
  }],
  lastProgressUpdate: {
    type: Date,
    default: Date.now
  },
  // Achievement tracking
  achievements: [{
    type: {
      type: String,
      enum: ['milestone_completed', 'progress_streak', 'goal_completed']
    },
    title: String,
    description: String,
    earnedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Pre-save middleware to update status based on progress
GoalSchema.pre('save', function(next) {
  if (this.progress >= 100 && this.status !== 'completed') {
    this.status = 'completed';
  } else if (this.progress > 0 && this.status === 'not_started') {
    this.status = 'in_progress';
  }
  
  // Update lastProgressUpdate if progress changed
  if (this.isModified('progress')) {
    this.lastProgressUpdate = new Date();
    
    // Add to progress history
    this.progressHistory.push({
      progress: this.progress,
      note: `Progress updated to ${this.progress}%`
    });
    
    // Keep only last 50 progress history entries
    if (this.progressHistory.length > 50) {
      this.progressHistory = this.progressHistory.slice(-50);
    }
  }
  
  next();
});

// Method to calculate days until due
GoalSchema.methods.getDaysUntilDue = function() {
  const now = new Date();
  const due = new Date(this.dueDate);
  const diffTime = due.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Method to check if goal needs reminder
GoalSchema.methods.needsReminder = function() {
  if (!this.notifications.enabled || this.status === 'completed') {
    return false;
  }
  
  const daysUntilDue = this.getDaysUntilDue();
  return daysUntilDue <= this.notifications.reminderDays && daysUntilDue > 0;
};

// Method to get completion percentage of milestones
GoalSchema.methods.getMilestoneProgress = function() {
  if (this.milestones.length === 0) return 0;
  const completedMilestones = this.milestones.filter(m => m.completed).length;
  return Math.round((completedMilestones / this.milestones.length) * 100);
};

// Method to add achievement
GoalSchema.methods.addAchievement = function(type, title, description) {
  this.achievements.push({ type, title, description });
  return this.save();
};

// Virtual for overdue status
GoalSchema.virtual('isOverdue').get(function() {
  return this.getDaysUntilDue() < 0 && this.status !== 'completed';
});

// Virtual for due soon status
GoalSchema.virtual('isDueSoon').get(function() {
  const days = this.getDaysUntilDue();
  return days <= 7 && days > 0 && this.status !== 'completed';
});

module.exports = mongoose.model('Goal', GoalSchema);
