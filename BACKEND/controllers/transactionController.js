const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// Get all transactions for a user
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category, startDate, endDate } = req.query;
    const userId = req.user.id;

    // Build filter object
    let filter = { userId };
    
    if (type) filter.type = type;
    if (category) filter.category = category;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter)
      .sort({ date: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Transaction.countDocuments(filter);

    res.json({
      transactions,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      totalTransactions: total
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add new transaction
const addTransaction = async (req, res) => {
  try {
    const {
      type,
      amount,
      category,
      subcategory,
      description,
      date,
      recurring,
      tags,
      paymentMethod
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!type || !amount || !category || !description) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Create transaction
    const transaction = new Transaction({
      userId,
      type,
      amount: parseFloat(amount),
      category,
      subcategory: subcategory || '',
      description,
      date: date ? new Date(date) : new Date(),
      recurring: recurring || { isRecurring: false },
      tags: tags || [],
      paymentMethod: paymentMethod || 'cash'
    });

    await transaction.save();

    // Update budget if it's an expense
    if (type === 'expense') {
      await updateBudgetSpending(userId, category, amount);
    }

    res.status(201).json({
      message: 'Transaction added successfully',
      transaction
    });
  } catch (error) {
    console.error('Add transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update transaction
const updateTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    const oldAmount = transaction.amount;
    const oldCategory = transaction.category;
    const oldType = transaction.type;

    // Update transaction
    Object.assign(transaction, req.body);
    await transaction.save();

    // Update budget spending if expense category changed
    if (oldType === 'expense') {
      // Subtract old amount from old category
      await updateBudgetSpending(userId, oldCategory, -oldAmount);
    }
    
    if (transaction.type === 'expense') {
      // Add new amount to new category
      await updateBudgetSpending(userId, transaction.category, transaction.amount);
    }

    res.json({
      message: 'Transaction updated successfully',
      transaction
    });
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({ _id: id, userId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Update budget if it's an expense
    if (transaction.type === 'expense') {
      await updateBudgetSpending(userId, transaction.category, -transaction.amount);
    }

    await Transaction.deleteOne({ _id: id });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get transaction statistics
const getTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly' } = req.query;

    let startDate = new Date();
    
    switch (period) {
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Get income and expense totals
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get category breakdown
    const categoryStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            type: '$type',
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { total: -1 }
      }
    ]);

    // Get monthly trend
    const monthlyTrend = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    const result = {
      totals: stats,
      categoryBreakdown: categoryStats,
      monthlyTrend,
      period
    };

    res.json(result);
  } catch (error) {
    console.error('Get transaction stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Helper function to update budget spending
const updateBudgetSpending = async (userId, category, amount) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const budget = await Budget.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'active',
      startDate: { $lte: lastDayOfMonth },
      endDate: { $gte: firstDayOfMonth }
    });

    if (budget) {
      // Update category spending
      const categoryIndex = budget.categories.findIndex(cat => cat.category === category);
      if (categoryIndex !== -1) {
        budget.categories[categoryIndex].spentAmount += amount;
        budget.totalSpent += amount;

        // Check for alerts
        const categoryBudget = budget.categories[categoryIndex];
        const spentPercentage = (categoryBudget.spentAmount / categoryBudget.budgetedAmount) * 100;

        if (spentPercentage >= categoryBudget.alertThreshold && spentPercentage < 100) {
          budget.alerts.push({
            category,
            message: `You've spent ${spentPercentage.toFixed(1)}% of your ${category} budget`,
            type: 'warning'
          });
        } else if (spentPercentage >= 100) {
          budget.alerts.push({
            category,
            message: `You've exceeded your ${category} budget by $${(categoryBudget.spentAmount - categoryBudget.budgetedAmount).toFixed(2)}`,
            type: 'exceeded'
          });
        }

        await budget.save();
      }
    }
  } catch (error) {
    console.error('Update budget spending error:', error);
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getTransactionStats
};