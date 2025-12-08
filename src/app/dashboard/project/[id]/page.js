'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AddSignalModal from '@/components/AddSignalModal';
import SignalCard from '@/components/SignalCard';
import PipelineView from '@/components/PipelineView';
import LaunchRoadmap from '@/components/LaunchRoadmap';
import { supabase } from '@/lib/supabase';

const STATUS_OPTIONS = [
  { value: 'validating', label: 'Validating', color: 'yellow' },
  { value: 'validated', label: 'Validated ✓', color: 'green' },
  { value: 'pivoted', label: 'Pivoted', color: 'red' },
  { value: 'building', label: 'Building', color: 'blue' },
];

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
  const [stats, setStats] = useState({ totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0 });
  const [activeTab, setActiveTab] = useState('pipeline');

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
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('project_id', id)
        .order('found_at', { ascending: false });

      if (signalsError) throw signalsError;
      setSignals(signalsData || []);

      const { data: outreachData, error: outreachError } = await supabase
        .from('outreach')
        .select('*')
        .eq('project_id', id);

      if (outreachError) throw outreachError;

      const outreach = {};
      for (const o of outreachData || []) {
        outreach[o.signal_id] = o;
      }
      setOutreachMap(outreach);

      const totalSignals = signalsData?.length || 0;
      const contacted = outreachData?.filter(o => o.status !== 'found').length || 0;
      const replied = outreachData?.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length || 0;
      const wouldPay = outreachData?.filter(o => o.status === 'would_pay').length || 0;

      setStats({ totalSignals, contacted, replied, wouldPay });
    } catch (error) {
      console.error('Error fetching signals:', error);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await supabase
        .from('projects')
        .update({
          name: editForm.name,
          pain_description: editForm.painDescription,
          target_audience: editForm.targetAudience,
          status: editForm.status,
        })
        .eq('id', id);

      setProject({
        ...project,
        name: editForm.name,
        pain_description: editForm.painDescription,
        target_audience: editForm.targetAudience,
        status: editForm.status,
      });
      setEditing(false);
    } catch (error) {
      console.error('Error updating project:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSignal = async (signal) => {
    try {
      const signalToInsert = {
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
      };

      const { data: insertedSignal, error: signalError } = await supabase
        .from('signals')
        .insert([signalToInsert])
        .select()
        .single();

      if (signalError) throw signalError;

      await supabase
        .from('outreach')
        .insert([{ signal_id: insertedSignal.id, project_id: id, status: 'found' }]);

      await fetchSignals();
    } catch (error) {
      console.error('Error saving signal:', error);
      throw error;
    }
  };

  const handleUpdateOutreach = async (signalId, updates) => {
    try {
      const existingOutreach = outreachMap[signalId];

      if (existingOutreach) {
        await supabase.from('outreach').update(updates).eq('signal_id', signalId);
      } else {
        await supabase.from('outreach').insert({ signal_id: signalId, project_id: id, ...updates });
      }

      setOutreachMap({ ...outreachMap, [signalId]: { ...existingOutreach, ...updates } });
      await fetchSignals();
    } catch (error) {
      console.error('Error updating outreach:', error);
    }
  };

  const handleDeleteSignal = async (signalId) => {
    try {
      await supabase.from('signals').delete().eq('id', signalId);
      setSignals(signals.filter(s => s.id !== signalId));
      const newOutreachMap = { ...outreachMap };
      delete newOutreachMap[signalId];
      setOutreachMap(newOutreachMap);
      await fetchSignals();
    } catch (error) {
      console.error('Error deleting signal:', error);
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

  const validationProgress = Math.min((stats.wouldPay / 3) * 100, 100);
  const isValidated = stats.wouldPay >= 3;

  // Group signals by intent
  const highIntentSignals = signals.filter(s => s.intent_score === 'high');
  const mediumIntentSignals = signals.filter(s => s.intent_score === 'medium');
  const lowIntentSignals = signals.filter(s => s.intent_score === 'low');

  // Get follow-ups due
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const followUpsDue = Object.values(outreachMap)
    .filter(o => o.follow_up_date)
    .filter(o => {
      const d = new Date(o.follow_up_date);
      d.setHours(0, 0, 0, 0);
      return Math.floor((d - today) / (1000 * 60 * 60 * 24)) <= 1;
    });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 h-16">
            <Link href="/dashboard" className="text-[#71717a] hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div className="flex items-center gap-2 font-bold text-xl">
              <img src="/logo.svg" alt="ValidateIRL Logo" className="w-8 h-8 rounded-lg" />
              ValidateIRL
            </div>
          </div>

          {/* Project Header & Tabs */}
          <div className="py-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                {editing ? (
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="text-2xl font-bold bg-transparent border-b border-[#27272a] focus:border-[#22c55e] outline-none w-full"
                  />
                ) : (
                  <h1 className="text-2xl font-bold truncate">{project.name}</h1>
                )}
                {project.pain_description && !editing && (
                  <p className="text-[#a1a1aa] mt-1 truncate">{project.pain_description}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  isValidated ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                  project.status === 'pivoted' ? 'bg-red-500/20 text-red-400' :
                  project.status === 'building' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-yellow-500/20 text-yellow-500'
                }`}>
                  {isValidated ? 'Validated ✓' : STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                </span>
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="px-3 py-1 text-sm text-[#71717a] hover:text-white">Cancel</button>
                    <button onClick={handleSave} disabled={saving} className="px-3 py-1 text-sm bg-[#22c55e] text-[#0a0a0b] rounded-lg font-medium">
                      {saving ? '...' : 'Save'}
                    </button>
                  </>
                ) : (
                  <button onClick={() => setEditing(true)} className="p-2 text-[#71717a] hover:text-white">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'pipeline', label: 'Pipeline' },
              { id: 'list', label: 'List View' },
              { id: 'roadmap', label: 'Launch Roadmap', locked: !isValidated },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-[#22c55e] text-white'
                    : 'border-transparent text-[#71717a] hover:text-white'
                }`}
              >
                {tab.label}
                {tab.locked && <span className="text-[10px]">🔒</span>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Stats */}
          <div className="lg:col-span-1 space-y-4">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              {[
                { label: 'Signals', value: stats.totalSignals, icon: '🎯' },
                { label: 'Contacted', value: stats.contacted, icon: '📤' },
                { label: 'Replied', value: stats.replied, icon: '💬' },
                { label: '"I\'d Pay"', value: stats.wouldPay, icon: '💰', highlight: true },
              ].map((stat, i) => (
                <div key={i} className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <span>{stat.icon}</span>
                    <span className={`text-xl font-bold ${stat.highlight ? 'text-[#22c55e]' : ''}`}>{stat.value}</span>
                  </div>
                  <p className="text-xs text-[#71717a] mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Validation Progress */}
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Validation</span>
                <span className={`text-sm ${isValidated ? 'text-[#22c55e]' : 'text-[#71717a]'}`}>
                  {stats.wouldPay}/3
                </span>
              </div>
              <div className="h-2 bg-[#27272a] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all"
                  style={{ width: `${validationProgress}%` }}
                />
              </div>
              <p className="text-xs text-[#71717a] mt-2">
                {isValidated ? '✓ Ready to build!' : `${3 - stats.wouldPay} more needed`}
              </p>
            </div>

            {/* Follow-ups Due */}
            {followUpsDue.length > 0 && (
              <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span>🔔</span>
                  <span className="text-sm font-medium">Due Today</span>
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">{followUpsDue.length}</span>
                </div>
                <div className="space-y-2">
                  {followUpsDue.slice(0, 3).map(o => {
                    const signal = signals.find(s => s.id === o.signal_id);
                    return signal ? (
                      <a key={o.signal_id} href={signal.url} target="_blank" rel="noopener noreferrer" className="block text-sm text-[#a1a1aa] hover:text-[#22c55e] truncate">
                        u/{signal.author}
                      </a>
                    ) : null;
                  })}
                </div>
              </div>
            )}

            {/* Add Signal Button */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="w-full px-4 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Signal
            </button>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {signals.length === 0 ? (
              <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🎯</span>
                </div>
                <h2 className="text-xl font-bold mb-2">No signals yet</h2>
                <p className="text-[#a1a1aa] mb-6">Find Reddit posts where people express your pain</p>
                <button 
                  onClick={() => setShowSearchModal(true)}
                  className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
                >
                  + Add Your First Signal
                </button>
              </div>
            ) : activeTab === 'pipeline' ? (
              <PipelineView 
                signals={signals}
                outreachMap={outreachMap}
                onUpdateOutreach={handleUpdateOutreach}
              />
            ) : activeTab === 'roadmap' ? (
              <LaunchRoadmap 
                signals={signals}
                outreachMap={outreachMap}
                isValidated={isValidated}
                wouldPayCount={stats.wouldPay}
              />
            ) : (
              /* List View */
              <div className="space-y-4">
                {highIntentSignals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#22c55e] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                      High Intent ({highIntentSignals.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {highIntentSignals.map(signal => (
                        <SignalCard key={signal.id} signal={signal} outreach={outreachMap[signal.id]} onUpdateOutreach={handleUpdateOutreach} onDelete={handleDeleteSignal} />
                      ))}
                    </div>
                  </div>
                )}
                {mediumIntentSignals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-yellow-500 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                      Medium Intent ({mediumIntentSignals.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {mediumIntentSignals.map(signal => (
                        <SignalCard key={signal.id} signal={signal} outreach={outreachMap[signal.id]} onUpdateOutreach={handleUpdateOutreach} onDelete={handleDeleteSignal} />
                      ))}
                    </div>
                  </div>
                )}
                {lowIntentSignals.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-[#71717a] mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-[#71717a] rounded-full"></span>
                      Low Intent ({lowIntentSignals.length})
                    </h3>
                    <div className="grid md:grid-cols-2 gap-3">
                      {lowIntentSignals.map(signal => (
                        <SignalCard key={signal.id} signal={signal} outreach={outreachMap[signal.id]} onUpdateOutreach={handleUpdateOutreach} onDelete={handleDeleteSignal} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add Signal Modal */}
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