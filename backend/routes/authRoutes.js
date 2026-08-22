const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Register Endpoint
router.post('/register', async (req, res) => {
  try {
    const { email, password, username, role, companyName } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Bhai saari fields bharna zaroori hai!' });
    }

    const userExists = await User.findOne({ $or: [{ email }, { username }] });
    if (userExists) {
      return res.status(400).json({ error: 'Email ya Username pehle se hi taken hai bhai!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      role: role || 'developer',
      companyName: companyName || ''
    });

    await newUser.save();
    res.status(201).json({ message: 'User ekdam kamal tarike se register ho gaya! 🎉' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server me koi gadbad hui register karte waqt!' });
  }
});

// Login Endpoint
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Bhai email aur password dono daalo!' });
    }

    const user = await User.findOne({ $or: [{ email: email }, { username: email }] });
    if (!user) {
      return res.status(400).json({ error: 'Galat Email/Username ya Password bhai!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Galat Email ya Password bhai!' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      message: 'Login kamal tarike se ho gaya! 🚀',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server me koi gadbad hui login karte waqt!' });
  }
});

module.exports = router;
