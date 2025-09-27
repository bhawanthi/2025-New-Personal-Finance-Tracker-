const express = require('express');
const router = express.Router();
const {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
  markAlertsAsRead
} = require('../controllers/budgetController');

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

// @route   GET /api/budgets
// @desc    Get all budgets for a user
// @access  Private
router.get('/', authMiddleware, getBudgets);

// @route   POST /api/budgets
// @desc    Create new budget
// @access  Private
router.post('/', authMiddleware, createBudget);

// @route   PUT /api/budgets/:id
// @desc    Update budget
// @access  Private
router.put('/:id', authMiddleware, updateBudget);

// @route   DELETE /api/budgets/:id
// @desc    Delete budget
// @access  Private
router.delete('/:id', authMiddleware, deleteBudget);

// @route   GET /api/budgets/:budgetId/analytics
// @desc    Get budget analytics
// @access  Private
router.get('/:budgetId/analytics', authMiddleware, getBudgetAnalytics);

// @route   POST /api/budgets/:budgetId/alerts/read
// @desc    Mark alerts as read
// @access  Private
router.post('/:budgetId/alerts/read', authMiddleware, markAlertsAsRead);

module.exports = router;