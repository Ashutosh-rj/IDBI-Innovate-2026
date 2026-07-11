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
          className="px-3 py-1.5 bg-slate-800 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </button>
        <button
          onClick={() => {
            resetSliders();
            setIsSubmitted(false);
          }}
          className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Header */}
      <div className="glass-card p-5 border-l-4 border-l-idbi-cyan bg-gradient-to-r from-idbi-blue/15 to-slate-900">
        <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-idbi-cyan animate-pulse" />
          Score Boost AI Simulator
        </h3>
        <p className="text-xs text-slate-300 mt-1">
          See how improving your tax regularity or lowering OD usage unlocks instant IDBI Bank interest rate rebates!
        </p>
      </div>

      {/* Score Target Card */}
      <div className="glass-card p-6 text-center border-t-4 border-t-emerald-500 shadow-xl space-y-4">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Simulated Target Score</p>
        
        <div className="flex items-baseline justify-center gap-2">
          <span className={`text-6xl font-black tracking-tight ${
            simulatedScore >= 700 ? 'text-emerald-400' : simulatedScore >= 600 ? 'text-amber-400' : 'text-rose-400'
          }`}>
            {simulatedScore}
          </span>
          <span className="text-base font-bold text-slate-500">/ 900</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            simulatedScore >= 700 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            simulatedScore >= 600 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {newRiskBand.replace('_', ' ')}
          </span>

          <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
            delta >= 0 ? 'bg-idbi-cyan/20 text-idbi-cyan border border-idbi-cyan/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            <Zap className="w-3.5 h-3.5" /> {delta >= 0 ? `+${delta}` : delta} pts
          </span>
        </div>

        {simulatedScore >= 700 && (
          <div className="p-3 bg-emerald-500/15 rounded-xl border border-emerald-500/30 text-xs text-emerald-300 font-medium flex items-center justify-center gap-2 animate-bounce">
            <Award className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Congratulations! You unlock a <strong>0.75% Interest Discount</strong> at IDBI Bank!</span>
          </div>
        )}
      </div>

      {/* Sliders Grid */}
      <div className="glass-card p-5 space-y-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Adjust Your Behavior Drivers</h4>

        {/* GSTR-3B Regularity Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-200">GSTR-3B On-Time Filing Regularity</span>
            <span className="text-idbi-cyan font-bold">{gstr3b.toFixed(0)}%</span>
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-idbi-cyan"
          />
          <p className="text-[11px] text-slate-400">
            Current: {(msme.keyMetrics.gstr3bRegularity * 100).toFixed(0)}%. Filing 100% on time adds up to +25 points!
          </p>
        </div>

        {/* OD Limit Utilization Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-200">Bank Overdraft (OD) Utilization</span>
            <span className="text-amber-400 font-bold">{odUtil.toFixed(0)}%</span>
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-[11px] text-slate-400">
            Current: {(msme.keyMetrics.odUtilization * 100).toFixed(0)}%. Keeping utilization below 50% strengthens liquidity buffer (+30 pts).
          </p>
        </div>

        {/* Cheque Bounces Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold">
            <span className="text-slate-200">Cheque Dishonours / Bounces (last 6m)</span>
            <span className="text-rose-400 font-bold">{bounces} bounces</span>
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
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-[11px] text-slate-400">
            Current: {msme.keyMetrics.chequeBounces} bounces. Each eliminated bounce removes a -30 pt penalty!
          </p>
        </div>
      </div>

      {/* CTA Button or Submitted Confirmation */}
      {isSubmitted ? (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 rounded-2xl text-center space-y-2 animate-fadeIn shadow-xl">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Award className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-white">Target Plan Submitted to IDBI Bank!</h4>
          <p className="text-xs text-slate-300">
            Your simulated milestone plan has been logged with the IDBI Loan Officer under OCEN LSP Reference <strong className="text-emerald-400 font-mono">#IDBI-2026-ACT-882</strong>.
          </p>
        </div>
      ) : (
        <button
          onClick={() => setIsSubmitted(true)}
          className="btn-primary py-3.5 text-sm w-full font-bold shadow-lg shadow-idbi-blue/30"
        >
          Submit Target to IDBI Loan Officer &rarr;
        </button>
      )}
    </div>
  );
};
