'use client';

import { useState, useRef } from 'react';
import { FONTS, COLOR_PRESETS, GRADIENTS, SECTION_TYPES } from './templates';
import SectionEditor from './SectionEditor';

export default function LandingPageEditor({
  landingPage,
  updateLandingPage,
  updateSection,
  moveSection,
  addSection,
  deleteSection,
  duplicateSection,
  toggleSection,
  selectedSection,
  setSelectedSection,
  onRegenerate,
}) {
  const [activePanel, setActivePanel] = useState('sections'); // sections, styles, settings
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [addSectionAfter, setAddSectionAfter] = useState(-1);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    moveSection(draggedIndex, index);
    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const updateGlobalStyle = (key, value) => {
    updateLandingPage({
      ...landingPage,
      globalStyles: { ...landingPage.globalStyles, [key]: value },
    });
  };

  const applyColorPreset = (preset) => {
    updateLandingPage({
      ...landingPage,
      globalStyles: {
        ...landingPage.globalStyles,
        primaryColor: preset.primary,
        backgroundColor: preset.background,
        cardColor: preset.card,
        textColor: preset.text,
        mutedColor: preset.muted,
      },
    });
  };

  const updateSocialLink = (key, value) => {
    updateLandingPage({
      ...landingPage,
      socialLinks: { ...landingPage.socialLinks, [key]: value },
    });
  };

  const updateMeta = (key, value) => {
    updateLandingPage({
      ...landingPage,
      meta: { ...landingPage.meta, [key]: value },
    });
  };

  return (
    <div className="grid lg:grid-cols-[300px_1fr] gap-4">
      {/* Left Panel */}
      <div className="space-y-4">
        {/* Panel Tabs */}
        <div className="bg-[#161618] border border-[#27272a] rounded-xl p-1 flex">
          {[
            { id: 'sections', label: 'Sections', icon: '📑' },
            { id: 'styles', label: 'Styles', icon: '🎨' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActivePanel(tab.id)}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                activePanel === tab.id
                  ? 'bg-[#27272a] text-white'
                  : 'text-[#71717a] hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Sections Panel */}
        {activePanel === 'sections' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">Page Sections</h3>
              <button
                onClick={() => {
                  setAddSectionAfter(-1);
                  setShowAddSection(true);
                }}
                className="text-xs text-[#22c55e] hover:text-[#16a34a]"
              >
                + Add Section
              </button>
            </div>

            {/* Draggable Section List */}
            <div className="space-y-2">
              {landingPage.sections.map((section, index) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  onClick={() => setSelectedSection(section.id)}
                  className={`p-3 rounded-lg border transition-all cursor-pointer group ${
                    selectedSection === section.id
                      ? 'bg-[#22c55e]/10 border-[#22c55e]'
                      : 'bg-[#0a0a0b] border-[#27272a] hover:border-[#3f3f46]'
                  } ${draggedIndex === index ? 'opacity-50' : ''} ${
                    !section.visible ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Drag Handle */}
                    <div className="text-[#71717a] cursor-grab active:cursor-grabbing">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
                      </svg>
                    </div>

                    {/* Section Icon & Name */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">
                          {SECTION_TYPES.find(t => t.type === section.type)?.icon || '📄'}
                        </span>
                        <span className="text-sm font-medium truncate">
                          {SECTION_TYPES.find(t => t.type === section.type)?.name || section.type}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSection(section.id);
                        }}
                        className="p-1 hover:bg-[#27272a] rounded"
                        title={section.visible ? 'Hide' : 'Show'}
                      >
                        {section.visible ? '👁️' : '🙈'}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateSection(section.id);
                        }}
                        className="p-1 hover:bg-[#27272a] rounded"
                        title="Duplicate"
                      >
                        📋
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSection(section.id);
                        }}
                        className="p-1 hover:bg-red-500/20 rounded text-red-400"
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Section Button */}
            <button
              onClick={() => {
                setAddSectionAfter(landingPage.sections.length - 1);
                setShowAddSection(true);
              }}
              className="w-full p-3 rounded-lg border-2 border-dashed border-[#27272a] hover:border-[#22c55e] text-[#71717a] hover:text-[#22c55e] transition-colors text-sm"
            >
              + Add Section
            </button>
          </div>
        )}

        {/* Styles Panel */}
        {activePanel === 'styles' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 space-y-6 max-h-[600px] overflow-y-auto">
            {/* Font */}
            <div>
              <label className="block text-sm font-medium mb-2">Font Family</label>
              <div className="grid grid-cols-2 gap-2">
                {FONTS.map(font => (
                  <button
                    key={font.value}
                    onClick={() => updateGlobalStyle('font', font.value)}
                    className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                      landingPage.globalStyles.font === font.value
                        ? 'bg-[#22c55e] text-[#0a0a0b]'
                        : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Presets */}
            <div>
              <label className="block text-sm font-medium mb-2">Color Presets</label>
              <div className="flex flex-wrap gap-2">
                {COLOR_PRESETS.map((preset, i) => (
                  <button
                    key={i}
                    onClick={() => applyColorPreset(preset)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] transition-colors"
                    title={preset.name}
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <span className="text-xs">{preset.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Colors */}
            <div>
              <label className="block text-sm font-medium mb-2">Custom Colors</label>
              <div className="space-y-3">
                {[
                  { key: 'primaryColor', label: 'Primary' },
                  { key: 'backgroundColor', label: 'Background' },
                  { key: 'cardColor', label: 'Card' },
                  { key: 'textColor', label: 'Text' },
                  { key: 'mutedColor', label: 'Muted' },
                  { key: 'borderColor', label: 'Border' },
                ].map(color => (
                  <div key={color.key} className="flex items-center gap-2">
                    <input
                      type="color"
                      value={landingPage.globalStyles[color.key]}
                      onChange={(e) => updateGlobalStyle(color.key, e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border border-[#27272a]"
                    />
                    <span className="text-xs text-[#a1a1aa] flex-1">{color.label}</span>
                    <input
                      type="text"
                      value={landingPage.globalStyles[color.key]}
                      onChange={(e) => updateGlobalStyle(color.key, e.target.value)}
                      className="w-20 px-2 py-1 rounded bg-[#0a0a0b] border border-[#27272a] text-xs font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-sm font-medium mb-2">Border Radius</label>
              <div className="flex gap-2">
                {[
                  { value: 'sharp', label: 'Sharp', preview: 'rounded-none' },
                  { value: 'rounded', label: 'Rounded', preview: 'rounded-lg' },
                  { value: 'pill', label: 'Pill', preview: 'rounded-full' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateGlobalStyle('borderRadius', option.value)}
                    className={`flex-1 px-3 py-2 text-xs transition-colors ${
                      landingPage.globalStyles.borderRadius === option.value
                        ? 'bg-[#22c55e] text-[#0a0a0b]'
                        : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                    } ${option.preview}`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium mb-2">Spacing</label>
              <div className="flex gap-2">
                {[
                  { value: 'compact', label: 'Compact' },
                  { value: 'normal', label: 'Normal' },
                  { value: 'spacious', label: 'Spacious' },
                ].map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateGlobalStyle('spacing', option.value)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs transition-colors ${
                      landingPage.globalStyles.spacing === option.value
                        ? 'bg-[#22c55e] text-[#0a0a0b]'
                        : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Background Gradient */}
            <div>
              <label className="block text-sm font-medium mb-2">Background Effect</label>
              <div className="space-y-2">
                {GRADIENTS.map((gradient, i) => (
                  <button
                    key={i}
                    onClick={() => updateGlobalStyle('backgroundGradient', gradient.value)}
                    className={`w-full px-3 py-2 rounded-lg text-xs text-left transition-colors ${
                      landingPage.globalStyles.backgroundGradient === gradient.value
                        ? 'bg-[#22c55e] text-[#0a0a0b]'
                        : 'bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e]'
                    }`}
                  >
                    {gradient.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {activePanel === 'settings' && (
          <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4 space-y-6 max-h-[600px] overflow-y-auto">
            {/* Meta */}
            <div>
              <label className="block text-sm font-medium mb-2">SEO & Meta</label>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">Page Title</label>
                  <input
                    type="text"
                    value={landingPage.meta?.title || ''}
                    onChange={(e) => updateMeta('title', e.target.value)}
                    placeholder="My Awesome Product"
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#71717a] mb-1">Description</label>
                  <textarea
                    value={landingPage.meta?.description || ''}
                    onChange={(e) => updateMeta('description', e.target.value)}
                    placeholder="A brief description for search engines"
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <label className="block text-sm font-medium mb-2">Social Links</label>
              <div className="space-y-3">
                {[
                  { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/you' },
                  { key: 'github', label: 'GitHub', placeholder: 'https://github.com/you' },
                  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/you' },
                  { key: 'website', label: 'Website', placeholder: 'https://yoursite.com' },
                ].map(social => (
                  <div key={social.key}>
                    <label className="block text-xs text-[#71717a] mb-1">{social.label}</label>
                    <input
                      type="url"
                      value={landingPage.socialLinks?.[social.key] || ''}
                      onChange={(e) => updateSocialLink(social.key, e.target.value)}
                      placeholder={social.placeholder}
                      className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4 border-t border-[#27272a]">
              <label className="block text-sm font-medium text-red-400 mb-3">Danger Zone</label>
              <button
                onClick={onRegenerate}
                className="w-full px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm hover:bg-red-500/20 transition-colors"
              >
                🔄 Reset & Choose New Template
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Section Editor */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
        {selectedSection ? (
          <SectionEditor
            section={landingPage.sections.find(s => s.id === selectedSection)}
            updateSection={(updates) => updateSection(selectedSection, updates)}
            globalStyles={landingPage.globalStyles}
          />
        ) : (
          <div className="h-full flex items-center justify-center text-center p-8">
            <div>
              <div className="text-4xl mb-4">👈</div>
              <h3 className="font-medium mb-2">Select a Section</h3>
              <p className="text-sm text-[#71717a]">
                Click on a section in the left panel to edit its content
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Add Section Modal */}
      {showAddSection && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#161618] border border-[#27272a] rounded-2xl max-w-2xl w-full">
            <div className="p-4 border-b border-[#27272a] flex justify-between items-center">
              <h2 className="font-bold">Add Section</h2>
              <button
                onClick={() => setShowAddSection(false)}
                className="p-2 hover:bg-[#27272a] rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SECTION_TYPES.map(section => (
                <button
                  key={section.type}
                  onClick={() => {
                    addSection(section.type, addSectionAfter);
                    setShowAddSection(false);
                  }}
                  className="p-4 rounded-xl bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] transition-colors text-left"
                >
                  <div className="text-2xl mb-2">{section.icon}</div>
                  <div className="font-medium text-sm">{section.name}</div>
                  <div className="text-xs text-[#71717a]">{section.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}