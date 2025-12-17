'use client';

import { useState, useEffect } from 'react';

/**
 * OnboardingChecklist - Shows new users their progress through the validation flow
 * 
 * INTEGRATION: Add to your dashboard/page.js after the stats cards
 * 
 * Example usage in DashboardContent:
 * 
 * // Calculate onboarding state
 * const hasProject = projects.length > 0;
 * const hasLandingPage = projects.some(p => p.landing_page_published);
 * const hasSharedPost = false; // You'd need to track this
 * const totalSignups = projects.reduce((sum, p) => sum + (p.signup_count || 0), 0);
 * 
 * // In JSX:
 * <OnboardingChecklist
 *   hasProject={hasProject}
 *   hasLandingPage={hasLandingPage}
 *   hasSharedPost={hasSharedPost}
 *   signupCount={totalSignups}
 *   onNavigate={(action) => {
 *     if (action === 'new-project') setShowNewProjectModal(true);
 *     else if (projects[0]) router.push(`/dashboard/project/${projects[0].id}?tab=${action}`);
 *   }}
 * />
 */
export default function OnboardingChecklist({ 
  hasProject = false,
  hasLandingPage = false, 
  hasSharedPost = false,
  signupCount = 0,
  signupGoal = 5,
  onDismiss,
  onNavigate 
}) {
  const [dismissed, setDismissed] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    // Check if previously dismissed
    const wasDismissed = localStorage.getItem('validateirl-onboarding-dismissed');
    if (wasDismissed) setDismissed(true);
    else setAnimateIn(true);
  }, []);

  const steps = [
    {
      id: 'project',
      title: 'Create your first project',
      description: 'Define your idea and find initial signals',
      completed: hasProject,
      action: () => onNavigate?.('new-project'),
      actionLabel: 'Create Project'
    },
    {
      id: 'landing',
      title: 'Build your landing page',
      description: 'Customize your page to collect signups',
      completed: hasLandingPage,
      action: () => onNavigate?.('landing'),
      actionLabel: 'Edit Page'
    },
    {
      id: 'share',
      title: 'Share with tracked links',
      description: 'Post on Reddit/Twitter and track which posts convert',
      completed: hasSharedPost,
      action: () => onNavigate?.('posts'),
      actionLabel: 'Add Post'
    },
    {
      id: 'validate',
      title: `Get ${signupGoal} signups`,
      description: `${signupGoal} signups = validated demand → ready to build`,
      completed: signupCount >= signupGoal,
      action: () => onNavigate?.('roadmap'),
      actionLabel: `${signupCount}/${signupGoal} signups`
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const allComplete = completedCount === steps.length;

  if (dismissed || allComplete) return null;

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('validateirl-onboarding-dismissed', 'true');
    onDismiss?.();
  };

  return (
    <div 
      className={`
        bg-gradient-to-br from-[#1a1a1c] to-[#141416] 
        border border-[#2a2a2e] rounded-2xl p-6 mb-6
        transition-all duration-500 ease-out
        ${animateIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
      `}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#22c55e] to-[#16a34a] flex items-center justify-center">
            <svg className="w-5 h-5 text-[#0a0a0b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Getting Started</h3>
            <p className="text-sm text-[#71717a]">
              {completedCount}/{steps.length} steps completed
            </p>
          </div>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-[#52525b] hover:text-[#a1a1aa] transition-colors p-1"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-[#27272a] rounded-full overflow-hidden mb-6">
        <div 
          className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => {
          const isNext = !step.completed && steps.slice(0, index).every(s => s.completed);
          
          return (
            <div 
              key={step.id}
              className={`
                flex items-center justify-between p-4 rounded-xl
                transition-all duration-200
                ${step.completed 
                  ? 'bg-[#22c55e]/10 border border-[#22c55e]/20' 
                  : isNext 
                    ? 'bg-[#1f1f23] border border-[#3f3f46] hover:border-[#22c55e]/50' 
                    : 'bg-[#18181b] border border-[#27272a] opacity-60'
                }
              `}
            >
              <div className="flex items-center gap-4">
                {step.completed ? (
                  <svg className="w-6 h-6 text-[#22c55e] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 ${isNext ? 'border-[#52525b]' : 'border-[#3f3f46]'}`} />
                )}
                <div>
                  <p className={`font-medium ${step.completed ? 'text-[#22c55e]' : 'text-white'}`}>
                    {step.title}
                  </p>
                  <p className="text-sm text-[#71717a]">{step.description}</p>
                </div>
              </div>
              
              {!step.completed && isNext && step.id !== 'validate' && (
                <button
                  onClick={step.action}
                  className="
                    flex items-center gap-2 px-4 py-2 rounded-lg
                    bg-[#22c55e] hover:bg-[#16a34a] 
                    text-[#0a0a0b] font-semibold text-sm
                    transition-all hover:scale-105
                  "
                >
                  {step.actionLabel}
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
              
              {step.id === 'validate' && !step.completed && (
                <span className="text-sm font-medium text-[#22c55e]">
                  {step.actionLabel}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Motivational footer */}
      <div className="mt-5 pt-4 border-t border-[#27272a] text-center">
        <p className="text-sm text-[#71717a]">
          💡 Most founders validate in <span className="text-[#22c55e] font-medium">under 2 weeks</span>
        </p>
      </div>
    </div>
  );
}