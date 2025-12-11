'use client';

import { useState } from 'react';

export default function IdeaInsights({ signals, outreachMap, projectName, projectPain }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateInsights = async () => {
    setLoading(true);
    setError(null);

    try {
      // Prepare signal data for analysis
      const signalData = signals.map(signal => ({
        content: signal.content,
        subreddit: signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || '',
        intentScore: signal.intent_score,
        tags: signal.signal_tags,
        notes: outreachMap[signal.id]?.notes || '',
        status: outreachMap[signal.id]?.status || 'found',
      }));

      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectPain,
          signals: signalData,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate insights');

      const data = await response.json();
      setInsights(data.insights);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (signals.length < 3) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🧠</span>
        </div>
        <h3 className="font-bold mb-2">Not enough data yet</h3>
        <p className="text-sm text-[#71717a]">
          Add at least 3 signals to generate AI insights about your idea.
        </p>
        <p className="text-xs text-[#71717a] mt-2">
          Currently: {signals.length}/3 signals
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span>🧠</span> Idea Insights
          </h2>
          <p className="text-sm text-[#71717a]">
            AI analysis of your signals to help adapt your idea
          </p>
        </div>
        <button
          onClick={generateInsights}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold text-sm transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#0a0a0b] border-t-transparent rounded-full animate-spin" />
              Analyzing...
            </>
          ) : insights ? (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Insights
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      {!insights && !loading && !error && (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">✨</span>
          </div>
          <h3 className="font-bold mb-2">Ready to analyze</h3>
          <p className="text-sm text-[#71717a] mb-4">
            Click &quot;Generate Insights&quot; to get AI-powered recommendations based on your {signals.length} signals.
          </p>
          <p className="text-xs text-[#71717a]">
            The AI will analyze patterns, pain points, and suggest how to adapt your idea.
          </p>
        </div>
      )}

      {loading && (
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-2xl">🧠</span>
          </div>
          <h3 className="font-bold mb-2">Analyzing your signals...</h3>
          <p className="text-sm text-[#71717a]">
            Looking for patterns, pain points, and opportunities
          </p>
        </div>
      )}

      {insights && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Pain Points */}
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>😤</span> Common Pain Points
            </h3>
            <ul className="space-y-2">
              {insights.painPoints?.map((point, i) => (
                <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2">
                  <span className="text-[#22c55e] mt-1">→</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Feature Suggestions */}
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>💡</span> Feature Suggestions
            </h3>
            <ul className="space-y-2">
              {insights.features?.map((feature, i) => (
                <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2">
                  <span className="text-[#22c55e] mt-1">→</span>
                  {feature}
                </li>
              ))}
            </ul>
          </div>

          {/* Pivot Ideas */}
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>🔄</span> Pivot Considerations
            </h3>
            <ul className="space-y-2">
              {insights.pivots?.map((pivot, i) => (
                <li key={i} className="text-sm text-[#a1a1aa] flex items-start gap-2">
                  <span className="text-yellow-500 mt-1">→</span>
                  {pivot}
                </li>
              ))}
            </ul>
          </div>

          {/* Keywords */}
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>🔑</span> People Keep Mentioning
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.keywords?.map((keyword, i) => (
                <span
                  key={i}
                  className="text-xs px-2 py-1 rounded-full bg-[#27272a] text-[#a1a1aa]"
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* Refined Idea */}
          <div className="md:col-span-2 bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/10 border border-[#22c55e]/30 rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>🎯</span> Refined Idea
            </h3>
            <p className="text-[#a1a1aa]">{insights.refinedIdea}</p>
          </div>

          {/* Top Communities */}
          <div className="md:col-span-2 bg-[#161618] border border-[#27272a] rounded-xl p-5">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <span>📍</span> Where Your Audience Hangs Out
            </h3>
            <div className="flex flex-wrap gap-2">
              {insights.communities?.map((community, i) => (
                <a
                  key={i}
                  href={`https://reddit.com/r/${community}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#22c55e] transition-colors"
                >
                  r/{community}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}