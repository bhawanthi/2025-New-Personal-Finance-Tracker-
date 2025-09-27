const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['income', 'expense', 'both'],
    default: 'expense'
  },
  icon: {
    type: String,
    default: '📁'
  },
  color: {
    type: String,
    default: '#64b5f6'
  },
  subcategories: [{
    name: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      default: '📄'
    }
  }],
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);