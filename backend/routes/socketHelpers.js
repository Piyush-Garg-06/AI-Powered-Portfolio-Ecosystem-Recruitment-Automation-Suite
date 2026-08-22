const mongoose = require('mongoose');
const User = require('../models/User');
const Track = require('../models/Track');

const emitRecruiterActivity = async (req, developerUsername, actionType, metaText = "") => {
  try {
    const io = req.app.get("io");
    if (!io) {
      console.log("⚠️ [Socket] io instance not found on app.");
      return;
    }

    const recruiterUser = await User.findById(req.user.userId);
    const company = recruiterUser?.companyName || "Independent Recruiter";
    const recruiterName = req.user.username;

    const actionLabels = {
      VIEW_PROFILE: "profile view",
      CHAT_QUERY: "AI chat inquiry",
      ATS_MATCH: "ATS compatibility audit",
      MOCK_INTERVIEW: "technical interview kit generation",
      CODE_AUDIT: "code quality audit"
    };

    const actionLabel = actionLabels[actionType] || actionType;

    const payload = {
      id: new mongoose.Types.ObjectId().toString(),
      developerUsername,
      recruiterUsername: recruiterName,
      company,
      actionType,
      metaData: metaText,
      message: `A Recruiter from ${company} just triggered a ${actionLabel} on your MERN projects!`,
      timestamp: new Date()
    };

    io.to(`developer:${developerUsername}`).emit("recruiter-activity", payload);
    console.log(`[Socket] Emitted recruiter activity alert to developer:${developerUsername} (action: ${actionType})`);
  } catch (err) {
    console.error("❌ [Socket] Failed to emit recruiter activity:", err.message);
  }
};

module.exports = { emitRecruiterActivity };
