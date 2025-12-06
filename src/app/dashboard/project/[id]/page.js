'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AddSignalModal from '@/components/AddSignalModal';
import SignalCard from '@/components/SignalCard';
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
      // Fetch signals
      const { data: signalsData, error: signalsError } = await supabase
        .from('signals')
        .select('*')
        .eq('project_id', id)
        .order('found_at', { ascending: false });

      if (signalsError) throw signalsError;
      setSignals(signalsData || []);

      // Fetch outreach data
      const { data: outreachData, error: outreachError } = await supabase
        .from('outreach')
        .select('*')
        .eq('project_id', id);

      if (outreachError) throw outreachError;

      // Create a map of signal_id -> outreach
      const outreach = {};
      for (const o of outreachData || []) {
        outreach[o.signal_id] = o;
      }
      setOutreachMap(outreach);

      // Calculate stats
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
      const { error } = await supabase
        .from('projects')
        .update({
          name: editForm.name,
          pain_description: editForm.painDescription,
          target_audience: editForm.targetAudience,
          status: editForm.status,
        })
        .eq('id', id);

      if (error) throw error;

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
      // Insert signal
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

      // Create outreach entry
      const { error: outreachError } = await supabase
        .from('outreach')
        .insert([{
          signal_id: insertedSignal.id,
          project_id: id,
          status: 'found',
        }]);

      if (outreachError) throw outreachError;

      // Refresh signals
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
        const { error } = await supabase
          .from('outreach')
          .update(updates)
          .eq('signal_id', signalId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('outreach')
          .insert({
            signal_id: signalId,
            project_id: id,
            ...updates,
          });

        if (error) throw error;
      }

      // Update local state
      setOutreachMap({
        ...outreachMap,
        [signalId]: { ...existingOutreach, ...updates },
      });

      // Recalculate stats
      await fetchSignals();
    } catch (error) {
      console.error('Error updating outreach:', error);
    }
  };

  const handleDeleteSignal = async (signalId) => {
    try {
      const { error } = await supabase
        .from('signals')
        .delete()
        .eq('id', signalId);

      if (error) throw error;

      setSignals(signals.filter(s => s.id !== signalId));
      
      const newOutreachMap = { ...outreachMap };
      delete newOutreachMap[signalId];
      setOutreachMap(newOutreachMap);

      // Recalculate stats
      await fetchSignals();
    } catch (error) {
      console.error('Error deleting signal:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          <p className="text-[#71717a]">Loading project...</p>
        </div>
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

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
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
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Project Header */}
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6 mb-6">
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Project Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Pain Description</label>
                <textarea
                  value={editForm.painDescription}
                  onChange={(e) => setEditForm({ ...editForm, painDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white focus:border-[#22c55e] focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Target Audience</label>
                <input
                  type="text"
                  value={editForm.targetAudience}
                  onChange={(e) => setEditForm({ ...editForm, targetAudience: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white focus:border-[#22c55e] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#a1a1aa] mb-2">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white focus:border-[#22c55e] focus:outline-none"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditing(false)}
                  className="px-4 py-2 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-semibold transition-colors disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-2xl font-bold mb-2">{project.name}</h1>
                  {project.pain_description && (
                    <p className="text-[#a1a1aa] mb-2">{project.pain_description}</p>
                  )}
                  {project.target_audience && (
                    <p className="text-sm text-[#71717a]">
                      <span className="text-[#a1a1aa]">Target:</span> {project.target_audience}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    project.status === 'validated' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                    project.status === 'pivoted' ? 'bg-red-500/20 text-red-400' :
                    project.status === 'building' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-yellow-500/20 text-yellow-500'
                  }`}>
                    {STATUS_OPTIONS.find(s => s.value === project.status)?.label}
                  </span>
                  <button
                    onClick={() => setEditing(true)}
                    className="p-2 rounded-lg border border-[#27272a] text-[#71717a] hover:text-white hover:border-[#3f3f46] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Signals', value: stats.totalSignals, icon: '🎯' },
            { label: 'Contacted', value: stats.contacted, icon: '📤' },
            { label: 'Replied', value: stats.replied, icon: '💬' },
            { label: '"I\'d Pay"', value: stats.wouldPay, icon: '💰', highlight: isValidated },
          ].map((stat, i) => (
            <div key={i} className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xl">{stat.icon}</span>
                <span className={`text-2xl font-bold ${stat.highlight ? 'text-[#22c55e]' : ''}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-sm text-[#71717a]">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Validation Progress */}
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">Validation Progress</h3>
            <span className={`text-sm font-medium ${isValidated ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}>
              {stats.wouldPay}/3 &quot;I&apos;d pay&quot; signals
            </span>
          </div>
          <div className="h-3 bg-[#27272a] rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
              style={{ width: `${validationProgress}%` }}
            />
          </div>
          <p className="text-sm text-[#71717a]">
            {isValidated 
              ? "🎉 Validated! You have enough signals to build with confidence."
              : `${3 - stats.wouldPay} more "I'd pay" signal${3 - stats.wouldPay !== 1 ? 's' : ''} needed to validate.`
            }
          </p>
        </div>

        {/* Signals Section */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Signals</h2>
          <button
            onClick={() => setShowSearchModal(true)}
            className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-semibold transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Signal
          </button>
        </div>

        {signals.length === 0 ? (
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No signals yet</h2>
            <p className="text-[#a1a1aa] mb-6">Add Reddit posts from people expressing your pain</p>
            <button 
              onClick={() => setShowSearchModal(true)}
              className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
            >
              + Add Your First Signal
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* High Intent */}
            {highIntentSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#22c55e] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#22c55e] rounded-full"></span>
                  High Intent ({highIntentSignals.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {highIntentSignals.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      outreach={outreachMap[signal.id]}
                      onUpdateOutreach={handleUpdateOutreach}
                      onDelete={handleDeleteSignal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Medium Intent */}
            {mediumIntentSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-yellow-500 mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Medium Intent ({mediumIntentSignals.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {mediumIntentSignals.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      outreach={outreachMap[signal.id]}
                      onUpdateOutreach={handleUpdateOutreach}
                      onDelete={handleDeleteSignal}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Low Intent */}
            {lowIntentSignals.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-[#71717a] mb-3 flex items-center gap-2">
                  <span className="w-2 h-2 bg-[#71717a] rounded-full"></span>
                  Low Intent ({lowIntentSignals.length})
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  {lowIntentSignals.map(signal => (
                    <SignalCard
                      key={signal.id}
                      signal={signal}
                      outreach={outreachMap[signal.id]}
                      onUpdateOutreach={handleUpdateOutreach}
                      onDelete={handleDeleteSignal}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
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