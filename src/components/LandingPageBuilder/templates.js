// Landing page templates and default sections

export const FONTS = [
  { name: 'Inter', value: 'Inter', class: 'font-sans' },
  { name: 'Space Grotesk', value: 'Space Grotesk', class: 'font-space' },
  { name: 'DM Sans', value: 'DM Sans', class: 'font-dm' },
  { name: 'Poppins', value: 'Poppins', class: 'font-poppins' },
  { name: 'Outfit', value: 'Outfit', class: 'font-outfit' },
  { name: 'Sora', value: 'Sora', class: 'font-sora' },
];

export const COLOR_PRESETS = [
  { name: 'Emerald', primary: '#22c55e', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Ocean', primary: '#3b82f6', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Purple', primary: '#8b5cf6', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Rose', primary: '#f43f5e', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Orange', primary: '#f97316', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Cyan', primary: '#06b6d4', background: '#0a0a0b', card: '#161618', text: '#fafafa', muted: '#a1a1aa' },
  { name: 'Light Minimal', primary: '#18181b', background: '#ffffff', card: '#f4f4f5', text: '#18181b', muted: '#71717a' },
  { name: 'Light Blue', primary: '#2563eb', background: '#ffffff', card: '#f8fafc', text: '#0f172a', muted: '#64748b' },
  { name: 'Warm', primary: '#ea580c', background: '#fffbeb', card: '#fef3c7', text: '#78350f', muted: '#92400e' },
];

export const GRADIENTS = [
  { name: 'None', value: 'none' },
  { name: 'Subtle Glow', value: 'radial-gradient(ellipse at top, rgba(34,197,94,0.15) 0%, transparent 50%)' },
  { name: 'Top Fade', value: 'linear-gradient(to bottom, rgba(34,197,94,0.1) 0%, transparent 30%)' },
  { name: 'Mesh', value: 'radial-gradient(at 40% 20%, rgba(34,197,94,0.2) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(59,130,246,0.15) 0px, transparent 50%)' },
  { name: 'Aurora', value: 'linear-gradient(to right, rgba(34,197,94,0.1), rgba(59,130,246,0.1), rgba(139,92,246,0.1))' },
];

export const TEMPLATES = {
  startup: {
    name: 'Startup',
    description: 'Clean and modern, perfect for SaaS and tech products',
    preview: '🚀',
    defaultStyles: {
      font: 'Inter',
      primaryColor: '#22c55e',
      backgroundColor: '#0a0a0b',
      borderRadius: 'rounded',
    },
    sections: ['hero', 'features', 'howItWorks', 'cta', 'footer'],
  },
  minimal: {
    name: 'Minimal',
    description: 'Simple and elegant, focuses on the essentials',
    preview: '✨',
    defaultStyles: {
      font: 'DM Sans',
      primaryColor: '#18181b',
      backgroundColor: '#ffffff',
      borderRadius: 'rounded',
    },
    sections: ['hero', 'features', 'cta', 'footer'],
  },
  bold: {
    name: 'Bold',
    description: 'High contrast with strong visual impact',
    preview: '💪',
    defaultStyles: {
      font: 'Space Grotesk',
      primaryColor: '#f43f5e',
      backgroundColor: '#0a0a0b',
      borderRadius: 'sharp',
    },
    sections: ['hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'],
  },
  waitlist: {
    name: 'Waitlist',
    description: 'Pre-launch page with countdown and email capture',
    preview: '⏰',
    defaultStyles: {
      font: 'Outfit',
      primaryColor: '#8b5cf6',
      backgroundColor: '#0a0a0b',
      borderRadius: 'pill',
    },
    sections: ['hero', 'countdown', 'features', 'cta', 'footer'],
  },
  product: {
    name: 'Product',
    description: 'Full-featured with pricing and testimonials',
    preview: '📦',
    defaultStyles: {
      font: 'Poppins',
      primaryColor: '#3b82f6',
      backgroundColor: '#0a0a0b',
      borderRadius: 'rounded',
    },
    sections: ['hero', 'logos', 'features', 'howItWorks', 'testimonials', 'pricing', 'faq', 'cta', 'footer'],
  },
};

export const SECTION_TYPES = [
  { type: 'hero', name: 'Hero', icon: '🎯', description: 'Main headline and CTA' },
  { type: 'features', name: 'Features', icon: '✨', description: 'Feature grid or list' },
  { type: 'howItWorks', name: 'How It Works', icon: '📋', description: 'Step by step process' },
  { type: 'testimonials', name: 'Testimonials', icon: '💬', description: 'Customer quotes' },
  { type: 'pricing', name: 'Pricing', icon: '💰', description: 'Pricing plans' },
  { type: 'faq', name: 'FAQ', icon: '❓', description: 'Common questions' },
  { type: 'cta', name: 'CTA', icon: '🚀', description: 'Call to action section' },
  { type: 'countdown', name: 'Countdown', icon: '⏰', description: 'Launch countdown timer' },
  { type: 'video', name: 'Video', icon: '🎬', description: 'Embedded video' },
  { type: 'logos', name: 'Logo Cloud', icon: '🏢', description: 'Trusted by logos' },
  { type: 'footer', name: 'Footer', icon: '📍', description: 'Page footer' },
];

export const DEFAULT_SECTIONS = [
  {
    id: 'hero-default',
    type: 'hero',
    visible: true,
    layout: 'centered',
    headline: 'Your Headline Here',
    subheadline: 'Describe your value proposition in one or two sentences.',
    ctaText: 'Join Waitlist',
    ctaSubtext: 'No spam, unsubscribe anytime',
    showImage: false,
    image: null,
    showBadge: true,
    badge: '🚀 Coming Soon',
  },
  {
    id: 'features-default',
    type: 'features',
    visible: true,
    layout: 'grid',
    headline: 'Why Choose Us',
    subheadline: 'Everything you need to validate your idea',
    items: [
      { icon: '⚡', title: 'Fast', description: 'Get results in minutes, not weeks' },
      { icon: '🎯', title: 'Targeted', description: 'Find your ideal customers' },
      { icon: '📊', title: 'Data-Driven', description: 'Make decisions based on real signals' },
    ],
  },
  {
    id: 'cta-default',
    type: 'cta',
    visible: true,
    headline: 'Ready to Get Started?',
    subheadline: 'Join the waitlist and be the first to know when we launch.',
    ctaText: 'Join Waitlist',
    showEmail: true,
  },
  {
    id: 'footer-default',
    type: 'footer',
    visible: true,
    showSocial: true,
    copyright: '© 2025 All rights reserved.',
    links: [],
  },
];