import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { PieItem } from '../../types/charts';

interface StatsChartProps {
  data: PieItem[];
  theme: string;
}

export const StatsChart: React.FC<StatsChartProps> = ({ data, theme }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';

  const option = {
    title: { text: '互动数据分布', left: 'center', textStyle: { color: baseText } },
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', textStyle: { color: baseText } },
    series: [{
      name: '互动统计', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: baseText } },
      data: data.map(i => ({ value: i.value, name: i.type })),
    }],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <ReactECharts option={option} style={{ height: 380 }} />
    </div>
  );
};
