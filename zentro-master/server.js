import dotenv from "dotenv";
dotenv.config();
import express from "express";
import multer from "multer";
import csv from 'csv-parser';
import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import cors from "cors";
import axios from 'axios';
import pool from "./db.js";
import authRoutes from "./routes/auth.js";
import nodemailer from "nodemailer";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { fileURLToPath } from 'url';
// Add this to your server.js file after the other imports
import { z } from 'zod';

// =============== AI RECOMMENDATIONS ENDPOINT ===============
const AIRecommendationSchema = z.object({
  goalType: z.enum(['car', 'home', 'education', 'travel', 'medical', 'big_purchase', 'savings', 'invest']),
  targetAmount: z.number().min(1000),
  termMonths: z.number().min(1).max(240),
  downPayment: z.number().min(0),
  netIncomeMonthly: z.number().min(10000),
  existingDebtMonthly: z.number().min(0),
  employmentYears: z.number().min(0),
  shariaPreference: z.boolean().default(true),
  creditScore: z.number().min(300).max(850).optional(),
  expenses: z.object({
    housing: z.number().min(0),
    transport: z.number().min(0),
    food: z.number().min(0),
    shopping: z.number().min(0),
    other: z.number().min(0)
  })
});

const AIResponseSchema = z.object({
  suggested_products: z.array(z.object({
    name: z.string(),
    type: z.enum(['loan', 'savings']),
    eligibility: z.boolean(),
    reason: z.string().optional(),
    monthly_payment: z.number().optional(),
    required_monthly_savings: z.number().optional(),
    total_cost: z.number().optional(),
    yield_estimate: z.number().optional(),
    constraints: z.object({
      min_amount: z.number(),
      max_amount: z.number(),
      min_term: z.number(),
      max_term: z.number()
    })
  })),
  affordability_analysis: z.object({
    current_dti: z.number(),
    projected_dti: z.number(),
    affordable: z.boolean(),
    max_affordable_amount: z.number(),
    risk_level: z.enum(['low', 'medium', 'high'])
  }),
  recommendations: z.array(z.string().max(100)),
  behavioral_tips: z.array(z.string().max(100)),
  calculation_details: z.object({
    principal_after_down: z.number(),
    total_markup: z.number().optional(),
    monthly_yield_rate: z.number().optional(),
    required_monthly_deposit: z.number().optional()
  })
});

// =============== REAL AI RECOMMENDATIONS ===============
// =============== REAL AI RECOMMENDATIONS ===============
app.post('/api/ai/recommendations', async (req, res) => {
  try {
    const {
      goalType,
      targetAmount,
      termMonths,
      downPayment,
      netIncomeMonthly,
      existingDebtMonthly,
      employmentYears,
      shariaPreference,
      expenses
    } = req.body;

    console.log('🔮 AI Request Received:', {
      goalType,
      targetAmount,
      termMonths,
      downPayment,
      netIncomeMonthly,
      existingDebtMonthly,
      employmentYears
    });

    // Calculate key metrics for AI context
    const totalExpenses = Object.values(expenses).reduce((a, b) => a + b, 0);
    const disposableIncome = netIncomeMonthly - totalExpenses - existingDebtMonthly;
    const principalAfterDown = targetAmount - downPayment;
    const monthlyPaymentNeeded = principalAfterDown / termMonths;
    const downPaymentPercent = (downPayment / targetAmount) * 100;
    const currentDTI = (existingDebtMonthly / netIncomeMonthly) * 100;
    const projectedDTI = ((existingDebtMonthly + monthlyPaymentNeeded) / netIncomeMonthly) * 100;

    // Prepare AI prompt with specific numbers
    const aiPrompt = `As Zaman Bank's Islamic financial advisor, analyze this client scenario and provide EXACTLY 3 specific recommendations and 3 behavioral tips in JSON format:

CLIENT PROFILE:
- Goal: ${goalType} financing
- Target Amount: ${targetAmount.toLocaleString()} KZT
- Term: ${termMonths} months
- Down Payment: ${downPayment.toLocaleString()} KZT (${downPaymentPercent.toFixed(1)}%)
- Monthly Income: ${netIncomeMonthly.toLocaleString()} KZT
- Existing Debt: ${existingDebtMonthly.toLocaleString()} KZT/month
- Employment: ${employmentYears} years
- Disposable Income: ${Math.round(disposableIncome).toLocaleString()} KZT/month
- Current DTI: ${currentDTI.toFixed(1)}%
- Projected DTI: ${projectedDTI.toFixed(1)}%

ZAMAN ISLAMIC PRODUCTS:
- BNPL: 10k–300k KZT, 1–12 months
- Islamic Financing: 100k–5m KZT, 3–60 months  
- Islamic Mortgage: 3m–75m KZT, 12–240 months
- Kopilka Savings: 1k–20m KZT, 1–12 months, up to 18% yield
- Wakala Investment: ≥50k KZT, 3–36 months, up to 20% yield

Provide SPECIFIC, ACTIONABLE advice based on these exact numbers. Focus on Islamic finance principles.

Respond with EXACTLY this JSON format:
{
  "recommendations": ["specific rec 1", "specific rec 2", "specific rec 3"],
  "behavioralTips": ["specific tip 1", "specific tip 2", "specific tip 3"]
}`;

    console.log('🚀 Calling RapidAPI GPT-4o Mini...');

    try {
      // Call RapidAPI GPT-4o Mini
      const aiResponse = await axios.post(
        'https://gpt-4o-mini.p.rapidapi.com/chat/completions',
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: aiPrompt }],
          temperature: 0.7,
          max_tokens: 800,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-rapidapi-host': 'gpt-4o-mini.p.rapidapi.com',
            'x-rapidapi-key': process.env.RAPIDAPI_KEY || '9a0f172768mshc46725afc0019dfp172bddjsn73455f16dc83'
          },
          timeout: 30000
        }
      );

      console.log('✅ RapidAPI Response Status:', aiResponse.status);
      console.log('✅ RapidAPI Response Data:', aiResponse.data);

      if (!aiResponse.data.choices || !aiResponse.data.choices[0]) {
        throw new Error('Invalid response structure from RapidAPI');
      }

      const aiContent = aiResponse.data.choices[0].message.content;
      console.log('📄 AI Raw Content:', aiContent);

      let parsedResponse;
      try {
        parsedResponse = JSON.parse(aiContent);
        console.log('🔍 Parsed AI Response:', parsedResponse);
      } catch (parseError) {
        console.error('❌ JSON Parse Error:', parseError);
        console.error('📄 Problematic content:', aiContent);
        throw new Error('AI returned invalid JSON format');
      }

      // Validate response structure
      if (!parsedResponse.recommendations || !Array.isArray(parsedResponse.recommendations)) {
        console.error('❌ Missing recommendations array');
        throw new Error('AI response missing recommendations');
      }

      if (!parsedResponse.behavioralTips || !Array.isArray(parsedResponse.behavioralTips)) {
        console.error('❌ Missing behavioralTips array');
        throw new Error('AI response missing behavioral tips');
      }

      console.log('🎯 Final AI Recommendations:', parsedResponse.recommendations);
      console.log('💡 Final Behavioral Tips:', parsedResponse.behavioralTips);

      res.json({
        success: true,
        recommendations: parsedResponse.recommendations.slice(0, 3),
        behavioralTips: parsedResponse.behavioralTips.slice(0, 3),
        ai_generated: true
      });

    } catch (aiError) {
      console.error('❌ RapidAPI Error:', aiError.message);
      console.error('❌ RapidAPI Response:', aiError.response?.data);
      console.error('❌ RapidAPI Status:', aiError.response?.status);
      
      // Don't use fallback - throw error to see what's wrong
      throw new Error(`RapidAPI failed: ${aiError.message}`);
    }

  } catch (error) {
    console.error('💥 AI recommendation endpoint error:', error);
    
    // Return error instead of fallback to debug
    res.status(500).json({
      success: false,
      error: error.message,
      details: 'AI service failed - check backend logs'
    });
  }
});
// Fallback calculation when AI is unavailable
async function calculateFallbackRecommendations(data, currentDTI) {
  const principalAfterDown = data.targetAmount - data.downPayment;
  const isLoan = ['car', 'home', 'education', 'medical', 'big_purchase'].includes(data.goalType);
  
  // Product matching logic
  const suggestedProducts = [];
  
  if (data.goalType === 'car' && data.targetAmount <= 5000000) {
    suggestedProducts.push({
      name: "Islamic Financing (Consumer)",
      type: "loan",
      eligibility: true,
      monthly_payment: Math.round((principalAfterDown + 6000) / data.termMonths),
      total_cost: principalAfterDown + 6000,
      constraints: { min_amount: 100000, max_amount: 5000000, min_term: 3, max_term: 60 }
    });
  }
  
  if (data.goalType === 'savings') {
    const monthlyYield = 0.18 / 12;
    const requiredMonthly = Math.round(
      data.targetAmount / ((Math.pow(1 + monthlyYield, data.termMonths) - 1) / monthlyYield)
    );
    
    suggestedProducts.push({
      name: "Kopilka Savings",
      type: "savings", 
      eligibility: true,
      required_monthly_savings: requiredMonthly,
      yield_estimate: 18,
      constraints: { min_amount: 1000, max_amount: 20000000, min_term: 1, max_term: 12 }
    });
  }

  // Calculate affordability
  const totalMonthlyDebt = data.existingDebtMonthly + 
    (isLoan ? suggestedProducts[0]?.monthly_payment || 0 : 0);
  const projectedDTI = totalMonthlyDebt / data.netIncomeMonthly;

  return {
    suggested_products: suggestedProducts,
    affordability_analysis: {
      current_dti: currentDTI,
      projected_dti: projectedDTI,
      affordable: projectedDTI <= 0.5,
      max_affordable_amount: Math.round((data.netIncomeMonthly * 0.5 - data.existingDebtMonthly) * data.termMonths),
      risk_level: projectedDTI > 0.5 ? 'high' : projectedDTI > 0.35 ? 'medium' : 'low'
    },
    recommendations: [
      `Consider increasing down payment by ${Math.round(data.targetAmount * 0.1)} KZT to reduce monthly burden`,
      `Extend term to ${data.termMonths + 12} months for lower monthly payments`,
      `Reduce shopping expenses by 15% to improve cash flow`
    ],
    behavioral_tips: [
      "Try a no-spend weekend for financial awareness",
      "Take a 20-minute walk instead of impulse shopping", 
      "Practice mindful spending with 24-hour purchase delays"
    ],
    calculation_details: {
      principal_after_down: principalAfterDown,
      total_markup: isLoan ? 6000 : undefined,
      monthly_yield_rate: !isLoan ? 0.18/12 : undefined,
      required_monthly_deposit: !isLoan ? suggestedProducts[0]?.required_monthly_savings : undefined
    }
  };
}
// =============== AI RECOMMENDATIONS ENDPOINT ===============

// Create table for AI recommendations logging (run this once)
app.get('/api/ai/setup-table', async (req, res) => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_recommendations (
        id SERIAL PRIMARY KEY,
        goal_type VARCHAR(50) NOT NULL,
        target_amount DECIMAL(15,2) NOT NULL,
        term_months INTEGER NOT NULL,
        net_income DECIMAL(15,2) NOT NULL,
        ai_response JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    res.json({ success: true, message: "AI recommendations table ready" });
  } catch (error) {
    console.error('Table creation error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
// Create __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;

// Configure middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Set up file upload handling
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime()
  });
});

// Batch Scoring Endpoint (with Python ML integration)
app.post("/api/batch-score", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  const requiredColumns = [
    'age', 'income', 'loan_amount', 'credit_history',
    'employment_length', 'debt_to_income'
  ];

  try {
    // 1. Validate and process in single pass
    console.time("CSV Processing");
    const applicants = await validateAndProcessCSV(req.file.path, requiredColumns);
    console.timeEnd("CSV Processing");

    // 2. Score with Python ML service
    console.time("ML Scoring");
    const results = await scoreApplicants(applicants);
    console.timeEnd("ML Scoring");

    // 3. Save results
    const resultFilename = `scored_${uuidv4()}.csv`;
    const resultPath = path.join(__dirname, "results", resultFilename);
    ensureDirectoryExists(path.join(__dirname, "results"));
    await saveResultsToCSV(results, resultPath);

    // 4. Generate response
    const highRiskCount = results.filter(r => r.risk_label === "High").length;
    const mediumRiskCount = results.filter(r => r.risk_label === "Medium").length;
    
    cleanupFile(req.file.path);
    
    res.json({
      status: "success",
      rows_processed: results.length,
      high_risk: highRiskCount,
      medium_risk: mediumRiskCount,
      download_link: `/api/results/${resultFilename}`
    });

  } catch (error) {
    console.error("Batch scoring error:", error);
    if (req.file?.path) cleanupFile(req.file.path);
    res.status(400).json({ 
      error: "Processing failed",
      details: error.message
    });
  }
});

// File Download Endpoint
app.get("/api/results/:filename", (req, res) => {
  const filePath = path.join(__dirname, "results", req.params.filename);
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, (err) => {
      if (err) console.error("Download error:", err);
    });
  } else {
    res.status(404).send("File not found");
  }
});

// Helper Functions
async function validateAndProcessCSV(filePath, requiredColumns) {
  return new Promise((resolve, reject) => {
    const results = [];
    let headers = [];
    let isValid = true;
    let validationErrors = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('headers', (csvHeaders) => {
        headers = csvHeaders;
        const missing = requiredColumns.filter(col => !headers.includes(col));
        if (missing.length > 0) {
          isValid = false;
          validationErrors = missing.map(col => `Missing column: ${col}`);
          reject(new Error(`Invalid CSV: Missing columns - ${missing.join(', ')}`));
        }
      })
      .on('data', (row) => {
        if (!isValid) return; // Skip processing if validation failed
        
        // Validate data types
        const numericFields = ['age', 'income', 'loan_amount', 'credit_history', 'employment_length', 'debt_to_income'];
        const typeErrors = [];
        
        numericFields.forEach(field => {
          if (isNaN(parseFloat(row[field]))) {
            typeErrors.push(`Invalid number in ${field}`);
          }
        });

        if (typeErrors.length > 0) {
          isValid = false;
          validationErrors = typeErrors;
          reject(new Error(`Invalid data types - ${typeErrors.join(', ')}`));
          return;
        }

        results.push(row);
      })
      .on('end', () => {
        if (isValid) {
          resolve(results);
        }
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

async function scoreApplicants(applicants) {
  const features = applicants.map(a => [
    parseFloat(a.age),
    parseFloat(a.income),
    parseFloat(a.loan_amount),
    parseFloat(a.credit_history),
    parseFloat(a.employment_length),
    parseFloat(a.debt_to_income)
  ]);

  // Call Python ML microservice
  const response = await axios.post('http://localhost:8000/predict', { features });
  const probabilities = response.data.probabilities;

  return applicants.map((applicant, i) => {
    const score = probabilities[i][1];
    let risk_label = "Low";
    if (score > 0.7) risk_label = "High";
    else if (score > 0.4) risk_label = "Medium";

    return {
      ...applicant,
      score: score.toFixed(4),
      risk_label,
      explanation: generateShapExplanation(applicant)
    };
  });
}

function generateShapExplanation(applicant) {
  const factors = [
    { name: "Income", value: applicant.income, impact: (applicant.income / 10000) * 0.3 },
    { name: "Credit History", value: applicant.credit_history, impact: -(applicant.credit_history / 100) * 0.2 },
    { name: "Debt Ratio", value: applicant.debt_to_income, impact: -(applicant.debt_to_income / 10) * 0.15 },
    { name: "Employment Length", value: applicant.employment_length, impact: (applicant.employment_length / 10) * 0.1 }
  ].sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact));

  return `Key factors: ${factors.slice(0, 2)
    .map(f => f.name + ' (' + (f.impact > 0 ? '+' : '') + f.impact.toFixed(2) + ')')
    .join(', ')}`;
}

async function saveResultsToCSV(data, filePath) {
  return new Promise((resolve, reject) => {
    if (!data.length) return reject(new Error("No data to save"));

    const headers = Object.keys(data[0]);
    let csvContent = headers.join(",") + "\n";

    data.forEach(row => {
      const vals = headers.map(h => {
        const v = row[h];
        if (v == null) return '';
        if (typeof v === 'string' && (v.includes(',') || v.includes('"'))) {
          return '"' + v.replace(/"/g, '""') + '"';
        }
        return v;
      });
      csvContent += vals.join(",") + "\n";
    });

    fs.writeFile(filePath, csvContent, err =>
      err ? reject(err) : resolve()
    );
  });
}

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cleanupFile(filePath) {
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
}

// Auth & other routes
app.use("/api/auth", authRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});


// [Keep all your existing routes and other functionality]
// Include all your auth routes, profile routes, product routes, etc.
// They don't need any changes
app.use("/api/auth", authRoutes);

// Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

// Your existing database test endpoint
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");
    res.json({ time: result.rows[0] });
  } catch (err) {
    console.error("❌ DB connection failed:", err);
    res.status(500).json({ error: "Database connection error" });
  }
});

app.use("/api/auth", authRoutes);
// =============== 2FA REGISTRATION ENDPOINTS ===============

// Send verification code
app.post("/api/auth/send-code", async (req, res) => {
  const { email } = req.body;
  
  try {
    // Check if user already exists
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    // Generate 6-digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    // Store/update verification code
    await pool.query(
      `INSERT INTO verification_codes (email, code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (email) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()`,
      [email, verificationCode, expiryTime]
    );

    // Send email (configure your nodemailer transport as needed)
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Verification Code",
      text: `Your verification code is: ${verificationCode}`,
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
    });

    res.status(200).json({ 
      success: true,
      message: "Verification code sent" 
    });
  } catch (err) {
    console.error("Error sending verification code:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to send verification code" 
    });
  }
});

// In your server.js
app.post("/api/auth/verify-code", async (req, res) => {
  const { firstName, lastName, email, password, verificationCode } = req.body;
  
  try {
    // 1. Verify the code first
    const codeResult = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE email = $1 AND code = $2 AND expires_at > NOW()`,
      [email, verificationCode]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ 
        success: false,
        message: "Invalid or expired verification code" 
      });
    }

    // 2. Check if user already exists (double-check)
    const userExists = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 4. Create user
    const newUser = await pool.query(
      `INSERT INTO users 
       (first_name, last_name, email, password, is_verified) 
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, first_name, last_name, email`,
      [firstName, lastName, email, hashedPassword]
    );

    // 5. Clean up verification code
    await pool.query("DELETE FROM verification_codes WHERE email = $1", [email]);

    // 6. Return success
    res.status(201).json({ 
      success: true,
      message: "Registration successful",
      user: newUser.rows[0]
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ 
      success: false,
      error: "Registration failed",
      details: err.message
    });
  }
});
// Login endpoint
// Add this at the start of your verify-code endpoint

// In your server.js login endpoint
app.post("/api/auth/signin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email); // Add this debug log
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: "Email and password are required" 
      });
    }

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    const user = result.rows[0];
    console.log("Found user:", user); // Debug log

    if (!user) {
      console.log("No user found with email:", email);
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    console.log("Password valid:", validPassword); // Debug log
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!user.is_verified) {
      return res.status(403).json({ 
        success: false,
        message: "Account not verified" 
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
      error: "Login failed",
      details: process.env.NODE_ENV === "development" ? err.message : undefined
    });
  }
});
// =============== РОУТЫ ПРОФИЛЯ ПОЛЬЗОВАТЕЛЯ ===============
// Add these to your existing auth routes in server.js

// Generate 2FA code for login
app.post("/api/auth/send-login-code", async (req, res) => {
  const { email } = req.body;

  try {
    // Check if user exists
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        message: "User not found" 
      });
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Store or update verification code
    await pool.query(
      `INSERT INTO login_verification_codes (email, code, expires_at) 
       VALUES ($1, $2, $3)
       ON CONFLICT (email) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = NOW()`,
      [email, verificationCode, expiryTime]
    );

    // Send email with verification code
    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: `"Your App" <${process.env.MAIL_USER}>`,
      to: email,
      subject: "Your Login Verification Code",
      text: `Your verification code is: ${verificationCode}`,
      html: `<p>Your verification code is: <strong>${verificationCode}</strong></p>`,
    });

    res.status(200).json({ 
      success: true,
      message: "Verification code sent to your email" 
    });
  } catch (err) {
    console.error("Error sending login verification code:", err);
    res.status(500).json({ 
      success: false,
      error: "Failed to send verification code" 
    });
  }
});

// Verify login code
app.post("/api/auth/verify-login", async (req, res) => {
  const { email, password, verificationCode } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Normalize inputs
    const normalizedEmail = email.toLowerCase().trim();
    const cleanCode = verificationCode.toString().trim().replace(/\s/g, '');

    // Verify the code
    const codeResult = await client.query(
      `SELECT * FROM login_verification_codes 
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

    // Verify credentials
    const userResult = await client.query(
      "SELECT * FROM users WHERE email = $1", 
      [normalizedEmail]
    );
    
    const user = userResult.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      await client.query('ROLLBACK');
      return res.status(401).json({ 
        success: false,
        message: "Invalid credentials" 
      });
    }

    if (!user.is_verified) {
      await client.query('ROLLBACK');
      return res.status(403).json({ 
        success: false,
        message: "Please verify your email first" 
      });
    }

    // Delete used verification code
    await client.query(
      "DELETE FROM login_verification_codes WHERE email = $1",
      [normalizedEmail]
    );

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { 
      expiresIn: "1h" 
    });

    await client.query('COMMIT');

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
    await client.query('ROLLBACK');
    console.error("Login verification error:", err);
    res.status(500).json({ 
      success: false,
      error: "Login verification failed",
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  } finally {
    client.release();
  }
});
// Получить профиль пользователя по id
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query(
      `SELECT id, first_name, last_name, email, phone, location, role, account_status,
              avatar_url, last_activity, iin, postal_code, city, region
         FROM users WHERE id = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error getting user:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить профиль пользователя по id (добавил новые поля!)
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const {
    first_name, last_name, email, phone, location,
    role, account_status, avatar_url, last_activity,
    iin, postal_code, city, region // <- новые поля!
  } = req.body;

  try {
    const { rows } = await pool.query(
      `UPDATE users SET
        first_name = $1,
        last_name = $2,
        email = $3,
        phone = $4,
        location = $5,
        role = $6,
        account_status = $7,
        avatar_url = $8,
        last_activity = $9,
        iin = $10,
        postal_code = $11,
        city = $12,
        region = $13
       WHERE id = $14
       RETURNING *`,
      [
        first_name, last_name, email, phone, location,
        role, account_status, avatar_url, last_activity,
        iin, postal_code, city, region, id
      ]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error updating user:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить email
app.put('/api/users/:id/email', async (req, res) => {
  const { id } = req.params;
  const { email } = req.body;
  
  // Валидация email
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET email = $1 WHERE id = $2 RETURNING *`,
      [email, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error updating email:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Обновить пароль
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;

  // Валидация пароля
  if (!password) return res.status(400).json({ error: "Password is required" });

  try {
    const { rows } = await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2 RETURNING *`,
      [password, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'User not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error updating password:", err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// =============== КОНЕЦ РОУТОВ ПРОФИЛЯ ===============


// =============== НОВЫЙ РОУТ ДЛЯ ДОБАВЛЕНИЯ СОБЫТИЯ =================
app.post("/api/events", async (req, res) => {
  const { title, startDate, endDate, color, userId } = req.body;

  // ----------- ВАЛИДАЦИЯ ВСЕХ ПОЛЕЙ ----------
  if (!title || !startDate || !endDate || !color || !userId) {
    return res.status(400).json({ error: "Все поля обязательны для заполнения." });
  }
  // --------------------------------------------

  try {
    // 1. Сохраняем событие в БД
    await pool.query(
      `INSERT INTO events (title, start_date, end_date, color, user_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [title, startDate, endDate, color, userId]
    );

    // 2. Получаем email пользователя
    const userResult = await pool.query(
      `SELECT email FROM users WHERE id = $1`,
      [userId]
    );
    const email = userResult.rows?.[0]?.email;

    if (email) {
      // 3. Отправляем уведомление на email
      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: '"Calendar" <calendar@korzinka.kz>',
        to: email,
        subject: "Новое событие в календаре",
        text: `📅 Новое событие: "${title}"\nС: ${startDate}\nПо: ${endDate}`,
      });
    }

    res.status(200).json({ message: "Event saved and email sent" });
  } catch (error) {
    console.error("❌ Error saving event:", error);
    res.status(500).json({ error: "Event creation failed" });
  }
});
// ====================================================================
app.get('/api/products', async (req, res) => {
  let client;
  try {
    // Validate query parameters
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const search = req.query.search || '';
    const offset = (page - 1) * limit;

    // Get a dedicated client from the pool
    client = await pool.connect();

    // Build queries with correct column names
    const baseQuery = 'SELECT _code, _description FROM товары';
    const countQuery = 'SELECT COUNT(*) FROM товары';
    let whereClause = '';
    const queryParams = [];

    // Add search filter if provided
    if (search) {
      whereClause = ' WHERE (_code::text ILIKE $1 OR _description ILIKE $1)';
      queryParams.push(`%${search}%`);
    }

    // Get total count
    const countResult = await client.query(
      `${countQuery}${whereClause}`,
      queryParams
    );
    const totalItems = parseInt(countResult.rows[0].count);

    // Get paginated results - using _code for sorting instead of id
    const dataQuery = `
      ${baseQuery}${whereClause}
      ORDER BY _code  -- Changed from id to _code
      LIMIT $${queryParams.length + 1}
      OFFSET $${queryParams.length + 2}
    `;
    
    const dataResult = await client.query(
      dataQuery,
      [...queryParams, limit, offset]
    );

    // Map the underscore columns to the expected format
    const formattedData = dataResult.rows.map(row => ({
      code: row._code,
      description: row._description
    }));

    res.json({
      success: true,
      data: formattedData,
      columns: ['code', 'description'],
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: (page * limit) < totalItems,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message,
      hint: 'Table товары should have _code and _description columns'
    });
  } finally {
    if (client) client.release();
  }
});
// Test if table exists and show columns
app.get('/api/check-products-table', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'товары'
    `);
    res.json({
      exists: result.rows.length > 0,
      columns: result.rows
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test with simple query
app.get('/api/test-products-query', async (req, res) => {
  try {
    const result = await pool.query('SELECT _code, _description FROM товары LIMIT 5');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ 
      error: error.message,
      hint: 'Check if columns _code and _description exist in товары table'
    });
  }
});
/**
 * 1) Месячные данные за 2023, 2024 и 2025 годы для трёх метрик:
 */
const yearData = {
  "2023": {
    turnover: [60, 70, 80, 75, 85, 80, 90, 95, 100, 105, 110, 115],
    checks:   [45, 50, 55, 52, 60, 58, 65, 68, 70, 72, 75, 78],
    profit:   [20, 22, 25, 23, 27, 26, 30, 32, 35, 36, 38, 40],
  },
  "2024": {
    turnover: [65, 75, 85, 80, 90, 85, 95, 32, 13, 64, 55, 32],
    checks:   [48, 55, 60, 57, 62, 60, 70, 75, 78, 80, 82, 85],
    profit:   [22, 25, 28, 26, 30, 29, 32, 35, 38, 40, 42, 45],
  },
  "2025": {
    turnover: [70, 82, 94, 89, 98, 95, 105, 110, 115, 120, 125, 130],
    checks:   [50, 60, 65, 63, 70, 68, 75, 78, 80, 85, 87, 90],
    profit:   [25, 28, 30, 29, 33, 31, 35, 37, 40, 42, 45, 48],
  },
};

/**
 * 2) /api/sales — демонстрация простого графика
 */
let salesData = {
  categories: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ],
  series: [
    {
      name: "Sales",
      data: [112, 129, 237, 131, 187, 130, 342, 110, 311, 231, 231, 61],
    },
  ],
};
app.get("/api/sales", (req, res) => {
  res.json(salesData);
});

/**
 * 3) /api/ecommerce/metrics — чтение из metrics.json
 */
app.get("/api/ecommerce/metrics", (req, res) => {
  try {
    const filePath = path.join(process.cwd(), "metrics.json");
    const raw = fs.readFileSync(filePath, "utf-8");
    const metrics = JSON.parse(raw);
    res.json(metrics);
  } catch (err) {
    console.error("Failed to read metrics.json:", err);
    res.status(500).json({ error: "Could not load metrics" });
  }
});

/**
 * 4) /api/statistics?metric=<turnover|checks|profit>&period=<month|annual>
 */
app.get("/api/statistics", (req, res) => {
  const metric = req.query.metric;
  const periodParam = req.query.period;
  const period = typeof periodParam === "string" ? periodParam : "month";

  if (typeof metric !== "string") {
    return res.status(400).json({ error: "`metric` обязателен" });
  }
  if (!["turnover", "checks", "profit"].includes(metric)) {
    return res.status(400).json({ error: `Unknown metric: ${metric}` });
  }
  if (!["month", "annual"].includes(period)) {
    return res.status(400).json({ error: `Unknown period: ${period}` });
  }

  const categories = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (period === "month") {
    const data2024 = yearData["2024"][metric];
    return res.json({
      categories,
      series: [
        {
          name:
            metric === "turnover"
              ? "Оборот"
              : metric === "checks"
              ? "Чеки"
              : "Прибыль",
          data: data2024,
        },
      ],
    });
  }

  const data2023 = yearData["2023"][metric];
  const data2024 = yearData["2024"][metric];
  const sum2023 = data2023.reduce((a, v) => a + v, 0);
  const sum2024 = data2024.reduce((a, v) => a + v, 0);

  return res.json({
    categories: ["2023", "2024"],
    series: [
      {
        name:
          metric === "turnover"
            ? "Оборот"
            : metric === "checks"
            ? "Чеки"
            : "Прибыль",
        data: [sum2023, sum2024],
      },
    ],
  });
});

/**
 * 5) /api/sales/statistics?start=dd-MM-yyyy&end=dd-MM-yyyy
 */
app.get("/api/sales/statistics", (req, res) => {
  const { start, end } = req.query;
  if (typeof start !== "string" || typeof end !== "string") {
    return res
      .status(400)
      .json({ error: "`start` и `end` обязательны в формате dd-MM-yyyy" });
  }

  const [d1, m1, y1] = start.split("-").map(Number);
  const [d2, m2, y2] = end.split("-").map(Number);
  const startDate = new Date(y1, m1 - 1, d1);
  const endDate = new Date(y2, m2 - 1, d2);
  if (isNaN(startDate) || isNaN(endDate) || startDate > endDate) {
    return res
      .status(400)
      .json({ error: "Неправильный диапазон дат" });
  }

  const yearKey = String(endDate.getFullYear());
  const monthIdx = endDate.getMonth(); // 0–11

  const turnoverArr = yearData[yearKey]?.turnover;
  const checksArr   = yearData[yearKey]?.checks;
  const profitArr   = yearData[yearKey]?.profit;

  if (!turnoverArr || !checksArr || !profitArr) {
    return res
      .status(404)
      .json({ error: `Нет данных за ${yearKey}` });
  }

  const revenue      = turnoverArr[monthIdx];
  const receiptCount = checksArr[monthIdx];
  const profit       = profitArr[monthIdx];
  const salesCount   = receiptCount; // MVP: продажи = количество чеков
  const averageTicket =
    salesCount > 0 ? revenue / salesCount : 0;

  const prevIdx      = monthIdx > 0 ? monthIdx - 1 : 0;
  const prevRev      = turnoverArr[prevIdx];
  const prevChk      = checksArr[prevIdx];
  const prevPrf      = profitArr[prevIdx];
  const prevSales    = prevChk;
  const prevAvgCheck = prevSales > 0 ? prevRev / prevSales : 0;

  const calcDelta = (cur, prev) =>
    prev === 0 ? 0 : ((cur - prev) / prev) * 100;

  res.json({
    revenue,
    revenueChangePercent:      calcDelta(revenue, prevRev),
    salesCount,
    salesCountChangePercent:   calcDelta(salesCount, prevSales),
    receiptCount,
    receiptCountChangePercent: calcDelta(receiptCount, prevChk),
    averageTicket,
    averageTicketChangePercent: calcDelta(averageTicket, prevAvgCheck),
    profit,
    profitChangePercent:       calcDelta(profit, prevPrf),
    storesCount:               325, // stub-значение
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
