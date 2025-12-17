'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * ValidatedLeadsList - Improved leads management with notes and status tracking
 * 
 * REPLACES: Your existing ValidatedLeadsList.js
 * 
 * New features:
 * - Add notes to each lead
 * - Mark leads as "contacted" or "starred"
 * - Better visual distinction between attributed vs direct signups
 */
export default function ValidatedLeadsList({
  projectId,
  signals = [],
  outreachMap = {},
  onUpdateOutreach,
  projectPain
}) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch landing page signups
  useEffect(() => {
    if (projectId) {
      fetchLeads();
    }
  }, [projectId]);

  const fetchLeads = async () => {
    try {
      const { data } = await supabase
        .from('landing_page_signups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      setLeads(data || []);
    } catch (error) {
      console.error('Error fetching leads:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get interested leads from outreach
  const interestedFromOutreach = signals.filter(s => {
    const outreach = outreachMap[s.id];
    return outreach && ['interested', 'would_pay'].includes(outreach.status);
  });

  const waitlistSignups = leads;
  
  const attributedCount = leads.filter(l => l.source && l.source !== 'direct').length;
  const directCount = leads.filter(l => !l.source || l.source === 'direct').length;

  const handleExportCSV = () => {
    const csvContent = [
      ['Email', 'Source', 'Date', 'Notes', 'Contacted', 'Starred'].join(','),
      ...leads.map(l => [
        l.email,
        l.source || 'direct',
        new Date(l.created_at).toLocaleDateString(),
        `"${(l.notes || '').replace(/"/g, '""')}"`,
        l.contacted ? 'Yes' : 'No',
        l.starred ? 'Yes' : 'No'
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleUpdateLead = async (leadId, updates) => {
    try {
      await supabase
        .from('landing_page_signups')
        .update(updates)
        .eq('id', leadId);
      // Update local state
      setLeads(prev => prev.map(l => l.id === leadId ? { ...l, ...updates } : l));
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const handleDeleteLead = async (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    try {
      await supabase
        .from('landing_page_signups')
        .delete()
        .eq('id', leadId);
      setLeads(prev => prev.filter(l => l.id !== leadId));
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-[#1f1f23] flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-[#71717a] text-sm">Waitlist signups</span>
          </div>
          <p className="text-3xl font-bold text-white">{waitlistSignups.length}</p>
        </div>
        
        <div className="bg-[#141416] border border-[#27272a] rounded-xl p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <span className="text-[#71717a] text-sm">Interested from outreach</span>
          </div>
          <p className="text-3xl font-bold text-white">{interestedFromOutreach.length}</p>
        </div>
      </div>

      {/* Waitlist Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h2 className="font-semibold text-white text-lg">Waitlist Signups</h2>
          </div>
          
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-semibold text-sm transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export CSV
          </button>
        </div>

        {waitlistSignups.length === 0 ? (
          <div className="bg-[#141416] border border-[#27272a] rounded-xl p-8 text-center">
            <div className="w-12 h-12 rounded-full bg-[#1f1f23] flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#52525b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-[#71717a] mb-2">No signups yet</p>
            <p className="text-sm text-[#52525b]">
              Share your landing page to start collecting emails
            </p>
          </div>
        ) : (
          <div className="bg-[#141416] border border-[#27272a] rounded-xl overflow-hidden">
            <div className="divide-y divide-[#27272a]">
              {waitlistSignups.map((lead) => (
                <LeadRow 
                  key={lead.id} 
                  lead={lead} 
                  onUpdate={(updates) => handleUpdateLead(lead.id, updates)}
                  onDelete={() => handleDeleteLead(lead.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Attribution breakdown */}
      {waitlistSignups.length > 0 && (
        <div className="bg-[#1f1f23] border border-[#27272a] rounded-xl p-4 mb-8">
          <h3 className="text-sm font-medium text-white mb-3">Attribution</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              <span className="text-[#a1a1aa]">{attributedCount} from tracked links</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-[#71717a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span className="text-[#71717a]">{directCount} direct/unattributed</span>
            </div>
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-[#22c55e]/5 border border-[#22c55e]/20 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">💡</span>
          <h3 className="font-medium text-white">Tips for engaging your leads</h3>
        </div>
        <ul className="space-y-2 text-sm text-[#a1a1aa]">
          <li className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span>Email waitlist signups with updates and early access offers</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span>DM interested Reddit users with personalized messages</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span>Reference their original pain point in your outreach</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[#22c55e]">→</span>
            <span>Offer exclusive beta access or discounts</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

// Individual lead row component
function LeadRow({ lead, onUpdate, onDelete }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState(lead.notes || '');
  const [copied, setCopied] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(lead.email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveNotes = () => {
    onUpdate({ notes });
    setShowNotes(false);
  };

  const handleToggleStar = () => {
    onUpdate({ starred: !lead.starred });
    setShowMenu(false);
  };

  const handleToggleContacted = () => {
    onUpdate({ contacted: !lead.contacted });
    setShowMenu(false);
  };

  // Get initials for avatar
  const initials = lead.email.charAt(0).toUpperCase();
  
  // Generate consistent color from email
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500', 'bg-emerald-500', 'bg-cyan-500'];
  const colorIndex = lead.email.charCodeAt(0) % colors.length;
  const avatarColor = colors[colorIndex];

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="p-4 hover:bg-[#1a1a1c] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full ${avatarColor} flex items-center justify-center text-white font-semibold`}>
            {initials}
          </div>
          
          {/* Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-white">{lead.email}</span>
              {lead.starred && (
                <svg className="w-4 h-4 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
              {lead.contacted && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">
                  Contacted
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#52525b] mt-1">
              <span>
                From: {lead.source === 'direct' || !lead.source ? 'Direct visitor' : lead.source}
              </span>
              <span>•</span>
              <span>{formatDate(lead.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyEmail}
            className="px-3 py-1.5 rounded-lg text-sm text-[#71717a] hover:text-white hover:bg-[#27272a] transition-colors"
          >
            {copied ? (
              <span className="flex items-center gap-1 text-[#22c55e]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copied
              </span>
            ) : (
              'Copy Email'
            )}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-lg hover:bg-[#27272a] transition-colors text-[#71717a] hover:text-white"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            
            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-[#1a1a1c] border border-[#27272a] rounded-xl shadow-xl z-20 overflow-hidden">
                  <button
                    onClick={handleToggleStar}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill={lead.starred ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    {lead.starred ? 'Unstar' : 'Star'}
                  </button>
                  <button
                    onClick={handleToggleContacted}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {lead.contacted ? 'Mark as not contacted' : 'Mark as contacted'}
                  </button>
                  <button
                    onClick={() => { setShowNotes(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-[#a1a1aa] hover:bg-[#27272a] hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    {lead.notes ? 'Edit notes' : 'Add notes'}
                  </button>
                  <button
                    onClick={() => { onDelete(); setShowMenu(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Notes display */}
      {lead.notes && !showNotes && (
        <div className="mt-3 ml-14 text-sm text-[#71717a] bg-[#1f1f23] rounded-lg p-3">
          {lead.notes}
        </div>
      )}

      {/* Notes editor */}
      {showNotes && (
        <div className="mt-3 ml-14">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about this lead..."
            className="w-full px-3 py-2 bg-[#1f1f23] border border-[#27272a] rounded-lg text-white placeholder-[#52525b] text-sm resize-none focus:outline-none focus:border-[#22c55e]"
            rows={3}
          />
          <div className="flex justify-end gap-2 mt-2">
            <button
              onClick={() => setShowNotes(false)}
              className="px-3 py-1.5 rounded-lg text-sm text-[#71717a] hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNotes}
              className="px-3 py-1.5 rounded-lg text-sm bg-[#22c55e] text-[#0a0a0b] font-semibold hover:bg-[#16a34a] transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}