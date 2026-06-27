import React, { useEffect, useState, useMemo } from 'react';
import { BrainCircuit, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Issue } from '@/types/civic';

interface AIInsightCardProps {
  issues?: Issue[];
}

export const AIInsightCard: React.FC<AIInsightCardProps> = ({ issues = [] }) => {
  const generatedInsight = useMemo(() => {
    if (!issues || issues.length === 0) return "Collecting initial civic data for analysis. The matrix is awaiting sufficient sensor telemetry...";

    const categories = issues.reduce((acc, issue) => {
      acc[issue.category] = (acc[issue.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let topCategory = '';
    let max = 0;
    for (const [cat, count] of Object.entries(categories)) {
      if (count > max) { max = count; topCategory = cat; }
    }

    const urgentCount = issues.filter(i => i.priority === 'urgent').length;
    const resolvedCount = issues.filter(i => i.status === 'resolved').length;
    const resolutionRate = Math.round((resolvedCount / issues.length) * 100) || 0;

    return `Analysis complete. **${topCategory.toUpperCase()}** accounts for the highest report volume (${max} cases). Global resolution efficacy is holding at **${resolutionRate}%**, with ${urgentCount} urgent items requiring immediate dispatch routing.`;
  }, [issues]);

  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [scanKey, setScanKey] = useState(0);

  useEffect(() => {
    setDisplayedText('');
    setIsTyping(true);
    let i = 0;
    const text = generatedInsight;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (i > text.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, 20);
    return () => clearInterval(intervalId);
  }, [generatedInsight, scanKey]);

  const renderTextWithHighlights = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <span key={i} className="text-emerald-700 font-extrabold text-[11px] bg-emerald-100/60 px-1.5 py-0.5 rounded-[4px] mx-0.5 tracking-wide align-baseline">{part.slice(2, -2)}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="bg-[#f8f9fc] border border-slate-200/60 rounded-[1.25rem] p-6 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.03)] flex flex-col justify-between min-h-[140px]">
      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-indigo-100/60 transition-opacity duration-300" style={{ opacity: isTyping ? 0.6 : 1 }}>
        <div className="h-8 w-8 rounded-full bg-indigo-100/80 flex items-center justify-center shrink-0">
          <BrainCircuit className={cn("h-4 w-4 text-indigo-600 transition-all", isTyping ? "animate-pulse shadow-[0_0_15px_rgba(79,70,229,0.5)]" : "")} />
        </div>
        <h3 className="text-[15px] font-extrabold tracking-tight text-slate-900">
          CityScope Matrix 
        </h3>
      </div>
      
      <p className="text-[13px] font-medium leading-relaxed text-slate-600 mb-6">
        {renderTextWithHighlights(displayedText)}
        {isTyping && <span className="inline-block w-1.5 h-3.5 bg-indigo-400 ml-1 mb-0.5 align-middle animate-pulse" />}
      </p>
      
      <button 
        onClick={() => setScanKey(k => k + 1)}
        disabled={isTyping}
        className="text-[12px] font-bold text-indigo-600 flex items-center gap-1 hover:text-indigo-800 transition-colors mt-auto w-fit group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isTyping ? 'Analyzing Telemetry...' : 'Run Deep Scan'} 
        {!isTyping && <TrendingUp className="h-3 w-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />}
      </button>
    </div>
  );
};
