const express = require('express');
const router = express.Router();
const {
  getGoals,
  createGoal,
  updateGoal,
  addContribution,
  deleteGoal,
  getGoalAnalytics
} = require('../controllers/goalController');

// Auth middleware
const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// @route   GET /api/goals
// @desc    Get all goals for a user
// @access  Private
router.get('/', authMiddleware, getGoals);

// @route   POST /api/goals
// @desc    Create new goal
// @access  Private
router.post('/', authMiddleware, createGoal);

// @route   PUT /api/goals/:id
// @desc    Update goal
// @access  Private
router.put('/:id', authMiddleware, updateGoal);

// @route   POST /api/goals/:id/contribute
// @desc    Add contribution to goal
// @access  Private
router.post('/:id/contribute', authMiddleware, addContribution);

// @route   GET /api/goals/:id/analysis
// @desc    Get AI analysis for a specific goal
// @access  Private
router.get('/:id/analysis', authMiddleware, getGoalAnalytics);

// @route   DELETE /api/goals/:id
// @desc    Delete goal
// @access  Private
router.delete('/:id', authMiddleware, deleteGoal);

// @route   GET /api/goals/analytics
// @desc    Get goal analytics
// @access  Private
router.get('/analytics', authMiddleware, getGoalAnalytics);

module.exports = router;