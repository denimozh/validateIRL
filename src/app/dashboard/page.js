'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';

function DashboardContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

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
            <span className="text-sm text-[#a1a1aa]">{user?.email}</span>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Your Projects</h1>
          <p className="text-[#a1a1aa]">Validate ideas before you build them</p>
        </div>

        {/* Empty State */}
        <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
          <div className="w-16 h-16 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">No projects yet</h2>
          <p className="text-[#a1a1aa] mb-6">Create your first project to start finding real people with your pain</p>
          <button className="px-6 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors">
            + New Project
          </button>
        </div>

        {/* Stats Preview (will populate later) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
          {[
            { label: 'Total Signals', value: '0', icon: '🎯' },
            { label: 'Contacted', value: '0', icon: '📤' },
            { label: 'Replied', value: '0', icon: '💬' },
            { label: '"I\'d Pay"', value: '0', icon: '💰' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">{stat.icon}</span>
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-sm text-[#71717a]">{stat.label}</p>
            </div>
          ))}
        </div>
      </main>
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