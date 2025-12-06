import React from 'react';

import { StatsChart } from './Charts/StatsChart';
import { TrendChart } from './Charts/TrendChart';

import { useApp } from '@/context/AppContext';
import { useDashboardData } from '@/hooks/useDashboardData';

const DashboardCharts: React.FC = () => {
  const { theme } = useApp();
  const { loading, error, lineData, pieData } = useDashboardData();

  if (loading) return (
    <div className="mt-4">
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
          <div className="h-6 w-40 mb-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-[320px] rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        </div>
        <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
          <div className="h-6 w-32 mb-3 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-[320px] rounded bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-700 dark:via-gray-600 dark:to-gray-700 animate-pulse" />
        </div>
      </div>
    </div>
  );

  if (error) return <div style={{ padding: 32, color: '#c00', textAlign: 'center' }}>错误：{error}</div>;

  return (
    <div className="mt-4">
      <div className="grid grid-cols-[2fr_1fr] gap-4">
        <TrendChart data={lineData} theme={theme} />
        <StatsChart data={pieData} theme={theme} />
      </div>
    </div>
  );
};

export default DashboardCharts;
