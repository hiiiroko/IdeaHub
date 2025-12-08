import React, { useEffect, useMemo, useState } from 'react';

import { RankingChart } from './Charts/RankingChart';
import { StatsChart } from './Charts/StatsChart';
import { TrendChart } from './Charts/TrendChart';

import { useApp } from '@/context/AppContext';
import { useDashboardData } from '@/hooks/useDashboardData';

const DashboardCharts: React.FC = () => {
  const { theme } = useApp();
  const { loading, error, lineData, pieData, summary, topVideos } = useDashboardData();
  const [scale, setScale] = useState(1);

  const designTotalHeight = 380 + 380;
  const reservedHeight = 280;

  const computeScale = () => {
    const vh = window.innerHeight;
    const available = Math.max(0, Math.floor(vh * 0.85) - reservedHeight);
    const ratio = designTotalHeight > 0 ? available / designTotalHeight : 1;
    const s = Math.max(0.6, Math.min(1, ratio));
    setScale(s);
  };

  useEffect(() => {
    computeScale();
    const onResize = () => computeScale();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const metrics = [
    { label: '总浏览量', value: summary?.totalViews ?? 0, hint: '覆盖全部公开/非公开视频的观看事件' },
    { label: '总点赞', value: summary?.totalLikes ?? 0, hint: '互动触达与受欢迎程度' },
    { label: '总评论', value: summary?.totalComments ?? 0, hint: '社区参与度' },
    { label: '视频数', value: summary?.totalVideos ?? 0, hint: `公开 ${summary?.publicVideos ?? 0} 个` },
    { label: '平均时长(秒)', value: Math.round(summary?.avgDuration ?? 0), hint: '内容制作成本与观感时长' },
    {
      label: '互动率',
      value: summary && summary.totalViews > 0 ? `${((summary.totalLikes + summary.totalComments) / summary.totalViews * 100).toFixed(1)}%` : '0%',
      hint: '（点赞+评论）/ 浏览量',
    },
  ];

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
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
        {metrics.map(item => (
          <div key={item.label} className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4 shadow-sm">
            <p className="text-sm text-gray-500 dark:text-gray-400">{item.label}</p>
            <p className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mt-1">{item.value}</p>
            <p className="text-xs text-gray-400 mt-1">{item.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-4">
        <TrendChart data={lineData} theme={theme} scale={scale} />
        <StatsChart data={pieData} theme={theme} scale={scale} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.3fr_1fr] gap-4 mt-4">
        <RankingChart data={topVideos} theme={theme} scale={scale} />
        <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-50 mb-4">内容健康度</h3>
          <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-200">
            <li>• 互动率 = （点赞 + 评论）/ 浏览量，常用衡量短视频有效触达。</li>
            <li>• 关注浏览量与新增作品的同向/背离走势，判断内容供给是否匹配消费。</li>
            <li>• TOP 列表既可用于复用成功模板，也用于发现需要优化的长尾视频。</li>
            <li>• 平均时长可结合人群定位，进一步调整拍摄脚本与节奏。</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
