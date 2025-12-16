import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const TEMPLATE_SECTIONS = {
  startup: ['hero', 'features', 'howItWorks', 'cta', 'footer'],
  minimal: ['hero', 'features', 'cta', 'footer'],
  bold: ['hero', 'features', 'testimonials', 'pricing', 'cta', 'footer'],
  waitlist: ['hero', 'countdown', 'features', 'cta', 'footer'],
  product: ['hero', 'logos', 'features', 'howItWorks', 'testimonials', 'pricing', 'faq', 'cta', 'footer'],
};

export async function POST(request) {
  try {
    const { projectName, projectPain, targetAudience, template = 'startup' } = await request.json();

    const sectionsToGenerate = TEMPLATE_SECTIONS[template] || TEMPLATE_SECTIONS.startup;

    const prompt = `You are an expert landing page copywriter. Generate compelling, conversion-focused copy for a landing page.

PROJECT DETAILS:
- Name: ${projectName}
- Pain/Problem: ${projectPain}
- Target Audience: ${targetAudience || 'Not specified'}
- Template: ${template}

Generate content for these sections: ${sectionsToGenerate.join(', ')}

Return a JSON object with a "sections" array. Each section should match this structure based on its type:

{
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "visible": true,
      "layout": "centered",
      "headline": "Compelling headline (max 8 words)",
      "subheadline": "Value proposition in 1-2 sentences",
      "ctaText": "Action button text (2-3 words)",
      "ctaSubtext": "Reassurance text",
      "showBadge": true,
      "badge": "🚀 Launching Soon"
    },
    {
      "id": "features-1",
      "type": "features",
      "visible": true,
      "layout": "grid",
      "headline": "Section title",
      "subheadline": "Section description",
      "items": [
        { "icon": "⚡", "title": "Feature Name", "description": "Short description" },
        { "icon": "🎯", "title": "Feature Name", "description": "Short description" },
        { "icon": "🔒", "title": "Feature Name", "description": "Short description" }
      ]
    },
    {
      "id": "howItWorks-1",
      "type": "howItWorks",
      "visible": true,
      "headline": "How It Works",
      "subheadline": "Get started in 3 easy steps",
      "steps": [
        { "number": "1", "title": "Step title", "description": "Step description" },
        { "number": "2", "title": "Step title", "description": "Step description" },
        { "number": "3", "title": "Step title", "description": "Step description" }
      ]
    },
    {
      "id": "testimonials-1",
      "type": "testimonials",
      "visible": true,
      "headline": "What People Say",
      "items": [
        { "quote": "Testimonial quote", "author": "Name", "role": "Role, Company" }
      ]
    },
    {
      "id": "faq-1",
      "type": "faq",
      "visible": true,
      "headline": "Frequently Asked Questions",
      "items": [
        { "question": "Question?", "answer": "Answer." }
      ]
    },
    {
      "id": "pricing-1",
      "type": "pricing",
      "visible": true,
      "headline": "Simple Pricing",
      "subheadline": "Choose your plan",
      "plans": [
        { "name": "Free", "price": "$0", "period": "/month", "features": ["Feature 1", "Feature 2"], "cta": "Get Started", "highlighted": false },
        { "name": "Pro", "price": "$29", "period": "/month", "features": ["Everything in Free", "Feature 3"], "cta": "Start Trial", "highlighted": true }
      ]
    },
    {
      "id": "cta-1",
      "type": "cta",
      "visible": true,
      "headline": "Ready to Get Started?",
      "subheadline": "Join the waitlist today",
      "ctaText": "Join Waitlist",
      "showEmail": true
    },
    {
      "id": "countdown-1",
      "type": "countdown",
      "visible": true,
      "headline": "Launching Soon",
      "targetDate": "${new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()}"
    },
    {
      "id": "logos-1",
      "type": "logos",
      "visible": true,
      "headline": "Trusted By"
    },
    {
      "id": "footer-1",
      "type": "footer",
      "visible": true,
      "showSocial": true,
      "copyright": "© 2025 ${projectName}. All rights reserved."
    }
  ],
  "meta": {
    "title": "${projectName} - Brief tagline",
    "description": "Meta description for SEO"
  }
}

GUIDELINES:
- Headlines should be benefit-focused, creating urgency or curiosity
- Use specific numbers and outcomes when possible
- Features should address real pain points
- FAQ should answer common objections
- Keep everything concise and scannable
- Use relevant emojis for icons (⚡🎯🔒💡🚀✨🔥💪🎨📊)
- Make testimonials sound authentic (for waitlist pages, phrase as anticipation)

Only generate the sections specified: ${sectionsToGenerate.join(', ')}
Return ONLY valid JSON, no markdown or other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in response');
    }

    let landingPageData;
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        landingPageData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Return default content if parsing fails
      landingPageData = {
        sections: generateDefaultSections(projectName, projectPain, sectionsToGenerate),
        meta: {
          title: projectName,
          description: projectPain,
        },
      };
    }

    return NextResponse.json(landingPageData);
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate landing page' },
      { status: 500 }
    );
  }
}

function generateDefaultSections(projectName, projectPain, sectionTypes) {
  const sections = [];
  
  sectionTypes.forEach((type, index) => {
    const id = `${type}-${Date.now()}-${index}`;
    
    switch (type) {
      case 'hero':
        sections.push({
          id,
          type: 'hero',
          visible: true,
          layout: 'centered',
          headline: `Stop struggling with ${projectPain?.slice(0, 30) || 'this problem'}`,
          subheadline: `${projectName} helps you solve this once and for all.`,
          ctaText: 'Join Waitlist',
          ctaSubtext: 'No spam, unsubscribe anytime',
          showBadge: true,
          badge: '🚀 Coming Soon',
        });
        break;
      case 'features':
        sections.push({
          id,
          type: 'features',
          visible: true,
          layout: 'grid',
          headline: 'Why Choose Us',
          subheadline: 'Everything you need to succeed',
          items: [
            { icon: '⚡', title: 'Fast', description: 'Get results in minutes, not weeks' },
            { icon: '🎯', title: 'Targeted', description: 'Focus on what matters most' },
            { icon: '🔒', title: 'Reliable', description: 'Built to work every time' },
          ],
        });
        break;
      case 'howItWorks':
        sections.push({
          id,
          type: 'howItWorks',
          visible: true,
          headline: 'How It Works',
          subheadline: 'Get started in 3 easy steps',
          steps: [
            { number: '1', title: 'Sign Up', description: 'Create your free account' },
            { number: '2', title: 'Configure', description: 'Set up your preferences' },
            { number: '3', title: 'Launch', description: 'Go live in minutes' },
          ],
        });
        break;
      case 'testimonials':
        sections.push({
          id,
          type: 'testimonials',
          visible: true,
          headline: 'What People Say',
          items: [
            { quote: "Can't wait to try this!", author: 'Early User', role: 'Founder' },
            { quote: 'Finally, a solution that makes sense.', author: 'Beta Tester', role: 'Developer' },
          ],
        });
        break;
      case 'faq':
        sections.push({
          id,
          type: 'faq',
          visible: true,
          headline: 'Frequently Asked Questions',
          items: [
            { question: 'When will this launch?', answer: 'We\'re launching soon! Join the waitlist to be notified.' },
            { question: 'Is there a free tier?', answer: 'Yes, we\'ll have a generous free tier for everyone.' },
            { question: 'How do I get support?', answer: 'Email us anytime and we\'ll get back to you within 24 hours.' },
          ],
        });
        break;
      case 'pricing':
        sections.push({
          id,
          type: 'pricing',
          visible: true,
          headline: 'Simple Pricing',
          subheadline: 'Choose the plan that works for you',
          plans: [
            { name: 'Free', price: '$0', period: '/month', features: ['Basic features', 'Community support'], cta: 'Get Started', highlighted: false },
            { name: 'Pro', price: '$29', period: '/month', features: ['Everything in Free', 'Priority support', 'Advanced features'], cta: 'Start Trial', highlighted: true },
          ],
        });
        break;
      case 'cta':
        sections.push({
          id,
          type: 'cta',
          visible: true,
          headline: 'Ready to Get Started?',
          subheadline: 'Join the waitlist and be the first to know.',
          ctaText: 'Join Waitlist',
          showEmail: true,
        });
        break;
      case 'countdown':
        sections.push({
          id,
          type: 'countdown',
          visible: true,
          headline: 'Launching Soon',
          targetDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;
      case 'logos':
        sections.push({
          id,
          type: 'logos',
          visible: true,
          headline: 'Trusted By',
        });
        break;
      case 'footer':
        sections.push({
          id,
          type: 'footer',
          visible: true,
          showSocial: true,
          copyright: `© ${new Date().getFullYear()} ${projectName}. All rights reserved.`,
        });
        break;
    }
  });
  
  return sections;
}