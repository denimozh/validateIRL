'use client';

import { useState } from 'react';

export default function SectionEditor({ section, updateSection, globalStyles }) {
  if (!section) return null;

  const renderEditor = () => {
    switch (section.type) {
      case 'hero':
        return <HeroEditor section={section} updateSection={updateSection} />;
      case 'features':
        return <FeaturesEditor section={section} updateSection={updateSection} />;
      case 'howItWorks':
        return <HowItWorksEditor section={section} updateSection={updateSection} />;
      case 'testimonials':
        return <TestimonialsEditor section={section} updateSection={updateSection} />;
      case 'faq':
        return <FAQEditor section={section} updateSection={updateSection} />;
      case 'pricing':
        return <PricingEditor section={section} updateSection={updateSection} />;
      case 'cta':
        return <CTAEditor section={section} updateSection={updateSection} />;
      case 'countdown':
        return <CountdownEditor section={section} updateSection={updateSection} />;
      case 'video':
        return <VideoEditor section={section} updateSection={updateSection} />;
      case 'logos':
        return <LogosEditor section={section} updateSection={updateSection} />;
      case 'footer':
        return <FooterEditor section={section} updateSection={updateSection} />;
      default:
        return <div className="text-[#71717a]">No editor available for this section type</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold">Edit {section.type.charAt(0).toUpperCase() + section.type.slice(1)}</h3>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={section.visible}
            onChange={(e) => updateSection({ visible: e.target.checked })}
            className="w-4 h-4 rounded border-[#27272a] bg-[#0a0a0b] text-[#22c55e] focus:ring-[#22c55e]"
          />
          Visible
        </label>
      </div>
      {renderEditor()}
    </div>
  );
}

// Input component for consistency
function Input({ label, value, onChange, placeholder, type = 'text', rows }) {
  const baseClass = "w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none";
  
  return (
    <div>
      {label && <label className="block text-xs text-[#71717a] mb-1">{label}</label>}
      {rows ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={rows}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={baseClass}
        />
      )}
    </div>
  );
}

// Hero Section Editor
function HeroEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-[#71717a] mb-1">Layout</label>
        <div className="flex gap-2">
          {['centered', 'left', 'split'].map(layout => (
            <button
              key={layout}
              onClick={() => updateSection({ layout })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs capitalize ${
                section.layout === layout
                  ? 'bg-[#22c55e] text-[#0a0a0b]'
                  : 'bg-[#0a0a0b] border border-[#27272a]'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a]">
        <input
          type="checkbox"
          checked={section.showBadge}
          onChange={(e) => updateSection({ showBadge: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        Show Badge
      </label>
      
      {section.showBadge && (
        <Input
          label="Badge Text"
          value={section.badge}
          onChange={(v) => updateSection({ badge: v })}
          placeholder="🚀 Coming Soon"
        />
      )}

      <Input
        label="Headline"
        value={section.headline}
        onChange={(v) => updateSection({ headline: v })}
        placeholder="Your main headline"
      />

      <Input
        label="Subheadline"
        value={section.subheadline}
        onChange={(v) => updateSection({ subheadline: v })}
        placeholder="Supporting text"
        rows={2}
      />

      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Button Text"
          value={section.ctaText}
          onChange={(v) => updateSection({ ctaText: v })}
          placeholder="Get Started"
        />
        <Input
          label="Button Subtext"
          value={section.ctaSubtext}
          onChange={(v) => updateSection({ ctaSubtext: v })}
          placeholder="No credit card required"
        />
      </div>
    </div>
  );
}

// Features Section Editor
function FeaturesEditor({ section, updateSection }) {
  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { icon: '✨', title: 'New Feature', description: 'Description here' }],
    });
  };

  const updateItem = (index, updates) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const removeItem = (index) => {
    updateSection({ items: section.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs text-[#71717a] mb-1">Layout</label>
        <div className="flex gap-2">
          {['grid', 'list', 'alternating'].map(layout => (
            <button
              key={layout}
              onClick={() => updateSection({ layout })}
              className={`flex-1 px-3 py-2 rounded-lg text-xs capitalize ${
                section.layout === layout
                  ? 'bg-[#22c55e] text-[#0a0a0b]'
                  : 'bg-[#0a0a0b] border border-[#27272a]'
              }`}
            >
              {layout}
            </button>
          ))}
        </div>
      </div>

      <Input
        label="Section Title"
        value={section.headline}
        onChange={(v) => updateSection({ headline: v })}
      />

      <Input
        label="Section Subtitle"
        value={section.subheadline}
        onChange={(v) => updateSection({ subheadline: v })}
      />

      <div>
        <label className="block text-xs text-[#71717a] mb-2">Features</label>
        <div className="space-y-3">
          {(section.items || []).map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.icon}
                  onChange={(e) => updateItem(index, { icon: e.target.value })}
                  className="w-12 px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-center"
                  placeholder="🔥"
                />
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateItem(index, { title: e.target.value })}
                  className="flex-1 px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="Feature title"
                />
                <button
                  onClick={() => removeItem(index)}
                  className="px-2 text-red-400 hover:bg-red-500/20 rounded"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, { description: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                placeholder="Feature description"
              />
            </div>
          ))}
          <button
            onClick={addItem}
            className="w-full p-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] text-sm text-[#71717a] hover:text-[#22c55e]"
          >
            + Add Feature
          </button>
        </div>
      </div>
    </div>
  );
}

// How It Works Editor
function HowItWorksEditor({ section, updateSection }) {
  const addStep = () => {
    const num = (section.steps?.length || 0) + 1;
    updateSection({
      steps: [...(section.steps || []), { number: String(num), title: 'Step ' + num, description: 'Description' }],
    });
  };

  const updateStep = (index, updates) => {
    const newSteps = [...section.steps];
    newSteps[index] = { ...newSteps[index], ...updates };
    updateSection({ steps: newSteps });
  };

  const removeStep = (index) => {
    updateSection({ steps: section.steps.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Input label="Section Title" value={section.headline} onChange={(v) => updateSection({ headline: v })} />
      <Input label="Section Subtitle" value={section.subheadline} onChange={(v) => updateSection({ subheadline: v })} />

      <div>
        <label className="block text-xs text-[#71717a] mb-2">Steps</label>
        <div className="space-y-3">
          {(section.steps || []).map((step, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={step.number}
                  onChange={(e) => updateStep(index, { number: e.target.value })}
                  className="w-12 px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-center"
                />
                <input
                  type="text"
                  value={step.title}
                  onChange={(e) => updateStep(index, { title: e.target.value })}
                  className="flex-1 px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                />
                <button onClick={() => removeStep(index)} className="px-2 text-red-400 hover:bg-red-500/20 rounded">✕</button>
              </div>
              <input
                type="text"
                value={step.description}
                onChange={(e) => updateStep(index, { description: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
              />
            </div>
          ))}
          <button onClick={addStep} className="w-full p-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] text-sm text-[#71717a]">
            + Add Step
          </button>
        </div>
      </div>
    </div>
  );
}

// Testimonials Editor
function TestimonialsEditor({ section, updateSection }) {
  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { quote: 'Amazing product!', author: 'Name', role: 'Role, Company' }],
    });
  };

  const updateItem = (index, updates) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const removeItem = (index) => {
    updateSection({ items: section.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Input label="Section Title" value={section.headline} onChange={(v) => updateSection({ headline: v })} />

      <div>
        <label className="block text-xs text-[#71717a] mb-2">Testimonials</label>
        <div className="space-y-3">
          {(section.items || []).map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-[#71717a]">Testimonial {index + 1}</span>
                <button onClick={() => removeItem(index)} className="text-red-400 text-xs">Remove</button>
              </div>
              <textarea
                value={item.quote}
                onChange={(e) => updateItem(index, { quote: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm resize-none"
                rows={2}
                placeholder="Quote"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.author}
                  onChange={(e) => updateItem(index, { author: e.target.value })}
                  className="px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="Name"
                />
                <input
                  type="text"
                  value={item.role}
                  onChange={(e) => updateItem(index, { role: e.target.value })}
                  className="px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="Role, Company"
                />
              </div>
            </div>
          ))}
          <button onClick={addItem} className="w-full p-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] text-sm text-[#71717a]">
            + Add Testimonial
          </button>
        </div>
      </div>
    </div>
  );
}

// FAQ Editor
function FAQEditor({ section, updateSection }) {
  const addItem = () => {
    updateSection({
      items: [...(section.items || []), { question: 'New question?', answer: 'Answer here.' }],
    });
  };

  const updateItem = (index, updates) => {
    const newItems = [...section.items];
    newItems[index] = { ...newItems[index], ...updates };
    updateSection({ items: newItems });
  };

  const removeItem = (index) => {
    updateSection({ items: section.items.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Input label="Section Title" value={section.headline} onChange={(v) => updateSection({ headline: v })} />

      <div>
        <label className="block text-xs text-[#71717a] mb-2">Questions</label>
        <div className="space-y-3">
          {(section.items || []).map((item, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-[#71717a]">Q{index + 1}</span>
                <button onClick={() => removeItem(index)} className="text-red-400 text-xs">Remove</button>
              </div>
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateItem(index, { question: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                placeholder="Question"
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateItem(index, { answer: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm resize-none"
                rows={2}
                placeholder="Answer"
              />
            </div>
          ))}
          <button onClick={addItem} className="w-full p-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] text-sm text-[#71717a]">
            + Add Question
          </button>
        </div>
      </div>
    </div>
  );
}

// Pricing Editor
function PricingEditor({ section, updateSection }) {
  const addPlan = () => {
    updateSection({
      plans: [...(section.plans || []), { name: 'Plan', price: '$X', period: '/month', features: ['Feature'], cta: 'Get Started', highlighted: false }],
    });
  };

  const updatePlan = (index, updates) => {
    const newPlans = [...section.plans];
    newPlans[index] = { ...newPlans[index], ...updates };
    updateSection({ plans: newPlans });
  };

  const removePlan = (index) => {
    updateSection({ plans: section.plans.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <Input label="Section Title" value={section.headline} onChange={(v) => updateSection({ headline: v })} />
      <Input label="Section Subtitle" value={section.subheadline} onChange={(v) => updateSection({ subheadline: v })} />

      <div>
        <label className="block text-xs text-[#71717a] mb-2">Plans</label>
        <div className="space-y-3">
          {(section.plans || []).map((plan, index) => (
            <div key={index} className="p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a] space-y-2">
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    checked={plan.highlighted}
                    onChange={(e) => updatePlan(index, { highlighted: e.target.checked })}
                    className="w-3 h-3 rounded"
                  />
                  Highlighted
                </label>
                <button onClick={() => removePlan(index)} className="text-red-400 text-xs">Remove</button>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  value={plan.name}
                  onChange={(e) => updatePlan(index, { name: e.target.value })}
                  className="px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="Plan name"
                />
                <input
                  type="text"
                  value={plan.price}
                  onChange={(e) => updatePlan(index, { price: e.target.value })}
                  className="px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="$29"
                />
                <input
                  type="text"
                  value={plan.period}
                  onChange={(e) => updatePlan(index, { period: e.target.value })}
                  className="px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                  placeholder="/month"
                />
              </div>
              <input
                type="text"
                value={plan.features?.join(', ')}
                onChange={(e) => updatePlan(index, { features: e.target.value.split(',').map(f => f.trim()) })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                placeholder="Feature 1, Feature 2, Feature 3"
              />
              <input
                type="text"
                value={plan.cta}
                onChange={(e) => updatePlan(index, { cta: e.target.value })}
                className="w-full px-2 py-1 rounded bg-[#161618] border border-[#27272a] text-sm"
                placeholder="Button text"
              />
            </div>
          ))}
          <button onClick={addPlan} className="w-full p-2 rounded-lg border border-dashed border-[#27272a] hover:border-[#22c55e] text-sm text-[#71717a]">
            + Add Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// CTA Editor
function CTAEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <Input label="Headline" value={section.headline} onChange={(v) => updateSection({ headline: v })} />
      <Input label="Subheadline" value={section.subheadline} onChange={(v) => updateSection({ subheadline: v })} />
      <Input label="Button Text" value={section.ctaText} onChange={(v) => updateSection({ ctaText: v })} />
      <label className="flex items-center gap-2 text-sm p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a]">
        <input
          type="checkbox"
          checked={section.showEmail}
          onChange={(e) => updateSection({ showEmail: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        Show Email Input
      </label>
    </div>
  );
}

// Countdown Editor
function CountdownEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <Input label="Headline" value={section.headline} onChange={(v) => updateSection({ headline: v })} />
      <div>
        <label className="block text-xs text-[#71717a] mb-1">Target Date</label>
        <input
          type="datetime-local"
          value={section.targetDate?.slice(0, 16) || ''}
          onChange={(e) => updateSection({ targetDate: new Date(e.target.value).toISOString() })}
          className="w-full px-3 py-2 rounded-lg bg-[#0a0a0b] border border-[#27272a] text-sm focus:border-[#22c55e] outline-none"
        />
      </div>
    </div>
  );
}

// Video Editor
function VideoEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <Input label="Headline" value={section.headline} onChange={(v) => updateSection({ headline: v })} />
      <Input
        label="Video URL (YouTube or Vimeo)"
        value={section.videoUrl}
        onChange={(v) => updateSection({ videoUrl: v })}
        placeholder="https://youtube.com/watch?v=..."
      />
    </div>
  );
}

// Logos Editor
function LogosEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <Input label="Headline" value={section.headline} onChange={(v) => updateSection({ headline: v })} placeholder="Trusted By" />
      <p className="text-xs text-[#71717a]">Logo upload coming soon. For now, logos will show as placeholders.</p>
    </div>
  );
}

// Footer Editor
function FooterEditor({ section, updateSection }) {
  return (
    <div className="space-y-4">
      <Input label="Copyright Text" value={section.copyright} onChange={(v) => updateSection({ copyright: v })} />
      <label className="flex items-center gap-2 text-sm p-3 rounded-lg bg-[#0a0a0b] border border-[#27272a]">
        <input
          type="checkbox"
          checked={section.showSocial}
          onChange={(e) => updateSection({ showSocial: e.target.checked })}
          className="w-4 h-4 rounded"
        />
        Show Social Links
      </label>
    </div>
  );
}