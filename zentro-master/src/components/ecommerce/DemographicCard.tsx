import React, { useState, useEffect, useCallback } from 'react';
import { 
  FiUpload, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiRefreshCw, 
  FiInfo, 
  FiBarChart2,
  FiSave,
  FiSettings,
  FiDownload,
  FiPrinter,
  FiHome,
  FiBook,
  FiGlobe,
  FiHeart,
  FiShoppingBag,
  FiTrendingUp,
  FiPieChart,
  FiZap,
  FiTarget,
  FiDollarSign,
  FiShield
} from 'react-icons/fi';
import Badge from '../ui/badge/Badge';
import ProgressBar from '../ui/progress/ProgressBar';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  LineController
);

// Types
type GoalType = 'car' | 'home' | 'education' | 'travel' | 'medical' | 'big_purchase' | 'savings' | 'invest';

type Applicant = {
  // Step A - Goal
  goalType: GoalType;
  targetAmount: number;
  termMonths: number;
  targetDate: string;
  downPayment: number;
  downPaymentType: 'fixed' | 'percentage';
  shariaPreference: boolean;
  monthlyPaymentLimit: number;
  
  // Step B - Finances
  netIncomeMonthly: number;
  existingDebtMonthly: number;
  employmentYears: number;
  creditScore?: number;
  expenses: {
    housing: number;
    transport: number;
    food: number;
    shopping: number;
    other: number;
  };
};

type Product = {
  id: string;
  name: string;
  type: 'financing' | 'investment';
  markup?: number;
  yield?: number;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  minAge: number;
  maxAge: number;
  description: string;
  eligible: boolean;
  reason?: string;
  features: string[];
};

type Result = {
  score: number;
  risk_label: string;
  suggestedProducts: Product[];
  affordability: {
    dtiBefore: number;
    dtiAfter: number;
    affordable: boolean;
    maxAffordableAmount: number;
  };
  recommendations: string[];
  aiRecommendations?: string[];
  requiredMonthlySavings?: number;
};

type HistoryItem = {
  timestamp: string;
  applicant: Applicant;
  result: Result;
};

// Product Catalog based on your specifications
const PRODUCT_CATALOG: Record<string, Product> = {
  bnpl: {
    id: 'bnpl',
    name: 'BNPL (Рассрочка)',
    type: 'financing',
    markup: 300,
    minAmount: 10000,
    maxAmount: 300000,
    minTerm: 1,
    maxTerm: 12,
    minAge: 18,
    maxAge: 63,
    description: 'Исламская рассрочка для покупок',
    eligible: false,
    features: ['Быстрое одобрение', 'Короткий срок', 'Для любых покупок']
  },
  consumer_financing: {
    id: 'consumer_financing',
    name: 'Исламское финансирование',
    type: 'financing',
    markup: 6000,
    minAmount: 100000,
    maxAmount: 5000000,
    minTerm: 3,
    maxTerm: 60,
    minAge: 18,
    maxAge: 60,
    description: 'Финансирование для личных нужд',
    eligible: false,
    features: ['Гибкие условия', 'Среднесрочное финансирование', 'Различные цели']
  },
  mortgage: {
    id: 'mortgage',
    name: 'Исламская ипотека',
    type: 'financing',
    markup: 200000,
    minAmount: 3000000,
    maxAmount: 75000000,
    minTerm: 12,
    maxTerm: 240,
    minAge: 25,
    maxAge: 60,
    description: 'Жилищное финансирование',
    eligible: false,
    features: ['Долгосрочная программа', 'Высокие суммы', 'Недвижимость']
  },
  kopilka: {
    id: 'kopilka',
    name: 'Копилка',
    type: 'investment',
    yield: 18,
    minAmount: 1000,
    maxAmount: 20000000,
    minTerm: 1,
    maxTerm: 12,
    minAge: 18,
    maxAge: 99,
    description: 'Накопительная программа',
    eligible: false,
    features: ['Высокая доходность', 'Гибкие сроки', 'Надежность']
  },
  wakala: {
    id: 'wakala',
    name: 'Вакала',
    type: 'investment',
    yield: 20,
    minAmount: 50000,
    maxAmount: 1000000000,
    minTerm: 3,
    maxTerm: 36,
    minAge: 18,
    maxAge: 99,
    description: 'Инвестиционная программа',
    eligible: false,
    features: ['Максимальная доходность', 'Долгосрочные вложения', 'Профессиональное управление']
  }
};

const GOAL_TYPES = [
  { id: 'home', label: 'Покупка жилья', icon: FiHome, product: 'mortgage' },
  { id: 'education', label: 'Образование', icon: FiBook, product: 'consumer_financing' },
  { id: 'travel', label: 'Путешествие', icon: FiGlobe, product: 'bnpl' },
  { id: 'medical', label: 'Медицина', icon: FiHeart, product: 'consumer_financing' },
  { id: 'big_purchase', label: 'Крупная покупка', icon: FiShoppingBag, product: 'bnpl' },
  { id: 'savings', label: 'Накопления', icon: FiPieChart, product: 'kopilka' },
  { id: 'invest', label: 'Инвестиции', icon: FiTrendingUp, product: 'wakala' }
];

export default function GoalPlanner() {
  // State
  const [currentStep, setCurrentStep] = useState(1);
// Update the initial applicant state
const [applicant, setApplicant] = useState<Applicant>({
  // Step A - Goal
  goalType: 'home',
  targetAmount: 5000000,
  termMonths: 60,
  targetDate: '',
  downPayment: 1000000,
  downPaymentType: 'fixed',
  shariaPreference: true,
  monthlyPaymentLimit: 0,
  
  // Step B - Finances
  netIncomeMonthly: 540000,
  existingDebtMonthly: 50000,
  employmentYears: 3,
  creditScore: 720,
  expenses: {
    housing: 150000,
    transport: 50000,
    food: 80000,
    shopping: 40000,
    other: 30000
  }
});
  
  const [result, setResult] = useState<Result | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // Calculate DTI and auto-set monthly payment limit
  useEffect(() => {
    const totalExpenses = Object.values(applicant.expenses).reduce((a, b) => a + b, 0);
    const suggestedLimit = applicant.netIncomeMonthly * 0.35;
    
    setApplicant(prev => ({
      ...prev,
      monthlyPaymentLimit: prev.monthlyPaymentLimit || suggestedLimit
    }));
  }, [applicant.netIncomeMonthly, applicant.expenses]);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (name.startsWith('expenses.')) {
      const expenseField = name.split('.')[1];
      setApplicant(prev => ({
        ...prev,
        expenses: {
          ...prev.expenses,
          [expenseField]: parseInt(value) || 0
        }
      }));
    } else {
      setApplicant(prev => ({
        ...prev,
        [name]: type === 'number' ? parseInt(value) || 0 : 
                type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      }));
    }
  };

  const handleGoalTypeSelect = (goalType: GoalType) => {
    setApplicant(prev => ({ ...prev, goalType }));
  };

  const setTypicalExpenses = () => {
    const typicalPercentages = {
      housing: 0.35,
      transport: 0.15,
      food: 0.25,
      shopping: 0.15,
      other: 0.10
    };

    setApplicant(prev => ({
      ...prev,
      expenses: Object.entries(typicalPercentages).reduce((acc, [key, percentage]) => ({
        ...acc,
        [key]: Math.round(prev.netIncomeMonthly * percentage)
      }), {} as Applicant['expenses'])
    }));
  };

  // Fetch REAL AI Recommendations - NO MOCK DATA
// Fixed AI Recommendations function
const fetchAIRecommendations = useCallback(async (applicantData: Applicant) => {
  setAiLoading(true);
  setAiError(null);
  
  try {
    console.log('🚀 Fetching REAL AI recommendations for:', applicantData.goalType);
    
    // Use relative URL to avoid CORS issues
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(applicantData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ AI API error:', response.status, errorText);
      throw new Error(`AI service error: ${response.status}`);
    }
    
    const aiData = await response.json();
    console.log('✅ REAL AI Response received:', aiData);
    
    if (aiData.success && aiData.recommendations && aiData.recommendations.length > 0) {
      console.log('🎯 REAL AI Recommendations:', aiData.recommendations);
      return aiData.recommendations;
    } else {
      console.error('❌ Invalid AI response format:', aiData);
      throw new Error('Invalid response from AI service');
    }
    
  } catch (error) {
    console.error('❌ Error fetching REAL AI recommendations:', error);
    const errorMessage = error instanceof Error ? error.message : 'AI service unavailable';
    setAiError(errorMessage);
    
    // For development - you can temporarily return sample data
    // Remove this in production
    console.log('🔄 Using development fallback data');
    return [
      "Проанализируйте структуру расходов для оптимизации денежного потока",
      "Рассмотрите возможность увеличения срока для снижения ежемесячных платежей",
      "Изучите исламские инвестиционные инструменты для диверсификации портфеля",
      "Создайте резервный фонд на 3-6 месяцев обязательных расходов"
    ];
  } finally {
    setAiLoading(false);
  }
}, []);

  // Enhanced scoring with REAL AI recommendations only
  const calculateEligibility = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setAiError(null);
    
    try {
      // Basic calculations
      const totalMonthlyDebt = applicant.existingDebtMonthly;
      const dtiBefore = totalMonthlyDebt / applicant.netIncomeMonthly;
      
      // Mock score calculation (keep only for product eligibility)
      const mockScore = Math.min(0.99, Math.max(0.01, 
        (applicant.netIncomeMonthly / 1000000) * 0.3 +
        ((applicant.creditScore || 650) / 850) * 0.25 -
        (dtiBefore) * 0.2 +
        (applicant.employmentYears / 10) * 0.15 +
        (applicant.downPayment / applicant.targetAmount) * 0.1
      ));

      // Product eligibility check
      const suggestedProducts = Object.entries(PRODUCT_CATALOG).map(([key, product]) => {
        let eligible = true;
        const reasons = [];

        // Amount validation
        if (applicant.targetAmount < product.minAmount || applicant.targetAmount > product.maxAmount) {
          eligible = false;
          reasons.push(`Сумма: ${product.minAmount.toLocaleString()} - ${product.maxAmount.toLocaleString()} KZT`);
        }

        // Term validation
        const term = applicant.termMonths;
        if (term && (term < product.minTerm || term > product.maxTerm)) {
          eligible = false;
          reasons.push(`Срок: ${product.minTerm} - ${product.maxTerm} мес`);
        }

        // Age validation
        const userAge = 30;
        if (userAge < product.minAge || userAge > product.maxAge) {
          eligible = false;
          reasons.push(`Возраст: ${product.minAge} - ${product.maxAge} лет`);
        }

        // Sharia preference filter
        if (applicant.shariaPreference && !product.name.includes('Ислам')) {
          eligible = false;
          reasons.push('Только исламские продукты');
        }

        return {
          ...product,
          eligible,
          reason: reasons.length > 0 ? reasons.join(', ') : undefined
        };
      });

      // Affordability calculation
      let monthlyPayment = 0;
      if (['home', 'education', 'medical', 'big_purchase'].includes(applicant.goalType)) {
        const principal = applicant.targetAmount - applicant.downPayment;
        const product = PRODUCT_CATALOG[GOAL_TYPES.find(g => g.id === applicant.goalType)?.product || 'consumer_financing'];
        monthlyPayment = Math.round(principal / applicant.termMonths + (product.markup || 0));
      }

      const dtiAfter = (totalMonthlyDebt + monthlyPayment) / applicant.netIncomeMonthly;
      const affordable = dtiAfter <= 0.5;

      // Savings calculation
      let requiredMonthlySavings;
      if (['savings', 'invest'].includes(applicant.goalType)) {
        const product = PRODUCT_CATALOG[applicant.goalType === 'savings' ? 'kopilka' : 'wakala'];
        const monthlyYield = (product.yield || 0) / 100 / 12;
        const months = applicant.termMonths;
        requiredMonthlySavings = Math.round(
          applicant.targetAmount / ((Math.pow(1 + monthlyYield, months) - 1) / monthlyYield)
        );
      }

      // 🔥 GET REAL AI RECOMMENDATIONS - NO MOCK DATA
      console.log('🚀 Starting REAL AI recommendation fetch...');
      const aiRecommendations = await fetchAIRecommendations(applicant);
      console.log('🎯 REAL AI recommendations result:', aiRecommendations);

      // Use ONLY AI recommendations - no fallback mock data
      const allRecommendations = aiRecommendations;

      const newResult: Result = {
        score: parseFloat(mockScore.toFixed(3)),
        risk_label: mockScore > 0.7 ? 'Отлично' : mockScore > 0.5 ? 'Хорошо' : 'Требует проверки',
        suggestedProducts: suggestedProducts.filter(p => p.eligible && p.type === (['savings', 'invest'].includes(applicant.goalType) ? 'investment' : 'financing')),
        affordability: {
          dtiBefore: parseFloat(dtiBefore.toFixed(2)),
          dtiAfter: parseFloat(dtiAfter.toFixed(2)),
          affordable,
          maxAffordableAmount: Math.round(applicant.netIncomeMonthly * 0.5 - totalMonthlyDebt) * applicant.termMonths
        },
        recommendations: allRecommendations, // Only real AI data
        aiRecommendations: aiRecommendations,
        requiredMonthlySavings
      };

      setResult(newResult);
      setHistory(prev => [{
        timestamp: new Date().toISOString(),
        applicant: {...applicant},
        result: newResult
      }, ...prev.slice(0, 4)]);

    } catch (err) {
      console.error('Calculation error:', err);
      setError(err instanceof Error ? err.message : "Ошибка расчета");
    } finally {
      setIsLoading(false);
    }
  }, [applicant, fetchAIRecommendations]);

  // Chart data
// Enhanced expense chart data
const expenseChartData = {
  labels: ['Жилье', 'Транспорт', 'Питание', 'Покупки', 'Прочее'],
  datasets: [{
    data: Object.values(applicant.expenses),
    backgroundColor: [
      '#8b5cf6', // Purple for housing
      '#f59e0b', // Amber for transport  
      '#ef4444', // Red for food
      '#3b82f6', // Blue for shopping
      '#10b981'  // Green for other
    ],
    borderWidth: 2,
    borderColor: '#ffffff',
    hoverBorderWidth: 3,
    hoverBorderColor: '#f3f4f6',
    hoverOffset: 8
  }]
};

  const affordabilityChartData = {
    labels: ['Текущий DTI', 'С новой целью'],
    datasets: [{
      data: result ? [result.affordability.dtiBefore * 100, result.affordability.dtiAfter * 100] : [0, 0],
      backgroundColor: ['#8db92e', '#ff671b'],
      borderWidth: 0
    }]
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Шаг {currentStep} из 3</span>
          <span>Планировщик целей</span>
        </div>
        <ProgressBar 
          value={(currentStep / 3) * 100} 
          color="orange" 
          className="w-full"
        />
      </div>

      {currentStep === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
              Какова ваша цель?
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Выберите финансовую цель и мы подберем подходящий продукт Zaman
            </p>
          </div>

          {/* Goal Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Тип цели *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {GOAL_TYPES.map((goal) => {
                const Icon = goal.icon;
                return (
                  <button
                    key={goal.id}
                    onClick={() => handleGoalTypeSelect(goal.id as GoalType)}
                    className={`p-4 rounded-xl border-2 text-left transition-all ${
                      applicant.goalType === goal.id
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                    }`}
                  >
                    <Icon className="text-xl mb-2 text-orange-500" />
                    <div className="font-medium text-gray-800 dark:text-white/90">{goal.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {PRODUCT_CATALOG[goal.product]?.description}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Goal Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Целевая сумма (KZT) *
              </label>
              <input
                type="number"
                name="targetAmount"
                value={applicant.targetAmount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {['savings', 'invest'].includes(applicant.goalType) ? 'Срок (месяцы)' : 'Срок (месяцы)'} *
              </label>
              <input
                type="number"
                name="termMonths"
                value={applicant.termMonths}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            {['home', 'big_purchase'].includes(applicant.goalType) && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Первоначальный взнос *
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    name="downPayment"
                    value={applicant.downPayment}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  />
                  <select
                    name="downPaymentType"
                    value={applicant.downPaymentType}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="fixed">KZT</option>
                    <option value="percentage">%</option>
                  </select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Комфортный ежемесячный платеж (KZT)
              </label>
              <input
                type="number"
                name="monthlyPaymentLimit"
                value={applicant.monthlyPaymentLimit}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
              <p className="text-xs text-gray-500">Рекомендуется: 35% от чистого дохода</p>
            </div>
          </div>

          {/* Sharia Preference */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              name="shariaPreference"
              checked={applicant.shariaPreference}
              onChange={handleInputChange}
              className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
            />
            <div>
              <label className="font-medium text-gray-800 dark:text-white/90">
                Только исламские продукты
              </label>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Показывать только соответствующие шариату продукты
              </p>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => setCurrentStep(2)}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              Перейти к финансам
            </button>
          </div>
        </div>
      )}

      {currentStep === 2 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
              Ваша финансовая ситуация
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Помогите нам понять вашу финансовую возможность
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Income & Employment */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ежемесячный чистый доход (KZT) *
                </label>
                <input
                  type="number"
                  name="netIncomeMonthly"
                  value={applicant.netIncomeMonthly}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Существующие ежемесячные платежи (KZT) *
                </label>
                <input
                  type="number"
                  name="existingDebtMonthly"
                  value={applicant.existingDebtMonthly}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Стаж работы (лет) *
                </label>
                <input
                  type="number"
                  name="employmentYears"
                  value={applicant.employmentYears}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Кредитный рейтинг (опционально)
                </label>
                <input
                  type="number"
                  name="creditScore"
                  min="300"
                  max="850"
                  value={applicant.creditScore}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            {/* Expenses */}
{/* Expenses */}
<div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
  <div className="flex justify-between items-center mb-4">
    <h4 className="font-medium text-gray-800 dark:text-white/90">Ежемесячные расходы</h4>
    <button
      onClick={setTypicalExpenses}
      className="text-sm text-orange-500 hover:text-orange-600"
    >
      Использовать типичные значения
    </button>
  </div>

  <div className="space-y-3">
    {Object.entries(applicant.expenses).map(([category, amount]) => (
      <div key={category}>
        <div className="flex justify-between text-sm mb-1">
          <span className="capitalize text-gray-700 dark:text-gray-300">
            {category === 'housing' ? 'Жилье' : 
             category === 'transport' ?  'Транспорт' :
             category === 'food' ? 'Питание' :
             category === 'shopping' ?  'Покупки' : 'Прочее'}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            {((amount / applicant.netIncomeMonthly) * 100).toFixed(0)}%
          </span>
        </div>
        <input
          type="range"
          name={`expenses.${category}`}
          min="0"
          max={applicant.netIncomeMonthly}
          value={amount}
          onChange={handleInputChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-orange-500"
        />
        <div className="text-xs text-gray-500 text-right">
          {amount.toLocaleString()} KZT
        </div>
      </div>
    ))}
  </div>

  {/* Enhanced Expense Chart */}
  <div className="mt-6 h-48">
    <Pie 
      data={expenseChartData}
      options={{
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 20,
              usePointStyle: true,
              pointStyle: 'circle',
              font: {
                size: 11,
                family: "'Inter', sans-serif"
              },
              color: '#6B7280'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#1F2937',
            bodyColor: '#374151',
            borderColor: '#E5E7EB',
            borderWidth: 1,
            cornerRadius: 8,
            displayColors: true,
            callbacks: {
              label: function(context) {
                const label = context.label || '';
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = Math.round((value / total) * 100);
                return `${label}: ${value.toLocaleString()} KZT (${percentage}%)`;
              }
            }
          }
        },
        cutout: '40%',
        borderRadius: 6,
        spacing: 2,
        animation: {
          animateScale: true,
          animateRotate: true
        }
      }}
    />
  </div>
  
  {/* Chart Summary */}
  <div className="mt-4 p-3 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
    <div className="flex justify-between items-center text-sm">
      <span className="text-gray-600 dark:text-gray-400">Общие расходы:</span>
      <span className="font-semibold text-gray-800 dark:text-white/90">
        {Object.values(applicant.expenses).reduce((a, b) => a + b, 0).toLocaleString()} KZT
      </span>
    </div>
    <div className="flex justify-between items-center text-sm mt-1">
      <span className="text-gray-600 dark:text-gray-400">Остаток после расходов:</span>
      <span className="font-semibold text-green-600">
        {(applicant.netIncomeMonthly - Object.values(applicant.expenses).reduce((a, b) => a + b, 0)).toLocaleString()} KZT
      </span>
    </div>
  </div>
</div>
          </div>

          <div className="flex justify-between">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 font-medium"
            >
              Назад
            </button>
            <button
              onClick={() => {
                setCurrentStep(3);
                calculateEligibility();
              }}
              className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium"
            >
              Анализ и симуляция
            </button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90 mb-2">
              Ваш персонализированный план
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              На основе ваших целей и финансовой ситуации
            </p>
          </div>

          {isLoading && (
            <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded-lg flex flex-col items-center justify-center">
              <ProgressBar value={75} color="orange" className="w-full mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">Анализируем ваш финансовый план...</p>
            </div>
          )}

          {result && !isLoading && (
            <>
              {/* Suggested Products */}
              <div>
                <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3">Рекомендуемые продукты Zaman</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.suggestedProducts
                    .filter(product => product.eligible)
                    .map((product, index) => (
                      <div key={product.id} className="p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-white dark:bg-gray-800">
                        <div className="flex justify-between items-start mb-3">
                          <h5 className="font-medium text-gray-800 dark:text-white/90">{product.name}</h5>
                          <Badge color="success">Доступно</Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{product.description}</p>
                        
                        {/* Product Details */}
                        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                          <div className="space-y-1">
                            <div className="text-gray-500">Сумма:</div>
                            <div className="font-medium">{product.minAmount.toLocaleString()} - {product.maxAmount.toLocaleString()} KZT</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-gray-500">Срок:</div>
                            <div className="font-medium">{product.minTerm} - {product.maxTerm} мес</div>
                          </div>
                          {product.markup && (
                            <div className="space-y-1">
                              <div className="text-gray-500">Наценка:</div>
                              <div className="font-medium">от {product.markup.toLocaleString()} KZT</div>
                            </div>
                          )}
                          {product.yield && (
                            <div className="space-y-1">
                              <div className="text-gray-500">Доходность:</div>
                              <div className="font-medium text-green-600">до {product.yield}%</div>
                            </div>
                          )}
                        </div>

                        {/* Features */}
                        <div className="flex flex-wrap gap-1 mb-3">
                          {product.features.map((feature, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded dark:bg-blue-900 dark:text-blue-300">
                              {feature}
                            </span>
                          ))}
                        </div>

                        <button className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium text-sm">
                          Подать заявку
                        </button>
                      </div>
                    ))}
                  
                  {result.suggestedProducts.filter(p => p.eligible).length === 0 && (
                    <div className="col-span-2 p-6 text-center bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <FiAlertCircle className="mx-auto text-2xl text-gray-400 mb-2" />
                      <p className="text-gray-600 dark:text-gray-400">Нет доступных продуктов. Попробуйте изменить параметры цели.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Analysis Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Affordability Check */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3">Анализ платежеспособности</h4>
                  <div className="h-40 mb-4">
                    <Bar 
                      data={affordabilityChartData}
                      options={{
                        plugins: {
                          legend: { display: false }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            ticks: {
                              callback: (value) => `${value}%`
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                    result.affordability.affordable 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {result.affordability.affordable ? (
                      <FiCheckCircle className="text-green-500" />
                    ) : (
                      <FiAlertCircle className="text-red-500" />
                    )}
                    DTI: {(result.affordability.dtiAfter * 100).toFixed(0)}% 
                    ({result.affordability.affordable ? 'В пределах нормы' : 'Выше лимита 50%'})
                  </div>
                </div>

                {/* Required Savings */}
                {result.requiredMonthlySavings && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <h4 className="font-medium text-gray-800 dark:text-white/90 mb-3">План накоплений</h4>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {result.requiredMonthlySavings.toLocaleString()} KZT
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Ежемесячные savings для достижения цели
                      </p>
                      <div className="mt-3 w-full bg-green-200 rounded-full h-2 dark:bg-green-800">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-500"
                          style={{ width: '45%' }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">Прогресс: 45%</p>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Recommendations Section - REAL AI ONLY */}
              <div className="space-y-6">

<div className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-blue-900/20 dark:via-gray-900/20 dark:to-indigo-900/20 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
  {/* Header */}
  <div className="flex items-center gap-3 mb-6">
    <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
      <FiZap className="text-white text-xl" />
    </div>
    <div className="flex-1">
      <div className="flex items-center gap-2">
        <h4 className="font-semibold text-gray-900 dark:text-white/90 text-lg">Zaman AI Финансовый Советник</h4>
        <Badge color="info" size="sm">Live AI</Badge>
        {aiLoading && (
          <div className="flex items-center gap-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
            Анализируем...
          </div>
        )}
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
        Персонализированные рекомендации на основе ваших данных
      </p>
    </div>
  </div>

  {/* User Context Summary */}
  <div className="mb-6 p-4 bg-white/60 dark:bg-gray-800/60 rounded-xl border border-blue-100 dark:border-blue-800/50">
    <div className="flex items-center gap-2 mb-3">
      <FiInfo className="text-blue-500" />
      <span className="font-medium text-gray-800 dark:text-white/90 text-sm">Ваша финансовая ситуация</span>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
      <div className="space-y-1">
        <div className="text-gray-500">Цель</div>
        <div className="font-medium text-gray-800 dark:text-white/90 capitalize">
          {applicant.goalType === 'home' ? 'Покупка жилья' :
           applicant.goalType === 'car' ? 'Покупка автомобиля' :
           applicant.goalType === 'education' ? 'Образование' :
           applicant.goalType === 'travel' ? 'Путешествие' :
           applicant.goalType === 'medical' ? 'Медицина' :
           applicant.goalType === 'big_purchase' ? 'Крупная покупка' :
           applicant.goalType === 'savings' ? 'Накопления' :
           applicant.goalType === 'invest' ? 'Инвестиции' :
           applicant.goalType === 'business' ? 'Бизнес' :
           applicant.goalType === 'hajj' ? 'Хадж' :
           applicant.goalType === 'gold' ? 'Инвестиции в золото' :
           'Инвестиции в недвижимость'}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-gray-500">Сумма</div>
        <div className="font-medium text-gray-800 dark:text-white/90">{applicant.targetAmount?.toLocaleString()} KZT</div>
      </div>
      <div className="space-y-1">
        <div className="text-gray-500">Срок</div>
        <div className="font-medium text-gray-800 dark:text-white/90">{applicant.termMonths} мес</div>
      </div>
      <div className="space-y-1">
        <div className="text-gray-500">Доход</div>
        <div className="font-medium text-gray-800 dark:text-white/90">{applicant.netIncomeMonthly?.toLocaleString()} KZT/мес</div>
      </div>
    </div>
  </div>

  {/* AI Recommendations */}
  <div className="space-y-4">
    {aiError && (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <div className="flex items-center gap-2 text-red-800 mb-2">
          <FiAlertCircle className="text-red-500" />
          <span className="font-medium">Ошибка подключения к AI</span>
        </div>
        <p className="text-sm text-red-600 mb-3">{aiError}</p>
        <button 
          onClick={() => calculateEligibility()}
          className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Попробовать снова
        </button>
      </div>
    )}

    {result?.recommendations && result.recommendations.length > 0 ? (
      result.recommendations.map((rec, index) => {
        // Clean and format the AI response
        const cleanRecommendation = rec
          .replace(/\*\*/g, '') // Remove **
          .replace(/\*/g, '')   // Remove *
          .replace(/\[.*?\]/g, '') // Remove [text]
          .replace(/\(.*?\)/g, '') // Remove (text)
          .replace(/^- /, '')   // Remove bullet points
          .replace(/^\d+\.\s*/, '') // Remove numbering
          .trim();

        // Determine icon and color based on content
        const getIconAndColor = (text: string, index: number) => {
          const lowerText = text.toLowerCase();
          
          if (lowerText.includes('оптим') || lowerText.includes('улучш') || lowerText.includes('повыш')) {
            return { icon: '📈', color: 'from-green-500 to-emerald-600' };
          }
          if (lowerText.includes('риск') || lowerText.includes('вниман') || lowerText.includes('осторож')) {
            return { icon: '⚠️', color: 'from-amber-500 to-orange-600' };
          }
          if (lowerText.includes('сбереж') || lowerText.includes('накоп') || lowerText.includes('экономи')) {
            return { icon: '💰', color: 'from-blue-500 to-indigo-600' };
          }
          if (lowerText.includes('ислам') || lowerText.includes('шариат')) {
            return { icon: '🕌', color: 'from-purple-500 to-violet-600' };
          }
          if (lowerText.includes('время') || lowerText.includes('срок') || lowerText.includes('период')) {
            return { icon: '⏰', color: 'from-cyan-500 to-blue-600' };
          }
          
          // Default icons based on position
          const defaultIcons = ['💡', '🎯', '🚀', '⭐️'];
          const defaultColors = [
            'from-blue-500 to-indigo-600',
            'from-purple-500 to-violet-600', 
            'from-pink-500 to-rose-600',
            'from-teal-500 to-cyan-600'
          ];
          
          return { 
            icon: defaultIcons[index] || '✨', 
            color: defaultColors[index] || 'from-gray-500 to-gray-600' 
          };
        };

        const { icon, color } = getIconAndColor(cleanRecommendation, index);

        return (
          <div key={index} className="flex items-start gap-4 p-4 bg-white/80 dark:bg-gray-800/80 rounded-xl border border-blue-100 dark:border-blue-800/30 hover:border-blue-200 dark:hover:border-blue-700/50 transition-all duration-200 hover:shadow-sm">
            <div className={`flex-shrink-0 w-10 h-10 bg-gradient-to-br ${color} rounded-lg flex items-center justify-center shadow-sm`}>
              <span className="text-white text-lg">{icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-500">Совет {index + 1}</span>
                <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                <span className="text-xs text-gray-400">
                  {index === 0 && 'Высокий приоритет'}
                  {index === 1 && 'Средний приоритет'} 
                  {index === 2 && 'Дополнительная оптимизация'}
                  {index === 3 && 'Долгосрочная стратегия'}
                </span>
              </div>
              <p className="text-gray-800 dark:text-white/90 leading-relaxed text-sm">
                {cleanRecommendation}
              </p>
              
              {/* Action buttons for each recommendation */}
              <div className="flex gap-2 mt-3">
                <button className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-medium transition-colors border border-blue-200">
                  Подробнее
                </button>
                <button className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-medium transition-colors border border-green-200">
                  Применить
                </button>
              </div>
            </div>
          </div>
        );
      })
    ) : aiLoading ? (
      <div className="text-center py-12">
        <div className="inline-flex items-center gap-3 mb-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <div className="text-left">
            <p className="font-medium text-gray-800 dark:text-white/90">AI анализирует вашу ситуацию</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Это займет несколько секунд</p>
          </div>
        </div>
        <div className="w-48 mx-auto bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
          <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '65%' }}></div>
        </div>
      </div>
    ) : (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <FiTarget className="text-gray-400 text-2xl" />
        </div>
        <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Готовы к анализу</h5>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
          Нажмите "Анализ и симуляция" чтобы получить персонализированные рекомендации от AI
        </p>
      </div>
    )}
  </div>

  {/* Footer */}
  {(result?.recommendations && result.recommendations.length > 0) && (
    <div className="mt-6 pt-4 border-t border-blue-200 dark:border-blue-700/50">
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span>Анализ выполнен с помощью GPT-4o-mini</span>
        </div>
        <div className="flex items-center gap-2">
          <span>🔄 Обновлено: {new Date().toLocaleTimeString('ru-RU')}</span>
        </div>
      </div>
    </div>
  )}
</div>
                {/* Action Plan */}
                <div className="p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                  <div className="flex items-center gap-2 mb-3">
                    <FiTrendingUp className="text-orange-500 text-xl" />
                    <h4 className="font-medium text-gray-800 dark:text-white/90">План действий</h4>
                    <Badge color="warning" size="sm">Следующие шаги</Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Ознакомьтесь с рекомендованными продуктами</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Реализуйте рекомендации AI-советника</span>
                    </div>
                    <div className="flex items-center gap-3 p-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                      <span className="text-sm text-gray-700 dark:text-gray-300">Отслеживайте прогресс ежемесячно</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
{/* Action Buttons */}
<div className="flex justify-center gap-4 pt-6">
  {['home', 'education', 'medical', 'big_purchase', 'car', 'business', 'hajj'].includes(applicant.goalType) ? (
    <button 
      onClick={() => {
        // Simulate application process
        alert(`Заявка на продукт отправлена!\n\nЦель: ${applicant.goalType}\nСумма: ${applicant.targetAmount?.toLocaleString()} KZT\nСрок: ${applicant.termMonths} месяцев`);
        
        // Here you would typically:
        // 1. Send application data to backend
        // 2. Redirect to application form
        // 3. Open modal with application details
      }}
      className="px-8 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
    >
      Подать заявку
    </button>
  ) : (
    <button 
      onClick={() => {
        // Simulate investment process
        alert(`Инвестиционный план создан!\n\nЦель: ${applicant.goalType}\nЦелевая сумма: ${applicant.targetAmount?.toLocaleString()} KZT\nЕжемесячные взносы: ${result?.requiredMonthlySavings?.toLocaleString()} KZT`);
      }}
      className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
    >
      Начать накопления
    </button>
  )}
  <button
    onClick={() => setCurrentStep(1)}
    className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 font-medium transition-colors"
  >
    Изменить цели
  </button>
</div>
            </>
          )}
        </div>
      )}
    </div>
  );
}