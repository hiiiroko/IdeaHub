import { useEffect, useMemo, useState } from 'react';

import { supabase } from '../lib/supabase';
import type { LineItem, PieItem, SummaryStats, TopVideoItem } from '../types/charts';

export const useDashboardData = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lineData, setLineData] = useState<LineItem[]>([]);
  const [pieData, setPieData] = useState<PieItem[]>([]);
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [topVideos, setTopVideos] = useState<TopVideoItem[]>([]);

  const daysRange = useMemo(() => {
    const days: string[] = [];
    const now = new Date();
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [{ data: auth }] = await Promise.all([
          supabase.auth.getUser(),
        ]);

        if (!auth.user) throw new Error('请先登录后查看数据面板');

        const { data: videoRows, error: videoError } = await supabase
          .from('videos')
          .select('id, title, duration, is_public, created_at')
          .eq('uploader_id', auth.user.id)
          .eq('is_deleted', false);

        if (videoError) throw videoError;

        const videoIds = (videoRows || []).map(v => v.id);
        const baseSummary: SummaryStats = {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalVideos: videoRows?.length || 0,
          publicVideos: (videoRows || []).filter(v => v.is_public).length,
          avgDuration: (videoRows || []).reduce((acc, v) => acc + (v.duration || 0), 0) / Math.max((videoRows || []).length, 1),
        };

        if (videoIds.length === 0) {
          setSummary(baseSummary);
          setLineData(daysRange.map(date => ({ date, total_likes: 0, total_views: 0, new_videos: 0 })));
          setPieData([]);
          setTopVideos([]);
          return;
        }

        const since = new Date();
        since.setDate(since.getDate() - 29);
        const sinceIso = since.toISOString();

        const [trendRes, statsRes, viewCountRes, likeCountRes, commentCountRes, viewEventsRes, likeEventsRes, commentEventsRes] = await Promise.all([
          supabase.rpc('get_daily_likes_trend'),
          supabase.rpc('get_interaction_stats'),
          supabase.from('video_view_events').select('*', { count: 'exact', head: true }).in('video_id', videoIds),
          supabase.from('video_likes').select('*', { count: 'exact', head: true }).in('video_id', videoIds),
          supabase.from('comments').select('*', { count: 'exact', head: true }).in('video_id', videoIds),
          supabase.from('video_view_events').select('created_at, video_id').in('video_id', videoIds).gte('created_at', sinceIso),
          supabase.from('video_likes').select('created_at, video_id').in('video_id', videoIds).gte('created_at', sinceIso),
          supabase.from('comments').select('video_id').in('video_id', videoIds),
        ]);

        if (trendRes.error) throw trendRes.error;
        if (statsRes.error) throw statsRes.error;
        if (viewCountRes.error) throw viewCountRes.error;
        if (likeCountRes.error) throw likeCountRes.error;
        if (commentCountRes.error) throw commentCountRes.error;
        if (viewEventsRes.error) throw viewEventsRes.error;
        if (likeEventsRes.error) throw likeEventsRes.error;
        if (commentEventsRes.error) throw commentEventsRes.error;

        const totalViews = viewCountRes.count || 0;
        const totalLikes = likeCountRes.count || 0;
        const totalComments = commentCountRes.count || 0;

        const likesTrend = (trendRes.data as LineItem[] | null) || [];
        const viewEvents = viewEventsRes.data || [];
        const likeEvents = likeEventsRes.data || [];

        const viewCountsMap = viewEvents.reduce<Record<string, number>>((acc, cur: any) => {
          acc[cur.video_id] = (acc[cur.video_id] || 0) + 1;
          return acc;
        }, {});

        const likeCountsMap = likeEvents.reduce<Record<string, number>>((acc, cur: any) => {
          acc[cur.video_id] = (acc[cur.video_id] || 0) + 1;
          return acc;
        }, {});

        const commentCountsMap = (commentEventsRes.data || []).reduce<Record<string, number>>((acc, cur: any) => {
          acc[cur.video_id] = (acc[cur.video_id] || 0) + 1;
          return acc;
        }, {});

        const dayBuckets = daysRange.reduce<Record<string, LineItem>>((acc, date) => {
          acc[date] = { date, total_likes: 0, total_views: 0, new_videos: 0 };
          return acc;
        }, {});

        likesTrend.forEach(item => {
          if (dayBuckets[item.date]) {
            dayBuckets[item.date].total_likes = item.total_likes;
          }
        });

        viewEvents.forEach((row: any) => {
          const date = row.created_at.slice(0, 10);
          if (dayBuckets[date]) dayBuckets[date].total_views += 1;
        });

        videoRows?.forEach(v => {
          const date = v.created_at.slice(0, 10);
          if (dayBuckets[date]) dayBuckets[date].new_videos += 1;
        });

        const sortedLineData = Object.values(dayBuckets).sort((a, b) => a.date.localeCompare(b.date));

        const ranking = (videoRows || []).map(v => ({
          id: v.id,
          title: v.title,
          views: viewCountsMap[v.id] || 0,
          likes: likeCountsMap[v.id] || 0,
          comments: commentCountsMap[v.id] || 0,
          createdAt: v.created_at,
        })).sort((a, b) => b.views - a.views || b.likes - a.likes).slice(0, 6);

        setSummary({ ...baseSummary, totalViews, totalLikes, totalComments });
        setLineData(sortedLineData);
        setPieData(statsRes.data || []);
        setTopVideos(ranking);
      } catch (e: any) {
        setError(e?.message || '数据获取失败');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [daysRange]);

  return { loading, error, lineData, pieData, summary, topVideos };
};
