'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const CATEGORY_STYLES = {
  build: { bg: 'bg-blue-500/20', border: 'border-blue-500/50', text: 'text-blue-400', icon: '🔨' },
  tweet: { bg: 'bg-sky-500/20', border: 'border-sky-500/50', text: 'text-sky-400', icon: '🐦' },
  reddit: { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', icon: '📝' },
  outreach: { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-400', icon: '💬' },
  content: { bg: 'bg-purple-500/20', border: 'border-purple-500/50', text: 'text-purple-400', icon: '✍️' },
};

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function LaunchCalendar({ 
  projectId,
  signals, 
  outreachMap, 
  isValidated, 
  signupCount = 0,
  signupGoal = 5,
  projectName, 
  projectPain,
  targetAudience,
  savedCalendar,
  savedProgress,
  onUpdate,
}) {
  const [calendar, setCalendar] = useState(savedCalendar || null);
  const [loading, setLoading] = useState(false);
  const [completedTasks, setCompletedTasks] = useState(savedProgress || {});
  const [expandedDay, setExpandedDay] = useState(null);
  const [copiedTemplate, setCopiedTemplate] = useState(null);
  const [saving, setSaving] = useState(false);

  // Load saved data on mount
  useEffect(() => {
    if (savedCalendar) setCalendar(savedCalendar);
    if (savedProgress) setCompletedTasks(savedProgress);
  }, [savedCalendar, savedProgress]);

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

  // Save to database
  const saveProgress = useCallback(async (newProgress, newCalendar = calendar) => {
    if (!projectId) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          calendar_data: newCalendar,
          calendar_progress: newProgress,
        })
        .eq('id', projectId);
      
      if (error) throw error;
      if (onUpdate) onUpdate({ calendar_data: newCalendar, calendar_progress: newProgress });
    } catch (err) {
      console.error('Failed to save calendar:', err);
    } finally {
      setSaving(false);
    }
  }, [projectId, calendar, onUpdate]);

  const generateCalendar = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      const mainCommunity = communityBreakdown[0]?.name || 'startups';
      const newCalendar = {
        mvpFeatures: extractFeatures(signals),
        days: generateDefaultDays(projectName, mainCommunity, communityBreakdown),
        summary: `28-day build-in-public plan for ${projectName}`,
        generatedAt: new Date().toISOString(),
      };
      setCalendar(newCalendar);
      setCompletedTasks({});
      saveProgress({}, newCalendar);
      setLoading(false);
    }, 500);
  }, [communityBreakdown, projectName, signals, saveProgress]);

  const extractFeatures = (signals) => {
    return [
      { name: 'Core Feature', description: 'Main value proposition from validation' },
      { name: 'User Dashboard', description: 'Central interface for users' },
      { name: 'Data Import', description: 'Get users started quickly' },
    ];
  };

  const toggleTask = useCallback((dayNum, taskIndex) => {
    const key = `${dayNum}-${taskIndex}`;
    const newProgress = {
      ...completedTasks,
      [key]: !completedTasks[key]
    };
    setCompletedTasks(newProgress);
    saveProgress(newProgress);
  }, [completedTasks, saveProgress]);

  const copyTemplate = async (template, key) => {
    await navigator.clipboard.writeText(template);
    setCopiedTemplate(key);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  // Calculate progress
  const totalTasks = calendar?.days?.reduce((acc, day) => acc + (day.tasks?.length || 0), 0) || 0;
  const completedCount = Object.values(completedTasks).filter(Boolean).length;
  const progress = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Group days into weeks
  const weeks = useMemo(() => {
    if (!calendar?.days) return [];
    const result = [];
    for (let i = 0; i < calendar.days.length; i += 7) {
      result.push(calendar.days.slice(i, i + 7));
    }
    return result;
  }, [calendar]);

  if (!isValidated) {
    const remaining = signupGoal - signupCount;
    const progressPercent = Math.min((signupCount / signupGoal) * 100, 100);
    
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Launch Roadmap Locked</h3>
          <p className="text-[#a1a1aa] mb-6">
            Get <span className="text-[#22c55e] font-bold">{remaining} more signup{remaining !== 1 ? 's' : ''}</span> on your landing page to unlock.
          </p>
          
          {/* Progress Bar */}
          <div className="max-w-md mx-auto mb-6">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[#71717a]">Progress</span>
              <span className="text-[#22c55e] font-medium">{signupCount} / {signupGoal} signups</span>
            </div>
            <div className="h-3 bg-[#27272a] rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          
          {/* Milestones */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((num) => (
              <div
                key={num}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                  signupCount >= num
                    ? 'bg-[#22c55e] text-[#0a0a0b]'
                    : 'bg-[#27272a] text-[#71717a]'
                }`}
              >
                {signupCount >= num ? '✓' : num}
              </div>
            ))}
          </div>

          {/* Tips */}
          <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 max-w-md mx-auto text-left">
            <h4 className="font-medium mb-3 flex items-center gap-2">
              <span>💡</span> How to get signups
            </h4>
            <ul className="space-y-2 text-sm text-[#a1a1aa]">
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e]">→</span>
                Share your landing page on Reddit in relevant subreddits
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e]">→</span>
                Post on Twitter/X and tag founders who might be interested
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e]">→</span>
                DM people who showed interest in your pipeline
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#22c55e]">→</span>
                Share in Slack/Discord communities
              </li>
            </ul>
          </div>
          
          <p className="text-xs text-[#71717a] mt-4">
            {signupGoal} signups = validated demand → unlock your launch roadmap
          </p>
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
            Get a 28-day build-in-public plan with multiple tasks per day.
          </p>

          <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 mb-6 text-left text-sm">
            <p className="text-[#71717a] mb-2">Your calendar will include:</p>
            <div className="space-y-1 text-[#a1a1aa]">
              <p>🔨 Build tasks (features based on signals)</p>
              <p>🐦 Tweet after each feature</p>
              <p>📝 Reddit posts every 2-3 days</p>
              <p>💬 DM outreach to warm leads</p>
              <p>✍️ Content templates ready to copy</p>
            </div>
          </div>

          <button
            onClick={generateCalendar}
            className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
          >
            ✨ Generate Calendar
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
          <p className="text-[#a1a1aa]">Building your launch calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              📅 28-Day Launch Calendar
              {saving && <span className="text-xs text-[#71717a]">Saving...</span>}
            </h3>
            <p className="text-sm text-[#a1a1aa]">{calendar?.summary}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[#22c55e]">{progress}%</div>
            <div className="text-xs text-[#71717a]">{completedCount}/{totalTasks} tasks</div>
          </div>
        </div>
        <div className="h-2 bg-[#27272a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* MVP Features */}
      {calendar?.mvpFeatures && (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-4">
          <h4 className="text-sm font-semibold mb-3">🎯 MVP Features to Build</h4>
          <div className="flex flex-wrap gap-2">
            {calendar.mvpFeatures.map((feature, i) => (
              <div key={i} className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/30 rounded-lg text-sm">
                <span className="text-blue-400">{feature.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 border-b border-[#27272a]">
          {DAYS_OF_WEEK.map(day => (
            <div key={day} className="p-2 text-center text-xs font-medium text-[#71717a] bg-[#0a0a0b]">
              {day}
            </div>
          ))}
        </div>

        {/* Weeks */}
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex}>
            {/* Week Label */}
            <div className="px-3 py-1.5 bg-[#0a0a0b] border-b border-[#27272a] text-xs font-medium text-[#71717a]">
              Week {weekIndex + 1}: {weekIndex === 0 ? 'Build Core MVP' : weekIndex === 1 ? 'Polish & Beta' : weekIndex === 2 ? 'Soft Launch' : 'Growth'}
            </div>
            
            <div className="grid grid-cols-7 border-b border-[#27272a] last:border-b-0">
              {week.map((day, dayIndex) => {
                const dayNum = weekIndex * 7 + dayIndex + 1;
                const dayTasks = day?.tasks || [];
                const completedInDay = dayTasks.filter((_, i) => completedTasks[`${dayNum}-${i}`]).length;
                const isExpanded = expandedDay === dayNum;
                const allComplete = completedInDay === dayTasks.length && dayTasks.length > 0;

                return (
                  <div
                    key={dayIndex}
                    onClick={() => setExpandedDay(isExpanded ? null : dayNum)}
                    className={`min-h-[120px] p-2 border-r border-[#27272a] last:border-r-0 cursor-pointer transition-colors ${
                      isExpanded ? 'bg-[#22c55e]/5' : 'hover:bg-[#1a1a1c]'
                    } ${allComplete ? 'bg-[#22c55e]/5' : ''}`}
                  >
                    {/* Day Number */}
                    <div className="flex items-center justify-between mb-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        allComplete ? 'bg-[#22c55e] text-[#0a0a0b]' : 'bg-[#27272a] text-white'
                      }`}>
                        {allComplete ? '✓' : dayNum}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[10px] text-[#71717a]">
                          {completedInDay}/{dayTasks.length}
                        </span>
                      )}
                    </div>

                    {/* Task Previews */}
                    <div className="space-y-1">
                      {dayTasks.map((task, taskIndex) => {
                        const style = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.build;
                        const isComplete = completedTasks[`${dayNum}-${taskIndex}`];
                        
                        return (
                          <div
                            key={taskIndex}
                            className={`text-[10px] px-1.5 py-1 rounded ${style.bg} ${style.text} truncate ${
                              isComplete ? 'opacity-50 line-through' : ''
                            }`}
                          >
                            {style.icon} {task.title}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Day Detail */}
      {expandedDay && calendar?.days?.[expandedDay - 1] && (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold">Day {expandedDay} Tasks</h4>
            <button
              onClick={() => setExpandedDay(null)}
              className="text-[#71717a] hover:text-white text-xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {calendar.days[expandedDay - 1].tasks?.map((task, taskIndex) => {
              const style = CATEGORY_STYLES[task.category] || CATEGORY_STYLES.build;
              const taskKey = `${expandedDay}-${taskIndex}`;
              const isComplete = completedTasks[taskKey];

              return (
                <div
                  key={taskIndex}
                  className={`p-3 rounded-xl border ${isComplete ? 'bg-[#22c55e]/10 border-[#22c55e]/30' : `${style.bg} ${style.border}`}`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTask(expandedDay, taskIndex);
                      }}
                      className={`w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                        isComplete ? 'bg-[#22c55e] text-[#0a0a0b]' : 'bg-[#27272a] hover:bg-[#3f3f46]'
                      }`}
                    >
                      {isComplete && '✓'}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-xs px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                          {style.icon} {task.category}
                        </span>
                        {task.time && (
                          <span className="text-xs text-[#71717a]">⏱ {task.time}</span>
                        )}
                      </div>
                      
                      <h5 className={`font-medium ${isComplete ? 'line-through text-[#71717a]' : ''}`}>
                        {task.title}
                      </h5>
                      
                      {task.description && (
                        <p className="text-sm text-[#a1a1aa] mt-1">{task.description}</p>
                      )}

                      {task.template && (
                        <div className="mt-2 p-2 bg-[#0a0a0b] rounded-lg border border-[#27272a]">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] text-[#71717a]">📝 Copy template:</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyTemplate(task.template, taskKey);
                              }}
                              className="text-[10px] px-2 py-0.5 rounded bg-[#27272a] hover:bg-[#3f3f46] transition-colors"
                            >
                              {copiedTemplate === taskKey ? '✓ Copied!' : 'Copy'}
                            </button>
                          </div>
                          <p className="text-xs text-[#a1a1aa] whitespace-pre-wrap">{task.template}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center text-xs">
        {Object.entries(CATEGORY_STYLES).map(([key, style]) => (
          <div key={key} className="flex items-center gap-1.5">
            <span>{style.icon}</span>
            <span className="text-[#71717a] capitalize">{key}</span>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button
          onClick={generateCalendar}
          className="text-sm text-[#71717a] hover:text-white transition-colors"
        >
          🔄 Regenerate calendar
        </button>
      </div>
    </div>
  );
}

function generateDefaultDays(projectName, community, communities) {
  const comm2 = communities[1]?.name || 'entrepreneur';
  
  return [
    // Week 1: Core MVP
    { day: 1, tasks: [
      { category: 'build', title: 'Set up project', description: 'Initialize repo, framework, deploy pipeline', time: '2h' },
      { category: 'tweet', title: 'Announce build', template: `Day 1: Starting to build ${projectName}.\n\nValidated with real users first - ${communities.length} signals collected.\n\nBuilding in public. Let's go 🚀`, time: '10m' },
    ]},
    { day: 2, tasks: [
      { category: 'build', title: 'Build core feature #1', description: 'The main value proposition', time: '4h' },
      { category: 'tweet', title: 'Share progress', template: `Day 2 of ${projectName}:\n\nCore feature taking shape. Here's a sneak peek 👇\n\n[screenshot]\n\nBuilding what people actually asked for.`, time: '10m' },
    ]},
    { day: 3, tasks: [
      { category: 'build', title: 'Continue core feature', description: 'Finish and test', time: '3h' },
      { category: 'reddit', title: `Post in r/${community}`, template: `Building ${projectName} in public - Day 3 update\n\nI validated this idea with real users before writing code. Now building the core feature.\n\nWould love feedback from this community!`, time: '20m' },
    ]},
    { day: 4, tasks: [
      { category: 'build', title: 'Build feature #2', description: 'Second most important feature', time: '4h' },
      { category: 'tweet', title: 'Feature shipped', template: `Feature #2 shipped for ${projectName} ✅\n\nThis one came directly from validation - 3 people mentioned needing this.\n\nBuilding what users want > guessing.`, time: '10m' },
    ]},
    { day: 5, tasks: [
      { category: 'build', title: 'Add user auth', description: 'Sign up, login, sessions', time: '3h' },
      { category: 'outreach', title: 'DM 3 warm leads', description: 'Update people who showed interest', time: '30m' },
      { category: 'tweet', title: 'Week progress', template: `Week 1 of building ${projectName}:\n\n✅ Core feature\n✅ Feature #2\n✅ Auth system\n\n3 warm leads updated. Building continues...`, time: '10m' },
    ]},
    { day: 6, tasks: [
      { category: 'build', title: 'Build feature #3', description: 'Quality of life feature', time: '3h' },
      { category: 'content', title: 'Write build log', description: 'Document week 1 learnings', time: '1h' },
    ]},
    { day: 7, tasks: [
      { category: 'tweet', title: 'Week 1 recap', template: `Week 1 building ${projectName} in public:\n\n🔨 3 features shipped\n💬 3 leads contacted\n📝 1 Reddit post\n\nBiggest lesson: validation saves so much time.\n\nWeek 2: polish + beta users`, time: '15m' },
    ]},
    
    // Week 2: Polish & Beta
    { day: 8, tasks: [
      { category: 'build', title: 'Build dashboard UI', description: 'Main user interface', time: '4h' },
      { category: 'tweet', title: 'UI preview', template: `Working on the ${projectName} dashboard today.\n\nGoing for simple > fancy.\n\nWhat do you think? 👇\n\n[screenshot]`, time: '10m' },
    ]},
    { day: 9, tasks: [
      { category: 'build', title: 'Polish & bug fixes', description: 'Clean up rough edges', time: '3h' },
      { category: 'reddit', title: `Post in r/${comm2}`, template: `Building a tool for [target audience] - looking for beta testers\n\nI spent 2 weeks validating before building. Now ${projectName} is almost ready.\n\nWho wants early access?`, time: '20m' },
    ]},
    { day: 10, tasks: [
      { category: 'build', title: 'Create landing page', description: 'Public-facing page', time: '3h' },
      { category: 'tweet', title: 'Landing page live', template: `${projectName} landing page is live! 🌐\n\nNot perfect, but shipping beats perfecting.\n\nLink: [url]\n\nFeedback welcome!`, time: '10m' },
    ]},
    { day: 11, tasks: [
      { category: 'build', title: 'Beta prep', description: 'Final testing, onboarding flow', time: '2h' },
      { category: 'outreach', title: 'Invite beta users', description: 'DM/email warm leads', time: '1h' },
      { category: 'tweet', title: 'Beta announcement', template: `${projectName} beta is ready! 🎉\n\nLooking for 10 beta testers who struggle with [problem].\n\nDM me or reply if interested.\n\nFree forever for early users.`, time: '10m' },
    ]},
    { day: 12, tasks: [
      { category: 'build', title: 'Fix beta feedback', description: 'Quick iterations', time: '3h' },
      { category: 'tweet', title: 'Beta feedback', template: `First beta feedback for ${projectName}:\n\n"[positive quote]"\n\nAlso found 2 bugs and 1 UX issue. Fixing now.\n\nThis is why you get real users early.`, time: '10m' },
    ]},
    { day: 13, tasks: [
      { category: 'build', title: 'More fixes', description: 'Address remaining issues', time: '2h' },
      { category: 'content', title: 'Write case study', description: 'Document a beta user win', time: '1h' },
    ]},
    { day: 14, tasks: [
      { category: 'tweet', title: 'Week 2 recap', template: `Week 2 of ${projectName}:\n\n✅ Dashboard done\n✅ Landing page live\n✅ 5 beta users onboarded\n✅ First bugs fixed\n\nWeek 3: soft launch 🚀`, time: '15m' },
      { category: 'outreach', title: 'Check in with betas', description: 'Get final feedback', time: '30m' },
    ]},
    
    // Week 3: Soft Launch
    { day: 15, tasks: [
      { category: 'build', title: 'Final polish', description: 'Last fixes before launch', time: '2h' },
      { category: 'content', title: 'Write launch post', description: 'Prepare Reddit + Twitter content', time: '2h' },
    ]},
    { day: 16, tasks: [
      { category: 'outreach', title: 'Warm up leads', description: 'Let them know launch is tomorrow', time: '30m' },
      { category: 'tweet', title: 'Launch teaser', template: `${projectName} launches tomorrow.\n\n2 weeks from validation to product.\n\nBuilt for [audience] who struggle with [problem].\n\nThread coming tomorrow with the full story 🧵`, time: '10m' },
    ]},
    { day: 17, tasks: [
      { category: 'reddit', title: 'Launch post', template: `I built ${projectName} in 2 weeks (after validating first)\n\nHere's what it does:\n• [Feature 1]\n• [Feature 2]\n• [Feature 3]\n\nFree to try. Would love honest feedback!`, time: '30m' },
      { category: 'tweet', title: 'Launch thread', template: `${projectName} is live 🚀\n\nI built this in 2 weeks after validating with real users.\n\nHere's the full story:\n\n🧵👇`, time: '30m' },
      { category: 'outreach', title: 'DM supporters', description: 'Personal message to warm leads', time: '30m' },
    ]},
    { day: 18, tasks: [
      { category: 'outreach', title: 'Reply to everyone', description: 'Engage with all comments', time: '2h' },
      { category: 'tweet', title: 'Day 1 results', template: `24 hours since launching ${projectName}:\n\n📊 X signups\n💬 Y comments\n🐛 Z bugs found\n\nHonest numbers. Shipping continues.`, time: '10m' },
    ]},
    { day: 19, tasks: [
      { category: 'build', title: 'Quick fixes', description: 'Address launch feedback', time: '3h' },
      { category: 'reddit', title: 'Follow-up post', template: `Update: ${projectName} launch results\n\nPosted here 2 days ago. Here's what happened:\n\n• X signups\n• Top feedback: [insight]\n• Already shipped: [fix]\n\nThanks for the support!`, time: '20m' },
    ]},
    { day: 20, tasks: [
      { category: 'tweet', title: 'Week 3 recap', template: `Week 3 - ${projectName} launch week:\n\n🚀 Launched\n📊 X total users\n💬 Y feedback items\n🔨 Z quick fixes shipped\n\nBiggest surprise: [insight]`, time: '15m' },
      { category: 'content', title: 'Document learnings', description: 'Write down what worked', time: '1h' },
    ]},
    { day: 21, tasks: [
      { category: 'build', title: 'Iterate on feedback', description: 'Build most requested feature', time: '3h' },
    ]},
    
    // Week 4: Growth
    { day: 22, tasks: [
      { category: 'build', title: 'Ship requested feature', description: 'What users asked for', time: '4h' },
      { category: 'tweet', title: 'New feature', template: `New ${projectName} feature just shipped:\n\n[Feature name]\n\nThis was the #1 request from launch.\n\nUser feedback → shipped in 2 days.`, time: '10m' },
    ]},
    { day: 23, tasks: [
      { category: 'reddit', title: 'New community post', description: 'Expand reach', template: `Built a tool that [solves problem] - ${projectName}\n\nLaunched last week. X people using it now.\n\nFree to try, would love feedback from this community.`, time: '20m' },
      { category: 'outreach', title: 'Ask for testimonials', description: 'Reach out to happy users', time: '30m' },
    ]},
    { day: 24, tasks: [
      { category: 'tweet', title: 'User testimonial', template: `"[User quote about ${projectName}]"\n\n- @username\n\nThis is why validation matters. Real users, real feedback, real product.`, time: '10m' },
      { category: 'content', title: 'Create demo video', description: 'Quick Loom walkthrough', time: '1h' },
    ]},
    { day: 25, tasks: [
      { category: 'build', title: 'Polish & optimize', description: 'Performance + UX improvements', time: '3h' },
      { category: 'tweet', title: 'Demo video', template: `Quick ${projectName} demo (2 min):\n\n[video]\n\nBuilt for [audience] who [problem].\n\nTry it free: [link]`, time: '15m' },
    ]},
    { day: 26, tasks: [
      { category: 'outreach', title: 'Reach out to creators', description: 'Find people who might share', time: '1h' },
      { category: 'reddit', title: 'Value post', template: `Lessons from building ${projectName} in 4 weeks:\n\n1. Validate before building\n2. Build in public\n3. Ship fast, iterate faster\n\nFull breakdown in comments.`, time: '30m' },
    ]},
    { day: 27, tasks: [
      { category: 'content', title: 'Write month recap', description: 'Full build story', time: '2h' },
      { category: 'tweet', title: 'Month recap thread', template: `28 days ago I started building ${projectName}.\n\nToday:\n📊 X users\n💬 Y feedback items\n🔨 Z features shipped\n\nHere's everything I learned... 🧵`, time: '30m' },
    ]},
    { day: 28, tasks: [
      { category: 'tweet', title: 'Thank you post', template: `Officially 1 month since I started ${projectName}.\n\nThank you to everyone who:\n- Gave feedback during validation\n- Tried the beta\n- Shared the launch\n\nThis is just the beginning. 🙏`, time: '10m' },
      { category: 'content', title: 'Plan month 2', description: 'Set goals, prioritize features', time: '1h' },
    ]},
  ];
}