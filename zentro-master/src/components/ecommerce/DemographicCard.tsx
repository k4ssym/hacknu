import React, { useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { 
  FiMoreVertical, 
  FiInfo, 
  FiDownload, 
  FiFileText, 
  FiTrendingUp, 
  FiAlertTriangle, 
  FiCheckCircle,
  FiBarChart2,
  FiTarget,
  FiShield,
  FiActivity,

  FiHome,
  FiBook,
  FiBriefcase,
  FiDollarSign,
  FiClock,
  FiThumbsUp,
  FiUser,
  FiPieChart,
  FiAward
} from "react-icons/fi";
import { saveAs } from 'file-saver';
import { useTheme } from "../../context/ThemeContext";
import Badge from "../ui/badge/Badge";

// ProgressBar component for loading states
type ProgressBarProps = {
  value: number;
  color?: 'blue' | 'green' | 'red';
  className?: string;
  barClassName?: string;
};

const ProgressBar = ({ 
  value, 
  color = 'blue', 
  className = '', 
  barClassName = '' 
}: ProgressBarProps) => {
  const width = Math.min(100, Math.max(0, value));
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full h-2 bg-gray-200 rounded-full overflow-hidden dark:bg-gray-700 ${className}`}>
      <div
        className={`h-full transition-all duration-300 ${colorClasses[color]} ${barClassName}`}
        style={{ width: `${width}%` }}
        role="progressbar"
        aria-valuenow={width}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
};

export default function GoalRiskDistributionChart() {
  const { isDarkMode } = useTheme();
  const [activeGoal, setActiveGoal] = useState<'car' | 'home' | 'education' | 'business'>('car');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hoveredData, setHoveredData] = useState<{category: string, high: number, medium: number, low: number} | null>(null);

  // Enhanced user-focused data with relatable scenarios
  const goalData = {
    car: {
      series: [
        { name: "Needs Work", data: [22, 25, 28, 24, 20, 23, 26, 24, 21, 19, 22, 25] },
        { name: "Almost There", data: [38, 35, 32, 36, 38, 35, 33, 34, 36, 38, 35, 33] },
        { name: "Ready to Go", data: [40, 40, 40, 40, 42, 42, 41, 42, 43, 43, 43, 42] }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      advice: {
        high: "Let's boost your savings by 20% for a better down payment. Consider waiting 3-6 months to improve your credit score for lower rates.",
        medium: "You're close! Paying off one credit card could move you to the best rate category. Consider a slightly used car for better value.",
        low: "Perfect! You're in great shape for auto financing. You'll likely qualify for the lowest rates - time to start test driving!"
      },
      factors: {
        high: ["Down payment under 10%", "Credit score needs improvement", "Recent credit applications"],
        medium: ["10-15% down payment ready", "Good credit score", "Stable job history"],
        low: ["20%+ down payment saved", "Excellent credit score", "Low debt-to-income ratio"]
      },
      metrics: {
        approvalRate: "78%",
        avgInterest: "6.2%",
        processingTime: "2-4 days"
      },
      icon: FiCar,
      color: "blue"
    },
    home: {
      series: [
        { name: "Needs Work", data: [15, 18, 20, 16, 14, 17, 19, 18, 15, 13, 16, 18] },
        { name: "Almost There", data: [32, 35, 30, 34, 36, 34, 32, 33, 35, 36, 34, 32] },
        { name: "Ready to Go", data: [53, 47, 50, 50, 50, 49, 49, 49, 50, 51, 50, 50] }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      advice: {
        high: "Focus on building 6+ months of mortgage payments in savings. Consider first-time home buyer programs that require lower down payments.",
        medium: "Great progress! A slightly smaller home or different neighborhood could make homeownership more affordable right now.",
        low: "Excellent! You're ready for homeownership. Get pre-approved and start visiting open houses - you're in a strong position!"
      },
      factors: {
        high: ["Down payment under 10%", "Credit score below 680", "High monthly debt"],
        medium: ["15-20% down payment", "Good credit score (680-740)", "Moderate debt levels"],
        low: ["20%+ down payment", "Excellent credit (740+)", "Comfortable debt-to-income"]
      },
      metrics: {
        approvalRate: "65%",
        avgInterest: "5.8%",
        processingTime: "30-45 days"
      },
      icon: FiHome,
      color: "purple"
    },
    education: {
      series: [
        { name: "Needs Work", data: [12, 14, 16, 13, 11, 13, 15, 14, 12, 10, 13, 15] },
        { name: "Almost There", data: [28, 30, 27, 29, 31, 29, 28, 29, 30, 31, 29, 28] },
        { name: "Ready to Go", data: [60, 56, 57, 58, 58, 58, 57, 57, 58, 59, 58, 57] }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      advice: {
        high: "Explore scholarships and grants first. Starting at community college can significantly reduce costs while building credits.",
        medium: "Good options available! A co-signer could help secure better rates. Compare federal vs private loan benefits carefully.",
        low: "Outstanding! You qualify for the best education financing options. Focus on programs with strong career outcomes and ROI."
      },
      factors: {
        high: ["Limited savings for costs", "No co-signer available", "Uncertain career path"],
        medium: ["Some savings available", "Good co-signer options", "Clear study plans"],
        low: ["Substantial savings", "Strong co-signer available", "High-demand career choice"]
      },
      metrics: {
        approvalRate: "82%",
        avgInterest: "4.5%",
        processingTime: "1-2 weeks"
      },
      icon: FiBook,
      color: "green"
    },
    business: {
      series: [
        { name: "Needs Work", data: [35, 38, 40, 36, 33, 37, 39, 38, 34, 32, 36, 38] },
        { name: "Almost There", data: [42, 40, 38, 41, 43, 40, 39, 40, 42, 43, 41, 40] },
        { name: "Ready to Go", data: [23, 22, 22, 23, 24, 23, 22, 22, 24, 25, 23, 22] }
      ],
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      advice: {
        high: "Develop a detailed business plan first. Consider starting smaller or finding a business partner to share initial costs and risks.",
        medium: "Promising start! SBA loans could be a great option. Focus on building 6+ months of operating capital.",
        low: "Excellent foundation! Your strong preparation makes you an ideal candidate for business financing. Time to scale up!"
      },
      factors: {
        high: ["New business idea", "Limited industry experience", "Small initial investment"],
        medium: ["1-2 years experience", "Growing customer base", "Moderate personal investment"],
        low: ["Proven business model", "Industry expertise", "Significant personal investment"]
      },
      metrics: {
        approvalRate: "58%",
        avgInterest: "7.5%",
        processingTime: "45-60 days"
      },
      icon: FiBriefcase,
      color: "amber"
    }
  };

  const [series, setSeries] = useState(goalData.car.series);
  const [categories, setCategories] = useState(goalData.car.categories);

  const handleGoalChange = async (goal: 'car' | 'home' | 'education' | 'business') => {
    setIsLoading(true);
    setProgress(0);
    
    // Simulate loading with progress
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + Math.random() * 25;
        if (newProgress >= 100) {
          clearInterval(interval);
          setActiveGoal(goal);
          setSeries(goalData[goal].series);
          setCategories(goalData[goal].categories);
          setIsLoading(false);
          setProgress(0);
          return 100;
        }
        return newProgress;
      });
    }, 150);
  };

  const exportData = () => {
    const csvContent = [
      ['Period', 'Needs Work (%)', 'Almost There (%)', 'Ready to Go (%)'],
      ...categories.map((category, i) => [
        category,
        series[0].data[i],
        series[1].data[i],
        series[2].data[i]
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `my-financial-readiness-${activeGoal}.csv`);
  };

  const generateReport = () => {
    setIsLoading(true);
    setTimeout(() => {
      alert(`Creating your personalized ${activeGoal} financing readiness report...`);
      setIsLoading(false);
    }, 1500);
  };

  const getGoalTitle = (goal: string) => {
    const titles = {
      car: "Car Financing",
      home: "Home Purchase", 
      education: "Education Funding",
      business: "Business Funding"
    };
    return titles[goal as keyof typeof titles];
  };

  const getGoalColor = (goal: string) => {
    const colors = {
      car: "bg-blue-500",
      home: "bg-purple-500",
      education: "bg-green-500",
      business: "bg-amber-500"
    };
    return colors[goal as keyof typeof colors];
  };

  const getGoalGradient = (goal: string) => {
    const gradients = {
      car: "from-blue-50 to-cyan-50 border-blue-200 dark:from-blue-900/20 dark:to-cyan-900/20 dark:border-blue-800",
      home: "from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800",
      education: "from-green-50 to-emerald-50 border-green-200 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-800",
      business: "from-amber-50 to-orange-50 border-amber-200 dark:from-amber-900/20 dark:to-orange-900/20 dark:border-amber-800"
    };
    return gradients[goal as keyof typeof gradients];
  };

  // Enhanced chart options with better design
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 340,
      stacked: true,
      toolbar: { show: false },
      fontFamily: "Inter, system-ui, sans-serif",
      background: 'transparent',
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: { enabled: true, delay: 150 },
        dynamicAnimation: { enabled: true, speed: 350 }
      },
      events: {
        dataPointMouseEnter: function(event, chartContext, { seriesIndex, dataPointIndex }) {
          if (dataPointIndex >= 0) {
            setHoveredData({
              category: categories[dataPointIndex],
              high: series[0].data[dataPointIndex],
              medium: series[1].data[dataPointIndex],
              low: series[2].data[dataPointIndex]
            });
          }
        },
        dataPointMouseLeave: function() {
          setHoveredData(null);
        }
      }
    },
    colors: ["#ef4444", "#f59e0b", "#10b981"], // Red, Amber, Green
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#6b7280",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: '13px',
          fontWeight: 500,
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? "#9ca3af" : "#6b7280",
          fontFamily: "Inter, system-ui, sans-serif",
          fontSize: '12px',
          fontWeight: 500,
        },
        formatter: (value) => `${value}%`
      },
      max: 100
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "75%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { 
      enabled: false 
    },
    stroke: {
      show: true,
      width: 1,
      colors: [isDarkMode ? "#1f2937" : "#ffffff"],
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "13px",
      fontWeight: 600,
      labels: {
        colors: isDarkMode ? "#e5e7eb" : "#374151",
        useSeriesColors: false,
      },
      markers: {
        radius: 6,
        offsetX: -5,
        offsetY: 1,
        width: 12,
        height: 12,
      }
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#e5e7eb",
      strokeDashArray: 3,
      yaxis: {
        lines: { show: true },
      },
      xaxis: {
        lines: { show: false }
      },
      padding: {
        top: 0,
        right: 0,
        bottom: 0,
        left: 10
      }
    },
    fill: { 
      opacity: 1,
      gradient: {
        shade: 'light',
        type: "vertical",
        shadeIntensity: 0.3,
        gradientToColors: undefined,
        inverseColors: false,
        opacityFrom: 1,
        opacityTo: 0.9,
        stops: [0, 90, 100]
      }
    },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      style: {
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: '13px'
      },
      y: {
        formatter: (value) => `${value}% of people are in this category`
      }
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const toggleDropdown = () => setIsOpen(!isOpen);
  const closeDropdown = () => setIsOpen(false);

  // Calculate averages for the summary
  const highRiskAvg = (series[0].data.reduce((a, b) => a + b, 0) / series[0].data.length).toFixed(1);
  const mediumRiskAvg = (series[1].data.reduce((a, b) => a + b, 0) / series[1].data.length).toFixed(1);
  const lowRiskAvg = (series[2].data.reduce((a, b) => a + b, 0) / series[2].data.length).toFixed(1);

  const GoalIcon = goalData[activeGoal].icon;

  return (
    <div className="space-y-6">
      {/* Main Financial Readiness Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm hover:shadow-md transition-shadow duration-300">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <FiPieChart className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white/90">
                My Financial Readiness
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                See how prepared you are for your financial goals
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge color="blue" className="flex items-center gap-1.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
              <FiUser className="w-3 h-3" />
              Personal View
            </Badge>
            
            <div className="relative inline-block">
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                onClick={toggleDropdown}
              >
                <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
              </button>
              <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-48 p-2 shadow-lg">
                <DropdownItem 
                  onItemClick={() => {
                    generateReport();
                    closeDropdown();
                  }}
                  className="flex items-center w-full font-medium text-left text-gray-700 rounded-lg px-3 py-2.5 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                >
                  <FiFileText className="mr-3 text-gray-400" />
                  Get My Report
                </DropdownItem>
                <DropdownItem 
                  onItemClick={() => {
                    exportData();
                    closeDropdown();
                  }}
                  className="flex items-center w-full font-medium text-left text-gray-700 rounded-lg px-3 py-2.5 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white transition-colors"
                >
                  <FiDownload className="mr-3 text-gray-400" />
                  Export My Data
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* Goal Selection */}
        <div className="mb-8">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
            <FiTarget className="text-blue-500" />
            Choose Your Goal
          </h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(['car', 'home', 'education', 'business'] as const).map((goal) => {
              const Icon = goalData[goal].icon;
              const isActive = activeGoal === goal;
              return (
                <button
                  key={goal}
                  onClick={() => handleGoalChange(goal)}
                  className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm' 
                      : 'border-gray-200 bg-gray-50 hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800/50 dark:hover:border-gray-600'
                  }`}
                >
                  <div className={`p-3 rounded-lg ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className={`font-semibold text-sm ${
                    isActive ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {getGoalTitle(goal)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="mb-6 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-300">Updating your readiness analysis...</span>
              <span className="font-semibold">{progress.toFixed(0)}%</span>
            </div>
            <ProgressBar value={progress} color="blue" />
          </div>
        )}

        {/* Chart Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
              <GoalIcon className="text-blue-500" />
              {getGoalTitle(activeGoal)} Readiness
            </h4>
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <FiInfo className="w-4 h-4" />
              Compared to similar profiles
            </div>
          </div>

          {/* Hover Details */}
          {hoveredData && !isLoading && (
            <div className={`mb-4 p-4 rounded-xl bg-gradient-to-r ${getGoalGradient(activeGoal)}`}>
              <div className="flex items-center gap-2 mb-3">
                <FiTrendingUp className="text-blue-600 dark:text-blue-400 text-lg" />
                <span className="font-semibold text-gray-900 dark:text-white/90">
                  {hoveredData.category} Overview
                </span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 bg-white/80 rounded-lg border border-red-200 dark:bg-gray-800/80 dark:border-red-800">
                  <div className="font-bold text-red-600 dark:text-red-400 text-lg">{hoveredData.high}%</div>
                  <div className="text-red-500 dark:text-red-400 text-xs font-medium">Needs Work</div>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg border border-amber-200 dark:bg-gray-800/80 dark:border-amber-800">
                  <div className="font-bold text-amber-600 dark:text-amber-400 text-lg">{hoveredData.medium}%</div>
                  <div className="text-amber-500 dark:text-amber-400 text-xs font-medium">Almost There</div>
                </div>
                <div className="text-center p-3 bg-white/80 rounded-lg border border-green-200 dark:bg-gray-800/80 dark:border-green-800">
                  <div className="font-bold text-green-600 dark:text-green-400 text-lg">{hoveredData.low}%</div>
                  <div className="text-green-500 dark:text-green-400 text-xs font-medium">Ready to Go</div>
                </div>
              </div>
            </div>
          )}

          {/* Chart Visualization */}
          <div className="max-w-full overflow-x-auto custom-scrollbar">
            <div className="min-w-[650px] xl:min-w-full">
              <Chart 
                options={options} 
                series={series} 
                type="bar" 
                height={340} 
              />
            </div>
          </div>
        </div>
        
        {/* Readiness Summary & Guidance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Readiness Scorecards */}
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 dark:text-white/90 flex items-center gap-2">
              <FiAward className="text-blue-500" />
              Your Readiness Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-xl border border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <div className="flex items-center justify-center mb-2">
                  <FiAlertTriangle className="w-4 h-4 text-red-500 dark:text-red-400 mr-2" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-300">Needs Work</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-red-600 dark:text-red-400">{highRiskAvg}%</span>
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">Room to improve</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="flex items-center justify-center mb-2">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">Almost There</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{mediumRiskAvg}%</span>
                  <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Making progress</p>
                </div>
              </div>
              <div className="p-4 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
                <div className="flex items-center justify-center mb-2">
                  <FiCheckCircle className="w-4 h-4 text-green-500 dark:text-green-400 mr-2" />
                  <span className="text-sm font-semibold text-green-700 dark:text-green-300">Ready to Go</span>
                </div>
                <div className="text-center">
                  <span className="text-2xl font-bold text-green-600 dark:text-green-400">{lowRiskAvg}%</span>
                  <p className="text-xs text-green-500 dark:text-green-400 mt-1">Well prepared</p>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <h5 className="font-semibold text-gray-900 dark:text-white/90 mb-3 flex items-center gap-2">
                <FiTrendingUp className="text-blue-500" />
                Market Overview
              </h5>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white/90">{goalData[activeGoal].metrics.approvalRate}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Approval Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white/90">{goalData[activeGoal].metrics.avgInterest}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Avg Rate</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900 dark:text-white/90">{goalData[activeGoal].metrics.processingTime}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Typical Timeline</div>
                </div>
              </div>
            </div>
          </div>

          {/* Personalized Guidance */}
          <div className={`p-5 rounded-xl bg-gradient-to-br ${getGoalGradient(activeGoal)}`}>
            <h4 className="font-semibold text-gray-900 dark:text-white/90 mb-4 flex items-center gap-2">
              <FiShield className="text-blue-500" />
              Your Action Plan
            </h4>
            <div className="space-y-4">
              <div className="p-3 rounded-lg bg-white/80 border border-red-200 dark:bg-gray-800/80 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <FiAlertTriangle className="w-5 h-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-red-700 dark:text-red-300 text-sm">If You Need Work</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{goalData[activeGoal].advice.high}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-amber-200 dark:bg-gray-800/80 dark:border-amber-800">
                <div className="flex items-start gap-3">
                  <div className="w-4 h-4 rounded-full bg-amber-500 mt-0.5 flex-shrink-0"></div>
                  <div>
                    <span className="font-semibold text-amber-700 dark:text-amber-300 text-sm">If You're Almost There</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{goalData[activeGoal].advice.medium}</p>
                  </div>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-white/80 border border-green-200 dark:bg-gray-800/80 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <FiCheckCircle className="w-5 h-5 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-green-700 dark:text-green-300 text-sm">If You're Ready to Go</span>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1.5">{goalData[activeGoal].advice.low}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Success Factors Card */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-white/[0.03] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <FiThumbsUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white/90">
              What Drives Success
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Key factors that help people achieve their {getGoalTitle(activeGoal).toLowerCase()} goals
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(goalData[activeGoal].factors).map(([readinessLevel, factors]) => (
            <div key={readinessLevel} className={`p-4 rounded-xl border ${
              readinessLevel === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20' :
              readinessLevel === 'medium' ? 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20' :
              'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
            }`}>
              <h4 className={`font-semibold text-sm mb-3 ${
                readinessLevel === 'high' ? 'text-red-700 dark:text-red-300' :
                readinessLevel === 'medium' ? 'text-amber-700 dark:text-amber-300' :
                'text-green-700 dark:text-green-300'
              }`}>
                {readinessLevel === 'high' ? 'Needs Work' : readinessLevel === 'medium' ? 'Almost There' : 'Ready to Go'}
              </h4>
              <ul className="space-y-2.5 text-sm">
                {factors.map((factor, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      readinessLevel === 'high' ? 'bg-red-500' :
                      readinessLevel === 'medium' ? 'bg-amber-500' :
                      'bg-green-500'
                    }`}></div>
                    <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{factor}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}