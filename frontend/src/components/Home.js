import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, clearAuthData, formatCurrency } from '../utils/auth';
import TransactionModal from './TransactionModal';
import './styles/Home.css';
import MoneyVueLogo from '../assets/Finance_Logo.png';

const Home = () => {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showIncomeModal, setShowIncomeModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [transactionStats, setTransactionStats] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goalsData, setGoalsData] = useState([]);
  const [budgetsData, setBudgetsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = getUserData();
    if (userData) {
      setUser(userData);
    }

    // Fetch transaction stats
    fetchTransactionStats();

    // Fetch recent transactions
    fetchRecentTransactions();

    // Fetch goals
    fetchGoals();

    // Fetch budgets
    fetchBudgets();

    // Update time every minute
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const fetchTransactionStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions/stats?period=monthly', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransactionStats(data);
      } else {
        console.error('Failed to fetch transaction stats');
      }
    } catch (error) {
      console.error('Error fetching transaction stats:', error);
    }
  };

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

  // Helper functions to calculate totals
  const getTotalIncome = () => {
    if (!transactionStats || !transactionStats.totals) return 0;
    const incomeTotal = transactionStats.totals.find(t => t._id === 'income');
    const baseSalary = user?.monthlySalary || 0;
    const additionalIncome = incomeTotal?.total || 0;
    return baseSalary + additionalIncome;
  };

  const getTotalExpenses = () => {
    if (!transactionStats || !transactionStats.totals) return 0;
    const expenseTotal = transactionStats.totals.find(t => t._id === 'expense');
    return expenseTotal?.total || 0;
  };

  const getTotalBalance = () => {
    return getTotalIncome() - getTotalExpenses();
  };

  const getBalanceChange = () => {
    // Calculate percentage change based on previous period
    const currentBalance = getTotalBalance();
    const baseIncome = user?.monthlySalary || 0;
    if (baseIncome === 0) return 0;
    return ((currentBalance - baseIncome) / baseIncome * 100).toFixed(1);
  };

  const fetchRecentTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/transactions?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRecentTransactions(data.transactions);
      }
    } catch (error) {
      console.error('Error fetching recent transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/goals', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setGoalsData(data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
    }
  };

  const fetchBudgets = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/budgets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBudgetsData(data);
      }
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetchTransactionStats(),
      fetchRecentTransactions(),
      fetchGoals(),
      fetchBudgets()
    ]).finally(() => setLoading(false));
  };

  if (!user) {
    return <div className="loading">Loading...</div>;
  }

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-dashboard">
          <div className="loading-spinner"></div>
          <p>Loading your financial dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
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
              className="nav-link active"
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
          <button onClick={handleLogout} className="logout-button">
            <span className="logout-icon">⏻</span>
            <span>Logout</span>
          </button>
        </div>
      </nav>

      {/* Hero Dashboard */}
      <section className="hero-dashboard">
        <div className="hero-content">
          <h1 className="hero-title">Financial Dashboard</h1>
          <p className="hero-subtitle">Your complete financial overview at a glance</p>
          
          {/* Key Metrics */}
          <div className="key-metrics">
            <div className="metric-card balance">
              <div className="metric-icon">💰</div>
              <div className="metric-info">
                <h3>Total Balance</h3>
                <span className="metric-value">{formatCurrency(getTotalBalance())}</span>
                <span className={`metric-change ${getTotalBalance() >= (user?.monthlySalary || 0) ? 'positive' : 'negative'}`}>
                  {getTotalBalance() >= (user?.monthlySalary || 0) ? '+' : ''}{getBalanceChange()}% this month
                </span>
              </div>
            </div>
            <div className="metric-card income">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <h3>Monthly Income</h3>
                <span className="metric-value">{formatCurrency(getTotalIncome())}</span>
                <span className="metric-change neutral">
                  {transactionStats?.totals?.find(t => t._id === 'income')?.total > 0 ? 
                    `Salary + ${formatCurrency(transactionStats.totals.find(t => t._id === 'income').total)} additional` : 
                    'Regular salary'
                  }
                </span>
              </div>
            </div>
            <div className="metric-card expenses">
              <div className="metric-icon">📊</div>
              <div className="metric-info">
                <h3>Monthly Expenses</h3>
                <span className="metric-value">{formatCurrency(getTotalExpenses())}</span>
                <span className="metric-change neutral">
                  {getTotalExpenses() > 0 ? 
                    `${transactionStats?.totals?.find(t => t._id === 'expense')?.count || 0} transactions` : 
                    'Start tracking'
                  }
                </span>
              </div>
            </div>
            <div className="metric-card savings">
              <div className="metric-icon">🎯</div>
              <div className="metric-info">
                <h3>Savings Goal</h3>
                <span className="metric-value">$0.00</span>
                <span className="metric-change neutral">Set your goal</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <div className="main-content">
        {/* Financial Insights */}
        <section className="insights-section">
          <h2 className="section-title">Financial Insights</h2>
          
          <div className="insights-grid">
            {/* Spending Overview */}
            <div className="insight-card spending-overview">
              <h3>💳 Spending This Month</h3>
              <div className="spending-chart">
                <div className="chart-placeholder">
                  <div className="chart-circle">
                    <span className="chart-value">{formatCurrency(getTotalExpenses())}</span>
                    <span className="chart-label">Total Spent</span>
                  </div>
                </div>
                <div className="spending-categories">
                  {transactionStats?.categoryBreakdown
                    ?.filter(cat => cat._id.type === 'expense')
                    ?.slice(0, 4)
                    ?.map(cat => (
                      <div key={cat._id.category} className="category-item">
                        <span className="category-dot food"></span>
                        <span className="category-name">{cat._id.category}</span>
                        <span className="category-amount">{formatCurrency(cat.total)}</span>
                      </div>
                    )) ||
                    [
                      { name: 'Food & Dining', amount: 0 },
                      { name: 'Transportation', amount: 0 },
                      { name: 'Utilities', amount: 0 },
                      { name: 'Entertainment', amount: 0 }
                    ].map(cat => (
                      <div key={cat.name} className="category-item">
                        <span className="category-dot food"></span>
                        <span className="category-name">{cat.name}</span>
                        <span className="category-amount">{formatCurrency(cat.amount)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Market Trends */}
            <div className="insight-card market-trends">
              <h3>📈 Market & Inflation Trends</h3>
              <div className="trend-list">
                <div className="trend-item">
                  <div className="trend-info">
                    <span className="trend-category">🍕 Food & Groceries</span>
                    <span className="trend-description">Price increases affecting budget</span>
                  </div>
                  <span className="trend-value up">+3.2%</span>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <span className="trend-category">⛽ Transportation</span>
                    <span className="trend-description">Fuel costs trending upward</span>
                  </div>
                  <span className="trend-value up">+2.8%</span>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <span className="trend-category">🏠 Housing</span>
                    <span className="trend-description">Rent and utilities rising</span>
                  </div>
                  <span className="trend-value up">+4.1%</span>
                </div>
                <div className="trend-item">
                  <div className="trend-info">
                    <span className="trend-category">💡 Utilities</span>
                    <span className="trend-description">Stable pricing this quarter</span>
                  </div>
                  <span className="trend-value stable">+0.5%</span>
                </div>
              </div>
            </div>

            {/* Financial Goals */}
            <div className="insight-card goals-progress">
              <h3>🎯 Financial Goals Progress</h3>
              <div className="goals-list">
                {goalsData.length > 0 ? (
                  goalsData.map(goal => {
                    const progress = goal.targetAmount > 0 ? ((goal.currentAmount || 0) / goal.targetAmount * 100) : 0;
                    return (
                      <div key={goal._id} className="goal-item">
                        <div className="goal-header">
                          <span className="goal-name">{goal.title}</span>
                          <span className="goal-target">
                            ${(goal.currentAmount || 0).toLocaleString()} / ${goal.targetAmount.toLocaleString()}
                          </span>
                        </div>
                        <div className="goal-progress">
                          <div className="progress-bar">
                            <div className="progress-fill" style={{width: `${Math.min(progress, 100)}%`}}></div>
                          </div>
                          <span className="progress-percent">{Math.round(progress)}%</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="no-goals">
                    <p>No goals created yet.</p>
                    <p style={{fontSize: '0.9em', color: '#666', marginTop: '10px'}}>
                      Create your first financial goal to start tracking your progress!
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="insight-card recent-activity">
              <h3>📋 Recent Activity</h3>
              <div className="activity-list">
                {recentTransactions.length > 0 ? (
                  recentTransactions.map(transaction => (
                    <div key={transaction._id} className="activity-item">
                      <div className="activity-icon">
                        {transaction.type === 'income' ? '💰' : '💸'}
                      </div>
                      <div className="activity-details">
                        <div className="activity-description">{transaction.description}</div>
                        <div className="activity-meta">
                          <span className="activity-category">{transaction.category}</span>
                          <span className="activity-date">
                            {new Date(transaction.date).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </span>
                        </div>
                      </div>
                      <div className={`activity-amount ${transaction.type}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="activity-placeholder">
                    <div className="placeholder-icon">💼</div>
                    <div className="placeholder-text">
                      <h4>No transactions yet</h4>
                      <p>Start by adding your first income or expense to see your activity here.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Transaction Modals */}
      <TransactionModal
        isOpen={showIncomeModal}
        onClose={() => setShowIncomeModal(false)}
        type="income"
        onSuccess={() => {
          // Refresh data after successful transaction
          refreshData();
        }}
      />

      <TransactionModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        type="expense"
        onSuccess={() => {
          // Refresh data after successful transaction
          refreshData();
        }}
      />
    </div>
  );
};

export default Home;