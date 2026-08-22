const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "No token, authorization denied! Login karo pehle." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Contains userId, username, and role
    next();
  } catch (err) {
    res.status(401).json({ error: "Token valid nahi hai bhai!" });
  }
};

module.exports = authMiddleware;
