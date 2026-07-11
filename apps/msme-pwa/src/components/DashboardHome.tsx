import React from 'react';
import type { MsmeProfile } from '../types';
import { ShieldCheck, Award, ChevronRight, Sparkles, Activity, Zap } from 'lucide-react';

interface DashboardHomeProps {
  msme: MsmeProfile;
  onNavigate: (tab: string) => void;
}

export const DashboardHome: React.FC<DashboardHomeProps> = ({ msme, onNavigate }) => {
  const isPrime = msme.healthScore >= 700;
  const isMod = msme.healthScore >= 600 && msme.healthScore < 700;

  // Calculate gauge SVG circle props (radius 80, circumference ~502)
  const scoreRatio = Math.min(1, Math.max(0, (msme.healthScore - 300) / 600));
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scoreRatio * circumference;

  // Synthetic 6-month trend progression leading up to current healthScore
  const historyTrend = [
    Math.max(300, msme.healthScore - 110),
    Math.max(300, msme.healthScore - 85),
    Math.max(300, msme.healthScore - 55),
    Math.max(300, msme.healthScore - 30),
    Math.max(300, msme.healthScore - 12),
    msme.healthScore
  ];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  return (
    <div className="space-y-6 pb-24 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="glass-card p-5 bg-gradient-to-br from-slate-900 via-idbi-navy/30 to-slate-900 border-idbi-cyan/30">
        <p className="text-xs font-semibold text-idbi-cyan uppercase tracking-wider">Welcome back,</p>
        <h2 className="text-xl font-extrabold text-white mt-0.5">{msme.businessName}</h2>
        <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
          <span>{msme.sector}</span>
          <span>•</span>
          <span>Udyam: <span className="font-mono text-slate-300">{msme.udyamNumber}</span></span>
        </p>
      </div>

      {/* Enhanced NTC Thin-File Explanation Banner */}
      {msme.isNtcThinFile && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/80 via-slate-900 to-purple-950/80 border border-purple-500/50 space-y-2.5 shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-500/40">
                NTC Thin-File Borrower
              </span>
              <h4 className="text-sm font-bold text-white mt-0.5">Scored via 100% Alternate Data</h4>
            </div>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Traditional credit bureaus show zero history for your enterprise. Our AI scoring engine synthesized your <strong>ReBIT Account Aggregator statements</strong>, <strong>GSTR-3B filings</strong>, and <strong>UPI merchant velocity</strong> to establish creditworthiness and unlock instant OCEN working capital limits.
          </p>
        </div>
      )}

      {/* Main Score Card Gauge with Radial Ring Animation */}
      <div className="glass-card p-6 text-center border-t-4 border-t-idbi-cyan relative overflow-hidden shadow-2xl">
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-idbi-cyan/10 rounded-full blur-2xl pointer-events-none" />
        
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Your Financial Health Score</p>
        
        <div className="my-6 relative flex flex-col items-center justify-center">
          {/* Animated SVG Ring */}
          <div className="relative w-48 h-48 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
              {/* Background Ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className="stroke-slate-800"
                strokeWidth="12"
                fill="transparent"
              />
              {/* Progress Ring */}
              <circle
                cx="90"
                cy="90"
                r={radius}
                className={`transition-all duration-1000 ease-out ${
                  isPrime ? 'stroke-emerald-400' : isMod ? 'stroke-amber-400' : 'stroke-rose-500'
                }`}
                strokeWidth="12"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className={`text-5xl font-black tracking-tight font-mono ${
                isPrime ? 'text-emerald-400' : isMod ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {msme.healthScore}
              </span>
              <span className="text-xs font-bold text-slate-400 mt-1">out of 900</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-2">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
              isPrime ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
              isMod ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-rose-500/20 text-rose-400 border border-rose-500/30'
            }`}>
              {msme.riskBand.replace('_', ' ')}
            </span>
            {msme.isNtcThinFile && (
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                Alternate Data Verified
              </span>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">12M Default Risk (PD):</span>
          <strong className="text-white font-mono">{(msme.defaultProbability12m * 100).toFixed(1)}%</strong>
        </div>
      </div>

      {/* Score History Sparkline Trend Card */}
      <div className="glass-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-idbi-cyan" />
            <h3 className="text-sm font-bold text-white">6-Month Score Trajectory</h3>
          </div>
          <span className="text-xs text-emerald-400 font-bold font-mono">+110 pts since Jan</span>
        </div>

        <div className="pt-3 pb-1 flex items-end justify-between h-28 gap-2">
          {historyTrend.map((val, i) => {
            const heightPct = Math.round(((val - 300) / 600) * 100);
            const isCurrent = i === historyTrend.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                <span className={`text-[10px] font-mono font-bold ${isCurrent ? 'text-idbi-cyan scale-110' : 'text-slate-400'}`}>
                  {val}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-500 ${
                    isCurrent
                      ? 'bg-gradient-to-t from-idbi-blue to-idbi-cyan shadow-md shadow-idbi-cyan/30'
                      : 'bg-slate-800 group-hover:bg-slate-700'
                  }`}
                  style={{ height: `${Math.max(15, heightPct)}%` }}
                />
                <span className="text-[10px] text-slate-500 font-semibold">{months[i]}</span>
              </div>
            );
          })}
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
              {isPrime ? 'You unlock a 0.75% interest rate rebate & instant OCEN working capital limit!' : 'Boost your score above 700 to unlock instant 0.75% rate discounts!'}
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
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.taxComplianceScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Cash Flow Velocity</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.cashFlowVelocityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Payroll Stability</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.payrollStabilityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <span className="text-slate-400">Liquidity Buffer</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.liquidityBufferScore}%</div>
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
              <Activity className="w-5 h-5" />
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
