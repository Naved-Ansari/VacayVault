import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Filler
);

interface CategoryChartProps {
  data: { name: string; color?: string; total: number }[];
}

export const CategoryDoughnutChart: React.FC<CategoryChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const mutedColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: mutedColor }}>
        No category spending data yet.
      </div>
    );
  }

  const defaultColors = [
    '#3B82F6', '#06B6D4', '#10B981', '#F59E0B', '#EC4899',
    '#8B5CF6', '#6366F1', '#14B8A6', '#EF4444', '#64748B',
  ];

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        data: data.map((d) => d.total),
        backgroundColor: data.map((d, i) => d.color || defaultColors[i % defaultColors.length]),
        borderColor: theme === 'dark' ? '#151e33' : '#ffffff',
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          color: textColor,
          font: { family: "'Plus Jakarta Sans', sans-serif", size: 12 },
          boxWidth: 12,
          padding: 14,
        },
      },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#0f172a',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        callbacks: {
          label: function (context: any) {
            const val = context.raw || 0;
            return ` ₹ ${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    cutout: '70%',
  };

  return (
    <div style={{ height: '260px', position: 'relative' }}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
};

interface DestinationChartProps {
  data: { name: string; total: number }[];
}

export const DestinationBarChart: React.FC<DestinationChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const textColor = theme === 'dark' ? '#f8fafc' : '#0f172a';
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const mutedColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: mutedColor }}>
        No destination spending data yet.
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => d.name),
    datasets: [
      {
        label: 'Spent (INR)',
        data: data.map((d) => d.total),
        backgroundColor: 'rgba(59, 130, 246, 0.85)',
        borderRadius: 8,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#0f172a',
        callbacks: {
          label: function (context: any) {
            const val = context.raw || 0;
            return ` ₹ ${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: mutedColor, font: { family: "'Plus Jakarta Sans', sans-serif", size: 11 } },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: mutedColor,
          callback: function (val: any) {
            if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
            if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
            return `₹${val}`;
          },
        },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div style={{ height: '260px', position: 'relative' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

interface DailyTrendChartProps {
  data: { date: string; total: number }[];
}

export const DailyTrendLineChart: React.FC<DailyTrendChartProps> = ({ data }) => {
  const { theme } = useTheme();
  const gridColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)';
  const mutedColor = theme === 'dark' ? '#94a3b8' : '#64748b';

  if (!data || data.length === 0) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: mutedColor }}>
        No daily spending recorded yet.
      </div>
    );
  }

  const chartData = {
    labels: data.map((d) => {
      const parts = d.date.split('-');
      return `${parts[2]}/${parts[1]}`;
    }),
    datasets: [
      {
        label: 'Daily Spend (INR)',
        data: data.map((d) => d.total),
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.15)',
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#10B981',
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: theme === 'dark' ? '#1e293b' : '#0f172a',
        callbacks: {
          label: function (context: any) {
            const val = context.raw || 0;
            return ` ₹ ${Number(val).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: { color: mutedColor },
        grid: { display: false },
      },
      y: {
        ticks: {
          color: mutedColor,
          callback: function (val: any) {
            if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
            return `₹${val}`;
          },
        },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div style={{ height: '230px', position: 'relative' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};
