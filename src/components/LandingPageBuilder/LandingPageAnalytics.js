'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function LandingPageAnalytics({ projectId, isPublished, slug }) {
  const [analytics, setAnalytics] = useState({
    totalViews: 0,
    uniqueVisitors: 0,
    signups: 0,
    conversionRate: 0,
  });
  const [signups, setSignups] = useState([]);
  const [viewsOverTime, setViewsOverTime] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isPublished) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [projectId, isPublished]);

  const loadAnalytics = async () => {
    try {
      // Get page views
      const { data: views, count: viewCount } = await supabase
        .from('landing_page_views')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId);

      // Get unique visitors (by IP or fingerprint - simplified as count of unique dates)
      const uniqueDates = new Set(views?.map(v => v.created_at?.split('T')[0])).size;

      // Get signups
      const { data: signupData, count: signupCount } = await supabase
        .from('landing_page_signups')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Calculate views over time (last 7 days)
      const last7Days = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayViews = views?.filter(v => v.created_at?.startsWith(dateStr)).length || 0;
        const daySignups = signupData?.filter(s => s.created_at?.startsWith(dateStr)).length || 0;
        last7Days.push({
          date: dateStr,
          label: date.toLocaleDateString('en-US', { weekday: 'short' }),
          views: dayViews,
          signups: daySignups,
        });
      }

      setAnalytics({
        totalViews: viewCount || 0,
        uniqueVisitors: uniqueDates || 0,
        signups: signupCount || 0,
        conversionRate: viewCount > 0 ? ((signupCount / viewCount) * 100).toFixed(1) : 0,
      });
      setSignups(signupData || []);
      setViewsOverTime(last7Days);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportSignups = () => {
    if (signups.length === 0) return;

    const csv = [
      ['Email', 'Source', 'Signed Up At'],
      ...signups.map(s => [
        s.email,
        s.referrer || 'Direct',
        new Date(s.created_at).toLocaleString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signups-${slug}.csv`;
    a.click();
  };

  if (!isPublished) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">📊</span>
        </div>
        <h2 className="text-2xl font-bold mb-3">Analytics Not Available</h2>
        <p className="text-[#a1a1aa] mb-6 max-w-md mx-auto">
          Publish your landing page to start tracking views and signups.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full mx-auto" />
        <p className="text-[#71717a] mt-4">Loading analytics...</p>
      </div>
    );
  }

  const maxViews = Math.max(...viewsOverTime.map(d => d.views), 1);

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: analytics.totalViews, icon: '👁️', color: '#22c55e' },
          { label: 'Unique Visitors', value: analytics.uniqueVisitors, icon: '👤', color: '#3b82f6' },
          { label: 'Signups', value: analytics.signups, icon: '✉️', color: '#8b5cf6' },
          { label: 'Conversion Rate', value: `${analytics.conversionRate}%`, icon: '📈', color: '#f97316' },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-[#161618] border border-[#27272a] rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-2">
              <span>{stat.icon}</span>
              <span className="text-sm text-[#71717a]">{stat.label}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">Last 7 Days</h3>
        <div className="flex items-end gap-2 h-40">
          {viewsOverTime.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center gap-1" style={{ height: '120px' }}>
                {/* Views bar */}
                <div
                  className="w-full rounded-t transition-all"
                  style={{
                    height: `${(day.views / maxViews) * 100}%`,
                    backgroundColor: '#22c55e',
                    minHeight: day.views > 0 ? '4px' : '0',
                  }}
                />
              </div>
              <div className="text-xs text-[#71717a]">{day.label}</div>
              <div className="text-xs font-medium">{day.views}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[#22c55e]" />
            <span className="text-xs text-[#71717a]">Page Views</span>
          </div>
        </div>
      </div>

      {/* Signups List */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">Waitlist Signups</h3>
          {signups.length > 0 && (
            <button
              onClick={exportSignups}
              className="px-4 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-sm font-medium transition-colors"
            >
              Export CSV
            </button>
          )}
        </div>

        {signups.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-[#71717a]">No signups yet</p>
            <p className="text-sm text-[#71717a] mt-1">Share your landing page to start collecting emails</p>
          </div>
        ) : (
          <div className="space-y-3">
            {signups.slice(0, 10).map((signup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a]"
              >
                <div>
                  <div className="font-medium">{signup.email}</div>
                  <div className="text-xs text-[#71717a]">
                    {signup.referrer ? `From: ${signup.referrer}` : 'Direct visit'}
                  </div>
                </div>
                <div className="text-sm text-[#71717a]">
                  {new Date(signup.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
            {signups.length > 10 && (
              <p className="text-center text-sm text-[#71717a] py-2">
                And {signups.length - 10} more... Export CSV to see all.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Traffic Sources */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <h3 className="text-lg font-bold mb-6">Where to Share</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { name: 'Reddit', icon: '🔴', tip: 'Post in relevant subreddits' },
            { name: 'Twitter/X', icon: '🐦', tip: 'Share with your audience' },
            { name: 'Communities', icon: '👥', tip: 'Slack, Discord, forums' },
          ].map((source, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a]"
            >
              <div className="text-2xl mb-2">{source.icon}</div>
              <div className="font-medium mb-1">{source.name}</div>
              <div className="text-xs text-[#71717a]">{source.tip}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}