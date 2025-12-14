import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(request) {
  try {
    const { projectName, projectPain, targetAudience } = await request.json();

    const prompt = `You are a landing page copywriter. Generate compelling copy for a landing page based on this startup idea:

Project Name: ${projectName}
Pain/Problem: ${projectPain}
Target Audience: ${targetAudience || 'Not specified'}

Generate the following in JSON format:
{
  "headline": "A compelling headline (max 10 words) that speaks to the pain",
  "subheadline": "A 1-2 sentence value proposition explaining the benefit",
  "painPoints": ["Benefit 1 (short, punchy)", "Benefit 2 (short, punchy)", "Benefit 3 (short, punchy)"],
  "ctaText": "CTA button text (2-4 words)",
  "ctaSubtext": "Text below button (reassurance, e.g., 'No spam, unsubscribe anytime')",
  "socialProof": "Social proof text (e.g., 'Join 100+ founders already validating')"
}

Guidelines:
- Headline should be benefit-focused and create urgency
- Subheadline should explain what the product does in simple terms
- Pain points should be specific benefits, not generic features
- CTA should be action-oriented
- Keep everything concise and punchy

Return ONLY valid JSON, no other text.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract text content
    const textContent = message.content.find(block => block.type === 'text');
    if (!textContent) {
      throw new Error('No text content in response');
    }

    // Parse JSON from response
    let landingPageData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        landingPageData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Return default values if parsing fails
      landingPageData = {
        headline: `Stop struggling with ${projectPain?.slice(0, 30) || 'this problem'}`,
        subheadline: `${projectName} helps you solve this pain point once and for all.`,
        painPoints: [
          'Save hours every week',
          'Simple and intuitive',
          'Built for people like you',
        ],
        ctaText: 'Join Waitlist',
        ctaSubtext: 'Be the first to know when we launch',
        socialProof: 'Join founders already waiting',
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