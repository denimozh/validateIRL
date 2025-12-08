'use client';

import { useState } from 'react';

const INTENT_STYLES = {
  high: { bg: 'bg-[#22c55e]/20', text: 'text-[#22c55e]', label: 'HIGH INTENT' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-500', label: 'MEDIUM' },
  low: { bg: 'bg-[#71717a]/20', text: 'text-[#71717a]', label: 'LOW' },
};

const TAG_STYLES = {
  complaint: { emoji: '💬', label: 'Complaint' },
  workaround: { emoji: '🔧', label: 'Workaround' },
  budget_mention: { emoji: '💰', label: 'Budget' },
};

const HIGH_INTENT_PATTERNS = [
  "i'd pay", "i would pay", "take my money", "shut up and take",
  "wish someone would build", "why doesn't this exist", "why isn't there",
  "i need this", "worth paying for", "would definitely pay",
  "someone please make", "someone please build", "i'd subscribe",
  "instant buy", "day one purchase", "where can i buy"
];

const MEDIUM_INTENT_PATTERNS = [
  "frustrated with", "anyone else struggle", "so annoying",
  "looking for", "is there a tool", "alternative to",
  "recommendations for", "tired of", "hate using",
  "wish there was", "if only", "can't find",
  "does anyone know", "how do you handle", "what do you use for"
];

const SIGNAL_PATTERNS = {
  complaint: ["hate", "frustrated", "annoying", "terrible", "sucks", "worst", "broken", "useless", "garbage", "awful", "horrible", "painful"],
  workaround: ["i currently use", "my workaround", "right now i", "instead i", "hack", "manually", "spreadsheet", "my solution", "what i do is"],
  budget_mention: ["$", "pay", "cost", "price", "subscription", "worth", "money", "budget", "afford", "expensive", "cheap", "free", "pricing"]
};

function scoreIntent(content) {
  const lower = content.toLowerCase();
  if (HIGH_INTENT_PATTERNS.some(pattern => lower.includes(pattern))) return 'high';
  if (MEDIUM_INTENT_PATTERNS.some(pattern => lower.includes(pattern))) return 'medium';
  return 'low';
}

function getSignalTags(content) {
  const lower = content.toLowerCase();
  const tags = [];
  for (const [tag, patterns] of Object.entries(SIGNAL_PATTERNS)) {
    if (patterns.some(pattern => lower.includes(pattern))) tags.push(tag);
  }
  return tags;
}

function hashContent(content) {
  let hash = 0;
  const str = (content || '').toLowerCase().replace(/\s+/g, '');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function parseRedditUrl(url) {
  let cleanUrl = url.trim();
  const patterns = [
    /^https?:\/\/(www\.)?reddit\.com\/r\/(\w+)\/comments\/(\w+)/,
    /^https?:\/\/redd\.it\/(\w+)/,
    /^https?:\/\/old\.reddit\.com\/r\/(\w+)\/comments\/(\w+)/,
  ];
  const isValid = patterns.some(pattern => pattern.test(cleanUrl));
  if (!isValid) throw new Error('Invalid Reddit URL. Please paste a link to a Reddit post.');
  cleanUrl = cleanUrl.split('?')[0].replace(/\/+$/, '');
  return cleanUrl + '.json';
}

async function fetchRedditPost(url) {
  const jsonUrl = parseRedditUrl(url);
  
  // Try multiple CORS proxies
  const proxies = [
    (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];
  
  let lastError;
  
  for (const makeProxyUrl of proxies) {
    try {
      const proxyUrl = makeProxyUrl(jsonUrl);
      const response = await fetch(proxyUrl);
      
      if (!response.ok) continue;
      
      const text = await response.text();
      let data;
      
      try {
        data = JSON.parse(text);
      } catch (e) {
        // If it's wrapped in a proxy response
        const parsed = JSON.parse(text);
        data = parsed.contents ? JSON.parse(parsed.contents) : parsed;
      }
      
      if (!data?.[0]?.data?.children?.[0]) continue;
      
      const post = data[0].data.children[0].data;
      if (post.over_18) throw new Error('NSFW posts are not supported');
      
      const content = post.title + ' ' + (post.selftext || '');
      
      return {
        platform: 'reddit',
        url: 'https://reddit.com' + post.permalink,
        author: post.author,
        title: post.title,
        content: post.selftext || '',
        subreddit: post.subreddit,
        upvotes: post.ups,
        commentsCount: post.num_comments,
        postedAt: new Date(post.created_utc * 1000).toISOString(),
        intentScore: scoreIntent(content),
        signalTags: getSignalTags(content),
        contentHash: hashContent(post.title + post.selftext),
      };
    } catch (err) {
      lastError = err;
      continue;
    }
  }
  
  throw new Error('Failed to fetch Reddit post. Please try again.');
}

export default function AddSignalModal({ isOpen, onClose, onSaveSignal }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;
    setLoading(true);
    setError('');
    setPreview(null);
    try {
      const postData = await fetchRedditPost(url.trim());
      setPreview(postData);
    } catch (err) {
      setError(err.message || 'Failed to fetch post. Please check the URL.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await onSaveSignal(preview);
      setUrl('');
      setPreview(null);
      onClose();
    } catch (err) {
      setError('Failed to save signal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setPreview(null);
    setError('');
    onClose();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return diffDays + ' days ago';
    if (diffDays < 30) return Math.floor(diffDays / 7) + ' weeks ago';
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-[#0a0a0b] border border-[#27272a] rounded-2xl w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-[#27272a]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold">Add Signal</h2>
              <p className="text-[#a1a1aa] text-sm mt-1">Paste a Reddit post URL</p>
            </div>
            <button onClick={handleClose} className="text-[#71717a] hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleFetch} className="flex gap-3">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://reddit.com/r/..."
              className="flex-1 px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none"
            />
            <button
              type="submit"
              disabled={loading || !url.trim()}
              className="px-5 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <div className="w-5 h-5 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" /> : 'Fetch'}
            </button>
          </form>
        </div>

        <div className="p-6">
          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm mb-4">{error}</div>}

          {preview && (
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#22c55e] font-medium">r/{preview.subreddit}</span>
                  <span className="text-xs text-[#71717a]">• {formatDate(preview.postedAt)}</span>
                  <span className="text-xs text-[#71717a]">• u/{preview.author}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${INTENT_STYLES[preview.intentScore]?.bg} ${INTENT_STYLES[preview.intentScore]?.text}`}>
                  {INTENT_STYLES[preview.intentScore]?.label}
                </span>
              </div>
              <h4 className="font-medium mb-2">{preview.title}</h4>
              {preview.content && <p className="text-sm text-[#a1a1aa] line-clamp-3 mb-3">{preview.content}</p>}
              <div className="flex items-center gap-3 text-xs text-[#71717a] mb-4">
                <span>⬆️ {preview.upvotes}</span>
                <span>💬 {preview.commentsCount}</span>
                {preview.signalTags.map(tag => (
                  <span key={tag} className="flex items-center gap-1">{TAG_STYLES[tag]?.emoji} {TAG_STYLES[tag]?.label}</span>
                ))}
              </div>
              <a href={preview.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#22c55e] hover:underline">View on Reddit →</a>
            </div>
          )}

          {!preview && !error && !loading && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-[#161618] rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-[#71717a]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <p className="text-[#a1a1aa] text-sm mb-2">Paste a Reddit URL to preview</p>
              <p className="text-[#71717a] text-xs">Find posts where people express your pain point</p>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-[#71717a] text-sm">Fetching post data...</p>
            </div>
          )}
        </div>

        {preview && (
          <div className="p-6 border-t border-[#27272a] flex justify-end gap-3">
            <button onClick={handleClose} className="px-4 py-2 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : 'Save Signal'}
            </button>
          </div>
        )}

        <div className="px-6 pb-6">
          <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2"><span>💡</span> How to find good signals</h4>
            <ul className="text-xs text-[#a1a1aa] space-y-1">
              <li>• Search Reddit for your pain point (e.g., &quot;frustrated with expense tracking&quot;)</li>
              <li>• Look in subreddits like r/entrepreneur, r/smallbusiness, r/SaaS</li>
              <li>• Find posts where people complain or ask for solutions</li>
              <li>• Copy the post URL and paste it here</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}