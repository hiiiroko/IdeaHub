import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { LineItem } from '../../types/charts';

interface TrendChartProps {
  data: LineItem[];
  theme: string;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, theme }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const lineColor = theme === 'dark' ? '#a5b4fc' : '#4096ff';
  const gridLine = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

  const option = {
    title: { text: '发布作品获赞趋势', subtext: '按发布日期统计', left: 'center', textStyle: { color: baseText } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: data.map(i => i.date), boundaryGap: false, axisLabel: { color: baseText } },
    yAxis: { type: 'value', name: '获赞总数', minInterval: 1, axisLabel: { formatter: (v: number) => Math.round(v), color: baseText }, splitLine: { lineStyle: { color: gridLine } } },
    series: [{
      data: data.map(i => i.total_likes),
      type: 'line', smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: lineColor },
    }],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <ReactECharts option={option} style={{ height: 380 }} />
    </div>
  );
};
