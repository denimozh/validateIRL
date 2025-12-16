'use client';

import { useState, useEffect } from 'react';

// Font mapping for Google Fonts
const FONT_URLS = {
  'Inter': 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  'Space Grotesk': 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap',
  'DM Sans': 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap',
  'Poppins': 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap',
  'Outfit': 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
  'Sora': 'https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&display=swap',
};

export default function LandingPagePreview({ landingPage, projectName }) {
  const [viewMode, setViewMode] = useState('desktop');
  const [email, setEmail] = useState('');

  // Load Google Font
  useEffect(() => {
    const font = landingPage?.globalStyles?.font || 'Inter';
    const fontUrl = FONT_URLS[font];
    if (fontUrl) {
      // Check if font is already loaded
      const existingLink = document.querySelector(`link[href="${fontUrl}"]`);
      if (!existingLink) {
        const link = document.createElement('link');
        link.href = fontUrl;
        link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    }
  }, [landingPage?.globalStyles?.font]);

  const getPreviewWidth = () => {
    switch (viewMode) {
      case 'mobile': return '375px';
      case 'tablet': return '768px';
      default: return '100%';
    }
  };

  const styles = landingPage.globalStyles || {};
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

  const renderSection = (section) => {
    if (!section.visible) return null;

    const sectionStyle = {
      backgroundColor: section.type === 'features' || section.type === 'howItWorks' || section.type === 'faq' 
        ? styles.cardColor 
        : styles.backgroundColor,
    };

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
          />
        );
      case 'features':
        return (
          <FeaturesSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
      case 'howItWorks':
        return (
          <HowItWorksSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
      case 'testimonials':
        return (
          <TestimonialsSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
      case 'faq':
        return (
          <FAQSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
      case 'pricing':
        return (
          <PricingSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
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
          />
        );
      case 'countdown':
        return (
          <CountdownSection
            key={section.id}
            section={section}
            styles={styles}
            spacing={spacing}
          />
        );
      case 'video':
        return (
          <VideoSection
            key={section.id}
            section={section}
            styles={styles}
            borderRadius={borderRadius}
            spacing={spacing}
          />
        );
      case 'logos':
        return (
          <LogosSection
            key={section.id}
            section={section}
            styles={styles}
            spacing={spacing}
          />
        );
      case 'footer':
        return (
          <FooterSection
            key={section.id}
            section={section}
            styles={styles}
            socialLinks={landingPage.socialLinks}
          />
        );
      default:
        return null;
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
      <div className="bg-[#0a0a0b] border border-[#27272a] rounded-xl p-4 flex justify-center overflow-x-auto">
        <div 
          className="transition-all duration-300 border border-[#27272a] rounded-xl overflow-hidden shadow-2xl"
          style={{ 
            width: getPreviewWidth(),
            minWidth: viewMode === 'mobile' ? '375px' : viewMode === 'tablet' ? '768px' : '800px',
            fontFamily: `"${styles.font || 'Inter'}", sans-serif`,
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

          {/* Page Content */}
          <div 
            className="min-h-[600px] overflow-y-auto"
            style={{ 
              backgroundColor: styles.backgroundColor,
              backgroundImage: styles.backgroundGradient !== 'none' ? styles.backgroundGradient : undefined,
            }}
          >
            {landingPage.sections?.map(renderSection)}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hero Section Component
function HeroSection({ section, styles, borderRadius, spacing, email, setEmail }) {
  const isLeft = section.layout === 'left';
  const isSplit = section.layout === 'split';

  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className={`max-w-4xl mx-auto ${isLeft ? 'text-left' : 'text-center'}`}>
        {/* Badge */}
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

        {/* Headline */}
        <h1 
          className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight"
          style={{ color: styles.textColor }}
        >
          {section.headline || 'Your Headline Here'}
        </h1>

        {/* Subheadline */}
        <p 
          className={`text-lg md:text-xl mb-8 ${isLeft ? '' : 'max-w-2xl mx-auto'}`}
          style={{ color: styles.mutedColor }}
        >
          {section.subheadline}
        </p>

        {/* Email Form */}
        <div className={`${isLeft ? '' : 'max-w-md mx-auto'}`}>
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
              {section.ctaText || 'Join Waitlist'}
            </button>
          </div>
          {section.ctaSubtext && (
            <p className="text-sm mt-3" style={{ color: styles.mutedColor }}>
              {section.ctaSubtext}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Features Section Component
function FeaturesSection({ section, styles, borderRadius, spacing }) {
  const isGrid = section.layout === 'grid';
  const isList = section.layout === 'list';

  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>
            {section.headline}
          </h2>
          {section.subheadline && (
            <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>
          )}
        </div>

        <div className={`grid ${isGrid ? 'md:grid-cols-3' : 'md:grid-cols-1 max-w-2xl mx-auto'} gap-6`}>
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card} text-center`}
              style={{ 
                backgroundColor: styles.backgroundColor,
                border: `1px solid ${styles.borderColor}`,
              }}
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
    </div>
  );
}

// How It Works Section Component
function HowItWorksSection({ section, styles, borderRadius, spacing }) {
  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>
            {section.headline}
          </h2>
          {section.subheadline && (
            <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>
          )}
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
    </div>
  );
}

// Testimonials Section Component
function TestimonialsSection({ section, styles, borderRadius, spacing }) {
  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-5xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ color: styles.textColor }}>
          {section.headline}
        </h2>

        <div className="grid md:grid-cols-2 gap-6">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`p-6 ${borderRadius.card}`}
              style={{ 
                backgroundColor: styles.cardColor,
                border: `1px solid ${styles.borderColor}`,
              }}
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
    </div>
  );
}

// FAQ Section Component
function FAQSection({ section, styles, borderRadius, spacing }) {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.cardColor }}>
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center" style={{ color: styles.textColor }}>
          {section.headline}
        </h2>

        <div className="space-y-4">
          {(section.items || []).map((item, index) => (
            <div 
              key={index}
              className={`${borderRadius.card} overflow-hidden`}
              style={{ 
                backgroundColor: styles.backgroundColor,
                border: `1px solid ${styles.borderColor}`,
              }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-4 text-left flex justify-between items-center"
              >
                <span className="font-medium" style={{ color: styles.textColor }}>{item.question}</span>
                <span style={{ color: styles.mutedColor }}>{openIndex === index ? '−' : '+'}</span>
              </button>
              {openIndex === index && (
                <div className="px-4 pb-4" style={{ color: styles.mutedColor }}>
                  {item.answer}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pricing Section Component
function PricingSection({ section, styles, borderRadius, spacing }) {
  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>
            {section.headline}
          </h2>
          {section.subheadline && (
            <p className="text-lg" style={{ color: styles.mutedColor }}>{section.subheadline}</p>
          )}
        </div>

        <div className={`grid md:grid-cols-${Math.min(section.plans?.length || 2, 3)} gap-6 max-w-4xl mx-auto`}>
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
                className={`w-full py-3 ${borderRadius.button} font-bold`}
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
    </div>
  );
}

// CTA Section Component
function CTASection({ section, styles, borderRadius, spacing, email, setEmail }) {
  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: styles.textColor }}>
          {section.headline}
        </h2>
        {section.subheadline && (
          <p className="text-lg mb-8" style={{ color: styles.mutedColor }}>{section.subheadline}</p>
        )}

        {section.showEmail ? (
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
                className={`px-7 py-3.5 ${borderRadius.button} font-bold`}
                style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
              >
                {section.ctaText}
              </button>
            </div>
          </div>
        ) : (
          <button
            className={`px-8 py-4 ${borderRadius.button} font-bold text-lg`}
            style={{ backgroundColor: styles.primaryColor, color: styles.backgroundColor }}
          >
            {section.ctaText}
          </button>
        )}
      </div>
    </div>
  );
}

// Countdown Section Component
function CountdownSection({ section, styles, spacing }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTime = () => {
      const target = new Date(section.targetDate).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [section.targetDate]);

  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-8" style={{ color: styles.textColor }}>
          {section.headline}
        </h2>
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
    </div>
  );
}

// Video Section Component
function VideoSection({ section, styles, borderRadius, spacing }) {
  const getEmbedUrl = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com/watch')) {
      const id = url.split('v=')[1]?.split('&')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtu.be')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('vimeo.com')) {
      const id = url.split('vimeo.com/')[1]?.split('?')[0];
      return `https://player.vimeo.com/video/${id}`;
    }
    return url;
  };

  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-4xl mx-auto">
        {section.headline && (
          <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center" style={{ color: styles.textColor }}>
            {section.headline}
          </h2>
        )}
        <div 
          className={`aspect-video ${borderRadius.card} overflow-hidden`}
          style={{ backgroundColor: styles.cardColor }}
        >
          {section.videoUrl ? (
            <iframe
              src={getEmbedUrl(section.videoUrl)}
              className="w-full h-full"
              allowFullScreen
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ color: styles.mutedColor }}>
              <div className="text-center">
                <div className="text-4xl mb-2">🎬</div>
                <div>Add a video URL</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Logos Section Component
function LogosSection({ section, styles, spacing }) {
  return (
    <div className={`${spacing.section} ${spacing.container}`} style={{ backgroundColor: styles.backgroundColor }}>
      <div className="max-w-4xl mx-auto text-center">
        {section.headline && (
          <p className="text-sm font-medium mb-6" style={{ color: styles.mutedColor }}>
            {section.headline}
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-8 opacity-50">
          {['Company 1', 'Company 2', 'Company 3', 'Company 4'].map((name, i) => (
            <div 
              key={i} 
              className="px-6 py-3 rounded-lg"
              style={{ backgroundColor: styles.cardColor }}
            >
              <span style={{ color: styles.mutedColor }}>{name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Footer Section Component
function FooterSection({ section, styles, socialLinks }) {
  return (
    <div 
      className="py-8 px-6"
      style={{ borderTop: `1px solid ${styles.borderColor}`, backgroundColor: styles.backgroundColor }}
    >
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm" style={{ color: styles.mutedColor }}>
          {section.copyright}
        </p>

        {section.showSocial && socialLinks && (
          <div className="flex gap-4">
            {socialLinks.twitter && (
              <a href={socialLinks.twitter} target="_blank" rel="noopener" style={{ color: styles.mutedColor }}>
                𝕏
              </a>
            )}
            {socialLinks.github && (
              <a href={socialLinks.github} target="_blank" rel="noopener" style={{ color: styles.mutedColor }}>
                GitHub
              </a>
            )}
            {socialLinks.linkedin && (
              <a href={socialLinks.linkedin} target="_blank" rel="noopener" style={{ color: styles.mutedColor }}>
                LinkedIn
              </a>
            )}
          </div>
        )}

        <a 
          href="https://validateirl.com" 
          className="text-sm hover:opacity-80"
          style={{ color: styles.primaryColor }}
        >
          Built with ValidateIRL
        </a>
      </div>
    </div>
  );
}