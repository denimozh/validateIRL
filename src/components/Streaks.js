'use client';

import { useMemo } from 'react';

export default function Streaks({ signals, outreachMap, projectCreatedAt }) {
  const stats = useMemo(() => {
    const totalSignals = signals.length;
    const contacted = signals.filter(s => outreachMap[s.id]?.status && outreachMap[s.id]?.status !== 'found').length;
    const replied = signals.filter(s => ['replied', 'interested', 'would_pay'].includes(outreachMap[s.id]?.status)).length;
    const wouldPay = signals.filter(s => outreachMap[s.id]?.status === 'would_pay').length;
    
    // Calculate reply rate
    const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;
    
    // Calculate days active (from project creation to now)
    const created = new Date(projectCreatedAt || Date.now());
    const now = new Date();
    const daysActive = Math.max(1, Math.ceil((now - created) / (1000 * 60 * 60 * 24)));
    
    // Calculate streak (days with activity - simplified: assume active if signals exist)
    const streak = Math.min(daysActive, Math.ceil(totalSignals / 2));

    return { totalSignals, contacted, replied, wouldPay, replyRate, daysActive, streak };
  }, [signals, outreachMap, projectCreatedAt]);

  const milestones = [
    { threshold: 1, label: 'First Signal', icon: '🎯', achieved: stats.totalSignals >= 1 },
    { threshold: 5, label: '5 Signals', icon: '📊', achieved: stats.totalSignals >= 5 },
    { threshold: 10, label: '10 Signals', icon: '🔥', achieved: stats.totalSignals >= 10 },
    { threshold: 1, label: 'First Contact', icon: '📤', achieved: stats.contacted >= 1, type: 'contacted' },
    { threshold: 5, label: '5 Contacted', icon: '📨', achieved: stats.contacted >= 5, type: 'contacted' },
    { threshold: 1, label: 'First Reply', icon: '💬', achieved: stats.replied >= 1, type: 'replied' },
    { threshold: 1, label: 'First "I\'d Pay"', icon: '💰', achieved: stats.wouldPay >= 1, type: 'wouldPay' },
    { threshold: 3, label: 'Validated!', icon: '🎉', achieved: stats.wouldPay >= 3, type: 'wouldPay' },
  ];

  const achievedMilestones = milestones.filter(m => m.achieved);
  const nextMilestone = milestones.find(m => !m.achieved);

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
      {/* Streak Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🔥</span>
          <div>
            <p className="font-bold text-lg">{stats.streak} day streak</p>
            <p className="text-xs text-[#71717a]">Keep validating daily!</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-[#22c55e]">{stats.replyRate}%</p>
          <p className="text-xs text-[#71717a]">Reply rate</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { value: stats.totalSignals, label: 'Signals' },
          { value: stats.contacted, label: 'Contacted' },
          { value: stats.replied, label: 'Replied' },
          { value: stats.wouldPay, label: "I'd Pay" },
        ].map((stat, i) => (
          <div key={i} className="text-center p-2 bg-[#0a0a0b] rounded-lg">
            <p className="font-bold text-sm">{stat.value}</p>
            <p className="text-[10px] text-[#71717a]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Next Milestone */}
      {nextMilestone && (
        <div className="p-3 bg-[#0a0a0b] border border-[#27272a] rounded-lg mb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg opacity-50">{nextMilestone.icon}</span>
            <div>
              <p className="text-xs text-[#71717a]">Next milestone</p>
              <p className="text-sm font-medium">{nextMilestone.label}</p>
            </div>
          </div>
        </div>
      )}

      {/* Achieved Milestones */}
      {achievedMilestones.length > 0 && (
        <div>
          <p className="text-xs text-[#71717a] mb-2">Achieved ({achievedMilestones.length})</p>
          <div className="flex flex-wrap gap-1">
            {achievedMilestones.map((m, i) => (
              <span
                key={i}
                className="text-sm px-2 py-1 bg-[#22c55e]/20 text-[#22c55e] rounded-full"
                title={m.label}
              >
                {m.icon}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}