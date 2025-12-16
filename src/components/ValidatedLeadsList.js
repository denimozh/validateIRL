'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import OutreachTemplates from './OutreachTemplates';

export default function ValidatedLeadsList({ projectId, signals, outreachMap, onUpdateOutreach, projectPain }) {
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loadingSignups, setLoadingSignups] = useState(true);

  // Fetch landing page signups
  useEffect(() => {
    if (projectId) {
      fetchSignups();
    }
  }, [projectId]);

  const fetchSignups = async () => {
    try {
      const { data } = await supabase
        .from('landing_page_signups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setSignups(data || []);
    } catch (error) {
      console.error('Error fetching signups:', error);
    } finally {
      setLoadingSignups(false);
    }
  };

  // Get "interested" leads from pipeline (potential upgrades)
  const interestedLeads = signals.filter(signal => 
    ['interested', 'would_pay'].includes(outreachMap[signal.id]?.status)
  );

  const openTemplates = (signal) => {
    setSelectedSignal(signal);
    setShowTemplates(true);
  };

  const copyEmail = async (email) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const exportSignups = () => {
    if (signups.length === 0) return;

    const csv = [
      ['Email', 'Source', 'Signed Up At'],
      ...signups.map(s => [
        s.email,
        s.referrer || 'Direct',
        new Date(s.created_at).toLocaleString(),
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `signups-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loadingSignups) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full mx-auto" />
        <p className="text-[#71717a] mt-4">Loading leads...</p>
      </div>
    );
  }

  if (signups.length === 0 && interestedLeads.length === 0) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
        <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-3xl">✉️</span>
        </div>
        <h2 className="text-xl font-bold mb-2">No leads yet</h2>
        <p className="text-[#a1a1aa] mb-4">
          When people sign up on your landing page, they&apos;ll appear here.
        </p>
        <p className="text-sm text-[#71717a]">
          Share your landing page to start collecting signups!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-[#161618] border border-[#22c55e]/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#22c55e]/20 rounded-full flex items-center justify-center">
              <span className="text-lg">✉️</span>
            </div>
            <div>
              <p className="text-2xl font-bold text-[#22c55e]">{signups.length}</p>
              <p className="text-xs text-[#71717a]">Waitlist signups</p>
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
              <p className="text-xs text-[#71717a]">Interested from outreach</p>
            </div>
          </div>
        </div>
      </div>

      {/* Waitlist Signups */}
      {signups.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>✉️</span>
              Waitlist Signups
            </h3>
            <button
              onClick={exportSignups}
              className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-xs font-bold transition-colors"
            >
              📥 Export CSV
            </button>
          </div>
          
          <div className="bg-[#161618] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              {signups.map((signup, index) => (
                <div 
                  key={signup.id}
                  className={`flex items-center justify-between p-4 ${
                    index !== signups.length - 1 ? 'border-b border-[#27272a]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 flex items-center justify-center text-[#22c55e] font-bold flex-shrink-0">
                      {signup.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{signup.email}</p>
                      <p className="text-xs text-[#71717a]">
                        {signup.referrer ? `From: ${signup.referrer}` : 'Direct'} · {formatDate(signup.created_at)}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => copyEmail(signup.email)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex-shrink-0 ${
                      copiedEmail === signup.email
                        ? 'bg-[#22c55e]/20 text-[#22c55e]'
                        : 'bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa]'
                    }`}
                  >
                    {copiedEmail === signup.email ? '✓ Copied' : 'Copy Email'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Interested Leads from Pipeline */}
      {interestedLeads.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <span>👀</span>
              Interested from Outreach
              <span className="text-xs text-[#71717a] font-normal">(from your pipeline)</span>
            </h3>
            <span className="text-xs text-[#71717a]">{interestedLeads.length} leads</span>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {interestedLeads.map(signal => {
              const outreach = outreachMap[signal.id];
              const subreddit = signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || 'reddit';
              
              return (
                <div 
                  key={signal.id}
                  className="bg-[#161618] border border-[#27272a] rounded-xl p-4"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {signal.author?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">u/{signal.author}</p>
                        <p className="text-xs text-[#71717a]">r/{subreddit}</p>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                      outreach?.status === 'would_pay' 
                        ? 'bg-[#22c55e]/20 text-[#22c55e]'
                        : 'bg-orange-500/20 text-orange-400'
                    }`}>
                      {outreach?.status === 'would_pay' ? "💰 I'd Pay" : '👀 Interested'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-[#a1a1aa] mb-3 line-clamp-2">
                    {signal.content?.split('\n')[0] || 'No content'}
                  </p>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-[#27272a]">
                    <button
                      onClick={() => openTemplates(signal)}
                      className="flex-1 px-3 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-xs font-bold transition-colors"
                    >
                      Message
                    </button>
                    <a
                      href={signal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-[#a1a1aa] text-xs font-medium transition-colors"
                    >
                      View Post
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4">
        <h4 className="font-medium mb-2 flex items-center gap-2">
          <span>💡</span>
          Tips for engaging your leads
        </h4>
        <ul className="text-sm text-[#a1a1aa] space-y-1">
          <li>• Email waitlist signups with updates and early access offers</li>
          <li>• DM interested Reddit users with personalized messages</li>
          <li>• Reference their original pain point in your outreach</li>
          <li>• Offer exclusive beta access or discounts</li>
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