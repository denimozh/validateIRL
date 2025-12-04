'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import NewProjectModal from '@/components/NewProjectModal';
import ProjectCard from '@/components/ProjectCard';
import { supabase } from '@/lib/supabase';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState([]);
  const [projectStats, setProjectStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Fetch projects
  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);

      // Fetch stats for each project
      const stats = {};
      for (const project of data || []) {
        stats[project.id] = await fetchProjectStats(project.id);
      }
      setProjectStats(stats);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectStats = async (projectId) => {
    try {
      const { data: signals } = await supabase
        .from('signals')
        .select('id')
        .eq('project_id', projectId);

      const { data: outreach } = await supabase
        .from('outreach')
        .select('status')
        .eq('project_id', projectId);

      return {
        totalSignals: signals?.length || 0,
        contacted: outreach?.filter(o => o.status !== 'found').length || 0,
        replied: outreach?.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length || 0,
        wouldPay: outreach?.filter(o => o.status === 'would_pay').length || 0,
      };
    } catch (error) {
      console.error('Error fetching project stats:', error);
      return { totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0 };
    }
  };

  const handleCreateProject = async ({ name, painDescription, targetAudience }) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          user_id: user.id,
          name,
          pain_description: painDescription,
          target_audience: targetAudience,
          status: 'validating',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    setProjects([data, ...projects]);
    setProjectStats({ ...projectStats, [data.id]: { totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0 } });
  };

  const handleDeleteProject = async (projectId) => {
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      setProjects(projects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  // Calculate totals
  const totals = Object.values(projectStats).reduce(
    (acc, stats) => ({
      totalSignals: acc.totalSignals + stats.totalSignals,
      contacted: acc.contacted + stats.contacted,
      replied: acc.replied + stats.replied,
      wouldPay: acc.wouldPay + stats.wouldPay,
    }),
    { totalSignals: 0, contacted: 0, replied: 0, wouldPay: 0 }
  );

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a] px-6 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl">
            <img src="/logo.svg" alt="ValidateIRL Logo" className="w-8 h-8 rounded-lg" />
            ValidateIRL
          </div>
          
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#a1a1aa] hidden sm:block">{user?.email}</span>
            <button
              onClick={handleSignOut}
              className="text-sm text-[#71717a] hover:text-white transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
            <p className="text-[#a1a1aa]">Validate ideas before you build them</p>
          </div>
          
          <button
            onClick={() => setShowNewProjectModal(true)}
            className="px-5 py-2.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Signals', value: totals.totalSignals, icon: '🎯' },
            { label: 'Contacted', value: totals.contacted, icon: '📤' },
            { label: 'Replied', value: totals.replied, icon: '💬' },
            { label: '"I\'d Pay"', value: totals.wouldPay, icon: '💰', highlight: totals.wouldPay >= 3 },
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

        {/* Projects List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#71717a]">Loading projects...</p>
            </div>
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
            <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold mb-2">No projects yet</h2>
            <p className="text-[#a1a1aa] mb-6">Create your first project to start finding real people with your pain</p>
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
            >
              + New Project
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                stats={projectStats[project.id]}
                onDelete={(id) => setDeleteConfirm(id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDeleteConfirm(null)}
          />
          <div className="relative bg-[#161618] border border-[#27272a] rounded-2xl p-8 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-2">Delete Project?</h2>
            <p className="text-[#a1a1aa] mb-6">
              This will permanently delete the project and all its signals and outreach data. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProject(deleteConfirm)}
                className="flex-1 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}