const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("MONGO_URI missing in .env!");
  process.exit(1);
}

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB!");
    
    // Check Users
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log("Users in DB:", users.map(u => ({ username: u.username, role: u.role })));

    // Check Portfolios
    const portfolios = await mongoose.connection.db.collection("portfolios").find({}).toArray();
    console.log("Portfolios in DB:", portfolios.map(p => ({ username: p.username, name: p.name, projectsCount: p.projects ? p.projects.length : 0 })));

    process.exit(0);
  })
  .catch(err => {
    console.error("DB error:", err);
    process.exit(1);
  });
