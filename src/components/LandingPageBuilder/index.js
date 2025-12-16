'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import InlineEditablePreview from './InlineEditablePreview';
import LandingPagePreview from './LandingPagePreview';
import LandingPageAnalytics from './LandingPageAnalytics';
import TemplateSelector from './TemplateSelector';
import { DEFAULT_SECTIONS, TEMPLATES, FONTS, COLOR_PRESETS, GRADIENTS } from './templates';

const DEFAULT_LANDING_PAGE = {
  template: 'startup',
  sections: DEFAULT_SECTIONS,
  globalStyles: {
    font: 'Inter',
    primaryColor: '#22c55e',
    backgroundColor: '#0a0a0b',
    cardColor: '#161618',
    textColor: '#fafafa',
    mutedColor: '#a1a1aa',
    borderColor: '#27272a',
    borderRadius: 'rounded', // sharp, rounded, pill
    spacing: 'normal', // compact, normal, spacious
  },
  logo: null,
  favicon: null,
  socialLinks: {
    twitter: '',
    github: '',
    linkedin: '',
    website: '',
  },
  meta: {
    title: '',
    description: '',
  },
};

export default function LandingPageBuilder({ projectId, projectName, projectPain, targetAudience }) {
  const [landingPage, setLandingPage] = useState(null);
  const [isPublished, setIsPublished] = useState(false);
  const [slug, setSlug] = useState('');
  const [activeView, setActiveView] = useState('edit');
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [selectedSection, setSelectedSection] = useState(null);

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
      setHistory([data.landing_page]);
      setHistoryIndex(0);
    }
  };

  // History management for undo/redo
  const pushHistory = useCallback((newState) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(newState);
      if (newHistory.length > 50) newHistory.shift(); // Keep last 50 states
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, 49));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(prev => prev - 1);
      setLandingPage(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(prev => prev + 1);
      setLandingPage(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  // Update landing page with history
  const updateLandingPage = useCallback((updates) => {
    const newState = typeof updates === 'function' 
      ? updates(landingPage) 
      : { ...landingPage, ...updates };
    setLandingPage(newState);
    pushHistory(newState);
  }, [landingPage, pushHistory]);

  // Update a specific section
  const updateSection = useCallback((sectionId, updates) => {
    updateLandingPage(prev => ({
      ...prev,
      sections: prev.sections.map(s => 
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    }));
  }, [updateLandingPage]);

  // Reorder sections
  const moveSection = useCallback((fromIndex, toIndex) => {
    updateLandingPage(prev => {
      const newSections = [...prev.sections];
      const [moved] = newSections.splice(fromIndex, 1);
      newSections.splice(toIndex, 0, moved);
      return { ...prev, sections: newSections };
    });
  }, [updateLandingPage]);

  // Add new section
  const addSection = useCallback((sectionType, afterIndex = -1) => {
    const newSection = createNewSection(sectionType);
    updateLandingPage(prev => {
      const newSections = [...prev.sections];
      if (afterIndex === -1) {
        newSections.push(newSection);
      } else {
        newSections.splice(afterIndex + 1, 0, newSection);
      }
      return { ...prev, sections: newSections };
    });
    setSelectedSection(newSection.id);
  }, [updateLandingPage]);

  // Delete section
  const deleteSection = useCallback((sectionId) => {
    updateLandingPage(prev => ({
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    }));
    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }
  }, [updateLandingPage, selectedSection]);

  // Duplicate section
  const duplicateSection = useCallback((sectionId) => {
    updateLandingPage(prev => {
      const index = prev.sections.findIndex(s => s.id === sectionId);
      if (index === -1) return prev;
      const original = prev.sections[index];
      const duplicate = { ...JSON.parse(JSON.stringify(original)), id: `${original.type}-${Date.now()}` };
      const newSections = [...prev.sections];
      newSections.splice(index + 1, 0, duplicate);
      return { ...prev, sections: newSections };
    });
  }, [updateLandingPage]);

  // Toggle section visibility
  const toggleSection = useCallback((sectionId) => {
    updateSection(sectionId, { visible: !landingPage.sections.find(s => s.id === sectionId)?.visible });
  }, [updateSection, landingPage]);

  const generateWithAI = async (template = 'startup') => {
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
          template,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate landing page');

      const data = await response.json();
      
      const newLandingPage = {
        ...DEFAULT_LANDING_PAGE,
        template,
        sections: data.sections || DEFAULT_SECTIONS,
        globalStyles: {
          ...DEFAULT_LANDING_PAGE.globalStyles,
          ...TEMPLATES[template]?.defaultStyles,
        },
        meta: {
          title: data.meta?.title || projectName,
          description: data.meta?.description || projectPain,
        },
      };

      setLandingPage(newLandingPage);
      pushHistory(newLandingPage);
      setShowTemplates(false);
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        saveLandingPage();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  // No landing page yet - show template selection
  if (!landingPage) {
    return (
      <TemplateSelector
        onSelect={generateWithAI}
        generating={generating}
        error={error}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Bar */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-3">
        <div className="flex flex-wrap gap-3 justify-between items-center">
          {/* Left: View tabs */}
          <div className="flex gap-1 bg-[#0a0a0b] rounded-lg p-1">
            {[
              { id: 'edit', label: 'Edit', icon: '✏️' },
              { id: 'preview', label: 'Preview', icon: '👁️' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveView(tab.id)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5 ${
                  activeView === tab.id
                    ? 'bg-[#27272a] text-white'
                    : 'text-[#71717a] hover:text-white'
                }`}
              >
                <span className="text-xs">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Center: Undo/Redo */}
          <div className="flex items-center gap-1">
            <button
              onClick={undo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg hover:bg-[#27272a] text-[#71717a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            </button>
            <button
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg hover:bg-[#27272a] text-[#71717a] hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Redo (Ctrl+Shift+Z)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
              </svg>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowTemplates(true)}
              className="px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-sm transition-colors"
            >
              🎨 Templates
            </button>
            <button
              onClick={saveLandingPage}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-sm transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : '💾 Save'}
            </button>
            
            {isPublished ? (
              <>
                <button
                  onClick={copyLink}
                  className="px-3 py-1.5 rounded-lg bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium hover:bg-[#22c55e]/30 transition-colors"
                >
                  {copied ? '✓ Copied!' : '🔗 Copy Link'}
                </button>
                <button
                  onClick={unpublishLandingPage}
                  disabled={publishing}
                  className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors"
                >
                  Unpublish
                </button>
              </>
            ) : (
              <button
                onClick={publishLandingPage}
                disabled={publishing || !slug.trim()}
                className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-bold transition-colors disabled:opacity-50"
              >
                {publishing ? 'Publishing...' : '🚀 Publish'}
              </button>
            )}
          </div>
        </div>

        {/* URL Slug */}
        <div className="mt-3 pt-3 border-t border-[#27272a]">
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#71717a]">{typeof window !== 'undefined' ? window.location.origin : ''}/p/</span>
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
                <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Template Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl max-w-4xl w-full max-h-[80vh] overflow-auto">
            <div className="p-6 border-b border-[#27272a] flex justify-between items-center sticky top-0 bg-[#161618]">
              <h2 className="text-xl font-bold">Choose a Template</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 hover:bg-[#27272a] rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <TemplateSelector
                onSelect={(template) => {
                  generateWithAI(template);
                }}
                generating={generating}
                error={error}
                compact
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      {activeView === 'edit' && (
        <div className="grid lg:grid-cols-[1fr_280px] gap-4">
          {/* Inline Editor Preview */}
          <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl overflow-hidden">
            <InlineEditablePreview
              landingPage={landingPage}
              projectName={projectName}
              updateSection={updateSection}
              selectedSection={selectedSection}
              setSelectedSection={setSelectedSection}
              addSection={addSection}
              deleteSection={deleteSection}
              moveSection={moveSection}
            />
          </div>

          {/* Right Sidebar - Styles & Settings */}
          <div className="space-y-4">
            {/* Styles Panel */}
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <span>🎨</span> Styles
              </h3>

              {/* Font */}
              <div>
                <label className="block text-xs text-[#71717a] mb-2">Font</label>
                <select
                  value={landingPage.globalStyles?.font || 'Inter'}
                  onChange={(e) => updateLandingPage({
                    ...landingPage,
                    globalStyles: { ...landingPage.globalStyles, font: e.target.value },
                  })}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
                >
                  {FONTS.map(font => (
                    <option key={font.value} value={font.value}>{font.name}</option>
                  ))}
                </select>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-xs text-[#71717a] mb-2">Color Theme</label>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => updateLandingPage({
                        ...landingPage,
                        globalStyles: {
                          ...landingPage.globalStyles,
                          primaryColor: preset.primary,
                          backgroundColor: preset.background,
                          cardColor: preset.card,
                          textColor: preset.text,
                          mutedColor: preset.muted,
                        },
                      })}
                      className="p-2 rounded-lg border border-[#27272a] hover:border-[#22c55e] transition-colors"
                      title={preset.name}
                    >
                      <div className="flex gap-1 justify-center">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.primary }} />
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: preset.background }} />
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Color */}
              <div>
                <label className="block text-xs text-[#71717a] mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={landingPage.globalStyles?.primaryColor || '#22c55e'}
                    onChange={(e) => updateLandingPage({
                      ...landingPage,
                      globalStyles: { ...landingPage.globalStyles, primaryColor: e.target.value },
                    })}
                    className="w-10 h-10 rounded-lg bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={landingPage.globalStyles?.primaryColor || '#22c55e'}
                    onChange={(e) => updateLandingPage({
                      ...landingPage,
                      globalStyles: { ...landingPage.globalStyles, primaryColor: e.target.value },
                    })}
                    className="flex-1 px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm font-mono"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <label className="block text-xs text-[#71717a] mb-2">Corners</label>
                <div className="flex gap-2">
                  {[
                    { value: 'sharp', label: '▢' },
                    { value: 'rounded', label: '▢' },
                    { value: 'pill', label: '◯' },
                  ].map(option => (
                    <button
                      key={option.value}
                      onClick={() => updateLandingPage({
                        ...landingPage,
                        globalStyles: { ...landingPage.globalStyles, borderRadius: option.value },
                      })}
                      className={`flex-1 px-3 py-2 text-xs transition-colors ${
                        (landingPage.globalStyles?.borderRadius || 'rounded') === option.value
                          ? 'bg-[#22c55e] text-[#0a0a0b]'
                          : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                      } ${option.value === 'sharp' ? 'rounded-none' : option.value === 'rounded' ? 'rounded-lg' : 'rounded-full'}`}
                    >
                      {option.value.charAt(0).toUpperCase() + option.value.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="block text-xs text-[#71717a] mb-2">Spacing</label>
                <div className="flex gap-2">
                  {['compact', 'normal', 'spacious'].map(option => (
                    <button
                      key={option}
                      onClick={() => updateLandingPage({
                        ...landingPage,
                        globalStyles: { ...landingPage.globalStyles, spacing: option },
                      })}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                        (landingPage.globalStyles?.spacing || 'normal') === option
                          ? 'bg-[#22c55e] text-[#0a0a0b]'
                          : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                      }`}
                    >
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 space-y-4">
              <h3 className="font-medium text-sm flex items-center gap-2">
                <span>⚙️</span> Settings
              </h3>

              {/* SEO */}
              <div>
                <label className="block text-xs text-[#71717a] mb-1">Page Title</label>
                <input
                  type="text"
                  value={landingPage.meta?.title || ''}
                  onChange={(e) => updateLandingPage({
                    ...landingPage,
                    meta: { ...landingPage.meta, title: e.target.value },
                  })}
                  placeholder="My Awesome Product"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#71717a] mb-1">Description</label>
                <textarea
                  value={landingPage.meta?.description || ''}
                  onChange={(e) => updateLandingPage({
                    ...landingPage,
                    meta: { ...landingPage.meta, description: e.target.value },
                  })}
                  placeholder="Brief description for SEO"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none resize-none"
                />
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-xs text-[#71717a] mb-1">Twitter/X</label>
                <input
                  type="url"
                  value={landingPage.socialLinks?.twitter || ''}
                  onChange={(e) => updateLandingPage({
                    ...landingPage,
                    socialLinks: { ...landingPage.socialLinks, twitter: e.target.value },
                  })}
                  placeholder="https://twitter.com/you"
                  className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
                />
              </div>
            </div>

            {/* Reset Button */}
            <button
              onClick={() => setShowTemplates(true)}
              className="w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
            >
              🔄 Reset & Choose Template
            </button>
          </div>
        </div>
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

// Helper to create new sections
function createNewSection(type) {
  const id = `${type}-${Date.now()}`;
  const templates = {
    hero: {
      id,
      type: 'hero',
      visible: true,
      layout: 'centered', // centered, left, right, split
      headline: 'Your Headline Here',
      subheadline: 'Describe your value proposition in one or two sentences.',
      ctaText: 'Get Started',
      ctaSubtext: 'No credit card required',
      showImage: false,
      image: null,
      showBadge: true,
      badge: '🚀 Now in Beta',
    },
    features: {
      id,
      type: 'features',
      visible: true,
      layout: 'grid', // grid, list, alternating
      headline: 'Why Choose Us',
      subheadline: 'Everything you need to succeed',
      items: [
        { icon: '⚡', title: 'Fast', description: 'Lightning quick performance' },
        { icon: '🔒', title: 'Secure', description: 'Enterprise-grade security' },
        { icon: '🎨', title: 'Beautiful', description: 'Stunning design out of the box' },
      ],
    },
    howItWorks: {
      id,
      type: 'howItWorks',
      visible: true,
      headline: 'How It Works',
      subheadline: 'Get started in 3 easy steps',
      steps: [
        { number: '1', title: 'Sign Up', description: 'Create your free account' },
        { number: '2', title: 'Configure', description: 'Set up your preferences' },
        { number: '3', title: 'Launch', description: 'Go live in minutes' },
      ],
    },
    testimonials: {
      id,
      type: 'testimonials',
      visible: true,
      headline: 'What People Say',
      items: [
        { quote: 'This changed everything for me!', author: 'Jane Doe', role: 'Founder, Startup', avatar: null },
        { quote: 'Absolutely incredible product.', author: 'John Smith', role: 'CEO, Company', avatar: null },
      ],
    },
    faq: {
      id,
      type: 'faq',
      visible: true,
      headline: 'Frequently Asked Questions',
      items: [
        { question: 'How does it work?', answer: 'Simply sign up and follow the guided setup process.' },
        { question: 'Is there a free trial?', answer: 'Yes! You get 14 days free, no credit card required.' },
        { question: 'Can I cancel anytime?', answer: 'Absolutely. No contracts, cancel whenever you want.' },
      ],
    },
    pricing: {
      id,
      type: 'pricing',
      visible: true,
      headline: 'Simple Pricing',
      subheadline: 'Choose the plan that works for you',
      plans: [
        { name: 'Free', price: '$0', period: '/month', features: ['Feature 1', 'Feature 2'], cta: 'Get Started', highlighted: false },
        { name: 'Pro', price: '$29', period: '/month', features: ['Everything in Free', 'Feature 3', 'Feature 4'], cta: 'Start Trial', highlighted: true },
      ],
    },
    cta: {
      id,
      type: 'cta',
      visible: true,
      headline: 'Ready to Get Started?',
      subheadline: 'Join thousands of happy users today.',
      ctaText: 'Start Free Trial',
      showEmail: true,
    },
    footer: {
      id,
      type: 'footer',
      visible: true,
      showSocial: true,
      copyright: '© 2025 Your Company. All rights reserved.',
      links: [
        { label: 'Privacy', url: '#' },
        { label: 'Terms', url: '#' },
      ],
    },
    countdown: {
      id,
      type: 'countdown',
      visible: true,
      headline: 'Launching Soon',
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    video: {
      id,
      type: 'video',
      visible: true,
      headline: 'See It In Action',
      videoUrl: '',
      thumbnail: null,
    },
    logos: {
      id,
      type: 'logos',
      visible: true,
      headline: 'Trusted By',
      logos: [],
    },
  };

  return templates[type] || templates.features;
}