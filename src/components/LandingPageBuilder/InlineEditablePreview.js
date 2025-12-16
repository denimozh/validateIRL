'use client';

import { useState, useRef, useEffect } from 'react';
import { SECTION_TYPES } from './templates';

// Editable text component that switches to input on click
function EditableText({ 
  value, 
  onChange, 
  className = '', 
  style = {}, 
  placeholder = 'Click to edit',
  multiline = false,
  as: Component = 'span',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault();
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalValue(value);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`bg-transparent border-2 border-[#22c55e] rounded outline-none resize-none w-full ${className}`}
          style={{ ...style, minHeight: '60px' }}
        />
      );
    }
    return (
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`bg-transparent border-2 border-[#22c55e] rounded outline-none w-full ${className}`}
        style={style}
      />
    );
  }

  return (
    <Component
      onClick={() => setIsEditing(true)}
      className={`cursor-text hover:outline hover:outline-2 hover:outline-dashed hover:outline-[#22c55e]/50 rounded transition-all ${className}`}
      style={style}
    >
      {value || <span className="opacity-50">{placeholder}</span>}
    </Component>
  );
}

// Main component
export default function InlineEditablePreview({
  landingPage,
  projectName,
  updateSection,
  selectedSection,
  setSelectedSection,
  addSection,
  deleteSection,
  moveSection,
}) {
  const [draggedSection, setDraggedSection] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showAddMenu, setShowAddMenu] = useState(null); // index to add after
  const [email, setEmail] = useState('');
  const [hoveredSection, setHoveredSection] = useState(null);

  const styles = landingPage?.globalStyles || {
    primaryColor: '#22c55e',
    backgroundColor: '#0a0a0b',
    textColor: '#fafafa',
    mutedColor: '#a1a1aa',
    cardColor: '#161618',
    borderColor: '#27272a',
    font: 'Inter',
    borderRadius: 'rounded',
    spacing: 'normal',
  };

  const borderRadius = {
    sharp: { button: 'rounded-none', card: 'rounded-none', input: 'rounded-none' },
    rounded: { button: 'rounded-lg', card: 'rounded-xl', input: 'rounded-lg' },
    pill: { button: 'rounded-full', card: 'rounded-2xl', input: 'rounded-full' },
  }[styles.borderRadius || 'rounded'];

  const spacing = {
    compact: { section: 'py-12', container: 'px-4' },
    normal: { section: 'py-16 md:py-20', container: 'px-6' },
    spacious: { section: 'py-20 md:py-28', container: 'px-8' },
  }[styles.spacing || 'normal'];

  const sections = landingPage?.sections || [];

  const handleDragStart = (e, index) => {
    setDraggedSection(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedSection !== null && draggedSection !== index) {
      moveSection(draggedSection, index);
    }
    setDraggedSection(null);
    setDragOverIndex(null);
  };

  // Section wrapper with selection, drag, and controls
  const SectionWrapper = ({ section, index, children }) => {
    const isSelected = selectedSection === section.id;
    const isHovered = hoveredSection === section.id;
    const isDragging = draggedSection === index;
    const isDragOver = dragOverIndex === index;

    return (
      <div
        className={`relative group transition-all ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-[#22c55e] ring-offset-2 ring-offset-[#0a0a0b]' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedSection(section.id);
        }}
        onMouseEnter={() => setHoveredSection(section.id)}
        onMouseLeave={() => setHoveredSection(null)}
        draggable
        onDragStart={(e) => handleDragStart(e, index)}
        onDragOver={(e) => handleDragOver(e, index)}
        onDrop={(e) => handleDrop(e, index)}
        onDragEnd={() => {
          setDraggedSection(null);
          setDragOverIndex(null);
        }}
      >
        {/* Selection outline */}
        {(isSelected || isHovered) && (
          <div 
            className={`absolute inset-0 pointer-events-none border-2 ${isSelected ? 'border-[#22c55e]' : 'border-[#22c55e]/30'} z-10`}
            style={{ borderRadius: '8px' }}
          />
        )}

        {/* Section controls */}
        {(isSelected || isHovered) && (
          <div className="absolute -top-3 left-4 z-20 flex items-center gap-1 bg-[#161618] border border-[#27272a] rounded-lg px-2 py-1 shadow-lg">
            {/* Drag handle */}
            <div className="cursor-grab active:cursor-grabbing p-1 text-[#71717a] hover:text-white">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM7 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 8a2 2 0 1 0 0 4 2 2 0 0 0 0-4zM13 14a2 2 0 1 0 0 4 2 2 0 0 0 0-4z" />
              </svg>
            </div>
            
            {/* Section label */}
            <span className="text-xs font-medium text-[#71717a] px-1">
              {SECTION_TYPES.find(t => t.type === section.type)?.icon}{' '}
              {SECTION_TYPES.find(t => t.type === section.type)?.name}
            </span>

            <div className="w-px h-4 bg-[#27272a] mx-1" />

            {/* Move up */}
            {index > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, index - 1);
                }}
                className="p-1 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded"
                title="Move up"
              >
                ↑
              </button>
            )}

            {/* Move down */}
            {index < sections.length - 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  moveSection(index, index + 1);
                }}
                className="p-1 text-[#71717a] hover:text-white hover:bg-[#27272a] rounded"
                title="Move down"
              >
                ↓
              </button>
            )}

            {/* Delete */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                deleteSection(section.id);
              }}
              className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded"
              title="Delete section"
            >
              🗑️
            </button>
          </div>
        )}

        {/* Add section button between sections */}
        <div 
          className="absolute -bottom-4 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAddMenu(index);
            }}
            className="px-3 py-1 bg-[#22c55e] text-[#0a0a0b] text-xs font-bold rounded-full hover:bg-[#16a34a] transition-colors shadow-lg"
          >
            + Add Section
          </button>
        </div>

        {children}
      </div>
    );
  };

  // Render each section type
  const renderSection = (section, index) => {
    const commonProps = {
      section,
      styles,
      borderRadius,
      spacing,
      updateSection: (updates) => updateSection(section.id, updates),
    };

    switch (section.type) {
      case 'hero':
        return (
          <SectionWrapper section={section} index={index}>
            <HeroSectionInline {...commonProps} email={email} setEmail={setEmail} />
          </SectionWrapper>
        );
      case 'features':
        return (
          <SectionWrapper section={section} index={index}>
            <FeaturesSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'howItWorks':
        return (
          <SectionWrapper section={section} index={index}>
            <HowItWorksSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'testimonials':
        return (
          <SectionWrapper section={section} index={index}>
            <TestimonialsSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'faq':
        return (
          <SectionWrapper section={section} index={index}>
            <FAQSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'pricing':
        return (
          <SectionWrapper section={section} index={index}>
            <PricingSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'cta':
        return (
          <SectionWrapper section={section} index={index}>
            <CTASectionInline {...commonProps} email={email} setEmail={setEmail} />
          </SectionWrapper>
        );
      case 'countdown':
        return (
          <SectionWrapper section={section} index={index}>
            <CountdownSectionInline {...commonProps} />
          </SectionWrapper>
        );
      case 'footer':
        return (
          <SectionWrapper section={section} index={index}>
            <FooterSectionInline {...commonProps} socialLinks={landingPage.socialLinks} />
          </SectionWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <div
      className="min-h-screen relative"
      style={{ 
        backgroundColor: styles.backgroundColor,
        fontFamily: `"${styles.font}", sans-serif`,
      }}
      onClick={() => setSelectedSection(null)}
    >
      {/* Render all sections */}
      {sections.map((section, index) => {
        if (!section.visible) return null;
        return (
          <div key={section.id || `section-${index}`}>
            {renderSection(section, index)}
          </div>
        );
      })}

      {/* Empty state */}
      {sections.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="font-medium mb-2" style={{ color: styles.textColor }}>No sections yet</h3>
            <button
              onClick={() => setShowAddMenu(-1)}
              className="px-4 py-2 bg-[#22c55e] text-[#0a0a0b] font-bold rounded-lg hover:bg-[#16a34a]"
            >
              + Add First Section
            </button>
          </div>
        </div>
      )}

      {/* Add at end button */}
      {sections.length > 0 && (
        <div className="flex justify-center py-8">
          <button
            onClick={() => setShowAddMenu(sections.length - 1)}
            className="px-4 py-2 bg-[#161618] border border-[#27272a] text-[#71717a] rounded-lg hover:border-[#22c55e] hover:text-white transition-colors"
          >
            + Add Section
          </button>
        </div>
      )}

      {/* Add Section Modal */}
      {showAddMenu !== null && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setShowAddMenu(null)}
        >
          <div 
            className="bg-[#161618] border border-[#27272a] rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-[#27272a] flex justify-between items-center sticky top-0 bg-[#161618]">
              <h2 className="font-bold text-white">Add Section</h2>
              <button
                onClick={() => setShowAddMenu(null)}
                className="p-2 hover:bg-[#27272a] rounded-lg text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {SECTION_TYPES.map(sectionType => (
                <button
                  key={sectionType.type}
                  onClick={() => {
                    addSection(sectionType.type, showAddMenu);
                    setShowAddMenu(null);
                  }}
                  className="p-4 rounded-xl bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] transition-colors text-left"
                >
                  <div className="text-2xl mb-2">{sectionType.icon}</div>
                  <div className="font-medium text-sm text-white">{sectionType.name}</div>
                  <div className="text-xs text-[#71717a]">{sectionType.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Inline Hero Section
function HeroSectionInline({ section, styles, borderRadius, spacing, updateSection, email, setEmail }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-4xl mx-auto text-center">
        {section.showBadge && (
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 ${borderRadius.button} text-sm mb-6`}
            style={{ 
              backgroundColor: `${styles.primaryColor}20`,
              color: styles.primaryColor,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: styles.primaryColor }} />
            <EditableText
              value={section.badge}
              onChange={(val) => updateSection({ badge: val })}
              placeholder="Badge text"
            />
          </div>
        )}

        <EditableText
          value={section.headline}
          onChange={(val) => updateSection({ headline: val })}
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight block"
          style={{ color: styles.textColor }}
          placeholder="Your headline here"
          as="h1"
        />

        <EditableText
          value={section.subheadline}
          onChange={(val) => updateSection({ subheadline: val })}
          className="text-lg md:text-xl mb-8 max-w-2xl mx-auto block"
          style={{ color: styles.mutedColor }}
          placeholder="Your subheadline here"
          multiline
          as="p"
        />

        <div className="max-w-md mx-auto">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`flex-1 px-5 py-3.5 ${borderRadius.input} text-base outline-none`}
              style={{ 
                backgroundColor: styles.cardColor,
                border: `1px solid ${styles.borderColor}`,
                color: styles.textColor,
              }}
            />
            <button
              className={`px-7 py-3.5 ${borderRadius.button} font-bold text-base whitespace-nowrap`}
              style={{ 
                backgroundColor: styles.primaryColor,
                color: styles.backgroundColor,
              }}
            >
              <EditableText
                value={section.ctaText}
                onChange={(val) => updateSection({ ctaText: val })}
                placeholder="Button text"
              />
            </button>
          </div>
          {section.ctaSubtext && (
            <EditableText
              value={section.ctaSubtext}
              onChange={(val) => updateSection({ ctaSubtext: val })}
              className="text-sm mt-3 block"
              style={{ color: styles.mutedColor }}
              placeholder="Subtext (e.g., No credit card required)"
              as="p"
            />
          )}
        </div>
      </div>
    </section>
  );
}

// Inline Features Section
function FeaturesSectionInline({ section, styles, borderRadius, spacing, updateSection }) {
  const updateItem = (index, updates) => {
    const newItems = [...(section.items || [])];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { icon: '✨', title: 'New Feature', description: 'Description here' }],
    });
  };

  const removeItem = (index) => {
    const newItems = (section.items || []).filter((_, i) => i !== index);
    updateSection({ items: newItems });
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <EditableText
            value={section.headline}
            onChange={(val) => updateSection({ headline: val })}
            className="text-3xl md:text-4xl font-bold mb-4 block"
            style={{ color: styles.textColor }}
            placeholder="Section headline"
            as="h2"
          />
          <EditableText
            value={section.subheadline}
            onChange={(val) => updateSection({ subheadline: val })}
            className="text-lg block"
            style={{ color: styles.mutedColor }}
            placeholder="Section subheadline"
            as="p"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} text-center relative group`}
              style={{ backgroundColor: styles.backgroundColor, border: `1px solid ${styles.borderColor}` }}
            >
              {/* Remove button */}
              <button
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
              >
                ✕
              </button>
              
              <div 
                className={`w-14 h-14 ${borderRadius.card} flex items-center justify-center mx-auto mb-4 text-2xl cursor-pointer hover:ring-2 hover:ring-[#22c55e]`}
                style={{ backgroundColor: `${styles.primaryColor}20` }}
                onClick={() => {
                  const emoji = prompt('Enter emoji:', item.icon);
                  if (emoji) updateItem(index, { icon: emoji });
                }}
              >
                {item.icon}
              </div>
              <EditableText
                value={item.title}
                onChange={(val) => updateItem(index, { title: val })}
                className="text-lg font-bold mb-2 block"
                style={{ color: styles.textColor }}
                placeholder="Feature title"
                as="h3"
              />
              <EditableText
                value={item.description}
                onChange={(val) => updateItem(index, { description: val })}
                className="text-sm block"
                style={{ color: styles.mutedColor }}
                placeholder="Feature description"
                as="p"
              />
            </div>
          ))}
          
          {/* Add item button */}
          <button
            onClick={addItem}
            className={`p-6 ${borderRadius.card} text-center border-2 border-dashed border-[#27272a] hover:border-[#22c55e] transition-colors flex items-center justify-center min-h-[200px]`}
          >
            <span className="text-[#71717a]">+ Add Feature</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// Inline How It Works Section
function HowItWorksSectionInline({ section, styles, borderRadius, spacing, updateSection }) {
  const updateStep = (index, updates) => {
    const newSteps = [...(section.steps || [])];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateSection({ steps: newSteps });
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <EditableText
            value={section.headline}
            onChange={(val) => updateSection({ headline: val })}
            className="text-3xl md:text-4xl font-bold mb-4 block"
            style={{ color: styles.textColor }}
            as="h2"
          />
          <EditableText
            value={section.subheadline}
            onChange={(val) => updateSection({ subheadline: val })}
            className="text-lg block"
            style={{ color: styles.mutedColor }}
            as="p"
          />
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {(section.steps || []).map((step, index) => (
            <div key={index} className="text-center">
              <div 
                className={`w-12 h-12 ${borderRadius.button} flex items-center justify-center mx-auto mb-4 text-lg font-bold`}
                style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
              >
                {step.number}
              </div>
              <EditableText
                value={step.title}
                onChange={(val) => updateStep(index, { title: val })}
                className="text-lg font-bold mb-2 block"
                style={{ color: styles.textColor }}
                as="h3"
              />
              <EditableText
                value={step.description}
                onChange={(val) => updateStep(index, { description: val })}
                className="text-sm block"
                style={{ color: styles.mutedColor }}
                as="p"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline Testimonials Section
function TestimonialsSectionInline({ section, styles, borderRadius, spacing, updateSection }) {
  const updateItem = (index, updates) => {
    const newItems = [...(section.items || [])];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { quote: 'New testimonial quote', author: 'Name', role: 'Role, Company' }],
    });
  };

  const removeItem = (index) => {
    const newItems = (section.items || []).filter((_, i) => i !== index);
    updateSection({ items: newItems });
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-5xl mx-auto">
        <EditableText
          value={section.headline}
          onChange={(val) => updateSection({ headline: val })}
          className="text-3xl md:text-4xl font-bold mb-12 text-center block"
          style={{ color: styles.textColor }}
          as="h2"
        />
        <div className="grid md:grid-cols-2 gap-6">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} relative group`}
              style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}` }}
            >
              <button
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all"
              >
                ✕
              </button>
              <EditableText
                value={item.quote}
                onChange={(val) => updateItem(index, { quote: val })}
                className="text-lg mb-4 italic block"
                style={{ color: styles.textColor }}
                multiline
                as="p"
              />
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
                >
                  {item.author?.[0] || '?'}
                </div>
                <div>
                  <EditableText
                    value={item.author}
                    onChange={(val) => updateItem(index, { author: val })}
                    className="font-medium block"
                    style={{ color: styles.textColor }}
                  />
                  <EditableText
                    value={item.role}
                    onChange={(val) => updateItem(index, { role: val })}
                    className="text-sm block"
                    style={{ color: styles.mutedColor }}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button
            onClick={addItem}
            className={`p-6 ${borderRadius.card} text-center border-2 border-dashed border-[#27272a] hover:border-[#22c55e] transition-colors flex items-center justify-center min-h-[200px]`}
          >
            <span className="text-[#71717a]">+ Add Testimonial</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// Inline FAQ Section
function FAQSectionInline({ section, styles, borderRadius, spacing, updateSection }) {
  const [openIndex, setOpenIndex] = useState(0);

  const updateItem = (index, updates) => {
    const newItems = [...(section.items || [])];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { question: 'New question?', answer: 'Answer here...' }],
    });
  };

  const removeItem = (index) => {
    const newItems = (section.items || []).filter((_, i) => i !== index);
    updateSection({ items: newItems });
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-3xl mx-auto">
        <EditableText
          value={section.headline}
          onChange={(val) => updateSection({ headline: val })}
          className="text-3xl md:text-4xl font-bold mb-12 text-center block"
          style={{ color: styles.textColor }}
          as="h2"
        />
        <div className="space-y-4">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`${borderRadius.card} overflow-hidden relative group`}
              style={{ backgroundColor: styles.backgroundColor, border: `1px solid ${styles.borderColor}` }}
            >
              <button
                onClick={() => removeItem(index)}
                className="absolute top-2 right-2 p-1 text-red-400 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded transition-all z-10"
              >
                ✕
              </button>
              <div
                onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                className="w-full p-4 text-left flex justify-between items-center cursor-pointer"
              >
                <EditableText
                  value={item.question}
                  onChange={(val) => updateItem(index, { question: val })}
                  className="font-medium"
                  style={{ color: styles.textColor }}
                />
                <span style={{ color: styles.mutedColor }}>{openIndex === index ? '−' : '+'}</span>
              </div>
              {openIndex === index && (
                <div className="px-4 pb-4">
                  <EditableText
                    value={item.answer}
                    onChange={(val) => updateItem(index, { answer: val })}
                    style={{ color: styles.mutedColor }}
                    multiline
                  />
                </div>
              )}
            </div>
          ))}
          
          <button
            onClick={addItem}
            className={`w-full p-4 ${borderRadius.card} text-center border-2 border-dashed border-[#27272a] hover:border-[#22c55e] transition-colors`}
          >
            <span className="text-[#71717a]">+ Add FAQ</span>
          </button>
        </div>
      </div>
    </section>
  );
}

// Inline Pricing Section
function PricingSectionInline({ section, styles, borderRadius, spacing, updateSection }) {
  const updatePlan = (index, updates) => {
    const newPlans = [...(section.plans || [])];
    newPlans[index] = { ...newPlans[index], ...updates };
    updateSection({ plans: newPlans });
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <EditableText
            value={section.headline}
            onChange={(val) => updateSection({ headline: val })}
            className="text-3xl md:text-4xl font-bold mb-4 block"
            style={{ color: styles.textColor }}
            as="h2"
          />
          <EditableText
            value={section.subheadline}
            onChange={(val) => updateSection({ subheadline: val })}
            className="text-lg block"
            style={{ color: styles.mutedColor }}
            as="p"
          />
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {(section.plans || []).map((plan, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} ${plan.highlighted ? 'ring-2' : ''}`}
              style={{ 
                backgroundColor: styles.cardColor,
                border: `1px solid ${plan.highlighted ? styles.primaryColor : styles.borderColor}`,
                '--tw-ring-color': styles.primaryColor,
              }}
            >
              <EditableText
                value={plan.name}
                onChange={(val) => updatePlan(index, { name: val })}
                className="text-xl font-bold mb-2 block"
                style={{ color: styles.textColor }}
                as="h3"
              />
              <div className="mb-4">
                <EditableText
                  value={plan.price}
                  onChange={(val) => updatePlan(index, { price: val })}
                  className="text-4xl font-bold"
                  style={{ color: styles.textColor }}
                />
                <EditableText
                  value={plan.period}
                  onChange={(val) => updatePlan(index, { period: val })}
                  style={{ color: styles.mutedColor }}
                />
              </div>
              <ul className="space-y-2 mb-6">
                {(plan.features || []).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span style={{ color: styles.primaryColor }}>✓</span>
                    <EditableText
                      value={feature}
                      onChange={(val) => {
                        const newFeatures = [...(plan.features || [])];
                        newFeatures[i] = val;
                        updatePlan(index, { features: newFeatures });
                      }}
                      style={{ color: styles.mutedColor }}
                    />
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 ${borderRadius.button} font-bold`}
                style={{ 
                  backgroundColor: plan.highlighted ? styles.primaryColor : 'transparent',
                  color: plan.highlighted ? styles.backgroundColor : styles.textColor,
                  border: `1px solid ${plan.highlighted ? styles.primaryColor : styles.borderColor}`,
                }}
              >
                <EditableText
                  value={plan.cta}
                  onChange={(val) => updatePlan(index, { cta: val })}
                />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Inline CTA Section
function CTASectionInline({ section, styles, borderRadius, spacing, updateSection, email, setEmail }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-2xl mx-auto text-center">
        <EditableText
          value={section.headline}
          onChange={(val) => updateSection({ headline: val })}
          className="text-3xl md:text-4xl font-bold mb-4 block"
          style={{ color: styles.textColor }}
          as="h2"
        />
        <EditableText
          value={section.subheadline}
          onChange={(val) => updateSection({ subheadline: val })}
          className="text-lg mb-8 block"
          style={{ color: styles.mutedColor }}
          as="p"
        />

        {section.showEmail ? (
          <div className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className={`flex-1 px-5 py-3.5 ${borderRadius.input} text-base outline-none`}
                style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}`, color: styles.textColor }}
              />
              <button
                className={`px-7 py-3.5 ${borderRadius.button} font-bold`}
                style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
              >
                <EditableText
                  value={section.ctaText}
                  onChange={(val) => updateSection({ ctaText: val })}
                />
              </button>
            </div>
          </div>
        ) : (
          <button
            className={`px-8 py-4 ${borderRadius.button} font-bold text-lg`}
            style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
          >
            <EditableText
              value={section.ctaText}
              onChange={(val) => updateSection({ ctaText: val })}
            />
          </button>
        )}
      </div>
    </section>
  );
}

// Inline Countdown Section
function CountdownSectionInline({ section, styles, spacing, updateSection }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-2xl mx-auto text-center">
        <EditableText
          value={section.headline}
          onChange={(val) => updateSection({ headline: val })}
          className="text-3xl md:text-4xl font-bold mb-8 block"
          style={{ color: styles.textColor }}
          as="h2"
        />
        <div className="flex justify-center gap-4">
          {['Days', 'Hours', 'Minutes', 'Seconds'].map((label, i) => (
            <div 
              key={label}
              className="p-4 rounded-xl min-w-[80px]"
              style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}` }}
            >
              <div className="text-3xl font-bold" style={{ color: styles.primaryColor }}>
                {String([7, 12, 30, 45][i]).padStart(2, '0')}
              </div>
              <div className="text-xs" style={{ color: styles.mutedColor }}>{label}</div>
            </div>
          ))}
        </div>
        <p className="text-sm mt-4" style={{ color: styles.mutedColor }}>
          Target date: <input
            type="date"
            value={section.targetDate?.split('T')[0] || ''}
            onChange={(e) => updateSection({ targetDate: new Date(e.target.value).toISOString() })}
            className="bg-transparent border-b border-[#27272a] outline-none"
            style={{ color: styles.mutedColor }}
          />
        </p>
      </div>
    </section>
  );
}

// Inline Footer Section
function FooterSectionInline({ section, styles, updateSection, socialLinks }) {
  return (
    <footer className="py-8 px-6" style={{ borderTop: `1px solid ${styles.borderColor}` }}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <EditableText
          value={section.copyright}
          onChange={(val) => updateSection({ copyright: val })}
          className="text-sm"
          style={{ color: styles.mutedColor }}
        />
        <span className="text-sm" style={{ color: styles.primaryColor }}>
          Built with ValidateIRL
        </span>
      </div>
    </footer>
  );
}