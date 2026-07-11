import React, { useState, useEffect } from 'react';
import type { MsmeProfile } from '../types';
import { Sliders, Zap, ShieldCheck, RotateCcw, ArrowLeft } from 'lucide-react';
import { simulateWhatIfLive } from '../services/apiClient';

interface WhatIfSimulatorProps {
  msme: MsmeProfile;
  onClose?: () => void;
}

export const WhatIfSimulator: React.FC<WhatIfSimulatorProps> = ({ msme, onClose }) => {
  const [gstr3b, setGstr3b] = useState<number>(msme.keyMetrics.gstr3bRegularity * 100);
  const [odUtil, setOdUtil] = useState<number>(msme.keyMetrics.odUtilization * 100);
  const [bounces, setBounces] = useState<number>(msme.keyMetrics.chequeBounces);
  const [epfMembers, setEpfMembers] = useState<number>(msme.keyMetrics.epfActiveMembers);

  const [simulatedScore, setSimulatedScore] = useState<number>(msme.healthScore);
  const [newRiskBand, setNewRiskBand] = useState<string>(msme.riskBand);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const runSim = async () => {
      setIsSimulating(true);
      try {
        const overrides = {
          gst_filing_regularity: gstr3b / 100.0,
          aa_od_limit_utilization: odUtil / 100.0,
          aa_bounce_flag: bounces > 0 ? 1.0 : 0.0,
          epfo_active_members: epfMembers
        };
        const res = await simulateWhatIfLive(msme, overrides);
        if (isMounted && res && res.simulated) {
          setSimulatedScore(res.simulated.healthScore);
          setNewRiskBand(res.simulated.riskBand);
        }
      } catch (err) {
        // Fallback calculation if offline
        const gstrDiff = (gstr3b - msme.keyMetrics.gstr3bRegularity * 100);
        const odDiff = (msme.keyMetrics.odUtilization * 100 - odUtil);
        const bounceDiff = (msme.keyMetrics.chequeBounces - bounces);
        const epfDiff = (epfMembers - msme.keyMetrics.epfActiveMembers);
        const deltaFallback = Math.round(gstrDiff * 0.45 + odDiff * 0.50 + bounceDiff * 30 + epfDiff * 0.30);
        const simScore = Math.min(900, Math.max(300, msme.healthScore + deltaFallback));
        if (isMounted) {
          setSimulatedScore(simScore);
          setNewRiskBand(simScore >= 700 ? 'PRIME_RISK' : simScore >= 600 ? 'MODERATE_RISK' : 'HIGH_RISK');
        }
      } finally {
        if (isMounted) setIsSimulating(false);
      }
    };
    
    const timer = setTimeout(runSim, 300); // debounce 300ms
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [gstr3b, odUtil, bounces, epfMembers, msme]);

  const baseScore = msme.healthScore;
  const delta = simulatedScore - baseScore;

  const resetSliders = () => {
    setGstr3b(msme.keyMetrics.gstr3bRegularity * 100);
    setOdUtil(msme.keyMetrics.odUtilization * 100);
    setBounces(msme.keyMetrics.chequeBounces);
    setEpfMembers(msme.keyMetrics.epfActiveMembers);
  };

  return (
    <div className="glass-card p-8 space-y-8 animate-fadeIn border-t-4 border-t-idbi-cyan">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-blue/20 rounded-xl text-idbi-cyan">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Interactive What-If AI Simulator
                {isSimulating && (
                  <span className="w-4 h-4 border-2 border-idbi-cyan border-t-transparent rounded-full animate-spin inline-block" title="Recalculating score via TreeSHAP..." />
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Simulate alternate data feature modifications for <strong className="text-white">{msme.businessName}</strong>
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          )}
          <button
            onClick={resetSliders}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Sliders
          </button>
        </div>
      </div>

      {/* Score Comparison Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-slate-950/60 rounded-2xl border border-slate-800 text-center">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Health Score</p>
          <div className="text-4xl font-extrabold text-slate-200 mt-2">{baseScore} <span className="text-xs font-normal text-slate-500">/ 900</span></div>
          <span className="inline-block mt-2 px-3 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300">
            {msme.riskBand.replace('_', ' ')}
          </span>
        </div>

        <div className="p-6 bg-gradient-to-br from-idbi-blue/20 to-idbi-cyan/20 rounded-2xl border border-idbi-cyan/40 text-center flex flex-col justify-center items-center">
          <p className="text-xs font-semibold text-idbi-cyan uppercase tracking-wider flex items-center gap-1">
            <Zap className="w-3.5 h-3.5" /> Simulated Delta Impact
          </p>
          <div className={`text-3xl font-black mt-2 ${delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {delta >= 0 ? `+${delta}` : delta} <span className="text-sm font-normal">points</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">Real-time XGBoost inference estimation</p>
        </div>

        <div className="p-6 bg-slate-950/80 rounded-2xl border border-slate-800 text-center shadow-lg shadow-emerald-500/5">
          <p className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Simulated New Score</p>
          <div className="text-4xl font-extrabold text-emerald-400 mt-2">{simulatedScore} <span className="text-xs font-normal text-slate-500">/ 900</span></div>
          <span className={newRiskBand === 'PRIME_RISK' ? 'badge-prime inline-flex mt-2' : newRiskBand === 'MODERATE_RISK' ? 'badge-moderate inline-flex mt-2' : 'badge-high inline-flex mt-2'}>
            {newRiskBand.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-950/40 p-6 rounded-2xl border border-slate-800/80">
        {/* GSTR-3B Regularity Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-200">GSTR-3B On-Time Filing Regularity</span>
            <span className="text-idbi-cyan font-bold">{gstr3b.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="100"
            step="5"
            value={gstr3b}
            onChange={(e) => setGstr3b(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-idbi-cyan"
          />
          <p className="text-xs text-slate-400">
            Current baseline: {(msme.keyMetrics.gstr3bRegularity * 100).toFixed(0)}%. Improving tax compliance directly boosts Tax Compliance Subscore.
          </p>
        </div>

        {/* Bank OD Limit Utilization Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-200">Bank OD Limit Utilization (Account Aggregator)</span>
            <span className="text-amber-400 font-bold">{odUtil.toFixed(0)}%</span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={odUtil}
            onChange={(e) => setOdUtil(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <p className="text-xs text-slate-400">
            Current baseline: {(msme.keyMetrics.odUtilization * 100).toFixed(0)}%. Lowering OD utilization below 50% strengthens Liquidity Buffer.
          </p>
        </div>

        {/* Cheque Bounces Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-200">Cheque Dishonours / Inward Bounces (last 6m)</span>
            <span className="text-rose-400 font-bold">{bounces} bounces</span>
          </div>
          <input
            type="range"
            min="0"
            max="5"
            step="1"
            value={bounces}
            onChange={(e) => setBounces(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <p className="text-xs text-slate-400">
            Current baseline: {msme.keyMetrics.chequeBounces} bounces. Each eliminated bounce removes a -30 pt penalty!
          </p>
        </div>

        {/* EPF Active Workforce Slider */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm font-semibold">
            <span className="text-slate-200">EPF Active Workforce Count (Payroll Regularity)</span>
            <span className="text-emerald-400 font-bold">{epfMembers} members</span>
          </div>
          <input
            type="range"
            min="5"
            max="200"
            step="5"
            value={epfMembers}
            onChange={(e) => setEpfMembers(Number(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <p className="text-xs text-slate-400">
            Current baseline: {msme.keyMetrics.epfActiveMembers} members. Stable formal employment growth enhances Payroll Stability Subscore.
          </p>
        </div>
      </div>

      {/* Actionable Loan Pricing Impact */}
      <div className="p-6 bg-gradient-to-r from-emerald-500/10 via-idbi-blue/10 to-slate-900 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 rounded-2xl text-emerald-400">
            <ShieldCheck className="w-7 h-7" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">Simulated IDBI Bank Loan Pricing Impact</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              If the applicant achieves this simulated score of <strong className="text-emerald-400">{simulatedScore}</strong>, they unlock a <strong className="text-emerald-400">0.75% Interest Rate Rebate</strong> and collateral-free OCEN working capital limit up to ₹50 Lakhs!
            </p>
          </div>
        </div>
        <button
          onClick={() => alert(`Saving simulated score target for ${msme.businessName} to audit log...`)}
          className="btn-primary shrink-0 text-xs py-2 px-4"
        >
          Save Simulation Target
        </button>
      </div>
    </div>
  );
};
