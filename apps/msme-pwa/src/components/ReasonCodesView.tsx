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
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <span className="text-xs font-bold text-slate-600">TreeSHAP Explainability</span>
      </div>

      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-idbi-blue shadow-sm">
        <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-idbi-navy" />
          Why did I get a score of {msme.healthScore}?
        </h3>
        <p className="text-xs text-slate-600 mt-1">
          Every point in your score is calculated from your alternate data streams (GST, UPI, EPFO, Bank AA). Here is your audit-grade breakdown:
        </p>
      </div>

      {/* Negative Drivers / Actionable Advice */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-rose-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <AlertTriangle className="w-4 h-4" /> Areas to Improve (Actionable Advice)
        </h4>

        {negativeReasons.length > 0 ? (
          negativeReasons.map((reason, idx) => (
            <div key={idx} className="glass-card p-5 border-l-4 border-l-rose-600 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[11px] font-bold font-mono">
                  {reason.category} • {reason.code}
                </span>
                <span className="text-xs font-extrabold text-rose-700">{reason.shapValue} points</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{reason.description}</p>
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-slate-800 flex items-start gap-2.5">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-amber-800 font-bold">Actionable Tip:</strong> {reason.advice}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="glass-card p-5 text-center border border-emerald-300 bg-emerald-50 shadow-sm">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">No Negative Risk Factors!</p>
            <p className="text-xs text-slate-600 mt-1">Your compliance and cash flow metrics are exemplary.</p>
          </div>
        )}
      </div>

      {/* Positive Drivers */}
      <div className="space-y-4 pt-2">
        <h4 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5 px-1">
          <CheckCircle2 className="w-4 h-4" /> What You're Doing Great (Score Boosters)
        </h4>

        {positiveReasons.map((reason, idx) => (
          <div key={idx} className="glass-card p-5 border-l-4 border-l-emerald-600 space-y-2 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold font-mono">
                {reason.category} • {reason.code}
              </span>
              <span className="text-xs font-extrabold text-emerald-700">+{reason.shapValue} points</span>
            </div>
            <p className="text-sm font-semibold text-slate-900">{reason.description}</p>
            <p className="text-xs text-slate-600">{reason.advice}</p>
          </div>
        ))}
      </div>

      {/* Call to action */}
      <div className="glass-card p-5 border border-slate-200 text-center space-y-3 shadow-sm bg-slate-50">
        <p className="text-xs font-medium text-slate-700">
          Want to see how fixing these areas changes your score?
        </p>
        <button
          onClick={() => onNavigate('boost')}
          className="btn-primary py-2.5 text-xs bg-idbi-navy hover:bg-[#00385F] shadow-sm"
        >
          Launch Score Boost Simulator &rarr;
        </button>
      </div>
    </div>
  );
};
