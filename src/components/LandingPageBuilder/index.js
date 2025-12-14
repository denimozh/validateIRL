'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import LandingPageEditor from './LandingPageEditor';
import LandingPagePreview from './LandingPagePreview';
import LandingPageAnalytics from './LandingPageAnalytics';

const DEFAULT_LANDING_PAGE = {
  headline: '',
  subheadline: '',
  painPoints: ['', '', ''],
  ctaText: 'Join Waitlist',
  ctaSubtext: 'Be the first to know when we launch',
  socialProof: '',
  colors: {
    primary: '#22c55e',
    background: '#0a0a0b',
    text: '#fafafa',
    muted: '#a1a1aa',
    card: '#161618',
    border: '#27272a',
  },
  logo: null,
  showSocialProof: false,
  showPainPoints: true,
};

export default function LandingPageBuilder({ projectId, projectName, projectPain, targetAudience }) {
  const [landingPage, setLandingPage] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState('');
  const [activeView, setActiveView] = useState('edit'); // edit, preview, analytics
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Load existing landing page
  useEffect(() => {
    loadLandingPage();
  }, [projectId]);

  const loadLandingPage = async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('landing_page, landing_page_published, landing_page_slug')
      .eq('id', projectId)
      .single();

    if (data?.landing_page) {
      setLandingPage(data.landing_page);
      setIsPublished(data.landing_page_published || false);
      setSlug(data.landing_page_slug || '');
    }
  };

  const generateWithAI = async () => {
    setGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-landing-page', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectName,
          projectPain,
          targetAudience,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate landing page');

      const data = await response.json();
      
      setLandingPage({
        ...DEFAULT_LANDING_PAGE,
        ...data,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const saveLandingPage = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ landing_page: landingPage })
        .eq('id', projectId);

      if (error) throw error;
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const publishLandingPage = async () => {
    if (!slug.trim()) {
      setError('Please enter a URL slug');
      return;
    }

    setPublishing(true);
    setError(null);

    try {
      // Check if slug is available
      const { data: existing } = await supabase
        .from('projects')
        .select('id')
        .eq('landing_page_slug', slug.toLowerCase())
        .neq('id', projectId)
        .single();

      if (existing) {
        throw new Error('This URL is already taken. Please choose another.');
      }

      const { error } = await supabase
        .from('projects')
        .update({
          landing_page: landingPage,
          landing_page_published: true,
          landing_page_slug: slug.toLowerCase(),
        })
        .eq('id', projectId);

      if (error) throw error;
      
      setIsPublished(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const unpublishLandingPage = async () => {
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ landing_page_published: false })
        .eq('id', projectId);

      if (error) throw error;
      setIsPublished(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setPublishing(false);
    }
  };

  const copyLink = () => {
    const url = `${window.location.origin}/p/${slug}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getLandingPageUrl = () => {
    return `${window.location.origin}/p/${slug}`;
  };

  // No landing page yet - show generation UI
  if (!landingPage) {
    return (
      <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-20 h-20 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🏠</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Create Your Landing Page</h2>
          <p className="text-[#a1a1aa] mb-8">
            AI will generate a professional landing page based on your idea. 
            You can customize everything after.
          </p>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={generateWithAI}
            disabled={generating}
            className="px-8 py-3 rounded-xl bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
          >
            {generating ? (
              <>
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <span>✨</span>
                Generate with AI
              </>
            )}
          </button>

          <p className="text-xs text-[#71717a] mt-4">
            Uses your idea description and target audience
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with tabs and actions */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          {/* View tabs */}
          <div className="flex gap-1 bg-[#0a0a0b] rounded-lg p-1">
            {[
              { id: 'edit', label: 'Edit', icon: '✏️' },
              { id: 'preview', label: 'Preview', icon: '👁️' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                  activeView === tab.id
                    ? 'bg-[#27272a] text-white'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={saveLandingPage}
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-sm font-medium transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            
            {isPublished ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyLink}
                  className="px-4 py-2 rounded-lg bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium hover:bg-[#22c55e]/30 transition-colors"
                >
                  {copied ? '✓ Copied!' : '🔗 Copy Link'}
                </button>
                <button
                  onClick={unpublishLandingPage}
                  disabled={publishing}
                  className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors"
                >
                  Unpublish
                </button>
              </div>
            ) : (
              <button
                onClick={publishLandingPage}
                disabled={publishing || !slug.trim()}
                className="px-4 py-2 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-bold transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : 'Publish'}
              </button>
            )}
          </div>
        </div>

        {/* URL Slug */}
        <div className="mt-4 pt-4 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#71717a]">{window.location.origin}/p/</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              placeholder="your-idea-name"
              disabled={isPublished}
              className="flex-1 max-w-xs px-3 py-1.5 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none disabled:opacity-50"
            />
            {isPublished && (
              <span className="text-xs text-[#22c55e] flex items-center gap-1">
                <span className="w-2 h-2 bg-[#22c55e] rounded-full" />
                Live
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Content based on active view */}
      {activeView === 'edit' && (
        <LandingPageEditor
          landingPage={landingPage}
          onChange={setLandingPage}
          onRegenerate={generateWithAI}
          generating={generating}
        />
      )}

      {activeView === 'preview' && (
        <LandingPagePreview
          landingPage={landingPage}
          projectName={projectName}
        />
      )}

      {activeView === 'analytics' && (
        <LandingPageAnalytics
          projectId={projectId}
          isPublished={isPublished}
          slug={slug}
        />
      )}
    </div>
  );
}