const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
const JWT_SECRET = process.env.JWT_SECRET;

async function runTests() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB!");

  // Find a developer user
  const devUser = await mongoose.connection.db.collection("users").findOne({ username: "Piyush-Garg-06" });
  if (!devUser) {
    console.error("Developer Piyush-Garg-06 not found!");
    process.exit(1);
  }

  // Create JWT token for Developer
  const token = jwt.sign(
    { userId: devUser._id.toString(), username: devUser.username, role: "developer" },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  console.log("Generated token:", token);

  // 1. Test Mock Interview Generate
  try {
    console.log("\n--- Testing /api/ai/interview/generate ---");
    const res = await axios.post("http://localhost:5000/api/ai/interview/generate", {
      targetUsername: "Piyush-Garg-06"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Generate Success! Status:", res.status);
    console.log("Data sample:", JSON.stringify(res.data).substring(0, 300));
  } catch (err) {
    console.error("Generate Failed! Status:", err.response ? err.response.status : "No response");
    console.error("Error data:", err.response ? err.response.data : err.message);
  }

  // 2. Test Code Audit
  try {
    console.log("\n--- Testing /api/ai/code-audit ---");
    const res = await axios.post("http://localhost:5000/api/ai/code-audit", {
      targetUsername: "Piyush-Garg-06"
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("Code Audit Success! Status:", res.status);
    console.log("Data sample:", JSON.stringify(res.data).substring(0, 300));
  } catch (err) {
    console.error("Code Audit Failed! Status:", err.response ? err.response.status : "No response");
    console.error("Error data:", err.response ? err.response.data : err.message);
  }

  process.exit(0);
}

runTests().catch(console.error);
