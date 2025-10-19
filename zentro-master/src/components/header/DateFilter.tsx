import { useState } from "react";

type TimeRange = "day" | "week" | "month" | "year";

export const DateFilter = () => {
  const [selectedRange, setSelectedRange] = useState<TimeRange>("day");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const getDisplayDate = () => {
    const date = new Date();
    const options: Intl.DateTimeFormatOptions = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric'
    };
    
    switch (selectedRange) {
      case "day":   date.setDate(date.getDate() - 1); break;
      case "week":  date.setDate(date.getDate() - 7); break;
      case "month": date.setMonth(date.getMonth() - 1); break;
      case "year":  date.setFullYear(date.getFullYear() - 1); break;
    }
    
    return date.toLocaleDateString('ru-RU', options);
  };

  const ranges: TimeRange[] = ["day", "week", "month", "year"];

  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full">
      {/* Date Filter */}
      <div className="relative flex-1 min-w-0">
        {/* Desktop Version */}
        <div className="hidden lg:flex items-center h-11 rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 shadow-theme-xs w-full min-w-[400px]">
          <div className="flex items-center h-full px-4 min-w-[120px] border-r border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 whitespace-nowrap">
              {getDisplayDate()}
            </span>
          </div>
          
          <div className="flex-1 flex justify-between px-2">
            {ranges.map((range) => (
              <button
                key={range}
                onClick={() => setSelectedRange(range)}
                className={`px-3 py-1 text-xs rounded-md transition-all whitespace-nowrap mx-1 ${
                  selectedRange === range
                    ? "bg-brand-500 text-white shadow-sm dark:bg-brand-500"
                    : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                }`}
              >
                {range === "day" && "Day"}
                {range === "week" && "Week"}
                {range === "month" && "Month"}
                {range === "year" && "Year"}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Version */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center h-11 w-full rounded-lg border border-gray-200 bg-white px-4 dark:border-gray-700 dark:bg-gray-800 shadow-theme-xs"
          >
            <svg className="w-5 h-5 mr-2 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-sm font-medium text-gray-800 dark:text-white/90 flex-1 text-left">
              {getDisplayDate()}
            </span>
            <svg className={`w-4 h-4 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {isDropdownOpen && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-700">
              {ranges.map((range) => (
                <button
                  key={range}
                  onClick={() => {
                    setSelectedRange(range);
                    setIsDropdownOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-2.5 text-sm ${
                    selectedRange === range
                      ? "bg-brand-500 text-white shadow-sm dark:bg-brand-500"
                      : "text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
                  }`}
                >
                  <span>
                    {range === "day" && "Day"}
                    {range === "week" && "Week"} 
                    {range === "month" && "Month"}
                    {range === "year" && "Year"}
                  </span>
                  {selectedRange === range && (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
