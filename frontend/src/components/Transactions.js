import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, clearAuthData } from '../utils/auth';
import TransactionModal from './TransactionModal';
import './styles/Transactions.css';
import MoneyVueLogo from '../assets/Finance_Logo.png';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all',
    category: 'all',
    startDate: '',
    endDate: ''
  });
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const fetchTransactions = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.category !== 'all') queryParams.append('category', filters.category);
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`http://localhost:5000/api/transactions?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions/stats?period=monthly', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
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
    fetchTransactions();
    fetchStats();
    fetchCategories();
  }, [fetchTransactions, fetchStats, fetchCategories]);

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

  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:5000/api/transactions/${transactionId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          fetchTransactions();
          fetchStats();
        }
      } catch (error) {
        console.error('Error deleting transaction:', error);
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getIncomeTotal = () => {
    return stats?.totals?.find(t => t._id === 'income')?.total || 0;
  };

  const getExpenseTotal = () => {
    return stats?.totals?.find(t => t._id === 'expense')?.total || 0;
  };

  const getBalance = () => {
    return getIncomeTotal() - getExpenseTotal();
  };

  return (
    <div className="transactions-container">
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
              className="nav-link active"
              onClick={() => navigate('/transactions')}
            >
              <span className="nav-icon">💰</span>
              Transactions
            </button>
            <button 
              className="nav-link"
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
      <div className="transactions-header">
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">💰</span>
            Transactions
          </h1>
          <div className="header-actions">
            <button 
              className="btn btn-income"
              onClick={() => setShowIncomeModal(true)}
            >
              <span className="btn-icon">💵</span>
              Add Income
            </button>
            <button 
              className="btn btn-expense"
              onClick={() => setShowExpenseModal(true)}
            >
              <span className="btn-icon">🛒</span>
              Add Expense
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card income">
            <div className="stat-icon">📈</div>
            <div className="stat-content">
              <div className="stat-label">Total Income</div>
              <div className="stat-value">{formatCurrency(getIncomeTotal())}</div>
            </div>
          </div>
          <div className="stat-card expense">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-label">Total Expenses</div>
              <div className="stat-value">{formatCurrency(getExpenseTotal())}</div>
            </div>
          </div>
          <div className={`stat-card balance ${getBalance() >= 0 ? 'positive' : 'negative'}`}>
            <div className="stat-icon">{getBalance() >= 0 ? '💰' : '⚠️'}</div>
            <div className="stat-content">
              <div className="stat-label">Net Balance</div>
              <div className="stat-value">{formatCurrency(getBalance())}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filters-grid">
          <div className="filter-group">
            <label>Type</label>
            <select 
              value={filters.type}
              onChange={(e) => setFilters(prev => ({...prev, type: e.target.value}))}
              className="filter-select"
            >
              <option value="all">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Category</label>
            <select 
              value={filters.category}
              onChange={(e) => setFilters(prev => ({...prev, category: e.target.value}))}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat.name}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({...prev, startDate: e.target.value}))}
              className="filter-input"
            />
          </div>

          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({...prev, endDate: e.target.value}))}
              className="filter-input"
            />
          </div>
        </div>

        <button 
          className="btn btn-secondary"
          onClick={() => setFilters({type: 'all', category: 'all', startDate: '', endDate: ''})}
        >
          Clear Filters
        </button>
      </div>

      {/* Transactions List */}
      <div className="transactions-section">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading transactions...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📝</div>
            <h3>No Transactions Found</h3>
            <p>Start by adding your first income or expense transaction.</p>
          </div>
        ) : (
          <div className="transactions-list">
            {transactions.map(transaction => {
              const category = categories.find(cat => cat.name === transaction.category);
              return (
                <div key={transaction._id} className={`transaction-item ${transaction.type}`}>
                  <div className="transaction-icon">
                    {category?.icon || (transaction.type === 'income' ? '💰' : '💸')}
                  </div>
                  
                  <div className="transaction-details">
                    <div className="transaction-main">
                      <h4 className="transaction-description">{transaction.description}</h4>
                      <div className="transaction-meta">
                        <span className="transaction-category">
                          {transaction.category}
                          {transaction.subcategory && ` • ${transaction.subcategory}`}
                        </span>
                        <span className="transaction-date">{formatDate(transaction.date)}</span>
                      </div>
                    </div>
                    
                    {transaction.tags.length > 0 && (
                      <div className="transaction-tags">
                        {transaction.tags.map(tag => (
                          <span key={tag} className="tag">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="transaction-amount">
                    <div className={`amount ${transaction.type}`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                    <div className="transaction-payment">
                      {transaction.paymentMethod?.replace('_', ' ')}
                    </div>
                  </div>

                  <div className="transaction-actions">
                    <button 
                      className="action-btn delete"
                      onClick={() => handleDeleteTransaction(transaction._id)}
                      title="Delete transaction"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        type="income"
        onSuccess={() => {
          fetchTransactions();
          fetchStats();
        }}
      />

      <TransactionModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        type="expense"
        onSuccess={() => {
          fetchTransactions();
          fetchStats();
        }}
      />
    </div>
  );
};

export default Transactions;