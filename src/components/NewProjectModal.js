'use client';

import { useState } from 'react';

export default function NewProjectModal({ isOpen, onClose, onSubmit }) {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [painDescription, setPainDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // AI generated content
  const [aiSetup, setAiSetup] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSignals, setSelectedSignals] = useState([]);
  const [searching, setSearching] = useState(false);
  const [copiedReddit, setCopiedReddit] = useState(false);
  const [copiedTwitter, setCopiedTwitter] = useState(false);

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!painDescription.trim()) {
      setError('Pain description is required');
      return;
    }

    setLoading(true);

    try {
      // Get AI setup
      const response = await fetch('/api/project-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectName: name, painDescription, targetAudience }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);
      
      setAiSetup(data);
      setStep(2);

      // Auto-search for signals
      searchForSignals(data.searchQueries);
    } catch (err) {
      setError(err.message || 'Failed to setup project');
    } finally {
      setLoading(false);
    }
  };

  const searchForSignals = async (queries) => {
    setSearching(true);
    const allResults = [];

    try {
      // Search with first 2 queries to get diverse results
      for (const query of queries.slice(0, 2)) {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query, numResults: 5 }),
        });

        const data = await response.json();
        if (data.results) {
          allResults.push(...data.results);
        }
      }

      // Dedupe by URL
      const unique = allResults.filter((r, i, arr) => 
        arr.findIndex(x => x.url === r.url) === i
      ).slice(0, 8);

      setSearchResults(unique);
      setSelectedSignals(unique.map(r => r.url)); // Select all by default
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  const toggleSignal = (url) => {
    if (selectedSignals.includes(url)) {
      setSelectedSignals(selectedSignals.filter(u => u !== url));
    } else {
      setSelectedSignals([...selectedSignals, url]);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Create project with AI setup data
      await onSubmit({ 
        name, 
        painDescription, 
        targetAudience,
        aiSetup,
        initialSignals: searchResults.filter(r => selectedSignals.includes(r.url))
      });
      
      // Reset form
      resetForm();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setName('');
    setPainDescription('');
    setTargetAudience('');
    setAiSetup(null);
    setSearchResults([]);
    setSelectedSignals([]);
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const copyToClipboard = async (text, type) => {
    await navigator.clipboard.writeText(text);
    if (type === 'reddit') {
      setCopiedReddit(true);
      setTimeout(() => setCopiedReddit(false), 2000);
    } else {
      setCopiedTwitter(true);
      setTimeout(() => setCopiedTwitter(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="relative bg-[#0a0a0b] border border-[#27272a] rounded-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#27272a]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-bold">
              {step === 1 ? 'New Project' : step === 2 ? 'Validation Setup' : 'Initial Signals'}
            </h2>
            <button onClick={handleClose} className="text-[#71717a] hover:text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  s < step ? 'bg-[#22c55e] text-[#0a0a0b]' :
                  s === step ? 'bg-[#22c55e] text-[#0a0a0b]' :
                  'bg-[#27272a] text-[#71717a]'
                }`}>
                  {s < step ? '✓' : s}
                </div>
                {s < 3 && <div className={`w-8 h-0.5 ${s < step ? 'bg-[#22c55e]' : 'bg-[#27272a]'}`} />}
              </div>
            ))}
            <span className="text-xs text-[#71717a] ml-2">
              {step === 1 ? 'Define idea' : step === 2 ? 'Post templates' : 'Find signals'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Expense Tracker for Freelancers"
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Pain Description *
                </label>
                <textarea
                  value={painDescription}
                  onChange={(e) => setPainDescription(e.target.value)}
                  placeholder="What problem are you solving? Be specific about the frustration."
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] outline-none resize-none"
                />
                <p className="text-xs text-[#71717a] mt-1">AI will use this to find relevant posts and generate templates</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">
                  Target Audience
                </label>
                <input
                  type="text"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  placeholder="e.g., Freelancers, solopreneurs, small agencies"
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#161618] text-white placeholder-[#71717a] focus:border-[#22c55e] outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" />
                    AI is setting up your project...
                  </span>
                ) : (
                  'Continue →'
                )}
              </button>
            </form>
          )}

          {/* Step 2: Validation Posts */}
          {step === 2 && aiSetup && (
            <div className="space-y-6">
              {/* Suggested Subreddits */}
              <div>
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <span>🎯</span> Recommended Subreddits
                </h3>
                <div className="space-y-2">
                  {aiSetup.subreddits?.map((sub, i) => (
                    <a
                      key={i}
                      href={`https://reddit.com/r/${sub.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 bg-[#161618] border border-[#27272a] rounded-lg hover:border-[#22c55e]/50 transition-colors"
                    >
                      <div>
                        <span className="text-[#22c55e] font-medium">r/{sub.name}</span>
                        <p className="text-xs text-[#71717a] mt-0.5">{sub.reason}</p>
                      </div>
                      <span className="text-[#71717a]">→</span>
                    </a>
                  ))}
                </div>
              </div>

              {/* Reddit Post Template */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span>📝</span> Reddit Validation Post
                  </h3>
                  <button
                    onClick={() => copyToClipboard(
                      `${aiSetup.redditPost?.title}\n\n${aiSetup.redditPost?.body}`,
                      'reddit'
                    )}
                    className="text-xs px-2 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] transition-colors"
                  >
                    {copiedReddit ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
                  <p className="font-medium mb-2">{aiSetup.redditPost?.title}</p>
                  <p className="text-sm text-[#a1a1aa] whitespace-pre-wrap">{aiSetup.redditPost?.body}</p>
                </div>
                <p className="text-xs text-[#71717a] mt-2">
                  💡 Post this in the subreddits above to validate your idea
                </p>
              </div>

              {/* Twitter Post Template */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <span>🐦</span> Twitter/X Post
                  </h3>
                  <button
                    onClick={() => copyToClipboard(aiSetup.twitterPost || '', 'twitter')}
                    className="text-xs px-2 py-1 rounded bg-[#27272a] hover:bg-[#3f3f46] transition-colors"
                  >
                    {copiedTwitter ? '✓ Copied!' : 'Copy'}
                  </button>
                </div>
                <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
                  <p className="text-sm">{aiSetup.twitterPost}</p>
                  <p className="text-xs text-[#71717a] mt-2">
                    {aiSetup.twitterPost?.length || 0}/280 characters
                  </p>
                </div>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
              >
                Continue to Signals →
              </button>
            </div>
          )}

          {/* Step 3: Initial Signals */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">Found Signals</h3>
                  <p className="text-xs text-[#71717a]">Select posts to add to your project</p>
                </div>
                {searching && (
                  <div className="flex items-center gap-2 text-xs text-[#71717a]">
                    <div className="w-3 h-3 border border-[#22c55e] border-t-transparent rounded-full animate-spin" />
                    Searching...
                  </div>
                )}
              </div>

              {searchResults.length === 0 && !searching ? (
                <div className="text-center py-8 text-[#71717a]">
                  <p>No posts found. You can add signals manually later.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((result, i) => {
                    const isSelected = selectedSignals.includes(result.url);
                    return (
                      <div
                        key={i}
                        onClick={() => toggleSignal(result.url)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          isSelected 
                            ? 'bg-[#22c55e]/10 border-[#22c55e]/50' 
                            : 'bg-[#161618] border-[#27272a] hover:border-[#3f3f46]'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                            isSelected ? 'bg-[#22c55e] border-[#22c55e]' : 'border-[#71717a]'
                          }`}>
                            {isSelected && <span className="text-[#0a0a0b] text-xs">✓</span>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs text-[#22c55e]">r/{result.subreddit}</span>
                            </div>
                            <p className="text-sm font-medium line-clamp-1">{result.title}</p>
                            <p className="text-xs text-[#71717a] line-clamp-1 mt-0.5">{result.snippet}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-[#27272a]">
                <span className="text-sm text-[#71717a]">
                  {selectedSignals.length} signal{selectedSignals.length !== 1 ? 's' : ''} selected
                </span>
                <button
                  onClick={handleFinalSubmit}
                  disabled={loading}
                  className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Project 🚀'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Back Button for Step 2 & 3 */}
        {step > 1 && (
          <div className="p-4 border-t border-[#27272a]">
            <button
              onClick={() => setStep(step - 1)}
              className="text-sm text-[#71717a] hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}