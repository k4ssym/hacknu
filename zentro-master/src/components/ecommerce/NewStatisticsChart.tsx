import React, { useState, useEffect } from 'react';
import { FiUpload, FiDownload, FiCheckCircle, FiAlertCircle, FiX, FiBarChart2, FiInfo } from 'react-icons/fi';
import Papa from 'papaparse';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import Badge from '../ui/badge/Badge';
import ProgressBar from '../ui/progress/ProgressBar';

import ChartDataLabels from 'chartjs-plugin-datalabels';
// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

type FileStatus = 'empty' | 'uploaded' | 'validating' | 'valid' | 'invalid' | 'scoring' | 'complete';
type RiskLabel = 'Low' | 'Medium' | 'High';
type Applicant = {
  age: string;
  income: string;
  loan_amount: string;
  credit_history: string;
  employment_length: string;
  debt_to_income: string;
  score?: string;
  risk_label?: RiskLabel;
  explanation?: string;
  id?: string;
};

type ShapValues = {
  feature: string;
  value: number;
};

export default function ZentroScoring() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<FileStatus>('empty');
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [sortedApplicants, setSortedApplicants] = useState<Applicant[]>([]);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);
  const [shapValues, setShapValues] = useState<ShapValues[]>([]);
  const [progress, setProgress] = useState(0);

  const requiredColumns = [
    'age', 'income', 'loan_amount', 'credit_history', 
    'employment_length', 'debt_to_income'
  ];

  useEffect(() => {
    const sorted = [...applicants].sort((a, b) => {
      const riskOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return (riskOrder[b.risk_label || 'Low'] - riskOrder[a.risk_label || 'Low']) ||
             (parseFloat(b.score || '0') - parseFloat(a.score || '0'));
    });
    setSortedApplicants(sorted);
    
    if (sorted.length > 0 && !selectedApplicant) {
      setSelectedApplicant(sorted[0]);
      if (sorted[0].explanation) {
        try {
          setShapValues(JSON.parse(sorted[0].explanation));
        } catch {
          setShapValues([]);
        }
      }
    }
  }, [applicants]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const uploadedFile = e.target.files[0];
      
      if (uploadedFile.size > 10 * 1024 * 1024) {
        setStatus('invalid');
        return;
      }

      setFile(uploadedFile);
      setStatus('uploaded');
      
      Papa.parse(uploadedFile, {
        header: true,
        complete: (results) => {
          const limitedApplicants = results.data.slice(0, 20).map((app, idx) => ({
            ...app,
            id: `applicant-${idx}`
          }));
          setApplicants(limitedApplicants);
          validateFile(results.meta.fields || []);
        },
        error: (error) => {
          setStatus('invalid');
        }
      });
    }
  };

  const validateFile = (columns: string[]) => {
    setStatus('validating');
    setTimeout(() => {
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      setStatus(missingColumns.length > 0 ? 'invalid' : 'valid');
    }, 1000);
  };

  const processFile = async () => {
    setStatus('scoring');
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = Math.min(prev + 10, 100);
        if (newProgress === 100) {
          clearInterval(interval);
          scoreApplicants();
        }
        return newProgress;
      });
    }, 300);
  };

  const scoreApplicants = async () => {
    try {
      const scoredApplicants = await Promise.all(
        applicants.map(async applicant => {
          const score = Math.random().toFixed(4);
          let risk_label: RiskLabel = 'Low';
          if (parseFloat(score) > 0.7) risk_label = 'High';
          else if (parseFloat(score) > 0.4) risk_label = 'Medium';

          const mockShapValues: ShapValues[] = [
            { feature: 'Income', value: (Math.random() * 0.3) },
            { feature: 'Credit History', value: -(Math.random() * 0.2) },
            { feature: 'Debt Ratio', value: -(Math.random() * 0.15) },
            { feature: 'Employment', value: (Math.random() * 0.1) },
            { feature: 'Age', value: (Math.random() * 0.05) }
          ].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));

          return { 
            ...applicant, 
            score, 
            risk_label, 
            explanation: JSON.stringify(mockShapValues) 
          };
        })
      );

      setApplicants(scoredApplicants);
      setStatus('complete');
    } catch (error) {
      console.error('Scoring failed:', error);
      setStatus('invalid');
    }
  };

  const selectApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    if (applicant.explanation) {
      try {
        setShapValues(JSON.parse(applicant.explanation));
      } catch {
        setShapValues([]);
      }
    }
  };
const shapChartData = {
    labels: shapValues.map(item => item.feature),
    datasets: [
      {
        label: 'Feature Impact',
        data: shapValues.map(item => item.value),
        backgroundColor: shapValues.map(item => 
          item.value > 0 ? 'rgba(74, 222, 128, 0.7)' : 'rgba(248, 113, 113, 0.7)'
        ),
        borderColor: shapValues.map(item => 
          item.value > 0 ? 'rgba(74, 222, 128, 1)' : 'rgba(248, 113, 113, 1)'
        ),
        borderWidth: 1,
        borderRadius: 4,
        barThickness: 24,
      }
    ]
  };

const shapChartOptions = {
  indexAxis: 'y',
  responsive: true,
  maintainAspectRatio: false,
  layout: {
    padding: {
      left: 100,    // Space for long labels
      right: 40,    // Space for value labels
      top: 10,
      bottom: 10
    }
  },
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (context) => `${context.raw > 0 ? '+' : ''}${context.raw.toFixed(3)}`
      }
    },
    datalabels: {
      anchor: 'end',
      align: (context) => context.raw > 0 ? 'end' : 'start',
      offset: (context) => context.raw > 0 ? -40 : 40,
      color: (context) => context.raw > 0 ? '#166534' : '#991b1b',
      font: {
        weight: 'bold',
        size: 10
      },
      formatter: (value) => `${value > 0 ? '+' : ''}${Math.abs(value).toFixed(3)}`,
      display: (context) => Math.abs(context.dataset.data[context.dataIndex]) > 0.01
    }
  },
  scales: {
    x: {
      min: -0.3,
      max: 0.3,
      grid: {
        color: 'rgba(0,0,0,0.05)',
        drawTicks: false,
        drawBorder: false
      },
      ticks: {
        callback: (value) => `${value > 0 ? '+' : ''}${value}`,
        stepSize: 0.1
      },
      position: 'top'
    },
    y: {
      grid: {
        display: false,
        drawBorder: false
      },
      ticks: {
        crossAlign: 'near',
        mirror: true,
        padding: -120,  // Pull labels into bars
        font: {
          size: 11
        },
        callback: (_, index) => shapValues[index].feature
      },
      afterFit: (scale) => {
        scale.width = 80;  // Squeeze axis width
      }
    }
  },
  elements: {
    bar: {
      categoryPercentage: 1.0,  // Use all available space
      barPercentage: 0.9,       // 90% of category width
      borderWidth: 0,
      borderRadius: 0           // Square edges for max space
    }
  }
};

// In your JSX render:
<div className="relative h-[300px]"> {/* Fixed height container */}
  <Bar 
    data={shapChartData} 
    options={shapChartOptions}
    plugins={[{
      id: 'compactBars',
      beforeDraw(chart) {
        // Draw subtle horizontal guides
        const ctx = chart.ctx;
        const yAxis = chart.scales.y;
        ctx.save();
        ctx.strokeStyle = 'rgba(0,0,0,0.05)';
        ctx.lineWidth = 1;
        
        yAxis.ticks.forEach((tick) => {
          const y = yAxis.getPixelForTick(tick.value);
          ctx.beginPath();
          ctx.moveTo(chart.scales.x.left, y);
          ctx.lineTo(chart.scales.x.right, y);
          ctx.stroke();
        });
        ctx.restore();
      }
    }]}
  />
</div>

  const downloadResults = () => {
    const csv = Papa.unparse(applicants);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zentro_scores_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Upload Card - Modern Glass Morphism Design */}
      <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/70 shadow-sm p-5 dark:bg-gray-800/70 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              ZENTRO Credit Scoring
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Upload applicant data for AI-powered risk assessment with explainability
            </p>
          </div>
        </div>

        {status === 'empty' ? (
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center transition-all hover:border-orange-400 dark:border-gray-600 dark:hover:border-orange-500">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-4 bg-orange-50 rounded-full dark:bg-orange-900/20">
                <FiUpload className="h-6 w-6 text-orange-500 dark:text-orange-400" />
              </div>
              <label className="cursor-pointer">
                <span className="inline-flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium rounded-lg transition-colors shadow-sm">
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
                CSV with required columns: age, income, loan_amount, credit_history, employment_length, debt_to_income
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-700/50 rounded-lg border border-gray-200/50 dark:border-gray-600/50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-orange-50 dark:bg-orange-900/20">
                  <FiUpload className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-800 dark:text-white/90">
                    {file?.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {applicants.length} records • {file && (file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Badge 
                color={
                  status === 'valid' ? 'success' : 
                  status === 'invalid' ? 'error' : 'orange'
                }
                className="px-3 py-1"
              >
                {status === 'uploaded' && 'UPLOADED'}
                {status === 'validating' && 'VALIDATING'}
                {status === 'valid' && 'VALID'}
                {status === 'invalid' && 'INVALID'}
              </Badge>
            </div>

            {status === 'valid' && (
              <button
                onClick={processFile}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium rounded-lg transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
              >
                <FiBarChart2 className="h-4 w-4" />
                Score Applicants
              </button>
            )}

            {(status === 'scoring' || status === 'complete') && (
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300">
                      {status === 'scoring' ? 'Processing records...' : 'Processing complete'}
                    </span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {progress}%
                    </span>
                  </div>
                  <ProgressBar 
                    value={progress} 
                    color={status === 'complete' ? 'success' : 'orange'}
                    className="h-2.5"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Results Section */}
      {status === 'complete' && (
        <div className="rounded-xl bg-white/80 backdrop-blur-sm border border-gray-200/70 shadow-sm p-5 dark:bg-gray-800/70 dark:border-gray-700 flex-1 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Scoring Results
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                {applicants.length} applicants analyzed • {new Date().toLocaleDateString()}
              </p>
            </div>
            <button 
              onClick={downloadResults}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md gap-2"
            >
              <FiDownload size={14} />
              <span>Download CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
            {/* Applicant List - Modern Card Design */}
            <div className="lg:col-span-1 flex flex-col">
              <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xs flex-1 flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200/50 dark:border-gray-700/50 bg-white/50 dark:bg-gray-800/50">
                  <h4 className="font-medium text-gray-800 dark:text-white/90">
                    Applicant Risk Scores
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Sorted by risk level (High → Low)
                  </p>
                </div>
                <div className="overflow-y-auto flex-1">
                  <table className="min-w-full divide-y divide-gray-200/50 dark:divide-gray-700/50">
                    <thead className="bg-gray-50/50 dark:bg-gray-800/50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Applicant
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Risk
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/50 dark:divide-gray-700/50 bg-white/30 dark:bg-gray-900/30">
                      {sortedApplicants.map((applicant) => (
                        <tr 
                          key={applicant.id}
                          className={`transition-colors ${selectedApplicant?.id === applicant.id ? 
                            'bg-orange-50/70 dark:bg-orange-900/20' : 
                            'hover:bg-gray-50/70 dark:hover:bg-gray-700/30'}`}
                          onClick={() => selectApplicant(applicant)}
                        >
                          <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                            {applicant.id?.replace('applicant-', 'Applicant #')}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200 font-mono">
                            {applicant.score}
                          </td>
                          <td className="px-4 py-3">
                            <Badge 
                              color={
                                applicant.risk_label === 'High' ? 'error' : 
                                applicant.risk_label === 'Medium' ? 'warning' : 'success'
                              }
                              className="min-w-[70px] justify-center py-1"
                              size="sm"
                            >
                              {applicant.risk_label}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Explanation Panel - Modern Card Design */}
<div className="lg:col-span-2 flex flex-col">
  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg border border-gray-200/50 dark:border-gray-700/50 shadow-xs flex-1 flex flex-col overflow-hidden">
    {selectedApplicant && (
      <div className="flex flex-col flex-1">
        {/* Score Summary Card - unchanged */}

        {/* SHAP Value Visualization - Enhanced */}
        <div className="p-5 flex-1 flex flex-col min-h-0">
          <div className="mb-4">
            <div className="flex justify-between items-center">
              <div>
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Feature Impact Analysis
                </h5>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  How each factor contributed to this applicant's risk score
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-green-500"></div>
                  <span>Lowers risk</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-red-500"></div>
                  <span>Increases risk</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Threshold information */}
          {shapValues.some(v => Math.abs(v.value) < 0.01) && (
            <div className="mb-3 text-xs text-gray-500 dark:text-gray-400 italic">
              Features with impact below ±0.01 are considered negligible and hidden for clarity
            </div>
          )}

          {/* Ultra-dense bar chart container */}
          <div className="relative h-[220px] mb-6">  {/* Fixed compact height */}
            <Bar 
              data={shapChartData}
              options={shapChartOptions}
              plugins={[
                {
                  id: 'barCompressor',
                  beforeDraw(chart) {
                    // Force compact spacing (20px per bar)
                    const yScale = chart.scales.y;
                    yScale.height = shapValues.length * 20;
                    yScale.update(chart.width, chart.height);
                    
                    // Draw subtle horizontal guides
                    const ctx = chart.ctx;
                    ctx.save();
                    ctx.strokeStyle = 'rgba(0,0,0,0.03)';
                    ctx.lineWidth = 1;
                    
                    yScale.ticks.forEach((tick) => {
                      const y = yScale.getPixelForValue(tick.value);
                      ctx.beginPath();
                      ctx.moveTo(chart.scales.x.left, y);
                      ctx.lineTo(chart.scales.x.right, y);
                      ctx.stroke();
                    });
                    ctx.restore();
                    
                    // Draw zero line
                    const zeroLineX = chart.scales.x.getPixelForValue(0);
                    ctx.beginPath();
                    ctx.moveTo(zeroLineX, chart.chartArea.top);
                    ctx.lineTo(zeroLineX, chart.chartArea.bottom);
                    ctx.lineWidth = 1;
                    ctx.strokeStyle = 'rgba(100, 116, 139, 0.5)';
                    ctx.setLineDash([3, 3]);
                    ctx.stroke();
                  }
                },
                ChartDataLabels
              ]}
            />
          </div>

          {/* Feature Impact Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {shapValues.map((item, index) => {
              const impactPercentage = (Math.abs(item.value) / 
                shapValues.reduce((sum, val) => sum + Math.abs(val.value), 0)) * 100;
              
              return (
                <div 
                  key={index} 
                  className={`p-4 rounded-lg border shadow-xs transition-all ${
                    Math.abs(item.value) < 0.01 ? 
                      'opacity-70 border-gray-200/30 dark:border-gray-700/30' : 
                      item.value > 0 ? 
                        'border-red-200/50 dark:border-red-900/50' : 
                        'border-green-200/50 dark:border-green-900/50'
                  }`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {item.feature}
                      {Math.abs(item.value) < 0.01 && (
                        <span className="ml-2 text-xs text-gray-400 italic">(negligible)</span>
                      )}
                    </span>
                    <span className={`text-sm font-medium ${
                      item.value > 0 ? 
                        'text-red-600 dark:text-red-400' : 
                        'text-green-600 dark:text-green-400'
                    }`}>
                      {item.value > 0 ? '+' : ''}{item.value.toFixed(3)}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-gray-200/70 dark:bg-gray-700/50 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          item.value > 0 ? 'bg-red-500' : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${Math.min(100, impactPercentage)}%`,
                          marginLeft: item.value > 0 ? '0' : 'auto'
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {impactPercentage.toFixed(1)}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    This factor {item.value > 0 ? 'increased' : 'decreased'} the risk score by{' '}
                    {Math.abs(item.value).toFixed(3)} points
                    {Math.abs(item.value) < 0.01 && ' (minimal impact)'}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    )}
  </div>
</div>
          </div>
        </div>
      )}
    </div>
  );
}