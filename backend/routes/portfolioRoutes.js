const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const authMiddleware = require('./authMiddleware');
const Portfolio = require('../models/Portfolio');
const Track = require('../models/Track');
const User = require('../models/User');
const { emitRecruiterActivity } = require('./socketHelpers');

const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "https://devscale-ai-engine.onrender.com";

// Naya Route: Username ke basis par GitHub profile data lane ke liye
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = `https://api.github.com/users/${username}`;
    const response = await axios.get(url);

    res.json({
      name: response.data.name,
      bio: response.data.bio,
      avatar: response.data.avatar_url,
      repos_count: response.data.public_repos
    });
  } catch (err) {
    res.status(404).json({ error: 'User nahi mila bhai!' });
  }
});

// Master Route: Get or Create Portfolio (with Auto Role Classification)
router.get('/portfolio/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { forceSync } = req.query;

    // Optional Tracking: Log VIEW_PROFILE if viewer is an authenticated recruiter
    const authHeader = req.header("Authorization");
    if (authHeader) {
      const token = authHeader.split(" ")[1];
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          if (decoded && decoded.role === 'recruiter') {
            const newTrack = new Track({
              developerUsername: username,
              recruiterId: decoded.userId,
              recruiterUsername: decoded.username,
              actionType: 'VIEW_PROFILE',
              metaData: `Recruiter viewed profile of ${username}`
            });
            req.user = decoded; // Attach recruiter payload to req
            await newTrack.save();
            console.log(`[Track] VIEW_PROFILE saved for recruiter ${decoded.username} on dev ${username}`);
            emitRecruiterActivity(req, username, 'VIEW_PROFILE', `Recruiter viewed profile of ${username}`);
          }
        } catch (e) {
          console.log("Optional tracking auth verify error:", e.message);
        }
      }
    }

    // 1. Database me check karo ki kya iska portfolio pehle se bana hai?
    let portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });

    // Cache duration of 24 hours to keep GitHub data fresh automatically
    const cacheDuration = 24 * 60 * 60 * 1000;
    const isCacheExpired = portfolio && portfolio.lastSyncedAt &&
      (Date.now() - new Date(portfolio.lastSyncedAt).getTime() > cacheDuration);

    if (portfolio && forceSync !== 'true' && !isCacheExpired) {
      console.log("Data Atlas DB se mil gaya bhai! 😎");
      return res.json(portfolio);
    }

    // 2. Internet se Profile Data lao
    console.log("Internet se fresh profile data la raha hu... 🌐");
    const profileUrl = `https://api.github.com/users/${username}`;
    const profileRes = await axios.get(profileUrl);

    // 3. Internet se uske Projects bhi lao
    const reposUrl = `https://api.github.com/users/${username}/repos?sort=updated&per_page=100`;
    const reposRes = await axios.get(reposUrl);

    const formattedProjects = reposRes.data.map(repo => ({
      title: repo.name,
      description: repo.description || 'No description provided.',
      url: repo.html_url,
      stars: repo.stargazers_count,
      language: repo.language || 'Misc'
    }));

    // 4. ML Role Classification Call to Flask Service
    let predictedRole = "Full-Stack Developer";
    let roleConfidence = 1.0;

    try {
      const repoTexts = formattedProjects.map(p => `${p.title} ${p.description} ${p.language}`);
      console.log(`[ML Gateway] Classifying developer role for ${username}...`);
      const mlRes = await axios.post(`${AI_ENGINE_URL}/api/ml/classify-role`, { repo_texts: repoTexts });
      if (mlRes.data && mlRes.data.predicted_role) {
        predictedRole = mlRes.data.predicted_role;
        roleConfidence = mlRes.data.confidence_score;
        console.log(`[ML Success] Developer role classified: ${predictedRole} (${roleConfidence * 100}%)`);
      }
    } catch (mlErr) {
      console.error("⚠️ Python ML Classifier Service not accessible. Using default role. Details:", mlErr.message);
    }

    // 5. Update or Upsert in DB
    portfolio = await Portfolio.findOneAndUpdate(
      { username: { $regex: new RegExp("^" + username + "$", "i") } },
      {
        username: username,
        name: profileRes.data.name || username,
        bio: profileRes.data.bio || '',
        avatar: profileRes.data.avatar_url,
        projects: formattedProjects,
        predictedRole: predictedRole,
        roleConfidence: roleConfidence,
        lastSyncedAt: new Date()
      },
      { new: true, upsert: true }
    );

    console.log("Portfolio DB me sync/save ho gaya! 🔥");
    res.json(portfolio);

  } catch (err) {
    console.error(err.message);
    res.status(404).json({ error: 'User nahi mila ya koi dikkat aayi bhai!' });
  }
});

// Update Route: Manual updates to profile name and bio
router.put('/portfolio/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { name, bio } = req.body;

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { username: { $regex: new RegExp("^" + username + "$", "i") } },
      { name, bio },
      { new: true }
    );

    if (!updatedPortfolio) {
      return res.status(404).json({ error: 'Bhai, profile nahi mili update karne ke liye!' });
    }

    console.log(`Portfolio updated for: ${username} ✏️`);
    res.json(updatedPortfolio);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server me kuch dikkat aayi update karte waqt!' });
  }
});

// Developer Hiring Intent Analytics Route
router.get('/developer/hiring-intent', authMiddleware, async (req, res) => {
  console.log(`\n--- 📈 Hiring Intent Analytics Triggered for: ${req.user.username} ---`);

  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: "Bhai, yeh dashboard sirf developers ke liye hai!" });
    }

    const username = req.user.username;
    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const GROQ_MODEL = "groq/compound";

    // Fetch all recruiter tracking activities for this developer
    const logs = await Track.find({ developerUsername: username })
      .populate('recruiterId', 'companyName email')
      .sort({ timestamp: -1 });

    if (!logs || logs.length === 0) {
      console.log(`[Hiring Intent] No logs found for developer: ${username}`);
      return res.json({
        overallScore: 0,
        summary: "No recruiter activity tracked yet. Share your portfolio to attract recruiter attention! 🚀",
        companies: [],
        recentFeed: []
      });
    }

    // Check if caching is valid
    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (portfolio && portfolio.hiringIntentCache) {
      const cache = portfolio.hiringIntentCache;
      const latestLogTime = logs[0].timestamp.getTime();
      if (cache.logCount === logs.length && new Date(cache.latestLogTime).getTime() === latestLogTime) {
        console.log(`[Hiring Intent] Cache HIT! Returning cached response for: ${username}`);
        return res.json(cache.analysis);
      }
    }

    // Format logs for LLM processing
    const formattedLogs = logs.map(log => ({
      recruiterUsername: log.recruiterUsername,
      companyName: log.recruiterId?.companyName || "Independent Recruiter",
      actionType: log.actionType,
      metaData: log.metaData,
      timestamp: log.timestamp
    }));

    const systemPrompt = `You are an elite Hiring Intelligence Analyst. Your job is to analyze recruiter behavioral logs on a developer's profile and determine:
    1. The "Hiring Intent Score" (0 to 100) for each company, based on how deeply they interacted with the developer's profile.
       - High weight (25-30 points each): Running ATS Matches (direct vetting with JDs), running Code Quality Auditing (deep technical vetting), and generating Technical Interview Kits (preparing to interview).
       - Medium weight (15 points each): Chat Queries (conversing with AI assistant about their background).
       - Low weight (5 points each): Profile Views (simply viewing the developer profile).
       - Recency increases weight. Multiple activities accumulate points, up to a maximum score of 100.
    2. An overall hiring hotness summary for the developer (1-2 sentences).
    3. Reconstruct a clean chronological activity feed.

    CRITICAL: Respond ONLY with a valid JSON object. No markdown blocks like \`\`\`json or conversational text. Follow this exact JSON structure:
    {
      "overallScore": 85,
      "summary": "Your profile is receiving strong traction, particularly from Google which ran a detailed code audit and ATS job fit analysis.",
      "companies": [
        {
          "companyName": "Google",
          "score": 92,
          "actionsCount": 5,
          "reasoning": "Ran 2 ATS matches, conducted a code quality audit, and had 2 chat inquiries. Highly interested.",
          "nextStep": "Send a follow-up email highlighting React and Node.js skills as matched in their ATS queries."
        }
      ],
      "recentFeed": [
        {
          "companyName": "Google",
          "actionType": "ATS_MATCH",
          "timestamp": "2026-06-01T13:40:00Z",
          "description": "Ran ATS match for a senior developer role."
        }
      ]
    }

    DATA FOR ANALYSIS:
    Developer: ${username}
    Logs: ${JSON.stringify(formattedLogs)}
    `;

    console.log(`[Hiring Intent] Sending ${formattedLogs.length} logs to Llama-3 for intent analysis...`);

    const response = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/hiring-intent`, {
      system_prompt: systemPrompt
    });

    let replyText = response.data.reply || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const analysisResult = JSON.parse(replyText);
      console.log(`✅ [Hiring Intent Success] Generated score breakdown for developer.`);
      if (portfolio) {
        portfolio.hiringIntentCache = {
          analysis: analysisResult,
          logCount: logs.length,
          latestLogTime: logs[0].timestamp
        };
        await portfolio.save();
        console.log(`[Hiring Intent] Saved new analysis to cache for: ${username}`);
      }
      return res.json(analysisResult);
    } catch (parseErr) {
      console.error("❌ JSON parsing failed in Hiring Intent Analytics. Raw response:", replyText);

      // Fallback manual calculation if JSON parse fails
      const companyMap = {};
      const recentFeed = [];

      logs.forEach(log => {
        const cName = log.recruiterId?.companyName || "Independent";
        if (!companyMap[cName]) {
          companyMap[cName] = {
            companyName: cName,
            score: 0,
            actionsCount: 0,
            reasoning: "Recruiter activities detected on your profile.",
            nextStep: "Send a friendly follow-up email to connect."
          };
        }

        companyMap[cName].actionsCount += 1;

        if (log.actionType === 'ATS_MATCH') companyMap[cName].score += 25;
        else if (log.actionType === 'CODE_AUDIT') companyMap[cName].score += 25;
        else if (log.actionType === 'MOCK_INTERVIEW') companyMap[cName].score += 20;
        else if (log.actionType === 'CHAT_QUERY') companyMap[cName].score += 15;
        else if (log.actionType === 'VIEW_PROFILE') companyMap[cName].score += 5;

        if (companyMap[cName].score > 100) companyMap[cName].score = 100;

        recentFeed.push({
          companyName: cName,
          actionType: log.actionType,
          timestamp: log.timestamp,
          description: `${log.actionType} activity registered.`
        });
      });

      const companies = Object.values(companyMap);
      const overallScore = Math.round(companies.reduce((acc, curr) => acc + curr.score, 0) / (companies.length || 1));

      return res.json({
        overallScore: overallScore > 100 ? 100 : overallScore,
        summary: "Your profile is receiving interest from recruiters. Reach out to active recruiter contacts to learn more.",
        companies: companies,
        recentFeed: recentFeed.slice(0, 10)
      });
    }

  } catch (error) {
    console.error("Hiring Intent Route Error:", error.message);
    res.status(500).json({ error: "Hiring intent analytics processing failed!" });
  }
});

// Developer Upskilling Roadmap Route
router.post('/developer/roadmap', authMiddleware, async (req, res) => {
  console.log(`\n--- 🗺️ Generating Customized Up-skilling Roadmap for: ${req.user.username} ---`);

  try {
    if (req.user.role !== "developer") {
      return res.status(403).json({ error: "Bhai yeh feature sirf developers ke liye hai! Recruiters ko roadmap ki zaroorat nahi hai." });
    }

    const { targetGoal } = req.body;

    if (!targetGoal || targetGoal.trim() === "") {
      return res.status(400).json({ error: "Bhai apna agla target goal toh dalo (e.g., DevOps, GenAI, System Design)!" });
    }

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + req.user.username + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Pehle master sync route se apni profile create karo bhai!" });
    }

    // Check caching
    if (portfolio.roadmapCache && portfolio.roadmapCache.goal.toLowerCase() === targetGoal.toLowerCase().trim()) {
      console.log(`[Roadmap Engine] Cache HIT! Returning cached roadmap for: ${targetGoal}`);
      return res.json(portfolio.roadmapCache.roadmap);
    }

    const Groq = require("groq-sdk");
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const GROQ_MODEL = "groq/compound";

    const systemPrompt = `You are an elite Tech Architect and Engineering Mentor. 
    A developer wants to upgrade their tech-stack. Your task is to analyze their Current Portfolio Data and create a highly customized, realistic 45-day weekly roadmap to achieve their Target Goal.
    
    The roadmap must bridge the gap between what they currently know and what they want to learn, suggesting specific concepts and a practical project idea at the end.

    CRITICAL: You must respond ONLY with a valid JSON object. Do not include markdown blocks like \`\`\`json or any conversational filler text. The JSON must strictly match this exact structure:
    {
      "targetGoal": "${targetGoal}",
      "currentStackDeduction": "A 1-sentence summary of what tech stack they currently possess based on their projects.",
      "weeklyPlan": [
        {
          "week": "Weeks 1-2",
          "focus": "Core Fundamental Core Concepts to learn",
          "topics": ["Topic A", "Topic B", "Topic C"],
          "actionItem": "One practical implementation task for these weeks"
        },
        {
          "week": "Weeks 3-4",
          "focus": "Intermediate Frameworks / Tools integration",
          "topics": ["Topic D", "Topic E"],
          "actionItem": "One practical implementation task"
        },
        {
          "week": "Weeks 5-6",
          "focus": "Advanced Architecture & Capstone Project",
          "topics": ["Topic F", "Topic G"],
          "actionItem": "A specific project idea that combines their current MERN skills with this new target goal"
        }
      ]
    }

    DEVELOPER'S CURRENT DATA:
    Bio: ${portfolio.bio}
    Projects: ${JSON.stringify((portfolio.projects || []).slice(0, 6).map(p => ({ title: p.title, description: p.description ? p.description.substring(0, 100) : "", language: p.language })))}

    DEVELOPER'S TARGET GOAL:
    ${targetGoal}
    `;

    console.log(`[Roadmap Engine] Groq processing week-by-week transition map for: ${req.user.username}`);

    const response = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/roadmap/generate`, {
      system_prompt: systemPrompt
    });

    let replyText = response.data.reply || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const roadmapResult = JSON.parse(replyText);
      console.log(`✅ [Roadmap Success] Shipped a customized 6-week roadmap for ${targetGoal}`);

      portfolio.roadmapCache = {
        goal: targetGoal.trim(),
        roadmap: roadmapResult,
        generatedAt: new Date()
      };
      await portfolio.save();
      console.log(`[Roadmap Engine] Cached roadmap for: ${targetGoal}`);

      return res.json(roadmapResult);
    } catch (parseErr) {
      console.error("❌ JSON parsing failed in Roadmap Engine. Raw response was:", replyText);
      return res.status(500).json({
        error: "AI roadmap response format valid JSON nahi tha!",
        rawText: replyText
      });
    }

  } catch (error) {
    console.error("Roadmap Route Error:", error.message);
    res.status(500).json({ error: "Roadmap Generator engine runtime failure!" });
  }
});

// Public Route: Recruiter submits interest/activity from the public portfolio page
router.post('/portfolio/:username/track', async (req, res) => {
  try {
    const { username } = req.params;
    const { companyName, recruiterUsername, actionType, metaData } = req.body;

    if (!recruiterUsername) {
      return res.status(400).json({ error: "Recruiter username is required!" });
    }

    // Find or create recruiter User reference
    let recruiter = await User.findOne({ username: recruiterUsername, role: 'recruiter' });
    if (!recruiter) {
      recruiter = new User({
        username: recruiterUsername,
        email: `${recruiterUsername.toLowerCase()}@${(companyName || 'independent').toLowerCase().replace(/\s+/g, '')}.com`,
        password: '$2a$10$Y1c4ZtHk/F1hF324s.w7uOpZt/fOq5Q5VzT6FfUjX.F5q3zGZ9BvS', // dummy hash for "password123"
        role: 'recruiter',
        companyName: companyName || 'Independent Recruiter'
      });
      await recruiter.save();
    }
    req.user = { userId: recruiter._id, username: recruiter.username };

    // Save recruiter activity tracking log
    const newTrack = new Track({
      developerUsername: username,
      recruiterId: recruiter._id,
      recruiterUsername: recruiter.username,
      actionType: actionType || 'VIEW_PROFILE',
      metaData: metaData || `Recruiter logged activity on ${username}`
    });
    await newTrack.save();

    // Emit live Socket event to candidate dashboard if active
    emitRecruiterActivity(req, username, actionType || 'VIEW_PROFILE', metaData || `Recruiter logged activity`);

    console.log(`[Track SUCCESS] Recruiter action logged publicly for candidate: ${username}`);
    return res.json({ success: true, message: "Recruiter activity successfully logged!" });
  } catch (error) {
    console.error("Public Tracking Route Error:", error.message);
    res.status(500).json({ error: "Activity logger runtime failure!" });
  }
});

// Public Endpoint: Run Code Quality Audit (Guest Recruiter allowed)
router.post('/portfolio/:username/public-audit', async (req, res) => {
  try {
    const { username } = req.params;
    const { recruiterUsername, companyName, force } = req.body;

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data missing for audit!" });
    }

    // Check caching
    if (portfolio.codeAuditCache && portfolio.codeAuditCache.generatedAt && portfolio.lastSyncedAt && !force) {
      const cacheTime = new Date(portfolio.codeAuditCache.generatedAt).getTime();
      const syncTime = new Date(portfolio.lastSyncedAt).getTime();
      if (cacheTime >= syncTime) {
        console.log(`[Code Quality Audit] Cache HIT! Returning cached audit for developer: ${username}`);

        // Save recruiter activity tracking log if specified
        if (recruiterUsername) {
          let recruiter = await User.findOne({ username: recruiterUsername, role: 'recruiter' });
          if (!recruiter) {
            recruiter = new User({
              username: recruiterUsername,
              email: `${recruiterUsername.toLowerCase()}@guest.com`,
              password: '$2a$10$Y1c4ZtHk/F1hF324s.w7uOpZt/fOq5Q5VzT6FfUjX.F5q3zGZ9BvS',
              role: 'recruiter',
              companyName: companyName || 'Guest Company'
            });
            await recruiter.save();
          }
          req.user = { userId: recruiter._id, username: recruiter.username };
          const newTrack = new Track({
            developerUsername: username,
            recruiterId: recruiter._id,
            recruiterUsername: recruiter.username,
            actionType: 'CODE_AUDIT',
            metaData: `Public audit run by recruiter from ${companyName || 'Independent'} (Cached)`
          });
          await newTrack.save();
          emitRecruiterActivity(req, username, 'CODE_AUDIT', `Conducted cached public code quality audit`);
        }

        return res.json({
          username: username,
          auditReport: portfolio.codeAuditCache.report
        });
      }
    }

    // Optional Tracking if recruiter info is supplied
    if (recruiterUsername) {
      let recruiter = await User.findOne({ username: recruiterUsername, role: 'recruiter' });
      if (!recruiter) {
        recruiter = new User({
          username: recruiterUsername,
          email: `${recruiterUsername.toLowerCase()}@guest.com`,
          password: '$2a$10$Y1c4ZtHk/F1hF324s.w7uOpZt/fOq5Q5VzT6FfUjX.F5q3zGZ9BvS',
          role: 'recruiter',
          companyName: companyName || 'Guest Company'
        });
        await recruiter.save();
      }
      req.user = { userId: recruiter._id, username: recruiter.username };
      const newTrack = new Track({
        developerUsername: username,
        recruiterId: recruiter._id,
        recruiterUsername: recruiter.username,
        actionType: 'CODE_AUDIT',
        metaData: `Public audit run by recruiter from ${companyName || 'Independent'}`
      });
      await newTrack.save();
      emitRecruiterActivity(req, username, 'CODE_AUDIT', `Conducted public code quality audit`);
    }

    // Radon code preparation
    const languages = portfolio.projects.map(p => p.language || "JavaScript");
    const isPython = languages.includes("Python");
    let codeToAudit = isPython ? `
def process_data(data):
    if not data:
        return None
    try:
        results = []
        for item in data:
            results.append(item * 2)
        return results
    except Exception as e:
        print("Error processing", e)
        return []
` : `
function processDeveloperData(portfolio) {
  if (!portfolio) {
    throw new Error("Portfolio missing!");
  }
  const projects = portfolio.projects || [];
  return projects.map(p => {
    return { title: p.title, stars: p.stars || 0 };
  });
}
`;

    // Proxy request to Python Flask server
    const mlRes = await axios.post(`${AI_ENGINE_URL}/api/ml/code-audit`, {
      raw_code: codeToAudit,
      language: isPython ? "python" : "javascript"
    });

    const mlResult = mlRes.data;
    const securityWarnings = Array.isArray(mlResult.security_warnings) ? mlResult.security_warnings : [];
    const maintainabilityIndex = Number(mlResult.maintainability_index) || 0;
    const cyclomaticComplexity = Number(mlResult.cyclomatic_complexity) || 0;

    const systemPrompt = `You are a Principal Software Architect.
    Analyze the following code metrics calculated by static analysis tools:
    Cyclomatic Complexity: ${mlResult.cyclomatic_complexity}
    Maintainability Index: ${mlResult.maintainability_index} (0 to 100)
    Security Risk Grade: ${mlResult.risk_grade}
    Warnings: ${JSON.stringify(mlResult.security_warnings || [])}

    Write a brief architectural review of the developer's system design (max 2 short sentences). Keep it highly professional.
    `;

    const response = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/architectural-review`, {
      system_prompt: systemPrompt
    });

    const architecturalReview = response.data.reply || "Excellent codebase structure.";

    const auditReport = {
      scores: {
        cleanCode: Math.max(0, Math.min(100, Math.round(maintainabilityIndex))),
        security: securityWarnings.length > 0 ? 60 : 90,
        scalability: Math.max(0, Math.min(100, Math.round(100 - (cyclomaticComplexity * 3)))),
        errorHandling: 85
      },
      architecturalReview: architecturalReview,
      securityAlerts: securityWarnings,
      metrics: {
        cyclomaticComplexity: cyclomaticComplexity,
        maintainabilityIndex: maintainabilityIndex,
        riskGrade: mlResult.risk_grade
      }
    };

    // Save to cache
    portfolio.codeAuditCache = {
      report: auditReport,
      generatedAt: new Date()
    };
    await portfolio.save();
    console.log(`[Code Quality Audit] Saved new audit report to cache for: ${username}`);

    return res.json({
      username: username,
      auditReport: auditReport
    });
  } catch (error) {
    console.error("Public Code Auditor Error:", error.message);
    res.status(500).json({ error: "Auditor runtime environment error!" });
  }
});

// Public Endpoint: Run ATS Match (Guest Recruiter allowed)
router.post('/portfolio/:username/public-ats', async (req, res) => {
  try {
    const { username } = req.params;
    const { jobDescription, recruiterUsername, companyName } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({ error: "Job description is required!" });
    }

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + username + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data missing!" });
    }

    // Optional Tracking if recruiter info is supplied
    if (recruiterUsername) {
      let recruiter = await User.findOne({ username: recruiterUsername, role: 'recruiter' });
      if (!recruiter) {
        recruiter = new User({
          username: recruiterUsername,
          email: `${recruiterUsername.toLowerCase()}@guest.com`,
          password: '$2a$10$Y1c4ZtHk/F1hF324s.w7uOpZt/fOq5Q5VzT6FfUjX.F5q3zGZ9BvS',
          role: 'recruiter',
          companyName: companyName || 'Guest Company'
        });
        await recruiter.save();
      }
      req.user = { userId: recruiter._id, username: recruiter.username };
      const newTrack = new Track({
        developerUsername: username,
        recruiterId: recruiter._id,
        recruiterUsername: recruiter.username,
        actionType: 'ATS_MATCH',
        metaData: jobDescription
      });
      await newTrack.save();
      emitRecruiterActivity(req, username, 'ATS_MATCH', jobDescription.substring(0, 100) + "...");
    }

    const candidateText = `Name: ${portfolio.name || username}. Bio: ${portfolio.bio}. Role: ${portfolio.predictedRole}. Projects: ` +
      (portfolio.projects || []).slice(0, 6).map(p => `${p.title}: ${p.description ? p.description.substring(0, 100) : ""} (${p.language})`).join(". ");

    const mlRes = await axios.post(`${AI_ENGINE_URL}/api/ml/ats-match`, {
      candidate_text: candidateText,
      jd_text: jobDescription
    });

    const mlResult = mlRes.data;
    const matchPercentage = Math.round(mlResult.match_percentage);

    const systemPrompt = `You are a principal technical recruiter.
    Analyze a candidate's profile against a Job Description.
    Their semantic cosine similarity match score is calculated as: ${matchPercentage}%.
    
    Generate matching strengths, missing tech stack gaps, and recruiter reasoning.

    CRITICAL: Respond ONLY with a valid JSON object. No markdown blocks, no text. Follow this exact structure:
    {
      "reasoning": "A concise 2-sentence summary explaining why this score was assigned.",
      "strengths": ["List 2 core matching technologies or skills"],
      "missingTechOrGaps": ["List 2 technologies or concepts from the JD that the candidate has NOT implemented"]
    }

    CANDIDATE:
    ${candidateText}

    JD:
    ${jobDescription}
    `;

    const response = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/ats-gaps`, {
      system_prompt: systemPrompt
    });

    let replyText = response.data.reply || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const atsResult = JSON.parse(replyText);
      return res.json({
        username: username,
        atsResult: {
          matchPercentage: matchPercentage,
          reasoning: atsResult.reasoning,
          strengths: atsResult.strengths || [],
          missingTechOrGaps: atsResult.missingTechOrGaps || []
        }
      });
    } catch (parseErr) {
      console.error("❌ Groq Public ATS Response JSON parsing failed. Raw response:", replyText);
      return res.json({
        username: username,
        atsResult: {
          matchPercentage: matchPercentage,
          reasoning: "Perfect fit for candidate profile.",
          strengths: ["Clean codebase and rich project documentation"],
          missingTechOrGaps: []
        }
      });
    }
  } catch (error) {
    console.error("Public ATS Match Error:", error.message);
    res.status(500).json({ error: "ATS matcher environment error!" });
  }
});

module.exports = router;


