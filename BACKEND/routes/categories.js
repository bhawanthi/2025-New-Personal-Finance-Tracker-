const express = require('express');
const router = express.Router();
const {
  getCategories,
  seedDefaultCategories
} = require('../controllers/categoryController');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', getCategories);

// @route   POST /api/categories/seed
// @desc    Seed default categories
// @access  Public (for initial setup)
router.post('/seed', seedDefaultCategories);

module.exports = router;