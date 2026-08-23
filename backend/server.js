const dotenv = require("dotenv");
dotenv.config();    

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/db");

// Initialize DB Connection
connectDB();

const app = express();
const port = process.env.PORT || 5000;

// CORS: Allow frontend origin from env, fallback to all for dev
const allowedOrigins = process.env.FRONTEND_URL
  ? [process.env.FRONTEND_URL, "http://localhost:5173"]
  : ["*"];

app.use(cors({
  origin: allowedOrigins.includes("*") ? "*" : (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation: " + origin));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: !allowedOrigins.includes("*"),
}));
app.use(express.json({ limit: "5mb" }));

// Create Server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
    methods: ["GET", "POST", "PUT"]
  }
});

// Set Socket.IO globally for access in routes
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

// Mount Routes
const authRoutes = require("./routes/authRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const aiRoutes = require("./routes/aiRoutes");

app.use("/api/auth", authRoutes);
app.use("/api", portfolioRoutes);
app.use("/api/ai", aiRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "healthy", gateway: "Node.js Gateway" });
});

if (!process.env.VERCEL) {
  server.listen(port, () => {
    console.log(`🚀 Gateway server listening on port ${port}`);
  });
}


module.exports = app;