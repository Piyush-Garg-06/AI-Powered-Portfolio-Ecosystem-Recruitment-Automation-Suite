const mongoose = require('mongoose');

const PortfolioSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, default: '' },
  bio: { type: String, default: '' },
  avatar: { type: String, default: '' },
  predictedRole: { type: String, default: 'Full-Stack Developer' },
  roleConfidence: { type: Number, default: 1.0 },
  // Projects ko hum ek array of objects ki tarah store karenge
  projects: [
    {
      title: String,
      description: String,
      url: String,
      stars: Number,
      language: String
    }
  ],
  lastSyncedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  hiringIntentCache: { type: mongoose.Schema.Types.Mixed, default: null },
  roadmapCache: { type: mongoose.Schema.Types.Mixed, default: null },
  codeAuditCache: { type: mongoose.Schema.Types.Mixed, default: null }
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);