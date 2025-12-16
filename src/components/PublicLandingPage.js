'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

// Font mapping for Google Fonts
const FONT_URLS = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
  'Sora': 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap',
};

export default function PublicLandingPage({ projectId, projectName, landingPage }) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [openFaq, setOpenFaq] = useState(null);
  const [trackingRef, setTrackingRef] = useState(null);

  // Load Google Font and capture tracking ref
  useEffect(() => {
    const font = landingPage?.globalStyles?.font || 'Inter';
    const fontUrl = FONT_URLS[font];
    if (fontUrl) {
      const link = document.createElement('link');
      link.href = fontUrl;
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }

    // Capture ref parameter from URL for tracking
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const ref = params.get('ref');
      if (ref) {
        setTrackingRef(ref);
        // Store in sessionStorage so it persists if they navigate
        sessionStorage.setItem('signup_ref', ref);
      } else {
        // Check sessionStorage for previously captured ref
        const storedRef = sessionStorage.getItem('signup_ref');
        if (storedRef) setTrackingRef(storedRef);
      }
    }
  }, [landingPage?.globalStyles?.font]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setErrorMessage('');

    try {
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

      // Build referrer string with tracking ref if available
      let referrer = typeof document !== 'undefined' ? document.referrer || 'direct' : 'direct';
      if (trackingRef) {
        referrer = `ref=${trackingRef}` + (referrer !== 'direct' ? `|${referrer}` : '');
      }

      const { error } = await supabase
        .from('landing_page_signups')
        .insert({
          project_id: projectId,
          email: email.toLowerCase(),
          referrer: referrer,
        });

      if (error) throw error;
      setStatus('success');
      setEmail('');
      // Clear tracking ref after successful signup
      sessionStorage.removeItem('signup_ref');
    } catch (error) {
      console.error('Signup error:', error);
      setStatus('error');
      setErrorMessage('Something went wrong. Please try again.');
    }
  };

  // Get styles with fallbacks
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

  // If no sections, show a simple fallback page
  if (sections.length === 0) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{ 
          backgroundColor: styles.backgroundColor,
          fontFamily: `"${styles.font}", sans-serif`,
        }}
      >
        <div className="text-center p-8">
          <h1 className="text-4xl font-bold mb-4" style={{ color: styles.textColor }}>
            {projectName}
          </h1>
          <p style={{ color: styles.mutedColor }}>Coming soon...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen"
      style={{ 
        backgroundColor: styles.backgroundColor,
        fontFamily: `"${styles.font}", sans-serif`,
      }}
    >
      {sections.map((section) => {
        if (!section.visible) return null;

        switch (section.type) {
          case 'hero':
            return (
              <HeroSection
                key={section.id}
                section={section}
                styles={styles}
                borderRadius={borderRadius}
                spacing={spacing}
                email={email}
                setEmail={setEmail}
                status={status}
                handleSubmit={handleSubmit}
                errorMessage={errorMessage}
              />
            );
          case 'features':
            return <FeaturesSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} />;
          case 'howItWorks':
            return <HowItWorksSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} />;
          case 'testimonials':
            return <TestimonialsSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} />;
          case 'faq':
            return <FAQSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} openFaq={openFaq} setOpenFaq={setOpenFaq} />;
          case 'pricing':
            return <PricingSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} />;
          case 'cta':
            return (
              <CTASection
                key={section.id}
                section={section}
                styles={styles}
                borderRadius={borderRadius}
                spacing={spacing}
                email={email}
                setEmail={setEmail}
                status={status}
                handleSubmit={handleSubmit}
              />
            );
          case 'countdown':
            return <CountdownSection key={section.id} section={section} styles={styles} spacing={spacing} />;
          case 'video':
            return <VideoSection key={section.id} section={section} styles={styles} borderRadius={borderRadius} spacing={spacing} />;
          case 'logos':
            return <LogosSection key={section.id} section={section} styles={styles} spacing={spacing} />;
          case 'footer':
            return <FooterSection key={section.id} section={section} styles={styles} socialLinks={landingPage.socialLinks} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// Hero Section
function HeroSection({ section, styles, borderRadius, spacing, email, setEmail, status, handleSubmit, errorMessage }) {
  const isLeft = section.layout === 'left';

  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className={`max-w-4xl mx-auto ${isLeft ? 'text-left' : 'text-center'}`}>
        {section.showBadge && section.badge && (
          <div 
            className={`inline-flex items-center gap-2 px-4 py-2 ${borderRadius.button} text-sm mb-6`}
            style={{ 
              backgroundColor: `${styles.primaryColor}20`,
              color: styles.primaryColor,
              border: `1px solid ${styles.primaryColor}30`,
            }}
          >
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: styles.primaryColor }} />
            {section.badge}
          </div>
        )}

        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          style={{ color: styles.textColor }}
        >
          {section.headline || 'Your Headline Here'}
        </h1>

        <p 
          className={`text-lg md:text-xl mb-8 ${isLeft ? '' : 'max-w-2xl mx-auto'}`}
          style={{ color: styles.mutedColor }}
        >
          {section.subheadline}
        </p>

        {status === 'success' ? (
          <div 
            className={`p-6 ${borderRadius.card} text-center max-w-md ${isLeft ? '' : 'mx-auto'}`}
            style={{ 
              backgroundColor: `${styles.primaryColor}20`,
              border: `1px solid ${styles.primaryColor}30`,
            }}
          >
            <div className="text-4xl mb-3">🎉</div>
            <h3 className="text-xl font-bold mb-2" style={{ color: styles.textColor }}>You're on the list!</h3>
            <p style={{ color: styles.mutedColor }}>We'll notify you when we launch.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={`${isLeft ? '' : 'max-w-md mx-auto'}`}>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={`flex-1 px-5 py-3.5 ${borderRadius.input} text-base outline-none transition-colors`}
                style={{ 
                  backgroundColor: styles.cardColor,
                  border: `1px solid ${styles.borderColor}`,
                  color: styles.textColor,
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`px-7 py-3.5 ${borderRadius.button} font-bold text-base whitespace-nowrap transition-opacity disabled:opacity-50`}
                style={{ 
                  backgroundColor: styles.primaryColor,
                  color: styles.backgroundColor,
                }}
              >
                {status === 'loading' ? 'Joining...' : section.ctaText || 'Join Waitlist'}
              </button>
            </div>
            {section.ctaSubtext && (
              <p className="text-sm mt-3" style={{ color: styles.mutedColor }}>{section.ctaSubtext}</p>
            )}
            {errorMessage && <p className="text-sm mt-3 text-red-400">{errorMessage}</p>}
          </form>
        )}
      </div>
    </section>
  );
}

// Features Section
function FeaturesSection({ section, styles, borderRadius, spacing }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>{section.headline}</h2>
          {section.subheadline && <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>}
        </div>
        <div className={`grid ${section.layout === 'grid' ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} text-center`}
              style={{ backgroundColor: styles.backgroundColor, border: `1px solid ${styles.borderColor}` }}
            >
              <div 
                className={`w-14 h-14 ${borderRadius.card} flex items-center justify-center mx-auto mb-4 text-2xl`}
                style={{ backgroundColor: `${styles.primaryColor}20` }}
              >
                {item.icon}
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: styles.textColor }}>{item.title}</h3>
              <p className="text-sm" style={{ color: styles.mutedColor }}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection({ section, styles, borderRadius, spacing }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>{section.headline}</h2>
          {section.subheadline && <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>}
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
              <h3 className="text-lg font-bold mb-2" style={{ color: styles.textColor }}>{step.title}</h3>
              <p className="text-sm" style={{ color: styles.mutedColor }}>{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Testimonials Section
function TestimonialsSection({ section, styles, borderRadius, spacing }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ color: styles.textColor }}>{section.headline}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card}`}
              style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}` }}
            >
              <p className="text-lg mb-4 italic" style={{ color: styles.textColor }}>"{item.quote}"</p>
              <div className="flex items-center gap-3">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                  style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
                >
                  {item.author?.[0] || '?'}
                </div>
                <div>
                  <div className="font-medium" style={{ color: styles.textColor }}>{item.author}</div>
                  <div className="text-sm" style={{ color: styles.mutedColor }}>{item.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// FAQ Section
function FAQSection({ section, styles, borderRadius, spacing, openFaq, setOpenFaq }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ color: styles.textColor }}>{section.headline}</h2>
        <div className="space-y-4">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`${borderRadius.card} overflow-hidden`}
              style={{ backgroundColor: styles.backgroundColor, border: `1px solid ${styles.borderColor}` }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === index ? null : index)}
                className="w-full p-4 text-left flex justify-between items-center"
              >
                <span className="font-medium" style={{ color: styles.textColor }}>{item.question}</span>
                <span style={{ color: styles.mutedColor }}>{openFaq === index ? '−' : '+'}</span>
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4" style={{ color: styles.mutedColor }}>{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Section
function PricingSection({ section, styles, borderRadius, spacing }) {
  const planCount = section.plans?.length || 2;
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>{section.headline}</h2>
          {section.subheadline && <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>}
        </div>
        <div className={`grid ${planCount >= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-6 max-w-4xl mx-auto`}>
          {(section.plans || []).map((plan, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} ${plan.highlighted ? 'ring-2' : ''}`}
              style={{ 
                backgroundColor: styles.cardColor,
                border: `1px solid ${plan.highlighted ? styles.primaryColor : styles.borderColor}`,
                ringColor: styles.primaryColor,
              }}
            >
              {plan.highlighted && (
                <div 
                  className={`text-xs font-bold px-3 py-1 ${borderRadius.button} inline-block mb-4`}
                  style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
                >
                  Popular
                </div>
              )}
              <h3 className="text-xl font-bold mb-2" style={{ color: styles.textColor }}>{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold" style={{ color: styles.textColor }}>{plan.price}</span>
                <span style={{ color: styles.mutedColor }}>{plan.period}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {(plan.features || []).map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm" style={{ color: styles.mutedColor }}>
                    <span style={{ color: styles.primaryColor }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                className={`w-full py-3 ${borderRadius.button} font-bold transition-opacity hover:opacity-90`}
                style={{ 
                  backgroundColor: plan.highlighted ? styles.primaryColor : 'transparent',
                  color: plan.highlighted ? styles.backgroundColor : styles.textColor,
                  border: `1px solid ${plan.highlighted ? styles.primaryColor : styles.borderColor}`,
                }}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ section, styles, borderRadius, spacing, email, setEmail, status, handleSubmit }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>{section.headline}</h2>
        {section.subheadline && <p className="text-lg mb-8" style={{ color: styles.mutedColor }}>{section.subheadline}</p>}

        {section.showEmail ? (
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className={`flex-1 px-5 py-3.5 ${borderRadius.input} text-base outline-none`}
                style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}`, color: styles.textColor }}
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`px-7 py-3.5 ${borderRadius.button} font-bold disabled:opacity-50`}
                style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
              >
                {status === 'loading' ? 'Joining...' : status === 'success' ? '✓ Joined!' : section.ctaText}
              </button>
            </div>
          </form>
        ) : (
          <button
            className={`px-8 py-4 ${borderRadius.button} font-bold text-lg`}
            style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
          >
            {section.ctaText}
          </button>
        )}
      </div>
    </section>
  );
}

// Countdown Section
function CountdownSection({ section, styles, spacing }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculate = () => {
      const diff = new Date(section.targetDate).getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [section.targetDate]);

  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: styles.textColor }}>{section.headline}</h2>
        <div className="flex justify-center gap-4">
          {[
            { value: timeLeft.days, label: 'Days' },
            { value: timeLeft.hours, label: 'Hours' },
            { value: timeLeft.minutes, label: 'Minutes' },
            { value: timeLeft.seconds, label: 'Seconds' },
          ].map((item, index) => (
            <div 
              key={index}
              className="p-4 rounded-xl min-w-[80px]"
              style={{ backgroundColor: styles.cardColor, border: `1px solid ${styles.borderColor}` }}
            >
              <div className="text-3xl font-bold" style={{ color: styles.primaryColor }}>
                {String(item.value).padStart(2, '0')}
              </div>
              <div className="text-xs" style={{ color: styles.mutedColor }}>{item.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Video Section
function VideoSection({ section, styles, borderRadius, spacing }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch')) return `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0]}`;
    if (url.includes('youtu.be')) return `https://www.youtube.com/embed/${url.split('youtu.be/')[1]?.split('?')[0]}`;
    if (url.includes('vimeo.com')) return `https://player.vimeo.com/video/${url.split('vimeo.com/')[1]?.split('?')[0]}`;
    return url;
  };

  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-4xl mx-auto">
        {section.headline && (
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: styles.textColor }}>{section.headline}</h2>
        )}
        <div className={`aspect-video ${borderRadius.card} overflow-hidden`} style={{ backgroundColor: styles.cardColor }}>
          {section.videoUrl ? (
            <iframe src={getEmbedUrl(section.videoUrl)} className="w-full h-full" allowFullScreen />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: styles.mutedColor }}>
              <span className="text-4xl">🎬</span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// Logos Section
function LogosSection({ section, styles, spacing }) {
  return (
    <section className={`${spacing.section} ${spacing.container}`}>
      <div className="max-w-4xl mx-auto text-center">
        {section.headline && <p className="text-sm font-medium mb-6" style={{ color: styles.mutedColor }}>{section.headline}</p>}
        <div className="flex flex-wrap justify-center gap-8 opacity-50">
          {['Company 1', 'Company 2', 'Company 3', 'Company 4'].map((name, i) => (
            <div key={i} className="px-6 py-3 rounded-lg" style={{ backgroundColor: styles.cardColor }}>
              <span style={{ color: styles.mutedColor }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Footer Section
function FooterSection({ section, styles, socialLinks }) {
  return (
    <footer className="py-8 px-6" style={{ borderTop: `1px solid ${styles.borderColor}` }}>
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm" style={{ color: styles.mutedColor }}>{section.copyright}</p>
        {section.showSocial && socialLinks && (
          <div className="flex gap-4">
            {socialLinks.twitter && <a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" style={{ color: styles.mutedColor }} className="hover:opacity-70">𝕏</a>}
            {socialLinks.github && <a href={socialLinks.github} target="_blank" rel="noopener noreferrer" style={{ color: styles.mutedColor }} className="hover:opacity-70">GitHub</a>}
            {socialLinks.linkedin && <a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: styles.mutedColor }} className="hover:opacity-70">LinkedIn</a>}
          </div>
        )}
        <a href="https://validateirl.com" className="text-sm hover:opacity-80" style={{ color: styles.primaryColor }}>
          Built with ValidateIRL
        </a>
      </div>
    </footer>
  );
}