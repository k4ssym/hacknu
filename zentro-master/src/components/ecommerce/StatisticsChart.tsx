// StatisticsChart.tsx
import { useState, useEffect } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

export default function StatisticsChart() {
  // 1. Стейт для выбранного периода
  const [selectedPeriod, setSelectedPeriod] = useState<
    "month" | "quarter" | "annual"
  >("month");

  // 2. Стейт для данных и состояния загрузки
  const [monthCategories, setMonthCategories] = useState<string[]>([]);
  const [monthSeries, setMonthSeries] = useState<
    { name: string; data: number[] }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(true);

  // 3. Fetch при монтировании
  useEffect(() => {
    fetch("http://localhost:4000/api/sales")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Ошибка при получении salesData: ${res.status}`);
        }
        return res.json();
      })
      .then(
        (payload: {
          categories: string[];
          series: { name: string; data: number[] }[];
        }) => {
          setMonthCategories(payload.categories);
          setMonthSeries(payload.series);
        }
      )
      .catch((err) => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 4. Функции для квартальных и годовых расчётов
  const computeQuarterSeries = (
    seriesData: { name: string; data: number[] }[]
  ): { name: string; data: number[] }[] => {
    if (!seriesData.length || seriesData[0].data.length < 12) {
      return [];
    }
    return seriesData.map((serie) => {
      const d = serie.data;
      return {
        name: serie.name,
        data: [
          d[0] + d[1] + d[2], // Q1
          d[3] + d[4] + d[5], // Q2
          d[6] + d[7] + d[8], // Q3
          d[9] + d[10] + d[11], // Q4
        ],
      };
    });
  };

  const computeAnnualSeries = (
    seriesData: { name: string; data: number[] }[]
  ): { name: string; data: number[] }[] => {
    if (!seriesData.length || seriesData[0].data.length < 12) {
      return [];
    }
    return seriesData.map((serie) => {
      const total = serie.data.reduce((sum, val) => sum + val, 0);
      // Добавляем второй год (предыдущий) с нулевым значением,
      // а текущий год — с реальным total
      return {
        name: serie.name,
        data: [0, total],
      };
    });
  };

  // 5. Подготовка категорий и серий для графика
  let categories: string[] = [];
  let chartSeries: { name: string; data: number[] }[] = [];

  if (selectedPeriod === "month") {
    categories = monthCategories;
    chartSeries = monthSeries;
  } else if (selectedPeriod === "quarter") {
    categories = ["Q1", "Q2", "Q3", "Q4"];
    chartSeries = computeQuarterSeries(monthSeries);
  } else {
    const currentYear = new Date().getFullYear();
    const prevYear = currentYear - 1;
    categories = [prevYear.toString(), currentYear.toString()];
    chartSeries = computeAnnualSeries(monthSeries);
  }

  // 6. Опции ApexCharts
  const options: ApexOptions = {
    legend: {
      show: false,
      position: "top",
      horizontalAlign: "left",
    },
    colors: ["#428032"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      height: 240,
      type: "area",
      toolbar: {
        show: false,
      },
    },
    stroke: {
      curve: "straight",
      width: [2],
    },
    fill: {
      type: "gradient",
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    markers: {
      size: 0,
      strokeColors: "#ffffff",
      strokeWidth: 2,
      hover: {
        size: 6,
      },
    },
    grid: {
      xaxis: { lines: { show: false } },
      yaxis: { lines: { show: true } },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: "12px",
        fontFamily: "Outfit, sans-serif",
      },
      marker: {
        show: false,
      },
      x: {
        format: selectedPeriod === "month" ? "dd MMM yyyy" : undefined,
      },
    },
    xaxis: {
      type: "category",
      categories: categories,
      axisBorder: { show: false },
      axisTicks: { show: false },
      tooltip: { enabled: false },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: "12px",
          colors: ["#6a717b"],
        },
      },
      title: {
        text: "",
        style: { fontSize: "0px" },
      },
    },
  };

  if (loading) {
    return (
      <div className="rounded-2xl border border-[#b9bec5] bg-white px-5 pb-5 pt-5 dark:border-[#808897] dark:bg-white/[0.03] sm:px-6 sm:pt-6">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          {/* Анимация загрузки: вращающийся спиннер */}
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-300"></div>
          {/* Подсказка о состоянии */}
          <p className="text-[#6a717b] text-sm">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#b9bec5] bg-white px-5 pb-5 pt-5 dark:border-[#808897] dark:bg-white/[0.03] sm:px-6 sm:pt-6">
      {/* Заголовок и описание */}
      <div className="flex flex-col gap-5 mb-6 sm:flex-row sm:justify-between">
        <div className="w-full">
          <h3 className="text-lg font-semibold text-[#51565e] dark:text-white/90">
            Statistics
          </h3>
          <p className="mt-1 text-[#6a717b] text-theme-sm dark:text-[#808897]">
            {selectedPeriod === "month"
              ? "Your monthly sales data"
              : selectedPeriod === "quarter"
              ? "Your quarterly sales data"
              : "Your annual sales total"}
          </p>
        </div>

        {/* Переключатели периодов */}
        <div className="flex items-center gap-3 sm:justify-end">
          <button
            onClick={() => setSelectedPeriod("month")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${
                selectedPeriod === "month"
                  ? "bg-[#629731] text-white"
                  : "bg-[#b9bec5] text-[#51565e] hover:bg-[#9dbf7c]"
              }
            `}
          >
            Monthly
          </button>

          <button
            onClick={() => setSelectedPeriod("quarter")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${
                selectedPeriod === "quarter"
                  ? "bg-[#629731] text-white"
                  : "bg-[#b9bec5] text-[#51565e] hover:bg-[#9dbf7c]"
              }
            `}
          >
            Quarterly
          </button>

          <button
            onClick={() => setSelectedPeriod("annual")}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium
              ${
                selectedPeriod === "annual"
                  ? "bg-[#629731] text-white"
                  : "bg-[#b9bec5] text-[#51565e] hover:bg-[#9dbf7c]"
              }
            `}
          >
            Annual
          </button>
        </div>
      </div>

      {/* Сам график */}
      <div className="max-w-full overflow-x-auto custom-scrollbar">
        <div className="min-w-[1000px] xl:min-w-full">
          <Chart
            options={options}
            series={chartSeries}
            type="area"
            height={310}
          />
        </div>
      </div>
    </div>
  );
}
