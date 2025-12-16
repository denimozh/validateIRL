'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AddSignalModal from '@/components/AddSignalModal';
import SignalCard from '@/components/SignalCard';
import PipelineView from '@/components/PipelineView';
import LaunchCalendar from '@/components/LaunchCalendar';
import ValidatedLeadsList from '@/components/ValidatedLeadsList';
import IdeaInsights from '@/components/IdeaInsights';
import MicroTasks from '@/components/MicroTasks';
import Streaks from '@/components/Streaks';
import AutoDiscovery from '@/components/AutoDiscovery';
import ResponseTracker from '@/components/ResponseTracker';
import LandingPageBuilder from '@/components/LandingPageBuilder';
import PostTracker from '@/components/PostTracker';
import { supabase } from '@/lib/supabase';

function ProjectContent({ params }) {
  const { id } = use(params);
  const { user } = useAuth();
  const router = useRouter();

  const [project, setProject] = useState(null);
  const [signals, setSignals] = useState([]);
  const [outreachMap, setOutreachMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [stats, setStats] = useState({ totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0, landingPageSignups: 0 });
  const [activeTab, setActiveTab] = useState('landing');
  const SIGNUP_GOAL = 5; // Number of signups needed to unlock launch roadmap

  const exportToCSV = () => {
    const headers = [
      'Author',
      'Subreddit', 
      'URL',
      'Content',
      'Intent Score',
      'Status',
      'Notes',
      'Follow-up Date',
      'Found At',
      'Contacted At'
    ];

    const rows = signals.map(signal => {
      const outreach = outreachMap[signal.id] || {};
      const subreddit = signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || '';
      
      return [
        signal.author || '',
        subreddit,
        signal.url || '',
        (signal.content || '').replace(/"/g, '""').replace(/\n/g, ' '),
        signal.intent_score || '',
        outreach.status || 'found',
        (outreach.notes || '').replace(/"/g, '""').replace(/\n/g, ' '),
        outreach.follow_up_date || '',
        signal.found_at || '',
        outreach.contacted_at || ''
      ];
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project?.name || 'signals'}-export.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    if (user && id) {
      fetchProject();
      fetchSignals();
    }
  }, [user, id]);

  const fetchProject = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data.user_id !== user.id) {
        router.push('/dashboard');
        return;
      }

      setProject(data);
      setEditForm({
        name: data.name,
        painDescription: data.pain_description || '',
        targetAudience: data.target_audience || '',
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching project:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchSignals = async () => {
    try {
      const { data: signalsData } = await supabase
        .from('signals')
        .select('*')
        .eq('project_id', id)
        .order('found_at', { ascending: false });

      setSignals(signalsData || []);

      const { data: outreachData } = await supabase
        .from('outreach')
        .select('*')
        .eq('project_id', id);

      const outreach = {};
      for (const o of outreachData || []) {
        outreach[o.signal_id] = o;
      }
      setOutreachMap(outreach);

      // Fetch landing page signups count
      const { count: signupCount } = await supabase
        .from('landing_page_signups')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', id);

      setStats({
        totalSignals: signalsData?.length || 0,
        contacted: outreachData?.filter(o => o.status !== 'found').length || 0,
        replied: outreachData?.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length || 0,
        wouldPay: outreachData?.filter(o => o.status === 'would_pay').length || 0,
        landingPageSignups: signupCount || 0,
      });
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase.from('projects').update({
        name: editForm.name,
        pain_description: editForm.painDescription,
        target_audience: editForm.targetAudience,
        status: editForm.status,
      }).eq('id', id);

      setProject({ ...project, ...editForm });
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignal = async (signal) => {
    const { data: insertedSignal } = await supabase
      .from('signals')
      .insert([{
        project_id: id,
        platform: signal.platform,
        url: signal.url,
        author: signal.author,
        content: signal.title + (signal.content ? '\n\n' + signal.content : ''),
        subreddit: signal.subreddit,
        upvotes: signal.upvotes,
        comments_count: signal.commentsCount,
        posted_at: signal.postedAt,
        intent_score: signal.intentScore,
        signal_tags: signal.signalTags,
        content_hash: signal.contentHash,
      }])
      .select()
      .single();

    await supabase.from('outreach').insert([{ signal_id: insertedSignal.id, project_id: id, status: 'found' }]);
    await fetchSignals();
  };

  const handleUpdateOutreach = async (signalId, updates) => {
    const existing = outreachMap[signalId];
    if (existing) {
      await supabase.from('outreach').update(updates).eq('signal_id', signalId);
    } else {
      await supabase.from('outreach').insert({ signal_id: signalId, project_id: id, ...updates });
    }
    setOutreachMap({ ...outreachMap, [signalId]: { ...existing, ...updates } });
    await fetchSignals();
  };

  const handleDeleteSignal = async (signalId) => {
    try {
      await supabase.from('signals').delete().eq('id', signalId);
      setSignals(prev => prev.filter(s => s.id !== signalId));
      setOutreachMap(prev => {
        const newMap = { ...prev };
        delete newMap[signalId];
        return newMap;
      });
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) return null;

  const validationProgress = Math.min((stats.landingPageSignups / SIGNUP_GOAL) * 100, 100);
  const isValidated = stats.landingPageSignups >= SIGNUP_GOAL;

  // Calculate follow-ups due
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUpsDue = signals.filter(signal => {
    const outreach = outreachMap[signal.id];
    if (!outreach?.follow_up_date) return false;
    const followUp = new Date(outreach.follow_up_date);
    followUp.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((followUp - today) / (1000 * 60 * 60 * 24));
    return diffDays <= 0; // Overdue or due today
  });

  const overdueCount = signals.filter(signal => {
    const outreach = outreachMap[signal.id];
    if (!outreach?.follow_up_date) return false;
    const followUp = new Date(outreach.follow_up_date);
    followUp.setHours(0, 0, 0, 0);
    return followUp < today;
  }).length;

  const dueTodayCount = followUpsDue.length - overdueCount;

  const highIntentSignals = signals.filter(s => s.intent_score === 'high');
  const mediumIntentSignals = signals.filter(s => s.intent_score === 'medium');
  const lowIntentSignals = signals.filter(s => s.intent_score === 'low');

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Compact Header */}
      <header className="border-b border-[#27272a] sticky top-0 bg-[#0a0a0b]/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Top row */}
          <div className="flex items-center gap-3 h-12">
            <Link href="/dashboard" className="text-[#71717a] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="text-lg font-bold bg-transparent border-b border-[#27272a] focus:border-[#22c55e] outline-none max-w-xs"
                />
              ) : (
                <h1 className="text-lg font-bold truncate">{project.name}</h1>
              )}
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                isValidated ? 'bg-[#22c55e]/20 text-[#22c55e]' : 'bg-yellow-500/20 text-yellow-500'
              }`}>
                {isValidated ? '✓ Validated' : `${stats.landingPageSignups}/${SIGNUP_GOAL} signups`}
              </span>
            </div>

            {editing ? (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(false)} className="text-sm text-[#71717a] hover:text-white">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-sm bg-[#22c55e] text-[#0a0a0b] rounded-lg font-medium">
                  {saving ? '...' : 'Save'}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setEditing(true)} className="p-1.5 text-[#71717a] hover:text-white" title="Edit project">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={signals.length === 0}
                  className="p-1.5 text-[#71717a] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export to CSV"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setShowSearchModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-bold transition-colors flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Add Signal</span>
                </button>
              </div>
            )}
          </div>

          {/* Stats row + Progress */}
          <div className="flex items-center gap-4 sm:gap-6 py-2 text-sm overflow-x-auto">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span>🎯</span>
              <span className="font-medium">{stats.totalSignals}</span>
              <span className="text-[#71717a] hidden sm:inline">signals</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span>📤</span>
              <span className="font-medium">{stats.contacted}</span>
              <span className="text-[#71717a] hidden sm:inline">contacted</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span>💬</span>
              <span className="font-medium">{stats.replied}</span>
              <span className="text-[#71717a] hidden sm:inline">replied</span>
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span>✉️</span>
              <span className={`font-medium ${isValidated ? 'text-[#22c55e]' : ''}`}>{stats.landingPageSignups}</span>
              <span className="text-[#71717a] hidden sm:inline">signups</span>
            </div>
            
            {!isValidated && (
              <>
                <div className="flex-1" />
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="w-20 h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full"
                      style={{ width: `${validationProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#71717a]">{SIGNUP_GOAL - stats.landingPageSignups} to go</span>
                </div>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { id: 'landing', label: 'Page', emoji: '🏠' },
              { id: 'posts', label: 'Posts', emoji: '✍️' },
              { id: 'responses', label: 'Responses', emoji: '📊' },
              { id: 'leads', label: 'Leads', emoji: '👥', count: stats.landingPageSignups },
              { id: 'pipeline', label: 'Pipeline', emoji: '📋' },
              { id: 'roadmap', label: 'Launch', emoji: '🚀', locked: !isValidated },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 flex-shrink-0 ${
                  activeTab === tab.id
                    ? 'border-[#22c55e] text-white'
                    : 'border-transparent text-[#71717a] hover:text-white'
                }`}
              >
                {tab.emoji && <span className="text-xs">{tab.emoji}</span>}
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                    {tab.count}
                  </span>
                )}
                {tab.locked && (
                  <span className="text-[10px]">🔒</span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Validated Banner */}
      {isValidated && activeTab !== 'roadmap' && (
        <div className="bg-gradient-to-r from-[#22c55e]/10 to-[#16a34a]/10 border-b border-[#22c55e]/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="text-xl flex-shrink-0">🎉</span>
              <div className="min-w-0">
                <p className="font-medium text-[#22c55e]">You&apos;re validated!</p>
                <p className="text-sm text-[#a1a1aa] truncate">{stats.landingPageSignups} people signed up. Time to launch.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('roadmap')}
              className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-bold transition-colors flex-shrink-0"
            >
              Launch Roadmap →
            </button>
          </div>
        </div>
      )}

      {/* Follow-up Alert Bar */}
      {followUpsDue.length > 0 && (
        <div className={`border-b ${overdueCount > 0 ? 'bg-red-500/10 border-red-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className={`${overdueCount > 0 ? 'animate-pulse' : ''}`}>🔔</span>
              <span className={overdueCount > 0 ? 'text-red-400' : 'text-yellow-500'}>
                {overdueCount > 0 && <span className="font-medium">{overdueCount} overdue</span>}
                {overdueCount > 0 && dueTodayCount > 0 && <span className="text-[#71717a]"> · </span>}
                {dueTodayCount > 0 && <span className="font-medium">{dueTodayCount} due today</span>}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('list')}
              className={`text-sm font-medium hover:underline ${overdueCount > 0 ? 'text-red-400' : 'text-yellow-500'}`}
            >
              View in List →
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Tab Content - Always show, no signal requirement */}
        {activeTab === 'landing' ? (
          <LandingPageBuilder
            projectId={id}
            projectName={project.name}
            projectPain={project.pain_description}
            targetAudience={project.target_audience}
          />
        ) : activeTab === 'posts' ? (
          <PostTracker
            projectId={id}
            landingPageSlug={project.landing_page_published ? project.landing_page_slug : null}
          />
        ) : activeTab === 'responses' ? (
          <ResponseTracker
            projectId={id}
            projectName={project.name}
          />
        ) : activeTab === 'leads' ? (
          <ValidatedLeadsList
            projectId={id}
            signals={signals}
            outreachMap={outreachMap}
            onUpdateOutreach={handleUpdateOutreach}
            projectPain={project.pain_description}
          />
        ) : activeTab === 'pipeline' ? (
          <>
            {/* Auto Discovery - Only show on Pipeline tab */}
            <div className="mb-6">
              <AutoDiscovery
                projectId={id}
                projectName={project.name}
                painDescription={project.pain_description}
                isEnabled={project.auto_discovery_enabled}
                lastDiscoveryAt={project.last_discovery_at}
                onNewSignals={(newSignals) => {
                  setSignals(prev => [...newSignals, ...prev]);
                }}
                onToggle={(enabled) => {
                  setProject(prev => ({ ...prev, auto_discovery_enabled: enabled }));
                }}
              />
            </div>
            
            {signals.length === 0 ? (
              <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-xl font-bold mb-2">No signals yet</h2>
                <p className="text-[#a1a1aa] mb-6">Find Reddit posts where people express your pain point</p>
                <button 
                  onClick={() => setShowSearchModal(true)}
                  className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
                >
                  + Add Your First Signal
                </button>
              </div>
            ) : (
              <>
                {/* Widgets Row */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <MicroTasks signals={signals} outreachMap={outreachMap} />
                  <Streaks signals={signals} outreachMap={outreachMap} projectCreatedAt={project.created_at} />
                </div>
                
                <PipelineView 
                  signals={signals}
                  outreachMap={outreachMap}
                  onUpdateOutreach={handleUpdateOutreach}
                  onDelete={handleDeleteSignal}
                />
              </>
            )}
          </>
        ) : activeTab === 'roadmap' ? (
          <LaunchCalendar 
            projectId={id}
            signals={signals}
            outreachMap={outreachMap}
            isValidated={isValidated}
            signupCount={stats.landingPageSignups}
            signupGoal={SIGNUP_GOAL}
            projectName={project.name}
            projectPain={project.pain_description}
            targetAudience={project.target_audience}
            savedCalendar={project.calendar_data}
            savedProgress={project.calendar_progress}
            onUpdate={(updates) => setProject(prev => ({ ...prev, ...updates }))}
          />
        ) : (
          <div className="text-center text-[#71717a] py-12">
            Select a tab to view content
          </div>
        )}
      </main>

      <AddSignalModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onSaveSignal={handleSaveSignal}
      />
    </div>
  );
}

export default function ProjectPage({ params }) {
  return (
    <ProtectedRoute>
      <ProjectContent params={params} />
    </ProtectedRoute>
  );
}