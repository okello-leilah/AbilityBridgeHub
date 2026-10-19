
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("./db");

const router = express.Router();

// REGISTER
router.post("/register", (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password) {
    return res.status(400).json({
      success: false,
      message: "Full name, email and password are required."
    });
  }

  const name = full_name.trim();
  const userEmail = email.trim().toLowerCase();

  if (!name || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Full name must be between 1 and 100 characters."
    });
  }

  if (userEmail.length > 150 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail)) {
    return res.status(400).json({
      success: false,
      message: "Please provide a valid email address."
    });
  }

  if (typeof password !== "string" || password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      success: false,
      message: "Password must be at least 8 characters and no more than 72 bytes."
    });
  }

  // Public registration cannot create administrator accounts.
  const userRole = role || "parent";

  if (!["parent", "teacher"].includes(userRole)) {
    return res.status(403).json({
      success: false,
      message: "This role is not available for public registration."
    });
  }

  db.query(
    "SELECT id FROM users WHERE email = ?",
    [userEmail],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Could not check the email address."
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: "An account with this email already exists."
        });
      }

      bcrypt.hash(password, 12, (hashErr, hashedPassword) => {
        if (hashErr) {
          return res.status(500).json({
            success: false,
            message: "Could not secure the password."
          });
        }

        db.query(
          `INSERT INTO users (full_name, email, password, role)
           VALUES (?, ?, ?, ?)`,
          [name, userEmail, hashedPassword, userRole],
          (insertErr, result) => {
            if (insertErr) {
              if (insertErr.code === "ER_DUP_ENTRY") {
                return res.status(409).json({
                  success: false,
                  message: "An account with this email already exists."
                });
              }

              return res.status(500).json({
                success: false,
                message: "Could not create the account."
              });
            }

            return res.status(201).json({
              success: true,
              message: "Account registered successfully.",
              user: {
                id: result.insertId,
                full_name: name,
                email: userEmail,
                role: userRole
              }
            });
          }
        );
      });
    }
  );
});

// LOGIN
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password) {
    return res.status(400).json({
      success: false,
      message: "Email and password are required."
    });
  }

  const userEmail = email.trim().toLowerCase();

  if (userEmail.length > 150 ||
      Buffer.byteLength(password, "utf8") > 72) {
    return res.status(400).json({
      success: false,
      message: "Invalid email or password."
    });
  }

  db.query(
    "SELECT id, full_name, email, password, role FROM users WHERE email = ?",
    [userEmail],
    (err, results) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: "Login could not be completed."
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: "Invalid email or password."
        });
      }

      const user = results[0];

      bcrypt.compare(password, user.password, (compareErr, matched) => {
        if (compareErr || !matched) {
          return res.status(401).json({
            success: false,
            message: "Invalid email or password."
          });
        }

        const secret = process.env.JWT_SECRET;

        if (!secret || secret.length < 32) {
          return res.status(500).json({
            success: false,
            message: "Authentication is not configured correctly."
          });
        }

        const token = jwt.sign(
          {
            id: user.id,
            email: user.email,
            role: user.role
          },
          secret,
          { expiresIn: "2h" }
        );

        return res.json({
          success: true,
          message: "Login successful.",
          token,
          user: {
            id: user.id,
            full_name: user.full_name,
            email: user.email,
            role: user.role
          }
        });
      });
    }
  );
});

module.exports = router;
