const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  period: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  categories: [{
    category: {
      type: String,
      required: true
    },
    budgetedAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0,
      min: 0
    },
    alertThreshold: {
      type: Number,
      default: 80, // percentage
      min: 0,
      max: 100
    }
  }],
  totalBudget: {
    type: Number,
    required: true,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused'],
    default: 'active'
  },
  alerts: [{
    category: String,
    message: String,
    type: {
      type: String,
      enum: ['warning', 'exceeded', 'info']
    },
    date: {
      type: Date,
      default: Date.now
    },
    read: {
      type: Boolean,
      default: false
    }
  }]
}, {
  timestamps: true
});

// Index for faster queries
budgetSchema.index({ userId: 1, period: 1, startDate: -1 });
budgetSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Budget', budgetSchema);