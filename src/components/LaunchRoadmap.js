'use client';

import { useState, useMemo } from 'react';

const ROADMAP_TEMPLATES = {
  day1: {
    title: "DM your warm leads",
    description: "These people already said they'd pay. Start here.",
    icon: "🔥",
    action: "dm_leads"
  },
  day2: {
    title: "Post in your #1 community",
    description: "Share your solution where most of your signals came from.",
    icon: "📝",
    action: "post_community"
  },
  day3: {
    title: "Reply to 5 new pain posts",
    description: "Find fresh leads in your validated communities.",
    icon: "💬",
    action: "reply_posts"
  },
  day4: {
    title: "Post in your #2 community",
    description: "Expand to your second-best validated community.",
    icon: "📢",
    action: "post_community_2"
  },
  day5: {
    title: "Follow up with Day 1 DMs",
    description: "Check in with people who haven't responded.",
    icon: "🔄",
    action: "followup"
  },
  day6: {
    title: "Share a building-in-public update",
    description: "Post progress on Twitter/X. Attract more early adopters.",
    icon: "🐦",
    action: "twitter"
  },
  day7: {
    title: "Soft launch - Ask for beta testers",
    description: "You're validated. Time to get real users.",
    icon: "🚀",
    action: "launch"
  },
};

export default function LaunchRoadmap({ signals, outreachMap, isValidated, wouldPayCount }) {
  const [completedDays, setCompletedDays] = useState([]);
  const [expandedDay, setExpandedDay] = useState(null);

  // Analyze where signals came from
  const communityBreakdown = useMemo(() => {
    const breakdown = {};
    signals.forEach(signal => {
      const subreddit = signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || 'unknown';
      breakdown[subreddit] = (breakdown[subreddit] || 0) + 1;
    });
    
    // Sort by count descending
    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [signals]);

  // Get "I'd pay" leads
  const warmLeads = useMemo(() => {
    return signals.filter(signal => outreachMap[signal.id]?.status === 'would_pay');
  }, [signals, outreachMap]);

  // Get interested leads
  const interestedLeads = useMemo(() => {
    return signals.filter(signal => 
      ['interested', 'would_pay'].includes(outreachMap[signal.id]?.status)
    );
  }, [signals, outreachMap]);

  const topCommunity = communityBreakdown[0];
  const secondCommunity = communityBreakdown[1];

  const toggleDay = (day) => {
    if (completedDays.includes(day)) {
      setCompletedDays(completedDays.filter(d => d !== day));
    } else {
      setCompletedDays([...completedDays, day]);
    }
  };

  const toggleExpand = (day) => {
    setExpandedDay(expandedDay === day ? null : day);
  };

  // Generate personalized roadmap
  const roadmap = [
    {
      day: 1,
      ...ROADMAP_TEMPLATES.day1,
      personalized: `You have ${wouldPayCount} people who said "I'd pay". Message them first.`,
      leads: warmLeads,
    },
    {
      day: 2,
      ...ROADMAP_TEMPLATES.day2,
      personalized: topCommunity 
        ? `Post in r/${topCommunity.name} (${topCommunity.count} of your signals came from here).`
        : "Post in the community where you found the most signals.",
      community: topCommunity?.name,
    },
    {
      day: 3,
      ...ROADMAP_TEMPLATES.day3,
      personalized: topCommunity
        ? `Search r/${topCommunity.name} for new posts about your pain point.`
        : "Find new posts in your validated communities.",
    },
    {
      day: 4,
      ...ROADMAP_TEMPLATES.day4,
      personalized: secondCommunity
        ? `Post in r/${secondCommunity.name} (${secondCommunity.count} signals).`
        : "Expand to another relevant community.",
      community: secondCommunity?.name,
    },
    {
      day: 5,
      ...ROADMAP_TEMPLATES.day5,
      personalized: `Follow up with anyone from Day 1 who hasn't responded yet.`,
    },
    {
      day: 6,
      ...ROADMAP_TEMPLATES.day6,
      personalized: `Share your validation journey. ${wouldPayCount} "I'd pay" signals is worth talking about.`,
    },
    {
      day: 7,
      ...ROADMAP_TEMPLATES.day7,
      personalized: `You've validated with ${wouldPayCount} paying signals. Launch your beta!`,
    },
  ];

  const progress = Math.round((completedDays.length / 7) * 100);

  if (!isValidated) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🔒</span>
          </div>
          <h3 className="text-xl font-bold mb-2">Launch Roadmap Locked</h3>
          <p className="text-[#a1a1aa] mb-4">
            Get {3 - wouldPayCount} more &quot;I&apos;d pay&quot; signal{3 - wouldPayCount !== 1 ? 's' : ''} to unlock your personalized launch plan.
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

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl">🚀</span>
            <h3 className="text-xl font-bold">Your 7-Day Launch Roadmap</h3>
          </div>
          <p className="text-sm text-[#a1a1aa]">
            Personalized based on your {signals.length} signals from {communityBreakdown.length} communities
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-[#22c55e]">{progress}%</div>
          <div className="text-xs text-[#71717a]">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-2 bg-[#27272a] rounded-full mb-6 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Community Breakdown */}
      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 mb-6">
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <span>📊</span> Your Top Communities
        </h4>
        <div className="flex flex-wrap gap-2">
          {communityBreakdown.slice(0, 5).map((community, i) => (
            <div 
              key={community.name}
              className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-2 ${
                i === 0 
                  ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/30' 
                  : 'bg-[#27272a] text-[#a1a1aa]'
              }`}
            >
              <span>r/{community.name}</span>
              <span className="text-xs opacity-70">{community.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap Days */}
      <div className="space-y-3">
        {roadmap.map((item) => {
          const isCompleted = completedDays.includes(item.day);
          const isExpanded = expandedDay === item.day;
          
          return (
            <div 
              key={item.day}
              className={`border rounded-xl transition-all ${
                isCompleted 
                  ? 'bg-[#22c55e]/10 border-[#22c55e]/30' 
                  : 'bg-[#0a0a0b] border-[#27272a] hover:border-[#3f3f46]'
              }`}
            >
              <div 
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggleExpand(item.day)}
              >
                {/* Day Number / Check */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDay(item.day);
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-colors flex-shrink-0 ${
                    isCompleted
                      ? 'bg-[#22c55e] text-[#0a0a0b]'
                      : 'bg-[#27272a] text-[#a1a1aa] hover:bg-[#3f3f46]'
                  }`}
                >
                  {isCompleted ? '✓' : `D${item.day}`}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span>{item.icon}</span>
                    <h4 className={`font-semibold ${isCompleted ? 'text-[#22c55e]' : ''}`}>
                      {item.title}
                    </h4>
                  </div>
                  <p className="text-sm text-[#71717a] truncate">{item.description}</p>
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
                <div className="px-4 pb-4 pt-0">
                  <div className="ml-14 p-4 bg-[#161618] rounded-lg border border-[#27272a]">
                    <p className="text-sm text-[#a1a1aa] mb-3">{item.personalized}</p>
                    
                    {/* Show leads for Day 1 */}
                    {item.day === 1 && warmLeads.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-[#71717a] font-medium">Your warm leads:</p>
                        {warmLeads.map(lead => (
                          <a
                            key={lead.id}
                            href={lead.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#22c55e] hover:underline"
                          >
                            <span>→</span>
                            <span>u/{lead.author}</span>
                            <span className="text-[#71717a]">in r/{lead.subreddit}</span>
                          </a>
                        ))}
                      </div>
                    )}

                    {/* Show community link for Day 2 & 4 */}
                    {(item.day === 2 || item.day === 4) && item.community && (
                      <a
                        href={`https://reddit.com/r/${item.community}/submit`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] rounded-lg text-sm font-semibold transition-colors"
                      >
                        Post in r/{item.community} →
                      </a>
                    )}

                    {/* Show search link for Day 3 */}
                    {item.day === 3 && topCommunity && (
                      <a
                        href={`https://reddit.com/r/${topCommunity.name}/search?q=&restrict_sr=1&sort=new`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#27272a] hover:bg-[#3f3f46] text-white rounded-lg text-sm font-semibold transition-colors"
                      >
                        Search r/{topCommunity.name} →
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion Message */}
      {completedDays.length === 7 && (
        <div className="mt-6 p-4 bg-[#22c55e]/20 border border-[#22c55e]/30 rounded-xl text-center">
          <span className="text-2xl mb-2 block">🎉</span>
          <h4 className="font-bold text-[#22c55e] mb-1">Launch Complete!</h4>
          <p className="text-sm text-[#a1a1aa]">
            You&apos;ve executed your launch plan. Time to track results and iterate.
          </p>
        </div>
      )}
    </div>
  );
}