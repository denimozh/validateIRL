'use client';

import { useMemo } from 'react';

export default function MicroTasks({ signals, outreachMap }) {
  const tasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const taskList = [];

    // 1. Follow-ups due today
    const followUpsDue = signals.filter(signal => {
      const outreach = outreachMap[signal.id];
      if (!outreach?.follow_up_date) return false;
      const followUp = new Date(outreach.follow_up_date);
      followUp.setHours(0, 0, 0, 0);
      return followUp <= today;
    });

    if (followUpsDue.length > 0) {
      taskList.push({
        id: 'followups',
        icon: '🔔',
        title: `Follow up with ${followUpsDue.length} lead${followUpsDue.length > 1 ? 's' : ''}`,
        description: followUpsDue.map(s => `u/${s.author}`).slice(0, 3).join(', ') + (followUpsDue.length > 3 ? '...' : ''),
        priority: 'high',
        action: 'View leads',
      });
    }

    // 2. Uncontacted high-intent signals
    const uncontactedHigh = signals.filter(signal => {
      const outreach = outreachMap[signal.id];
      return signal.intent_score === 'high' && (!outreach || outreach.status === 'found');
    });

    if (uncontactedHigh.length > 0) {
      taskList.push({
        id: 'contact_high',
        icon: '🔥',
        title: `Contact ${Math.min(uncontactedHigh.length, 3)} high-intent lead${uncontactedHigh.length > 1 ? 's' : ''}`,
        description: 'These people are most likely to convert',
        priority: 'high',
        action: 'Start outreach',
      });
    }

    // 3. Signals waiting for reply
    const contacted = signals.filter(signal => {
      const outreach = outreachMap[signal.id];
      return outreach?.status === 'contacted';
    });

    if (contacted.length > 0) {
      taskList.push({
        id: 'check_replies',
        icon: '💬',
        title: `Check ${contacted.length} pending conversation${contacted.length > 1 ? 's' : ''}`,
        description: 'Update status if they replied',
        priority: 'medium',
        action: 'Review',
      });
    }

    // 4. Add notes to signals without notes
    const noNotes = signals.filter(signal => {
      const outreach = outreachMap[signal.id];
      return outreach && outreach.status !== 'found' && !outreach.notes;
    }).slice(0, 3);

    if (noNotes.length > 0) {
      taskList.push({
        id: 'add_notes',
        icon: '📝',
        title: `Add notes to ${noNotes.length} conversation${noNotes.length > 1 ? 's' : ''}`,
        description: 'Track what you discussed',
        priority: 'low',
        action: 'Add notes',
      });
    }

    // 5. Search for new signals (if less than 10 total)
    if (signals.length < 10) {
      taskList.push({
        id: 'find_more',
        icon: '🔍',
        title: 'Find more signals',
        description: `You have ${signals.length} signals. Aim for 15-20.`,
        priority: 'medium',
        action: 'Search',
      });
    }

    return taskList.slice(0, 4); // Max 4 tasks
  }, [signals, outreachMap]);

  if (tasks.length === 0) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <span>✅</span>
          <h3 className="font-semibold text-sm">All caught up!</h3>
        </div>
        <p className="text-xs text-[#71717a]">No urgent tasks. Keep the momentum going!</p>
      </div>
    );
  }

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span>⚡</span>
          <h3 className="font-semibold text-sm">Today&apos;s Tasks</h3>
        </div>
        <span className="text-xs text-[#71717a]">{tasks.length} actions</span>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            className={`flex items-center gap-3 p-2 rounded-lg border transition-colors ${
              task.priority === 'high'
                ? 'bg-red-500/5 border-red-500/20'
                : task.priority === 'medium'
                ? 'bg-yellow-500/5 border-yellow-500/20'
                : 'bg-[#0a0a0b] border-[#27272a]'
            }`}
          >
            <span className="text-lg">{task.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{task.title}</p>
              <p className="text-xs text-[#71717a] truncate">{task.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}