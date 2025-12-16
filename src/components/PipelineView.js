'use client';

import { useState, useRef } from 'react';

const PIPELINE_STAGES = [
  { id: 'found', label: 'Saved', emoji: '📌', color: 'border-[#71717a]', bg: 'bg-[#71717a]/10' },
  { id: 'contacted', label: 'Reached Out', emoji: '📤', color: 'border-blue-500', bg: 'bg-blue-500/10' },
  { id: 'replied', label: 'Engaged', emoji: '💬', color: 'border-yellow-500', bg: 'bg-yellow-500/10' },
  { id: 'interested', label: 'Interested', emoji: '🔥', color: 'border-orange-500', bg: 'bg-orange-500/10' },
  { id: 'would_pay', label: 'Converted', emoji: '✅', color: 'border-[#22c55e]', bg: 'bg-[#22c55e]/10' },
];

const INTENT_COLORS = {
  high: 'border-l-[#22c55e]',
  medium: 'border-l-yellow-500',
  low: 'border-l-[#71717a]',
};

function PipelineCard({ signal, outreach, onDragStart, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const subreddit = signal.subreddit || signal.url?.match(/r\/(\w+)/)?.[1] || 'reddit';
  const title = signal.content?.split('\n')[0]?.slice(0, 50) || 'Untitled';

  // Calculate follow-up status
  const getFollowUpStatus = () => {
    if (!outreach?.follow_up_date) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const followUp = new Date(outreach.follow_up_date);
    followUp.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((followUp - today) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Overdue', color: 'bg-red-500/20 text-red-400', urgent: true };
    if (diffDays === 0) return { label: 'Today', color: 'bg-yellow-500/20 text-yellow-500', urgent: true };
    if (diffDays === 1) return { label: 'Tomorrow', color: 'bg-blue-500/20 text-blue-400', urgent: false };
    return null; // Don't show for dates further out
  };

  const followUpStatus = getFollowUpStatus();

  const handleDelete = (e) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (showConfirm) {
      if (onDelete) {
        onDelete(signal.id);
      }
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
      // Auto-hide confirm after 3 seconds
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div 
      draggable
      onDragStart={(e) => onDragStart(e, signal.id)}
      className={`bg-[#0a0a0b] border border-[#27272a] border-l-4 ${INTENT_COLORS[signal.intent_score] || 'border-l-[#71717a]'} rounded-lg p-2 sm:p-3 cursor-grab active:cursor-grabbing hover:border-[#3f3f46] transition-all hover:shadow-lg`}
    >
      {/* Follow-up badge */}
      {followUpStatus && (
        <div className={`text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded-full ${followUpStatus.color} font-medium mb-1.5 inline-flex items-center gap-1 ${followUpStatus.urgent ? 'animate-pulse' : ''}`}>
          <span>🔔</span>
          <span>{followUpStatus.label}</span>
        </div>
      )}
      
      <div className="flex items-center gap-1 sm:gap-2 mb-1 sm:mb-2">
        <span className="text-[10px] sm:text-xs text-[#22c55e] font-medium truncate">r/{subreddit}</span>
        <span className="text-[10px] sm:text-xs text-[#71717a] hidden sm:inline">•</span>
        <span className="text-[10px] sm:text-xs text-[#71717a] truncate hidden sm:inline">u/{signal.author}</span>
      </div>
      
      <p className="text-xs sm:text-sm text-white mb-2 sm:mb-3 line-clamp-2">{title}</p>
      
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1">
          {signal.intent_score === 'high' && <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-[#22c55e]/20 text-[#22c55e]">HIGH</span>}
          {signal.intent_score === 'medium' && <span className="text-[8px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded bg-yellow-500/20 text-yellow-500">MED</span>}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDelete}
            className={`text-[9px] sm:text-[10px] transition-colors ${
              showConfirm 
                ? 'text-red-500 font-medium' 
                : 'text-[#71717a] hover:text-red-400'
            }`}
            title={showConfirm ? 'Click again to confirm' : 'Delete'}
          >
            {showConfirm ? 'Sure?' : 'Delete'}
          </button>
          <a 
            href={signal.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-[9px] sm:text-[10px] text-[#22c55e] hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View →
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PipelineView({ signals, outreachMap, onUpdateOutreach, onDelete }) {
  const [draggedSignalId, setDraggedSignalId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  
  // Drag to scroll
  const scrollRef = useRef(null);
  const [isDraggingScroll, setIsDraggingScroll] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleMouseDown = (e) => {
    // Only activate if clicking on the container, not on cards
    if (e.target.closest('[draggable="true"]')) return;
    
    setIsDraggingScroll(true);
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseUp = () => {
    setIsDraggingScroll(false);
  };

  const handleMouseMove = (e) => {
    if (!isDraggingScroll) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseLeave = () => {
    setIsDraggingScroll(false);
  };

  // Group signals by outreach status
  const signalsByStage = PIPELINE_STAGES.reduce((acc, stage) => {
    acc[stage.id] = signals.filter(signal => {
      const status = outreachMap[signal.id]?.status || 'found';
      return status === stage.id;
    });
    return acc;
  }, {});

  const totalSignals = signals.length;

  const handleDragStart = (e, signalId) => {
    setDraggedSignalId(signalId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, stageId) => {
    e.preventDefault();
    setDragOverStage(stageId);
  };

  const handleDragLeave = () => {
    setDragOverStage(null);
  };

  const handleDrop = async (e, stageId) => {
    e.preventDefault();
    setDragOverStage(null);
    
    if (draggedSignalId) {
      await onUpdateOutreach(draggedSignalId, { status: stageId });
      setDraggedSignalId(null);
    }
  };

  return (
    <div className="w-full">
      {/* Pipeline Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">Pipeline</h2>
        <span className="text-sm text-[#71717a]">{totalSignals} signals</span>
      </div>

      {/* Kanban Board - Grid layout to fit all 5 columns */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {PIPELINE_STAGES.map((stage) => {
          const stageSignals = signalsByStage[stage.id] || [];
          const count = stageSignals.length;
          const isDragOver = dragOverStage === stage.id;
          
          return (
            <div 
              key={stage.id} 
              className={`bg-[#161618] border-2 ${isDragOver ? 'border-[#22c55e] bg-[#22c55e]/5' : stage.color} rounded-xl p-2 sm:p-3 transition-colors`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-2 sm:mb-3 pb-2 border-b border-[#27272a]">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="text-xs sm:text-sm flex-shrink-0">{stage.emoji}</span>
                  <span className="font-medium text-[10px] sm:text-xs truncate hidden sm:block">{stage.label}</span>
                </div>
                <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${stage.bg} font-medium flex-shrink-0`}>
                  {count}
                </span>
              </div>

              {/* Cards */}
              <div className="space-y-2 min-h-[100px] sm:min-h-[150px] max-h-[300px] sm:max-h-[400px] overflow-y-auto scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {stageSignals.length === 0 ? (
                  <div className={`flex items-center justify-center h-16 sm:h-20 border border-dashed ${isDragOver ? 'border-[#22c55e]' : 'border-[#27272a]'} rounded-lg transition-colors`}>
                    <p className="text-[8px] sm:text-[10px] text-[#71717a] text-center px-1">{isDragOver ? 'Drop' : 'Empty'}</p>
                  </div>
                ) : (
                  stageSignals.map(signal => (
                    <PipelineCard
                      key={signal.id}
                      signal={signal}
                      outreach={outreachMap[signal.id]}
                      onDragStart={handleDragStart}
                      onDelete={onDelete}
                    />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-2 mt-4 p-3 bg-[#161618] border border-[#27272a] rounded-xl">
        {PIPELINE_STAGES.map((stage) => {
          const count = signalsByStage[stage.id]?.length || 0;
          const percentage = totalSignals > 0 ? Math.round((count / totalSignals) * 100) : 0;
          
          return (
            <div key={stage.id} className="text-center">
              <div className="text-lg font-bold">{count}</div>
              <div className="text-[10px] text-[#71717a] hidden sm:block">{stage.label}</div>
              <div className="text-[10px] text-[#71717a] sm:hidden">{stage.emoji}</div>
              <div className="text-[10px] text-[#52525b]">{percentage}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}