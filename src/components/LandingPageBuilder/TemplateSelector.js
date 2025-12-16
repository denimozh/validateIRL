'use client';

import { TEMPLATES } from './templates';

export default function TemplateSelector({ onSelect, generating, error, compact = false }) {
  const templates = Object.entries(TEMPLATES);

  if (compact) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {templates.map(([key, template]) => (
          <button
            key={key}
            onClick={() => onSelect(key)}
            disabled={generating}
            className="p-4 rounded-xl bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] transition-all text-left group disabled:opacity-50"
          >
            <div className="text-3xl mb-2">{template.preview}</div>
            <h3 className="font-bold mb-1">{template.name}</h3>
            <p className="text-xs text-[#71717a]">{template.description}</p>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-[#22c55e]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🎨</span>
          </div>
          <h2 className="text-2xl font-bold mb-3">Choose Your Template</h2>
          <p className="text-[#a1a1aa]">
            Pick a starting point. AI will generate content based on your idea.
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-6 text-red-400 text-sm text-center">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map(([key, template]) => (
            <button
              key={key}
              onClick={() => onSelect(key)}
              disabled={generating}
              className="p-6 rounded-xl bg-[#0a0a0b] border border-[#27272a] hover:border-[#22c55e] hover:bg-[#0a0a0b]/80 transition-all text-left group disabled:opacity-50 disabled:cursor-wait"
            >
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                {template.preview}
              </div>
              <h3 className="font-bold text-lg mb-1">{template.name}</h3>
              <p className="text-sm text-[#71717a] mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-1">
                {template.sections.slice(0, 4).map((section, i) => (
                  <span
                    key={i}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa]"
                  >
                    {section}
                  </span>
                ))}
                {template.sections.length > 4 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#27272a] text-[#a1a1aa]">
                    +{template.sections.length - 4}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {generating && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20">
              <svg className="animate-spin w-5 h-5 text-[#22c55e]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span className="text-[#22c55e] font-medium">AI is generating your landing page...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}