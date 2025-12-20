'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function EmbedCodePanel({ projectId, projectName }) {
  const [copied, setCopied] = useState(null);
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [buttonText, setButtonText] = useState('Join Waitlist');
  const [placeholder, setPlaceholder] = useState('Enter your email');
  const [successMessage, setSuccessMessage] = useState("You're on the list! 🎉");

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://validateirl.com';

  useEffect(() => {
    fetchSignups();
    
    // Poll for new signups every 30 seconds
    const interval = setInterval(fetchSignups, 30000);
    return () => clearInterval(interval);
  }, [projectId]);

  const fetchSignups = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_signups')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSignups(data || []);
    } catch (error) {
      console.error('Error fetching signups:', error);
    } finally {
      setLoading(false);
    }
  };

  const embedCode = `<!-- ValidateIRL Signup Form -->
<div id="validateirl-form"
  data-theme="${theme}"
  data-button-text="${buttonText}"
  data-placeholder="${placeholder}"
  data-success="${successMessage}">
</div>
<script src="${baseUrl}/api/embed/${projectId}"></script>`;

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const signupCount = signups.length;
  const embedSignups = signups.filter(s => s.source === 'embed');

  return (
    <div className="space-y-6">
      {/* Header with stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Embed Signup Form</h2>
          <p className="text-sm text-[#a1a1aa]">Add this to your existing website</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-[#22c55e]">{signupCount}</div>
            <div className="text-xs text-[#71717a]">total signups</div>
          </div>
          {signupCount >= 5 ? (
            <span className="px-3 py-1 rounded-full bg-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
              ✓ Validated
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-[#27272a] text-[#71717a] text-sm">
              {signupCount}/5 to unlock roadmap
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-[#a1a1aa]">Progress to launch roadmap</span>
          <span className="text-[#22c55e] font-medium">{Math.min(signupCount, 5)}/5</span>
        </div>
        <div className="h-2 bg-[#27272a] rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-[#22c55e] to-[#16a34a] rounded-full transition-all duration-500"
            style={{ width: `${Math.min((signupCount / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Customization */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
        <h3 className="font-semibold mb-4">Customize your form</h3>
        
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Theme</label>
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm"
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Button text</label>
            <input
              type="text"
              value={buttonText}
              onChange={(e) => setButtonText(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Placeholder</label>
            <input
              type="text"
              value={placeholder}
              onChange={(e) => setPlaceholder(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-sm text-[#a1a1aa] mb-1">Success message</label>
            <input
              type="text"
              value={successMessage}
              onChange={(e) => setSuccessMessage(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Embed code */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Embed code</h3>
          <button
            onClick={() => copyToClipboard(embedCode, 'embed')}
            className="px-3 py-1.5 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] text-sm font-medium transition-colors"
          >
            {copied === 'embed' ? 'Copied!' : 'Copy code'}
          </button>
        </div>
        
        <pre className="bg-[#0a0a0b] border border-[#27272a] rounded-lg p-4 overflow-x-auto text-sm text-[#a1a1aa]">
          <code>{embedCode}</code>
        </pre>

        <div className="mt-4 p-4 bg-[#0a0a0b] border border-[#27272a] rounded-lg">
          <h4 className="text-sm font-medium mb-2">How to use:</h4>
          <ol className="text-sm text-[#a1a1aa] space-y-1 list-decimal list-inside">
            <li>Copy the code above</li>
            <li>Paste it where you want the form to appear on your website</li>
            <li>That's it! Signups will automatically appear here</li>
          </ol>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl p-5">
        <h3 className="font-semibold mb-4">Preview</h3>
        <div className={`p-6 rounded-lg ${theme === 'dark' ? 'bg-[#0a0a0b]' : 'bg-white'}`}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder={placeholder}
              disabled
              className={`flex-1 min-w-[200px] px-4 py-3 rounded-lg border text-sm ${
                theme === 'dark' 
                  ? 'border-[#333] bg-[#1a1a1a] text-white placeholder-[#666]' 
                  : 'border-[#ddd] bg-white text-black placeholder-[#999]'
              }`}
            />
            <button
              disabled
              className="px-6 py-3 rounded-lg bg-[#22c55e] text-black font-semibold text-sm"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-[#161618] border border-[#27272a] rounded-xl">
        <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
          <h3 className="font-semibold">Recent Signups</h3>
          <button
            onClick={fetchSignups}
            className="text-sm text-[#71717a] hover:text-white transition-colors"
          >
            Refresh
          </button>
        </div>
        
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-[#22c55e] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : signups.length === 0 ? (
          <div className="p-8 text-center text-[#71717a]">
            <p>No signups yet. Add the embed code to your site!</p>
          </div>
        ) : (
          <div className="divide-y divide-[#27272a]">
            {signups.slice(0, 10).map((signup) => (
              <div key={signup.id} className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{signup.email}</p>
                  <p className="text-xs text-[#71717a]">
                    {new Date(signup.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  signup.source === 'embed' 
                    ? 'bg-blue-500/20 text-blue-400' 
                    : 'bg-[#27272a] text-[#71717a]'
                }`}>
                  {signup.source === 'embed' ? 'Embed' : 'Direct'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}