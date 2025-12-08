import ReactECharts from 'echarts-for-react';
import React from 'react';

import type { TopVideoItem } from '../../types/charts';

interface RankingChartProps {
  data: TopVideoItem[];
  theme: string;
}

export const RankingChart: React.FC<RankingChartProps> = ({ data, theme }) => {
  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const viewColor = theme === 'dark' ? '#34d399' : '#22c55e';
  const likeColor = theme === 'dark' ? '#60a5fa' : '#3b82f6';
  const commentColor = theme === 'dark' ? '#f9a8d4' : '#ec4899';

  const option = {
    title: { text: 'TOP 视频表现', left: 'center', textStyle: { color: baseText } },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { bottom: 0, textStyle: { color: baseText } },
    grid: { left: 0, right: 0, bottom: 50, top: 50, containLabel: true },
    xAxis: {
      type: 'value',
      axisLabel: { color: baseText },
      splitLine: { lineStyle: { color: theme === 'dark' ? 'rgba(255,255,255,0.08)' : '#e5e7eb' } },
    },
    yAxis: {
      type: 'category',
      data: data.map(item => item.title.length > 18 ? `${item.title.slice(0, 18)}...` : item.title),
      axisLabel: { color: baseText },
    },
    series: [
      { name: '浏览', type: 'bar', data: data.map(i => i.views), itemStyle: { color: viewColor }, barWidth: 12 },
      { name: '点赞', type: 'bar', data: data.map(i => i.likes), itemStyle: { color: likeColor }, barWidth: 12 },
      { name: '评论', type: 'bar', data: data.map(i => i.comments), itemStyle: { color: commentColor }, barWidth: 12 },
    ],
  };

  return (
    <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
      <ReactECharts option={option} style={{ height: 380 }} />
    </div>
  );
};

export default RankingChart;
