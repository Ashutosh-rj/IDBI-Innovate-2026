import React from 'react';
import type { MsmeProfile } from '../types';
import { CheckCircle2, AlertTriangle, ArrowLeft, HelpCircle, Lightbulb } from 'lucide-react';

interface ReasonCodesViewProps {
  msme: MsmeProfile;
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

export const ReasonCodesView: React.FC<ReasonCodesViewProps> = ({ msme, onBack, onNavigate }) => {
  const positiveReasons = msme.topReasonCodes.filter(r => r.impact === 'POSITIVE');
  const negativeReasons = msme.topReasonCodes.filter(r => r.impact === 'NEGATIVE');

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="text-xs font-bold text-slate-400">TreeSHAP Explainability</span>
      </div>

      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-idbi-cyan">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-idbi-cyan" />
          Why did I get a score of {msme.healthScore}?
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          Every point in your score is calculated from your alternate data streams (GST, UPI, EPFO, Bank AA). Here is your audit-grade breakdown:
        </p>
      </div>

      {/* Negative Drivers / Actionable Advice (Shown First for MSME Owner) */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <AlertTriangle className="w-4 h-4" /> Areas to Improve (Actionable Advice)
        </h4>

        {negativeReasons.length > 0 ? (
          negativeReasons.map((reason, idx) => (
            <div key={idx} className="glass-card p-5 border-l-4 border-l-rose-500 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[11px] font-bold font-mono">
                  {reason.category} • {reason.code}
                </span>
                <span className="text-xs font-extrabold text-rose-400">{reason.shapValue} points</span>
              </div>
              <p className="text-sm font-semibold text-white">{reason.description}</p>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-rose-500/20 text-xs text-slate-200 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <strong className="text-amber-400 font-bold">Actionable Tip:</strong> {reason.advice}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-5 text-center border border-emerald-500/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-white">No Negative Risk Factors!</p>
            <p className="text-xs text-slate-400 mt-1">Your compliance and cash flow metrics are exemplary.</p>
          </div>
        )}
      </div>

      {/* Positive Drivers */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <CheckCircle2 className="w-4 h-4" /> What You're Doing Great (Score Boosters)
        </h4>

        {positiveReasons.map((reason, idx) => (
          <div key={idx} className="glass-card p-5 border-l-4 border-l-emerald-500 space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[11px] font-bold font-mono">
                {reason.category} • {reason.code}
              </span>
              <span className="text-xs font-extrabold text-emerald-400">+{reason.shapValue} points</span>
            </div>
            <p className="text-sm font-semibold text-white">{reason.description}</p>
            <p className="text-xs text-slate-400 italic">{reason.advice}</p>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="p-5 bg-slate-900 rounded-2xl border border-slate-800 text-center space-y-3">
        <p className="text-xs text-slate-300">
          Want to see how fixing these areas changes your score?
        </p>
        <button
          onClick={() => onNavigate('boost')}
          className="btn-primary py-2.5 text-xs"
        >
          Launch Score Boost Simulator &rarr;
        </button>
      </div>
    </div>
  );
};
