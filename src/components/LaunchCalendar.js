'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const PHASE_COLORS = {
  yellow: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', badge: 'bg-yellow-500/20' },
  orange: { bg: 'bg-orange-500/10', border: 'border-orange-500/30', text: 'text-orange-400', badge: 'bg-orange-500/20' },
  green: { bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', badge: 'bg-green-500/20' },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400', badge: 'bg-blue-500/20' },
  purple: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', text: 'text-purple-400', badge: 'bg-purple-500/20' },
};

const TASK_TYPES = {
  dm: { icon: '💬', label: 'DM', color: 'text-green-400', bg: 'bg-green-500/20' },
  twitter: { icon: '𝕏', label: 'Twitter', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  reddit: { icon: '📝', label: 'Reddit', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  email: { icon: '📧', label: 'Email', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  content: { icon: '✍️', label: 'Content', color: 'text-pink-400', bg: 'bg-pink-500/20' },
  engage: { icon: '🔄', label: 'Engage', color: 'text-blue-400', bg: 'bg-blue-500/20' },
  build: { icon: '🔨', label: 'Build', color: 'text-slate-400', bg: 'bg-slate-500/20' },
};

const LAUNCH_PHASES = {
  7: [
    { name: 'Warm Up', days: [1, 2], color: 'yellow', icon: '🔥' },
    { name: 'Launch', days: [3, 4, 5], color: 'green', icon: '🚀' },
    { name: 'Momentum', days: [6, 7], color: 'blue', icon: '📈' },
  ],
  14: [
    { name: 'Warm Up', days: [1, 2, 3], color: 'yellow', icon: '🔥' },
    { name: 'Soft Launch', days: [4, 5, 6, 7], color: 'orange', icon: '🎯' },
    { name: 'Main Launch', days: [8, 9, 10], color: 'green', icon: '🚀' },
    { name: 'Momentum', days: [11, 12, 13, 14], color: 'blue', icon: '📈' },
  ],
  21: [
    { name: 'Build Hype', days: [1, 2, 3, 4, 5], color: 'purple', icon: '👀' },
    { name: 'Warm Up', days: [6, 7, 8], color: 'yellow', icon: '🔥' },
    { name: 'Soft Launch', days: [9, 10, 11, 12], color: 'orange', icon: '🎯' },
    { name: 'Main Launch', days: [13, 14, 15], color: 'green', icon: '🚀' },
    { name: 'Momentum', days: [16, 17, 18, 19, 20, 21], color: 'blue', icon: '📈' },
  ],
};

export default function LaunchCalendar({
  projectId,
  signals = [],
  outreachMap = {},
  isValidated,
  signupCount = 0,
  signupGoal = 5,
  projectName = 'My Product',
  projectPain = '',
  targetAudience = 'founders',
  savedCalendar,
  savedProgress,
  onUpdate,
}) {
  const [duration, setDuration] = useState(savedCalendar?.duration || null);
  const [calendar, setCalendar] = useState(savedCalendar || null);
  const [completedTasks, setCompletedTasks] = useState(savedProgress || {});
  const [selectedDay, setSelectedDay] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  // ============================================
  // EXTRACT PERSONALIZATION DATA FROM SIGNALS
  // ============================================
  
  const personalization = useMemo(() => {
    // Get subreddit breakdown with counts
    const subredditCounts = {};
    signals.forEach(s => {
      const sub = s.subreddit || 'startups';
      subredditCounts[sub] = (subredditCounts[sub] || 0) + 1;
    });
    const topSubreddits = Object.entries(subredditCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    // Categorize leads by status
    const warmLeads = signals.filter(s => {
      const status = outreachMap[s.id]?.status;
      return ['replied', 'interested', 'would_pay'].includes(status);
    });
    
    const wouldPayLeads = signals.filter(s => outreachMap[s.id]?.status === 'would_pay');
    const repliedLeads = signals.filter(s => outreachMap[s.id]?.status === 'replied');
    const interestedLeads = signals.filter(s => outreachMap[s.id]?.status === 'interested');
    const contactedLeads = signals.filter(s => outreachMap[s.id]?.status === 'contacted');

    // Extract actual quotes from high-intent signals
    const highIntentSignals = signals.filter(s => s.intent_score === 'high');
    const quotes = highIntentSignals
      .slice(0, 5)
      .map(s => {
        const content = s.content || '';
        // Get first meaningful sentence
        const firstLine = content.split('\n')[0]?.trim() || '';
        return {
          text: firstLine.length > 150 ? firstLine.slice(0, 147) + '...' : firstLine,
          author: s.author,
          subreddit: s.subreddit,
        };
      })
      .filter(q => q.text.length > 20);

    // Extract pain points from signal content
    const painPoints = [];
    const painKeywords = ['frustrated', 'hate', 'wish', 'need', 'struggle', 'pain', 'annoying', 'difficult', 'hard to', 'can\'t find', 'looking for', 'anyone know'];
    signals.forEach(s => {
      const content = (s.content || '').toLowerCase();
      painKeywords.forEach(keyword => {
        if (content.includes(keyword)) {
          const index = content.indexOf(keyword);
          const excerpt = (s.content || '').slice(Math.max(0, index - 20), index + 80).trim();
          if (excerpt.length > 30 && painPoints.length < 5) {
            painPoints.push({
              text: excerpt,
              keyword,
              subreddit: s.subreddit,
            });
          }
        }
      });
    });

    // Get usernames for personalized DMs
    const dmTargets = {
      wouldPay: wouldPayLeads.slice(0, 5).map(s => ({ username: s.author, subreddit: s.subreddit, note: outreachMap[s.id]?.notes })),
      replied: repliedLeads.slice(0, 5).map(s => ({ username: s.author, subreddit: s.subreddit })),
      interested: interestedLeads.slice(0, 5).map(s => ({ username: s.author, subreddit: s.subreddit })),
      contacted: contactedLeads.slice(0, 5).map(s => ({ username: s.author, subreddit: s.subreddit })),
    };

    // Determine best posting times based on signal timestamps
    const postTimes = signals
      .filter(s => s.found_at)
      .map(s => new Date(s.found_at).getHours())
      .reduce((acc, hour) => {
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {});
    const bestHour = Object.entries(postTimes).sort((a, b) => b[1] - a[1])[0]?.[0] || '10';

    return {
      topSubreddits,
      warmLeads,
      wouldPayLeads,
      repliedLeads,
      interestedLeads,
      contactedLeads,
      quotes,
      painPoints,
      dmTargets,
      bestHour: parseInt(bestHour),
      totalSignals: signals.length,
      highIntentCount: highIntentSignals.length,
    };
  }, [signals, outreachMap]);

  // Load saved data
  useEffect(() => {
    if (savedCalendar) {
      setCalendar(savedCalendar);
      setDuration(savedCalendar.duration);
    }
    if (savedProgress) setCompletedTasks(savedProgress);
  }, [savedCalendar, savedProgress]);

  // Find current day
  const currentDay = useMemo(() => {
    if (!calendar?.days) return 1;
    for (let i = 0; i < calendar.days.length; i++) {
      const day = calendar.days[i];
      if (!completedTasks[`${day.day}-primary`]) {
        return day.day;
      }
    }
    return calendar.days.length;
  }, [calendar, completedTasks]);

  // Auto-select current day
  useEffect(() => {
    if (calendar && !selectedDay) {
      setSelectedDay(currentDay);
    }
  }, [calendar, currentDay, selectedDay]);

  // Save to database
  const saveProgress = useCallback(async (newProgress, newCalendar = calendar) => {
    if (!projectId) return;
    setSaving(true);
    try {
      await supabase
        .from('projects')
        .update({
          calendar_data: newCalendar,
          calendar_progress: newProgress,
        })
        .eq('id', projectId);
      
      if (onUpdate) onUpdate({ calendar_data: newCalendar, calendar_progress: newProgress });
    } catch (err) {
      console.error('Failed to save:', err);
    } finally {
      setSaving(false);
    }
  }, [projectId, calendar, onUpdate]);

  // Generate personalized calendar
  const generateCalendar = useCallback((selectedDuration) => {
    const days = generatePersonalizedDays(
      selectedDuration,
      projectName,
      projectPain,
      targetAudience,
      personalization
    );
    
    const newCalendar = {
      duration: selectedDuration,
      days,
      generatedAt: new Date().toISOString(),
      projectName,
      personalization: {
        topSubreddits: personalization.topSubreddits,
        warmLeadCount: personalization.warmLeads.length,
        wouldPayCount: personalization.wouldPayLeads.length,
      },
    };
    
    setCalendar(newCalendar);
    setDuration(selectedDuration);
    setCompletedTasks({});
    setSelectedDay(1);
    saveProgress({}, newCalendar);
  }, [projectName, projectPain, targetAudience, personalization, saveProgress]);

  // Toggle task completion
  const toggleTask = useCallback((dayNum, taskType) => {
    const key = `${dayNum}-${taskType}`;
    const newProgress = { ...completedTasks, [key]: !completedTasks[key] };
    setCompletedTasks(newProgress);
    saveProgress(newProgress);
  }, [completedTasks, saveProgress]);

  // Copy template
  const copyTemplate = async (template, key) => {
    await navigator.clipboard.writeText(template);
    setCopiedTemplate(key);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Calculate progress
  const progress = useMemo(() => {
    if (!calendar?.days) return { completed: 0, total: 0, percent: 0 };
    let total = 0;
    let completed = 0;
    calendar.days.forEach(day => {
      total++;
      if (completedTasks[`${day.day}-primary`]) completed++;
      (day.quickWins || []).forEach((_, i) => {
        total++;
        if (completedTasks[`${day.day}-quick-${i}`]) completed++;
      });
    });
    return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [calendar, completedTasks]);

  // Get phase for a day
  const getPhase = (dayNum) => {
    if (!duration) return null;
    return LAUNCH_PHASES[duration].find(p => p.days.includes(dayNum));
  };

  // ============================================
  // LOCKED STATE
  // ============================================
  if (!isValidated) {
    const remaining = signupGoal - signupCount;
    const progressPercent = Math.min((signupCount / signupGoal) * 100, 100);
    
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center max-w-lg mx-auto">
          <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔒</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">Launch Roadmap Locked</h3>
          <p className="text-[#a1a1aa] mb-8">
            Get <span className="text-[#22c55e] font-bold">{remaining} more signup{remaining !== 1 ? 's' : ''}</span> to unlock your personalized launch plan.
          </p>
          
          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#71717a]">Validation Progress</span>
              <span className="text-[#22c55e] font-semibold">{signupCount} / {signupGoal}</span>
            </div>
            <div className="h-4 bg-[#27272a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Milestone dots */}
          <div className="flex justify-center gap-3 mb-8">
            {Array.from({ length: signupGoal }, (_, i) => (
              <div
                key={i}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${
                  signupCount > i
                    ? 'bg-[#22c55e] text-[#0a0a0b] scale-110'
                    : signupCount === i
                    ? 'bg-[#22c55e]/30 text-[#22c55e] border-2 border-[#22c55e] animate-pulse'
                    : 'bg-[#27272a] text-[#71717a]'
                }`}
              >
                {signupCount > i ? '✓' : i + 1}
              </div>
            ))}
          </div>

          {/* Personalized tips based on their actual data */}
          <div className="bg-[#0a0a0b] rounded-xl p-5 text-left">
            <h4 className="font-semibold mb-4 flex items-center gap-2">
              <span>💡</span> Your best moves right now
            </h4>
            <div className="space-y-3 text-sm">
              {/* DM warm leads */}
              {personalization.warmLeads.length > 0 && (
                <div className="flex items-start gap-3 p-3 bg-[#161618] rounded-lg">
                  <span className="text-green-400">→</span>
                  <div>
                    <p className="text-white font-medium">DM your {personalization.warmLeads.length} warm leads</p>
                    <p className="text-[#71717a] text-xs mt-1">
                      {personalization.dmTargets.wouldPay.length > 0 && (
                        <>u/{personalization.dmTargets.wouldPay[0]?.username} said they'd pay</>
                      )}
                      {personalization.dmTargets.replied.length > 0 && personalization.dmTargets.wouldPay.length === 0 && (
                        <>u/{personalization.dmTargets.replied[0]?.username} replied to you</>
                      )}
                    </p>
                  </div>
                </div>
              )}
              
              {/* Post in top subreddit */}
              {personalization.topSubreddits[0] && (
                <div className="flex items-start gap-3 p-3 bg-[#161618] rounded-lg">
                  <span className="text-orange-400">→</span>
                  <div>
                    <p className="text-white font-medium">Post in r/{personalization.topSubreddits[0].name}</p>
                    <p className="text-[#71717a] text-xs mt-1">
                      {personalization.topSubreddits[0].count} of your signals came from here
                    </p>
                  </div>
                </div>
              )}
              
              {/* Share on Twitter */}
              <div className="flex items-start gap-3 p-3 bg-[#161618] rounded-lg">
                <span className="text-sky-400">→</span>
                <div>
                  <p className="text-white font-medium">Share your landing page on Twitter</p>
                  <p className="text-[#71717a] text-xs mt-1">
                    Mention you validated with {personalization.totalSignals} real signals
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // DURATION SELECTION
  // ============================================
  if (!duration) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🚀</span>
          </div>
          <h3 className="text-2xl font-bold mb-2">You're Validated!</h3>
          <p className="text-[#a1a1aa] mb-2">Choose your launch timeline</p>
          
          {/* Show what we know */}
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="px-3 py-1 bg-[#22c55e]/20 text-[#22c55e] rounded-full text-sm">
              {personalization.warmLeads.length} warm leads
            </span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-full text-sm">
              {personalization.topSubreddits.length} communities
            </span>
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm">
              {personalization.highIntentCount} high-intent signals
            </span>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto">
          {/* 7-day option */}
          <button
            onClick={() => generateCalendar(7)}
            className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-6 text-left hover:border-[#22c55e] transition-all group"
          >
            <div className="text-3xl mb-3">⚡</div>
            <h4 className="font-bold text-lg mb-1 group-hover:text-[#22c55e]">Speed Launch</h4>
            <p className="text-2xl font-bold text-[#22c55e] mb-2">7 days</p>
            <p className="text-sm text-[#a1a1aa] mb-4">
              Fast and focused. DM leads, launch, iterate.
            </p>
            <div className="text-xs text-[#71717a]">
              Best for: {personalization.warmLeads.length >= 3 ? 'You! You have warm leads waiting' : 'Validated ideas ready to ship'}
            </div>
          </button>

          {/* 14-day option */}
          <button
            onClick={() => generateCalendar(14)}
            className="bg-[#0a0a0b] border-2 border-[#22c55e] rounded-xl p-6 text-left relative group"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#22c55e] text-[#0a0a0b] text-xs font-bold rounded-full">
              RECOMMENDED
            </div>
            <div className="text-3xl mb-3">🎯</div>
            <h4 className="font-bold text-lg mb-1">Build in Public</h4>
            <p className="text-2xl font-bold text-[#22c55e] mb-2">14 days</p>
            <p className="text-sm text-[#a1a1aa] mb-4">
              Soft launch → Main launch → Momentum
            </p>
            <div className="text-xs text-[#71717a]">
              Best for: Documenting the journey
            </div>
          </button>

          {/* 21-day option */}
          <button
            onClick={() => generateCalendar(21)}
            className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-6 text-left hover:border-[#22c55e] transition-all group"
          >
            <div className="text-3xl mb-3">📣</div>
            <h4 className="font-bold text-lg mb-1 group-hover:text-[#22c55e]">Full Campaign</h4>
            <p className="text-2xl font-bold text-[#22c55e] mb-2">21 days</p>
            <p className="text-sm text-[#a1a1aa] mb-4">
              Build anticipation with a proper campaign.
            </p>
            <div className="text-xs text-[#71717a]">
              Best for: Building audience from scratch
            </div>
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN CALENDAR VIEW
  // ============================================
  const selectedDayData = calendar?.days?.find(d => d.day === selectedDay);
  const phase = getPhase(selectedDay);
  const phaseColors = phase ? PHASE_COLORS[phase.color] : PHASE_COLORS.green;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              🚀 Your {duration}-Day Launch Plan
              {saving && <span className="text-xs text-[#71717a] font-normal">(saving...)</span>}
            </h3>
            <p className="text-sm text-[#a1a1aa]">
              Personalized for {projectName} • {personalization.warmLeads.length} warm leads ready
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-[#22c55e]">{progress.percent}%</div>
            <div className="text-xs text-[#71717a]">{progress.completed}/{progress.total} tasks</div>
          </div>
        </div>
        
        {/* Progress bar */}
        <div className="relative">
          <div className="h-3 bg-[#27272a] rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {LAUNCH_PHASES[duration].map((p, i) => (
              <div key={i} className="text-center" style={{ width: `${(p.days.length / duration) * 100}%` }}>
                <span className={`text-xs ${PHASE_COLORS[p.color].text}`}>{p.icon} {p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Your Assets Panel */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-5">
        <h4 className="font-semibold mb-4 flex items-center gap-2">
          <span>🎯</span> Your Launch Assets
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-[#0a0a0b] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-green-400">{personalization.wouldPayLeads.length}</div>
            <div className="text-xs text-[#71717a]">"I'd Pay" Leads</div>
          </div>
          <div className="bg-[#0a0a0b] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-blue-400">{personalization.warmLeads.length}</div>
            <div className="text-xs text-[#71717a]">Warm Leads</div>
          </div>
          <div className="bg-[#0a0a0b] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-orange-400">{personalization.topSubreddits.length}</div>
            <div className="text-xs text-[#71717a]">Communities</div>
          </div>
          <div className="bg-[#0a0a0b] rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-purple-400">{personalization.quotes.length}</div>
            <div className="text-xs text-[#71717a]">User Quotes</div>
          </div>
        </div>
        
        {/* Top Communities */}
        {personalization.topSubreddits.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {personalization.topSubreddits.slice(0, 4).map((sub, i) => (
              <span key={i} className="px-3 py-1 bg-orange-500/10 text-orange-400 rounded-full text-sm">
                r/{sub.name} ({sub.count})
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">
        {/* Day selector */}
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-4 h-fit">
          <h4 className="font-semibold mb-3 text-sm text-[#71717a]">Select Day</h4>
          <div className="space-y-1 max-h-[400px] overflow-y-auto pr-2">
            {calendar?.days?.map((day) => {
              const dayPhase = getPhase(day.day);
              const dayColors = PHASE_COLORS[dayPhase?.color || 'green'];
              const isComplete = completedTasks[`${day.day}-primary`];
              const isActive = day.day === selectedDay;
              const isCurrent = day.day === currentDay;

              return (
                <button
                  key={day.day}
                  onClick={() => setSelectedDay(day.day)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
                    isActive 
                      ? `${dayColors.bg} ${dayColors.border} border` 
                      : 'hover:bg-[#1a1a1c]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    isComplete 
                      ? 'bg-[#22c55e] text-[#0a0a0b]' 
                      : isCurrent
                      ? `${dayColors.badge} ${dayColors.text} ring-2 ring-offset-2 ring-offset-[#161618] ring-[#22c55e]`
                      : 'bg-[#27272a] text-white'
                  }`}>
                    {isComplete ? '✓' : day.day}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-sm font-medium truncate ${isComplete ? 'text-[#71717a]' : ''}`}>
                      {day.primary.title}
                    </div>
                    <div className="text-xs text-[#71717a] truncate">
                      {dayPhase?.icon} {dayPhase?.name}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main content */}
        <div className="space-y-4">
          {selectedDayData && (
            <div className={`${phaseColors.bg} border ${phaseColors.border} rounded-2xl p-6`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${phaseColors.badge} ${phaseColors.text}`}>
                    {phase?.icon} Day {selectedDay} • {phase?.name}
                  </span>
                  {selectedDay === currentDay && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-[#22c55e]/20 text-[#22c55e]">
                      TODAY
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#71717a]">⏱ {selectedDayData.primary.time}</span>
              </div>

              {/* Primary Task */}
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleTask(selectedDay, 'primary')}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                    completedTasks[`${selectedDay}-primary`]
                      ? 'bg-[#22c55e] text-[#0a0a0b]'
                      : 'bg-[#27272a] hover:bg-[#3f3f46]'
                  }`}
                >
                  {completedTasks[`${selectedDay}-primary`] ? (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span className="text-lg">{TASK_TYPES[selectedDayData.primary.type]?.icon || '📌'}</span>
                  )}
                </button>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${TASK_TYPES[selectedDayData.primary.type]?.bg || 'bg-[#27272a]'} ${TASK_TYPES[selectedDayData.primary.type]?.color || 'text-white'}`}>
                      {TASK_TYPES[selectedDayData.primary.type]?.label || 'Task'}
                    </span>
                  </div>
                  <h4 className={`text-xl font-bold mb-2 ${completedTasks[`${selectedDay}-primary`] ? 'line-through text-[#71717a]' : ''}`}>
                    {selectedDayData.primary.title}
                  </h4>
                  <p className="text-[#a1a1aa] mb-4">{selectedDayData.primary.description}</p>
                  
                  {/* Why */}
                  <div className="bg-[#0a0a0b]/50 rounded-lg p-3 mb-4">
                    <p className="text-sm text-[#71717a]">
                      <span className="text-white font-medium">Why:</span> {selectedDayData.primary.why}
                    </p>
                  </div>

                  {/* Personalized targets */}
                  {selectedDayData.primary.targets && selectedDayData.primary.targets.length > 0 && (
                    <div className="bg-[#0a0a0b] rounded-xl p-4 border border-[#27272a] mb-4">
                      <div className="text-xs font-medium text-[#71717a] mb-3">👤 Your targets:</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDayData.primary.targets.map((target, i) => (
                          <a
                            key={i}
                            href={`https://reddit.com/u/${target.username}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-[#161618] rounded-lg text-sm hover:bg-[#1a1a1c] transition-colors flex items-center gap-2"
                          >
                            <span className="text-[#22c55e]">u/{target.username}</span>
                            {target.subreddit && <span className="text-[#71717a] text-xs">r/{target.subreddit}</span>}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Template */}
                  {selectedDayData.primary.template && (
                    <div className="bg-[#0a0a0b] rounded-xl p-4 border border-[#27272a]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-[#71717a]">📝 Your personalized template</span>
                        <button
                          onClick={() => copyTemplate(selectedDayData.primary.template, `${selectedDay}-primary`)}
                          className="px-3 py-1 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-xs font-medium transition-colors"
                        >
                          {copiedTemplate === `${selectedDay}-primary` ? '✓ Copied!' : 'Copy'}
                        </button>
                      </div>
                      <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap font-mono leading-relaxed">{selectedDayData.primary.template}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quick Wins */}
          {selectedDayData?.quickWins?.length > 0 && (
            <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-5">
              <h4 className="font-semibold mb-4 flex items-center gap-2">
                ⚡ Quick Wins
                <span className="text-xs text-[#71717a] font-normal">Optional extras</span>
              </h4>
              
              <div className="space-y-3">
                {selectedDayData.quickWins.map((task, i) => {
                  const taskKey = `${selectedDay}-quick-${i}`;
                  const isComplete = completedTasks[taskKey];
                  
                  return (
                    <div key={i} className={`flex items-start gap-3 p-3 rounded-xl transition-all ${isComplete ? 'bg-[#22c55e]/5' : 'bg-[#0a0a0b]'}`}>
                      <button
                        onClick={() => toggleTask(selectedDay, `quick-${i}`)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                          isComplete
                            ? 'bg-[#22c55e] text-[#0a0a0b]'
                            : 'bg-[#27272a] hover:bg-[#3f3f46]'
                        }`}
                      >
                        {isComplete ? '✓' : <span className="text-sm">{TASK_TYPES[task.type]?.icon || '📌'}</span>}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-1.5 py-0.5 rounded ${TASK_TYPES[task.type]?.bg || 'bg-[#27272a]'} ${TASK_TYPES[task.type]?.color || 'text-white'}`}>
                            {TASK_TYPES[task.type]?.label}
                          </span>
                          <span className="text-xs text-[#71717a]">⏱ {task.time}</span>
                        </div>
                        <p className={`font-medium ${isComplete ? 'line-through text-[#71717a]' : ''}`}>{task.title}</p>
                        
                        {task.template && (
                          <button
                            onClick={() => copyTemplate(task.template, taskKey)}
                            className="mt-2 text-xs text-[#22c55e] hover:text-[#16a34a]"
                          >
                            {copiedTemplate === taskKey ? '✓ Copied!' : '📋 Copy template'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All Templates */}
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowAllTemplates(!showAllTemplates)}
              className="w-full flex items-center justify-between p-5 hover:bg-[#1a1a1c] transition-colors"
            >
              <h4 className="font-semibold flex items-center gap-2">
                📋 All Templates for Day {selectedDay}
              </h4>
              <svg className={`w-5 h-5 text-[#71717a] transition-transform ${showAllTemplates ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAllTemplates && (
              <div className="px-5 pb-5 space-y-4">
                {selectedDayData?.primary?.template && (
                  <div className="bg-[#0a0a0b] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{selectedDayData.primary.title}</span>
                      <button
                        onClick={() => copyTemplate(selectedDayData.primary.template, 'all-primary')}
                        className="px-3 py-1 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-xs transition-colors"
                      >
                        {copiedTemplate === 'all-primary' ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-[#a1a1aa] font-mono whitespace-pre-wrap">{selectedDayData.primary.template}</p>
                  </div>
                )}
                
                {selectedDayData?.quickWins?.filter(q => q.template).map((task, i) => (
                  <div key={i} className="bg-[#0a0a0b] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">{task.title}</span>
                      <button
                        onClick={() => copyTemplate(task.template, `all-quick-${i}`)}
                        className="px-3 py-1 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-xs transition-colors"
                      >
                        {copiedTemplate === `all-quick-${i}` ? '✓' : 'Copy'}
                      </button>
                    </div>
                    <p className="text-sm text-[#a1a1aa] font-mono whitespace-pre-wrap">{task.template}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reset */}
      <div className="text-center">
        <button
          onClick={() => {
            setDuration(null);
            setCalendar(null);
            setSelectedDay(null);
          }}
          className="text-sm text-[#71717a] hover:text-white transition-colors"
        >
          ↩ Choose different timeline
        </button>
      </div>
    </div>
  );
}

// ============================================
// PERSONALIZED DAY GENERATION
// ============================================
function generatePersonalizedDays(duration, projectName, projectPain, targetAudience, p) {
  const mainSub = p.topSubreddits[0]?.name || 'startups';
  const secondSub = p.topSubreddits[1]?.name || 'entrepreneur';
  const thirdSub = p.topSubreddits[2]?.name || 'SideProject';
  
  // Get actual usernames for DM tasks
  const wouldPayUsers = p.dmTargets.wouldPay;
  const repliedUsers = p.dmTargets.replied;
  const interestedUsers = p.dmTargets.interested;
  const allWarmUsers = [...wouldPayUsers, ...repliedUsers, ...interestedUsers];
  
  // Get a real quote for social proof
  const bestQuote = p.quotes[0]?.text || '';
  const quoteAuthor = p.quotes[0]?.author || '';
  
  // Extract a pain point for templates
  const painPoint = projectPain || p.painPoints[0]?.text || 'this problem';
  const shortPain = painPoint.length > 50 ? painPoint.slice(0, 47) + '...' : painPoint;

  // ==================
  // 7-DAY LAUNCH
  // ==================
  if (duration === 7) {
    return [
      {
        day: 1,
        primary: {
          type: 'dm',
          title: `DM your ${wouldPayUsers.length > 0 ? wouldPayUsers.length + ' "I\'d pay"' : allWarmUsers.length + ' warm'} leads`,
          description: `These people already showed interest. Let them know ${projectName} is ready.`,
          why: `${wouldPayUsers.length > 0 ? 'These people literally said they\'d pay. ' : ''}They should hear from you first before the public launch.`,
          time: '30 min',
          targets: allWarmUsers.slice(0, 5),
          template: `Hey! We chatted about ${shortPain} a while back.

I built ${projectName} to solve this - it's ready now.

Would love for you to be one of the first to try it. Free access for you since you helped validate the idea.

Interested?`,
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Tease the launch', 
            time: '10 min',
            template: `Building something for ${targetAudience} who ${shortPain}.

Validated with ${p.totalSignals} real people first. ${p.wouldPayLeads.length > 0 ? p.wouldPayLeads.length + ' said they\'d pay before I wrote code.' : ''}

Launching this week 👀`,
          },
        ],
      },
      {
        day: 2,
        primary: {
          type: 'reddit',
          title: `Launch in r/${mainSub}`,
          description: `${p.topSubreddits[0]?.count || 'Most'} of your validation signals came from here. This is your community.`,
          why: `You found real demand here. Now deliver the solution back to this community.`,
          time: '30 min',
          template: `I built ${projectName} after seeing so many posts here about ${shortPain}

Here's what it does:
• [Main feature that solves the pain]
• [Second feature]
• [Third feature]

I validated with ${p.totalSignals} people from communities like this before building.${p.wouldPayLeads.length > 0 ? ` ${p.wouldPayLeads.length} said they'd pay.` : ''}

Free to try - would genuinely love feedback from r/${mainSub}.

[link]`,
        },
        quickWins: [
          { type: 'engage', title: 'Reply to every comment within 2 hours', time: '20 min' },
        ],
      },
      {
        day: 3,
        primary: {
          type: 'twitter',
          title: `Launch ${projectName} on Twitter`,
          description: 'Your main launch tweet + thread. Tell the validation-first story.',
          why: 'The build-in-public community loves the "validated before building" angle. Use it.',
          time: '45 min',
          template: `${projectName} is live 🚀

I talked to ${p.totalSignals} ${targetAudience} about ${shortPain}.

${p.wouldPayLeads.length > 0 ? `${p.wouldPayLeads.length} said "I'd pay for this" before I wrote a line of code.` : 'The demand was real.'}

So I built it.

Here's what it does and how we got here 🧵

[1/7]`,
        },
        quickWins: [
          { type: 'dm', title: 'Ask 3 supporters to retweet', time: '10 min' },
          { type: 'engage', title: 'Reply to every single comment', time: '30 min' },
        ],
      },
      {
        day: 4,
        primary: {
          type: 'engage',
          title: 'Be everywhere - respond to everything',
          description: 'Camp on Reddit and Twitter. Reply to every comment, DM, and mention.',
          why: 'Launch momentum comes from engagement. Every reply = more visibility.',
          time: '1 hour',
        },
        quickWins: [
          { 
            type: 'reddit', 
            title: `Cross-post to r/${secondSub}`, 
            time: '15 min',
            template: `Built a tool for ${targetAudience} - looking for feedback from r/${secondSub}

Yesterday I launched ${projectName} in r/${mainSub} and got great feedback.

Thought this community might find it useful too since you deal with ${shortPain}.

Free to try: [link]`,
          },
        ],
      },
      {
        day: 5,
        primary: {
          type: 'twitter',
          title: 'Share honest launch results',
          description: 'Post your real numbers. Signups, feedback, bugs fixed. Be transparent.',
          why: 'Real metrics resonate. Other founders appreciate honesty over hype.',
          time: '20 min',
          template: `48 hours since ${projectName} launched:

📊 X signups
💬 Y feedback messages
🐛 Z bugs found & fixed
${p.quotes[0] ? `\n"${p.quotes[0].text.slice(0, 80)}..." - early user` : ''}

Not viral. Just real.

What's next: [Your priority]`,
        },
        quickWins: [
          { type: 'dm', title: 'Ask active users for quick feedback', time: '15 min' },
        ],
      },
      {
        day: 6,
        primary: {
          type: 'dm',
          title: 'Request testimonials from happy users',
          description: 'Reach out to anyone who said something positive. Ask for a testimonial.',
          why: 'Testimonials are your best marketing asset. Get them while the experience is fresh.',
          time: '30 min',
          template: `Hey [name]!

Thanks for trying ${projectName} - really appreciate the early support.

Would you mind sharing a quick testimonial? Even 1-2 sentences about your experience would mean a lot.

No pressure at all. Either way, thanks for being an early user 🙏`,
        },
        quickWins: [
          { type: 'build', title: 'Ship the #1 requested feature', time: '30 min' },
          { 
            type: 'twitter', 
            title: 'Share what you shipped', 
            time: '5 min',
            template: `Shipped the #1 requested feature for ${projectName}:

[Feature name]

User feedback → shipped in 48 hours.

This is why you launch early.`,
          },
        ],
      },
      {
        day: 7,
        primary: {
          type: 'content',
          title: 'Write your week 1 recap',
          description: 'Document everything: what worked, what didn\'t, metrics, learnings.',
          why: 'This becomes content + helps you reflect on what to focus on next.',
          time: '45 min',
          template: `One week since I launched ${projectName}:

📊 The numbers:
• X signups
• Y active users
• Z pieces of feedback

✅ What worked:
• Validating before building (talked to ${p.totalSignals} people)
• Launching in r/${mainSub} first
• [One more thing]

❌ What I'd do differently:
• [Learning]

🎯 Week 2 focus:
• [Priority]

The validation-first approach works. Here's the full story 👇`,
        },
        quickWins: [
          { type: 'twitter', title: 'Post the recap thread', time: '10 min' },
        ],
      },
    ];
  }

  // ==================
  // 14-DAY LAUNCH
  // ==================
  if (duration === 14) {
    return [
      // Days 1-3: Warm Up
      {
        day: 1,
        primary: {
          type: 'dm',
          title: `Alert your ${allWarmUsers.length || 'warm'} leads that you're launching`,
          description: 'Give them a heads-up before anyone else. They helped validate - they should know first.',
          why: 'These people already invested time helping you. Make them feel special.',
          time: '30 min',
          targets: allWarmUsers.slice(0, 5),
          template: `Hey! Quick heads up - ${projectName} is almost ready.

You mentioned ${shortPain} when we chatted, and that feedback helped shape what I built.

Launching publicly next week, but wanted to give you early access first.

Want in?`,
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Announce something is coming', 
            time: '10 min',
            template: `Something I've been building is almost ready.

Talked to ${p.totalSignals} ${targetAudience} first.${p.wouldPayLeads.length > 0 ? ` ${p.wouldPayLeads.length} said they'd pay before I wrote code.` : ''}

Launching next week.

More soon 👀`,
          },
        ],
      },
      {
        day: 2,
        primary: {
          type: 'twitter',
          title: 'Share a sneak peek',
          description: 'Post a screenshot or demo. Give people something visual to see.',
          why: 'Visual content gets way more engagement. Show don\'t tell.',
          time: '20 min',
          template: `Building ${projectName} for ${targetAudience} who ${shortPain}

Here's a sneak peek:

[screenshot]

This feature came directly from validation conversations.

Launching in 1 week.`,
        },
        quickWins: [],
      },
      {
        day: 3,
        primary: {
          type: 'twitter',
          title: 'Share WHY you\'re building this',
          description: 'Tell your story. Why does this problem matter to you personally?',
          why: 'People connect with stories. Your "why" makes you memorable.',
          time: '25 min',
          template: `Why I'm building ${projectName}:

${projectPain ? `I kept seeing ${targetAudience} struggle with ${shortPain}.` : `I experienced ${shortPain} myself.`}

Talked to ${p.totalSignals} people about it. The problem is real.${p.wouldPayLeads.length > 0 ? ` ${p.wouldPayLeads.length} said they'd pay for a solution.` : ''}

So I'm building one.

Launching next week in r/${mainSub} and here.`,
        },
        quickWins: [
          { type: 'engage', title: 'Reply to everyone who engages', time: '15 min' },
        ],
      },
      // Days 4-7: Soft Launch
      {
        day: 4,
        primary: {
          type: 'dm',
          title: `Soft launch to your ${allWarmUsers.length > 0 ? allWarmUsers.length : ''} warm leads`,
          description: 'Give your earliest supporters access first. Get feedback before the public sees it.',
          why: 'Fix issues before the big push. Plus they\'ll feel valued.',
          time: '45 min',
          targets: allWarmUsers.slice(0, 6),
          template: `Hey! ${projectName} is ready for you to try.

Since you helped validate the idea, I wanted you to be one of the first to see it.

Link: [link]

Would love your honest feedback - what works, what doesn't, what's confusing.

Thanks for being an early supporter 🙏`,
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Announce soft launch', 
            time: '10 min',
            template: `${projectName} soft launch is live 🎉

Opening to a small group first to get feedback.

Want early access? Reply or DM.`,
          },
        ],
      },
      {
        day: 5,
        primary: {
          type: 'reddit',
          title: `Soft launch in r/${mainSub}`,
          description: 'Ask for feedback, not just users. This framing works better.',
          why: 'Reddit respects humility. "Looking for feedback" beats "check out my thing".',
          time: '30 min',
          template: `Built something for this community - looking for honest feedback

I noticed a lot of posts here about ${shortPain}.

So I built ${projectName} to help.

It's in beta - not perfect yet. Would love honest feedback from r/${mainSub} before the full launch.

What it does:
• [Feature 1]
• [Feature 2]

Free to try: [link]

What's missing? What's confusing? What would make it actually useful?`,
        },
        quickWins: [
          { type: 'engage', title: 'Camp Reddit and reply to everything', time: '30 min' },
        ],
      },
      {
        day: 6,
        primary: {
          type: 'build',
          title: 'Fix the top 3 issues from soft launch',
          description: 'Compile feedback from soft launch users. Fix the quick wins.',
          why: 'Shipping fixes fast = trust + loyalty. It shows you listen.',
          time: '1 hour',
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Share what you fixed', 
            time: '10 min',
            template: `Soft launch feedback = gold

Already shipped:
✅ [Fix 1]
✅ [Fix 2]
✅ [Fix 3]

This is why you launch to a small group first.

Public launch: [date]`,
          },
        ],
      },
      {
        day: 7,
        primary: {
          type: 'content',
          title: 'Prep all your launch content',
          description: 'Write your Twitter thread, Reddit post, email. Everything ready to go.',
          why: 'Launch day should be about engaging, not writing. Prep everything now.',
          time: '1 hour',
          template: `${projectName} launches tomorrow 🚀

Quick thread on what I learned validating this idea:

1/ Talked to ${p.totalSignals} ${targetAudience} before writing code
2/ Found ${p.highIntentCount} with high intent to pay
3/ Top pain: ${shortPain}
4/ Built only what people asked for

Full launch tomorrow.`,
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Tease launch day', 
            time: '10 min',
            template: `${projectName} public launch: Tomorrow

Soft launch feedback helped fix ${3} things.

Ready to share with everyone.

See you tomorrow 🚀`,
          },
        ],
      },
      // Days 8-10: Main Launch
      {
        day: 8,
        primary: {
          type: 'twitter',
          title: '🚀 LAUNCH DAY on Twitter',
          description: 'Post your launch tweet and thread. This is the big day!',
          why: 'Lead with your build-in-public audience. They love launch stories.',
          time: '1 hour',
          template: `${projectName} is live 🚀

Validated first. Built second.

${p.totalSignals} ${targetAudience} told me about ${shortPain}.
${p.wouldPayLeads.length > 0 ? `${p.wouldPayLeads.length} said "I'd pay" before I coded anything.` : 'The demand was clear.'}

So I built it.

Here's the full story + what it does 🧵`,
        },
        quickWins: [
          { type: 'dm', title: 'Ask 5 supporters to retweet', time: '15 min' },
          { type: 'engage', title: 'Reply to EVERY comment for 2 hours', time: '30 min' },
        ],
      },
      {
        day: 9,
        primary: {
          type: 'reddit',
          title: `Full launch in r/${mainSub} and r/${secondSub}`,
          description: 'Post your launch in both communities. Tell the validation story.',
          why: 'These communities validated your idea. Now they get first access.',
          time: '45 min',
          template: `I validated with r/${mainSub} before building - here's the result

A few weeks ago I noticed posts here about ${shortPain}.

I reached out to people who posted about it. ${p.totalSignals} responses.${p.wouldPayLeads.length > 0 ? ` ${p.wouldPayLeads.length} said they'd pay.` : ''}

So I built ${projectName}.

What it does:
• [Feature 1] - directly from user feedback
• [Feature 2] - most requested
• [Feature 3]

Free to try. Would love feedback from the community that helped validate this.

[link]`,
        },
        quickWins: [
          { type: 'engage', title: 'Stay on Reddit and reply to everything', time: '30 min' },
        ],
      },
      {
        day: 10,
        primary: {
          type: 'twitter',
          title: 'Share 48-hour results',
          description: 'Post honest metrics. Be real, not hype.',
          why: 'Transparency builds trust. Other founders respect real numbers.',
          time: '20 min',
          template: `48 hours since ${projectName} launched:

📊 ${signupGoal}+ signups
💬 ${p.quotes.length > 0 ? 'Great' : 'Solid'} feedback
🐛 ${2} bugs fixed same-day
${p.quotes[0] ? `\n"${p.quotes[0].text.slice(0, 70)}..." - @${p.quotes[0].author}` : ''}

Not viral. Just real.

Grateful for everyone who tried it 🙏`,
        },
        quickWins: [
          { type: 'engage', title: 'Continue engaging everywhere', time: '20 min' },
        ],
      },
      // Days 11-14: Momentum
      {
        day: 11,
        primary: {
          type: 'dm',
          title: 'Ask for testimonials',
          description: 'Reach out to anyone who said something positive. Ask for a quote.',
          why: 'Testimonials > your marketing. Get them while fresh.',
          time: '30 min',
          targets: wouldPayUsers.slice(0, 3),
          template: `Hey [name]!

Thanks for being an early ${projectName} user.

Would you mind sharing a quick testimonial? Even 1-2 sentences would help a lot.

No pressure either way - just appreciate you trying it 🙏`,
        },
        quickWins: [
          { type: 'build', title: 'Ship the most-requested feature', time: '30 min' },
        ],
      },
      {
        day: 12,
        primary: {
          type: 'twitter',
          title: 'Share a user testimonial or win',
          description: 'Post a real quote or success story from a user.',
          why: 'Social proof converts better than anything you can say.',
          time: '15 min',
          template: `${p.quotes[0] ? `"${p.quotes[0].text}"\n\n- ${p.quotes[0].author ? '@' + p.quotes[0].author : 'Early user'}` : '"[User testimonial]"\n\n- @username'}

This is why I validated before building.

${projectName}: [link]`,
        },
        quickWins: [
          { 
            type: 'reddit', 
            title: 'Post update in communities', 
            time: '15 min',
            template: `Update: ${projectName} one week later

Posted the launch here last week. Here's what happened:

• X users signed up
• Shipped [new feature] based on feedback
• Fixed [issue] that people mentioned

Thanks for the support r/${mainSub}!`,
          },
        ],
      },
      {
        day: 13,
        primary: {
          type: 'content',
          title: 'Create a quick demo video',
          description: 'Record a 2-min Loom. Show the core value. Keep it simple.',
          why: 'Video converts way better than screenshots.',
          time: '30 min',
        },
        quickWins: [
          { 
            type: 'twitter', 
            title: 'Share the demo', 
            time: '10 min',
            template: `${projectName} in 2 minutes:

[video]

Built for ${targetAudience} who ${shortPain}.

Try it: [link]`,
          },
        ],
      },
      {
        day: 14,
        primary: {
          type: 'content',
          title: 'Write your 2-week launch story',
          description: 'Document the full journey: validation → build → launch → results.',
          why: 'This is your case study. Use it for content for months.',
          time: '45 min',
          template: `2 weeks ago I launched ${projectName}.

Here's the full story:

📊 Validation:
• Talked to ${p.totalSignals} ${targetAudience}
• ${p.wouldPayLeads.length > 0 ? `${p.wouldPayLeads.length} said they'd pay` : 'Found real demand'}
• Top communities: r/${mainSub}, r/${secondSub}

🚀 Launch results:
• X users
• Y testimonials
• Z revenue (if any)

✅ What worked:
• Validating first (this changed everything)
• Launching to my validation community
• Responding to every comment

❌ What I'd do differently:
• [Learning]

🎯 What's next:
• [Priority]

Full thread 👇`,
        },
        quickWins: [
          { type: 'twitter', title: 'Post the story thread', time: '15 min' },
        ],
      },
    ];
  }

  // ==================
  // 21-DAY LAUNCH (condensed version)
  // ==================
  return [
    // Days 1-5: Build Hype
    { day: 1, primary: { type: 'twitter', title: 'Announce you\'re building something', description: 'Plant the seed. Get people curious.', why: 'Start building anticipation early.', time: '15 min', template: `Starting something new.\n\nTalked to ${p.totalSignals} ${targetAudience} about ${shortPain}.\n\nThe problem is real. Building the solution now.\n\nDay 1. Let's go.` }, quickWins: [] },
    { day: 2, primary: { type: 'twitter', title: 'Explain the problem you\'re solving', description: 'Deep dive into the pain. No solution yet.', why: 'People who relate will follow along.', time: '20 min', template: `The problem I'm solving:\n\n${shortPain}\n\n${p.quotes[0] ? `Real quote from validation: "${p.quotes[0].text.slice(0, 80)}..."` : `Talked to ${p.totalSignals} people. It's everywhere.`}\n\nBuilding something to fix this.` }, quickWins: [{ type: 'engage', title: 'Reply to everyone', time: '10 min' }] },
    { day: 3, primary: { type: 'twitter', title: 'Show first progress', description: 'Share a screenshot or mockup.', why: 'Visual progress is exciting and shareable.', time: '20 min', template: `Day 3 of building for ${targetAudience}:\n\n[screenshot]\n\nStill early. But taking shape.\n\nThis feature came directly from validation interviews.` }, quickWins: [] },
    { day: 4, primary: { type: 'reddit', title: `Introduce yourself in r/${mainSub}`, description: 'Ask for input. Build relationships.', why: 'Start community relationships before you need them.', time: '30 min', template: `Building something for this community - looking for early input\n\nHey r/${mainSub}!\n\nI'm building ${projectName} to solve ${shortPain}.\n\nStill early - would love feedback on what features matter most.\n\n[screenshot]` }, quickWins: [] },
    { day: 5, primary: { type: 'twitter', title: 'Share behind the scenes', description: 'Your process, decisions, stack.', why: 'The journey is as interesting as the destination.', time: '20 min', template: `Behind the scenes building ${projectName}:\n\n[Your insight]\n\nLaunching in 2 weeks.` }, quickWins: [] },
    
    // Days 6-8: Warm Up  
    { day: 6, primary: { type: 'dm', title: `Give warm leads early preview`, description: 'Your validated contacts see it first.', why: 'Make them feel special. They\'ll support launch day.', time: '30 min', targets: allWarmUsers.slice(0, 4), template: `Hey! Remember ${shortPain}?\n\nI've been building something to solve it - here's an early preview:\n\n[screenshot]\n\nLaunching in ~10 days. Want early access?` }, quickWins: [] },
    { day: 7, primary: { type: 'twitter', title: 'Announce launch date', description: 'Give a specific date.', why: 'Deadlines create urgency and commitment.', time: '15 min', template: `${projectName} launches [DATE].\n\n${p.totalSignals} ${targetAudience} validated the idea.\n\nBuilding in public for 2 weeks. Almost there.\n\n[screenshot]` }, quickWins: [] },
    { day: 8, primary: { type: 'content', title: 'Create waitlist/early access page', description: 'Capture interest now.', why: 'Convert anticipation into commitments.', time: '45 min' }, quickWins: [{ type: 'twitter', title: 'Share waitlist', time: '10 min' }] },
    
    // Days 9-12: Soft Launch
    { day: 9, primary: { type: 'dm', title: 'Open soft launch', description: 'Let warm leads in first.', why: 'Feedback before public launch.', time: '30 min', targets: allWarmUsers.slice(0, 5), template: `Hey! ${projectName} is ready for you.\n\nYou helped validate the idea - here's your early access:\n\n[link]\n\nWould love honest feedback.` }, quickWins: [] },
    { day: 10, primary: { type: 'reddit', title: `Soft launch in r/${mainSub}`, description: 'Ask for feedback, not users.', why: 'Reddit respects humility.', time: '30 min', template: `Soft launching the tool I mentioned - looking for beta feedback\n\nPosted about ${projectName} last week. It's ready for testing.\n\nFree to try - would love honest feedback before full launch.\n\n[link]` }, quickWins: [] },
    { day: 11, primary: { type: 'build', title: 'Fix top feedback issues', description: 'Ship fixes fast.', why: 'Shows you listen. Builds trust.', time: '1 hour' }, quickWins: [{ type: 'twitter', title: 'Share fixes', time: '10 min' }] },
    { day: 12, primary: { type: 'twitter', title: 'Share soft launch learnings', description: 'What you learned from early users.', why: 'Transparency builds trust.', time: '20 min', template: `Soft launch feedback:\n\n✅ What worked: [thing]\n⚠️ Fixed: [thing]\n\nPublic launch in 3 days.` }, quickWins: [] },
    
    // Days 13-15: Main Launch
    { day: 13, primary: { type: 'content', title: 'Final launch prep', description: 'Write all content. Screenshots, copy, links.', why: 'Launch day = engaging, not writing.', time: '1 hour' }, quickWins: [{ type: 'twitter', title: 'Tomorrow teaser', time: '10 min', template: `Tomorrow: ${projectName} launches publicly.\n\n3 weeks of building in public.\n\nSee you tomorrow 🚀` }] },
    { day: 14, primary: { type: 'twitter', title: '🚀 LAUNCH DAY', description: 'Post your launch thread!', why: 'This is it!', time: '1 hour', template: `${projectName} is live 🚀\n\nValidated with ${p.totalSignals} ${targetAudience}. Built in 3 weeks.\n\nFull story 🧵` }, quickWins: [{ type: 'dm', title: 'Ask for retweets', time: '15 min' }, { type: 'engage', title: 'Reply to everything', time: '30 min' }] },
    { day: 15, primary: { type: 'reddit', title: 'Reddit launch day', description: `Post in r/${mainSub} and r/${secondSub}.`, why: 'Your validation communities.', time: '45 min', template: `Validated here, now launching: ${projectName}\n\nThis community helped me validate ${shortPain} as a real problem.\n\nNow it's built. Free to try: [link]` }, quickWins: [] },
    
    // Days 16-21: Momentum
    { day: 16, primary: { type: 'twitter', title: 'Share launch results', description: 'Post honest 48-hour numbers.', why: 'Transparency resonates.', time: '20 min', template: `48 hours post-launch:\n\n📊 X signups\n💬 Y feedback items\n🐛 Z bugs fixed\n\nReal numbers. Grateful 🙏` }, quickWins: [] },
    { day: 17, primary: { type: 'dm', title: 'Request testimonials', description: 'Ask happy users for quotes.', why: 'Best marketing asset.', time: '30 min', targets: wouldPayUsers.slice(0, 3), template: `Thanks for trying ${projectName}!\n\nWould you share a quick testimonial? 1-2 sentences would help a lot.\n\nNo pressure 🙏` }, quickWins: [] },
    { day: 18, primary: { type: 'twitter', title: 'Share user testimonial', description: 'Post a real quote.', why: 'Social proof sells.', time: '15 min', template: `${p.quotes[0] ? `"${p.quotes[0].text}"\n\n- @${p.quotes[0].author || 'early user'}` : '"[testimonial]"'}\n\n${projectName}: [link]` }, quickWins: [] },
    { day: 19, primary: { type: 'content', title: 'Create demo video', description: '2-min Loom.', why: 'Video converts best.', time: '30 min' }, quickWins: [{ type: 'twitter', title: 'Share demo', time: '10 min' }] },
    { day: 20, primary: { type: 'twitter', title: 'Week 1 metrics', description: 'Full breakdown thread.', why: 'Detailed content for founders.', time: '30 min', template: `Week 1 of ${projectName}:\n\n📊 X users\n💬 Y feedback\n🔨 Z shipped\n\nThread 👇` }, quickWins: [] },
    { day: 21, primary: { type: 'content', title: 'Write complete launch story', description: 'Full documentation.', why: 'Your case study forever.', time: '1 hour', template: `21 days ago I started building ${projectName}.\n\nFrom validation to ${signupGoal}+ users.\n\nComplete story 🧵` }, quickWins: [{ type: 'twitter', title: 'Publish story', time: '15 min' }] },
  ];
}