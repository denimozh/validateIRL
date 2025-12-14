'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function PublicLandingPage({ projectId, projectName, landingPage }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [errorMessage, setErrorMessage] = useState('');

  // Track referrer on mount
  useEffect(() => {
    const referrer = document.referrer || 'direct';
    // Update the view with referrer (optional - could be done server-side)
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      // Check if email already exists for this project
      const { data: existing } = await supabase
        .from('landing_page_signups')
        .select('id')
        .eq('project_id', projectId)
        .eq('email', email.toLowerCase())
        .single();

      if (existing) {
        setStatus('success');
        return;
      }

      // Insert signup
      const { error } = await supabase
        .from('landing_page_signups')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          referrer: document.referrer || 'direct',
        });

      if (error) throw error;

      setStatus('success');
      setEmail('');
    } catch (error) {
      console.error('Signup error:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  const colors = landingPage.colors || {
    primary: '#22c55e',
    background: '#0a0a0b',
    text: '#fafafa',
    muted: '#a1a1aa',
    card: '#161618',
    border: '#27272a',
  };

  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: colors.background }}
    >
      {/* Hero Section */}
      <div className="px-6 py-16 md:py-24 lg:py-32 text-center max-w-3xl mx-auto">
        {/* Social Proof Badge */}
        {landingPage.showSocialProof && landingPage.socialProof && (
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm mb-8"
            style={{ 
              backgroundColor: `${colors.primary}20`,
              color: colors.primary,
              border: `1px solid ${colors.primary}30`,
            }}
          >
            <span 
              className="w-2 h-2 rounded-full animate-pulse" 
              style={{ backgroundColor: colors.primary }} 
            />
            {landingPage.socialProof}
          </div>
        )}

        {/* Headline */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          style={{ color: colors.text }}
        >
          {landingPage.headline || projectName}
        </h1>

        {/* Subheadline */}
        <p 
          className="text-lg md:text-xl mb-10 max-w-xl mx-auto"
          style={{ color: colors.muted }}
        >
          {landingPage.subheadline}
        </p>

        {/* Email Form */}
        <div className="max-w-md mx-auto">
          {status === 'success' ? (
            <div 
              className="p-6 rounded-2xl text-center"
              style={{ 
                backgroundColor: `${colors.primary}20`,
                border: `1px solid ${colors.primary}30`,
              }}
            >
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-bold mb-2" style={{ color: colors.text }}>
                You're on the list!
              </h3>
              <p style={{ color: colors.muted }}>
                We'll notify you when we launch.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                  className="flex-1 px-5 py-3.5 rounded-full text-base outline-none transition-colors"
                  style={{ 
                    backgroundColor: colors.card,
                    border: `1px solid ${colors.border}`,
                    color: colors.text,
                  }}
                />
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="px-7 py-3.5 rounded-full font-bold text-base whitespace-nowrap transition-opacity disabled:opacity-50"
                  style={{ 
                    backgroundColor: colors.primary,
                    color: colors.background,
                  }}
                >
                  {status === 'loading' ? 'Joining...' : landingPage.ctaText || 'Join Waitlist'}
                </button>
              </div>
              {landingPage.ctaSubtext && (
                <p 
                  className="text-sm mt-3"
                  style={{ color: colors.muted }}
                >
                  {landingPage.ctaSubtext}
                </p>
              )}
              {status === 'error' && (
                <p className="text-sm mt-3 text-red-400">
                  {errorMessage}
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {/* Pain Points / Benefits */}
      {landingPage.showPainPoints && landingPage.painPoints?.some(p => p) && (
        <div 
          className="px-6 py-16"
          style={{ backgroundColor: colors.card }}
        >
          <div className="max-w-4xl mx-auto">
            <h2 
              className="text-2xl md:text-3xl font-bold text-center mb-12"
              style={{ color: colors.text }}
            >
              Why you'll love it
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {landingPage.painPoints.filter(p => p).map((point, index) => (
                <div 
                  key={index}
                  className="p-6 rounded-xl text-center"
                  style={{ 
                    backgroundColor: colors.background,
                    border: `1px solid ${colors.border}`,
                  }}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold"
                    style={{ 
                      backgroundColor: `${colors.primary}20`,
                      color: colors.primary,
                    }}
                  >
                    ✓
                  </div>
                  <p 
                    className="text-lg"
                    style={{ color: colors.text }}
                  >
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Footer CTA */}
      <div className="px-6 py-16 md:py-24 text-center">
        <h2 
          className="text-2xl md:text-3xl font-bold mb-4"
          style={{ color: colors.text }}
        >
          Ready to get started?
        </h2>
        <p 
          className="mb-8 max-w-md mx-auto"
          style={{ color: colors.muted }}
        >
          Join the waitlist and be the first to know when we launch.
        </p>
        {status !== 'success' && (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="px-8 py-4 rounded-full font-bold text-lg transition-transform hover:scale-105"
            style={{ 
              backgroundColor: colors.primary,
              color: colors.background,
            }}
          >
            {landingPage.ctaText || 'Join Waitlist'}
          </button>
        )}
      </div>

      {/* Footer */}
      <div 
        className="px-6 py-6 text-center text-sm"
        style={{ 
          borderTop: `1px solid ${colors.border}`,
          color: colors.muted,
        }}
      >
        <a 
          href="https://validateirl.com" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hover:opacity-80 transition-opacity"
        >
          Built with ValidateIRL
        </a>
      </div>
    </div>
  );
}