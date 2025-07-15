const { validationResult, body } = require('express-validator');

// Middleware to check for validation errors
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Validation rules for user registration
const registerValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
    .matches(/\d/)
    .withMessage('Password must contain a number'),
  body('displayName')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Display name must be at least 2 characters long'),
  validateRequest
];

// Validation rules for login
const loginValidation = [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validateRequest
];

// Validation rules for goals
const goalValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  validateRequest
];

// Validation rules for tasks
const taskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title must be less than 100 characters'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format'),
  body('goalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid goal ID'),
  validateRequest
];

// Validation rules for habits
const habitValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Habit name is required')
    .isLength({ max: 100 })
    .withMessage('Habit name must be less than 100 characters'),
  body('frequency')
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency must be daily, weekly, or monthly'),
  validateRequest
];

// Validation rules for notes
const noteValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Content is required')
    .isLength({ max: 1000 })
    .withMessage('Note must be less than 1000 characters'),
  body('goalId')
    .optional()
    .isMongoId()
    .withMessage('Invalid goal ID'),
  body('habitId')
    .optional()
    .isMongoId()
    .withMessage('Invalid habit ID'),
  validateRequest
];

module.exports = {
  registerValidation,
  loginValidation,
  goalValidation,
  taskValidation,
  habitValidation,
  noteValidation
}; 
