import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { PieItem } from '../../types/charts';

interface StatsChartProps {
  data: PieItem[];
  theme: string;
  scale?: number;
}

export const StatsChart: React.FC<StatsChartProps> = ({ data, theme, scale = 1 }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const legendItemGap = Math.max(8, Math.round(12 * scale));
  const emphasisFontSize = Math.max(14, Math.round(18 * scale));
  const centerY = '60%';
  const legendSelected = Object.fromEntries(data.map(i => [i.type, i.value > 0]));

  const option = {
    tooltip: { trigger: 'item', formatter: (p: any) => `${p.name}: ${p.data?.raw ?? p.value}` },
    legend: { top: 0, left: 'center', type: 'scroll', itemGap: legendItemGap, textStyle: { color: baseText }, selected: legendSelected },
    series: [{
      name: '互动统计', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      center: ['50%', centerY],
      label: { show: false, position: 'center', formatter: (p: any) => `${p.name}: ${p.data?.raw ?? p.value}` },
      emphasis: { label: { show: true, fontSize: emphasisFontSize, fontWeight: 'bold', color: baseText, formatter: (p: any) => `${p.name}: ${p.data?.raw ?? p.value}` } },
      data: data.map(i => ({ value: i.value, raw: i.value, name: i.type })),
    }],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">互动数据分布</h3>
      <ReactECharts option={option} style={{ height: Math.round(380 * scale) }} />
    </div>
  );
};
