const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const mongoose = require('mongoose');

// Get all budgets for a user
const getBudgets = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status = 'active', period } = req.query;

    let filter = { userId };
    if (status) filter.status = status;
    if (period) filter.period = period;

    const budgets = await Budget.find(filter).sort({ startDate: -1 });

    // Transform to match frontend expectations
    const transformedBudgets = budgets.map(budget => ({
      _id: budget._id,
      name: budget.name,
      category: budget.categories[0]?.category || '',
      amount: budget.totalBudget,
      spent: budget.categories[0]?.spentAmount || 0,
      period: budget.period,
      description: budget.description || '',
      startDate: budget.startDate,
      endDate: budget.endDate
    }));

    res.json(transformedBudgets);
  } catch (error) {
    console.error('Get budgets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new budget
const createBudget = async (req, res) => {
  try {
    const {
      name,
      category,
      amount,
      period,
      description
    } = req.body;

    const userId = req.user.id;

    // Validate required fields
    if (!name || !category || !amount || !period) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }

    // Create start and end dates based on period
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'weekly':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'yearly':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        return res.status(400).json({ message: 'Invalid period' });
    }

    // Calculate current spending for the category
    const currentSpending = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          category: category,
          date: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);

    const spentAmount = currentSpending.length > 0 ? currentSpending[0].total : 0;

    const budget = new Budget({
      userId,
      name,
      period,
      startDate,
      endDate,
      categories: [{
        category,
        budgetedAmount: parseFloat(amount),
        spentAmount,
        alertThreshold: 80
      }],
      totalBudget: parseFloat(amount),
      status: 'active',
      description: description || ''
    });

    const savedBudget = await budget.save();

    // Return a simplified budget object that matches frontend expectations
    const simpleBudget = {
      _id: savedBudget._id,
      name: savedBudget.name,
      category: savedBudget.categories[0].category,
      amount: savedBudget.totalBudget,
      spent: savedBudget.categories[0].spentAmount,
      period: savedBudget.period,
      description: savedBudget.description,
      startDate: savedBudget.startDate,
      endDate: savedBudget.endDate
    };

    res.status(201).json(simpleBudget);
  } catch (error) {
    console.error('Create budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update budget
const updateBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Don't allow updating completed budgets
    if (budget.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update completed budget' });
    }

    // Update budget
    Object.assign(budget, req.body);
    
    // Recalculate spending if categories changed
    if (req.body.categories) {
      const updatedCategories = [];
      for (const category of req.body.categories) {
        const spentAmount = await Transaction.aggregate([
          {
            $match: {
              userId: new mongoose.Types.ObjectId(userId),
              type: 'expense',
              category: category.category,
              date: {
                $gte: budget.startDate,
                $lte: budget.endDate
              }
            }
          },
          {
            $group: {
              _id: null,
              total: { $sum: '$amount' }
            }
          }
        ]);

        updatedCategories.push({
          ...category,
          spentAmount: spentAmount.length > 0 ? spentAmount[0].total : 0
        });
      }

      budget.categories = updatedCategories;
      budget.totalSpent = updatedCategories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    }

    await budget.save();

    res.json({
      message: 'Budget updated successfully',
      budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete budget
const deleteBudget = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const budget = await Budget.findOne({ _id: id, userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    await Budget.deleteOne({ _id: id });

    res.json({ message: 'Budget deleted successfully' });
  } catch (error) {
    console.error('Delete budget error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get budget progress and analytics
const getBudgetAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { budgetId } = req.params;

    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    // Calculate progress
    const totalProgress = budget.totalBudget > 0 ? (budget.totalSpent / budget.totalBudget) * 100 : 0;
    
    // Category progress
    const categoryProgress = budget.categories.map(cat => ({
      category: cat.category,
      budgetedAmount: cat.budgetedAmount,
      spentAmount: cat.spentAmount,
      remainingAmount: cat.budgetedAmount - cat.spentAmount,
      progressPercentage: cat.budgetedAmount > 0 ? (cat.spentAmount / cat.budgetedAmount) * 100 : 0,
      isOverBudget: cat.spentAmount > cat.budgetedAmount,
      alertThreshold: cat.alertThreshold
    }));

    // Daily spending trend
    const dailySpending = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: {
            $gte: budget.startDate,
            $lte: budget.endDate
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            day: { $dayOfMonth: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ]);

    // Projected spending
    const daysElapsed = Math.ceil((new Date() - budget.startDate) / (1000 * 60 * 60 * 24));
    const totalDays = Math.ceil((budget.endDate - budget.startDate) / (1000 * 60 * 60 * 24));
    const dailyAverage = daysElapsed > 0 ? budget.totalSpent / daysElapsed : 0;
    const projectedSpending = dailyAverage * totalDays;

    const analytics = {
      budget,
      totalProgress,
      categoryProgress,
      dailySpending,
      projectedSpending,
      isOnTrack: projectedSpending <= budget.totalBudget,
      daysRemaining: Math.max(0, totalDays - daysElapsed),
      averageDailySpending: dailyAverage,
      recommendedDailySpending: totalDays > daysElapsed ? (budget.totalBudget - budget.totalSpent) / (totalDays - daysElapsed) : 0
    };

    res.json(analytics);
  } catch (error) {
    console.error('Get budget analytics error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark alerts as read
const markAlertsAsRead = async (req, res) => {
  try {
    const { budgetId } = req.params;
    const { alertIds } = req.body;
    const userId = req.user.id;

    const budget = await Budget.findOne({ _id: budgetId, userId });
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }

    budget.alerts.forEach(alert => {
      if (alertIds.includes(alert._id.toString())) {
        alert.read = true;
      }
    });

    await budget.save();

    res.json({ message: 'Alerts marked as read' });
  } catch (error) {
    console.error('Mark alerts as read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetAnalytics,
  markAlertsAsRead
};