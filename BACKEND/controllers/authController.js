const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Controller
exports.register = async (req, res) => {
  console.log('Registration request received:', req.body);
  const { name, email, age, jobRole, monthlySalary, password, confirmPassword } = req.body;
  
  if (!name || !email || !age || !jobRole || !monthlySalary || !password || !confirmPassword) {
    console.log('Missing fields:', { name: !!name, email: !!email, age: !!age, jobRole: !!jobRole, monthlySalary: !!monthlySalary, password: !!password, confirmPassword: !!confirmPassword });
    return res.status(400).json({ msg: 'All fields are required' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ msg: 'Passwords do not match' });
  }
  
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    user = new User({ 
      name, 
      email, 
      age, 
      jobRole, 
      monthlySalary, 
      password: hashedPassword 
    });
    
    await user.save();
    
    res.status(201).json({ msg: 'User registered successfully' });
  } catch (err) {
    console.error('Registration error:', err);
    if (err.code === 11000) {
      return res.status(400).json({ msg: 'Email already exists' });
    }
    res.status(500).json({ msg: 'Server error: ' + err.message });
  }
};

// Login Controller
exports.login = async (req, res) => {
  console.log('Login request received:', req.body);
  const { usernameOrEmail, password } = req.body;
  
  if (!usernameOrEmail || !password) {
    console.log('Missing login fields');
    return res.status(400).json({ msg: 'All fields are required' });
  }
  
  try {
    console.log('Searching for user with:', usernameOrEmail);
    const user = await User.findOne({ 
      $or: [ 
        { email: usernameOrEmail }, 
        { name: usernameOrEmail } 
      ] 
    });
    
    console.log('User found:', user ? 'Yes' : 'No');
    if (!user) {
      console.log('User not found with email/name:', usernameOrEmail);
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('Comparing passwords...');
    const isMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', isMatch);
    
    if (!isMatch) {
      console.log('Password does not match');
      return res.status(400).json({ msg: 'Invalid credentials' });
    }
    
    console.log('Creating JWT token...');
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    console.log('Login successful for user:', user.email);
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        name: user.name, 
        email: user.email,
        age: user.age,
        jobRole: user.jobRole,
        monthlySalary: user.monthlySalary
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};
