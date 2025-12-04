'use client';

import { useState } from 'react';

export default function NewProjectModal({ isOpen, onClose, onSubmit }) {
  const [name, setName] = useState('');
  const [painDescription, setPainDescription] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    setLoading(true);

    try {
      await onSubmit({ name, painDescription, targetAudience });
      // Reset form
      setName('');
      setPainDescription('');
      setTargetAudience('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-[#161618] border border-[#27272a] rounded-2xl p-8 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#71717a] hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="text-2xl font-bold mb-2">New Project</h2>
        <p className="text-[#a1a1aa] mb-6">Define what you want to validate</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Expense Tracker for Freelancers"
              className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none transition-colors"
            />
          </div>

          <div>
            <label htmlFor="pain" className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Pain Description
            </label>
            <textarea
              id="pain"
              value={painDescription}
              onChange={(e) => setPainDescription(e.target.value)}
              placeholder="What problem are you solving? e.g., Freelancers struggle to track expenses and hate using complicated accounting software"
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none transition-colors resize-none"
            />
            <p className="text-xs text-[#71717a] mt-1">This helps us find the right people</p>
          </div>

          <div>
            <label htmlFor="audience" className="block text-sm font-medium text-[#a1a1aa] mb-2">
              Target Audience
            </label>
            <input
              id="audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g., Freelancers, solopreneurs, small business owners"
              className="w-full px-4 py-3 rounded-lg border border-[#27272a] bg-[#0a0a0b] text-white placeholder-[#71717a] focus:border-[#22c55e] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-lg border border-[#27272a] text-[#a1a1aa] hover:text-white hover:border-[#3f3f46] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-lg bg-[#22c55e] hover:bg-[#16a34a] text-[#0a0a0b] font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}