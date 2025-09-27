import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Register from './components/Register';
import Login from './components/Login';
import Home from './components/Home';
import LaunchingPage from './components/LaunchingPage';
import Transactions from './components/Transactions';
import Budget from './components/Budget';
import Goals from './components/Goals';
import { isAuthenticated } from './utils/auth';
import './styles/App.css';

function App() {
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [showLaunching, setShowLaunching] = useState(true);

  useEffect(() => {
    // Check authentication status on component mount
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      console.log('Checking authentication:', authenticated);
      setUserAuthenticated(authenticated);
    };
    
    checkAuth();

    // Hide launching screen after 3.5 seconds
    const launchTimer = setTimeout(() => {
      setShowLaunching(false);
    }, 3500);

    // Listen for storage changes (when login/logout happens)
    const handleStorageChange = () => {
      console.log('Storage change detected');
      checkAuth();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom auth events
    const handleAuthChange = () => {
      console.log('Auth change event detected');
      checkAuth();
    };

    window.addEventListener('authChange', handleAuthChange);

    return () => {
      clearTimeout(launchTimer);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('authChange', handleAuthChange);
    };
  }, []);

  // Show launching page first
  if (showLaunching) {
    return <LaunchingPage />;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route 
            path="/home" 
            element={userAuthenticated ? <Home /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/transactions" 
            element={userAuthenticated ? <Transactions /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/budgets" 
            element={userAuthenticated ? <Budget /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/goals" 
            element={userAuthenticated ? <Goals /> : <Navigate to="/login" replace />} 
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
