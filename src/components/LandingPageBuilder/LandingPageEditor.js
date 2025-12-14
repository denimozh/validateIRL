'use client';

import { useState } from 'react';

const COLOR_PRESETS = [
  { name: 'Default Green', primary: '#22c55e', background: '#0a0a0b', card: '#161618' },
  { name: 'Ocean Blue', primary: '#3b82f6', background: '#0a0a0b', card: '#161618' },
  { name: 'Purple', primary: '#8b5cf6', background: '#0a0a0b', card: '#161618' },
  { name: 'Orange', primary: '#f97316', background: '#0a0a0b', card: '#161618' },
  { name: 'Pink', primary: '#ec4899', background: '#0a0a0b', card: '#161618' },
  { name: 'Light Mode', primary: '#22c55e', background: '#ffffff', card: '#f4f4f5', text: '#18181b', muted: '#71717a' },
];

export default function LandingPageEditor({ landingPage, onChange, onRegenerate, generating }) {
  const [activeSection, setActiveSection] = useState('content');

  const updateField = (field, value) => {
    onChange({ ...landingPage, [field]: value });
  };

  const updateColor = (colorKey, value) => {
    onChange({
      ...landingPage,
      colors: { ...landingPage.colors, [colorKey]: value },
    });
  };

  const updatePainPoint = (index, value) => {
    const newPainPoints = [...landingPage.painPoints];
    newPainPoints[index] = value;
    onChange({ ...landingPage, painPoints: newPainPoints });
  };

  const applyColorPreset = (preset) => {
    onChange({
      ...landingPage,
      colors: {
        ...landingPage.colors,
        primary: preset.primary,
        background: preset.background,
        card: preset.card,
        text: preset.text || '#fafafa',
        muted: preset.muted || '#a1a1aa',
      },
    });
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Editor Panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Section Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'content', label: 'Content', icon: '📝' },
            { id: 'style', label: 'Colors & Style', icon: '🎨' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                activeSection === section.id
                  ? 'bg-[#22c55e] text-[#0a0a0b]'
                  : 'bg-[#161618] border border-[#27272a] text-[#a1a1aa] hover:text-white'
              }`}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        {/* Content Section */}
        {activeSection === 'content' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">Page Content</h3>
              <button
                onClick={onRegenerate}
                disabled={generating}
                className="text-sm text-[#22c55e] hover:text-[#16a34a] flex items-center gap-1"
              >
                {generating ? 'Generating...' : '✨ Regenerate with AI'}
              </button>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-sm font-medium mb-2">Headline</label>
              <input
                type="text"
                value={landingPage.headline}
                onChange={(e) => updateField('headline', e.target.value)}
                placeholder="Your compelling headline"
                className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none text-lg"
              />
              <p className="text-xs text-[#71717a] mt-1">Make it clear and benefit-focused</p>
            </div>

            {/* Subheadline */}
            <div>
              <label className="block text-sm font-medium mb-2">Subheadline</label>
              <textarea
                value={landingPage.subheadline}
                onChange={(e) => updateField('subheadline', e.target.value)}
                placeholder="Explain the value proposition in 1-2 sentences"
                rows={2}
                className="w-full px-4 py-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none resize-none"
              />
            </div>

            {/* Pain Points */}
            <div>
              <label className="block text-sm font-medium mb-2">Pain Points / Benefits</label>
              <div className="space-y-3">
                {landingPage.painPoints.map((point, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <span className="text-[#22c55e]">✓</span>
                    <input
                      type="text"
                      value={point}
                      onChange={(e) => updatePainPoint(index, e.target.value)}
                      placeholder={`Benefit ${index + 1}`}
                      className="flex-1 px-4 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
                    />
                  </div>
                ))}
              </div>
              <button
                onClick={() => updateField('painPoints', [...landingPage.painPoints, ''])}
                className="mt-3 text-sm text-[#22c55e] hover:text-[#16a34a]"
              >
                + Add another point
              </button>
            </div>

            {/* CTA */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Button Text</label>
                <input
                  type="text"
                  value={landingPage.ctaText}
                  onChange={(e) => updateField('ctaText', e.target.value)}
                  placeholder="Join Waitlist"
                  className="w-full px-4 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Button Subtext</label>
                <input
                  type="text"
                  value={landingPage.ctaSubtext}
                  onChange={(e) => updateField('ctaSubtext', e.target.value)}
                  placeholder="No spam, unsubscribe anytime"
                  className="w-full px-4 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
                />
              </div>
            </div>

            {/* Social Proof */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Social Proof</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={landingPage.showSocialProof}
                    onChange={(e) => updateField('showSocialProof', e.target.checked)}
                    className="w-4 h-4 rounded border-[#27272a] bg-[#0a0a0b] text-[#22c55e] focus:ring-[#22c55e]"
                  />
                  <span className="text-sm text-[#a1a1aa]">Show on page</span>
                </label>
              </div>
              <input
                type="text"
                value={landingPage.socialProof}
                onChange={(e) => updateField('socialProof', e.target.value)}
                placeholder="e.g., Join 50+ founders already validating"
                className="w-full px-4 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] focus:border-[#22c55e] outline-none"
              />
            </div>
          </div>
        )}

        {/* Style Section */}
        {activeSection === 'style' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold">Colors & Style</h3>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium mb-3">Quick Presets</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-sm">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <label className="block text-sm font-medium mb-3">Custom Colors</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'primary', label: 'Primary / CTA' },
                  { key: 'background', label: 'Background' },
                  { key: 'card', label: 'Card Background' },
                  { key: 'text', label: 'Text' },
                  { key: 'muted', label: 'Muted Text' },
                  { key: 'border', label: 'Borders' },
                ].map(color => (
                  <div key={color.key}>
                    <label className="block text-xs text-[#71717a] mb-1">{color.label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={landingPage.colors[color.key]}
                        onChange={(e) => updateColor(color.key, e.target.value)}
                        className="w-10 h-10 rounded-lg border border-[#27272a] cursor-pointer"
                      />
                      <input
                        type="text"
                        value={landingPage.colors[color.key]}
                        onChange={(e) => updateColor(color.key, e.target.value)}
                        className="flex-1 px-2 py-1 rounded bg-[#0a0a0b] border border-[#27272a] text-xs font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Section */}
        {activeSection === 'settings' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-6 space-y-6">
            <h3 className="text-lg font-bold">Page Settings</h3>

            {/* Toggle Sections */}
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a] cursor-pointer hover:border-[#22c55e] transition-colors">
                <div>
                  <div className="font-medium">Show Pain Points</div>
                  <div className="text-sm text-[#71717a]">Display the benefit bullets</div>
                </div>
                <input
                  type="checkbox"
                  checked={landingPage.showPainPoints}
                  onChange={(e) => updateField('showPainPoints', e.target.checked)}
                  className="w-5 h-5 rounded border-[#27272a] bg-[#0a0a0b] text-[#22c55e] focus:ring-[#22c55e]"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-lg bg-[#0a0a0b] border border-[#27272a] cursor-pointer hover:border-[#22c55e] transition-colors">
                <div>
                  <div className="font-medium">Show Social Proof</div>
                  <div className="text-sm text-[#71717a]">Display the social proof text</div>
                </div>
                <input
                  type="checkbox"
                  checked={landingPage.showSocialProof}
                  onChange={(e) => updateField('showSocialProof', e.target.checked)}
                  className="w-5 h-5 rounded border-[#27272a] bg-[#0a0a0b] text-[#22c55e] focus:ring-[#22c55e]"
                />
              </label>
            </div>

            {/* Danger Zone */}
            <div className="pt-6 border-t border-[#27272a]">
              <h4 className="text-sm font-medium text-red-400 mb-3">Danger Zone</h4>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset the landing page? This cannot be undone.')) {
                    onRegenerate();
                  }
                }}
                className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                Reset & Regenerate
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Live Mini Preview */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-[#71717a]">Live Preview</span>
              <span className="text-xs text-[#22c55e]">● Auto-updating</span>
            </div>
            <div 
              className="rounded-lg overflow-hidden border border-[#27272a]"
              style={{ 
                backgroundColor: landingPage.colors.background,
                aspectRatio: '9/16',
                maxHeight: '400px',
              }}
            >
              <div className="p-4 h-full flex flex-col justify-center text-center transform scale-[0.6] origin-center">
                <h1 
                  className="text-lg font-bold mb-2 leading-tight"
                  style={{ color: landingPage.colors.text }}
                >
                  {landingPage.headline || 'Your Headline'}
                </h1>
                <p 
                  className="text-xs mb-4"
                  style={{ color: landingPage.colors.muted }}
                >
                  {landingPage.subheadline || 'Your subheadline goes here'}
                </p>
                <button
                  className="px-4 py-2 rounded-lg text-xs font-bold mx-auto"
                  style={{ 
                    backgroundColor: landingPage.colors.primary,
                    color: landingPage.colors.background,
                  }}
                >
                  {landingPage.ctaText || 'Join Waitlist'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}