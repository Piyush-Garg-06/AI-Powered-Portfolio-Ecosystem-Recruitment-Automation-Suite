const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const Portfolio = require("./models/Portfolio");
const Groq = require("groq-sdk");
const axios = require("axios");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const GROQ_MODEL = "groq/compound";

async function testGenerate() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB!");

  const usernameToFetch = "Piyush-Garg-06";
  const portfolio = await Portfolio.findOne({ username: usernameToFetch });
  if (!portfolio) {
    console.error("Portfolio not found!");
    process.exit(1);
  }

  console.log("Found portfolio with projects:", portfolio.projects.length);

  try {
    console.log("Calling Groq to generate questions...");
    const systemPrompt = `You are an elite Technical Interviewer and Code Auditor. 
    Analyze the candidate's GitHub projects (titles, descriptions, and languages) and generate exactly 4 highly-specific, challenging, and custom technical interview questions.
    
    The questions must probe their system architecture choices, potential bottlenecks, and security practices based directly on their real projects.
    
    CRITICAL: You must respond ONLY with a valid JSON array of objects. Do not include markdown blocks like \`\`\`json or any conversational prefix/suffix. The JSON must match this structure exactly:
    [
      {
        "id": 1,
        "topic": "System Design",
        "question": "Your question here?",
        "expectedKeywords": ["keyword1", "keyword2", "keyword3"]
      }
    ]

    CANDIDATE PROJECTS:
    ${JSON.stringify((portfolio.projects || []).slice(0, 6).map(p => ({ title: p.title, description: p.description ? p.description.substring(0, 100) : "", language: p.language })))}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.3,
    });

    const content = chatCompletion.choices[0]?.message?.content || "[]";
    console.log("Raw Response Content:\n", content);
    const parsed = JSON.parse(content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim());
    console.log("Parsed Successfully! Questions count:", parsed.length);
  } catch (err) {
    console.error("Generate Error caught:");
    console.error(err.stack || err);
  }

  try {
    console.log("\nCalling Flask and Groq for Code Audit...");
    const repoTexts = portfolio.projects.map(p => `${p.title} ${p.description} ${p.language}`);
    console.log("Calling Flask code-audit on http://127.0.0.1:8000/api/ml/code-audit ...");
    const flaskRes = await axios.post("http://127.0.0.1:8000/api/ml/code-audit", { 
      repo_texts: repoTexts 
    });
    console.log("Flask Audit success:", flaskRes.data);

    console.log("Calling Groq to summarize code audit...");
    const systemPrompt = `You are a Principal Software Architect and Cybersecurity Specialist.
    Review the static code metrics and security patterns retrieved from the candidate's repository scan. Provide an elite, constructive code audit.
    
    CRITICAL: Respond ONLY with a valid JSON object. Do not include markdown blocks like \`\`\`json or conversational text. The response must match this structure:
    {
      "overallScore": 82,
      "summary": "High-level summary of code quality.",
      "metrics": {
        "complexity": "Low/Medium/High",
        "maintainability": "Excellent/Good/Needs Work",
        "riskLevel": "Low/Medium/High"
      },
      "codeFlaws": [
        "Identified security vulnerability or poor structural pattern"
      ],
      "architectSuggestions": [
        "Specific engineering recommendation to improve the codebase"
      ]
    }

    STATIC METRICS DATA:
    ${JSON.stringify(flaskRes.data)}
    `;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: systemPrompt }],
      model: GROQ_MODEL,
      temperature: 0.2,
    });

    const reply = chatCompletion.choices[0]?.message?.content || "{}";
    console.log("Raw Audit Reply:\n", reply);
    const parsed = JSON.parse(reply.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "").trim());
    console.log("Parsed Audit Successfully!", parsed);
  } catch (err) {
    console.error("Audit Error caught:");
    console.error(err.stack || err);
  }

  process.exit(0);
}

testGenerate().catch(console.error);
