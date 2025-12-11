'use client';

export default function ResponseTracker({ projectId, projectName }) {
  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-12 text-center">
      <div className="w-20 h-20 bg-[#27272a] rounded-full flex items-center justify-center mx-auto mb-6">
        <span className="text-4xl">📊</span>
      </div>
      <h2 className="text-2xl font-bold mb-3">Response Tracking</h2>
      <p className="text-[#a1a1aa] mb-6 max-w-md mx-auto">
        Track engagement on your Reddit validation posts. See upvotes, comments, and replies all in one place.
      </p>
      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
        <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
        Coming Soon
      </div>
      <p className="text-xs text-[#71717a] mt-6">
        This feature requires Reddit API integration and will be available in a future update.
      </p>
    </div>
  );
}