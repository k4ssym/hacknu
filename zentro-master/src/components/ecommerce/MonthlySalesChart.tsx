import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { FiMoreVertical, FiInfo, FiDownload, FiFileText } from "react-icons/fi";
import { useState } from "react";
import { saveAs } from 'file-saver';
import { useTheme } from "../../context/ThemeContext";

export default function RiskDistributionChart() {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState<'monthly' | 'quarterly'>('monthly');

  // Mock data with more realistic risk distribution
  const monthlySeries = [
    { name: "High Risk", data: [18, 22, 25, 19, 16, 21, 23, 20, 17, 15, 19, 22] },
    { name: "Medium Risk", data: [35, 38, 32, 40, 37, 35, 33, 36, 38, 40, 37, 35] },
    { name: "Low Risk", data: [47, 40, 43, 41, 47, 44, 44, 44, 45, 45, 44, 43] }
  ];

  const quarterlySeries = [
    { name: "High Risk", data: [21, 19, 18] },
    { name: "Medium Risk", data: [36, 37, 35] },
    { name: "Low Risk", data: [43, 44, 47] }
  ];

  const monthlyCategories = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const quarterlyCategories = ['Q1', 'Q2', 'Q3'];

  const [series, setSeries] = useState(monthlySeries);
  const [categories, setCategories] = useState(monthlyCategories);

  const handleTabChange = (tab: 'monthly' | 'quarterly') => {
    setActiveTab(tab);
    if (tab === 'monthly') {
      setSeries(monthlySeries);
      setCategories(monthlyCategories);
    } else {
      setSeries(quarterlySeries);
      setCategories(quarterlyCategories);
    }
  };

  const exportData = () => {
    const csvContent = [
      ['Period', 'High Risk (%)', 'Medium Risk (%)', 'Low Risk (%)'],
      ...categories.map((category, i) => [
        category,
        series[0].data[i],
        series[1].data[i],
        series[2].data[i]
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, `risk-distribution-${activeTab}.csv`);
  };

  const generateReport = () => {
    // In a real app, this would generate a PDF report
    alert(`Generating ${activeTab} risk distribution report...`);
    // This would typically call a backend service to generate a PDF
  };

  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 280,
      stacked: true,
      toolbar: { show: false },
      fontFamily: "Outfit, sans-serif",
      background: 'transparent',
    },
    colors: ["#ff671b", "#f38b00", "#8db92e"],
    xaxis: {
      categories: categories,
      labels: {
        style: {
          colors: isDarkMode ? "#e3dfd7" : "#141413",
          fontFamily: "Outfit, sans-serif",
          fontSize: '12px'
        },
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: {
          colors: isDarkMode ? "#e3dfd7" : "#74726e",
          fontFamily: "Outfit, sans-serif",
        },
        formatter: (value) => `${value}%`
      },
      max: 100
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "70%",
        borderRadius: 6,
        borderRadiusApplication: "end",
      },
    },
    dataLabels: { enabled: false },
    stroke: {
      show: true,
      width: 1,
      colors: [isDarkMode ? "#2d3748" : "#ffffff"],
    },
    legend: {
      position: "top",
      horizontalAlign: "right",
      fontFamily: "Outfit",
      labels: {
        colors: isDarkMode ? "#e3dfd7" : "#141413",
      },
      markers: {
        radius: 4,
        offsetX: -4
      }
    },
    grid: {
      borderColor: isDarkMode ? "#374151" : "#e3dfd7",
      strokeDashArray: 4,
      yaxis: {
        lines: { show: true },
      },
      xaxis: {
        lines: { show: false }
      }
    },
    fill: { opacity: 1 },
    tooltip: {
      theme: isDarkMode ? "dark" : "light",
      y: {
        formatter: (value) => `${value}%`
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

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Risk Distribution
            </h3>
            <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FiInfo className="mr-1.5" /> Monthly applicant risk categorization
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 dark:bg-gray-800">
              <button
                onClick={() => handleTabChange('monthly')}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'monthly' ? 'bg-white text-orange-500 shadow-sm dark:bg-gray-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => handleTabChange('quarterly')}
                className={`px-3 py-1 text-sm rounded-md ${activeTab === 'quarterly' ? 'bg-white text-orange-500 shadow-sm dark:bg-gray-700 dark:text-orange-400' : 'text-gray-600 dark:text-gray-300'}`}
              >
                Quarterly
              </button>
            </div>
            
            <div className="relative inline-block">
              <button 
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={toggleDropdown}
              >
                <FiMoreVertical className="text-gray-500 dark:text-gray-400" />
              </button>
              <Dropdown isOpen={isOpen} onClose={closeDropdown} className="w-48 p-2">
                <DropdownItem 
                  onItemClick={() => {
                    generateReport();
                    closeDropdown();
                  }}
                  className="flex items-center w-full font-medium text-left text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <FiFileText className="mr-2" />
                  View Report
                </DropdownItem>
                <DropdownItem 
                  onItemClick={() => {
                    exportData();
                    closeDropdown();
                  }}
                  className="flex items-center w-full font-medium text-left text-gray-700 rounded-lg px-3 py-2 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
                >
                  <FiDownload className="mr-2" />
                  Export Data
                </DropdownItem>
              </Dropdown>
            </div>
          </div>
        </div>

        <div className="mt-6 max-w-full overflow-x-auto custom-scrollbar">
          <div className="-ml-5 min-w-[650px] xl:min-w-full pl-2">
            <Chart 
              options={options} 
              series={series} 
              type="bar" 
              height={280} 
            />
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-[#ff671b] mr-2"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">High Risk</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{highRiskAvg}%</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Above threshold</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-[#f38b00] mr-2"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Medium Risk</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{mediumRiskAvg}%</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Requires review</p>
            </div>
          </div>
          <div className="p-3 rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-[#8db92e] mr-2"></div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Low Risk</span>
            </div>
            <div className="text-center">
              <span className="text-2xl font-bold">{lowRiskAvg}%</span>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Approval recommended</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}