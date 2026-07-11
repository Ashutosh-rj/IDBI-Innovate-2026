import React, { useState } from 'react';
import type { MsmeProfile } from '../types';
import { Sparkles, ArrowLeft, Zap, RotateCcw, Award } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ScoreBoostSimulatorProps {
  msme: MsmeProfile;
  onBack: () => void;
}

export const ScoreBoostSimulator: React.FC<ScoreBoostSimulatorProps> = ({ msme, onBack }) => {
  const [gstr3b, setGstr3b] = useState<number>(msme.keyMetrics.gstr3bRegularity * 100);
  const [odUtil, setOdUtil] = useState<number>(msme.keyMetrics.odUtilization * 100);
  const [bounces, setBounces] = useState<number>(msme.keyMetrics.chequeBounces);

  const baseScore = msme.healthScore;

  // Delta calculation logic matching TreeSHAP feature attributions
  let delta = 0;
  const gstrDiff = (gstr3b - msme.keyMetrics.gstr3bRegularity * 100);
  delta += Math.round(gstrDiff * 0.45);

  const odDiff = (msme.keyMetrics.odUtilization * 100 - odUtil);
  delta += Math.round(odDiff * 0.50);

  const bounceDiff = (msme.keyMetrics.chequeBounces - bounces);
  delta += (bounceDiff * 30);

  const simulatedScore = Math.min(900, Math.max(300, baseScore + delta));
  const newRiskBand = simulatedScore >= 700 ? 'PRIME_RISK' : simulatedScore >= 600 ? 'MODERATE_RISK' : 'HIGH_RISK';

  const handleSliderChange = (newSimScore: number) => {
    // Trigger confetti if score crosses into Prime tier (≥700) from below!
    if (baseScore < 700 && newSimScore >= 700) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#00A3E0', '#10B981', '#D4AF37']
        });
      } catch (e) {
        // ignore if canvas-confetti fails in test env
      }
    }
  };

  const resetSliders = () => {
    setGstr3b(msme.keyMetrics.gstr3bRegularity * 100);
    setOdUtil(msme.keyMetrics.odUtilization * 100);
    setBounces(msme.keyMetrics.chequeBounces);
  };

  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

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
        <button
          onClick={() => {
            resetSliders();
            setIsSubmitted(false);
          }}
          className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold flex items-center gap-1 shadow-sm"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-idbi-blue shadow-sm">
        <div className="relative z-10">
          <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-idbi-navy" />
            Score Boost AI Simulator
          </h3>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            See how improving your tax regularity or lowering OD usage unlocks instant IDBI Bank interest rate rebates!
          </p>
        </div>
      </div>

      {/* Score Target Card */}
      <div className="glass-card p-6 text-center border-t-4 border-t-emerald-600 shadow-sm space-y-4">
        <div className="relative z-10 space-y-4">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Simulated Target Score
          </p>
          
          <div className="flex items-baseline justify-center gap-2">
            <span className={`text-6xl font-black tracking-tight font-mono ${
              simulatedScore >= 700 ? 'text-emerald-700' : simulatedScore >= 600 ? 'text-amber-700' : 'text-rose-700'
            }`}>
              {simulatedScore}
            </span>
            <span className="text-base font-bold text-slate-600">/ 900</span>
          </div>

          <div className="flex items-center justify-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              simulatedScore >= 700 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
              simulatedScore >= 600 ? 'bg-amber-100 text-amber-800 border border-amber-300' :
              'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
              {newRiskBand.replace('_', ' ')}
            </span>

            <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 border ${
              delta >= 0 ? 'bg-idbi-blue/10 text-idbi-navy border-idbi-blue/30' : 'bg-rose-100 text-rose-800 border-rose-300'
            }`}>
              <Zap className="w-3.5 h-3.5" /> {delta >= 0 ? `+${delta}` : delta} pts
            </span>
          </div>

          {simulatedScore >= 700 && (
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-300 text-xs text-emerald-900 font-medium flex items-center justify-center gap-2 shadow-sm">
              <Award className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>Congratulations! You unlock a <strong>0.75% Interest Discount</strong> at IDBI Bank!</span>
            </div>
          )}
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="glass-card p-5 space-y-6 shadow-sm">
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Adjust Your Behavior Drivers</h4>

        {/* GSTR-3B Regularity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-800">GSTR-3B On-Time Filing Regularity</span>
            <span className="text-idbi-navy font-bold">{gstr3b.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={gstr3b}
            onChange={(e) => {
              const val = Number(e.target.value);
              setGstr3b(val);
              handleSliderChange(baseScore + delta);
              setIsSubmitted(false);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-idbi-navy"
          />
          <p className="text-[11px] text-slate-600">
            Current: {(msme.keyMetrics.gstr3bRegularity * 100).toFixed(0)}%. Filing 100% on time adds up to +25 points!
          </p>
        </div>

        {/* OD Limit Utilization Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-800">Bank Overdraft (OD) Utilization</span>
            <span className="text-amber-700 font-bold">{odUtil.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={odUtil}
            onChange={(e) => {
              const val = Number(e.target.value);
              setOdUtil(val);
              handleSliderChange(baseScore + delta);
              setIsSubmitted(false);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
          />
          <p className="text-[11px] text-slate-600">
            Current: {(msme.keyMetrics.odUtilization * 100).toFixed(0)}%. Keeping utilization below 50% strengthens liquidity buffer (+30 pts).
          </p>
        </div>

        {/* Cheque Bounces Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-800">Cheque Dishonours / Bounces (last 6m)</span>
            <span className="text-rose-700 font-bold">{bounces} bounces</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={bounces}
            onChange={(e) => {
              const val = Number(e.target.value);
              setBounces(val);
              handleSliderChange(baseScore + delta);
              setIsSubmitted(false);
            }}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600"
          />
          <p className="text-[11px] text-slate-600">
            Current: {msme.keyMetrics.chequeBounces} bounces. Each eliminated bounce removes a -30 pt penalty!
          </p>
        </div>
      </div>

      {/* CTA Button or Submitted Confirmation */}
      {isSubmitted ? (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-center space-y-2 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">Target Plan Submitted to IDBI Bank!</h4>
          <p className="text-xs text-slate-700">
            Your simulated milestone plan has been logged with the IDBI Loan Officer under OCEN LSP Reference <strong className="text-emerald-800 font-mono">#IDBI-2026-ACT-882</strong>.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsSubmitted(true)}
          className="btn-primary py-3.5 text-sm w-full font-bold bg-idbi-navy hover:bg-[#00385F] shadow-sm"
        >
          Submit Target to IDBI Loan Officer &rarr;
        </button>
      )}
    </div>
  );
};
