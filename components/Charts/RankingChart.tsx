import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { TopVideoItem } from '../../types/charts';

interface RankingChartProps {
  data: TopVideoItem[];
  theme: string;
  scale?: number;
}

export const RankingChart: React.FC<RankingChartProps> = ({ data, theme, scale = 1 }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const viewColor = theme === 'dark' ? '#34d399' : '#22c55e';
  const likeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const commentColor = theme === 'dark' ? '#f9a8d4' : '#ec4899';

  const gb = Math.max(30, Math.round(50 * scale));
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, type: 'scroll', itemGap: Math.max(8, Math.round(12 * scale)), textStyle: { color: baseText } },
    grid: { left: Math.max(12, Math.round(18 * scale)), right: Math.max(12, Math.round(18 * scale)), bottom: gb, top: gb, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: baseText, hideOverlap: true, margin: 10 },
      splitLine: { lineStyle: { color: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e5e7eb' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title),
      axisLabel: { color: baseText },
    },
    series: [
      { name: '浏览', type: 'bar', data: data.map(i => i.views), itemStyle: { color: viewColor }, barWidth: Math.max(8, Math.round(12 * scale)) },
      { name: '点赞', type: 'bar', data: data.map(i => i.likes), itemStyle: { color: likeColor }, barWidth: Math.max(8, Math.round(12 * scale)) },
      { name: '评论', type: 'bar', data: data.map(i => i.comments), itemStyle: { color: commentColor }, barWidth: Math.max(8, Math.round(12 * scale)) },
    ],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-3">TOP 视频表现</h3>
      <ReactECharts option={option} style={{ height: Math.round(380 * scale) }} />
    </div>
  );
};

export default RankingChart;
