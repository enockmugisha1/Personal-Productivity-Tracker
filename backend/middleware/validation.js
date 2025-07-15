const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: 'error',
        message: error.details[0].message
      });
    }
    next();
  };
};

// Common validation schemas
const schemas = {
  task: {
    create: {
      title: { type: 'string', required: true, min: 1, max: 200 },
      description: { type: 'string', max: 1000 },
      dueDate: { type: 'date' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      status: { type: 'string', enum: ['todo', 'in_progress', 'completed'] }
    },
    update: {
      title: { type: 'string', min: 1, max: 200 },
      description: { type: 'string', max: 1000 },
      dueDate: { type: 'date' },
      priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      status: { type: 'string', enum: ['todo', 'in_progress', 'completed'] }
    }
  },
  goal: {
    create: {
      title: { type: 'string', required: true, min: 1, max: 200 },
      description: { type: 'string', max: 1000 },
      dueDate: { type: 'date' },
      category: { type: 'string', max: 50 },
      status: { type: 'string', enum: ['not_started', 'in_progress', 'completed'] }
    }
  },
  habit: {
    create: {
      name: { type: 'string', required: true, min: 1, max: 200 },
      frequency: { type: 'string', required: true, enum: ['daily', 'weekly', 'monthly'] },
      reminder: { type: 'boolean' },
      reminderTime: { type: 'string', pattern: '^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$' }
    }
  },
  note: {
    create: {
      content: { type: 'string', required: true, max: 5000 },
      title: { type: 'string', max: 200 },
      tags: { type: 'array', items: { type: 'string', max: 50 } }
    }
  }
};

module.exports = {
  validateRequest,
  schemas
}; 
