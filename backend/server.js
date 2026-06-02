const dotenv = require("dotenv");
dotenv.config();    

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const axios = require("axios");

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');


const User = require('./models/User'); 
const Portfolio = require('./models/Portfolio'); 
const Track = require('./models/Track'); 

//ai using gemini : 
// const { GoogleGenAI } = require("@google/genai");
// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });


//ai using groq

const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// 🔥 Centralized Groq Model (Switch to llama-3.1-8b-instant to avoid rate limits)
const GROQ_MODEL = "llama-3.1-8b-instant";




connectDB();

const app = express();

app.use(cors());
app.use(express.json());



// ============================================================
// 🔒 AUTH MIDDLEWARE: Token verify karne aur Role nikalne ke liye
// ============================================================
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // 'Bearer TOKEN' format se token nikalna

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied! Login karo pehle." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Isme userId, username, aur role milega
    next();
  } catch (err) {
    res.status(401).json({ error: "Token valid nahi hai bhai!" });
  }
};

// Helper utility to notify developer via WebSocket on recruiter action
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




const http = require("http");
const { Server } = require("socket.io");

const port = process.env.PORT || 3000;

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log(`🔌 Live client connected: ${socket.id}`);

  socket.on("join-developer-room", (username) => {
    socket.join(`developer:${username}`);
    console.log(`👤 Socket ${socket.id} joined developer room: developer:${username}`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

server.listen(port, () => {
  console.log(`server listening at port ${port}`);
});



app.get("/", (req, res)=>{
    res.send("Hello")
})


app.post('/api/auth/register', async (req, res) => {
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
      role: role || 'developer', // Agar frontend se role nahi aaya toh default developer
      companyName: companyName || ''
    });

    await newUser.save();
    res.status(201).json({ message: 'User ekdam kamal tarike se register ho gaya! 🎉' });

  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server me koi gadbad hui register karte waqt!' });
  }
});




// Auth Route: User Login (Updated with Roles in JWT)
app.post('/api/auth/login', async (req, res) => {
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

    // 🔥 ROLE INJECTED IN JWT: Ab token batayega ki user kaun hai
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
        role: user.role // Frontend ko redirect karne me help karega
      }
    });
    
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server me koi gadbad hui login karte waqt!' });
  }
});

// Naya Route: Username ke basis par data lane ke liye
app.get('/api/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const url = `https://api.github.com/users/${username}`;
    const response = await axios.get(url);
    
    // Sirf wahi data bhejenge jo portfolio ke liye chahiye
    res.json({
      name: response.data.name,
      bio: response.data.bio,
      avatar: response.data.avatar_url,
      repos_count: response.data.public_repos
    });

    // console.log(response.data)

  } catch (err) {
    res.status(404).json({ error: 'User nahi mila bhai!' });
  }
});


// Master Route: Get or Create Portfolio
app.get('/api/portfolio/:username', async (req, res) => {
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
    let portfolio = await Portfolio.findOne({ username });

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

    // 4. Update or Upsert in DB
    portfolio = await Portfolio.findOneAndUpdate(
      { username: username },
      {
        username: username,
        name: profileRes.data.name || username,
        bio: profileRes.data.bio || '',
        avatar: profileRes.data.avatar_url,
        projects: formattedProjects,
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
app.put('/api/portfolio/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { name, bio } = req.body;

    const updatedPortfolio = await Portfolio.findOneAndUpdate(
      { username },
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
    res.status(550).json({ error: 'Server me kuch dikkat aayi update karte waqt!' });
  }
});




// ============================================================
// 🤖 DUAL AI CHAT ENGINE: Role ke hisab se behaviour badlega (Groq Powered)
// ============================================================
app.post("/api/ai/chat", authMiddleware, async (req, res) => {
  console.log(`\n--- 📥 Chat Engine Triggered by Role: ${req.user.role} ---`);
  
  try {
    const { message, targetUsername } = req.body; 
    const loggedInUserRole = req.user.role; // Token se role nikala

    let systemPrompt = "";
    let portfolio;

    // --------------------------------------------------------
    // CASE A: DEVELOPER LOGIN HAI -> Self-Improvement Bot
    // --------------------------------------------------------
    if (loggedInUserRole === "developer") {
      // Developer apni khud ki profile analyze karega token wale username se
      portfolio = await Portfolio.findOne({ username: req.user.username });
      
      if (!portfolio) {
        return res.status(404).json({ reply: "Pehle master sync route ko hit karke apna data load karo bhai!" });
      }

      systemPrompt = `You are an elite Technical Mentor and Career Coach. You are speaking directly to the developer, ${portfolio.name}.
      Your job is to analyze their portfolio data (projects, tech stack, descriptions) and provide them critical feedback on how to improve their skills, clean code tips, what features to add to their current projects, and advice on cracking top tech companies. Keep responses strictly short, direct, and practical (Maximum 2-3 sentences). Only speak in professional English.

      DEVELOPER'S LIVE DATA FOR MENTORSHIP:
      Bio: ${portfolio.bio}
      Projects: ${JSON.stringify(portfolio.projects || [])}
      `;
    } 
    
    // --------------------------------------------------------
    // CASE B: RECRUITER LOGIN HAI -> Evaluation & Assessment Bot
    // --------------------------------------------------------
    else if (loggedInUserRole === "recruiter") {
      if (!targetUsername) {
        return res.status(400).json({ reply: "Recruiter bhai, kis developer ka data test karna hai? targetUsername dalo body mein!" });
      }

      portfolio = await Portfolio.findOne({ username: targetUsername });
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
      Bio: ${portfolio.bio}
      Projects: ${JSON.stringify(portfolio.projects || [])}
      `;
    }

    // 🔥 GROQ CALL (No limit reset tension!)
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
    res.status(500).json({ reply: "AI Engine processing mein jhol ho gaya!", details: error.message });
  }
});






// ============================================================
// 🤖 FEATURE 2: VISUAL AI MOCK INTERVIEW GENERATOR (Tabs/Navbar Ke Liye)
// ============================================================
app.post("/api/ai/interview/generate", authMiddleware, async (req, res) => {
  console.log(`\n--- 🤖 Interview Engine Triggered by: ${req.user.username} ---`);
  
  try {
    const { targetUsername } = req.body; // Agar recruiter dekh raha hai toh target, nahi toh khud dev apna dega
    const usernameToFetch = targetUsername || req.user.username;

    // 1. Database se portfolio data nikalna
    const portfolio = await Portfolio.findOne({ username: usernameToFetch });
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
      console.log(`[Track] MOCK_INTERVIEW saved for recruiter ${req.user.username} on dev ${usernameToFetch}`);
      emitRecruiterActivity(req, usernameToFetch, 'MOCK_INTERVIEW', `Generated technical interview kit`);
    }

    // 2. Groq ko strictly JSON array nikalne ke liye engineering prompt
    const systemPrompt = `You are a Senior Principal Engineer conducting a technical interview for ${portfolio.name || usernameToFetch}.
    Analyze their project stack and descriptions. Generate a structured set of 4 tough, real-world technical interview questions based strictly on the technologies they used in their actual projects (like React, Node.js, MongoDB, SQL, etc.).

    CRITICAL: You must respond ONLY with a valid JSON array. Do not include any conversational text or markdown blocks like \`\`\`json. The JSON must follow this exact structure:
    [
      {
        "id": 1,
        "topic": "Database Architecture / Project SVR",
        "question": "A specific tough question regarding their project choices or technology integration.",
        "expectedKeywords": ["indexing", "sharding", "acid properties"]
      },
      {
        "id": 2,
        "topic": "State Management / Frontend API",
        "question": "A conceptual question matching their frontend implementations.",
        "expectedKeywords": ["useCallback", "context api", "re-rendering"]
      }
    ]

    RANDOMIZATION SEED FOR FRESH GENERATION: ${Math.random().toString(36).substring(7)}
    Ensure these questions are highly specific, varied, and distinct from any previously generated questions. Do not copy the placeholder example questions literal text. Make sure questions directly relate to the candidate's projects listed below.

    CANDIDATE PROJECTS:
    ${JSON.stringify(portfolio.projects || [])}
    `;

    console.log(`[Interview Engine] Llama-3 se questions framework pull ho raha hai for: ${usernameToFetch}`);

    // 3. GROQ Call
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.7, // Higher temp for creative variety
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "[]";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    // 4. JSON Array response bhej rahe hain frontend navbar tab ke liye
    try {
      const interviewQuestions = JSON.parse(replyText);
      console.log(`✅ [Interview Success] Shipped ${interviewQuestions.length} custom interview questions.`);
      return res.json({ username: usernameToFetch, questions: interviewQuestions });
    } catch (parseErr) {
      console.error("❌ JSON parsing fail in Interview Route. Raw response:", replyText);
      return res.status(500).json({ error: "AI response parse nahi ho paya!", rawText: replyText });
    }

  } catch (error) {
    console.error("Interview Route Error:", error.message);
    res.status(500).json({ error: "Interview generate karne mein backend par dikkat aayi!" });
  }
});


// ============================================================
// 🎙️ FEATURE 2B: AI CONVERSATIONAL INTERVIEW AVATAR
// ============================================================
app.post("/api/ai/interview/chat", authMiddleware, async (req, res) => {
  console.log(`\n--- 🎙️ Interview Chat Engine Triggered by: ${req.user.username} ---`);
  
  try {
    const { targetUsername, history } = req.body;
    const usernameToFetch = targetUsername || req.user.username;

    // 1. Get Portfolio
    const portfolio = await Portfolio.findOne({ username: usernameToFetch });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data nahi mila!" });
    }

    // 2. Build system prompt
    const systemPrompt = `You are "Alex", an elite technical interviewer conducting a mock coding interview for candidate ${portfolio.name || usernameToFetch}.
    Your job is to evaluate their response to your previous question and ask the next relevant question based on their project stack:
    Projects: ${JSON.stringify(portfolio.projects || [])}
    Bio: ${portfolio.bio || ""}

    CRITICAL RULES:
    1. Speak only in English.
    2. Keep your response very concise (Maximum 2 short sentences). It will be spoken out loud via text-to-speech. Do not use formatting like bullet points or markdown.
    3. Be professional and encouraging. Offer a tiny 1-sentence feedback or transition, and then ask the next question.
    4. If the history is empty, greet them briefly and ask your first interview question about one of their projects.
    5. If the user indicates they want to finish, say thank you and announce that the interview is complete.
    `;

    // 3. Format messages for Groq
    const messages = [
      { role: "system", content: systemPrompt },
      ...(history || [])
    ];

    // 4. GROQ Call
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: GROQ_MODEL,
      temperature: 0.5,
    });

    const replyText = chatCompletion.choices[0]?.message?.content || "AI interviewer is offline.";
    console.log(`✅ [Interview Chat Success] Reply: ${replyText}`);
    return res.json({ reply: replyText });

  } catch (error) {
    console.error("Interview Chat Route Error:", error.message);
    res.status(500).json({ error: "Conversational interview processing failed!" });
  }
});


// ============================================================
// 📝 FEATURE 2C: AI MOCK INTERVIEW ANSWER CHECKER
// ============================================================
app.post("/api/ai/interview/check", authMiddleware, async (req, res) => {
  console.log(`\n--- 📝 Answer Checker Triggered by: ${req.user.username} ---`);
  
  try {
    const { question, expectedKeywords, userAnswer } = req.body;

    if (!userAnswer || userAnswer.trim() === "") {
      return res.status(400).json({ error: "Answer content missing!" });
    }

    // 1. Build prompt
    const systemPrompt = `You are a strict technical interviewer.
    Evaluate the candidate's answer to the technical question:
    Question: "${question}"
    Expected Keywords/Concepts: ${JSON.stringify(expectedKeywords || [])}

    Candidate's Answer: "${userAnswer}"

    Analyze if they answered correctly, covered the key concepts, and return a score between 0 and 100 representing the accuracy.
    Also provide a short 1-sentence feedback.

    CRITICAL: You must respond ONLY with a valid JSON object. Do not include markdown blocks like \`\`\`json or conversational text. Follow this structure:
    {
      "accuracy": 85,
      "feedback": "Your explanation of state management was correct, and you hit key terms like useContext."
    }
    `;

    // 2. GROQ Call
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.1, // Low temp for structured output
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const evaluation = JSON.parse(replyText);
      console.log(`✅ [Evaluation Success] Score: ${evaluation.accuracy}%`);
      return res.json(evaluation);
    } catch (parseErr) {
      console.error("❌ Evaluation Parse Fail. Raw text was:", replyText);
      return res.status(500).json({ error: "AI evaluation response parsing failed!" });
    }

  } catch (error) {
    console.error("Answer Checker Error:", error.message);
    res.status(500).json({ error: "Evaluation engine runtime failure!" });
  }
});


// ============================================================
// 🔍 FEATURE 3: AI CODE QUALITY AUDITOR (Dashboard View Route)
// ============================================================
app.post("/api/ai/code-audit", authMiddleware, async (req, res) => {
  console.log(`\n--- 🔍 Code Auditor Triggered by: ${req.user.username} ---`);
  
  try {
    const { targetUsername } = req.body;
    const usernameToAudit = targetUsername || req.user.username;

    const portfolio = await Portfolio.findOne({ username: usernameToAudit });
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio data missing for audit!" });
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
      console.log(`[Track] CODE_AUDIT saved for recruiter ${req.user.username} on dev ${usernameToAudit}`);
      emitRecruiterActivity(req, usernameToAudit, 'CODE_AUDIT', `Conducted code quality audit`);
    }

    // Strict auditing rules prompt
    const systemPrompt = `You are an elite Automated Code Reviewer and Security Auditor.
    Analyze the developer's projects and bio. Deduce their technical architecture patterns and create a detailed visual Metric Report.

    CRITICAL: Respond ONLY with a valid JSON object. No markdown blocks, no text. Follow this structure:
    {
      "scores": {
        "cleanCode": 85,
        "security": 70,
        "scalability": 75,
        "errorHandling": 80
      },
      "architecturalReview": "A 2-sentence summary of the developer's typical system design approach.",
      "securityAlerts": [
        "Suggestion 1 regarding standard security fixes (e.g., implementing rate limiters, token rotation)",
        "Suggestion 2 regarding database handling"
      ]
    }

    CANDIDATE PROJECTS DATA:
    ${JSON.stringify(portfolio.projects || [])}
    `;

    console.log(`[Auditor Engine] Generating structured quality metrics for: ${usernameToAudit}`);

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.1,
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const auditReport = JSON.parse(replyText);
      console.log(`✅ [Audit Success] Quality Score Report generated safely.`);
      return res.json({ username: usernameToAudit, auditReport });
    } catch (parseErr) {
      console.error("❌ Audit Parse Fail. Raw text was:", replyText);
      return res.status(500).json({ error: "Auditor response parsing failed!" });
    }

  } catch (error) {
    console.error("Code Auditor Error:", error.message);
    res.status(500).json({ error: "Auditor runtime environment error!" });
  }
});



// ============================================================
// 💼 FEATURE 1: DEDICATED VISUAL ATS SIMULATOR (Navbar / Tabs ke liye)
// ============================================================
app.post("/api/ai/ats-match", authMiddleware, async (req, res) => {
  console.log(`\n--- 💼 ATS Match Engine Triggered by: ${req.user.username} (${req.user.role}) ---`);
  
  try {
    // 🔒 SECURITY LOCK: Sirf logged-in recruiter hi kisi dev ka ATS chala sakega
    if (req.user.role !== "recruiter") {
      return res.status(403).json({ error: "Bhai yeh feature sirf recruiters ke liye hai! Developers ke dashboard par iska access nahi hai." });
    }

    const { targetUsername, jobDescription } = req.body;

    if (!jobDescription || jobDescription.trim() === "") {
      return res.status(400).json({ error: "Job description (JD) daalna zaroori hai bhai!" });
    }

    if (!targetUsername) {
      return res.status(400).json({ error: "Target developer ka username missing hai!" });
    }

    // 1. Database se target developer ka portfolio fetch karna
    const portfolio = await Portfolio.findOne({ username: targetUsername });
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
    console.log(`[Track] ATS_MATCH saved for recruiter ${req.user.username} on dev ${targetUsername}`);
    emitRecruiterActivity(req, targetUsername, 'ATS_MATCH', jobDescription.substring(0, 100) + "...");

    const userName = portfolio.name || targetUsername;

    // 2. Groq Llama-3 ke liye strict data comparison prompt
    const systemPrompt = `You are an elite Application Tracking System (ATS) and a principal technical recruiter.
    Your task is to analyze the Candidate's Portfolio Data against the provided Job Description (JD).
    
    Calculate a realistic match percentage based on their project stack, bio complexity, and languages used.

    CRITICAL: You must respond ONLY with a valid JSON object. Do not include markdown blocks like \`\`\`json or any conversational filler text. The JSON must strictly match this exact structure:
    {
      "matchPercentage": 85,
      "reasoning": "A concise 2-sentence summary explaining why this score was assigned based on their projects.",
      "strengths": ["List 2-3 core skills or projects that match perfectly with the JD"],
      "missingTechOrGaps": ["List 2-3 technologies or concepts from the JD that the candidate has NOT explicitly implemented in their projects"]
    }

    CANDIDATE PORTFOLIO DATA:
    Name: ${userName}
    Bio: ${portfolio.bio}
    Projects: ${JSON.stringify(portfolio.projects || [])}

    JOB DESCRIPTION TO MATCH:
    ${jobDescription}
    `;

    console.log(`[ATS Engine] Groq Llama-3 parsing data for candidate: ${targetUsername}`);

    // 3. GROQ Call
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt }
      ],
      model: GROQ_MODEL,
      temperature: 0.1, // Low temperature taaki structure break na ho aur data badle nahi
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Clean potential markdown tags if AI leaks them
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    // 4. Clean JSON Object frontend layout ke liye send karna
    try {
      const atsResult = JSON.parse(replyText);
      console.log(`✅ [ATS Success] Generated Match Score: ${atsResult.matchPercentage}%`);
      return res.json({ username: targetUsername, atsResult });
    } catch (parseErr) {
      console.error("❌ JSON parsing failed in ATS Engine. Raw response was:", replyText);
      return res.status(500).json({ 
        error: "AI response format valid JSON nahi tha!", 
        rawText: replyText 
      });
    }

  } catch (error) {
    console.error("ATS Route Error:", error.message);
    res.status(500).json({ error: "ATS Engine runtime failure!" });
  }
});


// ============================================================
// 📈 FEATURE 4: RECRUITER HIRING INTENT ANALYTICS API
// ============================================================
app.get('/api/developer/hiring-intent', authMiddleware, async (req, res) => {
  console.log(`\n--- 📈 Hiring Intent Analytics Triggered for: ${req.user.username} ---`);

  try {
    if (req.user.role !== 'developer') {
      return res.status(403).json({ error: "Bhai, yeh dashboard sirf developers ke liye hai!" });
    }

    const username = req.user.username;

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

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "system", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.2, // low temperature for stability
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "{}";
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    try {
      const analysisResult = JSON.parse(replyText);
      console.log(`✅ [Hiring Intent Success] Generated score breakdown for developer.`);
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


// ============================================================
// 🗺️ FEATURE 5: AI TECH-STACK ROADMAP GENERATOR (Only for Developers)
// ============================================================
app.post("/api/developer/roadmap", authMiddleware, async (req, res) => {
  console.log(`\n--- 🗺️ Generating Customized Up-skilling Roadmap for: ${req.user.username} ---`);
  
  try {
    // 🔒 SECURITY CHECK: Sirf logged-in developer hi apna roadmap generate kar sakta hai
    if (req.user.role !== "developer") {
      return res.status(403).json({ error: "Bhai yeh feature sirf developers ke liye hai! Recruiters ko roadmap ki zaroorat nahi hai." });
    }

    const { targetGoal } = req.body; // e.g., "I want to learn DevOps and AWS" ya "System Design"

    if (!targetGoal || targetGoal.trim() === "") {
      return res.status(400).json({ error: "Bhai apna agla target goal toh dalo (e.g., DevOps, GenAI, System Design)!" });
    }

    // 1. Database se developer ka current portfolio/projects data nikalna
    const portfolio = await Portfolio.findOne({ username: req.user.username });
    if (!portfolio) {
      return res.status(404).json({ error: "Pehle master sync route se apni profile create karo bhai!" });
    }

    // 2. Groq Llama-3 ke liye Step-by-Step Structural Prompt Engineering
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
    Projects: ${JSON.stringify(portfolio.projects || [])}

    DEVELOPER'S TARGET GOAL:
    ${targetGoal}
    `;

    console.log(`[Roadmap Engine] Groq processing week-by-week transition map for: ${req.user.username}`);

    // 3. GROQ Call (Super Fast JSON Structuring)
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt }
      ],
      model: GROQ_MODEL,
      temperature: 0.3, // Mild temperature to keep creative yet highly structured JSON
    });

    let replyText = chatCompletion.choices[0]?.message?.content || "{}";
    
    // Safety check: Clean markdown wrappers if any leaked
    replyText = replyText.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim();

    // 4. Clean JSON Object return karna taaki frontend par timeline steps ban sakein
    try {
      const roadmapResult = JSON.parse(replyText);
      console.log(`✅ [Roadmap Success] Shipped a customized 6-week roadmap for ${targetGoal}`);
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










// //ai using groq

// app.post("/api/ai/chat", async (req, res) => {
//   try {
//     const { message, username } = req.body;
//     const portfolio = await Portfolio.findOne({ username });

//     if (!portfolio) {
//       return res.status(404).json({ reply: "User profile not found!" });
//     }

//     const userName = portfolio.name || "the developer";
    
//     // ... aapka purana context building text yahan aayega ...
//     const context = `You are an expert technical recruiter and the professional AI Assistant of ${userName}.
//     Your job is to DEEPLY ANALYZE the raw data provided below and deduce the user's skills, expertise, and tech stack yourself based on their projects and bio. Do not rely on a separate skills list.

//     CRITICAL RULES:
//     1. Always reply in English only. Keep it professional.
//     2. Keep responses short, crisp, and to-the-point (Maximum 2-3 sentences). No long paragraphs.
//     3. Do NOT refuse any questions. If someone asks about skills, advice, or tech stack, analyze the projects below and tell them what expertise this user possesses based on their actual work.

//     RAW PORTFOLIO DATA FOR YOUR DEEP ANALYSIS:
//     Name: ${userName}
//     Bio: ${portfolio.bio || ""}
//     Projects: ${JSON.stringify(portfolio.projects || [])}
//     `;

//     // 🔥 GROQ API CALL (Gemini ka bilkul makkhan replacement)
//     const chatCompletion = await groq.chat.completions.create({
//       messages: [
//         {
//           role: "system",
//           content: context,
//         },
//         {
//           role: "user",
//           content: message,
//         },
//       ],
//       model: "llama-3.3-70b-versatile", // Ye model ekdam top-notch aur free hai
//       temperature: 0.3, // Output ko strict aur to-the-point rakhne ke liye
//     });

//     const replyText = chatCompletion.choices[0]?.message?.content || "No response generated.";
    
//     return res.json({ reply: replyText });

//   } catch (error) {
//     console.error("Groq API Error:", error.message);
//     res.status(500).json({ reply: "AI engine mein kuch jhol ho gaya bhai!", details: error.message });
//   }
// });















// // //ai using gemini




// app.post("/api/ai/chat", async (req, res) => {
//   console.log("\n--- 📥 Naya Message Aaya ---");
//   console.log("Req Body:", req.body);

//   try {
//     const { message, username } = req.body;

//     // ==========================================
//     // LAYER 1: DATABASE CHECK
//     // ==========================================
//     let portfolio;
//     try {
//       console.log(`[DB] Portfolio dhoondh rahe hain username ke liye: ${username}`);
//       portfolio = await Portfolio.findOne({ username });
//       console.log("[DB] Database se response mila:", portfolio ? "DATA FOUND" : "NULL DATA");
//     } catch (dbError) {
//       console.error("❌ LAYER 1 ERROR (Database Crash):", dbError.message);
//       return res.status(500).json({ 
//         reply: "Database se connect nahi ho paya bhai!", 
//         details: dbError.message 
//       });
//     }

//     if (!portfolio) {
//       console.log(`⚠️ User '${username}' database mein nahi mila.`);
//       return res.status(404).json({ reply: "User profile not found in database!" });
//     }

//     const userName = portfolio.name || "the portfolio owner";

//     // Deep Analysis waala context
//     const context = `You are an expert technical recruiter and the professional AI Assistant of ${userName}.
//     Your job is to DEEPLY ANALYZE the raw data provided below and deduce the user's skills, expertise, and tech stack yourself based on their projects and bio. Do not rely on a separate skills list.

//     CRITICAL RULES:
//     1. Always reply in English only. Keep it professional.
//     2. Keep responses short, crisp, and to-the-point (Maximum 2-3 sentences). No long paragraphs.
//     3. Do NOT refuse any questions. If someone asks about skills, advice, or tech stack, analyze the projects below and tell them what expertise this user possesses based on their actual work.

//     RAW PORTFOLIO DATA FOR YOUR DEEP ANALYSIS:
//     Name: ${userName}
//     Bio: ${portfolio.bio || ""}
//     Projects: ${JSON.stringify(portfolio.projects || [])}
//     `;

//     // ==========================================
//     // LAYER 2: GEMINI API CALL
//     // ==========================================
//     let response;
//     try {
//       console.log("[Gemini] API ko request bhej rahe hain...");
      
//       response = await ai.models.generateContent({
//         model: 'gemini-2.0-flash',
//         contents: `${context}\n\nQuestion: ${message}`,
//       });

//       console.log("[Gemini] API se raw response aa gaya.");
//     } catch (geminiError) {
//       console.error("❌ LAYER 2 ERROR (Gemini API Call Failed):", geminiError);
//       return res.status(500).json({ 
//         reply: "Gemini API ne jawab dene se mana kar diya bhai!", 
//         details: geminiError.message 
//       });
//     }

//     // ==========================================
//     // LAYER 3: TEXT PARSING
//     // ==========================================
//     try {
//       console.log("[Parsing] Text nikal rahe hain response se...");
//       const replyText = typeof response.text === 'function' ? response.text() : response.text;
      
//       console.log("✅ [Success] Final AI Reply:", replyText);
//       return res.json({ reply: replyText });
//     } catch (parseError) {
//       console.error("❌ LAYER 3 ERROR (Text Extract Fail):", parseError.message);
//       return res.status(500).json({ 
//         reply: "Gemini se response aaya par use padh nahi paye!", 
//         details: parseError.message 
//       });
//     }

//   } catch (globalError) {
//     // Ye tab chalega agar upar koi unpredictable jhol ho jaye
//     console.error("❌ GLOBAL CRITICAL ERROR:", globalError);
//     res.status(500).json({ 
//       reply: "Route ke andar koi bada jhol ho gaya bhai!", 
//       details: globalError.message 
//     });
//   }
// });



// // Naya Route: User ke projects lane ke liye
// app.get('/api/user/:username/projects', async (req, res) => {
//   try {
//     const { username } = req.params;
//     // ?sort=updated se latest projects pehle aayenge
//     const url = `https://api.github.com/users/${username}/repos?sort=updated&per_page=6`; 
//     const response = await axios.get(url);
    
//     // Har project se kaam ki cheezein nikalna
//     const projects = response.data.map(repo => ({
//       title: repo.name,
//       description: repo.description,
//       url: repo.html_url,
//       stars: repo.stargazers_count,
//       language: repo.language
//     }));
    
//     res.json(projects);
//     console.log(response.data)
//   } catch (err) {
//     res.status(404).json({ error: 'Projects nahi mile bhai!' });
//   }
// });