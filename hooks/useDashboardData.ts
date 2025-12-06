import { useEffect, useState } from 'react';

import { supabase } from '../lib/supabase';
import type { LineItem, PieItem } from '../types/charts';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineData, setLineData] = useState<LineItem[]>([]);
  const [pieData, setPieData] = useState<PieItem[]>([]);

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

  return { loading, error, lineData, pieData };
};
