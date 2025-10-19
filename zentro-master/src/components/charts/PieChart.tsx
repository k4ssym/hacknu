import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Plugin,
} from 'chart.js';
import { Pie } from 'react-chartjs-2';

// Регистрируем необходимые элементы
ChartJS.register(ArcElement, Tooltip, Legend);

// Плагин для рисования центрального текста (сумма всех секторов)
const centerTextPlugin: Plugin<'pie'> = {
  id: 'centerText',
  beforeDraw: (chart) => {
    const ctx = chart.ctx;
    const { width, height } = chart;
    ctx.save();

    // Вычисляем сумму
    const dataset = chart.data.datasets[0];
    const total = dataset.data.reduce((sum, val) => sum + Number(val), 0);
    const text = total.toLocaleString();

    // Параметры шрифта
    const fontSize = (height / 114).toFixed(2);
    ctx.font = `${fontSize}em sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.fillStyle = chart.options.plugins?.legend?.labels?.color || '#374151';

    // Выравниваем по центру
    const textMetrics = ctx.measureText(text);
    const textX = (width - textMetrics.width) / 2;
    const textY = height / 2;
    ctx.fillText(text, textX, textY);

    ctx.restore();
  },
};

ChartJS.register(centerTextPlugin);

export interface PieChartProps {
  data: {
    labels: string[];
    datasets: Array<{
      data: number[];
      backgroundColor: string[];
      hoverOffset?: number;
    }>;
  };
}

const PieChart: React.FC<PieChartProps> = ({ data }) => {
  const options: ChartJS['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          // автоматически подстроит цвет под тёмный/светлый фон
          color: '#6B7280',
          padding: 16,
          boxWidth: 12,
          boxHeight: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const label = ctx.label || '';
            const value = ctx.parsed;
            const percent = ((value / data.datasets[0].data.reduce((a, b) => a + b, 0)) * 100).toFixed(1);
            return `${label}: ${value.toLocaleString()} (${percent}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="
      w-full h-full 
      p-4 
      bg-white border border-gray-200 rounded-lg 
      dark:bg-gray-800 dark:border-gray-700
      ">
      <div className="w-full h-64">
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default PieChart;
