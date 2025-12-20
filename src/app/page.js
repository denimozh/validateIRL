'use client';

import { useState } from 'react';

export default function LandingPage() {
  const comparisonRows = [
    ['AI-generated market research', 'Links to real posts (reddit, Hackerank, etc..)'],
    ['"Your TAM is $4.2B"', '"Here are 17 people who complained about this"'],
    ['Broadcast content and hope', 'Direct conversations with real humans'],
    ['Validation OR distribution', 'Validation → Distribution (connected)'],
    ['Vanity metrics (views, karma)', 'Real metrics (replies, "I\'d pay" signals)'],
    ['One-time use', 'Daily reason to return (new leads)'],
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-[#fafafa]">

      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-[#27272a]">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <a href="#" className="flex items-center gap-2 font-bold text-xl">
            <img src="logo.svg" alt="ValidateIRL Logo" className="w-8 h-8 rounded-lg object-cover" />
            ValidateIRL
          </a>

          <div className="flex items-center gap-4">
            <a href="/signin" className="text-[#a1a1aa] hover:text-white transition-colors text-sm">
              Sign in
            </a>
            <a
              href="#pricing"
              className="bg-gradient-to-r hover:bg-green-700 hover:cursor-pointer from-[#22c55e] to-[#16a34a] text-[#0a0a0b] px-5 py-2.5 rounded-full font-semibold text-sm hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all"
            >
              Get Started
            </a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col justify-center items-center text-center px-6 pt-32 pb-16 relative overflow-hidden">
        <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.3)_0%,transparent_70%)] opacity-50 pointer-events-none" />

        <div className="inline-flex items-center gap-2 bg-[#161618] border border-[#27272a] px-4 py-2 rounded-full text-sm text-[#a1a1aa] mb-8">
          <span className="w-2 h-2 bg-[#22c55e] rounded-full animate-pulse" />
          Now Live — Start validating today
        </div>

        <h1 className="text-2xl md:text-3xl text-slate-300 lg:text-5xl font-extrabold leading-[1.1] mb-6 max-w-4xl">
          Find real people who want what you&apos;re building
        </h1>
        <h1 className="bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-6xl font-extrabold leading-[1.1] mb-6 max-w-4xl bg-clip-text text-transparent pt-4">
          And launch directly to them
        </h1>

        <p className="text-lg md:text-xl text-[#a1a1aa] max-w-2xl mb-10 pt-2">
          Stop validating with AI fluff. Get links to real humans expressing your pain, reach out to them,
          and launch to people who already said yes.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <a
            href="#pricing"
            className="px-8 py-4 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#0a0a0b] font-bold text-lg hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all"
          >
            Start Validating — $15/mo
          </a>
          <a
            href="#how-it-works"
            className="px-8 py-4 rounded-full border border-[#27272a] text-white font-semibold hover:bg-[#161618] transition-all"
          >
            See How It Works
          </a>
        </div>

        {/* Social proof */}
        <p className="text-sm text-[#71717a] mt-6">
          Join founders who validate before they build
        </p>
      </section>

      {/* Problem Section */}
      <section className="py-24 px-6 bg-[#111113] relative">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#27272a] to-transparent" />
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
            The Problem
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Founders fail in two predictable ways
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🔨', title: 'Build without validating', desc: "You spend months building something perfect. Ship it. Crickets. Nobody wanted it because you never asked if they would pay." },
              { icon: '📋', title: "Validate but can't distribute", desc: "You talk to people. They seem interested. Then launch day comes and you can't find them. No list. No system. Starting from zero." },
              { icon: '🤖', title: 'Trust AI market research', desc: '"Your TAM is $4.2B" - cool, completely useless. AI validation tools give you fake confidence with made-up data.' },
            ].map((problem, i) => (
              <div key={i} className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 relative overflow-hidden hover:border-red-500/30 hover:-translate-y-1 transition-all group">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-red-500 to-red-400" />
                <div className="text-3xl mb-4">{problem.icon}</div>
                <h3 className="text-xl font-bold mb-3 text-red-400">{problem.title}</h3>
                <p className="text-[#a1a1aa]">{problem.desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 mt-8 flex flex-col sm:flex-row items-start gap-6">
            <div className="text-4xl">👋</div>
            <div>
              <h4 className="font-bold text-lg mb-2">I made all three mistakes.</h4>
              <p className="text-[#a1a1aa]">
                Spent <span className="text-[#22c55e] font-semibold">35 days building a SaaS</span>. Auth, webhooks, SSL automation — the works. Shipped it. Result: <span className="text-[#22c55e] font-semibold">2 signups. $0 revenue.</span> Never again.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="how-it-works" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
            The Solution
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-16">
            Validation → Distribution. One system.
          </h2>

          {/* Phase 1 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12 border-b border-[#27272a]">
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-xl flex items-center justify-center font-extrabold text-lg text-[#0a0a0b] mb-6">
                1
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Validate</h3>
              <p className="text-[#a1a1aa] mb-6">
                Find real humans expressing your specific pain. Not AI-generated personas. Actual Reddit posts from the last 30 days with links you can click and verify.
              </p>
              <ul className="space-y-3 text-[#a1a1aa]">
                {['Search by pain, not keywords', 'Intent scoring (HIGH/MEDIUM/LOW)', 'Direct links to real posts', 'Reply templates that start conversations', 'Track: contacted → replied → "I\'d pay"'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#22c55e] font-semibold">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
              <div className="bg-[#111113] rounded-xl p-5 border border-[#27272a]">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="flex gap-2 mb-4">
                  <input type="text" value="frustrated with expense tracking" disabled className="flex-1 px-4 py-2.5 rounded-lg border border-[#27272a] bg-[#161618] text-[#71717a] text-sm" />
                  <button className="px-4 py-2.5 rounded-lg bg-[#22c55e] text-[#0a0a0b] font-semibold text-sm">Search</button>
                </div>
                <div className="space-y-3">
                  <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[#22c55e] font-semibold">r/smallbusiness</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] font-semibold">HIGH INTENT</span>
                    </div>
                    <p className="text-sm text-[#a1a1aa]">&quot;I wish there was something simpler than QuickBooks. I&apos;d pay $50/mo for something that just works...&quot;</p>
                  </div>
                  <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-[#22c55e] font-semibold">r/Entrepreneur</span>
                      <span className="text-[10px] px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-500 font-semibold">MEDIUM</span>
                    </div>
                    <p className="text-sm text-[#a1a1aa]">&quot;Anyone else struggle with categorizing expenses? Spent 2 hours last night on this...&quot;</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12 border-b border-[#27272a]">
            <div className="order-2 lg:order-1 bg-[#161618] border border-[#27272a] rounded-2xl p-6">
              <div className="bg-[#111113] rounded-xl p-5 border border-[#27272a]">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[{ value: '12', label: 'Contacted' }, { value: '5', label: 'Replied' }, { value: '3', label: '"I\'d Pay"' }].map((stat, i) => (
                    <div key={i} className="bg-[#161618] border border-[#27272a] rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-[#22c55e]">{stat.value}</div>
                      <div className="text-[10px] text-[#71717a] uppercase tracking-wide">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="bg-[#161618] border border-[#27272a] rounded-lg p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-semibold">Validation Progress</span>
                    <span className="text-sm text-[#22c55e] font-semibold">3/3 signals ✓</span>
                  </div>
                  <div className="h-2 bg-[#111113] rounded-full overflow-hidden">
                    <div className="h-full w-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="w-12 h-12 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-xl flex items-center justify-center font-extrabold text-lg text-[#0a0a0b] mb-6">
                2
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Track Your Proof</h3>
              <p className="text-[#a1a1aa] mb-6">
                Your validation data becomes your launch list. Everyone who showed interest is tracked and tagged. Know exactly when you have enough proof to build.
              </p>
              <ul className="space-y-3 text-[#a1a1aa]">
                {['Dashboard of all outreach', 'Status tracking per person', 'Notes on each conversation', '"I\'d pay" signal counter', 'Clear threshold: 3+ signals = validated'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#22c55e] font-semibold">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="grid lg:grid-cols-2 gap-12 items-center py-12">
            <div>
              <div className="w-12 h-12 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-xl flex items-center justify-center font-extrabold text-lg text-[#0a0a0b] mb-6">
                3
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Distribute</h3>
              <p className="text-[#a1a1aa] mb-6">
                Launch to people who already said yes. Your validation data transforms into a personalized launch playbook based on where your proof came from.
              </p>
              <ul className="space-y-3 text-[#a1a1aa]">
                {['Hot leads from validation ready to contact', 'Personalized 14-day launch plan', 'Pain monitoring finds new leads daily', 'Track posts → clicks → signups → revenue', 'Know exactly what\'s working'].map((item, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="text-[#22c55e] font-semibold">→</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#161618] border border-[#27272a] rounded-2xl p-6">
              <div className="bg-[#111113] rounded-xl p-5 border border-[#27272a]">
                <div className="flex gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
                <div className="space-y-3">
                  {[
                    { day: 'D1', title: 'DM your "I\'d pay" leads', desc: '3 warm contacts ready', done: true },
                    { day: 'D2', title: 'Post in r/smallbusiness', desc: 'Your strongest validated community', done: false },
                    { day: 'D3', title: 'Reply to 5 new pain posts', desc: 'Fresh leads found today', done: false },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 bg-[#161618] border border-[#27272a] rounded-lg p-4">
                      <div className="w-10 h-10 bg-[#111113] rounded-lg flex items-center justify-center font-bold text-sm">
                        {item.day}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold">{item.title}</div>
                        <div className="text-xs text-[#71717a]">{item.desc}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-xs ${item.done ? 'bg-[#22c55e] border-[#22c55e] text-[#0a0a0b]' : 'border-[#27272a]'}`}>
                        {item.done && '✓'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* COMPARISON SECTION */}
      <section className="py-24 px-6 bg-[#111113]">
        <div className="max-w-4xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
            Why ValidateIRL?
          </span>

          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Real validation vs. fake confidence
          </h2>

          <div className="border border-[#27272a] rounded-2xl overflow-hidden">
            <div className="grid grid-cols-2 bg-[#161618]">
              <div className="p-5 border-r border-b border-[#27272a] font-bold text-[#71717a]">
                Other Tools
              </div>
              <div className="p-5 border-b border-[#27272a] font-bold text-[#22c55e]">
                ValidateIRL
              </div>
            </div>

            {comparisonRows.map((row, i) => {
              const other = row[0];
              const ours = row[1];

              return (
                <div key={i} className="grid grid-cols-2">
                  <div
                    className={`p-5 border-r border-[#27272a] text-[#71717a] ${
                      i < comparisonRows.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {other}
                  </div>
                  <div
                    className={`p-5 ${
                      i < comparisonRows.length - 1 ? 'border-b border-[#27272a]' : ''
                    }`}
                  >
                    {ours}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS STEPS */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            From idea to customers in 4 steps
          </h2>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: '💡', title: 'Describe your pain', desc: 'Tell us your idea and who you think has this problem' },
              { icon: '🔍', title: 'Find real people', desc: 'Get 15-20 Reddit posts from people expressing this pain' },
              { icon: '💬', title: 'Start conversations', desc: "Reach out with templates, track who's interested" },
              { icon: '🚀', title: 'Launch to them', desc: 'Hit 3+ "I\'d pay" signals, then launch to your validated list' },
            ].map((step, i) => (
              <div key={i} className="bg-[#161618] border border-[#27272a] rounded-2xl p-8 text-center relative hover:border-[#22c55e] hover:-translate-y-1 transition-all">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-gradient-to-br from-[#22c55e] to-[#16a34a] rounded-full flex items-center justify-center font-extrabold text-sm text-[#0a0a0b]">
                  {i + 1}
                </div>
                <div className="text-4xl mb-4 mt-2">{step.icon}</div>
                <h4 className="font-bold mb-2">{step.title}</h4>
                <p className="text-sm text-[#a1a1aa]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOUNDER STORY */}
      <section className="py-24 px-6 bg-[#111113]">
        <div className="max-w-6xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
            The Story
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-12">
            Why I&apos;m building this
          </h2>

          <div className="grid lg:grid-cols-[300px_1fr] gap-12 items-start">
            <div className="relative mx-auto lg:mx-0">
              <div className="w-64 h-64 bg-[#161618] border border-[#27272a] rounded-3xl flex items-center justify-center">
                <img src="founder.jpg" alt="Founder" className="w-full h-full object-cover rounded-3xl" />
              </div>
              <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#0a0a0b] px-4 py-2 rounded-full font-bold text-sm">
                Building in public
              </span>
            </div>
            <div className="text-center lg:text-left">
              <h3 className="text-2xl md:text-3xl font-bold mb-6">Hey, I&apos;m Denis</h3>
              <p className="text-lg text-[#a1a1aa] mb-6 leading-relaxed">
                A few months ago, I spent <span className="text-white font-semibold">35 days building a SaaS</span>. I called it DomainFlow — &quot;Stripe for custom domains.&quot; I built auth, webhooks, SSL automation, billing, the works.
              </p>
              <p className="text-lg text-[#a1a1aa] mb-6 leading-relaxed">
                Result: <span className="text-white font-semibold">2 signups. $0 revenue.</span>
              </p>

              <div className="bg-[#161618] border border-[#27272a] border-l-4 border-l-[#22c55e] rounded-r-xl p-6 my-8">
                <p className="text-[#a1a1aa] italic">
                  &quot;The problem wasn&apos;t the product. The problem was that I never validated. I fell in love with building and skipped talking to real people.&quot;
                </p>
              </div>

              <p className="text-lg text-[#a1a1aa] mb-6 leading-relaxed">
                I realized most validation tools are useless. They give you <span className="text-white font-semibold">AI-generated market research</span> and tell you your &quot;TAM is $4.2B.&quot; None of that tells you if a real human will pay.
              </p>
              <p className="text-lg text-[#a1a1aa] mb-8 leading-relaxed">
                So I built what I wish I had: A tool that finds <span className="text-white font-semibold">real people</span> expressing your pain, helps you talk to them, tracks who&apos;s interested, and turns that into a launch list.
              </p>
              <p className="text-lg font-semibold">
                This time: validate first, then build.
              </p>

              <div className="flex gap-8 mt-8 justify-center lg:justify-start">
                {[{ value: '35', label: 'Days wasted' }, { value: '$0', label: 'Revenue' }, { value: '2', label: 'Signups' }].map((stat, i) => (
                  <div key={i} className="text-center">
                    <div className="text-3xl font-extrabold text-red-400">{stat.value}</div>
                    <div className="text-sm text-[#71717a]">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="py-32 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block">
              Pricing
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold mb-4">
              Stop building blind
            </h2>
            <p className="text-xl text-[#a1a1aa]">
              One simple price. Everything you need to validate your next idea.
            </p>
          </div>

          {/* Pricing Card */}
          <div className="max-w-md mx-auto">
            <div className="bg-[#161618] border-2 border-[#22c55e] rounded-3xl p-8 relative overflow-hidden">
              {/* Glow effect */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[200px] bg-[radial-gradient(ellipse_at_center,rgba(34,197,94,0.2)_0%,transparent_70%)] pointer-events-none" />
              
              <div className="text-center mb-8 relative">
                <h3 className="text-2xl font-bold mb-2">ValidateIRL Pro</h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-5xl font-extrabold text-[#22c55e]">$15</span>
                  <span className="text-[#71717a]">/month</span>
                </div>
                <p className="text-sm text-[#a1a1aa] mt-2">Cancel anytime</p>
              </div>

              {/* Features */}
              <div className="space-y-4 mb-8">
                {[
                  'Unlimited projects',
                  'AI-powered signal discovery',
                  'Intent scoring (HIGH/MEDIUM/LOW)',
                  'Outreach pipeline & tracking',
                  'Reply templates',
                  'Landing page builder',
                  'Tracked links & analytics',
                  'Personalized launch roadmap',
                  'CSV export',
                ].map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-[#22c55e]/20 flex items-center justify-center flex-shrink-0">
                      <svg className="w-3 h-3 text-[#22c55e]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-[#a1a1aa]">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA Button */}
              <a
                href="/signup"
                className="block w-full py-4 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#0a0a0b] font-bold text-lg text-center hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all"
              >
                Get Started Now
              </a>

              <p className="text-center text-sm text-[#71717a] mt-4">
                Instant access. No credit card required to start.
              </p>
            </div>
          </div>

          {/* Money back guarantee */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#161618] border border-[#27272a]">
              <span className="text-lg">🛡️</span>
              <span className="text-sm text-[#a1a1aa]">30-day money-back guarantee. No questions asked.</span>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ SECTION */}
      <section className="py-24 px-6 bg-[#111113]">
        <div className="max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#22c55e] mb-4 block text-center">
            FAQ
          </span>
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Common questions
          </h2>

          <div className="space-y-4">
            {[
              {
                q: 'How does ValidateIRL find signals?',
                a: 'We use AI to search Reddit and other platforms for posts where people express real pain points matching your idea. You get direct links to real posts from real people — not AI-generated personas.',
              },
              {
                q: 'What counts as a validated idea?',
                a: 'We recommend getting at least 3 "I\'d pay" signals — real people saying they would pay for your solution. This is the clearest indicator of demand before you build.',
              },
              {
                q: 'Can I cancel anytime?',
                a: 'Yes. Cancel anytime with one click. No questions asked. We also offer a 30-day money-back guarantee if you\'re not satisfied.',
              },
              {
                q: 'What platforms do you search?',
                a: 'Currently we focus on Reddit, which is the richest source of authentic pain points and discussions. More platforms coming soon.',
              },
              {
                q: 'Do I need to know how to code?',
                a: 'No. ValidateIRL is a no-code tool. You describe your idea, find people expressing the pain, reach out to them, and track their responses. No technical skills required.',
              },
            ].map((item, i) => (
              <div key={i} className="bg-[#161618] border border-[#27272a] rounded-xl p-6">
                <h4 className="font-semibold mb-2">{item.q}</h4>
                <p className="text-[#a1a1aa] text-sm">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Ready to validate your idea?
          </h2>
          <p className="text-xl text-[#a1a1aa] mb-8">
            Stop guessing. Start with real people who want what you&apos;re building.
          </p>
          <a
            href="/signup"
            className="inline-block px-10 py-4 rounded-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] text-[#0a0a0b] font-bold text-lg hover:-translate-y-0.5 hover:shadow-[0_10px_40px_rgba(34,197,94,0.3)] transition-all"
          >
            Get Started — $15/month
          </a>
          <p className="text-sm text-[#71717a] mt-4">
            30-day money-back guarantee
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-[#27272a] text-center">
        <p className="text-[#71717a] mb-4">
          Built by denimozh after wasting 35 days on a failed SaaS.<br />
          This time: validate first, then build.
        </p>

        <a
          href="https://twitter.com/denimozh_uk"
          target="_blank"
          className="text-[#a1a1aa] hover:text-[#22c55e]"
        >
          Follow the journey →
        </a>
      </footer>
    </div>
  );
}