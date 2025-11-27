import ReactECharts from 'echarts-for-react';
import React, { useEffect, useState } from 'react';

import { useApp } from '@/context/AppContext';
import { supabase } from '@/lib/supabase';

type LineItem = { date: string; total_likes: number };
type PieItem = { type: string; value: number };

const DashboardCharts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineData, setLineData] = useState<LineItem[]>([]);
  const [pieData, setPieData] = useState<PieItem[]>([]);
  const { theme } = useApp();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [trendRes, statsRes] = await Promise.all([
          supabase.rpc('get_daily_likes_trend'),
          supabase.rpc('get_interaction_stats'),
        ]);
        if (trendRes.error) throw trendRes.error;
        if (statsRes.error) throw statsRes.error;
        setLineData(trendRes.data || []);
        setPieData(statsRes.data || []);
      } catch (e: any) {
        setError(e?.message || '数据获取失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const baseText = theme === 'dark' ? '#e5e7eb' : '#374151';
  const lineColor = theme === 'dark' ? '#a5b4fc' : '#4096ff';
  const gridLine = theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e5e7eb';

  const lineOption = {
    title: { text: '发布作品获赞趋势', subtext: '按发布日期统计', left: 'center', textStyle: { color: baseText } },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: lineData.map(i => i.date), boundaryGap: false, axisLabel: { color: baseText } },
    yAxis: { type: 'value', name: '获赞总数', minInterval: 1, axisLabel: { formatter: (v: number) => Math.round(v), color: baseText }, splitLine: { lineStyle: { color: gridLine } } },
    series: [{
      data: lineData.map(i => i.total_likes),
      type: 'line', smooth: true,
      areaStyle: { opacity: 0.3 },
      itemStyle: { color: lineColor },
    }],
  };

  const pieOption = {
    title: { text: '互动数据分布', left: 'center', textStyle: { color: baseText } },
    tooltip: { trigger: 'item' },
    legend: { bottom: '5%', left: 'center', textStyle: { color: baseText } },
    series: [{
      name: '互动统计', type: 'pie', radius: ['40%', '70%'], avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold', color: baseText } },
      data: pieData.map(i => ({ value: i.value, name: i.type })),
    }],
  };

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
        <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
          <ReactECharts option={lineOption} style={{ height: 380 }} />
        </div>
        <div className="rounded-xl border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 p-4">
          <ReactECharts option={pieOption} style={{ height: 380 }} />
        </div>
      </div>
    </div>
  );
};

export default DashboardCharts;
