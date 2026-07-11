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
      {/* Welcome Banner with Unique Dark Art Background */}
      <div className="glass-card p-5 border-idbi-cyan/40 relative overflow-hidden rounded-3xl shadow-2xl group transition-all duration-500">
        <div className="absolute inset-0 bg-[url('/images/bg-dark-art.jpg')] bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-900/90 backdrop-blur-[2px]" />
        <div className="relative z-10">
          <p className="text-xs font-semibold text-idbi-cyan uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-idbi-cyan animate-pulse inline-block" />
            Welcome back,
          </p>
          <h2 className="text-xl font-extrabold text-white mt-0.5 tracking-tight group-hover:text-idbi-cyan transition-colors">{msme.businessName}</h2>
          <p className="text-xs text-slate-300 mt-1 flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/60 text-slate-200">{msme.sector}</span>
            <span>•</span>
            <span>Udyam: <span className="font-mono text-idbi-cyan/90 font-bold">{msme.udyamNumber}</span></span>
          </p>
        </div>
      </div>

      {/* Enhanced NTC Thin-File Explanation Banner with Abstract Dots Art */}
      {msme.isNtcThinFile && (
        <div className="p-4 rounded-2xl border border-purple-500/50 space-y-2.5 shadow-2xl relative overflow-hidden group animate-fadeIn">
          <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-25 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-950/95 via-slate-950/90 to-purple-950/95 backdrop-blur-sm" />
          <div className="relative z-10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-500/20 rounded-xl text-purple-400 group-hover:rotate-12 transition-transform duration-300">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-500/30 text-purple-300 border border-purple-500/40">
                  NTC Thin-File Borrower
                </span>
                <h4 className="text-sm font-bold text-white mt-0.5">Scored via 100% Alternate Data</h4>
              </div>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed mt-1">
              Traditional credit bureaus show zero history for your enterprise. Our AI scoring engine synthesized your <strong>ReBIT Account Aggregator statements</strong>, <strong>GSTR-3B filings</strong>, and <strong>UPI merchant velocity</strong> to establish creditworthiness and unlock instant OCEN working capital limits.
            </p>
          </div>
        </div>
      )}

      {/* Main Score Card Gauge with Radial Ring & Hypnotic Trippy Fractal Glow */}
      <div className="glass-card p-6 text-center border-t-4 border-t-idbi-cyan relative overflow-hidden rounded-3xl shadow-2xl group">
        {/* Unique Trippy Fractal Holographic Backdrop */}
        <div className="absolute inset-0 bg-[url('/images/bg-trippy-fractal.jpg')] bg-cover bg-center opacity-15 group-hover:opacity-25 transition-all duration-700 mix-blend-screen pointer-events-none group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/80 to-slate-950/95 backdrop-blur-[3px] pointer-events-none" />
        <div className="absolute -right-10 -top-10 w-32 h-32 bg-idbi-cyan/15 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-700" />
        
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-idbi-cyan animate-spin" style={{ animationDuration: '6s' }} />
            Your Financial Health Score
          </p>
          
          <div className="my-6 relative flex flex-col items-center justify-center">
            {/* Animated SVG Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
              <svg className="w-full h-full -rotate-90 transform drop-shadow-[0_0_15px_rgba(0,210,255,0.2)]" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  className="stroke-slate-800/80"
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
                <span className={`text-5xl font-black tracking-tight font-mono drop-shadow-lg ${
                  isPrime ? 'text-emerald-400' : isMod ? 'text-amber-400' : 'text-rose-400'
                }`}>
                  {msme.healthScore}
                </span>
                <span className="text-xs font-bold text-slate-400 mt-1">out of 900</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${
                isPrime ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                isMod ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {msme.riskBand.replace('_', ' ')}
              </span>
              {msme.isNtcThinFile && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                  Alternate Data Verified
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs bg-slate-900/40 px-3 py-2.5 rounded-xl">
            <span className="text-slate-300 font-medium">12M Default Risk (PD):</span>
            <strong className="text-white font-mono bg-slate-800 px-2 py-0.5 rounded border border-slate-700">{(msme.defaultProbability12m * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Score History Sparkline Trend Card with Dark Art Texture */}
      <div className="glass-card p-5 space-y-3 relative overflow-hidden rounded-3xl border border-slate-800/80 shadow-xl group">
        <div className="absolute inset-0 bg-[url('/images/bg-dark-art.jpg')] bg-cover bg-center opacity-15 pointer-events-none" />
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px] pointer-events-none" />
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-idbi-cyan" />
              <h3 className="text-sm font-bold text-white">6-Month Score Trajectory</h3>
            </div>
            <span className="text-xs text-emerald-400 font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">+110 pts since Jan</span>
          </div>

          <div className="pt-3 pb-1 flex items-end justify-between h-28 gap-2">
            {historyTrend.map((val, i) => {
              const heightPct = Math.round(((val - 300) / 600) * 100);
              const isCurrent = i === historyTrend.length - 1;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/col">
                  <span className={`text-[10px] font-mono font-bold transition-all duration-300 ${isCurrent ? 'text-idbi-cyan scale-110 font-extrabold' : 'text-slate-400 group-hover/col:text-slate-200'}`}>
                    {val}
                  </span>
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isCurrent
                        ? 'bg-gradient-to-t from-idbi-blue to-idbi-cyan shadow-lg shadow-idbi-cyan/30'
                        : 'bg-slate-800 group-hover/col:bg-slate-700'
                    }`}
                    style={{ height: `${Math.max(15, heightPct)}%` }}
                  />
                  <span className="text-[10px] text-slate-400 font-semibold">{months[i]}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* IDBI Loan Benefits Banner with Abstract Dots Texture */}
      <div className="p-4 rounded-2xl border border-emerald-500/40 relative overflow-hidden shadow-xl group transition-all duration-500 hover:border-emerald-500/60">
        <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-20 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/95 via-slate-950/90 to-idbi-navy/95 backdrop-blur-[2px]" />
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/20 rounded-xl text-emerald-400 shrink-0 border border-emerald-500/30 group-hover:scale-110 transition-transform">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">IDBI Bank Loan Benefits</h4>
              <p className="text-xs text-slate-200 mt-0.5">
                {isPrime ? 'You unlock a 0.75% interest rate rebate & instant OCEN working capital limit!' : 'Boost your score above 700 to unlock instant 0.75% rate discounts!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscores Summary Bar */}
      <div className="glass-card p-5 space-y-3 rounded-3xl relative overflow-hidden border border-slate-800 shadow-xl">
        <h3 className="text-sm font-bold text-white flex items-center justify-between">
          <span>5-Dimension Subscore Health</span>
          <span className="text-xs text-idbi-cyan font-semibold hover:underline cursor-pointer flex items-center gap-1" onClick={() => onNavigate('reasons')}>
            Details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 font-medium">Tax Compliance</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.taxComplianceScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 font-medium">Cash Flow Velocity</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.cashFlowVelocityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 font-medium">Payroll Stability</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.payrollStabilityScore}%</div>
          </div>
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
            <span className="text-slate-400 font-medium">Liquidity Buffer</span>
            <div className="text-base font-extrabold text-white mt-0.5 font-mono">{msme.subScores.liquidityBufferScore}%</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards with Unique Art Themes */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider px-1">Self-Service Actions</h3>
        
        <div
          onClick={() => onNavigate('reasons')}
          className="glass-card p-4 hover:border-idbi-cyan/50 cursor-pointer flex items-center justify-between transition-all group rounded-2xl relative overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-[url('/images/bg-dark-art.jpg')] bg-cover bg-center opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none" />
          <div className="absolute inset-0 bg-slate-950/90 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-idbi-cyan/10 rounded-xl text-idbi-cyan group-hover:bg-idbi-cyan/20 group-hover:scale-110 transition-all border border-idbi-cyan/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-idbi-cyan transition-colors">Why did I get this score?</h4>
              <p className="text-xs text-slate-300">View plain-language reason codes & actionable advice</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 w-5 h-5 text-slate-500 group-hover:text-idbi-cyan group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => onNavigate('consents')}
          className="glass-card p-4 hover:border-purple-500/50 cursor-pointer flex items-center justify-between transition-all group rounded-2xl relative overflow-hidden shadow-lg"
        >
          <div className="absolute inset-0 bg-[url('/images/bg-abstract-dots.jpg')] bg-cover bg-center opacity-15 mix-blend-luminosity group-hover:opacity-25 transition-opacity pointer-events-none" />
          <div className="absolute inset-0 bg-slate-950/90 pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-400 group-hover:bg-purple-500/20 group-hover:scale-110 transition-all border border-purple-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">Manage Account Aggregator Consents</h4>
              <p className="text-xs text-slate-300">Review active ReBIT AA v2.0 data sharing permissions</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => onNavigate('boost')}
          className="glass-card p-4 border-idbi-cyan/50 cursor-pointer flex items-center justify-between transition-all group rounded-2xl relative overflow-hidden shadow-2xl hover:border-idbi-cyan"
        >
          {/* Unique Trippy Fractal AI Background */}
          <div className="absolute inset-0 bg-[url('/images/bg-trippy-fractal.jpg')] bg-cover bg-center opacity-20 mix-blend-screen group-hover:scale-110 group-hover:opacity-30 transition-all duration-700 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-idbi-navy/85 to-slate-950/95 backdrop-blur-[2px] pointer-events-none" />
          <div className="relative z-10 flex items-center gap-3">
            <div className="p-2.5 bg-idbi-cyan/20 rounded-xl text-idbi-cyan group-hover:scale-110 transition-transform border border-idbi-cyan/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white group-hover:text-idbi-cyan transition-colors">Score Boost AI Simulator</h4>
              <p className="text-xs text-slate-200">Simulate how fixing GST or OD usage boosts your score</p>
            </div>
          </div>
          <ChevronRight className="relative z-10 w-5 h-5 text-idbi-cyan group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  );
};
