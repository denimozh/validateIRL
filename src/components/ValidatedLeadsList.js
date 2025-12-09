'use client';

import { useState } from 'react';
import OutreachTemplates from './OutreachTemplates';

export default function ValidatedLeadsList({ signals, outreachMap, onUpdateOutreach, projectPain }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  // Get all "I'd pay" leads
  const validatedLeads = signals.filter(signal => 
    outreachMap[signal.id]?.status === 'would_pay'
  );

  // Get "interested" leads (potential upgrades)
  const interestedLeads = signals.filter(signal => 
    outreachMap[signal.id]?.status === 'interested'
  );

  const openTemplates = (signal) => {
    setSelectedSignal(signal);
    setShowTemplates(true);
  };

  const copyUsername = async (username) => {
    try {
      await navigator.clipboard.writeText(username);
      setCopiedEmail(username);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (validatedLeads.length === 0 && interestedLeads.length === 0) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">💰</span>
        </div>
        <h2 className="text-xl font-bold mb-2">No validated leads yet</h2>
        <p className="text-[#a1a1aa] mb-4">
          When signals reach &quot;I&apos;d Pay&quot; status, they&apos;ll appear here.
        </p>
        <p className="text-sm text-[#71717a]">
          Keep reaching out! Move signals through: Found → Contacted → Replied → Interested → I&apos;d Pay
        </p>
      </div>
    );
  }

  const LeadCard = ({ signal, isValidated }) => {
    const outreach = outreachMap[signal.id];
    const subreddit = signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || 'reddit';

    return (
      <div className={`bg-[#161618] border rounded-xl p-4 ${isValidated ? 'border-[#22c55e]/30' : 'border-[#27272a]'}`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isValidated ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-orange-500/20 text-orange-400'
            }`}>
              {signal.author?.charAt(0).toUpperCase() || '?'}
            </div>
            <div className="min-w-0">
              <p className="font-medium truncate">u/{signal.author}</p>
              <p className="text-xs text-[#71717a]">r/{subreddit}</p>
            </div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
            isValidated ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-orange-500/20 text-orange-400'
          }`}>
            {isValidated ? "💰 I'd Pay" : '👀 Interested'}
          </span>
        </div>

        {/* Post preview */}
        <p className="text-sm text-[#a1a1aa] mb-3 line-clamp-2">
          {signal.content?.split('\n')[0] || 'No content'}
        </p>

        {/* Notes if any */}
        {outreach?.notes && (
          <div className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-2 mb-3">
            <p className="text-xs text-[#71717a]">📝 {outreach.notes}</p>
          </div>
        )}

        {/* Meta info */}
        <div className="flex items-center gap-3 text-xs text-[#71717a] mb-3">
          {outreach?.contacted_at && (
            <span>Contacted {formatDate(outreach.contacted_at)}</span>
          )}
          {outreach?.replied_at && (
            <span>• Replied {formatDate(outreach.replied_at)}</span>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-[#27272a]">
          <button
            onClick={() => openTemplates(signal)}
            className="flex-1 px-3 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            Message
          </button>
          <button
            onClick={() => copyUsername(`u/${signal.author}`)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
              copiedEmail === `u/${signal.author}`
                ? 'bg-[#22c55e]/20 text-[#22c55e]'
                : 'bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa]'
            }`}
          >
            {copiedEmail === `u/${signal.author}` ? (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </>
            ) : (
              <>
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy
              </>
            )}
          </button>
          <a
            href={signal.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] text-xs font-medium transition-colors flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Post
          </a>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161618] border border-[#22c55e]/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
              <span className="text-lg">💰</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#22c55e]">{validatedLeads.length}</p>
              <p className="text-xs text-[#71717a]">&quot;I&apos;d Pay&quot; leads</p>
            </div>
          </div>
        </div>
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-full flex items-center justify-center">
              <span className="text-lg">👀</span>
            </div>
            <div>
              <p className="text-2xl font-bold">{interestedLeads.length}</p>
              <p className="text-xs text-[#71717a]">Interested leads</p>
            </div>
          </div>
        </div>
      </div>

      {/* "I'd Pay" Leads */}
      {validatedLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>💰</span>
              &quot;I&apos;d Pay&quot; Leads
            </h3>
            <span className="text-xs text-[#71717a]">{validatedLeads.length} leads</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {validatedLeads.map(signal => (
              <LeadCard key={signal.id} signal={signal} isValidated={true} />
            ))}
          </div>
        </div>
      )}

      {/* Interested Leads */}
      {interestedLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>👀</span>
              Interested Leads
              <span className="text-xs text-[#71717a] font-normal">(potential upgrades)</span>
            </h3>
            <span className="text-xs text-[#71717a]">{interestedLeads.length} leads</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interestedLeads.map(signal => (
              <LeadCard key={signal.id} signal={signal} isValidated={false} />
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <span>💡</span>
          Tips for converting leads
        </h4>
        <ul className="text-sm text-[#a1a1aa] space-y-1">
          <li>• DM &quot;I&apos;d Pay&quot; leads first - they&apos;re your warmest contacts</li>
          <li>• Reference their original pain point in your message</li>
          <li>• Offer early access or a discount for beta testers</li>
          <li>• Follow up within 48 hours if no response</li>
        </ul>
      </div>

      {/* Templates Modal */}
      <OutreachTemplates
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
        signal={selectedSignal}
        projectPain={projectPain}
      />
    </div>
  );
}