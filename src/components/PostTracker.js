'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const PLATFORMS = [
  { id: 'reddit', name: 'Reddit', icon: '🔗', color: '#ff4500', urlPattern: /reddit\.com/ },
  { id: 'twitter', name: 'Twitter/X', icon: '𝕏', color: '#1da1f2', urlPattern: /twitter\.com|x\.com/ },
  { id: 'hackernews', name: 'Hacker News', icon: '🟧', color: '#ff6600', urlPattern: /news\.ycombinator\.com/ },
  { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0077b5', urlPattern: /linkedin\.com/ },
  { id: 'indiehackers', name: 'Indie Hackers', icon: '👨‍💻', color: '#1f2937', urlPattern: /indiehackers\.com/ },
  { id: 'other', name: 'Other', icon: '🌐', color: '#71717a', urlPattern: null },
];

export default function PostTracker({ projectId, landingPageSlug }) {
  const [posts, setPosts] = useState([]);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPost, setNewPost] = useState({ url: '', title: '', platform: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load posts
    const { data: postsData } = await supabase
      .from('validation_posts')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    // Load signups with referrer info
    const { data: signupsData } = await supabase
      .from('landing_page_signups')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    setPosts(postsData || []);
    setSignups(signupsData || []);
    setLoading(false);
  };

  const detectPlatform = (url) => {
    for (const platform of PLATFORMS) {
      if (platform.urlPattern && platform.urlPattern.test(url)) {
        return platform.id;
      }
    }
    return 'other';
  };

  const handleUrlChange = (url) => {
    setNewPost(prev => ({
      ...prev,
      url,
      platform: detectPlatform(url),
    }));
  };

  // Generate a short tracking code for this post
  const generateTrackingCode = () => {
    return Math.random().toString(36).substring(2, 8);
  };

  const handleAddPost = async (e) => {
    e.preventDefault();
    if (!newPost.url.trim()) return;

    setSaving(true);
    
    const trackingCode = generateTrackingCode();
    
    const { data, error } = await supabase
      .from('validation_posts')
      .insert({
        project_id: projectId,
        url: newPost.url.trim(),
        title: newPost.title.trim() || extractTitleFromUrl(newPost.url),
        platform: newPost.platform || detectPlatform(newPost.url),
        notes: newPost.notes.trim(),
        tracking_code: trackingCode,
      })
      .select()
      .single();

    if (!error && data) {
      setPosts(prev => [data, ...prev]);
      setNewPost({ url: '', title: '', platform: '', notes: '' });
      setShowAddModal(false);
    }
    
    setSaving(false);
  };

  const handleDeletePost = async (postId) => {
    const { error } = await supabase
      .from('validation_posts')
      .delete()
      .eq('id', postId);

    if (!error) {
      setPosts(prev => prev.filter(p => p.id !== postId));
    }
  };

  const extractTitleFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      if (url.includes('reddit.com')) {
        const match = url.match(/comments\/\w+\/([^/]+)/);
        if (match) return match[1].replace(/_/g, ' ').slice(0, 50);
      }
      return urlObj.hostname + urlObj.pathname.slice(0, 30);
    } catch {
      return 'Untitled Post';
    }
  };

  // Generate tracked landing page URL for a post
  const getTrackedUrl = (post) => {
    if (!landingPageSlug) return null;
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const trackingCode = post.tracking_code || post.id.slice(0, 8);
    return `${baseUrl}/p/${landingPageSlug}?ref=${trackingCode}`;
  };

  // Copy tracked URL to clipboard
  const copyTrackedUrl = (post) => {
    const url = getTrackedUrl(post);
    if (url) {
      navigator.clipboard.writeText(url);
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Calculate signups attributed to each post
  const getSignupsForPost = (post) => {
    const trackingCode = post.tracking_code || post.id.slice(0, 8);
    return signups.filter(s => {
      // Check if referrer contains our tracking code
      if (s.referrer && s.referrer.includes(`ref=${trackingCode}`)) return true;
      if (s.referrer && s.referrer.includes(trackingCode)) return true;
      // Also check platform-based attribution as fallback
      if (s.referrer) {
        if (post.platform === 'reddit' && s.referrer.includes('reddit.com')) return true;
        if (post.platform === 'twitter' && (s.referrer.includes('twitter.com') || s.referrer.includes('t.co') || s.referrer.includes('x.com'))) return true;
      }
      return false;
    });
  };

  // Get unattributed signups
  const getDirectSignups = () => {
    const attributedSignupIds = new Set();
    posts.forEach(post => {
      getSignupsForPost(post).forEach(s => attributedSignupIds.add(s.id));
    });
    return signups.filter(s => !attributedSignupIds.has(s.id));
  };

  // Stats
  const totalSignups = signups.length;
  const totalPosts = posts.length;
  const attributedSignups = signups.length - getDirectSignups().length;

  if (loading) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-[#71717a]">Loading posts...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold">Post Tracker</h2>
          <p className="text-sm text-[#71717a]">Track your validation posts and see which drive signups</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold rounded-lg transition-colors"
        >
          + Add Post
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#22c55e]">{totalPosts}</div>
          <div className="text-sm text-[#71717a]">Posts Shared</div>
        </div>
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#22c55e]">{totalSignups}</div>
          <div className="text-sm text-[#71717a]">Total Signups</div>
        </div>
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-[#22c55e]">{attributedSignups}</div>
          <div className="text-sm text-[#71717a]">Attributed</div>
        </div>
      </div>

      {/* How Tracking Works */}
      {landingPageSlug && posts.length === 0 && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
          <h4 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
            <span>💡</span> How tracking works
          </h4>
          <ol className="text-sm text-[#a1a1aa] space-y-2">
            <li><span className="text-blue-400 font-medium">1.</span> Add a post after sharing on Reddit, Twitter, etc.</li>
            <li><span className="text-blue-400 font-medium">2.</span> Each post gets a unique tracked link</li>
            <li><span className="text-blue-400 font-medium">3.</span> Use the tracked link in your bio or comments</li>
            <li><span className="text-blue-400 font-medium">4.</span> See exactly which posts drive signups</li>
          </ol>
        </div>
      )}

      {/* Landing Page Link Helper */}
      {landingPageSlug && (
        <div className="bg-[#22c55e]/10 border border-[#22c55e]/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#22c55e] mb-1">Your landing page is live!</p>
              <code className="text-xs text-[#a1a1aa] bg-[#0a0a0b] px-2 py-1 rounded block truncate">
                {typeof window !== 'undefined' ? window.location.origin : ''}/p/{landingPageSlug}
              </code>
            </div>
            <button
              onClick={() => {
                const url = `${window.location.origin}/p/${landingPageSlug}`;
                navigator.clipboard.writeText(url);
              }}
              className="px-3 py-1.5 bg-[#22c55e] text-[#0a0a0b] text-sm font-bold rounded-lg hover:bg-[#16a34a] transition-colors"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">✍️</span>
          </div>
          <h3 className="text-lg font-bold mb-2">No posts tracked yet</h3>
          <p className="text-[#71717a] mb-6 max-w-md mx-auto">
            Share your landing page on Reddit, Twitter, or other platforms, then add the post here to track signups.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold rounded-lg transition-colors"
          >
            + Add Your First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => {
            const platform = PLATFORMS.find(p => p.id === post.platform) || PLATFORMS.find(p => p.id === 'other');
            const postSignups = getSignupsForPost(post);
            const daysSincePost = Math.floor((Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60 * 24));
            const trackedUrl = getTrackedUrl(post);

            return (
              <div
                key={post.id}
                className="bg-[#161618] border border-[#27272a] rounded-xl p-4 hover:border-[#3f3f46] transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Platform Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center text-xl flex-shrink-0"
                    style={{ backgroundColor: `${platform.color}20`, color: platform.color }}
                  >
                    {platform.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="min-w-0">
                        <h4 className="font-medium text-white truncate">{post.title}</h4>
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#71717a] hover:text-[#22c55e] truncate block"
                        >
                          {post.url} ↗
                        </a>
                      </div>
                      
                      {/* Signups Badge */}
                      <div className={`px-3 py-1.5 rounded-lg text-sm font-bold flex-shrink-0 ${
                        postSignups.length > 0 
                          ? 'bg-[#22c55e]/20 text-[#22c55e]' 
                          : 'bg-[#27272a] text-[#71717a]'
                      }`}>
                        {postSignups.length} signup{postSignups.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {/* Tracked URL */}
                    {trackedUrl && (
                      <div className="mt-2 flex items-center gap-2">
                        <code className="text-xs text-[#a1a1aa] bg-[#0a0a0b] px-2 py-1 rounded truncate flex-1">
                          {trackedUrl}
                        </code>
                        <button
                          onClick={() => copyTrackedUrl(post)}
                          className={`px-2 py-1 text-xs font-medium rounded transition-colors ${
                            copiedId === post.id
                              ? 'bg-[#22c55e] text-[#0a0a0b]'
                              : 'bg-[#27272a] text-[#a1a1aa] hover:text-white'
                          }`}
                        >
                          {copiedId === post.id ? '✓ Copied' : 'Copy'}
                        </button>
                      </div>
                    )}

                    {/* Meta */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#71717a]">
                      <span className="flex items-center gap-1">
                        <span style={{ color: platform.color }}>{platform.icon}</span>
                        {platform.name}
                      </span>
                      <span>•</span>
                      <span>{daysSincePost === 0 ? 'Today' : daysSincePost === 1 ? 'Yesterday' : `${daysSincePost}d ago`}</span>
                      {post.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate">{post.notes}</span>
                        </>
                      )}
                    </div>

                    {/* Signups breakdown */}
                    {postSignups.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-[#27272a]">
                        <p className="text-xs text-[#71717a] mb-2">Signups from this post:</p>
                        <div className="flex flex-wrap gap-1">
                          {postSignups.slice(0, 5).map((signup, i) => (
                            <span
                              key={signup.id || i}
                              className="px-2 py-0.5 bg-[#22c55e]/10 text-[#22c55e] rounded text-xs"
                            >
                              {signup.email}
                            </span>
                          ))}
                          {postSignups.length > 5 && (
                            <span className="px-2 py-0.5 text-xs text-[#71717a]">
                              +{postSignups.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <a
                      href={post.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-[#27272a] rounded-lg text-[#71717a] hover:text-white transition-colors"
                      title="Open post"
                    >
                      ↗️
                    </a>
                    <button
                      onClick={() => handleDeletePost(post.id)}
                      className="p-2 hover:bg-red-500/20 rounded-lg text-[#71717a] hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Direct/Unattributed Signups Section */}
      {getDirectSignups().length > 0 && (
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
          <h4 className="font-medium mb-3 flex items-center gap-2">
            <span>📧</span>
            Direct/Unattributed Signups ({getDirectSignups().length})
          </h4>
          <p className="text-sm text-[#71717a] mb-3">
            These signups couldn't be attributed to a specific post. Use tracked links for better attribution!
          </p>
          <div className="flex flex-wrap gap-2">
            {getDirectSignups().slice(0, 10).map((signup, i) => (
              <span
                key={signup.id || i}
                className="px-2 py-1 bg-[#0a0a0b] border border-[#27272a] rounded text-xs text-[#a1a1aa]"
              >
                {signup.email}
              </span>
            ))}
            {getDirectSignups().length > 10 && (
              <span className="px-2 py-1 text-xs text-[#71717a]">
                +{getDirectSignups().length - 10} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Tips Section */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
        <h4 className="font-medium mb-3 flex items-center gap-2">
          <span>💡</span>
          Tips for Better Tracking
        </h4>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span className="text-[#a1a1aa]">Use the <strong className="text-white">tracked link</strong> in your post or bio</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span className="text-[#a1a1aa]">Each post has a unique link for attribution</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span className="text-[#a1a1aa]">Reply to comments with your tracked link</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span className="text-[#a1a1aa]">Test different platforms to see what works</span>
          </div>
        </div>
      </div>

      {/* Add Post Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl max-w-lg w-full">
            <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
              <h2 className="font-bold text-lg">Add Post</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddPost} className="p-4 space-y-4">
              {/* URL */}
              <div>
                <label className="block text-sm font-medium mb-2">Post URL *</label>
                <input
                  type="url"
                  value={newPost.url}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  placeholder="https://reddit.com/r/startups/..."
                  required
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
                />
              </div>

              {/* Platform (auto-detected) */}
              <div>
                <label className="block text-sm font-medium mb-2">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map(platform => (
                    <button
                      key={platform.id}
                      type="button"
                      onClick={() => setNewPost(prev => ({ ...prev, platform: platform.id }))}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                        newPost.platform === platform.id
                          ? 'bg-[#22c55e] text-[#0a0a0b]'
                          : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                      }`}
                    >
                      <span>{platform.icon}</span>
                      {platform.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium mb-2">Title (optional)</label>
                <input
                  type="text"
                  value={newPost.title}
                  onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="My validation post about..."
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                <textarea
                  value={newPost.notes}
                  onChange={(e) => setNewPost(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Any notes about this post..."
                  rows={2}
                  className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none resize-none"
                />
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-3 rounded-lg border border-[#27272a] hover:bg-[#27272a] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !newPost.url.trim()}
                  className="flex-1 px-4 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Adding...' : 'Add Post'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}