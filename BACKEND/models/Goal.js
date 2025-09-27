const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  category: {
    type: String,
    enum: ['emergency_fund', 'vacation', 'car', 'house', 'education', 'investment', 'debt_payoff', 'other'],
    default: 'other'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  targetDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'cancelled'],
    default: 'active'
  },
  monthlyContribution: {
    type: Number,
    default: 0,
    min: 0
  },
  autoContribute: {
    type: Boolean,
    default: false
  },
  contributions: [{
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    date: {
      type: Date,
      default: Date.now
    },
    note: String
  }],
  milestones: [{
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    amount: {
      type: Number,
      required: true
    },
    achieved: {
      type: Boolean,
      default: false
    },
    achievedDate: Date,
    reward: String
  }]
}, {
  timestamps: true
});

// Virtual for progress percentage
goalSchema.virtual('progressPercentage').get(function() {
  return this.targetAmount > 0 ? Math.min((this.currentAmount / this.targetAmount) * 100, 100) : 0;
});

// Index for faster queries
goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });
goalSchema.index({ userId: 1, priority: 1 });

module.exports = mongoose.model('Goal', goalSchema);