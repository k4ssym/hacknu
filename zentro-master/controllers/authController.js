import pool from "../db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

// Helper function to generate 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ✅ 2FA: Send Verification Code
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Generate verification code
    const verificationCode = generateVerificationCode();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Store or update verification code
    await pool.query(
      `INSERT INTO verification_codes (email, code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (email) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()`,
      [email, verificationCode, expiryTime]
    );

    // Send email with verification code
    await transporter.sendMail({
      from: `"Your App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
    });

    res.status(200).json({ 
      success: true,
      message: "Verification code sent to your email" 
    });
  } catch (err) {
    console.error("Error sending verification code:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to send verification code" 
    });
  }
};

// ✅ 2FA: Verify Code and Register
export const verifyCodeAndRegister = async (req, res) => {
  const { firstName, lastName, email, password, verificationCode } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normalize and clean inputs
    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = verificationCode.toString().trim().replace(/\s/g, '');

    // Verify the code
    const codeResult = await client.query(
      `SELECT * FROM verification_codes 
       WHERE email = $1 AND code = $2 AND expires_at > NOW()`,
      [normalizedEmail, cleanCode]
    );

    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification code" 
      });
    }

    // Check if user already exists (double-check)
    const userExists = await client.query(
      "SELECT * FROM users WHERE email = $1", 
      [normalizedEmail]
    );
    
    if (userExists.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with all required fields
    const newUser = await client.query(
      `INSERT INTO users (
        first_name, 
        last_name, 
        email, 
        password, 
        is_verified,
        account_status,
        registration_date,
        login_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, first_name, last_name, email`,
      [
        firstName,
        lastName,
        normalizedEmail,
        hashedPassword,
        true, // is_verified
        'active', // account_status
        new Date(), // registration_date
        0 // login_count
      ]
    );

    // Delete used verification code
    await client.query(
      "DELETE FROM verification_codes WHERE email = $1",
      [normalizedEmail]
    );

    await client.query('COMMIT');

    res.status(201).json({ 
      success: true,
      message: "Registration successful",
      user: newUser.rows[0]
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error("Verification error:", err);
    res.status(500).json({ 
      success: false,
      error: "Verification failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
};

// ✅ Login (unchanged)
export const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false,
        message: "Please verify your email first" 
      });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
      expiresIn: "1h" 
    });

    res.json({ 
      success: true,
      token, 
      user: { 
        id: user.id,
        firstName: user.first_name, 
        lastName: user.last_name, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ 
      success: false,
      error: "Login failed" 
    });
  }
};