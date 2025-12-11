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
      } catch {
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
  throw lastError || new Error('Failed to fetch Reddit post. Please try again.');
}

export default function AddSignalModal({ isOpen, onClose, onSaveSignal }) {
  const [activeTab, setActiveTab] = useState('search');
  const [url, setUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [saving, setSaving] = useState(false);
  const [savedUrls, setSavedUrls] = useState(new Set());

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setLoading(true);
    setError('');
    setSearchResults([]);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery, numResults: 10 }),
      });
      
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      // Score each result
      const scoredResults = data.results.map(result => ({
        ...result,
        intentScore: scoreIntent(result.title + ' ' + result.snippet),
        signalTags: getSignalTags(result.title + ' ' + result.snippet),
      }));
      
      setSearchResults(scoredResults);
    } catch (err) {
      setError(err.message || 'Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchUrl = async (e) => {
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

  const handleSaveFromSearch = async (result) => {
    setSaving(true);
    setError('');
    try {
      // Fetch full post data
      const postData = await fetchRedditPost(result.url);
      await onSaveSignal(postData);
      setSavedUrls(prev => new Set([...prev, result.url]));
    } catch (err) {
      setError('Failed to save: ' + (err.message || 'Unknown error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreview = async () => {
    if (!preview) return;
    setSaving(true);
    try {
      await onSaveSignal(preview);
      setUrl('');
      setPreview(null);
      onClose();
    } catch {
      setError('Failed to save signal. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setUrl('');
    setSearchQuery('');
    setPreview(null);
    setSearchResults([]);
    setError('');
    setSavedUrls(new Set());
    onClose();
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
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
      <div className="relative bg-[#0a0a0b] border border-[#27272a] rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#27272a]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Add Signal</h2>
            <button onClick={handleClose} className="text-[#71717a] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'search'
                  ? 'bg-[#22c55e] text-[#0a0a0b]'
                  : 'bg-[#27272a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              🔍 Search Reddit
            </button>
            <button
              onClick={() => setActiveTab('url')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'url'
                  ? 'bg-[#22c55e] text-[#0a0a0b]'
                  : 'bg-[#27272a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              🔗 Paste URL
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {activeTab === 'search' && (
            <div>
              {/* Search Form */}
              <form onSubmit={handleSearch} className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder='Search pain points... e.g. "frustrated with expense tracking"'
                    className="flex-1 px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] outline-none text-sm"
                  />
                  <button
                    type="submit"
                    disabled={loading || !searchQuery.trim()}
                    className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {loading ? '...' : 'Search'}
                  </button>
                </div>
                <p className="text-xs text-[#71717a] mt-2">
                  Searches Reddit posts from the last 30 days
                </p>
              </form>

              {/* Search Results */}
              {loading && (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                </div>
              )}

              {!loading && searchResults.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-[#71717a]">{searchResults.length} results found</p>
                  {searchResults.map((result, i) => {
                    const isSaved = savedUrls.has(result.url);
                    const intent = INTENT_STYLES[result.intentScore] || INTENT_STYLES.low;
                    
                    return (
                      <div
                        key={i}
                        className={`bg-[#161618] border rounded-xl p-4 transition-colors ${
                          isSaved ? 'border-[#22c55e]/50' : 'border-[#27272a] hover:border-[#3f3f46]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#22c55e] font-medium">r/{result.subreddit}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${intent.bg} ${intent.text}`}>
                                {intent.label}
                              </span>
                            </div>
                            <h3 className="font-medium text-sm mb-1 line-clamp-2">{result.title}</h3>
                            <p className="text-xs text-[#a1a1aa] line-clamp-2">{result.snippet}</p>
                            
                            {result.signalTags?.length > 0 && (
                              <div className="flex gap-1 mt-2">
                                {result.signalTags.map(tag => (
                                  <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-[#27272a] text-[#71717a]">
                                    {TAG_STYLES[tag]?.emoji} {TAG_STYLES[tag]?.label}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2 flex-shrink-0">
                            <button
                              onClick={() => handleSaveFromSearch(result)}
                              disabled={saving || isSaved}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                isSaved
                                  ? 'bg-[#22c55e]/20 text-[#22c55e]'
                                  : 'bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b]'
                              }`}
                            >
                              {isSaved ? '✓ Saved' : '+ Add'}
                            </button>
                            <a
                              href={result.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#27272a] hover:bg-[#3f3f46] text-center transition-colors"
                            >
                              View
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {!loading && searchResults.length === 0 && searchQuery && (
                <div className="text-center py-8 text-[#71717a]">
                  <p>No results found. Try different keywords.</p>
                </div>
              )}

              {!loading && searchResults.length === 0 && !searchQuery && (
                <div className="text-center py-8 text-[#71717a]">
                  <div className="w-12 h-12 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔍</span>
                  </div>
                  <p className="mb-2">Search for pain points on Reddit</p>
                  <p className="text-xs">Try: &quot;frustrated with&quot;, &quot;wish there was&quot;, &quot;looking for tool&quot;</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'url' && (
            <div>
              {/* URL Form */}
              <form onSubmit={handleFetchUrl} className="mb-4">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://reddit.com/r/..."
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] outline-none text-sm mb-3"
                />
                <button
                  type="submit"
                  disabled={loading || !url.trim()}
                  className="w-full px-4 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {loading ? 'Fetching...' : 'Fetch Post'}
                </button>
              </form>

              {/* Preview */}
              {preview && (
                <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-[#22c55e] font-medium">r/{preview.subreddit}</span>
                    <span className="text-sm text-[#71717a]">• u/{preview.author}</span>
                    <span className="text-sm text-[#71717a]">• {formatDate(preview.postedAt)}</span>
                  </div>
                  
                  <h3 className="font-bold mb-2">{preview.title}</h3>
                  
                  {preview.content && (
                    <p className="text-sm text-[#a1a1aa] mb-3 line-clamp-4">{preview.content}</p>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4 text-sm text-[#71717a]">
                    <span>⬆️ {preview.upvotes}</span>
                    <span>💬 {preview.commentsCount}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`text-xs px-2 py-1 rounded-full ${INTENT_STYLES[preview.intentScore].bg} ${INTENT_STYLES[preview.intentScore].text}`}>
                      {INTENT_STYLES[preview.intentScore].label}
                    </span>
                    {preview.signalTags?.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 rounded-full bg-[#27272a] text-[#71717a]">
                        {TAG_STYLES[tag]?.emoji} {TAG_STYLES[tag]?.label}
                      </span>
                    ))}
                  </div>
                  
                  <button
                    onClick={handleSavePreview}
                    disabled={saving}
                    className="w-full px-4 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {saving ? 'Saving...' : '+ Add Signal'}
                  </button>
                </div>
              )}

              {!preview && (
                <div className="text-center py-8 text-[#71717a]">
                  <div className="w-12 h-12 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">🔗</span>
                  </div>
                  <p>Paste a Reddit post URL to add it as a signal</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {savedUrls.size > 0 && (
          <div className="p-4 border-t border-[#27272a] bg-[#161618]">
            <div className="flex items-center justify-between">
              <span className="text-sm text-[#22c55e]">✓ {savedUrls.size} signal{savedUrls.size > 1 ? 's' : ''} added</span>
              <button
                onClick={handleClose}
                className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold text-sm transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}