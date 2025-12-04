'use client';

import Link from 'next/link';

const STATUS_STYLES = {
  validating: {
    bg: 'bg-yellow-500/20',
    text: 'text-yellow-500',
    label: 'Validating',
  },
  validated: {
    bg: 'bg-[#22c55e]/20',
    text: 'text-[#22c55e]',
    label: 'Validated ✓',
  },
  pivoted: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    label: 'Pivoted',
  },
  building: {
    bg: 'bg-blue-500/20',
    text: 'text-blue-400',
    label: 'Building',
  },
};

export default function ProjectCard({ project, stats, onDelete }) {
  const status = STATUS_STYLES[project.status] || STATUS_STYLES.validating;
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6 hover:border-[#3f3f46] transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/project/${project.id}`}>
            <h3 className="text-lg font-bold truncate hover:text-[#22c55e] transition-colors cursor-pointer">
              {project.name}
            </h3>
          </Link>
          <p className="text-sm text-[#71717a] mt-1">
            Created {formatDate(project.created_at)}
          </p>
        </div>
        
        <span className={`${status.bg} ${status.text} text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ml-3`}>
          {status.label}
        </span>
      </div>

      {project.pain_description && (
        <p className="text-[#a1a1aa] text-sm mb-4 line-clamp-2">
          {project.pain_description}
        </p>
      )}

      {/* Stats Row */}
      <div className="flex gap-4 mb-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-[#71717a]">🎯</span>
          <span className="text-white font-medium">{stats?.totalSignals || 0}</span>
          <span className="text-[#71717a]">signals</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#71717a]">💬</span>
          <span className="text-white font-medium">{stats?.replied || 0}</span>
          <span className="text-[#71717a]">replied</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[#71717a]">💰</span>
          <span className={`font-medium ${(stats?.wouldPay || 0) >= 3 ? 'text-[#22c55e]' : 'text-white'}`}>
            {stats?.wouldPay || 0}
          </span>
          <span className="text-[#71717a]">&quot;I&apos;d pay&quot;</span>
        </div>
      </div>

      {/* Validation Progress */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1.5">
          <span className="text-[#71717a]">Validation Progress</span>
          <span className={`font-medium ${(stats?.wouldPay || 0) >= 3 ? 'text-[#22c55e]' : 'text-[#a1a1aa]'}`}>
            {stats?.wouldPay || 0}/3 signals
          </span>
        </div>
        <div className="h-1.5 bg-[#27272a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
            style={{ width: `${Math.min(((stats?.wouldPay || 0) / 3) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link 
          href={`/dashboard/project/${project.id}`}
          className="flex-1 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-semibold text-sm text-center transition-colors"
        >
          Open Project
        </Link>
        <button
          onClick={() => onDelete(project.id)}
          className="px-3 py-2 rounded-lg border border-[#27272a] text-[#71717a] hover:text-red-400 hover:border-red-400/30 transition-colors"
          title="Delete project"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}