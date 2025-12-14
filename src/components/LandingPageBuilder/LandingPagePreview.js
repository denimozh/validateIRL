'use client';

import { useState } from 'react';

export default function LandingPagePreview({ landingPage, projectName }) {
  const [viewMode, setViewMode] = useState('desktop'); // desktop, tablet, mobile
  const [email, setEmail] = useState('');

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  return (
    <div className="space-y-4">
      {/* Device Selector */}
      <div className="flex items-center justify-center gap-2 bg-[#161618] border border-[#27272a] rounded-xl p-3">
        {[
          { id: 'desktop', icon: '🖥️', label: 'Desktop' },
          { id: 'tablet', icon: '📱', label: 'Tablet' },
          { id: 'mobile', icon: '📱', label: 'Mobile' },
        ].map(device => (
          <button
            key={device.id}
            onClick={() => setViewMode(device.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              viewMode === device.id
                ? 'bg-[#22c55e] text-[#0a0a0b]'
                : 'text-[#71717a] hover:text-white'
            }`}
          >
            <span>{device.icon}</span>
            {device.label}
          </button>
        ))}
      </div>

      {/* Preview Frame */}
      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-6 flex justify-center overflow-x-auto">
        <div 
          className="transition-all duration-300 border border-[#27272a] rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            width: getPreviewWidth(),
            minWidth: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '800px',
          }}
        >
          {/* Browser Chrome */}
          <div className="bg-[#27272a] px-4 py-2 flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex-1 mx-4">
              <div className="bg-[#161618] rounded-md px-3 py-1 text-xs text-[#71717a] text-center">
                validateirl.com/p/your-project
              </div>
            </div>
          </div>

          {/* Landing Page Content */}
          <div 
            className="min-h-[600px]"
            style={{ backgroundColor: landingPage.colors.background }}
          >
            {/* Hero Section */}
            <div className="px-6 py-16 md:py-24 text-center max-w-2xl mx-auto">
              {/* Social Proof Badge */}
              {landingPage.showSocialProof && landingPage.socialProof && (
                <div 
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
                  style={{ 
                    backgroundColor: `${landingPage.colors.primary}20`,
                    color: landingPage.colors.primary,
                    border: `1px solid ${landingPage.colors.primary}30`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: landingPage.colors.primary }} />
                  {landingPage.socialProof}
                </div>
              )}

              {/* Headline */}
              <h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
                style={{ color: landingPage.colors.text }}
              >
                {landingPage.headline || 'Your Headline Here'}
              </h1>

              {/* Subheadline */}
              <p 
                className="text-lg md:text-xl mb-10 max-w-xl mx-auto"
                style={{ color: landingPage.colors.muted }}
              >
                {landingPage.subheadline || 'Your subheadline explaining the value proposition'}
              </p>

              {/* Email Form */}
              <div className="max-w-md mx-auto">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="flex-1 px-5 py-3.5 rounded-full text-base outline-none"
                    style={{ 
                      backgroundColor: landingPage.colors.card,
                      border: `1px solid ${landingPage.colors.border}`,
                      color: landingPage.colors.text,
                    }}
                  />
                  <button
                    className="px-7 py-3.5 rounded-full font-bold text-base whitespace-nowrap"
                    style={{ 
                      backgroundColor: landingPage.colors.primary,
                      color: landingPage.colors.background,
                    }}
                  >
                    {landingPage.ctaText || 'Join Waitlist'}
                  </button>
                </div>
                {landingPage.ctaSubtext && (
                  <p 
                    className="text-sm mt-3"
                    style={{ color: landingPage.colors.muted }}
                  >
                    {landingPage.ctaSubtext}
                  </p>
                )}
              </div>
            </div>

            {/* Pain Points / Benefits */}
            {landingPage.showPainPoints && landingPage.painPoints.some(p => p) && (
              <div 
                className="px-6 py-16"
                style={{ backgroundColor: landingPage.colors.card }}
              >
                <div className="max-w-3xl mx-auto">
                  <h2 
                    className="text-2xl font-bold text-center mb-10"
                    style={{ color: landingPage.colors.text }}
                  >
                    Why you'll love it
                  </h2>
                  <div className="grid md:grid-cols-3 gap-6">
                    {landingPage.painPoints.filter(p => p).map((point, index) => (
                      <div 
                        key={index}
                        className="p-6 rounded-xl text-center"
                        style={{ 
                          backgroundColor: landingPage.colors.background,
                          border: `1px solid ${landingPage.colors.border}`,
                        }}
                      >
                        <div 
                          className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-xl"
                          style={{ 
                            backgroundColor: `${landingPage.colors.primary}20`,
                            color: landingPage.colors.primary,
                          }}
                        >
                          ✓
                        </div>
                        <p style={{ color: landingPage.colors.text }}>{point}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Footer CTA */}
            <div className="px-6 py-16 text-center">
              <h2 
                className="text-2xl md:text-3xl font-bold mb-4"
                style={{ color: landingPage.colors.text }}
              >
                Ready to get started?
              </h2>
              <p 
                className="mb-8"
                style={{ color: landingPage.colors.muted }}
              >
                Join the waitlist and be the first to know when we launch.
              </p>
              <button
                className="px-8 py-4 rounded-full font-bold text-lg"
                style={{ 
                  backgroundColor: landingPage.colors.primary,
                  color: landingPage.colors.background,
                }}
              >
                {landingPage.ctaText || 'Join Waitlist'}
              </button>
            </div>

            {/* Footer */}
            <div 
              className="px-6 py-6 text-center text-sm"
              style={{ 
                borderTop: `1px solid ${landingPage.colors.border}`,
                color: landingPage.colors.muted,
              }}
            >
              Built with ValidateIRL
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}