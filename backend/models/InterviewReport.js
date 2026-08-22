const mongoose = require('mongoose');

const InterviewReportSchema = new mongoose.Schema({
  developerUsername: { 
    type: String, 
    required: true,
    index: true
  },
  recruiterUsername: {
    type: String,
    default: ''
  },
  questions: [
    {
      id: Number,
      topic: String,
      question: String,
      expectedKeywords: [String],
      userAnswer: String,
      accuracy: Number, // Accuracy score out of 100
      feedback: String
    }
  ],
  durationSeconds: {
    type: Number,
    default: 0
  },
  wpm: {
    type: Number,
    default: 0
  },
  fillerCount: {
    type: Number,
    default: 0
  },
  fillerBreakdown: {
    type: Map,
    of: Number,
    default: {}
  },
  deliveryScore: {
    type: Number,
    default: 0
  },
  technicalScore: {
    type: Number,
    default: 0
  },
  overallScore: {
    type: Number,
    default: 0
  },
  hallucinationsOrFlaws: {
    type: [String],
    default: []
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('InterviewReport', InterviewReportSchema);
