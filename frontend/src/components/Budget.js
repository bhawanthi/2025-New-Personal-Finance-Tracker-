import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, clearAuthData, formatCurrency } from '../utils/auth';
import './styles/Budget.css';
import MoneyVueLogo from '../assets/Finance_Logo.png';

const Budget = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    amount: '',
    period: 'monthly',
    description: ''
  });
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  const fetchBudgets = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/budgets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBudgets(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:5000/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    clearAuthData();
    navigate('/login');
  };

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please log in again');
        return;
      }
      
      const response = await fetch('http://localhost:5000/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amount: parseFloat(formData.amount)
        })
      });

      if (response.ok) {
        setShowCreateModal(false);
        setFormData({
          name: '',
          category: '',
          amount: '',
          period: 'monthly',
          description: ''
        });
        fetchBudgets();
        alert('Budget created successfully!');
      } else {
        const errorData = await response.text();
        alert(`Failed to create budget: ${errorData}`);
      }
    } catch (error) {
      console.error('Error creating budget:', error);
      alert(`Error creating budget: ${error.message}`);
    }
  };

  const handleDelete = async (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/budgets/${budgetId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchBudgets();
        }
      } catch (error) {
        console.error('Error deleting budget:', error);
      }
    }
  };

  const getBudgetProgressWidth = (budget) => {
    if (!budget.spent || budget.amount === 0) return 0;
    return Math.min((budget.spent / budget.amount) * 100, 100);
  };

  const getBudgetStatus = (budget) => {
    const percentage = getBudgetProgressWidth(budget);
    if (percentage >= 100) return 'over-budget';
    if (percentage >= 80) return 'near-limit';
    return 'on-track';
  };

  if (loading) {
    return (
      <div className="loading-dashboard">
        <div className="loading-spinner"></div>
        <p>Loading your budgets...</p>
      </div>
    );
  }

  return (
    <div className="budget-container">
      {/* Modern Navigation Header */}
      <nav className="navbar">
        <div className="nav-brand">
          <div className="logo">
            <img src={MoneyVueLogo} alt="MoneyVue" className="logo-image" />
            <span className="logo-text">MONIVUE</span>
          </div>
        </div>
        <div className="nav-actions">
          <div className="nav-links">
            <button 
              className="nav-link"
              onClick={() => navigate('/home')}
            >
              <span className="nav-icon">🏠</span>
              Home
            </button>
            <button 
              className="nav-link"
              onClick={() => navigate('/transactions')}
            >
              <span className="nav-icon">💰</span>
              Transactions
            </button>
            <button 
              className="nav-link active"
              onClick={() => navigate('/budgets')}
            >
              <span className="nav-icon">📊</span>
              Budgets
            </button>
            <button 
              className="nav-link"
              onClick={() => navigate('/goals')}
            >
              <span className="nav-icon">🎯</span>
              Goals
            </button>
          </div>
          {user && (
            <div className="user-info">
              <div className="user-details">
                <span className="user-greeting">{getTimeOfDayGreeting()}, {user.name}!</span>
                <div className="current-time">{currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
          )}
          <button onClick={handleLogout} className="logout-button">
            <span className="logout-icon">⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Header */}
      <div className="budget-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            Budget Management
          </h1>
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            Create Budget
          </button>
        </div>

        {/* Budget Overview */}
        <div className="budget-overview">
          <div className="overview-card">
            <div className="overview-icon">📈</div>
            <div className="overview-content">
              <div className="overview-label">Total Budgets</div>
              <div className="overview-value">{budgets.length}</div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">💰</div>
            <div className="overview-content">
              <div className="overview-label">Total Allocated</div>
              <div className="overview-value">
                {formatCurrency(budgets.reduce((sum, budget) => sum + budget.amount, 0))}
              </div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">🔥</div>
            <div className="overview-content">
              <div className="overview-label">Total Spent</div>
              <div className="overview-value">
                {formatCurrency(budgets.reduce((sum, budget) => sum + (budget.spent || 0), 0))}
              </div>
            </div>
          </div>
          <div className="overview-card">
            <div className="overview-icon">✅</div>
            <div className="overview-content">
              <div className="overview-label">On Track</div>
              <div className="overview-value">
                {budgets.filter(budget => getBudgetProgressWidth(budget) < 80).length}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Budgets Grid */}
      <div className="budgets-grid">
        {budgets.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>No Budgets Created Yet</h3>
            <p>Create your first budget to start tracking your spending limits</p>
            <button 
              className="btn btn-primary"
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Budget
            </button>
          </div>
        ) : (
          budgets.map(budget => (
            <div key={budget._id} className={`budget-card ${getBudgetStatus(budget)}`}>
              <div className="budget-header-card">
                <h3 className="budget-name">{budget.name}</h3>
                <div className="budget-actions">
                  <button 
                    className="action-btn edit"
                    title="Edit Budget"
                  >
                    ✏️
                  </button>
                  <button 
                    className="action-btn delete"
                    onClick={() => handleDelete(budget._id)}
                    title="Delete Budget"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              <div className="budget-info">
                <div className="budget-category">{budget.category}</div>
                <div className="budget-period">{budget.period}</div>
              </div>

              <div className="budget-amount">
                <span className="spent">{formatCurrency(budget.spent || 0)}</span>
                <span className="separator"> / </span>
                <span className="total">{formatCurrency(budget.amount)}</span>
              </div>

              <div className="budget-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${getBudgetProgressWidth(budget)}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {getBudgetProgressWidth(budget).toFixed(0)}% used
                </div>
              </div>

              <div className="budget-remaining">
                <span className={`remaining-amount ${budget.spent > budget.amount ? 'over' : ''}`}>
                  {budget.spent > budget.amount ? 'Over by ' : 'Remaining: '}
                  {formatCurrency(Math.abs((budget.amount || 0) - (budget.spent || 0)))}
                </span>
              </div>

              {budget.description && (
                <div className="budget-description">
                  {budget.description}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create Budget Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Budget</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="budget-form">
              <div className="form-group">
                <label>Budget Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., Monthly Groceries"
                  required
                />
              </div>

              <div className="form-group">
                <label>Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                >
                  <option value="">Select Category</option>
                  {categories.map(category => (
                    <option key={category._id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Budget Amount</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label>Period</label>
                <select
                  value={formData.period}
                  onChange={(e) => setFormData({...formData, period: e.target.value})}
                  required
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Description (Optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Brief description of this budget..."
                  rows={3}
                />
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Budget;