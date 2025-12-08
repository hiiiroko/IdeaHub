import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { LineItem } from '../../types/charts';

interface TrendChartProps {
  data: LineItem[];
  theme: string;
  scale?: number;
}

export const TrendChart: React.FC<TrendChartProps> = ({ data, theme, scale = 1 }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const lineColor = theme === 'dark' ? '#a5b4fc' : '#4096ff';
  const viewColor = theme === 'dark' ? '#34d399' : '#22c55e';
  const barColor = theme === 'dark' ? '#f59e0b' : '#f97316';
  const gridLine = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb';
  const topSpace = Math.max(40, Math.round(48 * scale));
  const bottomSpace = Math.max(32, Math.round(40 * scale));
  const symbolSize = Math.max(4, Math.round(6 * scale));

  const option = {
    tooltip: { trigger: 'axis' },
    legend: { bottom: 0, type: 'scroll', textStyle: { color: baseText } },
    grid: { top: topSpace, bottom: bottomSpace, left: 8, right: Math.max(16, Math.round(24 * scale)), containLabel: true },
    xAxis: { type: 'category', data: data.map(i => i.date), boundaryGap: false, axisLabel: { color: baseText, hideOverlap: true, margin: 10 } },
    yAxis: [
      { type: 'value', name: '浏览/点赞', minInterval: 1, axisLabel: { formatter: (v: number) => Math.round(v), color: baseText }, splitLine: { lineStyle: { color: gridLine } } },
      { type: 'value', name: '新增', minInterval: 1, axisLabel: { formatter: (v: number) => Math.round(v), color: baseText }, splitLine: { show: false } },
    ],
    series: [
      {
        name: '浏览量',
        data: data.map(i => i.total_views),
        type: 'line',
        smooth: true,
        symbolSize,
        areaStyle: { opacity: 0.2 },
        itemStyle: { color: viewColor },
      },
      {
        name: '点赞数',
        data: data.map(i => i.total_likes),
        type: 'line',
        smooth: true,
        symbolSize,
        areaStyle: { opacity: 0.15 },
        itemStyle: { color: lineColor },
      },
      {
        name: '新增作品',
        data: data.map(i => i.new_videos),
        type: 'bar',
        yAxisIndex: 1,
        itemStyle: { color: barColor, borderRadius: [6, 6, 0, 0] },
      },
    ],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50">近30天互动走势</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">浏览 / 点赞 / 新增作品走势</p>
      <ReactECharts option={option} style={{ height: Math.round(380 * scale) }} />
    </div>
  );
};
