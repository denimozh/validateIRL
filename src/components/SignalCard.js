'use client';

import { useState } from 'react';
import OutreachTemplates from './OutreachTemplates';

const INTENT_STYLES = {
  high: { bg: 'bg-[#22c55e]/20', text: 'text-[#22c55e]', label: 'HIGH INTENT' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'MEDIUM' },
  low: { bg: 'bg-[#71717a]/20', text: 'text-[#71717a]', label: 'LOW' },
};

const STATUS_OPTIONS = [
  { value: 'found', label: 'Found', color: 'text-[#71717a]' },
  { value: 'contacted', label: 'Contacted', color: 'text-blue-400' },
  { value: 'replied', label: 'Replied', color: 'text-yellow-500' },
  { value: 'interested', label: 'Interested', color: 'text-orange-400' },
  { value: 'would_pay', label: '"I\'d Pay" 💰', color: 'text-[#22c55e]' },
];

const TAG_STYLES = {
  complaint: { emoji: '💬', label: 'Complaint' },
  workaround: { emoji: '🔧', label: 'Workaround' },
  budget_mention: { emoji: '💰', label: 'Budget' },
};

export default function SignalCard({ signal, outreach, onUpdateOutreach, onDelete, projectPain }) {
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(outreach?.notes || '');
  const [saving, setSaving] = useState(false);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState(outreach?.follow_up_date || '');
  const [showTemplates, setShowTemplates] = useState(false);

  const intent = INTENT_STYLES[signal.intent_score] || INTENT_STYLES.low;
  const currentStatus = outreach?.status || 'found';

  const handleStatusChange = async (newStatus) => {
    setSaving(true);
    try {
      await onUpdateOutreach(signal.id, {
        status: newStatus,
        contacted_at: newStatus !== 'found' && !outreach?.contacted_at ? new Date().toISOString() : outreach?.contacted_at,
        replied_at: ['replied', 'interested', 'would_pay'].includes(newStatus) && !outreach?.replied_at ? new Date().toISOString() : outreach?.replied_at,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    setSaving(true);
    try {
      await onUpdateOutreach(signal.id, { notes });
      setShowNotes(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFollowUp = async () => {
    setSaving(true);
    try {
      await onUpdateOutreach(signal.id, { follow_up_date: followUpDate || null });
      setShowFollowUp(false);
    } finally {
      setSaving(false);
    }
  };

  const clearFollowUp = async () => {
    setSaving(true);
    try {
      await onUpdateOutreach(signal.id, { follow_up_date: null });
      setFollowUpDate('');
    } finally {
      setSaving(false);
    }
  };

  const getFollowUpStatus = () => {
    if (!outreach?.follow_up_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUp = new Date(outreach.follow_up_date);
    followUp.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((followUp - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Overdue', color: 'bg-red-500/20 text-red-400', urgent: true };
    if (diffDays === 0) return { label: 'Due today', color: 'bg-yellow-500/20 text-yellow-500', urgent: true };
    if (diffDays === 1) return { label: 'Due tomorrow', color: 'bg-blue-500/20 text-blue-400', urgent: false };
    if (diffDays <= 7) return { label: `Due in ${diffDays}d`, color: 'bg-[#27272a] text-[#a1a1aa]', urgent: false };
    return { label: formatDate(outreach.follow_up_date), color: 'bg-[#27272a] text-[#71717a]', urgent: false };
  };

  const followUpStatus = getFollowUpStatus();

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const signalTags = signal.signal_tags || [];

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-all">
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-[#22c55e] font-medium">r/{signal.subreddit}</span>
          <span className="text-xs text-[#71717a]">• {formatDate(signal.posted_at)}</span>
          <span className="text-xs text-[#71717a]">• u/{signal.author}</span>
          {followUpStatus && (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${followUpStatus.color} ${followUpStatus.urgent ? 'animate-pulse' : ''}`}>
              🔔 {followUpStatus.label}
            </span>
          )}
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${intent.bg} ${intent.text}`}>
          {intent.label}
        </span>
      </div>

      {/* Content */}
      <a 
        href={signal.url} 
        target="_blank" 
        rel="noopener noreferrer"
        className="block group"
      >
        <h4 className="font-medium mb-2 group-hover:text-[#22c55e] transition-colors line-clamp-2">
          {signal.content?.substring(0, 200) || 'No title'}
        </h4>
      </a>

      {/* Tags & Stats */}
      <div className="flex items-center gap-3 text-xs text-[#71717a] mb-4">
        <span>⬆️ {signal.upvotes || 0}</span>
        <span>💬 {signal.comments_count || 0}</span>
        {signalTags.map(tag => (
          <span key={tag} className="flex items-center gap-1">
            {TAG_STYLES[tag]?.emoji} {TAG_STYLES[tag]?.label}
          </span>
        ))}
      </div>

      {/* Status Selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-[#71717a]">Status:</span>
        <div className="flex gap-1 flex-wrap">
          {STATUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleStatusChange(option.value)}
              disabled={saving}
              className={`text-xs px-2 py-1 rounded-md transition-all ${
                currentStatus === option.value
                  ? 'bg-[#27272a] text-white'
                  : 'text-[#71717a] hover:text-white hover:bg-[#27272a]/50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Notes Section */}
      {showNotes ? (
        <div className="mt-3 pt-3 border-t border-[#27272a]">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this conversation..."
            rows={3}
            className="w-full px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none resize-none"
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowNotes(false)}
              className="text-xs px-3 py-1.5 rounded-md text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              disabled={saving}
              className="text-xs px-3 py-1.5 rounded-md bg-[#22c55e] text-[#0a0a0b] font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#27272a]">
          <div className="flex gap-3">
            <button
              onClick={() => setShowTemplates(true)}
              className="text-xs text-[#22c55e] hover:text-[#16a34a] transition-colors flex items-center gap-1 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              Templates
            </button>
            <button
              onClick={() => setShowNotes(true)}
              className="text-xs text-[#71717a] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {outreach?.notes ? 'Notes' : 'Notes'}
            </button>
            <button
              onClick={() => setShowFollowUp(true)}
              className="text-xs text-[#71717a] hover:text-white transition-colors flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {outreach?.follow_up_date ? 'Reminder' : 'Reminder'}
            </button>
          </div>
          <div className="flex gap-2">
            <a
              href={signal.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#22c55e] hover:underline"
            >
              View post →
            </a>
            <button
              onClick={() => onDelete(signal.id)}
              className="text-xs text-[#71717a] hover:text-red-400 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Date Picker */}
      {showFollowUp && (
        <div className="mt-3 pt-3 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="flex-1 px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm focus:border-[#22c55e] focus:outline-none"
            />
            <button
              onClick={handleSaveFollowUp}
              disabled={saving}
              className="text-xs px-3 py-2 rounded-lg bg-[#22c55e] text-[#0a0a0b] font-medium hover:bg-[#16a34a] transition-colors disabled:opacity-50"
            >
              {saving ? '...' : 'Save'}
            </button>
            {outreach?.follow_up_date && (
              <button
                onClick={clearFollowUp}
                disabled={saving}
                className="text-xs px-3 py-2 rounded-lg bg-[#27272a] text-[#a1a1aa] hover:text-white transition-colors disabled:opacity-50"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowFollowUp(false)}
              className="text-xs px-3 py-2 text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
          <div className="flex gap-2 mt-2">
            {[
              { label: 'Tomorrow', days: 1 },
              { label: '3 days', days: 3 },
              { label: '1 week', days: 7 },
            ].map((option) => {
              const date = new Date();
              date.setDate(date.getDate() + option.days);
              const dateStr = date.toISOString().split('T')[0];
              return (
                <button
                  key={option.days}
                  onClick={() => setFollowUpDate(dateStr)}
                  className="text-xs px-2 py-1 rounded-md bg-[#27272a] text-[#a1a1aa] hover:text-white hover:bg-[#3f3f46] transition-colors"
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Outreach Templates Modal */}
      <OutreachTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        signal={signal}
        projectPain={projectPain}
      />
    </div>
  );
}