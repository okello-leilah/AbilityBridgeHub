
const express = require("express");
const db = require("./db");
const authenticateToken = require("./authMiddleware");

const router = express.Router();

// All routes in this file require a valid login token.
router.use(authenticateToken);

// Allow only parent accounts to manage their children's records.
router.use((req, res, next) => {
  if (req.user.role !== "parent") {
    return res.status(403).json({
      success: false,
      message: "Only parent accounts can access these routes."
    });
  }

  next();
});

// GET: List children belonging to the logged-in parent.
router.get("/", (req, res) => {
  const parentId = req.user.id;

  db.query(
    `SELECT id, full_name, date_of_birth, learning_needs, created_at
     FROM children
     WHERE parent_id = ?
     ORDER BY created_at DESC`,
    [parentId],
    (err, results) => {
      if (err) {
        console.error("Get children error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Could not retrieve your children's records."
        });
      }

      return res.json({
        success: true,
        children: results
      });
    }
  );
});

// POST: Register a child under the logged-in parent.
router.post("/", (req, res) => {
  const { full_name, date_of_birth, learning_needs } = req.body;

  if (
    typeof full_name !== "string" ||
    !full_name.trim() ||
    full_name.trim().length > 100
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a child's name of up to 100 characters."
    });
  }

  if (
    typeof date_of_birth !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date_of_birth)
  ) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid date of birth in YYYY-MM-DD format."
    });
  }

  const parsedDate = new Date(`${date_of_birth}T00:00:00Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date_of_birth ||
    parsedDate > today
  ) {
    return res.status(400).json({
      success: false,
      message: "The date of birth must be a valid date that is not in the future."
    });
  }

  if (
    learning_needs !== undefined &&
    learning_needs !== null &&
    typeof learning_needs !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Learning needs must be entered as text."
    });
  }

  const needs = (learning_needs || "").trim();

  if (needs.length > 10000) {
    return res.status(400).json({
      success: false,
      message: "The learning needs description is too long."
    });
  }

  const parentId = req.user.id;

  db.query(
    `INSERT INTO children
      (full_name, date_of_birth, learning_needs, parent_id)
     VALUES (?, ?, ?, ?)`,
    [full_name.trim(), date_of_birth, needs || null, parentId],
    (err, result) => {
      if (err) {
        console.error("Add child error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Could not save the child's record."
        });
      }

      return res.status(201).json({
        success: true,
        message: "Child registered successfully.",
        child: {
          id: result.insertId,
          full_name: full_name.trim(),
          date_of_birth,
          learning_needs: needs || null,
          parent_id: parentId
        }
      });
    }
  );
});

module.exports = router;
