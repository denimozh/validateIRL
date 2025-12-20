'use client';

import { useState } from 'react';

export default function LandingPageChoice({ projectId, onChooseBuilder, onChooseEmbed }) {
  return (
    <div className="max-w-2xl mx-auto py-12">
      <h2 className="text-2xl font-bold text-center mb-2">Collect Signups</h2>
      <p className="text-[#a1a1aa] text-center mb-8">
        Get 5 signups to unlock your personalized launch roadmap
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Option 1: Use our builder */}
        <button
          onClick={onChooseBuilder}
          className="bg-[#161618] border border-[#27272a] rounded-xl p-6 text-left hover:border-[#22c55e] transition-all group"
        >
          <div className="w-12 h-12 bg-[#22c55e]/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#22c55e]/30 transition-colors">
            <svg className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">Create a landing page</h3>
          <p className="text-sm text-[#a1a1aa]">
            Don't have a website yet? Build a simple landing page in minutes with our builder.
          </p>
          <span className="inline-block mt-4 text-sm text-[#22c55e] font-medium">
            Start building →
          </span>
        </button>

        {/* Option 2: Use embed */}
        <button
          onClick={onChooseEmbed}
          className="bg-[#161618] border border-[#27272a] rounded-xl p-6 text-left hover:border-[#22c55e] transition-all group"
        >
          <div className="w-12 h-12 bg-[#22c55e]/20 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#22c55e]/30 transition-colors">
            <svg className="w-6 h-6 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          </div>
          <h3 className="font-semibold text-lg mb-2">I have a website</h3>
          <p className="text-sm text-[#a1a1aa]">
            Already have a landing page? Add our signup form with one line of code.
          </p>
          <span className="inline-block mt-4 text-sm text-[#22c55e] font-medium">
            Get embed code →
          </span>
        </button>
      </div>
    </div>
  );
}