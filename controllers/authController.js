const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Helper to generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecretkey', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  try {
    const { username, password, role, email, fullName, binKey } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password',
      });
    }

    const trimmedUsername = username.trim();
    const trimmedBinKey = binKey ? binKey.trim().toUpperCase() : null;

    // 1. Check if user with this username already exists (case-insensitive)
    const userExists = await User.findOne({
      username: { $regex: new RegExp(`^${trimmedUsername}$`, 'i') },
    });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'This username is already taken. Please choose a different username.',
      });
    }

    // 2. Check if user with this binKey already exists (each bin can only be registered once)
    if (trimmedBinKey) {
      const binKeyExists = await User.findOne({ binKey: trimmedBinKey });
      if (binKeyExists) {
        return res.status(400).json({
          success: false,
          message: `The Smart Bin Key "${trimmedBinKey}" is already registered to another user account. Each bin can only have one registered user.`,
        });
      }
    }

    const user = await User.create({
      username: trimmedUsername,
      password,
      role: role || 'user',
      email,
      fullName,
      binKey: trimmedBinKey || undefined,
    });

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        role: user.role,
        email: user.email,
        fullName: user.fullName,
        binKey: user.binKey,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password',
      });
    }

    // Check for user
    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        token: generateToken(user._id),
        user: {
          _id: user._id,
          username: user.username,
          role: user.role,
          email: user.email,
          fullName: user.fullName,
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getMe,
};

