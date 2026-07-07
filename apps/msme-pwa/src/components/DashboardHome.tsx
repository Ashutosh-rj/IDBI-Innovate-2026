import React from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, TrendingUp, Award, ChevronRight, Sparkles } from 'lucide-react';

interface DashboardHomeProps {
  msme: MsmeProfile;
  onNavigate: (tab: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ msme, onNavigate }) => {
  const isPrime = msme.healthScore >= 700;
  const isMod = msme.healthScore >= 600 && msme.healthScore < 700;

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="glass-card p-5 bg-gradient-to-br from-slate-900 via-idbi-navy/30 to-slate-900 border-idbi-cyan/30">
        <p className="text-xs font-semibold text-idbi-cyan uppercase tracking-wider">Welcome back,</p>
        <h2 className="text-xl font-extrabold text-white mt-0.5">{msme.businessName}</h2>
        <p className="text-xs text-slate-400 mt-1">
          {msme.sector} • Udyam: <span className="font-mono text-slate-300">{msme.udyamNumber}</span>
        </p>
      </div>

      {/* Main Score Card Gauge */}
      <div className="glass-card p-6 text-center border-t-4 border-t-idbi-cyan relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-idbi-cyan/10 rounded-full blur-2xl pointer-events-none" />
        
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Financial Health Score</p>
        
        <div className="my-6 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            <span className={`text-6xl font-black tracking-tighter ${
              isPrime ? 'text-emerald-400' : isMod ? 'text-amber-400' : 'text-rose-400'
            }`}>
              {msme.healthScore}
            </span>
            <span className="text-base font-bold text-slate-500 absolute -right-12 bottom-2">/ 900</span>
          </div>
          
          <div className="flex items-center gap-2 mt-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPrime ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              isMod ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {msme.riskBand.replace('_', ' ')}
            </span>
            {msme.isNtcThinFile && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                NTC Thin-File
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">12M Default Risk (PD):</span>
          <strong className="text-white font-mono">{(msme.defaultProbability12m * 100).toFixed(1)}%</strong>
        </div>
      </div>

      {/* IDBI Loan Benefits Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/15 via-idbi-blue/15 to-slate-900 border border-emerald-500/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">IDBI Bank Loan Benefits</h4>
            <p className="text-xs text-slate-300 mt-0.5">
              {isPrime ? 'You unlock a 0.75% interest rate rebate & OCEN working capital limit!' : 'Boost your score above 700 to unlock instant 0.75% rate discounts!'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscores Summary Bar */}
      <div className="glass-card p-5 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>5-Dimension Subscore Health</span>
          <span className="text-xs text-idbi-cyan font-normal cursor-pointer" onClick={() => onNavigate('reasons')}>Details &rarr;</span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Tax Compliance</span>
            <div className="text-base font-extrabold text-white mt-0.5">{msme.subScores.taxComplianceScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Cash Flow Velocity</span>
            <div className="text-base font-extrabold text-white mt-0.5">{msme.subScores.cashFlowVelocityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Payroll Stability</span>
            <div className="text-base font-extrabold text-white mt-0.5">{msme.subScores.payrollStabilityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Liquidity Buffer</span>
            <div className="text-base font-extrabold text-white mt-0.5">{msme.subScores.liquidityBufferScore}%</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider px-1">Self-Service Actions</h3>
        
        <div
          onClick={() => onNavigate('reasons')}
          className="glass-card p-4 hover:border-idbi-cyan/40 cursor-pointer flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-cyan/10 rounded-xl text-idbi-cyan group-hover:bg-idbi-cyan/20 transition-colors">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Why did I get this score?</h4>
              <p className="text-xs text-slate-400">View plain-language reason codes & actionable advice</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-idbi-cyan transition-colors" />
        </div>

        <div
          onClick={() => onNavigate('consents')}
          className="glass-card p-4 hover:border-idbi-cyan/40 cursor-pointer flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20 transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Manage Account Aggregator Consents</h4>
              <p className="text-xs text-slate-400">Review active ReBIT AA v2.0 data sharing permissions</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 transition-colors" />
        </div>

        <div
          onClick={() => onNavigate('boost')}
          className="glass-card p-4 bg-gradient-to-r from-idbi-blue/20 to-idbi-cyan/20 border-idbi-cyan/40 cursor-pointer flex items-center justify-between transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-cyan/20 rounded-xl text-idbi-cyan">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Score Boost AI Simulator</h4>
              <p className="text-xs text-slate-300">Simulate how fixing GST or OD usage boosts your score</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-idbi-cyan" />
        </div>
      </div>
    </div>
  );
};
