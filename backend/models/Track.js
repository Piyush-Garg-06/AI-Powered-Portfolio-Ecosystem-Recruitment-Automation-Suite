const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  developerUsername: { type: String, required: true }, // Kis dev ki profile par activity hui
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Kaun sa recruiter tha
  recruiterUsername: { type: String, required: true },
  actionType: { 
    type: String, 
    enum: ['VIEW_PROFILE', 'CHAT_QUERY', 'ATS_MATCH', 'MOCK_INTERVIEW', 'CODE_AUDIT'], 
    required: true 
  },
  metaData: { type: String, default: '' }, // Extra info (jaise chat ka message ya ATS ka JD)
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Track', TrackSchema);
