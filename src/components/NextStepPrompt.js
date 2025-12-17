'use client';

import { useState } from 'react';

/**
 * NextStepPrompt - Contextual guidance after completing actions
 * 
 * ADD THIS: Import and use after key actions like publishing page, adding signal, etc.
 * 
 * Usage:
 * {justPublished && (
 *   <NextStepPrompt
 *     variant="page-published"
 *     onAction={() => setActiveTab('posts')}
 *     onDismiss={() => setJustPublished(false)}
 *   />
 * )}
 */
export default function NextStepPrompt({ variant, onAction, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const variants = {
    'page-published': {
      icon: '✅',
      title: 'Your page is live!',
      description: 'Now share it and track which posts drive signups',
      actionLabel: 'Go to Post Tracker',
      color: 'border-[#22c55e]/30 bg-[#22c55e]/5'
    },
    'first-signal': {
      icon: '🎯',
      title: 'Signal saved!',
      description: 'Start reaching out to turn signals into conversations',
      actionLabel: 'View Pipeline',
      color: 'border-pink-400/30 bg-pink-400/5'
    },
    'first-signup': {
      icon: '🎉',
      title: 'You got your first signup!',
      description: '4 more to validate demand. Keep sharing!',
      actionLabel: 'Add More Posts',
      color: 'border-[#22c55e]/30 bg-[#22c55e]/5'
    },
    'halfway': {
      icon: '🔥',
      title: 'Halfway there!',
      description: 'You\'re at 3/5 signups. The finish line is close!',
      actionLabel: 'View Progress',
      color: 'border-amber-400/30 bg-amber-400/5'
    },
    'validated': {
      icon: '🚀',
      title: 'Demand validated!',
      description: '5 signups means people want this. Time to launch!',
      actionLabel: 'View Launch Roadmap',
      color: 'border-[#22c55e]/30 bg-[#22c55e]/5'
    }
  };

  const config = variants[variant];
  if (!config) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <div className={`
      ${config.color}
      border rounded-xl p-4 mb-6
      animate-fade-in
    `}
    style={{
      animation: 'fadeIn 0.3s ease-out'
    }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl">{config.icon}</span>
          <div>
            <h4 className="font-semibold text-white">{config.title}</h4>
            <p className="text-sm text-[#a1a1aa] mt-0.5">{config.description}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onAction}
            className="
              flex items-center gap-2 px-4 py-2 rounded-lg
              bg-[#22c55e] hover:bg-[#16a34a]
              text-[#0a0a0b] font-semibold text-sm
              transition-all hover:scale-105
            "
          >
            {config.actionLabel}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={handleDismiss}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors text-[#52525b] hover:text-white"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * SuccessToast - Quick success feedback for actions
 */
export function SuccessToast({ message, onClose }) {
  return (
    <div 
      className="
        fixed bottom-6 right-6 z-50
        flex items-center gap-3 px-4 py-3
        bg-[#22c55e] text-[#0a0a0b] font-medium
        rounded-xl shadow-lg shadow-[#22c55e]/20
      "
      style={{
        animation: 'slideUp 0.3s ease-out'
      }}
    >
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>{message}</span>
      <button
        onClick={onClose}
        className="ml-2 hover:bg-black/10 p-1 rounded transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/**
 * ValidationMilestone - Celebrate hitting validation goal
 */
export function ValidationMilestone({ signups, goal = 5, onClose }) {
  const [dismissed, setDismissed] = useState(false);
  
  if (dismissed || signups < goal) return null;

  const handleClose = () => {
    setDismissed(true);
    onClose?.();
  };

  return (
    <div 
      className="
        fixed inset-0 z-50 flex items-center justify-center
        bg-black/80 backdrop-blur-sm
      "
      style={{
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div 
        className="
          bg-[#141416] border border-[#27272a] rounded-2xl p-8
          max-w-md text-center
        "
        style={{
          animation: 'scaleIn 0.3s ease-out'
        }}
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">
          You did it!
        </h2>
        <p className="text-[#a1a1aa] mb-6">
          5 signups means validated demand. Your idea is worth building!
        </p>
        <button
          onClick={handleClose}
          className="px-6 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors"
        >
          View Launch Roadmap
        </button>
      </div>
    </div>
  );
}