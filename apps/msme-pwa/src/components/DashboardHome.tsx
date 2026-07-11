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
      <div className="glass-card p-5 border-l-4 border-l-idbi-blue relative overflow-hidden shadow-sm">
        <div className="relative z-10">
          <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            Welcome back,
          </p>
          <h2 className="text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">{msme.businessName}</h2>
          <p className="text-xs text-slate-600 mt-1 flex items-center gap-2 font-medium">
            <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800">{msme.sector}</span>
            <span>•</span>
            <span>Udyam: <span className="font-mono text-idbi-navy font-bold">{msme.udyamNumber}</span></span>
          </p>
        </div>
      </div>

      {/* Enhanced NTC Thin-File Explanation Banner */}
      {msme.isNtcThinFile && (
        <div className="p-4 rounded-xl border border-purple-300 bg-purple-50 space-y-2 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-100 rounded-lg text-purple-800">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-300">
                NTC Thin-File Borrower
              </span>
              <h4 className="text-sm font-bold text-slate-900 mt-0.5">Scored via 100% Alternate Data</h4>
            </div>
          </div>
          <p className="text-xs text-slate-700 leading-relaxed mt-1">
            Traditional credit bureaus show zero history for your enterprise. Our AI scoring engine synthesized your <strong>ReBIT Account Aggregator statements</strong>, <strong>GSTR-3B filings</strong>, and <strong>UPI merchant velocity</strong> to establish creditworthiness and unlock instant OCEN working capital limits.
          </p>
        </div>
      )}

      {/* Main Score Card Gauge with Radial Ring */}
      <div className="glass-card p-6 text-center border-t-4 border-t-idbi-blue shadow-sm">
        <div className="relative z-10">
          <p className="text-xs font-bold text-slate-600 uppercase tracking-widest flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-idbi-navy" />
            Your Financial Health Score
          </p>
          
          <div className="my-6 relative flex flex-col items-center justify-center">
            {/* Animated SVG Ring */}
            <div className="relative w-48 h-48 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 180 180">
                {/* Background Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  className="stroke-slate-200"
                  strokeWidth="12"
                  fill="transparent"
                />
                {/* Progress Ring */}
                <circle
                  cx="90"
                  cy="90"
                  r={radius}
                  className={`transition-all duration-1000 ease-out ${
                    isPrime ? 'stroke-emerald-600' : isMod ? 'stroke-amber-600' : 'stroke-rose-600'
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
                  isPrime ? 'text-emerald-700' : isMod ? 'text-amber-700' : 'text-rose-700'
                }`}>
                  {msme.healthScore}
                </span>
                <span className="text-xs font-bold text-slate-600 mt-1">out of 900</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                isPrime ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                isMod ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                'bg-rose-100 text-rose-800 border border-rose-300'
              }`}>
                {msme.riskBand.replace('_', ' ')}
              </span>
              {msme.isNtcThinFile && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-300">
                  Alternate Data Verified
                </span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs bg-slate-50 px-3 py-2.5 rounded-xl">
            <span className="text-slate-700 font-medium">12M Default Risk (PD):</span>
            <strong className="text-slate-900 font-mono bg-white px-2 py-0.5 rounded border border-slate-300">{(msme.defaultProbability12m * 100).toFixed(1)}%</strong>
          </div>
        </div>
      </div>

      {/* Score History Sparkline Trend Card */}
      <div className="glass-card p-5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-idbi-navy" />
            <h3 className="text-sm font-bold text-slate-900">6-Month Score Trajectory</h3>
          </div>
          <span className="text-xs text-emerald-800 font-bold font-mono px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300">+110 pts since Jan</span>
        </div>

        <div className="pt-3 pb-1 flex items-end justify-between h-28 gap-2">
          {historyTrend.map((val, i) => {
            const heightPct = Math.round(((val - 300) / 600) * 100);
            const isCurrent = i === historyTrend.length - 1;
            return (
              <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group/col">
                <span className={`text-[10px] font-mono font-bold transition-all duration-300 ${isCurrent ? 'text-idbi-navy scale-105 font-extrabold' : 'text-slate-600'}`}>
                  {val}
                </span>
                <div
                  className={`w-full rounded-t-lg transition-all duration-300 ${
                    isCurrent
                      ? 'bg-idbi-navy shadow-sm'
                      : 'bg-slate-200 group-hover/col:bg-slate-300'
                  }`}
                  style={{ height: `${Math.max(15, heightPct)}%` }}
                />
                <span className="text-[10px] text-slate-600 font-semibold">{months[i]}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* IDBI Loan Benefits Banner */}
      <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 rounded-lg text-emerald-800 shrink-0 border border-emerald-300">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">IDBI Bank Loan Benefits</h4>
            <p className="text-xs text-slate-700 mt-0.5">
              {isPrime ? 'You unlock a 0.75% interest rate rebate & instant OCEN working capital limit!' : 'Boost your score above 700 to unlock instant 0.75% rate discounts!'}
            </p>
          </div>
        </div>
      </div>

      {/* Subscores Summary Bar */}
      <div className="glass-card p-5 space-y-3 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center justify-between">
          <span>5-Dimension Subscore Health</span>
          <span className="text-xs text-idbi-navy font-semibold hover:underline cursor-pointer flex items-center gap-1" onClick={() => onNavigate('reasons')}>
            Details <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </h3>
        
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-600 font-medium">Tax Compliance</span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">{msme.subScores.taxComplianceScore}%</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-600 font-medium">Cash Flow Velocity</span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">{msme.subScores.cashFlowVelocityScore}%</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-600 font-medium">Payroll Stability</span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">{msme.subScores.payrollStabilityScore}%</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <span className="text-slate-600 font-medium">Liquidity Buffer</span>
            <div className="text-base font-extrabold text-slate-900 mt-0.5 font-mono">{msme.subScores.liquidityBufferScore}%</div>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700 uppercase tracking-wider px-1">Self-Service Actions</h3>
        
        <div
          onClick={() => onNavigate('reasons')}
          className="glass-card p-4 hover:border-slate-300 cursor-pointer flex items-center justify-between transition-all group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-blue/10 rounded-lg text-idbi-navy border border-idbi-blue/20">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-idbi-navy transition-colors">Why did I get this score?</h4>
              <p className="text-xs text-slate-600">View plain-language reason codes & actionable advice</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-idbi-navy group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => onNavigate('consents')}
          className="glass-card p-4 hover:border-slate-300 cursor-pointer flex items-center justify-between transition-all group shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-100 rounded-lg text-purple-800 border border-purple-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-purple-800 transition-colors">Manage Account Aggregator Consents</h4>
              <p className="text-xs text-slate-600">Review active ReBIT AA v2.0 data sharing permissions</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-800 group-hover:translate-x-1 transition-all" />
        </div>

        <div
          onClick={() => onNavigate('boost')}
          className="glass-card p-4 border-idbi-blue/30 cursor-pointer flex items-center justify-between transition-all group shadow-sm hover:border-idbi-blue"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-idbi-blue/10 rounded-lg text-idbi-navy border border-idbi-blue/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 group-hover:text-idbi-navy transition-colors">Score Boost AI Simulator</h4>
              <p className="text-xs text-slate-600">Simulate how fixing GST or OD usage boosts your score</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-idbi-navy group-hover:translate-x-1 transition-transform" />
        </div>
      </div>

      {/* Team v22 Signoff */}
      <div className="p-3.5 bg-slate-100/80 rounded-xl border border-slate-200 text-center space-y-1">
        <p className="text-[11px] font-bold text-idbi-navy uppercase tracking-wider">
          Team v22 • IDBI Innovate 2026
        </p>
        <p className="text-xs font-medium text-slate-700 italic">
          "Every version is better than the last."
        </p>
      </div>
    </div>
  );
};
