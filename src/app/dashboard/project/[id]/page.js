'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
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
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0 });

  useEffect(() => {
    if (user && id) {
      fetchProject();
      fetchStats();
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
      
      // Check if user owns this project
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

  const fetchStats = async () => {
    try {
      const { data: signals } = await supabase
        .from('signals')
        .select('id')
        .eq('project_id', id);

      const { data: outreach } = await supabase
        .from('outreach')
        .select('status')
        .eq('project_id', id);

      setStats({
        totalSignals: signals?.length || 0,
        contacted: outreach?.filter(o => o.status !== 'found').length || 0,
        replied: outreach?.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length || 0,
        wouldPay: outreach?.filter(o => o.status === 'would_pay').length || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
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

        {/* Signals Section - Placeholder for now */}
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 text-center">
          <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">No signals yet</h2>
          <p className="text-[#a1a1aa] mb-6">Search for real people expressing your pain</p>
          <button className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors">
            🔍 Search for Signals
          </button>
          <p className="text-xs text-[#71717a] mt-4">Coming next: Reddit API integration</p>
        </div>
      </main>
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