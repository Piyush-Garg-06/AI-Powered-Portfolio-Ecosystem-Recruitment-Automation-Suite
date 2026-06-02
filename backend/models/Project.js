const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  portfolioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Portfolio', required: true },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  repoUrl: { type: String },
  liveUrl: { type: String, default: '' },
  stars: { type: Number, default: 0 },
  languages: [{ type: String }],
  isPinned: { type: Boolean, default: false }
});

module.exports = mongoose.model('Project', ProjectSchema);