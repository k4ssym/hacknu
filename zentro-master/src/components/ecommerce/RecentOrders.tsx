import React, { useState, useMemo } from "react";
import { 
  FiUpload, 
  FiDownload, 
  FiCheckCircle, 
  FiAlertCircle, 
  FiX,
  FiInfo,
  FiBarChart2,
  FiPrinter,
  FiRefreshCw
} from "react-icons/fi";
import Papa from "papaparse";
import { Bar, Pie } from "react-chartjs-2";
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend,
  ArcElement
);

// Types
type FileStatus = 'empty' | 'uploaded' | 'validating' | 'valid' | 'invalid' | 'processing' | 'complete';
type ValidationError = { row?: number; field: string; message: string };
type RiskLevel = 'low' | 'medium' | 'high';

interface Applicant {
  id?: string;
  age: number;
  income: number;
  loan_amount: number;
  credit_history: number;
  employment_length: number;
  debt_to_income: number;
  score?: number;
  risk_level?: RiskLevel;
  decision?: string;
}

// Credit Scoring Formula
const calculateCreditScore = (applicant: Applicant): number => {
  // Normalize and weight factors (0-1 scale)
  const factors = {
    income: Math.min(1, applicant.income / 150000) * 0.3, // Max $150k
    creditHistory: (applicant.credit_history - 300) / 550 * 0.3, // 300-850 range
    employment: Math.min(1, applicant.employment_length / 10) * 0.2, // Max 10 years
    age: Math.min(1, (applicant.age - 18) / 50) * 0.1, // 18-68 range
    debtRatio: (1 - Math.min(1, applicant.debt_to_income / 0.5)) * 0.1 // Max 50% DTI
  };

  // Calculate raw score (0-1)
  let score = Object.values(factors).reduce((sum, val) => sum + val, 0);
  
  // Penalize high loan-to-income ratio
  const loanToIncome = applicant.loan_amount / applicant.income;
  if (loanToIncome > 0.5) score *= 0.8;
  if (loanToIncome > 1) score *= 0.7;
  
  return Math.min(1, Math.max(0, score));
};

const determineRiskLevel = (score: number): RiskLevel => {
  if (score >= 0.7) return 'low';
  if (score >= 0.4) return 'medium';
  return 'high';
};

const getDecision = (riskLevel: RiskLevel): string => {
  switch(riskLevel) {
    case 'low': return 'Approve';
    case 'medium': return 'Review';
    case 'high': return 'Reject';
  }
};

const ProgressBar = ({ 
  value, 
  color = 'orange', 
  className = ''
}: {
  value: number;
  color?: 'orange' | 'green' | 'red';
  className?: string;
}) => {
  const width = Math.min(100, Math.max(0, value));
  const colorClasses = {
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${width}%` }}
      />
    </div>
  );
};

const RecentOrders = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<FileStatus>('empty');
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [previewData, setPreviewData] = useState<Applicant[]>([]);
  const [processedData, setProcessedData] = useState<Applicant[]>([]);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'results' | 'analysis'>('results');

  const requiredColumns = [
    { name: 'age', type: 'number', description: 'Applicant age (18-100)' },
    { name: 'income', type: 'number', description: 'Annual income in USD' },
    { name: 'loan_amount', type: 'number', description: 'Requested loan amount' },
    { name: 'credit_history', type: 'number', description: 'Credit score (300-850)' },
    { name: 'employment_length', type: 'number', description: 'Years at current job' },
    { name: 'debt_to_income', type: 'number', description: 'Debt-to-income ratio (0-1)' }
  ];

const stats = useMemo(() => {
  if (processedData.length === 0) return null;
  
  const riskCounts = processedData.reduce((acc, curr) => {
    acc[curr.risk_level!] = (acc[curr.risk_level!] || 0) + 1;
    return acc;
  }, {} as Record<RiskLevel, number>);

  return {
    total: processedData.length,
    lowRisk: riskCounts.low || 0,
    mediumRisk: riskCounts.medium || 0,
    highRisk: riskCounts.high || 0,
    avgScore: processedData.reduce((sum, curr) => sum + (curr.score || 0), 0) / processedData.length
  };
}, [processedData]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const uploadedFile = e.target.files[0];
      
      if (uploadedFile.size > 10 * 1024 * 1024) {
        setErrors([{ field: 'file', message: 'File size exceeds 10MB limit' }]);
        setStatus('invalid');
        return;
      }

      setFile(uploadedFile);
      setStatus('uploaded');
      setErrors([]);
      
      Papa.parse(uploadedFile, {
        header: true,
        preview: 5,
        complete: (results) => {
          const sampleData = results.data[0];
          const preview = results.data.slice(0, 5).map(row => ({
            age: Number(row.age),
            income: Number(row.income),
            loan_amount: Number(row.loan_amount),
            credit_history: Number(row.credit_history),
            employment_length: Number(row.employment_length),
            debt_to_income: Number(row.debt_to_income)
          }));
          
          setPreviewData(preview);
          validateFile(results.meta.fields || [], sampleData);
        },
        error: (error) => {
          setErrors([{ field: 'file', message: error.message }]);
          setStatus('invalid');
        }
      });
    }
  };

  const validateFile = (columns: string[], sampleData: any) => {
    setStatus('validating');
    const newErrors: ValidationError[] = [];
    
    // Check for missing columns
    requiredColumns.forEach(col => {
      if (!columns.includes(col.name)) {
        newErrors.push({
          field: col.name,
          message: `Required column missing: ${col.name} (${col.description})`
        });
      }
    });
    
    // Check data types in the first row
    requiredColumns.forEach(col => {
      if (columns.includes(col.name)) {
        const value = sampleData[col.name];
        if (isNaN(Number(value))) {
          newErrors.push({
            field: col.name,
            message: `Invalid ${col.name}: Must be a number (${col.description})`
          });
        }
      }
    });
    
    if (newErrors.length > 0) {
      setErrors(newErrors);
      setStatus('invalid');
    } else {
      setStatus('valid');
    }
  };

  const processFile = async () => {
    if (!file) return;
    
    setStatus('processing');
    setProgress(0);
    
    try {
      // Simulate processing with progress
      const updateProgress = () => {
        setProgress(prev => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 100 ? 100 : newProgress;
        });
      };
      
      const progressInterval = setInterval(updateProgress, 200);
      
      // Parse the full file
      const results = await new Promise<Applicant[]>((resolve, reject) => {
        Papa.parse(file, {
          header: true,
          complete: (parsed) => {
            const data = parsed.data.map((row: any) => ({
              age: Number(row.age),
              income: Number(row.income),
              loan_amount: Number(row.loan_amount),
              credit_history: Number(row.credit_history),
              employment_length: Number(row.employment_length),
              debt_to_income: Number(row.debt_to_income)
            }));
            resolve(data);
          },
          error: reject
        });
      });
      
      // Calculate scores
      const processed = results.map(applicant => {
        const score = calculateCreditScore(applicant);
        const risk_level = determineRiskLevel(score);
        return {
          ...applicant,
          score: parseFloat(score.toFixed(3)),
          risk_level,
          decision: getDecision(risk_level)
        };
      });
      
      clearInterval(progressInterval);
      setProgress(100);
      setProcessedData(processed);
      setStatus('complete');
      
    } catch (error) {
      setErrors([{ field: 'processing', message: error instanceof Error ? error.message : 'Processing failed' }]);
      setStatus('invalid');
      setProgress(0);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setStatus('empty');
    setPreviewData([]);
    setProcessedData([]);
    setErrors([]);
    setProgress(0);
  };

  const downloadResults = () => {
    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `credit_scores_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const printResults = () => {
    window.print();
  };

  // Chart data
  const riskDistributionData = {
    labels: ['Low Risk', 'Medium Risk', 'High Risk'],
    datasets: [{
      data: [stats?.lowRisk || 0, stats?.mediumRisk || 0, stats?.highRisk || 0],
      backgroundColor: ['#10B981', '#F59E0B', '#EF4444'],
      borderWidth: 0
    }]
  };

  const scoreDistributionData = {
    labels: processedData.map((_, i) => `Applicant ${i+1}`),
    datasets: [{
      label: 'Credit Score',
      data: processedData.map(d => d.score),
      backgroundColor: processedData.map(d => 
        d.risk_level === 'high' ? '#EF4444' : 
        d.risk_level === 'medium' ? '#F59E0B' : '#10B981'
      ),
      borderColor: '#1F2937',
      borderWidth: 1
    }]
  };

  const factorAnalysisData = {
    labels: processedData.slice(0, 20).map((_, i) => `Applicant ${i+1}`),
    datasets: [
      {
        label: 'Income Impact',
        data: processedData.slice(0, 20).map(d => (d.income / 150000) * 0.3),
        backgroundColor: '#3B82F6'
      },
      {
        label: 'Credit History',
        data: processedData.slice(0, 20).map(d => ((d.credit_history - 300) / 550) * 0.3),
        backgroundColor: '#8B5CF6'
      },
      {
        label: 'Employment',
        data: processedData.slice(0, 20).map(d => Math.min(1, d.employment_length / 10) * 0.2),
        backgroundColor: '#EC4899'
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* Upload Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Batch Credit Scoring
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload applicant data for risk assessment
            </p>
          </div>
          {status !== 'empty' && (
            <button 
              onClick={resetUpload}
              className="p-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <FiX className="text-lg" />
            </button>
          )}
        </div>

        {status === 'empty' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center dark:border-gray-700">
            <div className="flex flex-col items-center justify-center space-y-3">
              <FiUpload className="h-10 w-10 text-gray-400" />
              <label className="cursor-pointer">
                <span className="text-orange-500 hover:text-orange-600 font-medium">
                  Select CSV file
                </span>
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                or drag and drop file here
              </p>
              <a 
                href="#" // Replace with actual template URL
                onClick={(e) => {
                  e.preventDefault();
                  // Generate template CSV
                  const headers = requiredColumns.map(c => c.name).join(',');
                  const example = '35,75000,15000,720,5,0.25';
                  const csv = `${headers}\n${example}`;
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.setAttribute('download', 'credit_applicants_template.csv');
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="text-xs text-orange-500 hover:underline"
              >
                Download CSV template
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg dark:bg-gray-800">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <FiUpload className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {file?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {(file?.size || 0) > 1024 * 1024 
                      ? `${((file?.size || 0) / 1024 / 1024).toFixed(1)} MB` 
                      : `${Math.round((file?.size || 0) / 1024)} KB`}
                  </p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                status === 'valid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                status === 'invalid' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
              }`}>
                {status === 'uploaded' && 'Uploaded'}
                {status === 'validating' && 'Validating...'}
                {status === 'valid' && 'Valid'}
                {status === 'invalid' && 'Invalid'}
                {status === 'processing' && 'Processing...'}
                {status === 'complete' && 'Complete'}
              </div>
            </div>

            {status === 'invalid' && (
              <div className="p-3 bg-red-50 rounded-lg dark:bg-red-900/20">
                <h4 className="flex items-center gap-2 font-medium text-red-700 dark:text-red-400">
                  <FiAlertCircle className="text-lg" />
                  Validation Errors
                </h4>
                <ul className="mt-2 space-y-1 text-sm text-red-600 dark:text-red-400">
                  {errors.map((error, idx) => (
                    <li key={idx}>{error.message}</li>
                  ))}
                </ul>
                <button
                  onClick={resetUpload}
                  className="w-full mt-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            )}

            {status === 'valid' && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-800 dark:text-white/90">
                  Data Preview (first 5 rows)
                </h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        {previewData[0] && Object.keys(previewData[0]).map((key) => (
                          <th 
                            key={key}
                            className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                          >
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {previewData.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {Object.values(row).map((value: any, colIdx) => (
                            <td 
                              key={colIdx}
                              className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200"
                            >
                              {typeof value === 'number' ? value.toLocaleString() : value}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button
                  onClick={processFile}
                  disabled={status === 'processing'}
                  className={`w-full py-2 ${
                    status === 'processing' ? 'bg-orange-400' : 'bg-orange-500 hover:bg-orange-600'
                  } text-white rounded-lg transition-colors`}
                >
                  {status === 'processing' ? 'Processing...' : 'Process File'}
                </button>
              </div>
            )}

            {(status === 'processing' || status === 'complete') && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700 dark:text-gray-300">
                      {status === 'processing' ? 'Processing...' : 'Processing complete'}
                    </span>
                    <span className="font-medium">
                      {progress.toFixed(0)}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={progress} 
                    color={status === 'complete' ? 'green' : 'orange'}
                  />
                </div>

                {status === 'complete' && stats && (
                  <div className="p-3 bg-green-50 rounded-lg dark:bg-green-900/20">
                    <div className="flex items-center gap-3 mb-3">
                      <FiCheckCircle className="text-green-500 dark:text-green-400 text-lg" />
                      <div>
                        <h4 className="font-medium text-green-700 dark:text-green-400">
                          Scoring Complete
                        </h4>
                        <p className="text-sm text-green-600 dark:text-green-500">
                          {stats.total} records processed
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="p-2 bg-green-50 rounded dark:bg-green-900/20">
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Low Risk</p>
                        <p className="text-lg font-bold">{stats.lowRisk}</p>
                      </div>
                      <div className="p-2 bg-yellow-50 rounded dark:bg-yellow-900/20">
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Medium Risk</p>
                        <p className="text-lg font-bold">{stats.mediumRisk}</p>
                      </div>
                      <div className="p-2 bg-red-50 rounded dark:bg-red-900/20">
                        <p className="text-sm font-medium text-red-700 dark:text-red-400">High Risk</p>
                        <p className="text-lg font-bold">{stats.highRisk}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={downloadResults}
                        className="flex-1 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FiDownload />
                        Download
                      </button>
                      <button
                        onClick={printResults}
                        className="flex-1 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors flex items-center justify-center gap-2 dark:bg-gray-700 dark:text-gray-300"
                      >
                        <FiPrinter />
                        Print
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {status === 'complete' && processedData.length > 0 && (
        <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                Credit Analysis Results
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {processedData.length} applicants scored
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('results')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeTab === 'results' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Results
              </button>
              <button
                onClick={() => setActiveTab('analysis')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  activeTab === 'analysis' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                Analysis
              </button>
            </div>
          </div>

          {activeTab === 'results' ? (
            <div className="space-y-4">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Applicant
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Score
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Risk
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Decision
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Credit Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                    {processedData.slice(0, 10).map((applicant, index) => (
                      <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                          Applicant {index + 1}
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            applicant.score! >= 0.7 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            applicant.score! >= 0.4 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {applicant.score?.toFixed(3)}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            applicant.risk_level === 'low' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            applicant.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {applicant.risk_level?.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm font-medium">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            applicant.decision === 'Approve' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            applicant.decision === 'Review' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {applicant.decision}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                          ${applicant.income.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
                          {applicant.credit_history}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400">
                <span>Showing 1-10 of {processedData.length} applicants</span>
                <button 
                  onClick={downloadResults}
                  className="text-orange-500 hover:text-orange-600 flex items-center gap-1"
                >
                  <FiDownload size={14} />
                  Download full results
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Risk Distribution</h5>
                  <div className="h-64">
                    <Pie 
                      data={riskDistributionData} 
                      options={{
                        plugins: {
                          legend: {
                            position: 'right'
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Score Distribution</h5>
                  <div className="h-64">
                    <Bar 
                      data={scoreDistributionData} 
                      options={{
                        responsive: true,
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 1
                          }
                        }
                      }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Factor Analysis (Top 20)</h5>
                <div className="h-64">
                  <Bar 
                    data={factorAnalysisData} 
                    options={{
                      responsive: true,
                      scales: {
                        x: {
                          stacked: true
                        },
                        y: {
                          stacked: true,
                          beginAtZero: true,
                          max: 0.5
                        }
                      }
                    }} 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Key Insights</h5>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        <strong>Average score:</strong> {stats?.avgScore.toFixed(3)}
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        <strong>Approval rate:</strong> {((stats?.lowRisk || 0) / (stats?.total || 1) * 100).toFixed(1)}%
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>
                        <strong>Rejection rate:</strong> {((stats?.highRisk || 0) / (stats?.total || 1) * 100).toFixed(1)}%
                      </span>
                    </li>
                  </ul>
                </div>
                
                <div className="p-4 bg-white border border-gray-200 rounded-lg dark:bg-gray-900 dark:border-gray-700">
                  <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-2">Recommendations</h5>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>Consider manual review for medium-risk applicants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>Offer better rates to low-risk applicants</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-500">•</span>
                      <span>Review high-risk applicants for potential errors</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Requirements Card */}
      <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03]">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
            <FiInfo className="h-5 w-5 text-orange-500 dark:text-orange-400" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800 dark:text-white/90">
              File Requirements
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Ensure your CSV meets these specifications
            </p>
          </div>
        </div>

        <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
          {requiredColumns.map((col, index) => (
            <li key={col.name} className="flex items-start gap-2">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
                <span className="text-white text-xs">{index + 1}</span>
              </div>
              <span>
                <strong>{col.name}:</strong> {col.description}
              </span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <div className="mt-0.5 w-4 h-4 rounded-full bg-orange-500 flex items-center justify-center">
              <span className="text-white text-xs">{requiredColumns.length + 1}</span>
            </div>
            <span>
              <strong>Max file size:</strong> 10MB (~10,000 records)
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default RecentOrders;