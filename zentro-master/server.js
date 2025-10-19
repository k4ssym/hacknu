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
// Helper function for goal labels
function getGoalLabel(goalType) {
  const goalLabels = {
    'home': 'Покупка жилья',
    'car': 'Покупка автомобиля',
    'education': 'Образование',
    'travel': 'Путешествие',
    'medical': 'Медицинские расходы',
    'big_purchase': 'Крупная покупка',
    'savings': 'Накопления',
    'invest': 'Инвестиции',
    'business': 'Развитие бизнеса',
    'hajj': 'Паломничество Хадж',
    'gold': 'Инвестиции в золото',
    'real_estate_invest': 'Инвестиции в недвижимость'
  };
  return goalLabels[goalType] || goalType;
}
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
// =============== ML CREDIT SCORING ENDPOINT ===============
app.post("/api/ml/score-applicants", async (req, res) => {
  try {
    const { applicants } = req.body;
    console.log(`📊 Scoring ${applicants.length} applicants with ML model...`);

    // Prepare features for ML model
    const features = applicants.map(applicant => [
      applicant.age,
      applicant.income, 
      applicant.loan_amount,
      applicant.credit_history,
      applicant.employment_length,
      applicant.debt_to_income
    ]);

    console.log('🚀 Sending to ML service...');
    
    // Call Python ML service
    const mlResponse = await axios.post('http://localhost:8000/predict', {
      features: features
    }, {
      timeout: 30000
    });

    console.log('✅ ML scoring response:', mlResponse.data);

    if (mlResponse.data.status !== 'success') {
      throw new Error(mlResponse.data.message);
    }

    // Combine original data with ML predictions
    const scoredApplicants = applicants.map((applicant, index) => ({
      ...applicant,
      ...mlResponse.data.predictions[index],
      score: parseFloat(mlResponse.data.predictions[index].score.toFixed(3))
    }));

    res.json({
      success: true,
      scored_applicants: scoredApplicants,
      model_version: mlResponse.data.model_version || 'unknown',
      processing_time: 0.5
    });

  } catch (error) {
    console.error('❌ ML scoring error:', error.response?.data || error.message);
    
    // Fallback to formula-based scoring
    console.log('🔄 Using fallback formula scoring');
    const scoredApplicants = applicants.map(applicant => {
      const score = calculateCreditScore(applicant);
      const risk_level = determineRiskLevel(score);
      return {
        ...applicant,
        score: parseFloat(score.toFixed(3)),
        risk_level,
        decision: getDecision(risk_level),
        probability: score,
        note: "Formula-based scoring (ML service unavailable)"
      };
    });

    res.json({
      success: true,
      scored_applicants: scoredApplicants,
      model_version: "fallback-formula",
      note: "Using formula-based scoring as fallback"
    });
  }
});

// Helper functions
function calculateCreditScore(applicant) {
  const factors = {
    income: Math.min(1, applicant.income / 150000) * 0.3,
    creditHistory: (applicant.credit_history - 300) / 550 * 0.3,
    employment: Math.min(1, applicant.employment_length / 10) * 0.2,
    age: Math.min(1, (applicant.age - 18) / 50) * 0.1,
    debtRatio: (1 - Math.min(1, applicant.debt_to_income / 0.5)) * 0.1
  };

  let score = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  const loanToIncome = applicant.loan_amount / applicant.income;
  if (loanToIncome > 0.5) score *= 0.8;
  if (loanToIncome > 1) score *= 0.7;
  
  return Math.min(1, Math.max(0, score));
}

function determineRiskLevel(score) {
  if (score >= 0.7) return 'low';
  if (score >= 0.4) return 'medium';
  return 'high';
}

function getDecision(riskLevel) {
  switch(riskLevel) {
    case 'low': return 'Approve';
    case 'medium': return 'Review';
    case 'high': return 'Reject';
  }
}
// =============== TEST ML CONNECTION ===============
app.get("/api/ml/test-connection", async (req, res) => {
  try {
    console.log('🧪 Testing ML service connection...');
    
    // Test health endpoint
    const healthResponse = await axios.get('http://localhost:8000/health', {
      timeout: 5000
    });
    
    console.log('✅ ML service health:', healthResponse.data);
    
    // Test prediction with sample data
    const sampleFeatures = [
      [35, 75000, 15000, 720, 5, 0.25],  // Good applicant
      [25, 35000, 50000, 580, 1, 0.65]   // Risky applicant
    ];
    
    const predictResponse = await axios.post('http://localhost:8000/predict', {
      features: sampleFeatures
    }, {
      timeout: 10000
    });
    
    console.log('✅ ML prediction test successful:', predictResponse.data);
    
    res.json({
      success: true,
      health: healthResponse.data,
      prediction_test: predictResponse.data,
      message: "ML service is working correctly"
    });
    
  } catch (error) {
    console.error('❌ ML service test failed:', error.message);
    res.status(500).json({
      success: false,
      error: "ML service connection failed",
      details: error.message,
      message: "Check if ML service is running on port 8000"
    });
  }
});
// Keep your helper functions the same...
function calculateCreditScore(applicant) {
  const factors = {
    income: Math.min(1, applicant.income / 150000) * 0.3,
    creditHistory: (applicant.credit_history - 300) / 550 * 0.3,
    employment: Math.min(1, applicant.employment_length / 10) * 0.2,
    age: Math.min(1, (applicant.age - 18) / 50) * 0.1,
    debtRatio: (1 - Math.min(1, applicant.debt_to_income / 0.5)) * 0.1
  };

  let score = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  const loanToIncome = applicant.loan_amount / applicant.income;
  if (loanToIncome > 0.5) score *= 0.8;
  if (loanToIncome > 1) score *= 0.7;
  
  return Math.min(1, Math.max(0, score));
}

function determineRiskLevel(score) {
  if (score >= 0.7) return 'low';
  if (score >= 0.4) return 'medium';
  return 'high';
}

function getDecision(riskLevel) {
  switch(riskLevel) {
    case 'low': return 'Approve';
    case 'medium': return 'Review';
    case 'high': return 'Reject';
  }
}
// =============== TEST ML CONNECTION ===============
app.get("/api/ml/test", async (req, res) => {
  try {
    console.log('🧪 Testing ML service connection...');
    
    const testResponse = await axios.get('http://localhost:8000/health', {
      timeout: 5000
    });
    
    console.log('✅ ML service health:', testResponse.data);
    
    // Test with sample data
    const sampleFeatures = [
      [35, 75000, 15000, 720, 5, 0.25],  // Good applicant
      [25, 35000, 50000, 580, 1, 0.65]   // Risky applicant
    ];
    
    const predictResponse = await axios.post('http://localhost:8000/predict', {
      features: sampleFeatures
    }, {
      timeout: 10000
    });
    
    console.log('✅ ML prediction test successful');
    
    res.json({
      success: true,
      health: testResponse.data,
      prediction_test: predictResponse.data,
      message: "ML service is working correctly"
    });
    
  } catch (error) {
    console.error('❌ ML service test failed:', error.message);
    res.status(500).json({
      success: false,
      error: "ML service connection failed",
      details: error.message,
      message: "Check if ML service is running on port 8000"
    });
  }
});
// Helper functions for fallback scoring
function calculateCreditScore(applicant) {
  const factors = {
    income: Math.min(1, applicant.income / 150000) * 0.3,
    creditHistory: (applicant.credit_history - 300) / 550 * 0.3,
    employment: Math.min(1, applicant.employment_length / 10) * 0.2,
    age: Math.min(1, (applicant.age - 18) / 50) * 0.1,
    debtRatio: (1 - Math.min(1, applicant.debt_to_income / 0.5)) * 0.1
  };

  let score = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  const loanToIncome = applicant.loan_amount / applicant.income;
  if (loanToIncome > 0.5) score *= 0.8;
  if (loanToIncome > 1) score *= 0.7;
  
  return Math.min(1, Math.max(0, score));
}

function determineRiskLevel(score) {
  if (score >= 0.7) return 'low';
  if (score >= 0.4) return 'medium';
  return 'high';
}

function getDecision(riskLevel) {
  switch(riskLevel) {
    case 'low': return 'Approve';
    case 'medium': return 'Review';
    case 'high': return 'Reject';
  }
}
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

// Get AI recommendations (No database)
// =============== AI RECOMMENDATION ENDPOINT ===============
// =============== WORKING AI RECOMMENDATION ENDPOINT ===============
app.post("/api/ai/recommendations", async (req, res) => {
  try {
    const applicant = req.body;
    console.log('📥 Received applicant data:', applicant);

    // Create a detailed context from applicant data
    const context = `
Финансовый профиль клиента:
- Цель: ${getGoalLabel(applicant.goalType)}
- Целевая сумма: ${applicant.targetAmount?.toLocaleString()} KZT
- Срок: ${applicant.termMonths} месяцев
- Ежемесячный доход: ${applicant.netIncomeMonthly?.toLocaleString()} KZT
- Существующие долги: ${applicant.existingDebtMonthly?.toLocaleString()} KZT
- Первоначальный взнос: ${applicant.downPayment?.toLocaleString()} KZT
- Ежемесячные расходы: ${Object.values(applicant.expenses || {}).reduce((a, b) => a + b, 0)?.toLocaleString()} KZT
- Стаж работы: ${applicant.employmentYears} лет
- Кредитный рейтинг: ${applicant.creditScore || 'не указан'}
- Лимит ежемесячного платежа: ${applicant.monthlyPaymentLimit?.toLocaleString()} KZT
- Предпочтение исламских продуктов: ${applicant.shariaPreference ? 'Да' : 'Нет'}
    `;

// Update the AI system prompt in your server.js
const messages = [
  {
    role: "system",
    content: `Ты персональный финансовый советник исламского банка Zaman. Анализируй финансовую ситуацию клиента и давай ТОЧНЫЕ, ПЕРСОНАЛИЗИРОВАННЫЕ рекомендации.

ОСОБЕННОСТИ АНАЛИЗА:
1. Учитывай ВСЕ данные клиента: цель, сумму, срок, доходы, расходы, долги
2. Давай КОНКРЕТНЫЕ цифры и сроки когда возможно
3. Предлагай РЕАЛЬНЫЕ действия, которые клиент может сделать сразу
4. Учитывай исламские принципы финансирования
5. Форматируй ответ как чистый текст БЕЗ markdown, звездочек, жирного шрифта

ФОРМАТ ОТВЕТА:
- Каждая рекомендация должна быть отдельным полным предложением
- Начинай с actionable совета
- Максимально персонализируй под цифры клиента
- 4 самых важных рекомендации

Отвечай ТОЛЬКО на русском языке.`
  },
  {
    role: "user", 
    content: `ПРОФИЛЬ КЛИЕНТА:
Цель: ${getGoalLabel(applicant.goalType)}
Требуемая сумма: ${applicant.targetAmount?.toLocaleString()} KZT
Срок: ${applicant.termMonths} месяцев
Ежемесячный доход: ${applicant.netIncomeMonthly?.toLocaleString()} KZT
Существующие платежи: ${applicant.existingDebtMonthly?.toLocaleString()} KZT/мес
Первоначальный взнос: ${applicant.downPayment?.toLocaleString()} KZT
Общие ежемесячные расходы: ${Object.values(applicant.expenses || {}).reduce((a, b) => a + b, 0)?.toLocaleString()} KZT
Стаж работы: ${applicant.employmentYears} лет
Предпочтение исламских продуктов: ${applicant.shariaPreference ? 'Да' : 'Нет'}

Дай 4 самых важных финансовых рекомендации для этого клиента.`
  }
];

    console.log('🚀 Calling RapidAPI GPT-4o-mini...');
    
    // Call RapidAPI GPT-4o-mini with YOUR API KEY
    const response = await axios({
      method: 'POST',
      url: 'https://gpt-4o-mini.p.rapidapi.com/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'gpt-4o-mini.p.rapidapi.com',
        'x-rapidapi-key': '9a0f172768mshc46725afc0019dfp172bddjsn73455f16dc83' // Your actual key
      },
      data: {
        model: "gpt-4o-mini",
        messages: messages,
        max_tokens: 1000,
        temperature: 0.7
      },
      timeout: 30000
    });

    console.log('✅ RapidAPI response received successfully');
    const aiResponse = response.data.choices[0].message.content;
    console.log('🤖 Raw AI response:', aiResponse);

    // Parse the response into clean recommendations
    const recommendations = parseAIResponse(aiResponse);
    console.log('📋 Parsed recommendations:', recommendations);

    res.json({
      success: true,
      recommendations: recommendations,
      rawResponse: aiResponse,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ AI recommendation error:', error.response?.data || error.message);
    
    // Detailed error logging
    if (error.response) {
      console.error('API Response error:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.request);
    } else {
      console.error('Request setup error:', error.message);
    }

    // Contextual fallback recommendations
    const fallbackRecommendations = getFallbackRecommendations(applicant?.goalType);
    
    res.json({
      success: true,
      recommendations: fallbackRecommendations,
      generated_at: new Date().toISOString(),
      note: "Используются базовые рекомендации"
    });
  }
});

// Helper function to parse AI response
function parseAIResponse(response) {
  try {
    // Split by common bullet points and numbering
    const lines = response.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    const recommendations = [];
    
    for (const line of lines) {
      // Match numbered points (1., 2., 3., etc.)
      if (line.match(/^\d+\./) || line.includes('•') || line.includes('-') || 
          line.toLowerCase().includes('рекоменд') || line.toLowerCase().includes('совет')) {
        
        // Clean the line
        let cleanLine = line
          .replace(/^[•\-\d\.\s]+/, '') // Remove bullets/numbers
          .replace(/^[👆📌🎯💡🔥⭐️🤔]\s*/, '') // Remove emojis
          .trim();

        // Only include if it's substantial content
        if (cleanLine.length > 20 && cleanLine.length < 200) {
          recommendations.push(cleanLine);
        }
      }
      
      // Stop after 4 good recommendations
      if (recommendations.length >= 4) break;
    }

    // If we didn't get enough, take the first 4 non-empty lines
    if (recommendations.length < 4) {
      const additional = lines
        .filter(line => line.length > 20 && line.length < 200)
        .slice(0, 4 - recommendations.length);
      recommendations.push(...additional);
    }

    return recommendations.length > 0 ? recommendations.slice(0, 4) : getFallbackRecommendations();
    
  } catch (parseError) {
    console.error('Error parsing AI response:', parseError);
    return getFallbackRecommendations();
  }
}

// Helper function to get goal labels in Russian
function getGoalLabel(goalType) {
  const goalLabels = {
    'home': 'Покупка жилья',
    'education': 'Образование', 
    'travel': 'Путешествие',
    'medical': 'Медицина',
    'big_purchase': 'Крупная покупка',
    'savings': 'Накопления',
    'invest': 'Инвестиции',
    'car': 'Покупка автомобиля'
  };
  return goalLabels[goalType] || goalType;
}

// Helper function for fallback recommendations
function getFallbackRecommendations(goalType = 'home') {
  const fallbacks = {
    home: [
      "Увеличьте первоначальный взнос для снижения ежемесячных платежей по ипотеке",
      "Изучите программы государственной поддержки для приобретения жилья",
      "Рассмотрите варианты вторичного жилья для экономии бюджета",
      "Создайте план накопления на первоначальный взнос с автоматическими отчислениями"
    ],
    education: [
      "Исследуйте возможности получения образовательных грантов и стипендий",
      "Рассмотрите вариант частичной оплаты обучения с поэтапным финансированием",
      "Составьте план совмещения работы и обучения для самофинансирования",
      "Изучите программы корпоративного обучения у вашего работодателя"
    ],
    travel: [
      "Планируйте путешествие в низкий сезон для значительной экономии",
      "Создайте отдельный накопительный счет для travel-целей",
      "Исследуйте варианты туров с рассрочкой платежа",
      "Рассмотрите возможность путешествий по внутренним направлениям"
    ],
    medical: [
      "Изучите программы добровольного медицинского страхования",
      "Рассмотрите возможность лечения в государственных клиниках",
      "Исследуйте варианты рассрочки на медицинские услуги",
      "Создайте медицинский резервный фонд на случай непредвиденных расходов"
    ],
    big_purchase: [
      "Сравните цены в разных магазинах и онлайн-платформах",
      "Дождитесь сезонных распродаж для значительной экономии",
      "Рассмотрите вариант покупки б/у товара в хорошем состоянии",
      "Используйте cashback-программы и кешбэк-сервисы при покупке"
    ],
    savings: [
      "Автоматизируйте ежемесячные отчисления на накопительный счет",
      "Диверсифицируйте накопления между разными финансовыми инструментами",
      "Установите реалистичные промежуточные цели для поддержания мотивации",
      "Регулярно пересматривайте и оптимизируйте свой бюджет"
    ],
    invest: [
      "Начните с консервативных инструментов перед переходом к рискованным",
      "Диверсифицируйте портфель между разными классами активов",
      "Установите четкие финансовые цели и временные горизонты",
      "Регулярно мониторьте и rebalance-ируйте инвестиционный портфель"
    ]
  };

  return fallbacks[goalType] || fallbacks.home;
}

// Get predefined business recommendations

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
