const express = require('express');
const router = express.Router();
const axios = require('axios');
const Groq = require("groq-sdk");
const authMiddleware = require('./authMiddleware');
const Portfolio = require('../models/Portfolio');
const Track = require('../models/Track');
const InterviewReport = require('../models/InterviewReport');
const { emitRecruiterActivity } = require('./socketHelpers');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "groq/compound";
const AI_ENGINE_URL = process.env.AI_ENGINE_URL || "https://devscale-ai-engine.onrender.com";

const compactPortfolioProjects = (projects = [], limit = 6) => projects
  .slice(0, limit)
  .map((project) => ({
    title: String(project.title || '').slice(0, 120),
    description: String(project.description || '').slice(0, 500),
    language: String(project.language || '').slice(0, 80),
    technologies: Array.isArray(project.technologies)
      ? project.technologies.slice(0, 12).map((technology) => String(technology).slice(0, 60))
      : undefined,
  }));

// ============================================================
// 🤖 DUAL AI CHAT ENGINE: Role ke hisab se behaviour badlega (Groq Powered)
// ============================================================
router.post("/chat", authMiddleware, async (req, res) => {
  console.log(`\n--- 📥 Chat Engine Triggered by Role: ${req.user.role} ---`);

  try {
    const { message, targetUsername } = req.body;
    const loggedInUserRole = req.user.role;

    let systemPrompt = "";
    let portfolio;

    // CASE A: DEVELOPER LOGIN HAI -> Self-Improvement Bot
    if (loggedInUserRole === "developer") {
      portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + req.user.username + "$", "i") } });

      if (!portfolio) {
        return res.status(404).json({ reply: "Pehle master sync route ko hit karke apna data load karo bhai!" });
      }

      systemPrompt = `You are an elite Technical Mentor and Career Coach. You are speaking directly to the developer, ${portfolio.name}.
      Your job is to analyze their portfolio data (projects, tech stack, descriptions) and provide them critical feedback on how to improve their skills, clean code tips, what features to add to their current projects, and advice on cracking top tech companies. Keep responses strictly short, direct, and practical (Maximum 2-3 sentences). Only speak in professional English.

      DEVELOPER'S LIVE DATA FOR MENTORSHIP:
      Bio: ${String(portfolio.bio || '').slice(0, 1200)}
      Projects: ${JSON.stringify(compactPortfolioProjects(portfolio.projects))}
      `;
    }
    // CASE B: RECRUITER LOGIN HAI -> Evaluation & Assessment Bot
    else if (loggedInUserRole === "recruiter") {
      if (!targetUsername) {
        return res.status(400).json({ reply: "Recruiter bhai, kis developer ka data test karna hai? targetUsername dalo body mein!" });
      }

      portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + targetUsername + "$", "i") } });
      if (!portfolio) {
        return res.status(404).json({ reply: "Is username ka portfolio database mein nahi mila!" });
      }

      // Track recruiter chat query
      const newTrack = new Track({
        developerUsername: targetUsername,
        recruiterId: req.user.userId,
        recruiterUsername: req.user.username,
        actionType: 'CHAT_QUERY',
        metaData: message
      });
      await newTrack.save();
      console.log(`[Track] CHAT_QUERY saved for recruiter ${req.user.username} on dev ${targetUsername}`);
      emitRecruiterActivity(req, targetUsername, 'CHAT_QUERY', message);

      systemPrompt = `You are a strict technical recruiter assistant evaluating the candidate ${portfolio.name} on behalf of a hiring manager.
      Your job is to answer questions regarding the candidate's core stack based purely on the projects listed below. If requested, generate a tough question that the recruiter can ask the candidate during interviews regarding their listed work. Keep responses crisp and professional (Maximum 2-3 sentences). Only speak in English.

      CANDIDATE'S PORTFOLIO DATA FOR EVALUATION:
      Bio: ${String(portfolio.bio || '').slice(0, 1200)}
      Projects: ${JSON.stringify(compactPortfolioProjects(portfolio.projects))}
      `;
    }

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      model: GROQ_MODEL,
      temperature: 0.4,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "AI break par gaya hai bhai.";
    return res.json({ reply: replyText });

  } catch (error) {
    console.error("Dual Chat Engine Error:", error.message);
    const status = error.status || error.response?.status;
    const isTooLarge = status === 413 || error.code === 'request_too_large';
    res.status(isTooLarge ? 413 : 500).json({
      reply: isTooLarge
        ? "Portfolio context abhi bhi bahut bada hai. Please sync a shorter profile or try again."
        : "AI Engine processing mein jhol ho gaya!",
      details: error.message
    });
  }
});

// ============================================================
// 🎙️ GITHUB VIVA GENERATOR (POST /api/ai/interview/generate)
// ============================================================
router.post("/interview/generate", authMiddleware, async (req, res) => {
  console.log(`\n--- 🤖 Interview Engine Triggered by: ${req.user.username} ---`);

  try {
    const { targetUsername } = req.body;
    const usernameToFetch = targetUsername || req.user.username;

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + usernameToFetch + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data nahi mila!" });
    }

    // Track recruiter generating interview kit
    if (req.user.role === 'recruiter') {
      const newTrack = new Track({
        developerUsername: usernameToFetch,
        recruiterId: req.user.userId,
        recruiterUsername: req.user.username,
        actionType: 'MOCK_INTERVIEW',
      });
      await newTrack.save();
      emitRecruiterActivity(req, usernameToFetch, 'MOCK_INTERVIEW', `Generated technical interview kit`);
    }

    const systemPrompt = `You are a Senior Principal Engineer conducting a technical interview for ${portfolio.name || usernameToFetch}.
    Analyze their project stack, repository names, and descriptions. Generate a structured set of 4 tough, real-world technical architecture and tradeoff cross-questions (NOT generic LeetCode coding questions) based strictly on the technologies they used.
    
    CRITICAL: Each question must be extremely short, direct, and conversational. STRICT MAXIMUM OF 1 SENTENCE. DO NOT write more than one sentence under any circumstance. Keep it under 15 words. No preamble, no setup. Just the direct question.

    For instance, if they have a MERN stack project, ask about their MongoDB index patterns, Express middleware error containment, or React state render optimization.

    CRITICAL: You must respond ONLY with a valid JSON array. Do not include any conversational text or markdown blocks like \`\`\`json. The JSON must follow this exact structure:
    [
      {
        "id": 1,
        "topic": "Database Architecture",
        "question": "Short direct question (1 sentence max, under 15 words).",
        "expectedKeywords": ["indexing", "sharding", "acid properties"]
      },
      {
        "id": 2,
        "topic": "State Management",
        "question": "Short direct question (1 sentence max, under 15 words).",
        "expectedKeywords": ["useCallback", "context api", "re-rendering"]
      }
    ]

    CANDIDATE PROJECTS:
    ${JSON.stringify((portfolio.projects || []).slice(0, 6).map(p => ({ title: p.title, description: p.description ? p.description.substring(0, 100) : "", language: p.language })))}
    `;

    // Proxy request to Python Flask server for Llama-3 model generation
    const response = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/interview/generate`, {
      system_prompt: systemPrompt
    });

    let replyText = response.data.reply || "[]";
    try {
      let cleaned = replyText.trim();
      cleaned = cleaned.replace(/^\`\`\`json/i, "").replace(/^\`\`\`/g, "").replace(/\`\`\`$/g, "").trim();
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        cleaned = arrayMatch[0];
      }
      const interviewQuestions = JSON.parse(cleaned);
      return res.json({ username: usernameToFetch, questions: interviewQuestions });
    } catch (parseErr) {
      console.error("❌ JSON parsing fail in Interview Route. Raw text:", replyText);
      return res.status(500).json({ error: "AI response parse nahi ho paya!", rawText: replyText });
    }

  } catch (error) {
    console.error("Interview Route Error:", error.message);
    res.status(500).json({ error: "Interview generate karne mein backend par dikkat aayi!" });
  }
});

// ============================================================
// 🎙️ VIVA ANSWER EVALUATOR (POST /api/ai/interview/evaluate)
// ============================================================
router.post("/interview/evaluate", authMiddleware, async (req, res) => {
  console.log(`\n--- 🎙️ Viva Evaluation Engine Triggered by: ${req.user.username} ---`);

  try {
    const { targetUsername, questions, durationSeconds } = req.body;
    const usernameToFetch = targetUsername || req.user.username;

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: "No interview questions or answers provided!" });
    }

    // 1. Evaluate each answer using Groq for Technical Accuracy and Hallucinations
    const evaluatedQuestions = [];
    let totalTechScore = 0;
    const hallucinationsOrFlaws = [];

    console.log(`[Viva Evaluation] Analyzing ${questions.length} questions for ${usernameToFetch} via Groq...`);

    for (const q of questions) {
      const systemPrompt = `You are a strict technical interviewer.
      Evaluate the candidate's answer to the technical question:
      Question: "${q.question}"
      Expected Keywords: ${JSON.stringify(q.expectedKeywords || [])}
      Candidate's Answer: "${q.userAnswer || ''}"

      Identify if they answered correctly, detect any factual hallucinations, errors, or architectural flaws.
      Return a technical accuracy score between 0 and 100 and a 1-sentence feedback.

      CRITICAL: Respond ONLY with a valid JSON object. No markdown blocks, no text. Follow this structure:
      {
        "accuracy": 85,
        "feedback": "Correct explanation of the database index lifecycle, although they missed composite keys.",
        "flaw": "Missed composite indexing concept"
      }
      `;

      const checkRes = await axios.post(`${AI_ENGINE_URL}/api/ml/llm/interview/evaluate`, {
        system_prompt: systemPrompt
      });

      let evaluationText = checkRes.data.reply || "{}";
      try {
        let cleaned = evaluationText.trim();
        cleaned = cleaned.replace(/^\`\`\`json/i, "").replace(/^\`\`\`/g, "").replace(/\`\`\`$/g, "").trim();
        const objectMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          cleaned = objectMatch[0];
        }
        const evaluation = JSON.parse(cleaned);
        const score = Number(evaluation.accuracy) || 0;
        totalTechScore += score;

        if (evaluation.flaw && evaluation.flaw.trim()) {
          hallucinationsOrFlaws.push(evaluation.flaw);
        }

        evaluatedQuestions.push({
          id: q.id,
          topic: q.topic || "",
          question: q.question,
          expectedKeywords: q.expectedKeywords || [],
          userAnswer: q.userAnswer || "",
          accuracy: score,
          feedback: evaluation.feedback || "Evaluated."
        });
      } catch (parseErr) {
        console.error("Evaluation JSON parse failed. Raw:", evaluationText);
        evaluatedQuestions.push({
          id: q.id,
          topic: q.topic || "",
          question: q.question,
          expectedKeywords: q.expectedKeywords || [],
          userAnswer: q.userAnswer || "",
          accuracy: 50,
          feedback: "Standard response evaluation."
        });
        totalTechScore += 50;
      }
    }

    const averageTechScore = totalTechScore / questions.length;

    // 2. Combine transcripts and forward to Flask speech-proctor
    const combinedTranscript = questions.map(q => q.userAnswer || "").join(" ");
    let speechData = {
      wpm: 0,
      filler_count: 0,
      filler_breakdown: {},
      delivery_score: 100
    };

    try {
      console.log("[Viva Evaluation] Forwarding transcript to Python Flask speech-proctor...");
      const flaskRes = await axios.post(`${AI_ENGINE_URL}/api/ml/speech-proctor`, {
        transcript: combinedTranscript,
        duration_sec: durationSeconds || 60
      });
      speechData = flaskRes.data;
      console.log(`[ML Success] Speech metrics: WPM=${speechData.wpm}, Fillers=${speechData.filler_count}, Delivery=${speechData.delivery_score}%`);
    } catch (flaskErr) {
      console.error("⚠️ Flask speech proctor microservice offline. Using fallback speech metrics. Details:", flaskErr.message);
    }

    // 3. Compute overall score
    const overallScore = Math.round((averageTechScore + speechData.delivery_score) / 2);

    // 4. Save InterviewReport to MongoDB
    const newReport = new InterviewReport({
      developerUsername: usernameToFetch,
      recruiterUsername: req.user.role === 'recruiter' ? req.user.username : '',
      questions: evaluatedQuestions,
      durationSeconds: durationSeconds || 0,
      wpm: speechData.wpm || 0,
      fillerCount: speechData.filler_count || 0,
      fillerBreakdown: speechData.filler_breakdown || {},
      deliveryScore: speechData.delivery_score || 0,
      technicalScore: Math.round(averageTechScore),
      overallScore: overallScore,
      hallucinationsOrFlaws: hallucinationsOrFlaws
    });

    await newReport.save();
    console.log(`[InterviewReport] Report saved successfully in MongoDB for ${usernameToFetch}.`);

    return res.json({
      success: true,
      report: newReport
    });

  } catch (error) {
    console.error("Viva Evaluation Controller Error:", error.message);
    res.status(500).json({ error: "Viva evaluation logic crashed!" });
  }
});

// ============================================================
// 🔍 AI CODE QUALITY AUDITOR (Node.js Gateway Proxy to Flask)
// ============================================================
router.post("/code-audit", authMiddleware, async (req, res) => {
  console.log(`\n--- 🔍 Code Auditor Proxy Triggered by: ${req.user.username} ---`);

  try {
    const { targetUsername, raw_code, language, force } = req.body;
    const usernameToAudit = targetUsername || req.user.username;

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + usernameToAudit + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data missing for audit!" });
    }

    // Check caching
    if (portfolio.codeAuditCache && portfolio.codeAuditCache.generatedAt && portfolio.lastSyncedAt && !force) {
      const cacheTime = new Date(portfolio.codeAuditCache.generatedAt).getTime();
      const syncTime = new Date(portfolio.lastSyncedAt).getTime();
      if (cacheTime >= syncTime) {
        console.log(`[Code Quality Audit] Cache HIT (Gateway)! Returning cached audit for developer: ${usernameToAudit}`);

        // Track recruiter code audit
        if (req.user.role === 'recruiter') {
          const newTrack = new Track({
            developerUsername: usernameToAudit,
            recruiterId: req.user.userId,
            recruiterUsername: req.user.username,
            actionType: 'CODE_AUDIT',
            metaData: `Recruiter conducted code audit for ${usernameToAudit} (Cached)`
          });
          await newTrack.save();
          emitRecruiterActivity(req, usernameToAudit, 'CODE_AUDIT', `Conducted cached code quality audit`);
        }

        return res.json({
          username: usernameToAudit,
          auditReport: portfolio.codeAuditCache.report
        });
      }
    }

    // Track recruiter code audit
    if (req.user.role === 'recruiter') {
      const newTrack = new Track({
        developerUsername: usernameToAudit,
        recruiterId: req.user.userId,
        recruiterUsername: req.user.username,
        actionType: 'CODE_AUDIT',
        metaData: `Recruiter conducted code audit for ${usernameToAudit}`
      });
      await newTrack.save();
      emitRecruiterActivity(req, usernameToAudit, 'CODE_AUDIT', `Conducted code quality audit`);
    }

    // 1. Prepare codebase snippet for Radon
    let codeToAudit = raw_code || "";
    if (!codeToAudit.trim()) {
      const languages = portfolio.projects.map(p => p.language || "JavaScript");
      const isPython = languages.includes("Python");
      if (isPython) {
        codeToAudit = `
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
`;
      } else {
        codeToAudit = `
function processDeveloperData(portfolio) {
  if (!portfolio) {
    throw new Error("Portfolio missing!");
  }
  const projects = portfolio.projects || [];
  return projects.map(p => {
    return {
      title: p.title,
      stars: p.stars || 0
    };
  });
}
`;
      }
    }

    // 2. Proxy request to Python Flask server
    console.log(`[ML Gateway] Forwarding code audit request to Flask for ${usernameToAudit}...`);
    const mlRes = await axios.post(`${AI_ENGINE_URL}/api/ml/code-audit`, {
      raw_code: codeToAudit,
      language: language || "javascript"
    });

    const mlResult = mlRes.data;
    const securityWarnings = Array.isArray(mlResult.security_warnings) ? mlResult.security_warnings : [];
    const maintainabilityIndex = Number(mlResult.maintainability_index) || 0;
    const cyclomaticComplexity = Number(mlResult.cyclomatic_complexity) || 0;

    // 3. Call local Flask architectural-review service using the static metrics
    const systemPrompt = `You are a Principal Software Architect.
    Analyze the following code metrics calculated by static analysis tools:
    Cyclomatic Complexity: ${cyclomaticComplexity}
    Maintainability Index: ${maintainabilityIndex} (0 to 100)
    Security Risk Grade: ${mlResult.risk_grade}
    Warnings: ${JSON.stringify(securityWarnings)}

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
        errorHandling: mlResult.raw_code ? 85 : 75
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
    console.log(`[Code Quality Audit] Saved new audit report to cache for: ${usernameToAudit}`);

    // 4. Return combined report
    return res.json({
      username: usernameToAudit,
      auditReport: auditReport
    });

  } catch (error) {
    console.error("Code Auditor Error:", error.message);
    res.status(500).json({ error: "Auditor runtime environment error!" });
  }
});

// ============================================================
// 💼 ATS JOB FIT ANALYZER (Node.js Gateway Proxy to Flask)
// ============================================================
router.post("/ats-match", authMiddleware, async (req, res) => {
  console.log(`\n--- 💼 ATS Match Engine Triggered by: ${req.user.username} ---`);

  try {
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Bhai yeh feature sirf recruiters ke liye hai!" });
    }

    const { targetUsername, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({ error: "Job description (JD) daalna zaroori hai bhai!" });
    }

    if (!targetUsername) {
      return res.status(400).json({ error: "Target developer ka username missing hai!" });
    }

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + targetUsername + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Is developer ka profile database mein nahi mila!" });
    }

    // Track recruiter ATS match check
    const newTrack = new Track({
      developerUsername: targetUsername,
      recruiterId: req.user.userId,
      recruiterUsername: req.user.username,
      actionType: 'ATS_MATCH',
      metaData: jobDescription
    });
    await newTrack.save();
    emitRecruiterActivity(req, targetUsername, 'ATS_MATCH', jobDescription.substring(0, 100) + "...");

    // 1. Construct candidate profile texts
    const candidateText = `Name: ${portfolio.name || targetUsername}. Bio: ${portfolio.bio}. Role: ${portfolio.predictedRole}. Projects: ` +
      (portfolio.projects || []).slice(0, 6).map(p => `${p.title}: ${p.description ? p.description.substring(0, 100) : ""} (${p.language})`).join(". ");

    // 2. Call Flask Semantic Cosine Similarity
    console.log(`[ML Gateway] Sending candidate texts to Flask ATS Matcher...`);
    const mlRes = await axios.post(`${AI_ENGINE_URL}/api/ml/ats-match`, {
      candidate_text: candidateText,
      jd_text: jobDescription
    });

    const mlResult = mlRes.data;
    const matchPercentage = Math.round(mlResult.match_percentage);

    return res.json({
      username: targetUsername,
      atsResult: {
        matchPercentage: matchPercentage,
        reasoning: mlResult.reasoning || `Match percentage evaluated semantic value is ${matchPercentage}% based on project embeddings.`,
        strengths: mlResult.strengths || [],
        missingTechOrGaps: mlResult.missingTechOrGaps || []
      }
    });

  } catch (error) {
    console.error("ATS Route Error:", error.message);
    res.status(500).json({ error: "ATS Engine runtime failure!" });
  }
});

// ============================================================
// 🎙️ Conversational Interview Assistant (Alex) Responses
// ============================================================
router.post("/interview/chat", authMiddleware, async (req, res) => {
  try {
    const { targetUsername, history } = req.body;
    const usernameToFetch = targetUsername || req.user.username;

    const portfolio = await Portfolio.findOne({ username: { $regex: new RegExp("^" + usernameToFetch + "$", "i") } });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data nahi mila!" });
    }

    let replyText = "Hello! Let's begin the technical mock interview. Can you describe the primary system architectures of your projects?";
    if (history && history.length > 0) {
      const lastUserMsg = history[history.length - 1]?.content || "";
      if (lastUserMsg.toLowerCase().includes("finish") || lastUserMsg.toLowerCase().includes("complete") || lastUserMsg.toLowerCase().includes("end")) {
        replyText = "Thank you so much. The mock interview session is now complete. I will analyze your performance metrics.";
      } else {
        replyText = "Got it, that is a clear explanation. Can you also discuss how you manage scalability and data consistency in this setup?";
      }
    }
    return res.json({ reply: replyText });

  } catch (error) {
    console.error("Interview Chat Route Error:", error.message);
    res.status(500).json({ error: "Conversational interview processing failed!" });
  }
});

module.exports = router;
