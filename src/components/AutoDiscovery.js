'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function AutoDiscovery({ 
  projectId, 
  projectName,
  painDescription,
  isEnabled,
  lastDiscoveryAt,
  onNewSignals,
  onToggle,
}) {
  const [enabled, setEnabled] = useState(isEnabled || false);
  const [loading, setLoading] = useState(false);
  const [nextUpdate, setNextUpdate] = useState(null);
  const [newSignalsCount, setNewSignalsCount] = useState(0);

  // Calculate time until next update (every hour)
  useEffect(() => {
    if (!enabled || !lastDiscoveryAt) return;

    const updateCountdown = () => {
      const last = new Date(lastDiscoveryAt);
      const next = new Date(last.getTime() + 60 * 60 * 1000); // 1 hour
      const now = new Date();
      const diff = next - now;

      if (diff <= 0) {
        setNextUpdate('Running...');
        runDiscovery();
      } else {
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setNextUpdate(`${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [enabled, lastDiscoveryAt]);

  const runDiscovery = useCallback(async () => {
    if (loading) return;
    setLoading(true);

    try {
      // Generate search queries from project info
      const queries = generateQueries(projectName, painDescription);
      
      let allResults = [];
      
      // Search with first 2 queries
      for (const query of queries.slice(0, 2)) {
        try {
          const response = await fetch('/api/search', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, numResults: 5 }),
          });
          
          const data = await response.json();
          if (data.results) {
            allResults.push(...data.results);
          }
        } catch (err) {
          console.error('Search error:', err);
        }
      }

      // Get existing signal URLs
      const { data: existingSignals } = await supabase
        .from('signals')
        .select('url')
        .eq('project_id', projectId);
      
      const existingUrls = new Set(existingSignals?.map(s => s.url) || []);

      // Filter to new signals only
      const newSignals = allResults.filter(r => !existingUrls.has(r.url));

      if (newSignals.length > 0) {
        // Insert new signals
        const signalsToInsert = newSignals.slice(0, 5).map(signal => ({
          project_id: projectId,
          platform: 'reddit',
          url: signal.url,
          author: signal.author || 'unknown',
          content: (signal.title || '') + ' ' + (signal.snippet || ''),
          subreddit: signal.subreddit || extractSubreddit(signal.url),
          intent_score: scoreIntent((signal.title || '') + ' ' + (signal.snippet || '')),
          signal_tags: getSignalTags((signal.title || '') + ' ' + (signal.snippet || '')),
          found_at: new Date().toISOString(),
        }));

        const { data: inserted, error } = await supabase
          .from('signals')
          .insert(signalsToInsert)
          .select();

        if (!error && inserted) {
          setNewSignalsCount(prev => prev + inserted.length);
          if (onNewSignals) onNewSignals(inserted);
        }
      }

      // Update last discovery time
      await supabase
        .from('projects')
        .update({ last_discovery_at: new Date().toISOString() })
        .eq('id', projectId);

    } catch (err) {
      console.error('Discovery error:', err);
    } finally {
      setLoading(false);
    }
  }, [projectId, projectName, painDescription, loading, onNewSignals]);

  const handleToggle = async () => {
    const newEnabled = !enabled;
    setEnabled(newEnabled);

    // Save to database
    await supabase
      .from('projects')
      .update({ 
        auto_discovery_enabled: newEnabled,
        last_discovery_at: newEnabled ? new Date().toISOString() : null,
      })
      .eq('id', projectId);

    if (onToggle) onToggle(newEnabled);

    // Run immediately if just enabled
    if (newEnabled) {
      runDiscovery();
    }
  };

  const handleManualRun = () => {
    runDiscovery();
  };

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${enabled ? 'bg-[#22c55e] animate-pulse' : 'bg-[#71717a]'}`} />
          <div>
            <h4 className="font-medium text-sm">
              {enabled ? 'Auto-discovery active' : 'Auto-discovery paused'}
            </h4>
            <p className="text-xs text-[#71717a]">
              {enabled 
                ? 'Searching for new leads every hour' 
                : 'Enable to find new leads automatically'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {enabled && nextUpdate && (
            <div className="text-right hidden sm:block">
              <p className="text-xs text-[#71717a]">Next update</p>
              <p className="text-sm font-mono text-[#22c55e]">{nextUpdate}</p>
            </div>
          )}

          {newSignalsCount > 0 && (
            <div className="px-2 py-1 bg-[#22c55e]/20 rounded-full">
              <span className="text-xs text-[#22c55e] font-medium">+{newSignalsCount} new</span>
            </div>
          )}

          <button
            onClick={handleToggle}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              enabled ? 'bg-[#22c55e]' : 'bg-[#27272a]'
            }`}
          >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
              enabled ? 'left-7' : 'left-1'
            }`} />
          </button>
        </div>
      </div>

      {enabled && (
        <div className="mt-4 pt-4 border-t border-[#27272a] flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs text-[#71717a]">
            <span>🔍 Searching Reddit hourly</span>
            <span>📊 Based on your pain description</span>
          </div>
          <button
            onClick={handleManualRun}
            disabled={loading}
            className="text-xs px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] transition-colors disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Run now'}
          </button>
        </div>
      )}
    </div>
  );
}

function generateQueries(projectName, painDescription) {
  const keywords = painDescription
    ?.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(' ')
    .filter(w => w.length > 3)
    .slice(0, 5) || [];

  return [
    `${keywords.slice(0, 3).join(' ')} site:reddit.com`,
    `frustrated ${keywords[0] || 'with'} site:reddit.com`,
    `looking for ${keywords.slice(0, 2).join(' ')} site:reddit.com`,
  ];
}

function extractSubreddit(url) {
  if (!url) return 'unknown';
  const match = url.match(/reddit\.com\/r\/(\w+)/);
  return match ? match[1] : 'unknown';
}

function scoreIntent(content) {
  const lower = content.toLowerCase();
  const highIntent = ["i'd pay", "i would pay", "take my money", "wish someone would build", "why doesn't this exist", "i need this"];
  const mediumIntent = ["frustrated with", "anyone else struggle", "looking for", "is there a tool", "alternative to", "tired of"];
  
  if (highIntent.some(p => lower.includes(p))) return 'high';
  if (mediumIntent.some(p => lower.includes(p))) return 'medium';
  return 'low';
}

function getSignalTags(content) {
  const lower = content.toLowerCase();
  const tags = [];
  
  const patterns = {
    complaint: ["hate", "frustrated", "annoying", "terrible", "sucks"],
    workaround: ["i currently use", "my workaround", "right now i"],
    budget_mention: ["$", "pay", "cost", "price", "subscription"]
  };
  
  for (const [tag, words] of Object.entries(patterns)) {
    if (words.some(w => lower.includes(w))) tags.push(tag);
  }
  
  return tags;
}