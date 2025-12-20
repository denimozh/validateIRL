'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LandingPageBuilder from '@/components/LandingPageBuilder';
import LandingPageChoice from '@/components/LandingPageChoice';
import EmbedCodePanel from '@/components/EmbedCodePanel';

export default function LandingPageSection({ 
  projectId, 
  projectName, 
  projectPain, 
  targetAudience,
  landingPagePublished 
}) {
  const [mode, setMode] = useState(null); // null | 'builder' | 'embed'
  const [loading, setLoading] = useState(true);

  const checkExistingChoice = async () => {
    // If they already have a published landing page, show builder
    if (landingPagePublished) {
      setMode('builder');
      setLoading(false);
      return;
    }
    
    // Check if they have embed signups (meaning they chose embed before)
    try {
      const { data } = await supabase
        .from('landing_page_signups')
        .select('source')
        .eq('project_id', projectId)
        .eq('source', 'embed')
        .limit(1);

      if (data && data.length > 0) {
        setMode('embed');
      }
    } catch (error) {
      console.error('Error checking existing choice:', error);
    }
    
    setLoading(false);
  };

  useEffect(() => {
    checkExistingChoice();
  }, [projectId, landingPagePublished]);

  const handleChooseBuilder = () => {
    setMode('builder');
  };

  const handleChooseEmbed = () => {
    setMode('embed');
  };

  const handleBack = () => {
    setMode(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Show choice screen if no mode selected
  if (!mode) {
    return (
      <LandingPageChoice
        projectId={projectId}
        onChooseBuilder={handleChooseBuilder}
        onChooseEmbed={handleChooseEmbed}
      />
    );
  }

  // Show embed panel
  if (mode === 'embed') {
    return (
      <div>
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-[#71717a] hover:text-white transition-colors mb-6"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to options
        </button>
        
        <EmbedCodePanel 
          projectId={projectId} 
          projectName={projectName}
        />
      </div>
    );
  }

  // Show builder
  if (mode === 'builder') {
    return (
      <div>
        {/* Back button - only show if they haven't published yet */}
        {!landingPagePublished && (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-[#71717a] hover:text-white transition-colors mb-6"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to options
          </button>
        )}
        
        {/* Your existing LandingPageBuilder */}
        <LandingPageBuilder
          projectId={projectId}
          projectName={projectName}
          projectPain={projectPain}
          targetAudience={targetAudience}
        />
      </div>
    );
  }

  return null;
}