'use client';

import { useMemo } from 'react';

export default function FollowUpWidget({ signals, outreachMap }) {
  const followUps = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const items = signals
      .filter(signal => outreachMap[signal.id]?.follow_up_date)
      .map(signal => {
        const outreach = outreachMap[signal.id];
        const followUpDate = new Date(outreach.follow_up_date);
        followUpDate.setHours(0, 0, 0, 0);
        const diffDays = Math.floor((followUpDate - today) / (1000 * 60 * 60 * 24));
        
        return {
          signal,
          outreach,
          followUpDate,
          diffDays,
          isOverdue: diffDays < 0,
          isDueToday: diffDays === 0,
          isDueSoon: diffDays > 0 && diffDays <= 3,
        };
      })
      .sort((a, b) => a.diffDays - b.diffDays);

    return {
      overdue: items.filter(i => i.isOverdue),
      today: items.filter(i => i.isDueToday),
      soon: items.filter(i => i.isDueSoon),
      later: items.filter(i => i.diffDays > 3),
    };
  }, [signals, outreachMap]);

  const totalDue = followUps.overdue.length + followUps.today.length;
  const hasFollowUps = followUps.overdue.length + followUps.today.length + followUps.soon.length > 0;

  if (!hasFollowUps && followUps.later.length === 0) {
    return null; // Don't show widget if no follow-ups
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const FollowUpItem = ({ item }) => (
    <a
      href={item.signal.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-2 rounded-lg hover:bg-[#27272a] transition-colors group"
    >
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
        item.isOverdue ? 'bg-red-500' :
        item.isDueToday ? 'bg-yellow-500' :
        item.isDueSoon ? 'bg-blue-500' :
        'bg-[#71717a]'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate group-hover:text-[#22c55e] transition-colors">
          u/{item.signal.author}
        </p>
        <p className="text-xs text-[#71717a] truncate">
          r/{item.signal.subreddit}
        </p>
      </div>
      <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
        item.isOverdue ? 'bg-red-500/20 text-red-400' :
        item.isDueToday ? 'bg-yellow-500/20 text-yellow-500' :
        item.isDueSoon ? 'bg-blue-500/20 text-blue-400' :
        'bg-[#27272a] text-[#71717a]'
      }`}>
        {item.isOverdue ? `${Math.abs(item.diffDays)}d overdue` :
         item.isDueToday ? 'Today' :
         item.diffDays === 1 ? 'Tomorrow' :
         `${item.diffDays}d`}
      </span>
    </a>
  );

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🔔</span>
          <h3 className="font-semibold">Follow-ups</h3>
          {totalDue > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">
              {totalDue} due
            </span>
          )}
        </div>
      </div>

      {/* Overdue */}
      {followUps.overdue.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-red-400 font-medium mb-2">Overdue</p>
          <div className="space-y-1">
            {followUps.overdue.map(item => (
              <FollowUpItem key={item.signal.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Due Today */}
      {followUps.today.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-yellow-500 font-medium mb-2">Due Today</p>
          <div className="space-y-1">
            {followUps.today.map(item => (
              <FollowUpItem key={item.signal.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Coming Soon */}
      {followUps.soon.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-blue-400 font-medium mb-2">Coming Up</p>
          <div className="space-y-1">
            {followUps.soon.map(item => (
              <FollowUpItem key={item.signal.id} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {!hasFollowUps && followUps.later.length > 0 && (
        <p className="text-sm text-[#71717a] text-center py-2">
          No urgent follow-ups. {followUps.later.length} scheduled for later.
        </p>
      )}
    </div>
  );
}