const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true, 
    lowercase: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  username: { 
    type: String, 
    required: true, 
    unique: true, 
    trim: true
  },
  // 🔥 ROLES LAYER: 'developer' ya 'recruiter' ko handle karne ke liye
  role: {
    type: String,
    enum: ['developer', 'recruiter'],
    default: 'developer'
  },
  // Recruiter specific data (Optional, default khaali rahega)
  companyName: {
    type: String,
    default: ''
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('User', UserSchema);