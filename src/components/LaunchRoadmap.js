'use client';

import { useState, useMemo } from 'react';

const CATEGORY_STYLES = {
  build: { bg: 'bg-blue-500/20', text: 'text-blue-400', icon: '🔨' },
  market: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '📣' },
  outreach: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '💬' },
};

export default function LaunchCalendar({ 
  signals, 
  outreachMap, 
  isValidated, 
  wouldPayCount, 
  projectName, 
  projectPain,
  targetAudience 
}) {
  const [calendar, setCalendar] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState({});
  const [expandedTask, setExpandedTask] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [activeWeek, setActiveWeek] = useState(1);

  const communityBreakdown = useMemo(() => {
    const breakdown = {};
    signals.forEach(signal => {
      const subreddit = signal.subreddit || 'unknown';
      breakdown[subreddit] = (breakdown[subreddit] || 0) + 1;
    });
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [signals]);

  const generateCalendar = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/launch-calendar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectPain,
          targetAudience,
          signals,
          outreachMap,
          communities: communityBreakdown,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setCalendar(data);
    } catch (err) {
      setError(err.message || 'Failed to generate calendar');
    } finally {
      setLoading(false);
    }
  };

  const toggleTask = (weekNum, dayNum) => {
    const key = `${weekNum}-${dayNum}`;
    setCompletedTasks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const copyTemplate = async (template, taskKey) => {
    await navigator.clipboard.writeText(template);
    setCopiedTemplate(taskKey);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  const totalTasks = calendar?.weeks?.reduce((acc, w) => acc + w.days.length, 0) || 0;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  if (!isValidated) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Launch Calendar Locked</h3>
          <p className="text-[#a1a1aa] mb-4">
            Get {3 - wouldPayCount} more &quot;I&apos;d pay&quot; signal{3 - wouldPayCount !== 1 ? 's' : ''} to unlock your launch calendar.
          </p>
          <div className="flex items-center justify-center gap-2">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= wouldPayCount 
                    ? 'bg-[#22c55e] text-[#0a0a0b]' 
                    : 'bg-[#27272a] text-[#71717a]'
                }`}
              >
                {i <= wouldPayCount ? '💰' : i}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!calendar && !loading) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">📅</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Generate Your Launch Calendar</h3>
          <p className="text-[#a1a1aa] mb-6">
            AI will analyze your {signals.length} signals and create a personalized 4-week launch plan with MVP features and daily tasks.
          </p>

          <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 mb-6 text-left">
            <p className="text-xs text-[#71717a] mb-2">Calendar will include:</p>
            <div className="space-y-1 text-sm text-[#a1a1aa]">
              <p>🔨 MVP features based on user signals</p>
              <p>📅 28 days of specific tasks</p>
              <p>📝 Tweet & Reddit templates</p>
              <p>🎯 Personalized to your communities</p>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateCalendar}
            className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
          >
            ✨ Generate Launch Calendar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[#a1a1aa]">AI is building your launch calendar...</p>
          <p className="text-xs text-[#71717a] mt-2">Analyzing signals and planning your MVP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">📅</span>
              <h3 className="text-xl font-bold">4-Week Launch Calendar</h3>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400">AI Generated</span>
            </div>
            <p className="text-sm text-[#a1a1aa]">{calendar?.summary}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#22c55e]">{progress}%</div>
            <div className="text-xs text-[#71717a]">{completedCount}/{totalTasks} tasks</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-[#27272a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* MVP Features */}
      {calendar?.mvpFeatures && (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <span>🎯</span> MVP Features (based on your signals)
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {calendar.mvpFeatures.map((feature, i) => (
              <div key={i} className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4">
                <h4 className="font-medium mb-1">{feature.name}</h4>
                <p className="text-xs text-[#a1a1aa] mb-2">{feature.description}</p>
                <p className="text-[10px] text-[#71717a] italic">&quot;{feature.basedOn}&quot;</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Week Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(week => {
          const weekData = calendar?.weeks?.find(w => w.week === week);
          const weekTasks = weekData?.days || [];
          const weekCompleted = weekTasks.filter((_, i) => completedTasks[`${week}-${i + 1}`]).length;
          
          return (
            <button
              key={week}
              onClick={() => setActiveWeek(week)}
              className={`flex-1 p-3 rounded-xl border transition-colors ${
                activeWeek === week
                  ? 'bg-[#22c55e]/20 border-[#22c55e]/50'
                  : 'bg-[#161618] border-[#27272a] hover:border-[#3f3f46]'
              }`}
            >
              <div className="text-xs text-[#71717a]">Week {week}</div>
              <div className="font-semibold text-sm truncate">{weekData?.theme || 'Loading...'}</div>
              <div className="text-xs text-[#71717a] mt-1">{weekCompleted}/{weekTasks.length} done</div>
            </button>
          );
        })}
      </div>

      {/* Calendar Grid */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
        {calendar?.weeks?.find(w => w.week === activeWeek)?.days?.map((day, i) => {
          const taskKey = `${activeWeek}-${day.day}`;
          const isCompleted = completedTasks[taskKey];
          const isExpanded = expandedTask === taskKey;
          const category = CATEGORY_STYLES[day.category] || CATEGORY_STYLES.build;

          return (
            <div
              key={i}
              className={`mb-3 border rounded-xl transition-all ${
                isCompleted
                  ? 'bg-[#22c55e]/10 border-[#22c55e]/30'
                  : 'bg-[#0a0a0b] border-[#27272a] hover:border-[#3f3f46]'
              }`}
            >
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => setExpandedTask(isExpanded ? null : taskKey)}
              >
                {/* Checkbox */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleTask(activeWeek, day.day);
                  }}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors flex-shrink-0 ${
                    isCompleted
                      ? 'bg-[#22c55e] text-[#0a0a0b]'
                      : 'bg-[#27272a] text-[#71717a] hover:bg-[#3f3f46]'
                  }`}
                >
                  {isCompleted ? '✓' : day.day}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs text-[#71717a]">{day.dayOfWeek}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${category.bg} ${category.text}`}>
                      {category.icon} {day.category}
                    </span>
                    {day.timeEstimate && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">
                        ⏱ {day.timeEstimate}
                      </span>
                    )}
                  </div>
                  <h4 className={`font-medium ${isCompleted ? 'text-[#22c55e]' : ''}`}>{day.task}</h4>
                </div>

                {/* Expand Arrow */}
                <svg
                  className={`w-5 h-5 text-[#71717a] transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4">
                  <div className="ml-12 p-4 bg-[#161618] rounded-lg border border-[#27272a] space-y-3">
                    <p className="text-sm text-[#a1a1aa]">{day.description}</p>

                    {/* Template */}
                    {day.template && (
                      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-[#71717a]">Ready-to-use template:</span>
                          <button
                            onClick={() => copyTemplate(day.template, taskKey)}
                            className="text-xs px-2 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] transition-colors"
                          >
                            {copiedTemplate === taskKey ? '✓ Copied!' : 'Copy'}
                          </button>
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{day.template}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Regenerate */}
      <div className="text-center">
        <button
          onClick={generateCalendar}
          disabled={loading}
          className="text-sm text-[#71717a] hover:text-white transition-colors"
        >
          🔄 Regenerate calendar
        </button>
      </div>
    </div>
  );
}