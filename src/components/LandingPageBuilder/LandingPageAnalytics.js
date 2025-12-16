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
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    if (isPublished) {
      loadAnalytics();
    } else {
      setLoading(false);
    }
  }, [projectId, isPublished, timeRange]);

  const loadAnalytics = async () => {
    try {
      const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysBack);

      // Get page views
      const { data: views, count: viewCount } = await supabase
        .from('landing_page_views')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .gte('created_at', startDate.toISOString());

      // Calculate unique visitors by date
      const uniqueDates = new Set(views?.map(v => v.created_at?.split('T')[0])).size;

      // Get signups
      const { data: signupData, count: signupCount } = await supabase
        .from('landing_page_signups')
        .select('*', { count: 'exact' })
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      // Calculate views over time
      const viewsByDay = [];
      for (let i = daysBack - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayViews = views?.filter(v => v.created_at?.startsWith(dateStr)).length || 0;
        const daySignups = signupData?.filter(s => s.created_at?.startsWith(dateStr)).length || 0;
        viewsByDay.push({
          date: dateStr,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
      setViewsOverTime(viewsByDay);
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
    a.download = `signups-${slug}-${new Date().toISOString().split('T')[0]}.csv`;
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
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <div className="flex gap-1 bg-[#161618] border border-[#27272a] rounded-lg p-1">
          {[
            { value: '7d', label: '7 Days' },
            { value: '30d', label: '30 Days' },
            { value: '90d', label: '90 Days' },
          ].map(range => (
            <button
              key={range.value}
              onClick={() => setTimeRange(range.value)}
              className={`px-3 py-1.5 rounded-md text-sm ${
                timeRange === range.value
                  ? 'bg-[#27272a] text-white'
                  : 'text-[#71717a] hover:text-white'
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Views', value: analytics.totalViews, icon: '👁️', color: '#22c55e', change: null },
          { label: 'Unique Visitors', value: analytics.uniqueVisitors, icon: '👤', color: '#3b82f6', change: null },
          { label: 'Signups', value: analytics.signups, icon: '✉️', color: '#8b5cf6', change: null },
          { label: 'Conversion', value: `${analytics.conversionRate}%`, icon: '📈', color: '#f97316', change: null },
        ].map((stat, index) => (
          <div
            key={index}
            className="bg-[#161618] border border-[#27272a] rounded-xl p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#71717a]">{stat.label}</span>
              <span>{stat.icon}</span>
            </div>
            <div className="text-3xl font-bold" style={{ color: stat.color }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Views Chart */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold">Views Over Time</h3>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#22c55e]" />
              <span className="text-[#71717a]">Views</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-[#8b5cf6]" />
              <span className="text-[#71717a]">Signups</span>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48">
          <div className="flex items-end gap-1 h-40">
            {viewsOverTime.map((day, index) => {
              const showLabel = viewsOverTime.length <= 14 || index % Math.ceil(viewsOverTime.length / 14) === 0;
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                    <div className="bg-[#27272a] rounded-lg px-3 py-2 text-xs whitespace-nowrap">
                      <div className="font-medium">{day.label}</div>
                      <div className="text-[#22c55e]">{day.views} views</div>
                      <div className="text-[#8b5cf6]">{day.signups} signups</div>
                    </div>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex gap-0.5 items-end" style={{ height: '140px' }}>
                    <div
                      className="flex-1 bg-[#22c55e] rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.views / maxViews) * 100}%`,
                        minHeight: day.views > 0 ? '4px' : '0',
                      }}
                    />
                    <div
                      className="flex-1 bg-[#8b5cf6] rounded-t transition-all hover:opacity-80"
                      style={{
                        height: `${(day.signups / Math.max(...viewsOverTime.map(d => d.signups), 1)) * 100}%`,
                        minHeight: day.signups > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex gap-1 mt-2">
            {viewsOverTime.map((day, index) => {
              const showLabel = viewsOverTime.length <= 14 || index % Math.ceil(viewsOverTime.length / 14) === 0;
              return (
                <div key={index} className="flex-1 text-center">
                  {showLabel && <span className="text-[10px] text-[#71717a]">{day.label}</span>}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Signups List */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold">Waitlist Signups ({signups.length})</h3>
          {signups.length > 0 && (
            <button
              onClick={exportSignups}
              className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-medium transition-colors"
            >
              📥 Export CSV
            </button>
          )}
        </div>

        {signups.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">📭</div>
            <h4 className="font-medium mb-2">No signups yet</h4>
            <p className="text-sm text-[#71717a] max-w-sm mx-auto">
              Share your landing page on social media, Reddit, or relevant communities to start collecting emails.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {signups.map((signup, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e]">
                    {signup.email?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <div className="font-medium">{signup.email}</div>
                    <div className="text-xs text-[#71717a]">
                      {signup.referrer ? `From: ${signup.referrer}` : 'Direct visit'}
                    </div>
                  </div>
                </div>
                <div className="text-sm text-[#71717a]">
                  {new Date(signup.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Share Tips */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
        <h3 className="font-bold mb-4">📢 Where to Share</h3>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Reddit', icon: '🔴', communities: 'r/SideProject, r/startups, niche subreddits' },
            { name: 'Twitter/X', icon: '🐦', communities: 'Build in public, founder communities' },
            { name: 'Indie Hackers', icon: '👨‍💻', communities: 'Product launches, milestones' },
            { name: 'Hacker News', icon: '🟧', communities: 'Show HN posts' },
          ].map((platform, index) => (
            <div
              key={index}
              className="p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a]"
            >
              <div className="text-2xl mb-2">{platform.icon}</div>
              <div className="font-medium mb-1">{platform.name}</div>
              <div className="text-xs text-[#71717a]">{platform.communities}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}