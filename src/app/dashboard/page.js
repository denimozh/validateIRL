'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import NewProjectModal from '@/components/NewProjectModal';
import OnboardingChecklist from '@/components/OnboardingChecklist';
import { supabase } from '@/lib/supabase';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  
  const [projects, setProjects] = useState([]);
  const [allSignals, setAllSignals] = useState([]);
  const [allOutreach, setAllOutreach] = useState([]);
  const [totalSignups, setTotalSignups] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      setProjects(projectsData || []);

      // Fetch all signals
      const projectIds = (projectsData || []).map(p => p.id);
      if (projectIds.length > 0) {
        const { data: signalsData } = await supabase
          .from('signals')
          .select('*')
          .in('project_id', projectIds)
          .order('found_at', { ascending: false });
        setAllSignals(signalsData || []);

        const { data: outreachData } = await supabase
          .from('outreach')
          .select('*')
          .in('project_id', projectIds);
        setAllOutreach(outreachData || []);

        // Fetch total landing page signups
        const { count } = await supabase
          .from('landing_page_signups')
          .select('*', { count: 'exact', head: true })
          .in('project_id', projectIds);
        setTotalSignups(count || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async ({ name, painDescription, targetAudience }) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([{
        user_id: user.id,
        name,
        pain_description: painDescription,
        target_audience: targetAudience,
        status: 'validating',
      }])
      .select()
      .single();

    if (error) throw error;
    setProjects([data, ...projects]);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await supabase.from('projects').delete().eq('id', projectId);
      setProjects(projects.filter(p => p.id !== projectId));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  // Calculate stats
  const stats = {
    totalSignals: allSignals.length,
    contacted: allOutreach.filter(o => o.status !== 'found').length,
    replied: allOutreach.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length,
    wouldPay: allOutreach.filter(o => o.status === 'would_pay').length,
  };

  // Onboarding state
  const hasProject = projects.length > 0;
  const hasLandingPage = projects.some(p => p.landing_page_published);
  const hasSharedPost = projects.some(p => p.has_tracked_posts);

  // Get follow-ups due
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const followUpsDue = allOutreach
    .filter(o => o.follow_up_date)
    .map(o => {
      const signal = allSignals.find(s => s.id === o.signal_id);
      const project = projects.find(p => p.id === o.project_id);
      const followUpDate = new Date(o.follow_up_date);
      followUpDate.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((followUpDate - today) / (1000 * 60 * 60 * 24));
      return { ...o, signal, project, diffDays };
    })
    .filter(o => o.diffDays <= 1 && o.signal)
    .sort((a, b) => a.diffDays - b.diffDays);

  // Get recent signals
  const recentSignals = allSignals.slice(0, 5).map(s => ({
    ...s,
    project: projects.find(p => p.id === s.project_id),
    outreach: allOutreach.find(o => o.signal_id === s.id),
  }));

  // Get project stats
  const getProjectStats = (projectId) => {
    const projectOutreach = allOutreach.filter(o => o.project_id === projectId);
    return {
      signals: allSignals.filter(s => s.project_id === projectId).length,
      replied: projectOutreach.filter(o => ['replied', 'interested', 'would_pay'].includes(o.status)).length,
      wouldPay: projectOutreach.filter(o => o.status === 'would_pay').length,
    };
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">
      {/* Header */}
      <header className="border-b border-[#27272a]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 font-bold text-xl">
              <img src="/logo.svg" alt="ValidateIRL Logo" className="w-8 h-8 rounded-lg" />
              ValidateIRL
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-[#a1a1aa] hidden sm:block">{user?.email}</span>
              <button
                onClick={() => signOut()}
                className="text-sm text-[#71717a] hover:text-white transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'projects', label: 'Projects' },
              { id: 'follow-ups', label: 'Follow-ups', badge: followUpsDue.length },
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
                {tab.badge > 0 && (
                  <span className="px-1.5 py-0.5 text-xs rounded-full bg-red-500/20 text-red-400">
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === 'overview' ? (
          /* Overview Tab */
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Stats & Recent */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Onboarding Checklist */}
              <OnboardingChecklist
                hasProject={hasProject}
                hasLandingPage={hasLandingPage}
                hasSharedPost={hasSharedPost}
                signupCount={totalSignups}
                signupGoal={5}
                onNavigate={(action) => {
                  if (action === 'new-project') {
                    setShowNewProjectModal(true);
                  } else if (projects[0]) {
                    router.push(`/dashboard/project/${projects[0].id}`);
                  }
                }}
              />

              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Signals', value: stats.totalSignals, icon: '🎯', color: '' },
                  { label: 'Contacted', value: stats.contacted, icon: '📤', color: '' },
                  { label: 'Replied', value: stats.replied, icon: '💬', color: '' },
                  { label: '"I\'d Pay"', value: stats.wouldPay, icon: '💰', color: 'text-[#22c55e]' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{stat.icon}</span>
                      <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
                    </div>
                    <p className="text-xs text-[#71717a]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Signals */}
              <div className="bg-[#161618] border border-[#27272a] rounded-xl">
                <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
                  <h2 className="font-semibold">Recent Signals</h2>
                  <span className="text-xs text-[#71717a]">{allSignals.length} total</span>
                </div>
                {recentSignals.length === 0 ? (
                  <div className="p-8 text-center text-[#71717a]">
                    <p>No signals yet. Add some to a project!</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#27272a]">
                    {recentSignals.map(signal => (
                      <Link
                        key={signal.id}
                        href={`/dashboard/project/${signal.project_id}`}
                        className="flex items-center gap-4 p-4 hover:bg-[#1a1a1c] transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          signal.intent_score === 'high' ? 'bg-[#22c55e]' :
                          signal.intent_score === 'medium' ? 'bg-yellow-500' :
                          'bg-[#71717a]'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{signal.content?.split('\n')[0] || 'Untitled'}</p>
                          <p className="text-xs text-[#71717a]">
                            r/{signal.subreddit} • {signal.project?.name}
                          </p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          signal.outreach?.status === 'would_pay' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                          signal.outreach?.status === 'replied' ? 'bg-yellow-500/20 text-yellow-500' :
                          signal.outreach?.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
                          'bg-[#27272a] text-[#71717a]'
                        }`}>
                          {signal.outreach?.status || 'found'}
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Projects & Follow-ups */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="w-full px-5 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>

              {/* Due Today */}
              {followUpsDue.length > 0 && (
                <div className="bg-[#161618] border border-[#27272a] rounded-xl">
                  <div className="flex items-center gap-2 p-4 border-b border-[#27272a]">
                    <span>🔔</span>
                    <h2 className="font-semibold">Due Today</h2>
                    <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">
                      {followUpsDue.length}
                    </span>
                  </div>
                  <div className="divide-y divide-[#27272a]">
                    {followUpsDue.slice(0, 3).map(item => (
                      <Link
                        key={item.signal_id}
                        href={`/dashboard/project/${item.project_id}`}
                        className="flex items-center gap-3 p-3 hover:bg-[#1a1a1c] transition-colors"
                      >
                        <div className={`w-2 h-2 rounded-full ${
                          item.diffDays < 0 ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">u/{item.signal?.author}</p>
                          <p className="text-xs text-[#71717a]">{item.project?.name}</p>
                        </div>
                        <span className={`text-xs ${
                          item.diffDays < 0 ? 'text-red-400' : 'text-yellow-500'
                        }`}>
                          {item.diffDays < 0 ? 'Overdue' : 'Today'}
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects List */}
              <div className="bg-[#161618] border border-[#27272a] rounded-xl">
                <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
                  <h2 className="font-semibold">Projects</h2>
                  <span className="text-xs text-[#71717a]">{projects.length}</span>
                </div>
                {projects.length === 0 ? (
                  <div className="p-6 text-center text-[#71717a]">
                    <p className="text-sm">No projects yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#27272a]">
                    {projects.slice(0, 5).map(project => {
                      const pStats = getProjectStats(project.id);
                      return (
                        <Link
                          key={project.id}
                          href={`/dashboard/project/${project.id}`}
                          className="flex items-center gap-4 p-4 hover:bg-[#1a1a1c] transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{project.name}</p>
                            <p className="text-xs text-[#71717a]">
                              {pStats.signals} signals • {pStats.wouldPay} paying
                            </p>
                          </div>
                          {pStats.wouldPay >= 3 ? (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-[#22c55e]/20 text-[#22c55e]">
                              Validated ✓
                            </span>
                          ) : (
                            <span className="text-xs text-[#71717a]">
                              {pStats.wouldPay}/3
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'projects' ? (
          /* Projects Tab */
          <div>
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold">Your Projects</h1>
              <button
                onClick={() => setShowNewProjectModal(true)}
                className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Project
              </button>
            </div>

            {projects.length === 0 ? (
              <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">💡</span>
                </div>
                <h2 className="text-xl font-bold mb-2">No projects yet</h2>
                <p className="text-[#a1a1aa] mb-6">Create your first project to start validating</p>
                <button 
                  onClick={() => setShowNewProjectModal(true)}
                  className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
                >
                  + New Project
                </button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((project) => {
                  const pStats = getProjectStats(project.id);
                  const isValidated = pStats.wouldPay >= 3;
                  const progress = Math.min((pStats.wouldPay / 3) * 100, 100);
                  
                  return (
                    <Link
                      key={project.id}
                      href={`/dashboard/project/${project.id}`}
                      className="bg-[#161618] border border-[#27272a] rounded-xl p-5 hover:border-[#3f3f46] transition-all group"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold group-hover:text-[#22c55e] transition-colors truncate pr-2">
                          {project.name}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${
                          isValidated
                            ? 'bg-[#22c55e]/20 text-[#22c55e]'
                            : 'bg-yellow-500/20 text-yellow-500'
                        }`}>
                          {isValidated ? 'Validated ✓' : 'Validating'}
                        </span>
                      </div>
                      
                      {project.pain_description && (
                        <p className="text-sm text-[#a1a1aa] mb-4 line-clamp-2">{project.pain_description}</p>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-[#71717a] mb-3">
                        <span>🎯 {pStats.signals}</span>
                        <span>💬 {pStats.replied}</span>
                        <span>💰 {pStats.wouldPay}</span>
                      </div>
                      
                      <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-xs text-[#71717a] mt-2">{pStats.wouldPay}/3 "I'd pay" signals</p>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          setDeleteConfirm(project.id);
                        }}
                        className="mt-4 text-xs text-[#71717a] hover:text-red-400 transition-colors"
                      >
                        Delete project
                      </button>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Follow-ups Tab */
          <div>
            <h1 className="text-2xl font-bold mb-6">Follow-ups</h1>
            
            {allOutreach.filter(o => o.follow_up_date).length === 0 ? (
              <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
                <div className="w-16 h-16 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-3xl">🔔</span>
                </div>
                <h2 className="text-xl font-bold mb-2">No follow-ups scheduled</h2>
                <p className="text-[#a1a1aa]">Set reminders on signals to track your outreach</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Overdue & Today */}
                {followUpsDue.length > 0 && (
                  <div className="bg-[#161618] border border-[#27272a] rounded-xl">
                    <div className="p-4 border-b border-[#27272a]">
                      <h2 className="font-semibold text-red-400">Needs Attention</h2>
                    </div>
                    <div className="divide-y divide-[#27272a]">
                      {followUpsDue.map(item => (
                        <Link
                          key={item.signal_id}
                          href={`/dashboard/project/${item.project_id}`}
                          className="flex items-center gap-4 p-4 hover:bg-[#1a1a1c] transition-colors"
                        >
                          <div className={`w-3 h-3 rounded-full ${
                            item.diffDays < 0 ? 'bg-red-500 animate-pulse' : 'bg-yellow-500'
                          }`} />
                          <div className="flex-1">
                            <p className="font-medium">u/{item.signal?.author}</p>
                            <p className="text-sm text-[#71717a]">
                              r/{item.signal?.subreddit} • {item.project?.name}
                            </p>
                          </div>
                          <span className={`text-sm font-medium ${
                            item.diffDays < 0 ? 'text-red-400' : 'text-yellow-500'
                          }`}>
                            {item.diffDays < 0 ? `${Math.abs(item.diffDays)}d overdue` : 'Today'}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upcoming */}
                {allOutreach.filter(o => {
                  if (!o.follow_up_date) return false;
                  const d = new Date(o.follow_up_date);
                  d.setHours(0,0,0,0);
                  return Math.floor((d - today) / (1000*60*60*24)) > 1;
                }).length > 0 && (
                  <div className="bg-[#161618] border border-[#27272a] rounded-xl">
                    <div className="p-4 border-b border-[#27272a]">
                      <h2 className="font-semibold">Upcoming</h2>
                    </div>
                    <div className="divide-y divide-[#27272a]">
                      {allOutreach
                        .filter(o => {
                          if (!o.follow_up_date) return false;
                          const d = new Date(o.follow_up_date);
                          d.setHours(0,0,0,0);
                          return Math.floor((d - today) / (1000*60*60*24)) > 1;
                        })
                        .sort((a, b) => new Date(a.follow_up_date) - new Date(b.follow_up_date))
                        .slice(0, 10)
                        .map(item => {
                          const signal = allSignals.find(s => s.id === item.signal_id);
                          const project = projects.find(p => p.id === item.project_id);
                          return (
                            <Link
                              key={item.signal_id}
                              href={`/dashboard/project/${item.project_id}`}
                              className="flex items-center gap-4 p-4 hover:bg-[#1a1a1c] transition-colors"
                            >
                              <div className="w-3 h-3 rounded-full bg-[#71717a]" />
                              <div className="flex-1">
                                <p className="font-medium">u/{signal?.author}</p>
                                <p className="text-sm text-[#71717a]">
                                  r/{signal?.subreddit} • {project?.name}
                                </p>
                              </div>
                              <span className="text-sm text-[#71717a]">
                                {formatDate(item.follow_up_date)}
                              </span>
                            </Link>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={showNewProjectModal}
        onClose={() => setShowNewProjectModal(false)}
        onSubmit={handleCreateProject}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)} />
          <div className="relative bg-[#161618] border border-[#27272a] rounded-2xl p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-2">Delete Project?</h2>
            <p className="text-[#a1a1aa] mb-6">This will permanently delete the project and all its data.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white transition-colors"
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