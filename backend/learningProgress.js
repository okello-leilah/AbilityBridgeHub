
const express = require("express");
const db = require("./db");
const authenticateToken = require("./authMiddleware");

const router = express.Router();

// Require a valid login token.
router.use(authenticateToken);

// Only parent accounts can access learning progress.
router.use((req, res, next) => {
  if (req.user.role !== "parent") {
    return res.status(403).json({
      success: false,
      message: "Only parent accounts can access learning progress."
    });
  }

  next();
});

// GET: Retrieve progress belonging to the logged-in parent's children.
router.get("/", (req, res) => {
  const parentId = req.user.id;

  const sql = `
    SELECT
      lp.id,
      lp.child_id,
      c.full_name AS child_name,
      lp.activity_name,
      lp.progress_notes,
      lp.progress_date,
      lp.created_at
    FROM learning_progress lp
    INNER JOIN children c ON c.id = lp.child_id
    WHERE c.parent_id = ?
    ORDER BY lp.progress_date DESC, lp.id DESC
  `;

  db.query(sql, [parentId], (err, results) => {
    if (err) {
      console.error("Get learning progress error:", err.message);

      return res.status(500).json({
        success: false,
        message: "Could not retrieve learning progress."
      });
    }

    return res.json({
      success: true,
      progress: results
    });
  });
});

// POST: Save progress for a child belonging to this parent.
router.post("/", (req, res) => {
  const { child_id, activity_name, progress_notes, progress_date } =
    req.body;

  const childId = Number(child_id);

  if (
    !Number.isSafeInteger(childId) ||
    childId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Please select a valid child."
    });
  }

  if (
    typeof activity_name !== "string" ||
    !activity_name.trim() ||
    activity_name.trim().length > 150
  ) {
    return res.status(400).json({
      success: false,
      message: "Activity name is required and must be 150 characters or fewer."
    });
  }

  if (
    progress_notes !== undefined &&
    progress_notes !== null &&
    typeof progress_notes !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Progress notes must be text."
    });
  }

  const notes = (progress_notes || "").trim();

  if (notes.length > 10000) {
    return res.status(400).json({
      success: false,
      message: "Progress notes are too long."
    });
  }

  let dateValue = null;

  if (progress_date !== undefined && progress_date !== null &&
      progress_date !== "") {
    if (
      typeof progress_date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(progress_date)
    ) {
      return res.status(400).json({
        success: false,
        message: "Progress date must use YYYY-MM-DD format."
      });
    }

    const parsedDate = new Date(`${progress_date}T00:00:00Z`);

    if (
      Number.isNaN(parsedDate.getTime()) ||
      parsedDate.toISOString().slice(0, 10) !== progress_date
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid progress date."
      });
    }

    dateValue = progress_date;
  }

  const parentId = req.user.id;

  // Verify ownership before saving anything.
  db.query(
    "SELECT id FROM children WHERE id = ? AND parent_id = ?",
    [childId, parentId],
    (err, children) => {
      if (err) {
        console.error("Verify child error:", err.message);

        return res.status(500).json({
          success: false,
          message: "Could not verify the selected child."
        });
      }

      if (children.length === 0) {
        return res.status(404).json({
          success: false,
          message: "The selected child was not found in your account."
        });
      }

      const sql = `
        INSERT INTO learning_progress
          (child_id, activity_name, progress_notes, progress_date)
        VALUES (?, ?, ?, COALESCE(?, CURDATE()))
      `;

      db.query(
        sql,
        [childId, activity_name.trim(), notes || null, dateValue],
        (insertErr, result) => {
          if (insertErr) {
            console.error("Save learning progress error:", insertErr.message);

            return res.status(500).json({
              success: false,
              message: "Could not save learning progress."
            });
          }

          return res.status(201).json({
            success: true,
            message: "Learning progress saved successfully.",
            progress: {
              id: result.insertId,
              child_id: childId,
              activity_name: activity_name.trim(),
              progress_notes: notes || null,
              progress_date: dateValue
            }
          });
        }
      );
    }
  );
});

module.exports = router;
