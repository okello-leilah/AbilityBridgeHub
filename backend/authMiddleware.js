
const jwt = require("jsonwebtoken");

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Please log in to continue."
    });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < 32) {
    return res.status(500).json({
      success: false,
      message: "Authentication is not configured correctly."
    });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      return res.status(401).json({
        success: false,
        message: "Your session has expired or your token is invalid. Please log in again."
      });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authenticateToken;
