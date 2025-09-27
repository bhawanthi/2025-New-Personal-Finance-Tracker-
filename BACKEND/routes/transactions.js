const express = require('express');
const router = express.Router();
const {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
} = require('../controllers/transactionController');

// Create auth middleware (we'll create this next)
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

// @route   GET /api/transactions
// @desc    Get all transactions for a user
// @access  Private
router.get('/', authMiddleware, getTransactions);

// @route   POST /api/transactions
// @desc    Add new transaction
// @access  Private
router.post('/', authMiddleware, addTransaction);

// @route   PUT /api/transactions/:id
// @desc    Update transaction
// @access  Private
router.put('/:id', authMiddleware, updateTransaction);

// @route   DELETE /api/transactions/:id
// @desc    Delete transaction
// @access  Private
router.delete('/:id', authMiddleware, deleteTransaction);

// @route   GET /api/transactions/stats
// @desc    Get transaction statistics
// @access  Private
router.get('/stats', authMiddleware, getTransactionStats);

module.exports = router;