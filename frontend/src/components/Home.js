import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserData, clearAuthData, formatCurrency } from '../utils/auth';
import './styles/Home.css';
import MoneyVueLogo from '../assets/Finance_Logo.png';

const Home = () => {
  const [user, setUser] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

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

  if (!user) {
    return <div className="loading">Loading...</div>;
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
                <span className="metric-value">{formatCurrency(user.monthlySalary || 0)}</span>
                <span className="metric-change positive">+2.5% this month</span>
              </div>
            </div>
            <div className="metric-card income">
              <div className="metric-icon">📈</div>
              <div className="metric-info">
                <h3>Monthly Income</h3>
                <span className="metric-value">{formatCurrency(user.monthlySalary || 0)}</span>
                <span className="metric-change neutral">Regular salary</span>
              </div>
            </div>
            <div className="metric-card expenses">
              <div className="metric-icon">📊</div>
              <div className="metric-info">
                <h3>Monthly Expenses</h3>
                <span className="metric-value">$0.00</span>
                <span className="metric-change neutral">Start tracking</span>
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
        {/* Quick Actions */}
        <section className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="action-grid">
            <button className="action-btn income-btn">
              <div className="action-icon">💵</div>
              <div className="action-content">
                <h3>Add Income</h3>
                <p>Record salary, freelance, or other earnings</p>
              </div>
            </button>
            <button className="action-btn expense-btn">
              <div className="action-icon">🛒</div>
              <div className="action-content">
                <h3>Add Expense</h3>
                <p>Track your daily spending and bills</p>
              </div>
            </button>
            <button className="action-btn budget-btn">
              <div className="action-icon">📋</div>
              <div className="action-content">
                <h3>Create Budget</h3>
                <p>Plan your monthly financial goals</p>
              </div>
            </button>
            <button className="action-btn goal-btn">
              <div className="action-icon">🏆</div>
              <div className="action-content">
                <h3>Set Goal</h3>
                <p>Define and track savings targets</p>
              </div>
            </button>
          </div>
        </section>

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
                    <span className="chart-value">$0</span>
                    <span className="chart-label">Total Spent</span>
                  </div>
                </div>
                <div className="spending-categories">
                  <div className="category-item">
                    <span className="category-dot food"></span>
                    <span className="category-name">Food & Dining</span>
                    <span className="category-amount">$0</span>
                  </div>
                  <div className="category-item">
                    <span className="category-dot transport"></span>
                    <span className="category-name">Transportation</span>
                    <span className="category-amount">$0</span>
                  </div>
                  <div className="category-item">
                    <span className="category-dot utilities"></span>
                    <span className="category-name">Utilities</span>
                    <span className="category-amount">$0</span>
                  </div>
                  <div className="category-item">
                    <span className="category-dot entertainment"></span>
                    <span className="category-name">Entertainment</span>
                    <span className="category-amount">$0</span>
                  </div>
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
                <div className="goal-item">
                  <div className="goal-header">
                    <span className="goal-name">Emergency Fund</span>
                    <span className="goal-target">$0 / $5,000</span>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '0%'}}></div>
                    </div>
                    <span className="progress-percent">0%</span>
                  </div>
                </div>
                <div className="goal-item">
                  <div className="goal-header">
                    <span className="goal-name">Vacation Fund</span>
                    <span className="goal-target">$0 / $2,000</span>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '0%'}}></div>
                    </div>
                    <span className="progress-percent">0%</span>
                  </div>
                </div>
                <div className="goal-item">
                  <div className="goal-header">
                    <span className="goal-name">Investment Fund</span>
                    <span className="goal-target">$0 / $10,000</span>
                  </div>
                  <div className="goal-progress">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{width: '0%'}}></div>
                    </div>
                    <span className="progress-percent">0%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="insight-card recent-activity">
              <h3>📋 Recent Activity</h3>
              <div className="activity-list">
                <div className="activity-placeholder">
                  <div className="placeholder-icon">💼</div>
                  <div className="placeholder-text">
                    <h4>No transactions yet</h4>
                    <p>Start by adding your first income or expense to see your activity here.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Home;