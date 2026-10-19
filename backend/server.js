
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const authRoutes = require("./auth");
const childrenRoutes = require("./children");
const learningProgressRoutes = require("./learningProgress");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "1mb" }));

// Authentication routes
app.use("/api/auth", authRoutes);

// Protected children routes
app.use("/api/children", childrenRoutes);

// Protected learning progress routes
app.use("/api/learning-progress", learningProgressRoutes);

// Welcome route
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to Ability Bridge Hub API!",
    status: "Server is running successfully."
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Ability Bridge Hub backend is healthy."
  });
});

// Database test
app.get("/api/db-test", (req, res) => {
  db.query("SELECT 1 AS test", (err, results) => {
    if (err) {
      console.error("Database test error:", err.message);

      return res.status(500).json({
        success: false,
        message: "Database query failed."
      });
    }

    return res.json({
      success: true,
      message: "Ability Bridge Hub database is working!",
      result: results[0]
    });
  });
});

// Handle unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found."
  });
});

// General error handler
app.use((err, req, res, next) => {
  console.error("Server error:", err.message);

  res.status(500).json({
    success: false,
    message: "An unexpected server error occurred."
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(
    `Ability Bridge Hub server running on port ${PORT}`
  );
});
