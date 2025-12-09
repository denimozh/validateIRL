'use client';

import { useState } from 'react';

const TEMPLATES = [
  {
    id: 'initial_dm',
    name: 'Initial DM',
    emoji: '👋',
    description: 'First contact - introduce yourself',
    template: `Hey {author}!

Saw your post in r/{subreddit} about {pain_summary}. I'm actually building something to solve this exact problem.

Would love to get your thoughts - would you be open to a quick chat? No pitch, just trying to understand the problem better.`,
  },
  {
    id: 'comment_reply',
    name: 'Comment Reply',
    emoji: '💬',
    description: 'Reply publicly to their post',
    template: `I feel this so much. I've been dealing with the same issue.

Actually started building a solution for this - early stages but would love your input on what features would actually help.

Mind if I DM you?`,
  },
  {
    id: 'follow_up',
    name: 'Follow-up DM',
    emoji: '🔄',
    description: 'When they haven\'t responded',
    template: `Hey {author}, just floating this back up!

I know Reddit DMs can get buried. Still interested in chatting about {pain_summary} if you have 5 mins.

No worries if not - appreciate your time either way.`,
  },
  {
    id: 'thank_you',
    name: 'After Interest',
    emoji: '🙏',
    description: 'When they show interest or say they\'d pay',
    template: `Really appreciate you taking the time to chat, {author}!

Your feedback on {pain_summary} is super valuable. I'll keep you posted as I build this out - you'll be first to try it.

Anything else you'd want to see in a solution like this?`,
  },
  {
    id: 'beta_invite',
    name: 'Beta Invite',
    emoji: '🚀',
    description: 'Invite them to try your product',
    template: `Hey {author}!

Remember when we chatted about {pain_summary}? I've been building a solution and just launched a beta.

Would love for you to try it: [YOUR_LINK]

It's free for early users - just looking for feedback. Let me know what you think!`,
  },
];

export default function OutreachTemplates({ isOpen, onClose, signal, projectPain }) {
  const [copiedId, setCopiedId] = useState(null);
  const [activeTemplate, setActiveTemplate] = useState(TEMPLATES[0].id);

  if (!isOpen) return null;

  const author = signal?.author || 'there';
  const subreddit = signal?.subreddit || signal?.url?.match(/r\/(\w+)/)?.[1] || 'reddit';
  const painSummary = projectPain || signal?.content?.split('\n')[0]?.slice(0, 50) || 'this problem';

  const fillTemplate = (template) => {
    return template
      .replace(/{author}/g, author)
      .replace(/{subreddit}/g, subreddit)
      .replace(/{pain_summary}/g, painSummary);
  };

  const handleCopy = async (templateId, text) => {
    try {
      await navigator.clipboard.writeText(fillTemplate(text));
      setCopiedId(templateId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const currentTemplate = TEMPLATES.find(t => t.id === activeTemplate);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-[#161618] border border-[#27272a] rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
          <div>
            <h2 className="text-lg font-bold">Outreach Templates</h2>
            <p className="text-sm text-[#71717a]">Copy and personalize for u/{author}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#71717a] hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Template List */}
          <div className="w-48 border-r border-[#27272a] p-2 overflow-y-auto flex-shrink-0">
            {TEMPLATES.map(template => (
              <button
                key={template.id}
                onClick={() => setActiveTemplate(template.id)}
                className={`w-full text-left p-3 rounded-lg mb-1 transition-colors ${
                  activeTemplate === template.id
                    ? 'bg-[#22c55e]/20 text-[#22c55e]'
                    : 'hover:bg-[#27272a] text-[#a1a1aa]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{template.emoji}</span>
                  <span className="text-sm font-medium">{template.name}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Template Preview */}
          <div className="flex-1 p-4 overflow-y-auto">
            {currentTemplate && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span>{currentTemplate.emoji}</span>
                      {currentTemplate.name}
                    </h3>
                    <p className="text-sm text-[#71717a]">{currentTemplate.description}</p>
                  </div>
                  <button
                    onClick={() => handleCopy(currentTemplate.id, currentTemplate.template)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                      copiedId === currentTemplate.id
                        ? 'bg-[#22c55e] text-[#0a0a0b]'
                        : 'bg-[#27272a] hover:bg-[#3f3f46] text-white'
                    }`}
                  >
                    {copiedId === currentTemplate.id ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Copied!
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Preview */}
                <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4">
                  <pre className="whitespace-pre-wrap text-sm text-[#e4e4e7] font-sans leading-relaxed">
                    {fillTemplate(currentTemplate.template)}
                  </pre>
                </div>

                {/* Variables hint */}
                <div className="mt-4 p-3 bg-[#27272a]/50 rounded-lg">
                  <p className="text-xs text-[#71717a] mb-2">Auto-filled variables:</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs px-2 py-1 bg-[#27272a] rounded text-[#a1a1aa]">
                      {'{author}'} → <span className="text-white">{author}</span>
                    </span>
                    <span className="text-xs px-2 py-1 bg-[#27272a] rounded text-[#a1a1aa]">
                      {'{subreddit}'} → <span className="text-white">{subreddit}</span>
                    </span>
                    <span className="text-xs px-2 py-1 bg-[#27272a] rounded text-[#a1a1aa] max-w-xs truncate">
                      {'{pain_summary}'} → <span className="text-white">{painSummary.slice(0, 30)}...</span>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#27272a] bg-[#0a0a0b]">
          <p className="text-xs text-[#71717a] text-center">
            💡 Tip: Personalize the message before sending. Generic DMs get ignored.
          </p>
        </div>
      </div>
    </div>
  );
}