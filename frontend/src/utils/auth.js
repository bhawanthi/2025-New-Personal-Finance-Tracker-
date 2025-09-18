// Authentication utility functions
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const getUserData = () => {
  const userData = localStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const setAuthData = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  
  // Trigger custom event to notify components of auth change
  window.dispatchEvent(new Event('authChange'));
};

export const clearAuthData = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  
  // Trigger custom event to notify components of auth change
  window.dispatchEvent(new Event('authChange'));
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return token !== null;
};

// Format currency
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

// Validate email format
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate password strength
export const validatePassword = (password) => {
  return password.length >= 6;
};
